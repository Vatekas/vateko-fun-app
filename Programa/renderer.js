const $ = s => document.querySelector(s);

// Material Symbols paths, inlined so icons work offline
const ICONS = {
  home: '<path d="M10.13 4.5a3 3 0 0 1 3.74 0l6 4.8A3 3 0 0 1 21 11.64V18a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-6.36a3 3 0 0 1 1.13-2.34z"/>',
  search: '<circle cx="10.5" cy="10.5" r="7.5"/><circle cx="10.5" cy="10.5" r="3.75" fill="#fff" opacity=".35"/><path d="M14.6 17a1.7 1.7 0 0 1 2.4-2.4l3.4 3.4a1.7 1.7 0 0 1-2.4 2.4z"/>',
  library: '<path opacity=".45" d="M9.5 5.2A2.2 2.2 0 0 1 11.7 3h5.6a2.2 2.2 0 0 1 2.2 2.2v8.5a2.2 2.2 0 0 1-3.49 1.79l-.23-.17a2.2 2.2 0 0 0-2.57 0l-.23.17A2.2 2.2 0 0 1 9.5 13.7z"/><path d="M4.5 8.2A2.2 2.2 0 0 1 6.7 6h5.6a2.2 2.2 0 0 1 2.2 2.2v8.5a2.2 2.2 0 0 1-3.49 1.79l-.23-.17a2.2 2.2 0 0 0-2.57 0l-.23.17A2.2 2.2 0 0 1 4.5 16.7z"/>',
  settings: '<path fill-rule="evenodd" d="M12 1.5C12.34 1.5 12.71 1.47 13.02 1.67C13.33 1.86 13.61 2.33 13.85 2.68C14.1 3.03 14.27 3.51 14.5 3.75C14.73 4 14.99 4.04 15.25 4.15C15.51 4.25 15.72 4.41 16.06 4.4C16.4 4.39 16.86 4.17 17.28 4.1C17.7 4.03 18.23 3.89 18.59 3.97C18.95 4.05 19.18 4.34 19.42 4.58C19.66 4.82 19.95 5.05 20.03 5.41C20.11 5.77 19.97 6.3 19.9 6.72C19.83 7.14 19.61 7.6 19.6 7.94C19.59 8.28 19.75 8.49 19.85 8.75C19.96 9.01 20 9.27 20.25 9.5C20.49 9.73 20.97 9.9 21.32 10.15C21.67 10.39 22.14 10.67 22.33 10.98C22.53 11.29 22.5 11.66 22.5 12C22.5 12.34 22.53 12.71 22.33 13.02C22.14 13.33 21.67 13.61 21.32 13.85C20.97 14.1 20.49 14.27 20.25 14.5C20 14.73 19.96 14.99 19.85 15.25C19.75 15.51 19.59 15.72 19.6 16.06C19.61 16.4 19.83 16.86 19.9 17.28C19.97 17.7 20.11 18.23 20.03 18.59C19.95 18.95 19.66 19.18 19.42 19.42C19.18 19.66 18.95 19.95 18.59 20.03C18.23 20.11 17.7 19.97 17.28 19.9C16.86 19.83 16.4 19.61 16.06 19.6C15.72 19.59 15.51 19.75 15.25 19.85C14.99 19.96 14.73 20 14.5 20.25C14.27 20.49 14.1 20.97 13.85 21.32C13.61 21.67 13.33 22.14 13.02 22.33C12.71 22.53 12.34 22.5 12 22.5C11.66 22.5 11.29 22.53 10.98 22.33C10.67 22.14 10.39 21.67 10.15 21.32C9.9 20.97 9.73 20.49 9.5 20.25C9.27 20 9.01 19.96 8.75 19.85C8.49 19.75 8.28 19.59 7.94 19.6C7.6 19.61 7.14 19.83 6.72 19.9C6.3 19.97 5.77 20.11 5.41 20.03C5.05 19.95 4.82 19.66 4.58 19.42C4.34 19.18 4.05 18.95 3.97 18.59C3.89 18.23 4.03 17.7 4.1 17.28C4.17 16.86 4.39 16.4 4.4 16.06C4.41 15.72 4.25 15.51 4.15 15.25C4.04 14.99 4 14.73 3.75 14.5C3.51 14.27 3.03 14.1 2.68 13.85C2.33 13.61 1.86 13.33 1.67 13.02C1.47 12.71 1.5 12.34 1.5 12C1.5 11.66 1.47 11.29 1.67 10.98C1.86 10.67 2.33 10.39 2.68 10.15C3.03 9.9 3.51 9.73 3.75 9.5C4 9.27 4.04 9.01 4.15 8.75C4.25 8.49 4.41 8.28 4.4 7.94C4.39 7.6 4.17 7.14 4.1 6.72C4.03 6.3 3.89 5.77 3.97 5.41C4.05 5.05 4.34 4.82 4.58 4.58C4.82 4.34 5.05 4.05 5.41 3.97C5.77 3.89 6.3 4.03 6.72 4.1C7.14 4.17 7.6 4.39 7.94 4.4C8.28 4.41 8.49 4.25 8.75 4.15C9.01 4.04 9.27 4 9.5 3.75C9.73 3.51 9.9 3.03 10.15 2.68C10.39 2.33 10.67 1.86 10.98 1.67C11.29 1.47 11.66 1.5 12 1.5ZM12 8.7a3.3 3.3 0 1 0 0 6.6a3.3 3.3 0 1 0 0 -6.6Z"/>',
  play: 'M8 5v14l11-7z',
  pause: 'M6 19h4V5H6v14zm8-14v14h4V5h-4z',
  next: 'M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z',
  prev: 'M6 6h2v12H6zm3.5 6 8.5 6V6z',
  folder: 'M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z',
  volume: 'M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z',
  lyrics: 'M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z',
  bolt: 'M11 21h-1l1-7H7.5c-.88 0-.33-.75-.31-.78C8.48 10.94 10.42 7.54 13.01 3h1l-1 7h3.51c.4 0 .62.19.4.66C12.97 17.55 11 21 11 21z',
  spark: 'M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z',
};
// home/search/library/settings: drawn in Figma (Vatekas – Music App), exported as SVG
const icon = n => `<svg class="i-${n}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n][0] === '<' ? ICONS[n] : `<path d="${ICONS[n]}"/>`}</svg>`;
document.querySelectorAll('[data-icon]').forEach(el =>
  el.dataset.icon.split(' ').forEach(n => el.insertAdjacentHTML('afterbegin', icon(n))));

const ACCENTS = { Mėlyna: '#2563eb', Raudona: '#e11d48', Žalia: '#16a34a', Violetinė: '#7c3aed', Oranžinė: '#ea580c' };
const TITLES = { search: 'Paieška', library: 'Biblioteka', settings: 'Nustatymai', now: 'Dabar groja' };

const audio = new Audio();
const seek = $('#seek');
const vol = $('#vol');
let tracks = [];
let cur = -1;
let lines = [];
let line = -1;
let shownFor = null;
let S = {}; // settings from main (settings.json)
let queue = []; // track indexes; Playback settings decide how it fills
let qpos = -1;

const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Labas rytas' : h < 18 ? 'Laba diena' : 'Labas vakaras'; };
const hue = s => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % 360;
const grad = t => `linear-gradient(135deg,hsl(${hue(t.title)} 70% 55%),hsl(${(hue(t.title) + 70) % 360} 65% 35%))`;
const art = (t, cls = '') => `<span class="cv ${cls}" style="background:${grad(t)}"><img src="${t.cover}" loading="lazy" alt=""></span>`;
const who = t => t.artist || t.dir;
const fmt = s => isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00';
const esc = s => String(s).replace(/[&<>"]/g, c => `&#${c.charCodeAt(0)};`);
const fill = el => el.style.setProperty('--p', `${(el.value / el.max) * 100}%`);
const recent = () => JSON.parse(localStorage.recent ?? '[]');

// covers that fail to load (no embedded art) fall back to the gradient underneath
document.addEventListener('error', e => { if (e.target.tagName === 'IMG' && e.target.id !== 'amb') e.target.remove(); }, true);

async function load(dir) {
  $('#count').textContent = 'Kraunama…';
  const lib = await api.library(dir);
  tracks = lib.tracks;
  cur = -1;
  queue = [];
  qpos = -1;
  shownFor = null;
  audio.pause();
  audio.removeAttribute('src');
  $('#folder').textContent = $('#folder2').textContent = lib.dir;
  $('#count').textContent = `Dainos: ${tracks.length}`;
  renderHome();
  renderList();
  if (S.context === 'resume') restoreQueue();
  paint();
}

// Playback > Default playback context: queue + position survive a restart
function saveQueue() {
  localStorage.queue = JSON.stringify({ urls: queue.map(i => tracks[i]?.url), qpos, t: audio.currentTime || 0 });
}
function restoreQueue() {
  let q;
  try { q = JSON.parse(localStorage.queue); } catch { return; }
  const byUrl = new Map(tracks.map((t, i) => [t.url, i]));
  const at = q.urls[q.qpos];
  queue = q.urls.map(u => byUrl.get(u)).filter(i => i !== undefined);
  qpos = queue.indexOf(byUrl.get(at));
  if (qpos < 0) { queue = []; return; }
  cur = queue[qpos];
  audio.src = tracks[cur].url;
  audio.addEventListener('loadedmetadata', () => { audio.currentTime = q.t; }, { once: true });
}

// Playback > Autoplay similar tracks: same artist, else same album, else same folder, else any; skips the last 20 played
function similar() {
  const t = tracks[cur];
  const recentQ = new Set(queue.slice(-20));
  const all = tracks.map((x, i) => [x, i]);
  let pool = all.filter(([, i]) => !recentQ.has(i));
  if (!pool.length) pool = all.filter(([, i]) => i !== cur); // small library: everything was played recently
  if (!pool.length || !t) return -1;
  const pick = list => list[Math.floor(Math.random() * list.length)]?.[1];
  return pick(pool.filter(([x]) => t.artist && x.artist === t.artist))
    ?? pick(pool.filter(([x]) => t.album && x.album === t.album))
    ?? pick(pool.filter(([x]) => x.dir === t.dir))
    ?? pick(pool);
}

function renderHome() {
  const urls = recent();
  const order = [...new Set([...urls.map(u => tracks.findIndex(t => t.url === u)).filter(i => i >= 0), ...tracks.keys()])];
  $('#dial').innerHTML = `<button class="tile" data-view="library"><span class="all">${icon('library')}</span><span><b>Visos dainos</b><small>Dainos: ${tracks.length}</small></span></button>` +
    order.slice(0, 5).map(i => `<button class="tile" data-i="${i}">${art(tracks[i])}<span><b>${esc(tracks[i].title)}</b><small>${esc(who(tracks[i]))}</small></span></button>`).join('');
  $('#cards').innerHTML = tracks.slice(0, 14).map((t, i) =>
    `<button class="card" data-i="${i}">${art(t)}<b>${esc(t.title)}</b><small>${esc(who(t))}</small></button>`).join('');
}

function renderList() {
  const q = $('#q').value.trim().toLowerCase();
  const rows = tracks.map((t, i) => [t, i]).filter(([t]) => `${t.title} ${t.artist} ${t.album}`.toLowerCase().includes(q));
  $('#list').innerHTML = rows.map(([t, i]) =>
    `<li data-i="${i}"${i === cur ? ' class="on"' : ''}><span class="n"><em>${i + 1}</em><i class="eq"><b></b><b></b><b></b></i></span>` +
    `${art(t)}<span class="t"><b>${esc(t.title)}</b><small>${esc(who(t))}</small></span><span class="d">${esc(t.album || t.dir)}</span></li>`).join('')
    || `<li class="empty">${tracks.length ? 'Nieko nerasta.' : 'Šiame aplanke dainų nėra. Pasirink kitą aplanką nustatymuose.'}</li>`;
}

function paint() {
  const t = tracks[cur] ?? tracks[0];
  document.body.classList.toggle('playing', !audio.paused);
  api.now(t && cur >= 0 ? { title: t.title, artist: who(t), cover: t.cover, playing: !audio.paused } : { title: '', playing: false });
  $('#list .on')?.classList.remove('on');
  $(`#list [data-i="${cur}"]`)?.classList.add('on');
  if (t === shownFor) return;
  shownFor = t;
  for (const p of ['now', 'p']) {
    $(`#${p}-title`).textContent = t?.title ?? 'Nėra dainų';
    $(`#${p}-sub`).textContent = t ? who(t) : '';
    $(`#${p}-cover`).outerHTML = t ? art(t).replace('class="cv ', `id="${p}-cover" class="cv `) : `<span class="cv" id="${p}-cover"></span>`;
  }
  ambient(t);
  showLyrics(cur < 0 ? null : t);
}

// window glow follows the album art: blurred cover behind the glass + blobs tinted with its 4 quadrant colours
async function ambient(t) {
  const img = $('#amb');
  document.body.classList.toggle('wall', !!localStorage.wall);
  if (localStorage.wall) { img.src = localStorage.wall; img.classList.add('on'); return; }
  try {
    const probe = new Image();
    probe.crossOrigin = 'anonymous';
    probe.src = t.cover;
    await probe.decode();
    if (t !== shownFor) return;
    img.src = t.cover;
    img.classList.add('on');
    const c = document.createElement('canvas');
    c.width = c.height = 2;
    const x = c.getContext('2d');
    x.drawImage(probe, 0, 0, 2, 2);
    const d = x.getImageData(0, 0, 2, 2).data;
    [0, 4, 8, 12].forEach((o, k) => document.body.style.setProperty(`--c${k + 1}`, `rgb(${d[o]},${d[o + 1]},${d[o + 2]})`));
  } catch {
    img.classList.remove('on');
    [1, 2, 3, 4].forEach(k => document.body.style.removeProperty(`--c${k}`));
  }
}

const lyricsCache = new Map();
function fetchLyrics(t) {
  if (!lyricsCache.has(t.url)) {
    const q = new URLSearchParams(t.artist ? { track_name: t.title, artist_name: t.artist } : { q: t.title });
    // disk cache (Cache & Storage > Lyrics) first, then lrclib.net
    lyricsCache.set(t.url, api.lyricsGet(t.url).then(hit => hit ?? fetch(`https://lrclib.net/api/search?${q}`)
      .then(r => r.json())
      .then(list => {
        const hit = list.find(x => x.syncedLyrics) ?? list.find(x => x.plainLyrics);
        if (hit?.syncedLyrics) return hit.syncedLyrics.split('\n')
          .map(l => l.match(/^\[(\d+):(\d+(?:\.\d+)?)\]\s*(.*)/)).filter(Boolean)
          .map(m => ({ at: m[1] * 60 + +m[2], text: m[3] || '♪' }));
        return (hit?.plainLyrics ?? '').split('\n').filter(Boolean).map(text => ({ at: null, text }));
      })
      .then(found => { api.lyricsPut(t.url, found); return found; }))
      .catch(() => []));
  }
  return lyricsCache.get(t.url);
}

async function showLyrics(t) {
  const box = $('#lyrics');
  lines = [];
  line = -1;
  box.className = '';
  box.innerHTML = `<li class="msg">${t ? 'Ieškoma dainos žodžių…' : 'Paleisk dainą ir čia matysi jos žodžius.'}</li>`;
  if (!t) return;
  const found = await fetchLyrics(t);
  if (t !== shownFor) return;
  lines = found;
  box.classList.toggle('plain', lines[0]?.at === null);
  box.innerHTML = lines.map((l, i) => `<li data-line="${i}">${esc(l.text)}</li>`).join('') || '<li class="msg">Šiai dainai žodžių nerasta.</li>';
  syncLyrics();
}

function syncLyrics() {
  if (lines[0]?.at == null) return;
  const i = lines.findLastIndex(l => l.at <= audio.currentTime + 0.25);
  if (i === line) return;
  line = i;
  const box = $('#lyrics');
  box.querySelector('.on')?.classList.remove('on');
  const el = box.children[i];
  if (!el) return;
  el.classList.add('on');
  box.scrollTo({ top: el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2, behavior: 'smooth' });
}

// start one track (queue position already set by the caller)
function start(i) {
  cur = i;
  const t = tracks[cur];
  audio.src = t.url;
  audio.play().catch(() => {});
  localStorage.recent = JSON.stringify([t.url, ...recent().filter(u => u !== t.url)].slice(0, 5));
  navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: who(t), album: t.album || 'Vatekas' });
  renderHome();
  paint();
  saveQueue();
}

// play now: the whole library becomes the queue, starting at i
function play(i) {
  if (!tracks.length) return;
  queue = [...tracks.keys()];
  qpos = (i + tracks.length) % tracks.length;
  start(queue[qpos]);
}

function enqueue(i) {
  if (cur < 0) return play(i);
  queue.splice(qpos + 1, 0, i);
  saveQueue();
  window.Notify?.toast('Pridėta į eilę', tracks[i].title);
}

// ended = true: the song finished by itself, so the queue may end or autoplay picks one
function next(ended) {
  if (!tracks.length) return;
  if (qpos + 1 < queue.length) return start(queue[++qpos]);
  if (ended && !S.autoplay) { saveQueue(); return; }
  const s = ended ? similar() : -1;
  if (s >= 0) { queue.push(s); return start(queue[++qpos]); }
  play(0);
}

function setView(v) {
  document.body.dataset.view = v;
  $('#title').textContent = TITLES[v] ?? greet();
  document.querySelectorAll('.nav').forEach(b => {
    b.classList.toggle('on', b.dataset.view === v);
    b.toggleAttribute('aria-current', b.dataset.view === v);
  });
  document.querySelectorAll('.vol [data-view=now]').forEach(b => b.classList.toggle('on', v === 'now'));
  if (v === 'search') $('#q').focus();
  if (v === 'now') { line = -1; syncLyrics(); }
}

function setAccent(c) {
  localStorage.accent = c;
  document.documentElement.style.setProperty('--accent', c);
  document.querySelectorAll('.sw').forEach(s => s.classList.toggle('on', s.dataset.c === c));
}

function setWall(url) {
  if (url) localStorage.wall = url; else localStorage.removeItem('wall');
  $('#wall-name').textContent = url ? decodeURIComponent(url.split('/').pop()) : 'Groja dainos viršelis';
  shownFor = null;
  paint();
}

const ACTS = {
  toggle: () => cur < 0 ? play(0) : audio.paused ? audio.play() : audio.pause(),
  next: () => next(false),
  prev: () => audio.currentTime > 3 || qpos <= 0 ? (audio.currentTime = 0) : start(queue[--qpos]),
  folder: async () => { const d = await api.pick('folder'); if (d) { localStorage.dir = d; load(d); } },
  rescan: () => load(localStorage.dir),
  accent: el => setAccent(el.dataset.c),
  wall: async () => { const u = await api.pick('image'); if (u) setWall(u); },
  unwall: () => setWall(null),
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-view],[data-act],[data-i],[data-line]');
  if (!el) return;
  if (el.dataset.view) setView(el.dataset.view);
  else if (el.dataset.act) ACTS[el.dataset.act](el);
  else if (el.dataset.line) { const l = lines[el.dataset.line]; if (l.at != null && cur >= 0) audio.currentTime = l.at; }
  else if (!el.closest('#list,.cards')) play(+el.dataset.i);
});
// Playback > Double-click on track: play now or add to queue
document.addEventListener('dblclick', e => {
  const el = e.target.closest('#list [data-i],.cards [data-i]');
  if (el) S.dblclick === 'queue' ? enqueue(+el.dataset.i) : play(+el.dataset.i);
});
document.addEventListener('keydown', e => {
  if (e.code === 'Space' && e.target.tagName !== 'INPUT') { e.preventDefault(); ACTS.toggle(); }
});
$('#q').addEventListener('input', renderList);

audio.addEventListener('play', paint);
audio.addEventListener('pause', paint);
audio.addEventListener('ended', () => next(true));
audio.addEventListener('pause', saveQueue);
setInterval(() => { if (!audio.paused) saveQueue(); }, 5000);

// Playback > Pause on device change: only when the list of audio outputs changes
const outputs = async () => (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'audiooutput').map(d => d.deviceId).join();
let outs = '';
outputs().then(o => { outs = o; });
navigator.mediaDevices.addEventListener('devicechange', async () => {
  const o = await outputs();
  if (o !== outs && S.devicePause) audio.pause();
  outs = o;
});
api.onCtl(a => ACTS[a]?.());
// Audio > Output Device: play through the chosen headphones / speakers ('' = system default)
const sink = () => audio.setSinkId?.(S.outputDevice || '')?.catch(() => audio.setSinkId(''));
api.onSettings(s => {
  const reload = s.quality !== S.quality;
  S = s;
  sink();
  if (reload) load(localStorage.dir); // Audio > streaming quality picks another file per song
});
audio.addEventListener('timeupdate', () => {
  if (!seek.matches(':active')) seek.value = audio.duration ? (audio.currentTime / audio.duration) * 1000 : 0;
  fill(seek);
  $('#t0').textContent = fmt(audio.currentTime);
  $('#t1').textContent = fmt(audio.duration);
  syncLyrics();
});
seek.addEventListener('input', () => { if (audio.duration) audio.currentTime = (seek.value / 1000) * audio.duration; fill(seek); });
vol.value = localStorage.vol ?? 0.8;
audio.volume = vol.value;
fill(vol);
vol.addEventListener('input', () => { audio.volume = localStorage.vol = vol.value; fill(vol); });

for (const [a, f] of [['play', () => audio.play()], ['pause', () => audio.pause()], ['nexttrack', ACTS.next], ['previoustrack', ACTS.prev]])
  navigator.mediaSession.setActionHandler(a, f);

$('#swatches').innerHTML = Object.entries(ACCENTS).map(([name, c]) =>
  `<button class="sw" data-act="accent" data-c="${c}" style="background:${c}" aria-label="${name}" title="${name}"></button>`).join('');
setAccent(localStorage.accent ?? ACCENTS.Mėlyna);
$('#wall-name').textContent = localStorage.wall ? decodeURIComponent(localStorage.wall.split('/').pop()) : 'Groja dainos viršelis';
setView('home');
api.settings().then(s => { S = s; sink(); load(localStorage.dir); });
