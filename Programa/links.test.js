// node links.test.js: link parsing and YouTube title cleanup offline, then one live Spotify playlist + track
const assert = require('assert');
const { parse, ytSong, spotify } = require('./links');

assert.deepStrictEqual(parse('https://open.spotify.com/intl-lt/track/4cOdK2wGLETKBW3PvgPWqT?si=x'), { src: 'spotify', kind: 'track', id: '4cOdK2wGLETKBW3PvgPWqT' });
assert.strictEqual(parse('open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M').kind, 'playlist');
assert.deepStrictEqual(parse('https://youtu.be/dQw4w9WgXcQ?t=3'), { src: 'youtube', kind: 'track', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' });
assert.strictEqual(parse('https://music.youtube.com/watch?v=dQw4w9WgXcQ&list=RDAMVM').kind, 'track', 'a song inside a mix is that song');
assert.strictEqual(parse('https://www.youtube.com/playlist?list=PL123').kind, 'playlist');
assert.strictEqual(parse('https://youtube.com/shorts/dQw4w9WgXcQ').kind, 'track');
assert.strictEqual(parse('https://example.com/x'), null);

assert.deepStrictEqual(ytSong({ id: 'dQw4w9WgXcQ', title: 'Rick Astley - Never Gonna Give You Up (Official Music Video)', channel: 'Rick Astley', duration: 213 }), { artist: 'Rick Astley', title: 'Never Gonna Give You Up', dur: 213, vid: 'dQw4w9WgXcQ', cover: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg' });
assert.deepStrictEqual(ytSong({ title: 'Blinding Lights', channel: 'The Weeknd - Topic', duration: 200 }), { artist: 'The Weeknd', title: 'Blinding Lights', dur: 200, vid: '', cover: '' });
assert.deepStrictEqual(ytSong({ track: 'Levitating', artist: 'Dua Lipa, DaBaby', title: 'x', duration: 203 }), { title: 'Levitating', artist: 'Dua Lipa', dur: 203, vid: '', cover: '' });

(async () => {
  const p = await spotify('playlist', '37i9dQZF1DXcBWIGoYBM5M');
  assert.ok(p.title && p.items.length >= 20 && p.items[0].title && p.items[0].artist && /^\w{22}$/.test(p.items[0].sid), 'playlist has songs with artists and Spotify ids');
  const t = await spotify('track', '4cOdK2wGLETKBW3PvgPWqT');
  assert.ok(t.items[0].title && t.items[0].artist, 'track has title and artist');
  console.log(`links ok (${p.title}: ${p.items.length} songs, first ${p.items[0].artist} - ${p.items[0].title}; track ${t.items[0].artist} - ${t.items[0].title})`);
})().catch(e => { console.error(e); process.exit(1); });
