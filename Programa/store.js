// Settings file + on-disk caches (pure Node, no Electron, so store.test.js can run it).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BLOCK = { op: 100, blur: 0, dim: 0 };
const DEFAULTS = {
  autoplay: true, dblclick: 'play', context: 'resume', devicePause: true,
  overlay: false, overlayPos: 'tm', shortcut: 'Alt+Shift+O', overlayAutoMin: true, overlayTop: true,
  quality: 'standard', outputDevice: '', // '' = system default output
  spotify: true, // full songs through Spotify Premium when connected, else YouTube
  updBlur: true, // Updating screen: blurred app behind it (false = plain dark)
  discord: true, // Discord Rich Presence while a song plays (needs discord.json)
  lang: 'lt', theme: 'dark', brand: 'default',
  wall: '', wallBlur: 0, wallDim: 30, applyOverlay: false,
  blocks: { sidebar: { ...BLOCK }, content: { ...BLOCK }, mini: { ...BLOCK } },
  cacheLimit: 1024, // MB, 0 = no limit
  profile: { name: '', avatar: '', color: '', status: 'online' }, // Customization > Profile; '' = the account's own
};
const CATS = ['covers', 'lyrics', 'catalog']; // audio = Chromium HTTP cache, measured by main.js

function load(file) {
  let saved = {};
  try { saved = JSON.parse(fs.readFileSync(file, 'utf8')); } catch {}
  if (!['tl', 'tm', 'tr'].includes(saved.overlayPos)) delete saved.overlayPos; // old bottom positions are gone
  return { ...structuredClone(DEFAULTS), ...saved, blocks: { ...structuredClone(DEFAULTS.blocks), ...saved.blocks }, profile: { ...DEFAULTS.profile, ...saved.profile } };
}

function save(file, s) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(s, null, 2));
}

const key = s => crypto.createHash('sha1').update(String(s)).digest('hex');

function files(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true }).filter(f => f.isFile()).map(f => {
      const p = path.join(dir, f.name);
      const st = fs.statSync(p);
      return { p, size: st.size, at: st.mtimeMs };
    });
  } catch {
    return [];
  }
}

const sizes = root => Object.fromEntries(CATS.map(c => [c, files(path.join(root, c)).reduce((n, f) => n + f.size, 0)]));

function clear(root, cats) {
  for (const c of cats) if (CATS.includes(c)) fs.rmSync(path.join(root, c), { recursive: true, force: true });
}

// delete oldest files until the cache dirs fit in limitBytes (0 = no limit); returns bytes left
function evict(root, limitBytes) {
  const all = CATS.flatMap(c => files(path.join(root, c))).sort((a, b) => a.at - b.at);
  let total = all.reduce((n, f) => n + f.size, 0);
  if (!limitBytes) return total;
  for (const f of all) {
    if (total <= limitBytes) break;
    fs.rmSync(f.p, { force: true });
    total -= f.size;
  }
  return total;
}

// "1.2.10" > "1.2.9"
function newer(a, b) {
  const pa = String(a).replace(/^v/, '').split('.').map(Number);
  const pb = String(b).replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0);
  return false;
}

// same song in several formats: keep the one the streaming quality prefers
const RANK = {
  low: ['opus', 'ogg', 'm4a', 'aac', 'mp3', 'flac', 'wav'],
  standard: ['mp3', 'opus', 'ogg', 'm4a', 'aac', 'flac', 'wav'],
  high: ['flac', 'wav', 'm4a', 'aac', 'mp3', 'opus', 'ogg'],
};
function pickFormats(names, quality) {
  const order = RANK[quality] ?? RANK.standard;
  const best = new Map();
  for (const n of names) {
    const { dir, name, ext } = path.parse(n);
    const k = path.join(dir, name).toLowerCase();
    const r = order.indexOf(ext.slice(1).toLowerCase());
    if (!best.has(k) || r < best.get(k).r) best.set(k, { n, r });
  }
  const keep = new Set([...best.values()].map(b => b.n));
  return names.filter(n => keep.has(n));
}

// ---- library.json: own playlists, liked songs, saved albums / artists / playlists (Liner's Library) ----
const LIB = { playlists: [], liked: [], saved: [], plays: [] }; // plays: listening history for Home
const TITLE_MAX = 20; // Liner's playlist name limit
function loadLib(file) {
  let s = {};
  try { s = JSON.parse(fs.readFileSync(file, 'utf8')); } catch {}
  return { ...structuredClone(LIB), ...s };
}
const str = (v, n) => String(v ?? '').slice(0, n);
const url = v => (/^https:\/\//.test(v) ? str(v, 1000) : '');
const okId = id => (typeof id === 'number' || typeof id === 'string') && String(id).length > 0 && String(id).length <= 64;
// a song as the search panel gives it; anything else the page sends is dropped
const song = t => ({ id: t.id, title: str(t.title, 200), sub: str(t.sub, 200), cover: url(t.cover), dur: Math.max(0, Math.floor(+t.dur || 0)), preview: url(t.preview) });
const songs = list => {
  const seen = new Set();
  return (Array.isArray(list) ? list : []).filter(t => okId(t?.id) && !seen.has(t.id) && seen.add(t.id)).slice(0, 2000).map(song);
};

// one change to the library; returns the result or { error }. Mutates lib (main saves it after).
function libDo(lib, op, a, b) {
  const now = new Date().toISOString();
  const pl = lib.playlists.find(p => p.id === a);
  switch (op) {
    case 'create': {
      const title = str(a?.title, 200).trim().slice(0, TITLE_MAX);
      if (!title) return { error: 'name' };
      const p = { id: crypto.randomUUID(), title, description: str(a.description, 300).trim(), tracks: songs(a.tracks), createdAt: now, updatedAt: now };
      lib.playlists.push(p);
      return p;
    }
    case 'update': {
      if (!pl) return { error: 'missing' };
      if (typeof b?.title === 'string' && b.title.trim()) pl.title = b.title.trim().slice(0, TITLE_MAX);
      if (typeof b?.description === 'string') pl.description = str(b.description, 300).trim();
      pl.updatedAt = now;
      return pl;
    }
    case 'delete':
      lib.playlists = lib.playlists.filter(p => p.id !== a);
      return true;
    case 'add': {
      if (!pl) return { error: 'missing' };
      if (!okId(b?.id)) return { error: 'track' };
      if (pl.tracks.some(t => t.id === b.id)) return { error: 'exists' };
      pl.tracks.push(song(b));
      pl.updatedAt = now;
      return pl;
    }
    case 'remove':
      if (!pl) return { error: 'missing' };
      pl.tracks = pl.tracks.filter(t => t.id !== b);
      pl.updatedAt = now;
      return pl;
    case 'like':
      if (!okId(a?.id)) return { error: 'track' };
      if (!lib.liked.some(t => t.id === a.id)) lib.liked.unshift(song(a));
      return true;
    case 'unlike':
      lib.liked = lib.liked.filter(t => t.id !== a);
      return true;
    case 'save': {
      if (!['album', 'artist', 'playlist'].includes(a?.type) || !okId(a.id)) return { error: 'item' };
      if (lib.saved.some(s => s.type === a.type && String(s.id) === String(a.id))) return { error: 'exists' };
      lib.saved.push({ type: a.type, id: a.id, title: str(a.title, 200), sub: str(a.sub, 200), cover: url(a.cover), savedAt: now });
      return true;
    }
    case 'unsave':
      lib.saved = lib.saved.filter(s => !(s.type === a && String(s.id) === String(b))); // ids come as numbers (search) or strings (page keys)
      return true;
    case 'played': { // one start of a song: Home's "Jump back in" (by last) and "Most listened" (by n)
      if (!okId(a?.id)) return { error: 'track' };
      const p = lib.plays.find(x => x.id === a.id);
      if (p) { p.n++; p.last = now; } else lib.plays.push({ ...song(a), n: 1, last: now });
      if (lib.plays.length > 500) lib.plays = lib.plays.sort((x, y) => y.n - x.n || (y.last > x.last ? 1 : -1)).slice(0, 400);
      return lib.plays;
    }
    default:
      return { error: 'op' };
  }
}

module.exports = { DEFAULTS, CATS, load, save, key, sizes, clear, evict, newer, pickFormats, loadLib, libDo, TITLE_MAX };
