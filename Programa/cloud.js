// Supabase Auth over plain REST: accounts live in the cloud
// (Supabase dashboard: Authentication > Users, Table editor > profiles).
// Enabled when supabase.json ({ "url": ..., "anonKey": ... }) exists next to this file.
const fs = require('fs');
const path = require('path');

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HANDLE = /^[a-z0-9_]{3,30}$/;

function config(dir = __dirname) {
  try {
    const c = JSON.parse(fs.readFileSync(path.join(dir, 'supabase.json'), 'utf8'));
    return c.url && c.anonKey ? { url: c.url.replace(/\/+$/, ''), anonKey: c.anonKey } : null;
  } catch {
    return null;
  }
}

async function call(cfg, route, body, token) {
  try {
    const r = await fetch(cfg.url + route, {
      method: 'POST',
      // new sb_publishable_ keys are not JWTs: send them only as apikey; legacy anon JWTs also as Bearer
      headers: { apikey: cfg.anonKey, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : cfg.anonKey.startsWith('sb_') ? {} : { Authorization: `Bearer ${cfg.anonKey}` }) },
      body: JSON.stringify(body),
    });
    return { ok: r.ok, status: r.status, j: await r.json().catch(() => ({})) };
  } catch {
    return { ok: false, status: 0, j: {} };
  }
}

const text = j => `${j.msg ?? ''} ${j.message ?? ''} ${j.error_description ?? ''} ${j.error_code ?? ''}`;

async function register(cfg, { email, password, handle, name }) {
  email = String(email ?? '').trim().toLowerCase();
  handle = String(handle ?? '').trim().replace(/^@/, '').toLowerCase();
  name = String(name ?? '').trim();
  password = String(password ?? '');
  if (!EMAIL.test(email)) return { error: 'email' };
  if (password.length < 8) return { error: 'password' };
  if (!HANDLE.test(handle)) return { error: 'handle' };
  if (!name || name.length > 40) return { error: 'name' };

  const free = await call(cfg, '/rest/v1/rpc/handle_available', { h: handle });
  if (free.status === 0) return { error: 'network' };
  if (free.ok && free.j === false) return { error: 'handleTaken' };

  const r = await call(cfg, '/auth/v1/signup', { email, password, data: { handle, display_name: name } });
  if (r.status === 0) return { error: 'network' };
  if (!r.ok) {
    const t = text(r.j);
    if (/already|exists/i.test(t)) return { error: 'exists' };
    if (/password/i.test(t)) return { error: 'password' };
    if (/database error/i.test(t)) return { error: 'handleTaken' }; // unique handle lost a race in the trigger
    return { error: 'network' };
  }
  // with "Confirm email" on, an existing address comes back as a user without identities
  if (r.j.user && Array.isArray(r.j.user.identities) && r.j.user.identities.length === 0) return { error: 'exists' };
  if (!r.j.refresh_token) return { error: 'confirm' };
  return { ok: true, name, handle, session: r.j.refresh_token, access: r.j.access_token };
}

async function login(cfg, { email, password }) {
  const r = await call(cfg, '/auth/v1/token?grant_type=password', { email: String(email ?? '').trim().toLowerCase(), password: String(password ?? '') });
  if (r.status === 0 || r.status >= 500) return { error: 'network' };
  if (!r.ok) return { error: /not confirmed/i.test(text(r.j)) ? 'confirm' : 'credentials' };
  const meta = r.j.user?.user_metadata ?? {};
  return { ok: true, name: meta.display_name ?? '', handle: meta.handle ?? '', avatar: meta.avatar_url ?? '', color: meta.color ?? '', session: r.j.refresh_token, access: r.j.access_token };
}

// refresh tokens rotate: returns the new one + profile, or null when the session is gone
async function resume(cfg, refreshToken) {
  const r = await call(cfg, '/auth/v1/token?grant_type=refresh_token', { refresh_token: refreshToken });
  if (!r.ok || !r.j.refresh_token) return null;
  const meta = r.j.user?.user_metadata ?? {};
  return { session: r.j.refresh_token, access: r.j.access_token, name: meta.display_name ?? '', handle: meta.handle ?? '', avatar: meta.avatar_url ?? '', color: meta.color ?? '' };
}

// e-mail code (the {{ .Token }} in the "Confirm signup" template) -> signed-in session
async function verify(cfg, { email, token }) {
  const r = await call(cfg, '/auth/v1/verify', { type: 'signup', email: String(email ?? '').trim().toLowerCase(), token: String(token ?? '').trim() });
  if (r.status === 0 || r.status >= 500) return { error: 'network' };
  if (!r.ok || !r.j.refresh_token) return { error: 'code' };
  const meta = r.j.user?.user_metadata ?? {};
  return { ok: true, name: meta.display_name ?? '', handle: meta.handle ?? '', avatar: meta.avatar_url ?? '', color: meta.color ?? '', session: r.j.refresh_token, access: r.j.access_token };
}

async function resend(cfg, email) {
  const r = await call(cfg, '/auth/v1/resend', { type: 'signup', email: String(email ?? '').trim().toLowerCase() });
  if (r.ok) return { ok: true };
  return { error: r.status === 429 ? 'rate' : 'network' };
}

// played seconds + this PC as a device, for the website dashboard. Uses the short-lived access token,
// never the refresh token, so quitting mid-request can't lose a rotated session. Returns false on 401 (token expired).
async function track(cfg, access, seconds, device) {
  const day = new Date().toLocaleDateString('sv'); // YYYY-MM-DD in local time
  const r = await call(cfg, '/rest/v1/rpc/touch_device', { device }, access);
  if (r.status === 401) return false;
  if (!r.ok) return null;
  if (seconds > 0 && !(await call(cfg, '/rest/v1/rpc/add_listening', { sec: Math.round(seconds), d: day }, access)).ok) return null;
  return true;
}

// profile picture shared with the website: JPEG into storage avatars/<user id>/avatar.jpg, URL into user metadata.
// jpeg = Buffer, or null to remove. Returns { url } or { error }.
async function setAvatar(cfg, access, jpeg) {
  let uid;
  try { uid = JSON.parse(Buffer.from(access.split('.')[1], 'base64url').toString()).sub; } catch { return { error: 'session' }; }
  let url = '';
  if (jpeg) {
    try {
      const r = await fetch(`${cfg.url}/storage/v1/object/avatars/${uid}/avatar.jpg`, {
        method: 'POST',
        headers: { apikey: cfg.anonKey, Authorization: `Bearer ${access}`, 'Content-Type': 'image/jpeg', 'x-upsert': 'true' },
        body: jpeg,
      });
      if (!r.ok) return { error: r.status === 401 ? 'session' : 'upload' };
    } catch { return { error: 'network' }; }
    url = `${cfg.url}/storage/v1/object/public/avatars/${uid}/avatar.jpg?v=${Date.now()}`; // ?v= busts caches after a change
  }
  try {
    const r = await fetch(`${cfg.url}/auth/v1/user`, {
      method: 'PUT',
      headers: { apikey: cfg.anonKey, Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: { avatar_url: url } }),
    });
    if (!r.ok) return { error: r.status === 401 ? 'session' : 'upload' };
  } catch { return { error: 'network' }; }
  return { url };
}

// { founder, ban: { reason, by, at } | null } for the signed-in account; null when it can't be checked
async function status(cfg, access) {
  const r = await call(cfg, '/rest/v1/rpc/my_status', {}, access);
  return r.ok && r.j && typeof r.j === 'object' ? r.j : null;
}

// small profile fields shared with the website (user metadata), e.g. { color: '#22c55e' }
async function setMeta(cfg, access, data) {
  try {
    const r = await fetch(`${cfg.url}/auth/v1/user`, { method: 'PUT', headers: { apikey: cfg.anonKey, Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ data }) });
    return r.ok;
  } catch { return false; }
}

module.exports = { config, register, login, resume, verify, resend, track, setAvatar, status, setMeta };
