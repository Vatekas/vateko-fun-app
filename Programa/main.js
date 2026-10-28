const { app, BrowserWindow, ipcMain, dialog, protocol, safeStorage, net, nativeImage, clipboard, nativeTheme, globalShortcut, shell, session, screen, components } = require('electron');
const netcheck = require('./netcheck');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const auth = require('./auth');
const cloud = require('./cloud');
const supa = cloud.config(); // Supabase when supabase.json exists, else local accounts.json
const store = require('./store');
const settingsFile = path.join(app.getPath('userData'), 'settings.json');
const cacheRoot = path.join(app.getPath('userData'), 'vcache');
let S = store.load(settingsFile);
let mainWin = null;
let lastDir = null; // library folder of the last scan, checked by the connection report

const AUDIO = /\.(mp3|m4a|aac|flac|ogg|opus|wav)$/i;
const mm = import('music-metadata');

protocol.registerSchemesAsPrivileged([{ scheme: 'cover', privileges: { standard: true, secure: true, corsEnabled: true, supportFetchAPI: true } }]);

async function tags(file) {
  try {
    const { common } = await (await mm).parseFile(file, { skipCovers: true, duration: false });
    return { title: common.title, artist: common.artist ?? '', album: common.album ?? '' };
  } catch {
    return {};
  }
}

async function scan(dir, recursive) {
  let files;
  try {
    files = fs.readdirSync(dir, { recursive, withFileTypes: true }).filter(f => f.isFile() && AUDIO.test(f.name));
  } catch {
    return [];
  }
  lastDir = dir;
  // Audio > streaming quality: one file per song when the same song exists in several formats
  const keep = new Set(store.pickFormats(files.map(f => path.join(f.parentPath, f.name)), S.quality));
  files = files.filter(f => keep.has(path.join(f.parentPath, f.name))).slice(0, 2000);
  // catalog cache: tags of unchanged files are not parsed again
  const catFile = path.join(cacheRoot, 'catalog', store.key(dir) + '.json');
  let cat = {};
  try { cat = JSON.parse(fs.readFileSync(catFile, 'utf8')); } catch {}
  const next = {};
  // shortcut: tags are read up front, a few seconds for thousands of files; make it lazy if libraries get bigger
  const tracks = [];
  for (let i = 0; i < files.length; i += 16) {
    tracks.push(...await Promise.all(files.slice(i, i + 16).map(async f => {
      const file = path.join(f.parentPath, f.name);
      let stamp = '';
      try { const st = fs.statSync(file); stamp = `${st.mtimeMs}:${st.size}`; } catch {}
      const t = cat[file]?.stamp === stamp ? cat[file].t : await tags(file);
      next[file] = { stamp, t };
      return {
        title: t.title || path.parse(f.name).name.replace(/\s*\[[^\]]*\]|\s*\(\d+k\)/gi, ''),
        artist: t.artist ?? '',
        album: t.album ?? '',
        dir: path.basename(f.parentPath),
        url: pathToFileURL(file).href,
        cover: `cover://art/${encodeURIComponent(file)}`,
      };
    })));
  }
  fs.mkdirSync(path.dirname(catFile), { recursive: true });
  fs.writeFileSync(catFile, JSON.stringify(next));
  enforceLimit();
  return tracks;
}

// no folder chosen yet: Music, else top level of Downloads
ipcMain.handle('library', async (_e, dir) => {
  if (dir) return { dir, tracks: await scan(dir, true) };
  const music = app.getPath('music');
  const tracks = await scan(music, true);
  if (tracks.length) return { dir: music, tracks };
  const dl = app.getPath('downloads');
  return { dir: dl, tracks: await scan(dl, false) };
});

ipcMain.handle('pick', async (e, kind) => {
  const r = await dialog.showOpenDialog(BrowserWindow.fromWebContents(e.sender), kind === 'image'
    ? { properties: ['openFile'], filters: [{ name: 'Paveikslėliai', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] }] }
    : { properties: ['openDirectory'] });
  if (r.canceled) return null;
  return kind === 'image' ? pathToFileURL(r.filePaths[0]).href : r.filePaths[0];
});

// own taskbar identity, so pinning shows Vateko.fun instead of Electron
const APP_ID = 'fun.vateko.app';
if (process.platform === 'win32') app.setAppUserModelId(APP_ID);

app.whenReady().then(async () => {
  syncDiscord();
  // the player runs its audio through WebAudio (pitch, reverb), which needs CORS; YouTube / Deezer audio has no such header
  session.defaultSession.webRequest.onHeadersReceived({ urls: ['https://*.googlevideo.com/*', 'https://*.dzcdn.net/*'] }, (d, cb) => {
    if (d.resourceType !== 'media') return cb({});
    const h = Object.fromEntries(Object.entries(d.responseHeaders ?? {}).filter(([k]) => k.toLowerCase() !== 'access-control-allow-origin'));
    cb({ responseHeaders: { ...h, 'Access-Control-Allow-Origin': ['*'] } });
  });
  // castlabs Electron: wait for the Widevine CDM the Spotify player needs (plain Electron has no `components`)
  if (components) await components.whenReady().catch(err => console.error('widevine', err));
  // cover://art/<path> serves the art embedded in an audio file, 404 when there is none
  protocol.handle('cover', async req => {
    const file = decodeURIComponent(new URL(req.url).pathname.slice(1));
    // cover cache: art extracted once is kept in vcache/covers (empty file = song has no art)
    const cached = path.join(cacheRoot, 'covers', store.key(file));
    let data;
    try { data = fs.readFileSync(cached); } catch {
      let pic;
      if (AUDIO.test(file)) {
        try { pic = (await (await mm).parseFile(file, { duration: false })).common.picture?.[0]; } catch {}
      }
      data = pic ? Buffer.from(pic.data) : Buffer.alloc(0);
      if (AUDIO.test(file)) { fs.mkdirSync(path.dirname(cached), { recursive: true }); fs.writeFileSync(cached, data); }
    }
    // shortcut: type sniffed from the first byte (PNG else JPEG); store the mime if WebP covers show up
    return data.length
      ? new Response(data, { headers: { 'content-type': data[0] === 0x89 ? 'image/png' : 'image/jpeg', 'access-control-allow-origin': '*', 'cache-control': 'max-age=3600' } })
      : new Response(null, { status: 404 });
  });

  nativeTheme.themeSource = S.theme;
  registerShortcut();
  const win = mainWin = new BrowserWindow({
    icon: path.join(__dirname, 'icon.ico'),
    width: 1200,
    height: 780,
    minWidth: 900,
    minHeight: 640,
    title: 'Vateko.Fun',
    frame: false,
    // transparent so the page can draw rounded corners (Win10 frameless windows are square)
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });
  // remembered sign-in skips the login screen (self-check always tests the login screen)
  if (process.platform === 'win32') win.setAppDetails({
    appId: APP_ID, appIconPath: path.join(__dirname, 'icon.ico'), appIconIndex: 0, relaunchDisplayName: 'Vateko.fun',
    // dev run: electron.exe + this folder; packaged: the exe alone
    relaunchCommand: app.isPackaged ? `"${process.execPath}"` : `"${process.execPath}" "${__dirname}"`,
  });
  win.loadFile(!process.argv.includes('--selfcheck') && await loadSession() ? 'bar.html' : 'login.html');
  const sendMax = () => win.webContents.send('maximized', win.isMaximized());
  win.on('maximize', sendMax);
  win.on('unmaximize', sendMax);
  win.webContents.on('did-finish-load', sendMax);
  // app in the background (minimized or another window focused) -> overlay; back in front -> hide it
  const toBack = () => { if (S.overlay && S.overlayAutoMin) showOverlay(true); };
  win.on('minimize', toBack);
  win.on('blur', toBack);
  win.on('restore', () => { if (overlayAuto) showOverlay(false); });
  win.on('focus', () => { if (overlayAuto) showOverlay(false); });
  win.on('closed', () => { mainWin = null; overlay?.destroy(); });
  syncOverlay();

  // npm run check: login card shown and dot clouds moving, saves .check/login.png
  if (process.argv.includes('--selfcheck')) {
    win.webContents.once('did-finish-load', async () => {
      const wait = ms => new Promise(r => setTimeout(r, ms));
      await wait(1500);
      const a = await win.webContents.capturePage();
      await wait(1500);
      const b = await win.webContents.capturePage();
      const card = await win.webContents.executeJavaScript("getComputedStyle(document.querySelector('.card')).display !== 'none'");
      const out = path.join(__dirname, '.check');
      fs.mkdirSync(out, { recursive: true });
      fs.writeFileSync(path.join(out, 'login.png'), b.toPNG());
      const moving = !a.toBitmap().equals(b.toBitmap());
      console.log(`login card: ${card}\nclouds moving: ${moving}\nresult: ${moving && card ? 'OK' : 'FAIL'}`);
      app.exit(moving && card ? 0 : 1);
    });
  }
});

const accounts = () => path.join(app.getPath('userData'), 'accounts.json');
// cloud has no cheap "email taken?" check; sign-up reports it instead
ipcMain.handle('auth:exists', (_e, email) => (supa ? false : auth.exists(accounts(), email)));
ipcMain.handle('auth:register', async (_e, data) => remember(supa ? await cloud.register(supa, data ?? {}) : local(auth.register(accounts(), data ?? {}), data)));
ipcMain.handle('auth:login', async (_e, data) => remember(supa ? await cloud.login(supa, data ?? {}) : local(auth.login(accounts(), data ?? {}), data)));
ipcMain.handle('auth:verify', async (_e, data) => remember(supa ? await cloud.verify(supa, data ?? {}) : { error: 'network' }));
ipcMain.handle('auth:resend', async (_e, email) => (supa ? cloud.resend(supa, email) : { error: 'network' }));
ipcMain.handle('auth:logout', e => {
  fs.rmSync(sessionFile(), { force: true });
  me = null; access = null; ban = null;
  BrowserWindow.fromWebContents(e.sender).loadFile('login.html');
});

// remembered session: Supabase refresh token or the local account's email,
// encrypted with the OS key (DPAPI on Windows), so other users/PCs cannot read it
const sessionFile = () => path.join(app.getPath('userData'), 'session.bin');
const local = (res, data) => (res.ok ? { ...res, session: String(data.email).trim().toLowerCase() } : res);
const save = value => { if (safeStorage.isEncryptionAvailable()) fs.writeFileSync(sessionFile(), safeStorage.encryptString(value)); };
let access = null; // Supabase access token, memory only (listening streak)
let ban = null; // { reason, by, at } when a founder blocked this account
ipcMain.handle('auth:ban', () => ban);
let me = null; // { name, handle } of the signed-in user, shown in Settings
ipcMain.handle('auth:me', () => me);
function remember({ session, ...res }) {
  if (res.ok && session) save(session);
  if (res.ok) { me = { name: res.name, handle: res.handle, avatar: res.avatar ?? '', color: res.color ?? '' }; access = res.access ?? null; syncAvatar(); setTimeout(flushListening, 3000); }
  delete res.access;
  return res; // the token never reaches the page
}
// the account's picture (set on the website or another PC) shows here unless this PC has its own local one
function syncAvatar() {
  // profile colour: the account's (set here or on the website) wins, so both always match
  // a colour picked here before the account had one goes up to the account
  if (me && !me.color && /^#[0-9a-f]{6}$/i.test(S.profile.color) && supa && access) { me.color = S.profile.color; cloud.setMeta(supa, access, { color: me.color }); }
  if (me?.color && S.profile.color !== me.color) {
    S = { ...S, profile: { ...S.profile, color: me.color } };
    store.save(settingsFile, S);
    for (const w of BrowserWindow.getAllWindows()) w.webContents.send('settings', S);
  }
  const local = S.profile.avatar;
  if (!me?.avatar || (local && !/^https:/.test(local)) || local === me.avatar) return;
  S = { ...S, profile: { ...S.profile, avatar: me.avatar } };
  store.save(settingsFile, S);
  for (const w of BrowserWindow.getAllWindows()) w.webContents.send('settings', S);
}
async function loadSession() {
  let value;
  try { value = safeStorage.decryptString(fs.readFileSync(sessionFile())); } catch { return false; }
  if (!supa) return Boolean(me = auth.profile(accounts(), value));
  const next = await cloud.resume(supa, value);
  if (next) { save(next.session); me = { name: next.name, handle: next.handle, avatar: next.avatar ?? '', color: next.color ?? '' }; access = next.access; syncAvatar(); setTimeout(flushListening, 3000); }
  return Boolean(next);
}

// connection dialog: real checks of our own services, copy/save the report
ipcMain.handle('net:checks', async () => {
  const results = await netcheck.run(() => net.isOnline(), supa, lastDir);
  return { results, report: netcheck.report(results) };
});
ipcMain.handle('net:copy', (_e, text) => clipboard.writeText(String(text)));
ipcMain.handle('net:save', async (e, text) => {
  const r = await dialog.showSaveDialog(BrowserWindow.fromWebContents(e.sender), { defaultPath: 'vateko-rysio-ataskaita.txt', filters: [{ name: 'Tekstas', extensions: ['txt'] }] });
  if (!r.canceled) fs.writeFileSync(r.filePath, String(text));
  return !r.canceled;
});

ipcMain.on('win', (e, action) => {
  const w = BrowserWindow.fromWebContents(e.sender);
  if (action === 'min') w.minimize();
  else if (action === 'max') w.isMaximized() ? w.unmaximize() : w.maximize();
  else if (action === 'close') w.close();
});

app.on('window-all-closed', () => app.quit());
app.on('will-quit', () => globalShortcut.unregisterAll());

// ---- settings: settings.json in userData; every window gets 'settings' after a change ----
ipcMain.handle('set:get', () => S);
ipcMain.handle('set:put', (_e, patch) => {
  const changed = Object.keys(patch ?? {}).filter(k => k in store.DEFAULTS && typeof patch[k] === typeof store.DEFAULTS[k]);
  if (!changed.length) return S;
  S = { ...S, ...Object.fromEntries(changed.map(k => [k, patch[k]])) };
  store.save(settingsFile, S);
  if (changed.includes('theme')) nativeTheme.themeSource = S.theme;
  if (changed.includes('shortcut')) registerShortcut();
  if (changed.includes('cacheLimit')) enforceLimit();
  if (changed.includes('discord')) syncDiscord();
  if (changed.some(k => k.startsWith('overlay'))) syncOverlay();
  for (const w of BrowserWindow.getAllWindows()) w.webContents.send('settings', S);
  return S;
});

ipcMain.handle('app:info', () => ({ name: 'Vateko.fun', version: app.getVersion(), discord: !!dcCfg }));
// only our own links leave the app
const LINKS = { tiktok: 'https://www.tiktok.com/@vatekas', site: 'https://vateko.fun' };
ipcMain.handle('open:link', (_e, name) => LINKS[name] && shell.openExternal(LINKS[name]));

// update source: { "version": "1.0.1", "url": "https://…", "updates": [...] } published next to the website (_web/vateko/version.json)
const UPDATE_URL = process.env.VATEKO_UPDATE_URL || 'https://vateko.fun/version.json'; // env: test against a local site
ipcMain.handle('app:update', async () => {
  try {
    const r = await fetch(UPDATE_URL, { signal: AbortSignal.timeout(8000), cache: 'no-store' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const { version, url, updates } = await r.json();
    if (!version) throw new Error('no version field');
    // updates: release notes [{ version, date, title, notes }], shown once in the app (whatsnew.js) and on the site
    return { current: app.getVersion(), latest: version, url, newer: store.newer(version, app.getVersion()), updates: (Array.isArray(updates) ? updates : []).map(u => ({ ...u, image: u.image ? new URL(u.image, UPDATE_URL).href : undefined })) };
  } catch (e) {
    return { error: `${UPDATE_URL} (${e.message})` };
  }
});
ipcMain.handle('app:download', (_e, url) => /^https:\/\//.test(url) && shell.openExternal(url));
// in-app update: download the new setup (our site or our GitHub releases) with progress, install it silently, reopen
ipcMain.handle('app:install', async (e, url) => {
  if (!/^https:\/\/(vateko\.fun\/|github\.com\/Vatekas\/vateko-fun\/releases\/)/.test(url)) return { error: 'bad update address' };
  const send = p => { if (!e.sender.isDestroyed()) e.sender.send('update:progress', p); };
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(600000), cache: 'no-store' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const total = +r.headers.get('content-length') || 0, parts = [];
    let got = 0;
    for await (const chunk of r.body) { parts.push(chunk); got += chunk.length; if (total) send(got / total); }
    if (total && got !== total) throw new Error('download cut off');
    const file = path.join(app.getPath('temp'), 'Vateko.fun-Setup-update.exe');
    fs.writeFileSync(file, Buffer.concat(parts));
    send(1);
    // a hidden helper waits until this app has fully closed (the installer quits silently if it is still running),
    // installs with no window (/S) and starts the updated app again
    const q = s => `'${s.replace(/'/g, "''")}'`;
    const ps = `Wait-Process -Id ${process.pid} -Timeout 30 -ErrorAction SilentlyContinue; Start-Sleep 2; `
      + `Get-Process -Name ${q(path.parse(process.execPath).name)} -ErrorAction SilentlyContinue | Stop-Process -Force; `
      + `Start-Process -FilePath ${q(file)} -ArgumentList '/S' -Wait; Start-Process -FilePath ${q(process.execPath)}`;
    // started through WMI: a plain child of Electron is killed together with the app when it quits
    const helper = `powershell.exe -NoProfile -WindowStyle Hidden -EncodedCommand ${Buffer.from(ps, 'utf16le').toString('base64')}`;
    require('child_process').spawn('powershell.exe', ['-NoProfile', '-Command', `([wmiclass]'Win32_Process').Create(${q(helper)}) | Out-Null`], { stdio: 'ignore', windowsHide: true });
    setTimeout(() => app.quit(), 1500);
    return { ok: true };
  } catch (err) { return { error: String(err.message ?? err) }; }
});

// wallpaper is copied into userData so it survives the original being moved
// ---- search: Deezer public catalog (tracks / artists / albums / playlists), same tabs as Liner ----
const DZ = 'https://api.deezer.com/search/';
async function dz(kind, q, limit, index = 0) {
  const r = await fetch(`${DZ}${kind}?q=${encodeURIComponent(q)}&limit=${limit}&index=${index}`, { signal: AbortSignal.timeout(8000) });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error?.message ?? r.status);
  return { data: j.data ?? [], total: j.total ?? 0 };
}
const dzTrack = (t, cover = '') => ({ type: 'track', id: t.id, title: t.title, sub: t.artist?.name ?? '', cover: t.album?.cover_medium ?? cover, dur: t.duration, preview: t.preview, explicit: !!t.explicit_lyrics, aid: t.artist?.id });
// typed queries repeat a lot (backspace, retyping): answers kept 10 min, newest 200
const searchCache = new Map();
ipcMain.handle('search', async (_e, q, kind = 'all', index = 0) => {
  q = String(q ?? '').trim().slice(0, 120);
  index = Math.max(0, parseInt(index, 10) || 0);
  if (!q) return { items: [] };
  const key = `${kind}|${index}|${q.toLowerCase()}`, hit = searchCache.get(key);
  if (hit && Date.now() - hit.at < 600e3) return hit.r;
  const r = await search(q, kind, index);
  if (!r.error) { searchCache.delete(key); searchCache.set(key, { r, at: Date.now() }); if (searchCache.size > 200) searchCache.delete(searchCache.keys().next().value); }
  return r;
});
async function search(q, kind, index = 0) {
  const track = t => dzTrack(t);
  const artist = a => ({ type: 'artist', id: a.id, title: a.name, sub: `${(a.nb_fan ?? 0).toLocaleString('en')} fans`, cover: a.picture_medium ?? '' });
  const album = a => ({ type: 'album', id: a.id, title: a.title, sub: a.artist?.name ?? '', cover: a.cover_medium ?? '' });
  const list = p => ({ type: 'playlist', id: p.id, title: p.title, sub: `${p.user?.name ?? ''} · ${p.nb_tracks ?? 0} tracks`, cover: p.picture_medium ?? '' });
  try {
    // one page of a single tab, starting at index; more = Deezer has another page after it
    const page = async (k, n, map) => { const { data, total } = await dz(k, q, n, index); return { items: data.map(map), more: index + n < total }; };
    if (kind === 'tracks') return await page('track', 30, track);
    if (kind === 'artists') return await page('artist', 20, artist);
    if (kind === 'albums') return await page('album', 20, album);
    if (kind === 'playlists') return await page('playlist', 20, list);
    // songs decide; a slow artist / album / playlist answer is left out after 1.2 s instead of holding the list
    const side = (k, n) => Promise.race([dz(k, q, n).then(r => r.data), new Promise(res => setTimeout(() => res([]), 1200))]).catch(() => []);
    const [t, a, al, p] = await Promise.all([dz('track', q, 6).then(r => r.data), side('artist', 3), side('album', 3), side('playlist', 3)]);
    return { items: [...t.slice(0, 4).map(track), ...a.map(artist), ...t.slice(4).map(track), ...al.map(album), ...p.map(list)] };
  } catch (err) {
    return { items: [], error: String(err.message ?? err) };
  }
}

// one album / artist / playlist / track with its songs (library pages, import, fresh preview links)
async function dzGet(p) {
  const r = await fetch(`https://api.deezer.com/${p}`, { signal: AbortSignal.timeout(8000) });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error?.message ?? r.status);
  return j;
}
ipcMain.handle('dz:get', async (_e, type, id) => {
  id = String(id ?? '');
  if (!/^\d{1,20}$/.test(id)) return { error: 'id' };
  try {
    if (type === 'track') { const t = await dzGet(`track/${id}`); return { title: t.title, tracks: [dzTrack(t)] }; }
    if (type === 'album') { const a = await dzGet(`album/${id}`); return { title: a.title, sub: a.artist?.name ?? '', cover: a.cover_medium, tracks: (a.tracks?.data ?? []).map(t => dzTrack(t, a.cover_medium)) }; }
    if (type === 'artist') {
      const [a, top] = await Promise.all([dzGet(`artist/${id}`), dzGet(`artist/${id}/top?limit=50`)]);
      return { title: a.name, sub: `${(a.nb_fan ?? 0).toLocaleString('en')} fans`, cover: a.picture_medium, tracks: top.data.map(t => dzTrack(t)) };
    }
    if (type === 'radio') { const r = await dzGet(`artist/${id}/radio?limit=25`); return { tracks: r.data.map(t => dzTrack(t)) }; } // id = artist id: Autoplay similar tracks
    if (type === 'playlist') {
      const p = await dzGet(`playlist/${id}`), tracks = [];
      for (let i = 0; i < Math.min(p.nb_tracks ?? 0, 2000); i += 100) { // library.json keeps at most 2000 per playlist
        const page = await dzGet(`playlist/${id}/tracks?index=${i}&limit=100`);
        tracks.push(...page.data.map(t => dzTrack(t)));
        if (!page.next) break;
      }
      return { title: p.title, sub: p.creator?.name ?? '', cover: p.picture_medium, tracks };
    }
    return { error: 'type' };
  } catch (err) {
    return { error: String(err.message ?? err) };
  }
});
// full song: Deezer only gives 30 s previews, so find the same song on YouTube and stream its audio
const ytdlp = path.join(__dirname.replace('app.asar', 'app.asar.unpacked'), 'bin', 'yt-dlp', 'yt-dlp.exe'); // installed build: exe can't run from inside asar // folder build: starts in ~0.4 s, the one-file exe unpacks itself for ~1.4 s every run
const ytRun = args => new Promise(res => require('child_process').execFile(ytdlp, args, { timeout: 20000, windowsHide: true }, (err, out) => res(err ? '' : out.trim())));
const ytCache = new Map(); // Deezer id + quality -> { url, at }; YouTube links last ~6 h
// Audio > Streaming Quality: low ~50-70 kbps opus, standard 128 kbps m4a, high best (~160 kbps opus)
const YT_FORMAT = { low: 'bestaudio[abr<=80]/worstaudio', standard: 'bestaudio[ext=m4a]/bestaudio', high: 'bestaudio/bestaudio[ext=m4a]' };
const ytBusy = new Map(); // key -> lookup in flight: a click joins the lookup its hover / queue prefetch started
ipcMain.handle('yt:full', (_e, t) => {
  const key = `${t?.id ?? ''}:${S.quality}`;
  if (!ytBusy.has(key)) ytBusy.set(key, ytFull(t, key).then(url => url || serverFull(t)).finally(() => ytBusy.delete(key)));
  return ytBusy.get(key);
});
// local yt-dlp failed (blocked, missing): the Vateko server finds the song on YouTube and returns an audio file URL
// shortcut: the key ships inside the app, so it only stops casual use of the server; move to per-user auth if abused
const SERVER = { url: process.env.VATEKO_SERVER_URL || '', key: process.env.VATEKO_SERVER_KEY || '' };
async function serverFull(t) {
  const q = `${String(t?.sub ?? '')} ${String(t?.title ?? '')}`.trim().slice(0, 200);
  if (q.length < 4) return null;
  try {
    const r = await fetch(`${SERVER.url}/resolve?q=${encodeURIComponent(q)}&dur=${+t?.dur || 0}&k=${SERVER.key}`, { signal: AbortSignal.timeout(90000) });
    const j = await r.json();
    return r.ok && /^https:\/\//.test(j.url) ? j.url : null;
  } catch { return null; }
}
// YouTube Music search, Songs filter -> [[videoId, seconds]]; ~0.5 s, no yt-dlp process
async function ytmSongs(q) {
  try {
    const r = await fetch('https://music.youtube.com/youtubei/v1/search?prettyPrint=false', {
      method: 'POST', signal: AbortSignal.timeout(5000),
      headers: { 'content-type': 'application/json', origin: 'https://music.youtube.com' },
      body: JSON.stringify({ context: { client: { clientName: 'WEB_REMIX', clientVersion: '1.20241023.01.00', hl: 'en' } }, query: q, params: 'EgWKAQIIAWoKEAkQBRAKEAMQBA%3D%3D' }),
    });
    const out = [];
    JSON.stringify(await r.json(), (k, v) => {
      if (k === 'musicResponsiveListItemRenderer' && v.playlistItemData?.videoId) {
        const m = (v.flexColumns ?? []).map(c => (c.musicResponsiveListItemFlexColumnRenderer?.text?.runs ?? []).map(x => x.text).join('')).join(' ').match(/(?:(\d+):)?(\d+):(\d\d)\b(?!.*\d:\d\d)/);
        if (m) out.push([v.playlistItemData.videoId, (+m[1] || 0) * 3600 + +m[2] * 60 + +m[3]]);
      }
      return v;
    });
    return out.slice(0, 5);
  } catch { return []; }
}
// Deezer id -> YouTube video id never changes: kept on disk, so a song played before skips the search too
const vidFile = path.join(cacheRoot, 'yt-ids.json');
let vids = null;
const vidOf = id => { if (!vids) { try { vids = JSON.parse(fs.readFileSync(vidFile, 'utf8')); } catch { vids = {}; } } return vids[id]; };
const vidPut = (id, vid) => { vids[id] = vid; fs.mkdirSync(cacheRoot, { recursive: true }); fs.writeFile(vidFile, JSON.stringify(vids), () => {}); };
async function ytFull(t, key) {
  const fmt = YT_FORMAT[S.quality] ?? YT_FORMAT.standard, hit = ytCache.get(key);
  if (hit && Date.now() - hit.at < 3 * 3600e3) return hit.url;
  const q = `${String(t?.sub ?? '').slice(0, 100)} ${String(t?.title ?? '').slice(0, 150)}`;
  if (!fs.existsSync(ytdlp) || q.length < 4) return null;
  // shortcut: the YouTube iOS player API would answer in 0.2 s, but its links stop after the first ~1 MB without a PO token; yt-dlp -g (~1.7 s) until that changes
  const ytLink = async vid => (await ytRun(['-g', '-f', fmt, `https://www.youtube.com/watch?v=${vid}`])).split('\n').pop();
  const known = vidOf(String(t?.id ?? ''));
  if (known) {
    const url = await ytLink(known);
    if (/^https:\/\//.test(url)) { ytCache.set(key, { url, at: Date.now() }); return url; }
  }
  // YouTube Music "Songs" first: the album audio, same timing as Deezer so synced lyrics line up (music videos have intros)
  let hits = await ytmSongs(q);
  const dur = +t?.dur || 0;
  let pick = hits.find(([, d]) => dur && Math.abs(d - dur) <= 5);
  if (!pick) { // first YouTube hit within 15 s of the Deezer length skips covers, live takes and 1 h loops
    hits = (await ytRun(['--flat-playlist', '--print', '%(id)s %(duration)s', `ytsearch5:${q}`])).split('\n').map(l => l.split(' '));
    pick = hits.find(([, d]) => dur && Math.abs(+d - dur) <= 15) ?? hits[0];
  }
  if (!/^[\w-]{11}$/.test(pick?.[0] ?? '')) return null;
  const url = await ytLink(pick[0]);
  if (!/^https:\/\//.test(url)) return null;
  if (t?.id) vidPut(String(t.id), pick[0]);
  ytCache.set(key, { url, at: Date.now() });
  return url;
}
// full song through Spotify Premium (Web Playback SDK in bar.html); YouTube stays the fallback
const spotify = require('./spotify');
const sp = spotify.client({ cfg: spotify.config(__dirname), file: path.join(app.getPath('userData'), 'spotify.bin'), matchFile: path.join(cacheRoot, 'sp-ids.json'), safeStorage, openExternal: url => shell.openExternal(url), dzGet });
ipcMain.handle('sp:status', () => sp.status());
ipcMain.handle('sp:login', () => sp.login());
ipcMain.handle('sp:logout', () => sp.logout());
ipcMain.handle('sp:token', () => sp.token());
ipcMain.handle('sp:match', (_e, t) => sp.match(t));
ipcMain.handle('sp:play', (_e, uri, device, ms) => sp.play(uri, device, ms));
// Home suggestions: Deezer charts (tracks, albums, playlists)
ipcMain.handle('dz:chart', async () => {
  try {
    const t = await dzGet('chart/0/tracks?limit=20');
    return { tracks: t.data.map(x => dzTrack(x)) };
  } catch (err) {
    return { error: String(err.message ?? err) };
  }
});
// Import tab: a deezer.com link (or its link.deezer.com short link) -> { type, id }
ipcMain.handle('dz:link', async (_e, link) => {
  let u;
  try { u = new URL(/^https?:\/\//.test(link) ? link : `https://${link}`); } catch { return { error: 'link' }; }
  if (['link.deezer.com', 'deezer.page.link'].includes(u.hostname)) {
    try { u = new URL((await fetch(u, { signal: AbortSignal.timeout(8000) })).url); } catch { return { error: 'network' }; }
  }
  const m = /(^|\.)deezer\.com$/.test(u.hostname) && u.pathname.match(/\/(playlist|album|artist|track)\/(\d+)/);
  return m ? { type: m[1], id: m[2] } : { error: 'link' };
});
// Import tab / Liked songs: a Spotify or YouTube link -> the same songs found in the Deezer catalog (which the player knows)
const links = require('./links');
// Deezer answers "Quota limit exceeded" past ~50 searches per 5 s: imports space them 120 ms apart and retry once
let dzTurn = Promise.resolve();
const dzPaced = (q) => {
  const go = dzTurn.then(() => new Promise(r => setTimeout(r, 120))).then(() => dz('track', q, 5));
  dzTurn = go.catch(() => {});
  return go.catch(() => new Promise(r => setTimeout(r, 5500)).then(() => dz('track', q, 5))).catch(() => ({ data: [] }));
};
async function dzMatch({ title, artist, dur }) {
  const t = String(title ?? '').slice(0, 150), a = String(artist ?? '').slice(0, 100);
  if (!t) return null;
  let hits = a ? (await dzPaced(`artist:"${a}" track:"${t}"`)).data : [];
  if (!hits.length) hits = (await dzPaced(`${a} ${t}`.trim())).data;
  const best = hits.find(h => dur && Math.abs(h.duration - dur) <= 10) ?? hits[0];
  return best ? dzTrack(best) : null;
}
ipcMain.handle('link:import', async (_e, link) => {
  let p = links.parse(String(link ?? ''));
  if (p?.short) { try { p = links.parse((await fetch(p.short, { signal: AbortSignal.timeout(8000) })).url); } catch { return { error: 'network' }; } }
  if (!p) return { error: 'link' };
  let found;
  try {
    if (p.src === 'spotify') {
      found = await links.spotify(p.kind, p.id);
      const all = p.kind !== 'track' && await sp.tracks(p.kind, p.id).catch(() => null); // connected Spotify: no 100-song cap
      if (all?.length > found.items.length) found.items = all;
    }
    else {
      const j = JSON.parse(await ytRun(['-J', '--flat-playlist', '--no-warnings', p.url]) || 'null');
      if (!j) return { error: 'network' };
      found = { title: j.title, items: (j._type === 'playlist' ? j.entries ?? [] : [j]).map(links.ytSong) };
    }
  } catch { return { error: 'network' }; }
  // Deezer allows ~50 searches per 5 s: 8 at a time, at most 2000 songs (a playlist's limit in library.json).
  // A song Deezer doesn't have stays in the list as a YouTube song: from YouTube its exact video, from Spotify a search.
  const items = found.items.filter(it => it.title).slice(0, 2000), tracks = [];
  let yt = 0;
  for (let i = 0; i < items.length; i += 8) {
    tracks.push(...await Promise.all(items.slice(i, i + 8).map(async it => {
      const hit = await dzMatch(it);
      if (hit) return hit;
      yt++;
      const id = it.vid ? `yt:${it.vid}` : `sp:${it.sid || `${it.artist}-${it.title}`.slice(0, 40)}`;
      if (it.vid) vidOf(id) || vidPut(id, it.vid);
      return { type: 'track', id, title: it.title, sub: it.artist, cover: it.cover ?? '', dur: it.dur };
    })));
  }
  const ok = tracks.filter((t, i, all) => all.findIndex(x => x.id === t.id) === i);
  return { title: found.title ?? '', single: p.kind === 'track', tracks: ok, missed: 0, viaYoutube: yt, total: found.items.length };
});

// ---- library.json: every window gets 'lib' after a change ----
const libFile = path.join(app.getPath('userData'), 'library.json');
const LIBD = store.loadLib(libFile);
ipcMain.handle('lib:get', () => LIBD);
ipcMain.handle('lib:do', (_e, op, a, b) => {
  const r = store.libDo(LIBD, op, a, b);
  if (r?.error) return r;
  store.save(libFile, LIBD);
  if (op === 'played') return r; // history only feeds Home in the calling window: no broadcast on every song
  for (const w of BrowserWindow.getAllWindows()) w.webContents.send('lib', LIBD);
  return r;
});

ipcMain.handle('wall:pick', async e => {
  const r = await dialog.showOpenDialog(BrowserWindow.fromWebContents(e.sender), { properties: ['openFile'], filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] }] });
  if (r.canceled) return null;
  return setWall(r.filePaths[0]);
});
ipcMain.handle('wall:set', (_e, src) => (src ? setWall(src) : { error: 'type' }));
// Customization > Profile picture: same rules as the wallpaper, 5 MB
ipcMain.handle('avatar:pick', async e => {
  const r = await dialog.showOpenDialog(BrowserWindow.fromWebContents(e.sender), { properties: ['openFile'], filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] }] });
  if (r.canceled) return null;
  const res = setWall(r.filePaths[0], 'avatar', 5);
  // also upload a 256 px JPEG to the account, so the website and Discord show the same picture
  if (res.url && supa && access) {
    const img = nativeImage.createFromPath(r.filePaths[0]);
    if (!img.isEmpty()) {
      const { width, height } = img.getSize(), side = Math.min(width, height);
      const sq = img.crop({ x: Math.floor((width - side) / 2), y: Math.floor((height - side) / 2), width: side, height: side }).resize({ width: 256, height: 256, quality: 'best' });
      const up = await cloud.setAvatar(supa, access, sq.toJPEG(85));
      if (up.url && me) me.avatar = up.url;
    }
  }
  return res;
});
ipcMain.handle('profile:color', async (_e, color) => {
  if (!/^(#[0-9a-f]{6})?$/i.test(color ?? '')) return;
  if (me) me.color = color;
  if (supa && access) await cloud.setMeta(supa, access, { color });
});
ipcMain.handle('avatar:clear', async () => {
  if (supa && access && (await cloud.setAvatar(supa, access, null)).url === '' && me) me.avatar = '';
});
function setWall(src, base = 'wallpaper', mb = 30) {
  if (!/\.(png|jpe?g|gif|webp)$/i.test(src)) return { error: 'type' };
  if (fs.statSync(src).size > mb * 1024 * 1024) return { error: 'size' };
  const ud = app.getPath('userData');
  for (const f of fs.readdirSync(ud)) if (f.startsWith(base + '.')) fs.rmSync(path.join(ud, f));
  const dst = path.join(ud, base + path.extname(src).toLowerCase());
  fs.copyFileSync(src, dst);
  return { url: `${pathToFileURL(dst).href}?v=${Date.now()}` };
}

// ---- cache & storage: vcache/{covers,lyrics,catalog} + Chromium HTTP cache as "audio" ----
ipcMain.handle('cache:info', async () => ({ ...store.sizes(cacheRoot), audio: await session.defaultSession.getCacheSize() }));
ipcMain.handle('cache:clear', async (_e, cats) => {
  store.clear(cacheRoot, cats ?? []);
  if (cats?.includes('audio')) await session.defaultSession.clearCache();
});
ipcMain.handle('cache:open', () => { fs.mkdirSync(cacheRoot, { recursive: true }); return shell.openPath(cacheRoot); });
const lyrFile = id => path.join(cacheRoot, 'lyrics', store.key(id) + '.json');
ipcMain.handle('lyr:get', (_e, id) => { try { return JSON.parse(fs.readFileSync(lyrFile(id), 'utf8')); } catch { return null; } });
ipcMain.handle('lyr:put', (_e, id, lines) => {
  fs.mkdirSync(path.dirname(lyrFile(id)), { recursive: true });
  fs.writeFileSync(lyrFile(id), JSON.stringify(lines));
  enforceLimit();
});
let evicting = null;
function enforceLimit() {
  if (evicting) return;
  evicting = setTimeout(async () => {
    evicting = null;
    const limit = S.cacheLimit * 1024 * 1024;
    const left = store.evict(cacheRoot, limit);
    if (limit && left + await session.defaultSession.getCacheSize() > limit) await session.defaultSession.clearCache();
  }, 500);
}

// ---- overlay: floating mini player, toggled by the global shortcut ----
let overlay = null;
let overlayAuto = false; // shown because the main window was minimized
let lastNow = null;
function syncOverlay() {
  if (!S.overlay) { overlay?.destroy(); overlay = null; return; }
  if (!overlay) {
    overlay = new BrowserWindow({ show: false, frame: false, transparent: true, resizable: false, skipTaskbar: true, backgroundColor: '#00000000', webPreferences: { preload: path.join(__dirname, 'preload.js') } });
    overlay.loadFile('overlay.html');
    overlay.webContents.on('did-finish-load', () => { overlay.webContents.send('settings', S); if (lastNow) overlay.webContents.send('now', lastNow); });
    overlay.on('closed', () => { overlay = null; });
  }
  overlay.setAlwaysOnTop(S.overlayTop, 'floating');
  const a = screen.getPrimaryDisplay().workArea;
  const [w, h] = [320, 56]; // Liner's overlay size
  overlay.setBounds({
    x: S.overlayPos.endsWith('l') ? a.x + 20 : S.overlayPos.endsWith('m') ? a.x + Math.round((a.width - w) / 2) : a.x + a.width - w - 20,
    y: a.y + 20,
    width: w, height: h,
  });
}
function showOverlay(on, auto = on) {
  if (!S.overlay) return;
  syncOverlay();
  overlayAuto = on && auto;
  // card pops in (scale .92 -> 1) like Liner's overlay
  if (on) { overlay.webContents.send('overlay:shown', false); overlay.showInactive(); setTimeout(() => overlay?.webContents.send('overlay:shown', true), 16); }
  else overlay.hide();
}
function registerShortcut() {
  globalShortcut.unregisterAll();
  try { globalShortcut.register(S.shortcut, () => showOverlay(!overlay?.isVisible(), false)); } catch {} // bad accelerator: page validates first
}
// true when the combination is valid and not taken by another app
ipcMain.handle('overlay:test', (_e, acc) => {
  if (acc === S.shortcut) return true;
  let ok = false;
  try { ok = globalShortcut.register(acc, () => {}); if (ok) globalShortcut.unregister(acc); } catch {}
  return ok;
});
ipcMain.on('overlay:show', (_e, on) => showOverlay(on, false));
// player -> overlay (now playing), overlay -> player (buttons)
// Discord: "Listening to Vateko.fun" while a song plays (Settings > Playback > Discord status)
const discord = require('./discord');
const dcCfg = discord.config(__dirname);
let dc = null;
function syncDiscord() {
  if (dcCfg && S.discord && !dc) { dc = discord.client(dcCfg.clientId); dc.update(lastNow); }
  if (!S.discord && dc) { dc.stop(); dc = null; }
}
ipcMain.on('now', (_e, now) => { lastNow = now; overlay?.webContents.send('now', now); dc?.update(now && { ...now, avatar: me?.avatar }); });

// listening streak: count seconds while a song plays, send them every 5 minutes (and on quit)
let played = 0;
setInterval(() => { if (lastNow?.playing) played += 15; }, 15000);
// streak.log in userData: why listening time did or did not reach the dashboard (one line per attempt that matters)
const streakLog = msg => { try { fs.appendFileSync(path.join(app.getPath('userData'), 'streak.log'), `${new Date().toISOString()} ${msg}
`); } catch {} };
async function flushListening(quitting) {
  if (!supa || !me || !access) { streakLog(`skip: ${!supa ? 'no supabase.json' : !me ? 'not signed in' : 'no access token'}`); return; }
  // blocked by a founder: the app shows why (ban.js) and stops counting
  const st = await cloud.status(supa, access);
  if (st) {
    if (st.ban && !ban) for (const w of BrowserWindow.getAllWindows()) w.webContents.send('ban', st.ban);
    ban = st.ban ?? null;
  }
  if (ban) { played = 0; return; }
  const sec = played; played = 0;
  const device = `Vateko.fun app (${require('os').hostname()})`;
  let ok = await cloud.track(supa, access, sec, device);
  // access token expired (1 h): refresh while the app runs, never on quit (a lost rotated token logs you out)
  if (ok === false && !quitting) {
    let token;
    try { token = safeStorage.decryptString(fs.readFileSync(sessionFile())); } catch { token = null; }
    const next = token && await cloud.resume(supa, token);
    if (next) { save(next.session); access = next.access; ok = await cloud.track(supa, access, sec, device); }
  }
  if (ok !== true) played += sec; // offline or expired: keep the seconds for next time
  if (ok !== true || sec) streakLog(`sent ${sec}s: ${ok === true ? 'ok' : ok === false ? 'token expired' : 'failed'}`);
}
setInterval(flushListening, 60000);
app.on('before-quit', () => { flushListening(true); });
ipcMain.on('ctl', (_e, act) => {
  if (act === 'open') { mainWin?.restore(); mainWin?.focus(); } else mainWin?.webContents.send('ctl', act);
});
