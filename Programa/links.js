// Spotify / YouTube links -> plain song names ({ title, artist, dur }), which main.js then finds on Deezer.
// No login: Spotify's public embed page carries the track list, YouTube goes through the bundled yt-dlp.

// open.spotify.com/(intl-xx/)track|album|playlist/<id>, youtube.com/watch?v=, youtu.be/<id>, music.youtube.com, playlist?list=
function parse(link) {
  let u;
  try { u = new URL(/^https?:\/\//i.test(link.trim()) ? link.trim() : `https://${link.trim()}`); } catch { return null; }
  const h = u.hostname.toLowerCase().replace(/^www\./, '');
  if (h === 'open.spotify.com') {
    const m = u.pathname.match(/\/(track|album|playlist)\/([A-Za-z0-9]{22})/);
    return m && { src: 'spotify', kind: m[1], id: m[2] };
  }
  if (h === 'spotify.link') return { src: 'spotify', short: u.href };
  if (['youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be'].includes(h)) {
    const v = h === 'youtu.be' ? u.pathname.slice(1, 12) : u.searchParams.get('v') ?? u.pathname.match(/\/(?:shorts|embed|live)\/([\w-]{11})/)?.[1];
    const list = u.searchParams.get('list');
    if (list && (!v || u.pathname.startsWith('/playlist'))) return { src: 'youtube', kind: 'playlist', url: `https://www.youtube.com/playlist?list=${encodeURIComponent(list)}` };
    return /^[\w-]{11}$/.test(v ?? '') ? { src: 'youtube', kind: 'track', url: `https://www.youtube.com/watch?v=${v}` } : null;
  }
  return null;
}

// "Artist - Song (Official Video) [4K]" -> { artist, title }; channel names lose " - Topic" / "VEVO"
function ytSong(e) {
  const strip = s => String(s ?? '').replace(/\s*[([](?:official|lyric|lyrics|audio|video|visualizer|hd|4k|mv|m\/v|explicit|clean|remaster)[^)\]]*[)\]]/gi, '').replace(/\s+/g, ' ').trim();
  const vid = /^[\w-]{11}$/.test(e.id ?? '') ? e.id : '', cover = vid ? `https://i.ytimg.com/vi/${vid}/mqdefault.jpg` : '';
  if (e.track) return { title: strip(e.track), artist: String(e.artist ?? e.creator ?? '').split(',')[0].trim(), dur: +e.duration || 0, vid, cover };
  const t = strip(e.title), dash = t.match(/^(.+?)\s+[-–—]\s+(.+)$/);
  const channel = String(e.channel ?? e.uploader ?? '').replace(/\s*-\s*Topic$/i, '').replace(/VEVO$/i, '').trim();
  return dash ? { artist: dash[1].trim(), title: dash[2].trim(), dur: +e.duration || 0, vid, cover } : { artist: channel, title: t, dur: +e.duration || 0, vid, cover };
}

// Spotify embed page -> { title, items }; the page's __NEXT_DATA__ JSON lists every song with its artists
async function spotify(kind, id, fetchFn = fetch) {
  const r = await fetchFn(`https://open.spotify.com/embed/${kind}/${id}`, { signal: AbortSignal.timeout(10000), headers: { 'user-agent': 'Mozilla/5.0' } });
  if (!r.ok) throw new Error(`spotify ${r.status}`);
  const html = await r.text();
  if (kind === 'playlist') {
    const all = await spotifyAll(id, html.match(/"accessToken":"([^"]+)"/)?.[1], fetchFn).catch(() => null);
    if (all?.items.length) return all;
  }
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  const e = m && JSON.parse(m[1])?.props?.pageProps?.state?.data?.entity;
  if (!e) throw new Error('spotify page');
  const artists = a => (a ?? []).map(x => x.name).filter(Boolean)[0] ?? '';
  if (kind === 'track') return { title: e.name ?? e.title, items: [{ title: e.name ?? e.title, artist: artists(e.artists) || e.subtitle || '', dur: Math.round((e.duration ?? 0) / 1000) }] };
  // shortcut: the embed lists at most 100 songs; main.js asks the Spotify Web API first when the user connected Spotify
  const items = (e.trackList ?? []).map(t => ({ title: t.title, artist: String(t.subtitle ?? '').split(',')[0].trim(), dur: Math.round((t.duration ?? 0) / 1000), sid: String(t.uri ?? '').split(':').pop() }));
  return { title: e.name ?? e.title, items };
}

// every song of a playlist, 100 per page, with the anonymous token the embed page carries (the embed itself stops at 100).
// shortcut: Spotify's web player query (fixed hash); if Spotify changes it this returns null and the embed's 100 are used
const PATHFINDER_HASH = 'bb67e0af06e8d6f52b531f97468ee4acd44cd0f82b988e15c2ea47b1148efc77';
async function spotifyAll(id, token, fetchFn = fetch) {
  if (!token) return null;
  const items = [];
  let title = '', total = Infinity;
  for (let offset = 0; offset < Math.min(total, 2000); offset += 100) {
    const vars = { uri: `spotify:playlist:${id}`, offset, limit: 100, enableWatchFeedEntrypoint: false };
    const u = `https://api-partner.spotify.com/pathfinder/v1/query?operationName=fetchPlaylist&variables=${encodeURIComponent(JSON.stringify(vars))}`
      + `&extensions=${encodeURIComponent(JSON.stringify({ persistedQuery: { version: 1, sha256Hash: PATHFINDER_HASH } }))}`;
    const r = await fetchFn(u, { signal: AbortSignal.timeout(10000), headers: { authorization: `Bearer ${token}`, accept: 'application/json', 'app-platform': 'WebPlayer' } });
    const p = r.ok ? (await r.json())?.data?.playlistV2 : null;
    if (!p?.content) return items.length ? { title, items } : null;
    title ||= p.name ?? '';
    total = p.content.totalCount ?? 0;
    for (const it of p.content.items ?? []) {
      const t = it.itemV2?.data;
      if (t?.__typename !== 'Track' || !t.name) continue;
      items.push({ title: t.name, artist: t.artists?.items?.[0]?.profile?.name ?? '', dur: Math.round((t.trackDuration?.totalMilliseconds ?? 0) / 1000),
        sid: String(t.uri ?? '').split(':').pop(), cover: t.albumOfTrack?.coverArt?.sources?.find(s => s.width === 300)?.url ?? '' });
    }
    if (!p.content.items?.length) break;
  }
  return { title, items };
}

module.exports = { parse, ytSong, spotify };
