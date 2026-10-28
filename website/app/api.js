// Phone stand-in for Programa/preload.js: same window.api names login.js and ban.js use, and the same
// Supabase calls as Programa/cloud.js (accounts, streak, ban check), ported to the browser.
// Session: refresh token in localStorage.vs (phone storage is app-private; not as strong as the desktop DPAPI).
(() => {
  const SUPA = { url: 'https://ypppwuwlexgiikbaapbf.supabase.co', anonKey: 'sb_publishable_pmHycaFK5pz8gUCPD2pemA_TJD5pefH' };
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const HANDLE = /^[a-z0-9_]{3,30}$/;
  const platform = window.Capacitor?.getPlatform?.() ?? 'web';
  let access = null, me = null, ban = null, played = 0;
  const banHandlers = [];

  async function call(route, body, token) {
    try {
      const r = await fetch(SUPA.url + route, {
        method: 'POST',
        // new sb_publishable_ keys are not JWTs: send them only as apikey
        headers: { apikey: SUPA.anonKey, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
      });
      return { ok: r.ok, status: r.status, j: await r.json().catch(() => ({})) };
    } catch {
      return { ok: false, status: 0, j: {} };
    }
  }
  const text = j => `${j.msg ?? ''} ${j.message ?? ''} ${j.error_description ?? ''} ${j.error_code ?? ''}`;

  // keeps the signed-in profile and rotates the refresh token (tokens rotate: the old one dies)
  function remember(res) {
    if (res.session) localStorage.vs = res.session;
    me = { name: res.name, handle: res.handle, avatar: res.avatar ?? '', color: res.color ?? '' };
    localStorage.vme = JSON.stringify(me);
    access = res.access ?? access;
    return { ok: true, name: res.name, handle: res.handle };
  }

  // one refresh at a time: two parallel calls would both spend the same rotating refresh token
  let pending = null;
  const resume = () => pending ??= refresh().finally(() => { pending = null; });
  async function refresh() {
    if (!localStorage.vs) return false;
    const r = await call('/auth/v1/token?grant_type=refresh_token', { refresh_token: localStorage.vs });
    if (r.status === 0 && localStorage.vme) { me = JSON.parse(localStorage.vme); return true; } // offline: keep the signed-in profile
    if (!r.ok || !r.j.refresh_token) return false;
    const meta = r.j.user?.user_metadata ?? {};
    remember({ session: r.j.refresh_token, access: r.j.access_token, name: meta.display_name ?? '', handle: meta.handle ?? '', avatar: meta.avatar_url ?? '', color: meta.color ?? '' });
    return true;
  }

  // signed-in call; an expired access token (1 h) is refreshed once
  async function authed(route, body) {
    let r = await call(route, body, access);
    if (r.status === 401 && await resume()) r = await call(route, body, access);
    return r;
  }

  async function checkBan() {
    const r = await authed('/rest/v1/rpc/my_status', {});
    if (r.ok && r.j && typeof r.j === 'object') {
      if (r.j.ban && !ban) banHandlers.forEach(h => h(r.j.ban));
      ban = r.j.ban ?? null;
    }
    return ban;
  }

  // played seconds + this phone as a device, for the website dashboard (same RPCs as the desktop app)
  async function flush() {
    if (!localStorage.vs) return;
    await checkBan();
    if (ban) { played = 0; return; }
    const sec = played; played = 0;
    const day = new Date().toLocaleDateString('sv');
    let ok = (await authed('/rest/v1/rpc/touch_device', { device: `Vateko.fun app (${platform})` })).ok;
    if (ok && sec > 0) ok = (await authed('/rest/v1/rpc/add_listening', { sec: Math.round(sec), d: day })).ok;
    if (!ok) played += sec; // offline: keep the seconds for the next flush
  }

  // Deezer sends no CORS header: the app fetches through native HTTP (CapacitorHttp), the browser / iPhone web app uses JSONP
  const native = window.Capacitor?.isNativePlatform?.() ?? false;
  const dzCheck = j => { if (j.error) throw new Error(j.error.message); return j; };
  const dz = path => {
    const url = `https://api.deezer.com/${path}`;
    if (native) return fetch(url, { signal: AbortSignal.timeout(8000) }).then(r => r.json()).then(dzCheck);
    return new Promise((res, rej) => {
      const cb = `vdz${Math.random().toString(36).slice(2)}`, s = document.createElement('script');
      const t = setTimeout(() => { done(); rej(new Error('timeout')); }, 8000);
      const done = () => { delete window[cb]; s.remove(); clearTimeout(t); };
      window[cb] = j => { done(); try { res(dzCheck(j)); } catch (e) { rej(e); } };
      s.onerror = () => { done(); rej(new Error('network')); };
      s.src = `${url}${url.includes('?') ? '&' : '?'}output=jsonp&callback=${cb}`;
      document.head.append(s);
    });
  };
  if ('serviceWorker' in navigator && !native) navigator.serviceWorker.register('sw.js');
  const dzTrack = (t, cover = '') => ({ id: t.id, title: t.title, sub: t.artist?.name ?? '', cover: t.album?.cover_medium ?? cover, dur: t.duration, preview: t.preview, aid: t.artist?.id });

  window.api = {
    // ---- accounts (login.js, ban.js) ----
    async exists() { return false; }, // cloud has no cheap "email taken?" check; sign-up reports it instead
    async register({ email, password, handle, name }) {
      email = String(email ?? '').trim().toLowerCase();
      handle = String(handle ?? '').trim().replace(/^@/, '').toLowerCase();
      name = String(name ?? '').trim();
      password = String(password ?? '');
      if (!EMAIL.test(email)) return { error: 'email' };
      if (password.length < 8) return { error: 'password' };
      if (!HANDLE.test(handle)) return { error: 'handle' };
      if (!name || name.length > 40) return { error: 'name' };
      const free = await call('/rest/v1/rpc/handle_available', { h: handle });
      if (free.status === 0) return { error: 'network' };
      if (free.ok && free.j === false) return { error: 'handleTaken' };
      const r = await call('/auth/v1/signup', { email, password, data: { handle, display_name: name } });
      if (r.status === 0) return { error: 'network' };
      if (!r.ok) {
        const t = text(r.j);
        if (/already|exists/i.test(t)) return { error: 'exists' };
        if (/password/i.test(t)) return { error: 'password' };
        if (/database error/i.test(t)) return { error: 'handleTaken' };
        return { error: 'network' };
      }
      if (r.j.user && Array.isArray(r.j.user.identities) && r.j.user.identities.length === 0) return { error: 'exists' };
      if (!r.j.refresh_token) return { error: 'confirm' };
      return remember({ session: r.j.refresh_token, access: r.j.access_token, name, handle });
    },
    async login({ email, password }) {
      const r = await call('/auth/v1/token?grant_type=password', { email: String(email ?? '').trim().toLowerCase(), password: String(password ?? '') });
      if (r.status === 0 || r.status >= 500) return { error: 'network' };
      if (!r.ok) return { error: /not confirmed/i.test(text(r.j)) ? 'confirm' : 'credentials' };
      const meta = r.j.user?.user_metadata ?? {};
      return remember({ session: r.j.refresh_token, access: r.j.access_token, name: meta.display_name ?? '', handle: meta.handle ?? '', avatar: meta.avatar_url ?? '', color: meta.color ?? '' });
    },
    async verify({ email, token }) { // e-mail code from the "Confirm signup" template
      const r = await call('/auth/v1/verify', { type: 'signup', email: String(email ?? '').trim().toLowerCase(), token: String(token ?? '').trim() });
      if (r.status === 0 || r.status >= 500) return { error: 'network' };
      if (!r.ok || !r.j.refresh_token) return { error: 'code' };
      const meta = r.j.user?.user_metadata ?? {};
      return remember({ session: r.j.refresh_token, access: r.j.access_token, name: meta.display_name ?? '', handle: meta.handle ?? '', avatar: meta.avatar_url ?? '', color: meta.color ?? '' });
    },
    async resend(email) {
      const r = await call('/auth/v1/resend', { type: 'signup', email: String(email ?? '').trim().toLowerCase() });
      return r.ok ? { ok: true } : { error: r.status === 429 ? 'rate' : 'network' };
    },
    logout() {
      localStorage.removeItem('vs'); localStorage.removeItem('vme');
      me = null; access = null; ban = null;
      location.replace('login.html');
    },
    me: () => me,
    ban: () => checkBan(),
    onBan: cb => banHandlers.push(cb),
    // login.html's window buttons do nothing on a phone
    win() {}, onMaximized() {},

    // ---- session start (bar.html) ----
    resume,
    // ---- streak (phone.js counts played seconds, flush() sends them) ----
    listen(sec) { played += sec; },
    flush,

    // ---- Deezer catalog (CORS-free: CapacitorHttp in the app) ----
    async chart() {
      const t = await dz('chart/0/tracks?limit=20');
      return t.data.map(x => dzTrack(x));
    },
    async search(q, kind) {
      const s = encodeURIComponent(q);
      const pick = {
        tracks: () => dz(`search/track?q=${s}&limit=30`).then(j => j.data.map(t => dzTrack(t))),
        artists: () => dz(`search/artist?q=${s}&limit=20`).then(j => j.data.map(a => ({ type: 'artist', id: a.id, title: a.name, sub: `${(a.nb_fan ?? 0).toLocaleString('en')} fans`, cover: a.picture_medium ?? '' }))),
        albums: () => dz(`search/album?q=${s}&limit=20`).then(j => j.data.map(a => ({ type: 'album', id: a.id, title: a.title, sub: a.artist?.name ?? '', cover: a.cover_medium ?? '' }))),
        playlists: () => dz(`search/playlist?q=${s}&limit=20`).then(j => j.data.map(p => ({ type: 'playlist', id: p.id, title: p.title, sub: `${p.user?.name ?? ''} · ${p.nb_tracks ?? 0} tracks`, cover: p.picture_medium ?? '' }))),
      };
      return pick[kind]();
    },
    // one album / artist / playlist / track / artist radio with its songs
    async get(type, id) {
      if (type === 'track') { const t = await dz(`track/${id}`); return { title: t.title, tracks: [dzTrack(t)] }; }
      if (type === 'album') { const a = await dz(`album/${id}`); return { title: a.title, sub: a.artist?.name ?? '', cover: a.cover_medium, tracks: (a.tracks?.data ?? []).map(t => dzTrack(t, a.cover_medium)) }; }
      if (type === 'artist') {
        const [a, top] = await Promise.all([dz(`artist/${id}`), dz(`artist/${id}/top?limit=50`)]);
        return { title: a.name, sub: `${(a.nb_fan ?? 0).toLocaleString('en')} fans`, cover: a.picture_medium, tracks: top.data.map(t => dzTrack(t)) };
      }
      if (type === 'radio') { const r = await dz(`artist/${id}/radio?limit=25`); return { tracks: r.data.map(t => dzTrack(t)) }; }
      if (type === 'playlist') {
        const p = await dz(`playlist/${id}`), tracks = [];
        for (let i = 0; i < Math.min(p.nb_tracks ?? 0, 300); i += 100) {
          const page = await dz(`playlist/${id}/tracks?index=${i}&limit=100`);
          tracks.push(...page.data.map(t => dzTrack(t)));
          if (!page.next) break;
        }
        return { title: p.title, sub: p.creator?.name ?? '', cover: p.picture_medium, tracks };
      }
      throw new Error('type');
    },
  };

  // the signed-in account is checked and its listening sent every minute, and when the app goes to background
  setInterval(() => { if (localStorage.vs) flush(); }, 60000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
})();
