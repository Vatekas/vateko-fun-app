// Spotify Premium as a full-song source. PKCE login (no client secret), the refresh token kept with
// safeStorage, Deezer track -> Spotify track by ISRC, else by artist + title + length.
// spotify.json next to main.js: { "clientId": "<your app's Client ID>", "redirectUri": "http://127.0.0.1:8888/callback" }
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SCOPES = 'streaming user-read-email user-read-private user-modify-playback-state user-read-playback-state';
const b64url = buf => buf.toString('base64url');

function config(dir) {
  try {
    const c = JSON.parse(fs.readFileSync(path.join(dir, 'spotify.json'), 'utf8'));
    return /^[0-9a-z]{32}$/i.test(c.clientId) && /^http:\/\/127\.0\.0\.1:\d+\/\S*$/.test(c.redirectUri) ? c : null;
  } catch {
    return null;
  }
}

// first result within tol seconds of the Deezer length (any length when Deezer has none)
const pick = (items, dur, tol) => items.find(i => !dur || Math.abs(i.duration_ms / 1000 - dur) <= tol) ?? null;

function client({ cfg, file, matchFile, safeStorage, openExternal, dzGet }) {
  let access = null, exp = 0, me = null;
  const cache = new Map(); // Deezer id -> Spotify uri or null (null only after a search that answered)
  let saved = {}; // Deezer id -> uri on disk: a song matched once starts without the two lookups
  try { if (matchFile) saved = JSON.parse(fs.readFileSync(matchFile, 'utf8')); } catch {}

  const saveRefresh = t => { if (safeStorage.isEncryptionAvailable()) fs.writeFileSync(file, safeStorage.encryptString(t)); };
  const loadRefresh = () => { try { return safeStorage.decryptString(fs.readFileSync(file)); } catch { return null; } };

  async function grant(params) {
    const r = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: cfg.clientId, ...params }), signal: AbortSignal.timeout(10000),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(j.error_description || j.error || r.status), { code: j.error });
    access = j.access_token;
    exp = Date.now() + j.expires_in * 1000;
    if (j.refresh_token) saveRefresh(j.refresh_token); // Spotify rotates it on refresh
  }

  async function token() {
    if (!cfg) return null;
    if (access && Date.now() < exp - 60e3) return access;
    const refresh = loadRefresh();
    if (!refresh) return null;
    try {
      await grant({ grant_type: 'refresh_token', refresh_token: refresh });
    } catch (err) {
      if (err.code === 'invalid_grant') logout(); // revoked: sign in again; network errors keep the token
      return null;
    }
    return access;
  }

  async function api(p, opts = {}) {
    const tok = await token();
    if (!tok) return null;
    const r = await fetch(`https://api.spotify.com/v1/${p}`, { ...opts, headers: { authorization: `Bearer ${tok}`, 'content-type': 'application/json' }, signal: AbortSignal.timeout(8000) });
    if (r.status === 204) return {};
    return r.ok ? r.json() : null;
  }

  function login() {
    if (!cfg) return Promise.resolve({ error: 'config' });
    const verifier = b64url(crypto.randomBytes(48)), state = b64url(crypto.randomBytes(16));
    const challenge = b64url(crypto.createHash('sha256').update(verifier).digest());
    const u = new URL(cfg.redirectUri);
    return new Promise(res => {
      const done = (srv, timer, out) => { clearTimeout(timer); srv.close(); res(out); };
      const srv = http.createServer((req, rsp) => {
        const q = new URL(req.url, u.origin);
        if (q.pathname !== u.pathname) return rsp.writeHead(404).end();
        const code = q.searchParams.get('state') === state ? q.searchParams.get('code') : null;
        rsp.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(`<body style="font:16px system-ui;padding:40px">${code ? 'Spotify prijungtas. Gali uždaryti šį langą.' : 'Spotify prisijungimas nepavyko.'}</body>`);
        if (!code) return done(srv, timer, { error: q.searchParams.get('error') || 'state' });
        grant({ grant_type: 'authorization_code', code, redirect_uri: cfg.redirectUri, code_verifier: verifier })
          .then(() => { me = null; return status(); }, err => ({ error: String(err.message) }))
          .then(out => done(srv, timer, out));
      });
      const timer = setTimeout(() => done(srv, timer, { error: 'timeout' }), 180e3);
      srv.on('error', err => { clearTimeout(timer); res({ error: err.code === 'EADDRINUSE' ? `port ${u.port} busy` : String(err.message) }); });
      srv.listen(+u.port, '127.0.0.1', () => openExternal(`https://accounts.spotify.com/authorize?${new URLSearchParams({
        client_id: cfg.clientId, response_type: 'code', redirect_uri: cfg.redirectUri, code_challenge_method: 'S256', code_challenge: challenge, state, scope: SCOPES,
      })}`));
    });
  }

  function logout() {
    access = null; exp = 0; me = null; cache.clear();
    fs.rmSync(file, { force: true });
    return status();
  }

  async function status() {
    if (!cfg) return { configured: false };
    me ??= await api('me');
    if (!me) return { configured: true, connected: false };
    return { configured: true, connected: true, premium: me.product === 'premium', name: me.display_name || me.id };
  }

  async function match(t) {
    const id = String(t?.id ?? '');
    if (/^sp:\w{22}$/.test(id)) return `spotify:track:${id.slice(3)}`; // imported from a Spotify link, not on Deezer: that exact song
    if (!/^\d{1,20}$/.test(id)) return null;
    if (cache.has(id)) return cache.get(id);
    if (saved[id]) return saved[id];
    const dur = +t.dur || 0;
    let hit = null;
    const isrc = await dzGet(`track/${id}`).then(d => d.isrc, () => null);
    let answered = false;
    const find = async (q, limit, tol) => { const r = await api(`search?type=track&limit=${limit}&q=${encodeURIComponent(q)}`); if (r) answered = true; return pick(r?.tracks?.items ?? [], dur, tol); };
    if (isrc && /^[A-Z0-9]{12}$/i.test(isrc)) hit = await find(`isrc:${isrc}`, 5, 10);
    if (!hit) hit = await find(`track:${String(t.title ?? '').slice(0, 150)} artist:${String(t.sub ?? '').slice(0, 100)}`, 10, 3);
    const uri = hit?.uri ?? null;
    if (uri) { saved[id] = uri; if (matchFile) fs.writeFile(matchFile, JSON.stringify(saved), () => {}); }
    if (uri || answered) cache.set(id, uri); // network error: ask again next time instead of YouTube forever
    return uri;
  }

  async function play(uri, device, ms) {
    if (!/^spotify:track:\w{22}$/.test(String(uri)) || !/^\w{20,64}$/.test(String(device))) return false;
    return !!await api(`me/player/play?device_id=${device}`, { method: 'PUT', body: JSON.stringify({ uris: [uri], position_ms: Math.max(0, ms | 0) }) });
  }

  // all songs of a playlist / album, 100 per page; null when not connected or Spotify refuses (e.g. its own editorial lists)
  async function tracks(kind, id) {
    if (!/^[A-Za-z0-9]{22}$/.test(String(id)) || !['playlist', 'album'].includes(kind)) return null;
    const out = [];
    let next = kind === 'playlist' ? `playlists/${id}/tracks?limit=100&fields=next,items(track(id,name,duration_ms,artists(name),album(images)))` : `albums/${id}/tracks?limit=50`;
    while (next && out.length < 2000) {
      const page = await api(next.replace('https://api.spotify.com/v1/', ''));
      if (!page) return out.length ? out : null;
      for (const it of page.items ?? []) {
        const t = it.track ?? it;
        if (t?.name) out.push({ title: t.name, artist: t.artists?.[0]?.name ?? '', dur: Math.round((t.duration_ms ?? 0) / 1000), sid: t.id ?? '', cover: t.album?.images?.at(-2)?.url ?? '' });
      }
      next = page.next;
    }
    return out;
  }

  return { login, logout, status, token, match, play, tracks };
}

module.exports = { config, client, pick };
