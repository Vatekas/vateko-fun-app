// Phone UI with the desktop pages: Home (Daily Mixes, charts, recent), Search, Library, Settings.
// Playback: Deezer 30 s previews (no yt-dlp on a phone). Accounts and streak: api.js.
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const L = (lt, en) => (localStorage.lang === 'en' ? en : lt);
const P = {
  home: 'M10.671 2.843a2 2 0 0 1 2.658 0l3.934 3.497.25-1.504a1 1 0 1 1 1.973.328L19.03 7.91l2.635 2.343a1 1 0 0 1-1.328 1.494l-.464-.412-.787 7.864A2 2 0 0 1 17.095 21H6.905a2 2 0 0 1-1.99-1.801l-.786-7.864-.465.412a1 1 0 0 1-1.328-1.494z',
  search: 'M2 10.5a8.5 8.5 0 1 1 15.176 5.262l3.652 3.652a1 1 0 0 1-1.414 1.414l-3.652-3.652A8.5 8.5 0 0 1 2 10.5M10.5 6a1 1 0 0 0 0 2 2.5 2.5 0 0 1 2.5 2.5 1 1 0 1 0 2 0A4.5 4.5 0 0 0 10.5 6',
  library: 'M10 2a3 3 0 0 0-3 3 3 3 0 0 0-3 3v13.018c0 1.226 1.39 1.934 2.382 1.213l4.118-2.995 4.118 2.995c.991.721 2.382.013 2.382-1.213v-2.236l.618.45c.991.72 2.382.012 2.382-1.214V5a3 3 0 0 0-3-3zm7 14.309 1 .727V5a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1h5a3 3 0 0 1 3 3z',
  gear: 'M10.586 2.1a2 2 0 0 1 2.7-.116l.128.117L15.314 4H18a2 2 0 0 1 1.994 1.85L20 6v2.686l1.9 1.9a2 2 0 0 1 .116 2.701l-.117.127-1.9 1.9V18a2 2 0 0 1-1.85 1.995L18 20h-2.685l-1.9 1.9a2 2 0 0 1-2.701.116l-.127-.116-1.9-1.9H6a2 2 0 0 1-1.995-1.85L4 18v-2.686l-1.9-1.9a2 2 0 0 1-.116-2.701l.116-.127 1.9-1.9V6a2 2 0 0 1 1.85-1.994L6 4h2.686zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
  play: 'M8 5v14l11-7z', pause: 'M6 5h4v14H6zm8 0h4v14h-4z',
  prev: 'M6 6h2v12H6zm3.5 6L18 18V6z', next: 'M16 6h2v12h-2zM6 18l8.5-6L6 6z',
  heart: 'M12 21s-7.5-4.6-9.6-9.2C.9 8.6 2.4 5 6 5c2.1 0 3.4 1.2 4 2.3C10.6 6.2 11.9 5 14 5c3.6 0 5.1 3.6 3.6 6.8C19.5 16.4 12 21 12 21z',
  x: 'M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4z',
  back: 'M15.4 5.6 14 4.2 6.2 12l7.8 7.8 1.4-1.4L9 12z',
  dots: 'M5 10.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m7 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m7 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3',
  plus: 'M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z',
};
const ic = (d, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="${d}"/></svg>`;
const cover = (src, size = '') => `<span class="cv ${size}">${src ? `<img src="${esc(src)}" alt="" loading="lazy">` : ''}</span>`;
const mmss = s => { s = Math.max(0, Math.floor(s || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const shuffle = a => { for (let k = a.length - 1; k > 0; k--) { const j = Math.random() * (k + 1) | 0; [a[k], a[j]] = [a[j], a[k]]; } return a; };
const empty = msg => `<p class="empty">${msg}</p>`;
const sec = (title, body) => `<section class="sec"><h2>${esc(title)}</h2>${body}</section>`;

// ---- library: liked, playlists, play history (one blob in localStorage) ----
const lib = JSON.parse(localStorage.vlib || '{}');
lib.liked ??= []; lib.playlists ??= []; lib.plays ??= [];
const saveLib = () => { localStorage.vlib = JSON.stringify(lib); };
const slim = t => ({ id: t.id, title: t.title, sub: t.sub, cover: t.cover, dur: t.dur, preview: t.preview, aid: t.aid });
const liked = t => lib.liked.some(x => x.id === t.id);
function toggleLike(t) { lib.liked = liked(t) ? lib.liked.filter(x => x.id !== t.id) : [slim(t), ...lib.liked]; saveLib(); ui(); }
function remember(t) {
  const hit = lib.plays.find(x => x.id === t.id);
  if (hit) Object.assign(hit, { n: hit.n + 1, last: Date.now() });
  else lib.plays.push({ ...slim(t), n: 1, last: Date.now() });
  lib.plays = lib.plays.slice(-300); saveLib();
}

// list rows and cards carry a key into this registry, not the data itself
const reg = new Map(); let rid = 0;
const keep = list => { const k = String(++rid); reg.set(k, list); if (reg.size > 300) reg.delete(reg.keys().next().value); return k; };
const rows = (list, k = keep(list)) => list.map((t, i) => `<li class="row" data-act="play" data-k="${k}" data-i="${i}">${cover(t.cover, 'sm')}<span class="tx"><b>${esc(t.title)}</b><small>${esc(t.sub)}</small></span><button class="ib" data-act="more" data-k="${k}" data-i="${i}" aria-label="More">${ic(P.dots)}</button></li>`).join('');
const cards = (list, act = 'play') => { const k = keep(list); return `<div class="hrow">${list.map((t, i) => `<button class="card" data-act="${act}" data-k="${k}" data-i="${i}">${cover(t.cover, 'lg')}<b>${esc(t.title)}</b><small>${esc(t.sub)}</small></button>`).join('')}</div>`; };
const page = d => { const k = keep(d.tracks); return `<header class="dh"><button class="ib" data-act="back" aria-label="Back">${ic(P.back)}</button></header>
  <div class="dhead">${cover(d.cover, 'xl')}<div class="tx"><b>${esc(d.title)}</b><small>${esc(d.sub)}</small></div></div>
  <div class="btns"><button class="pill" data-act="playall" data-k="${k}" data-i="0">${ic(P.play)} ${L('Groti', 'Play')}</button><button class="pill ghost" data-act="shuffle" data-k="${k}">${L('Maišyti', 'Shuffle')}</button></div>
  <ul class="list">${rows(d.tracks, k)}</ul>`; };

// Daily Mixes: the 6 artists played most (before any plays: chart artists); a mix = that artist's Deezer radio
function mixSeeds(chart) {
  const by = new Map();
  for (const t of lib.plays) if (t.aid) { const m = by.get(t.aid) ?? { aid: t.aid, names: [], cover: t.cover, n: 0 }; m.n += t.n ?? 1; m.names.push(t.sub); by.set(t.aid, m); }
  let top = [...by.values()].sort((a, b) => b.n - a.n).slice(0, 6);
  if (!top.length) top = [...new Map(chart.filter(t => t.aid).map(t => [t.aid, { aid: t.aid, names: [t.sub], cover: t.cover }])).values()].slice(0, 6);
  return top.map((m, i) => ({ title: `Daily Mix ${i + 1}`, sub: [...new Set(m.names)].slice(0, 3).join(', ') + L(' ir kiti', ' and more'), cover: m.cover, aid: m.aid }));
}

// ---- playback: one <audio>, queue of tracks with Deezer preview links ----
const aud = $('#aud');
let queue = [], qi = 0, cur = null, retried = null;
function playList(list, i = 0) { if (!list?.length) return; queue = list; qi = i; load(); }
function load() {
  cur = queue[qi]; retried = null;
  if (!cur) return;
  remember(cur);
  if (!cur.preview) return refresh().then(ok => (ok ? start() : next()));
  start();
}
function start() { aud.src = cur.preview; aud.play().catch(() => {}); ui(); }
async function refresh() { // preview links expire: ask Deezer for a fresh one
  const r = await api.get('track', cur.id).catch(() => null);
  cur.preview = r?.tracks?.[0]?.preview ?? '';
  return !!cur.preview;
}
function next() {
  if (qi + 1 >= queue.length) { aud.pause(); return ui(); }
  qi++; load();
}
function prev() { if (aud.currentTime > 3 || qi === 0) aud.currentTime = 0; else { qi--; load(); } }
aud.addEventListener('play', ui);
aud.addEventListener('pause', ui);
aud.addEventListener('ended', next);
aud.addEventListener('error', async () => {
  if (!cur) return;
  if (retried === cur.id) return next(); // a fresh link failed too: skip
  retried = cur.id;
  if (await refresh()) start(); else next();
});
aud.addEventListener('timeupdate', () => {
  $('#f-seek').value = aud.currentTime;
  $('#f-cur').textContent = mmss(aud.currentTime);
  $('#f-dur').textContent = mmss(Math.min(30, aud.duration || 30));
});
setInterval(() => { if (!aud.paused) api.listen(1); }, 1000); // streak: played seconds, sent by api.js

function ui() {
  $('#mini').hidden = !cur || !$('#full').hidden;
  if (!cur) return;
  $('#m-cv').innerHTML = cover(cur.cover, 'sm');
  $('#m-t').textContent = cur.title; $('#m-s').textContent = cur.sub;
  $('#m-p').innerHTML = ic(aud.paused ? P.play : P.pause);
  $('#f-cv').innerHTML = cover(cur.cover, 'xl');
  $('#f-t').textContent = cur.title; $('#f-s').textContent = cur.sub;
  $('#f-play').innerHTML = ic(aud.paused ? P.play : P.pause);
  $('#f-like').innerHTML = ic(P.heart, liked(cur) ? 'on' : '');
  $('#f-like').setAttribute('aria-pressed', liked(cur));
  $('#f-note').textContent = L('30 s peržiūra', '30 s preview');
}
const full = open => { $('#full').hidden = !open; ui(); };

// ---- sheet: the ⋮ menu of a track ----
let sheetTrack = null;
function sheetFor(t) {
  sheetTrack = t;
  $('#sheet').innerHTML = `<div class="sheet-bg" data-act="sheet-close"></div><div class="sheet-card">
    <div class="sheet-h">${cover(t.cover, 'sm')}<span class="tx"><b>${esc(t.title)}</b><small>${esc(t.sub)}</small></span></div>
    <button class="sheet-b" data-act="sheet-play">${ic(P.play)} ${L('Groti dabar', 'Play now')}</button>
    <button class="sheet-b" data-act="sheet-like">${ic(P.heart, liked(t) ? 'on' : '')} ${liked(t) ? L('Pašalinti iš patinkančių', 'Remove from liked') : L('Patinka', 'Like')}</button>
    <p class="sheet-h2">${L('Į grojaraštį', 'Add to playlist')}</p>
    ${lib.playlists.map((p, i) => `<button class="sheet-b" data-act="sheet-add" data-i="${i}">${esc(p.name)}</button>`).join('')}
    <button class="sheet-b" data-act="sheet-new">${ic(P.plus)} ${L('Naujas grojaraštis', 'New playlist')}</button>
  </div>`;
  $('#sheet').hidden = false;
}
const closeSheet = () => { $('#sheet').hidden = true; };

// ---- pages: each returns HTML; draw() puts it in #view ----
async function homePage() {
  const chart = await api.chart().catch(() => null);
  if (!chart) return `<header class="hd"><h1>Vateko.fun</h1></header>${empty(L('Nepavyko susisiekti su serveriu. Patikrink internetą.', 'Could not reach the server. Check your connection.'))}`;
  const heard = new Set(lib.plays.map(t => t.id));
  const fresh = chart.filter(t => !heard.has(t.id)).slice(0, 10);
  const recent = [...lib.plays].sort((a, b) => b.last - a.last).slice(0, 10);
  const seeds = mixSeeds(chart);
  return `<header class="hd"><h1>${L('Pradžia', 'Home')}</h1></header>
    ${seeds.length ? sec(L('Dienos miksai', 'Daily Mixes'), cards(seeds, 'mix')) : ''}
    ${fresh.length ? sec(L('Dabar klausosi', 'Listening right now'), cards(fresh)) : ''}
    ${recent.length ? sec(L('Tęsk klausymą', 'Jump back in'), cards(recent)) : ''}`;
}

const KINDS = [['tracks', () => L('Dainos', 'Songs')], ['artists', () => L('Atlikėjai', 'Artists')], ['albums', () => L('Albumai', 'Albums')], ['playlists', () => L('Grojaraščiai', 'Playlists')]];
let sKind = 'tracks', sQ = '';
function searchPage() {
  return `<header class="hd"><h1>${L('Paieška', 'Search')}</h1></header>
    <form id="sf" class="sbox" role="search"><input id="sq" type="search" value="${esc(sQ)}" placeholder="${L('Dainos, atlikėjai, albumai', 'Songs, artists, albums')}" autocomplete="off" enterkeyhint="search"></form>
    <div class="chips">${KINDS.map(([k, l]) => `<button class="chip ${k === sKind ? 'on' : ''}" data-act="kind" data-tab="${k}">${l()}</button>`).join('')}</div>
    <div id="sres"></div>`;
}
async function runSearch() {
  sQ = $('#sq').value.trim();
  if (!sQ) return;
  const out = $('#sres'), kind = sKind;
  out.innerHTML = `<p class="empty">…</p>`;
  const items = await api.search(sQ, kind).catch(() => null);
  if (kind !== sKind || out !== $('#sres')) return; // a newer search or another page
  if (!items) return out.innerHTML = empty(L('Nepavyko ieškoti.', 'Search failed.'));
  if (!items.length) return out.innerHTML = empty(L('Nieko nerasta.', 'Nothing found.'));
  out.innerHTML = kind === 'tracks'
    ? `<ul class="list">${rows(items)}</ul>`
    : `<ul class="list">${items.map(x => `<li class="row" data-act="open" data-type="${x.type}" data-id="${x.id}">${cover(x.cover, 'sm')}<span class="tx"><b>${esc(x.title)}</b><small>${esc(x.sub)}</small></span></li>`).join('')}</ul>`;
}

let libTab = 'liked';
function libraryPage() {
  const tabs = [['liked', L('Patinka', 'Liked')], ['playlists', L('Grojaraščiai', 'Playlists')], ['history', L('Istorija', 'History')]];
  let body;
  if (libTab === 'liked') body = lib.liked.length ? `<ul class="list">${rows(lib.liked)}</ul>` : empty(L('Kol kas nieko nepamėgta', 'Nothing liked yet'));
  else if (libTab === 'playlists') body = `<button class="pill" data-act="newpl">${ic(P.plus)} ${L('Naujas grojaraštis', 'New playlist')}</button>
    ${lib.playlists.length ? `<ul class="list">${lib.playlists.map((p, i) => `<li class="row" data-act="openpl" data-i="${i}">${cover(p.tracks[0]?.cover, 'sm')}<span class="tx"><b>${esc(p.name)}</b><small>${p.tracks.length} ${L('dainų', 'songs')}</small></span></li>`).join('')}</ul>` : empty(L('Grojaraščių dar nėra', 'No playlists yet'))}`;
  else body = lib.plays.length ? `<ul class="list">${rows([...lib.plays].sort((a, b) => b.last - a.last))}</ul>` : empty(L('Istorija tuščia', 'History is empty'));
  return `<header class="hd"><h1>${L('Biblioteka', 'Library')}</h1></header>
    <div class="chips">${tabs.map(([k, l]) => `<button class="chip ${k === libTab ? 'on' : ''}" data-act="libtab" data-tab="${k}">${l}</button>`).join('')}</div>${body}`;
}

function settingsPage() {
  const me = api.me() ?? {};
  const lt = localStorage.lang !== 'en';
  return `<header class="hd"><h1>${L('Nustatymai', 'Settings')}</h1></header>
    <div class="acc"><span class="av" style="background:${/^#[0-9a-f]{6}$/i.test(me.color) ? me.color : '#2a2a2a'}">${esc((me.name || '?').charAt(0).toUpperCase())}</span>
      <span class="tx"><b>${esc(me.name)}</b><small>@${esc(me.handle)}</small></span></div>
    <h2 class="lbl">${L('Kalba', 'Language')}</h2>
    <div class="chips"><button class="chip ${lt ? 'on' : ''}" data-act="lang" data-tab="lt">Lietuvių</button><button class="chip ${lt ? '' : 'on'}" data-act="lang" data-tab="en">English</button></div>
    <h2 class="lbl">${L('Paskyra', 'Account')}</h2>
    <button class="pill danger" data-act="logout">${L('Atsijungti', 'Log out')}</button>
    <p class="note">Vateko.fun · ${L('mobilioji versija 1.0.0', 'mobile 1.0.0')}<br>${L('Grojama 30 s peržiūra (Deezer). Pilni kūriniai — tik kompiuterio programoje.', 'Plays 30 s previews (Deezer). Full songs are in the desktop app only.')}</p>`;
}

async function detailPage(a) {
  if (a.local !== undefined) {
    const p = lib.playlists[a.local];
    return p ? page({ title: p.name, sub: `${p.tracks.length} ${L('dainų', 'songs')}`, cover: p.tracks[0]?.cover, tracks: p.tracks }) : empty(L('Grojaraštis nerastas', 'Playlist not found'));
  }
  const d = await api.get(a.type, a.id);
  return page({ title: d.title, sub: d.sub ?? '', cover: d.cover ?? d.tracks?.[0]?.cover, tracks: d.tracks ?? [] });
}
const PAGES = { home: homePage, search: searchPage, library: libraryPage, settings: settingsPage, detail: detailPage };

// ---- navigation: tabs reset the history, detail pages stack on it ----
let view = { name: 'home', tab: 'home', args: {} }, hist = [];
async function draw() {
  const v = view, root = $('#view');
  root.scrollTop = 0;
  document.querySelectorAll('#tabs .tab').forEach(b => { const on = b.dataset.tab === v.tab; b.classList.toggle('on', on); b.setAttribute('aria-current', on ? 'page' : 'false'); });
  root.innerHTML = `<p class="empty">…</p>`;
  let html;
  try { html = await PAGES[v.name](v.args); } catch { html = empty(L('Nepavyko įkelti.', 'Could not load.')); }
  if (view !== v) return; // user moved on while loading
  root.innerHTML = html;
  $('#sf')?.addEventListener('submit', e => { e.preventDefault(); runSearch(); });
  if (v.name === 'search' && sQ) runSearch();
}
const go = (name, args = {}) => { const tab = name === 'detail' ? view.tab : name; hist.push(view); view = { name, args, tab }; draw(); };
const tab = name => { hist = []; view = { name, args: {}, tab: name }; draw(); };
const back = () => { view = hist.pop() ?? { name: 'home', tab: 'home', args: {} }; draw(); };
async function mix(seed) {
  toast(L('Ruošiamas miksas…', 'Getting your mix…'));
  const r = await api.get('radio', seed.aid).catch(() => null);
  if (!r?.tracks?.length) return toast(L('Miksas nepavyko', 'Could not make the mix'));
  playList(shuffle(r.tracks), 0);
}

// ---- clicks: one delegated listener, data-act says what to do ----
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const a = el.dataset.act, list = reg.get(el.dataset.k), i = +el.dataset.i;
  if (a === 'tab') return tab(el.dataset.tab);
  if (a === 'back') return back();
  if (a === 'play') return playList(list, i);
  if (a === 'playall') return playList(list, 0);
  if (a === 'shuffle') return playList(shuffle([...list]), 0);
  if (a === 'mix') return mix(list[i]);
  if (a === 'more') return sheetFor(list[i]);
  if (a === 'open') return go('detail', { type: el.dataset.type, id: el.dataset.id });
  if (a === 'openpl') return go('detail', { local: i });
  if (a === 'full') return full(true);
  if (a === 'close') return full(false);
  if (a === 'toggle') return aud.paused ? aud.play().catch(() => {}) : aud.pause();
  if (a === 'next') return next();
  if (a === 'prev') return prev();
  if (a === 'like') return cur && toggleLike(cur);
  if (a === 'kind') { sKind = el.dataset.tab; return draw(); }
  if (a === 'libtab') { libTab = el.dataset.tab; return draw(); }
  if (a === 'newpl') { lib.playlists.push({ name: `${L('Grojaraštis', 'Playlist')} ${lib.playlists.length + 1}`, tracks: [] }); saveLib(); return draw(); }
  if (a === 'lang') { localStorage.lang = el.dataset.tab; return location.reload(); }
  if (a === 'logout') return api.logout();
  if (a === 'ios-hide') { localStorage.vios = '1'; return el.parentElement.remove(); }
  if (a === 'sheet-close') return closeSheet();
  if (a === 'sheet-play') { closeSheet(); return playList([sheetTrack], 0); }
  if (a === 'sheet-like') { toggleLike(sheetTrack); return sheetFor(sheetTrack); }
  if (a === 'sheet-add' || a === 'sheet-new') {
    if (a === 'sheet-new') lib.playlists.push({ name: `${L('Grojaraštis', 'Playlist')} ${lib.playlists.length + 1}`, tracks: [] });
    const p = lib.playlists[a === 'sheet-add' ? i : lib.playlists.length - 1];
    if (!p.tracks.some(x => x.id === sheetTrack.id)) p.tracks.push(slim(sheetTrack));
    saveLib(); closeSheet(); toast(L(`Įdėta į „${p.name}“`, `Added to “${p.name}”`));
  }
});
$('#f-seek').addEventListener('input', e => { aud.currentTime = +e.target.value; });

// ---- labels and icons follow the language (switching reloads the page) ----
function applyChrome() {
  document.documentElement.lang = L('lt', 'en');
  const TABS = { home: ['Pradžia', 'Home'], search: ['Paieška', 'Search'], library: ['Biblioteka', 'Library'], settings: ['Nustatymai', 'Settings'] };
  document.querySelectorAll('#tabs .tab').forEach(b => { b.querySelector('.lbl').textContent = L(...TABS[b.dataset.tab]); });
  document.querySelectorAll('[data-ic]').forEach(el => { el.innerHTML = ic(P[el.dataset.ic]); });
}

// ---- start: Home shows at once; no saved session (or an ended one) goes to the login screen ----
const toastEl = $('#toast'); let tt;
function toast(msg) { toastEl.textContent = msg; toastEl.hidden = false; clearTimeout(tt); tt = setTimeout(() => { toastEl.hidden = true; }, 2400); }
document.addEventListener('focusout', () => window.scrollTo(0, 0)); // iOS shifts the page up under the keyboard
applyChrome();
draw();
// iPhone: Safari has no install prompt, so the home screen steps are shown once (not in the installed app)
if (/iPhone|iPad|iPod/.test(navigator.userAgent) && !navigator.standalone && !localStorage.vios) {
  const tip = document.createElement('div');
  tip.id = 'ios-tip';
  tip.innerHTML = `<span>${L('Įdiegti: Safari → Dalintis → Pridėti į pagrindinį ekraną', 'Install: Safari → Share → Add to Home Screen')}</span><button class="ib" data-act="ios-hide" aria-label="Close">${ic(P.x)}</button>`;
  document.body.append(tip);
}
api.resume().then(ok => { if (!ok) location.replace('login.html'); });
