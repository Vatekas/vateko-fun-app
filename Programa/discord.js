// Discord Rich Presence: "Listening to Vateko.fun" with the song, artist, cover and a time bar.
// Talks to the Discord desktop app over its local pipe (\\.\pipe\discord-ipc-N), no dependency.
// discord.json next to main.js: { "clientId": "<Application ID from discord.com/developers>" }
const net = require('net');
const fs = require('fs');
const path = require('path');

function config(dir) {
  try {
    const c = JSON.parse(fs.readFileSync(path.join(dir, 'discord.json'), 'utf8'));
    return /^\d{17,20}$/.test(c.clientId) ? c : null;
  } catch { return null; }
}

// frame = op (int32 LE) + length (int32 LE) + JSON
const encode = (op, data) => {
  const body = Buffer.from(JSON.stringify(data));
  const head = Buffer.alloc(8);
  head.writeInt32LE(op, 0);
  head.writeInt32LE(body.length, 4);
  return Buffer.concat([head, body]);
};

// now = what the player sends main ({ title, artist, cover, playing, pos, dur }); null activity clears the status
function activity(now) {
  if (!now?.title || !now.playing) return null;
  const clip = (s, n) => String(s ?? '').slice(0, n);
  const a = {
    type: 2, // Listening
    details: clip(now.title, 128).padEnd(2, ' '), // Discord wants 2..128 chars
    state: clip(now.artist, 128).padEnd(2, ' '),
    status_display_type: 2, // member list / profile says "Listening to <song>", not the app name
    assets: { large_text: clip(now.title, 128).padEnd(2, ' ') },
    buttons: [{ label: 'Vateko.fun', url: 'https://vateko.fun' }],
  };
  // only URLs Discord can load: a broken one shows as "?". Cover big, your profile picture small;
  // no cover (local file) -> the profile picture takes the big spot
  const web = u => (/^https:\/\//.test(u ?? '') ? u : '');
  const cover = web(now.cover), avatar = web(now.avatar);
  if (cover) a.assets.large_image = cover;
  if (avatar) Object.assign(a.assets, cover ? { small_image: avatar, small_text: 'Vateko.fun' } : { large_image: avatar });
  const dur = +now.dur || 0, pos = +now.pos || 0;
  if (dur > 0) {
    const start = Date.now() - pos * 1000;
    a.timestamps = { start: Math.round(start), end: Math.round(start + dur * 1000) };
  }
  return a;
}

function client(clientId) {
  let sock = null, ready = false, want = null, sent = '', retry = null, nonce = 0, stopped = false;
  const send = () => {
    if (!ready) return;
    const key = JSON.stringify(want);
    if (key === sent) return;
    sent = key;
    sock.write(encode(1, { cmd: 'SET_ACTIVITY', args: { pid: process.pid, activity: want }, nonce: String(++nonce) }));
  };
  const drop = () => {
    ready = false; sent = '';
    sock?.destroy(); sock = null;
    clearTimeout(retry);
    if (!stopped) retry = setTimeout(connect, 15000); // Discord closed or not started yet: try again later
  };
  function connect(n = 0) {
    if (n > 9) return drop();
    const s = net.createConnection(`\\\\?\\pipe\\discord-ipc-${n}`);
    s.once('error', () => { s.destroy(); if (sock === null) connect(n + 1); });
    s.once('connect', () => {
      sock = s;
      s.on('error', drop);
      s.on('close', drop);
      let buf = Buffer.alloc(0);
      s.on('data', d => {
        buf = Buffer.concat([buf, d]);
        while (buf.length >= 8 && buf.length >= 8 + buf.readInt32LE(4)) {
          const len = buf.readInt32LE(4), msg = JSON.parse(buf.subarray(8, 8 + len));
          buf = buf.subarray(8 + len);
          if (msg.evt === 'READY') { ready = true; send(); }
        }
      });
      s.write(encode(0, { v: 1, client_id: clientId }));
    });
  }
  connect();
  let last = null;
  return {
    // called with every player update (~2 a second): only a new song, play / pause or a jump goes out (Discord allows 5 per 20 s)
    update(now) {
      const a = activity(now);
      const jump = a && last?.timestamps && a.timestamps && Math.abs(a.timestamps.start - last.timestamps.start) > 3000;
      if (a && last && !jump && a.details === last.details && a.state === last.state) return;
      last = a;
      want = a;
      send();
    },
    stop() { stopped = true; clearTimeout(retry); want = null; send(); sock?.end(); },
  };
}

module.exports = { config, encode, activity, client };
