// Dashboard for a signed-in user: Download, Streak (listening days sent by the app), Profile (signed-in devices)
const { url, key } = window.SUPA;
const $ = id => document.getElementById(id);
const esc = t => String(t ?? '').replace(/[&<>"]/g, c => `&#${c.charCodeAt(0)};`);
const stored = JSON.parse(localStorage.getItem('vateko.session') || 'null');
if (!stored) location.replace('login.html');

async function call(route, { body, token, method } = {}) {
  try {
    const r = await fetch(url + route, {
      method: method ?? (body ? 'POST' : 'GET'),
      headers: { apikey: key, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { ok: r.ok, status: r.status, j: await r.json().catch(() => ({})) };
  } catch {
    return { ok: false, status: 0, j: {} };
  }
}

// tabs follow the URL hash, so a refresh keeps the open tab
function tab() {
  const tabs = ['download', 'mobile', 'streak', 'top', 'profile', ...($('founder-group').hidden ? [] : ['founder'])];
  const t = tabs.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'download';
  for (const a of document.querySelectorAll('[data-tab]')) a.dataset.tab === t ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
  for (const p of document.querySelectorAll('.dash-panel')) p.hidden = p.id !== 't-' + t;
  $('top-title').textContent = { top: 'Top listeners', founder: 'Founder Panel', download: 'Desktop', mobile: 'Mobile' }[t] ?? t[0].toUpperCase() + t.slice(1);
  $('acct-menu').hidden = true; $('acct-btn').setAttribute('aria-expanded', 'false');
  document.querySelector('.dash-main').scrollTop = 0;
}
addEventListener('hashchange', tab);
tab();

// sidebar: collapsible groups (remembered) and a search that filters the links
document.querySelectorAll('.side-gh').forEach(b => {
  const g = b.parentElement.dataset.group, set = open => { b.setAttribute('aria-expanded', open); b.nextElementSibling.hidden = !open; };
  set(localStorage.getItem('vateko.g.' + g) !== '0');
  b.addEventListener('click', () => { const open = b.getAttribute('aria-expanded') !== 'true'; set(open); localStorage.setItem('vateko.g.' + g, open ? '1' : '0'); });
});
$('side-q').addEventListener('input', e => {
  const q = e.target.value.trim().toLowerCase();
  document.querySelectorAll('.dash-tabs a').forEach(a => { a.hidden = !!q && !a.textContent.toLowerCase().includes(q); });
  document.querySelectorAll('.side-group:not([hidden]) .side-gb').forEach(b => { if (q) b.hidden = false; });
});
$('side-q').addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const hit = [...document.querySelectorAll('.dash-tabs a')].find(a => !a.hidden && !a.closest('[hidden]'));
  if (hit) { location.hash = hit.getAttribute('href'); e.target.value = ''; e.target.dispatchEvent(new Event('input')); }
});

const logout = () => { localStorage.removeItem('vateko.session'); location.replace('login.html'); };
$('logout').addEventListener('click', logout);
$('logout2').addEventListener('click', logout);

// account menu at the top of the sidebar
$('acct-btn').addEventListener('click', () => {
  const open = $('acct-menu').hidden;
  $('acct-menu').hidden = !open; $('acct-btn').setAttribute('aria-expanded', open);
});
addEventListener('click', e => { if (!e.target.closest('.acct')) { $('acct-menu').hidden = true; $('acct-btn').setAttribute('aria-expanded', 'false'); } });
addEventListener('keydown', e => { if (e.key === 'Escape') { $('acct-menu').hidden = true; $('acct-btn').setAttribute('aria-expanded', 'false'); } });

const day = d => d.toLocaleDateString('sv'); // YYYY-MM-DD, local time (same as the app sends)
const dur = s => (s >= 3600 ? `${Math.floor(s / 3600)}h ${Math.floor(s % 3600 / 60)}m` : s >= 60 || !s ? `${Math.floor(s / 60)}m` : `${s}s`);

// current streak counts back from today, or from yesterday if nothing was played yet today
function streaks(days) {
  const has = d => (days.get(day(d)) ?? 0) > 0;
  const d = new Date();
  if (!has(d)) d.setDate(d.getDate() - 1);
  let cur = 0;
  while (has(d)) { cur++; d.setDate(d.getDate() - 1); }
  let best = 0, run = 0, prev = null;
  for (const k of [...days.keys()].filter(k => days.get(k) > 0).sort()) {
    const t = new Date(k + 'T12:00');
    run = prev && Math.round((t - prev) / 864e5) === 1 ? run + 1 : 1;
    best = Math.max(best, run); prev = t;
  }
  return { cur, best: Math.max(best, cur) };
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// 53 weeks, columns start on Monday, today is the last cell; a month label sits over the week it starts in
function yearHTML(days) {
  const start = new Date(); start.setDate(start.getDate() - 364 - ((start.getDay() + 6) % 7));
  const cells = [], months = [];
  for (const d = new Date(start); d <= new Date(); d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 1) months.push(d.getDate() <= 7 ? d.toLocaleDateString('en', { month: 'short' }) : '');
    const s = days.get(day(d)) ?? 0;
    const lvl = s === 0 ? 0 : s < 900 ? 1 : s < 2700 ? 2 : s < 5400 ? 3 : 4; // <15m, <45m, <90m, more
    cells.push(`<i class="l${lvl}" title="${day(d)}: ${s ? dur(s) : 'no listening'}"></i>`);
  }
  return { months: months.map(m => `<span>${m}</span>`).join(''), cells: cells.join('') };
}

// no colour picked: one from the @handle, the same formula the app uses, so every account looks different
const AUTO = ['#ef4444', '#f59e0b', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
const autoColor = h => AUTO[[...String(h || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % AUTO.length];
const avatarHTML = (src, name, color, handle) => {
  const ini = String(name || '?').split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  return /^https:/.test(src || '')
    ? `<span class="avatar img" style="background-image:url('${esc(src).replace(/'/g, '')}')" aria-hidden="true"></span>`
    : `<span class="avatar" style="--av:${/^#[0-9a-f]{6}$/i.test(color || '') ? color : autoColor(handle)}" aria-hidden="true">${esc(ini)}</span>`;
};
const badge = on => (on ? ' <i class="badge">Founder</i>' : '');

async function renderTop(token) {
  const r = await call('/rest/v1/rpc/leaderboard2', { body: { lim: 50 }, token });
  const rows = r.ok && Array.isArray(r.j) ? r.j : [];
  $('lb').innerHTML = rows.map((u, i) => `<li class="${u.me ? 'me' : ''}">
    <span class="lb-rank">${i < 3 ? `<i class="medal m${i + 1}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 2h3l1.5 4.2L13.5 2h3l-2.6 6.6A6.5 6.5 0 1 1 10.1 8.6Z"/></svg><b>${i + 1}</b></i>` : i + 1}</span>${avatarHTML(u.avatar, u.name || u.handle, u.color, u.handle)}
    <span class="lb-who"><b>${esc(u.name || u.handle)}${badge(u.founder)}</b><small>@${esc(u.handle)}</small></span>
    <span class="lb-stat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 5a1 1 0 1 0-2 0v5.4l3.3 3.3a1 1 0 0 0 1.4-1.4L13 11.6Z"/></svg><span><b>${dur(Number(u.seconds))}</b><small>listened</small></span></span><span class="lb-stat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 2a1 1 0 0 1 1 1v1h6V3a1 1 0 1 1 2 0v1h1.5A2.5 2.5 0 0 1 21 6.5v12a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18.5v-12A2.5 2.5 0 0 1 5.5 4H7V3a1 1 0 0 1 1-1ZM5 9.5v9a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-9Z"/></svg><span><b>${u.days}</b><small>${u.days == 1 ? 'day' : 'days'}</small></span></span></li>`).join('')
    || '<li class="lb-empty">Nobody has listened yet. Play a song in the app and take the first spot.</li>';
}

// Founder Panel: the database refuses these calls for anyone who is not a founder; hiding the tab is only cosmetic
async function renderFounder(token) {
  const r = await call('/rest/v1/rpc/admin_users2', { body: {}, token });
  if (!r.ok) { $('fp-rows').innerHTML = '<tr><td colspan="8" class="devs-empty">Could not load accounts. Refresh the page to try again.</td></tr>'; return; }
  const users = r.j, today = day(new Date());
  $('fp-users').textContent = users.length;
  $('fp-today').textContent = users.filter(u => u.last_day === today).length;
  $('fp-total').textContent = dur(users.reduce((a, u) => a + Number(u.seconds), 0));
  $('fp-banned').textContent = users.filter(u => u.ban_reason).length;
  const short = t => (t ? new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never');
  const draw = () => {
    const q = $('fp-q').value.trim().toLowerCase();
    const list = users.filter(u => !q || [u.name, u.handle, u.email].some(v => String(v || '').toLowerCase().includes(q)));
    $('fp-rows').innerHTML = list.map(u => `<tr data-id="${u.id}">
      <td><span class="fp-acc">${avatarHTML(u.avatar, u.name || u.handle || u.email, u.color, u.handle)}<span><b>${esc(u.name || u.handle || '(no profile)')}${badge(u.founder)}</b><small>${u.handle ? '@' + esc(u.handle) : ''}</small></span></span></td>
      <td>${esc(u.email)}</td><td>${short(u.joined)}</td><td>${dur(Number(u.seconds))}<small class="fp-sub">${u.days} days</small></td>
      <td>${u.last_day ? short(u.last_day + 'T12:00') : 'Never'}</td><td>${u.devices}</td>
      <td>${u.ban_reason ? `<span class="st ban" title="${esc(u.ban_reason)}">Blocked</span>` : '<span class="st ok">Active</span>'}</td>
      <td class="fp-acts"><button class="row-btn plain" data-act="days">Streak</button>${u.founder ? '' : u.ban_reason
        ? '<button class="row-btn plain" data-act="unban">Unblock</button>' : '<button class="row-btn" data-act="ban">Block</button>'}</td></tr>`).join('')
      || '<tr><td colspan="8" class="devs-empty">No accounts match.</td></tr>';
  };
  draw();
  $('fp-q').oninput = draw;
  $('fp-rows').onclick = async e => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const tr = b.closest('tr'), u = users.find(x => x.id === tr.dataset.id);
    if (b.dataset.act === 'days') {
      // the account's year right under its row
      if (tr.nextElementSibling?.classList.contains('fp-year')) { tr.nextElementSibling.remove(); return; }
      const d = await call('/rest/v1/rpc/admin_user_days', { body: { uid: u.id }, token });
      const y = yearHTML(new Map((d.ok ? d.j : []).map(x => [x.day, x.seconds])));
      tr.insertAdjacentHTML('afterend', `<tr class="fp-year"><td colspan="8"><div class="grid-wrap"><div class="year"><div class="months">${y.months}</div><div class="grid">${y.cells}</div></div></div></td></tr>`);
      tr.nextElementSibling.querySelector('.grid-wrap').scrollLeft = 1e6;
    }
    if (b.dataset.act === 'unban' && (await call('/rest/v1/rpc/admin_unban', { body: { uid: u.id }, token })).ok) renderFounder(token);
    if (b.dataset.act === 'ban') {
      $('ban-who').textContent = u.name || u.handle || u.email;
      $('ban-why').value = '';
      $('ban-dlg').showModal();
      $('ban-form').onsubmit = async ev => {
        ev.preventDefault();
        const why = $('ban-why').value.trim();
        if (!why) return;
        const res = await call('/rest/v1/rpc/admin_ban', { body: { uid: u.id, why }, token });
        $('ban-dlg').close();
        if (res.ok) renderFounder(token);
      };
    }
  };
  $('ban-cancel').onclick = () => $('ban-dlg').close();
}

function renderStreak(rows) {
  const days = new Map(rows.map(r => [r.day, r.seconds]));
  const { cur, best } = streaks(days);
  const today = days.get(day(new Date())) ?? 0;
  const total = rows.reduce((a, r) => a + r.seconds, 0), active = rows.filter(r => r.seconds > 0);
  $('s-streak').textContent = $('ph-streak').textContent = cur;
  $('s-msg').textContent = !cur ? 'Play a song today to start a streak.'
    : today ? 'You listened today. Come back tomorrow to keep it going.'
    : `Play a song today to keep your ${cur}-day streak.`;
  $('s-best').textContent = `${best} ${best === 1 ? 'day' : 'days'}`;
  $('s-days').textContent = active.length;
  $('s-today').textContent = dur(today);
  $('s-total').textContent = $('ph-total').textContent = dur(total);
  const wd = [0, 0, 0, 0, 0, 0, 0];
  for (const r of active) wd[new Date(r.day + 'T12:00').getDay()] += r.seconds;
  $('s-fav').textContent = active.length ? DAYS[wd.indexOf(Math.max(...wd))] : 'None yet';
  // Bohemian Rhapsody is 5:55
  $('s-fun').hidden = total < 355;
  $('s-fun').textContent = `That's about ${Math.floor(total / 355).toLocaleString('en')} plays of Bohemian Rhapsody.`;

  // this week, Monday first: bars scale to the busiest day (at least an hour, so one short song stays short)
  const mon = new Date(); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
  const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d; });
  const top = Math.max(3600, ...week.map(d => days.get(day(d)) ?? 0));
  $('eq').innerHTML = week.map(d => {
    const s = days.get(day(d)) ?? 0, isToday = day(d) === day(new Date());
    return `<div class="${isToday ? 'today' : ''}" title="${DAYS[d.getDay()]}: ${s ? dur(s) : 'no listening'}">
      <i class="${s ? 'on' : ''}" style="height:${s ? Math.max(14, s / top * 100) : 8}%"></i>
      <b>${s ? dur(s) : ''}</b><small>${DAYS[d.getDay()].slice(0, 3)}</small></div>`;
  }).join('');

  const y = yearHTML(days);
  $('months').innerHTML = y.months;
  $('grid').innerHTML = y.cells;
  $('grid-empty').hidden = active.length > 0;
  $('grid').closest('.grid-wrap').scrollLeft = 1e6; // narrow screens: show the latest weeks first
}

// release notes for the Download tab: same version.json the app and the Updates page read
async function renderNews() {
  const en = x => (typeof x === 'string' ? x : x?.en ?? '');
  try {
    const v = await (await fetch('version.json', { cache: 'no-store' })).json();
    const u = v.updates?.[0];
    if (v.version) $('side-ver').textContent = `Vateko.fun v${v.version}`;
    if (v.version) $('hero-ver').textContent = `Version ${v.version}, the newest release. Free, no ads.`;
    if (!u) throw 0;
    $('news').innerHTML = `<h2 class="dl-h">What's new</h2>
      <p class="news-meta"><span class="news-ver">v${esc(u.version)}</span>${esc(new Date(u.date + 'T12:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }))}</p>
      <h3>${esc(en(u.title))}</h3>
      <ul>${(u.notes ?? []).map(n => `<li>${esc(en(n))}</li>`).join('')}</ul>
      <a href="updates.html">All updates</a>`;
  } catch {
    $('news').innerHTML = '<h2 class="dl-h">What\'s new</h2><p class="news-empty">Release notes could not be loaded. <a href="updates.html">Open the Updates page</a>.</p>';
  }
}

// the Download hero uses the home page's moving bands (bands() comes from site.js), in deep blues
const BLUE = [
  { y: .18, a: .1, s: .14, c: ['#5b8cff', '#2f66f0'] },
  { y: .48, a: .13, s: -.1, c: ['#1d4fd8', '#0b2f9e'] },
  { y: .76, a: .1, s: .08, c: ['#0a2380', '#06164f'] },
];
if (window.bands) bands($('page-sky'), BLUE, '#3a74ff', 1 / 30); // the whole page behind the sidebar and window
if (window.bands) document.querySelectorAll('.card-sky').forEach(c => bands(c, BLUE, '#3a74ff', 1 / 24));
if (window.bands) for (const id of ['hero-sky', 'hero-sky-m']) if ($(id)) bands($(id), [
  { y: .18, a: .1, s: .14, c: ['#5b8cff', '#2f66f0'] },
  { y: .48, a: .13, s: -.1, c: ['#1d4fd8', '#0b2f9e'] },
  { y: .76, a: .1, s: .08, c: ['#0a2380', '#06164f'] },
], '#3a74ff', 1 / 24);
renderNews();

// profile picture: same file the app uses (storage avatars/<user id>/avatar.jpg, URL in user metadata)
function showAvatar(src) {
  for (const el of [$('p-av'), $('me-av'), $('ph-av')]) {
    el.classList.toggle('img', !!src);
    el.style.backgroundImage = src ? `url("${src.replace(/"/g, '')}")` : '';
  }
  $('av-remove').hidden = !src;
  const s = JSON.parse(localStorage.getItem('vateko.session') || 'null');
  if (s) localStorage.setItem('vateko.session', JSON.stringify({ ...s, avatar: src || '' }));
}

// any image -> centered 256 px square JPEG, so uploads stay small and GIFs/PNGs all work
const square = file => new Promise((ok, fail) => {
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas'), side = Math.min(img.width, img.height);
    c.width = c.height = 256;
    c.getContext('2d').drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 256, 256);
    URL.revokeObjectURL(img.src);
    c.toBlob(b => (b ? ok(b) : fail()), 'image/jpeg', .85);
  };
  img.onerror = fail;
  img.src = URL.createObjectURL(file);
});

// profile colour: user metadata "color", the app reads and writes the same field
function setColor(c) {
  for (const el of [$('p-av'), $('me-av'), $('ph-av')]) el.style.setProperty('--av', c);
  document.querySelectorAll('#p-colors .swatch').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.c === c)));
  const s = JSON.parse(localStorage.getItem('vateko.session') || 'null');
  if (s) localStorage.setItem('vateko.session', JSON.stringify({ ...s, color: c }));
}
function colorEditor(token, color, handle) {
  const cur = /^#[0-9a-f]{6}$/i.test(color || '') ? color : autoColor(handle);
  $('p-colors').innerHTML = AUTO.map(c => `<button class="swatch" data-c="${c}" style="background:${c}" aria-label="${c}" aria-pressed="false"></button>`).join('');
  setColor(cur);
  $('p-colors').onclick = async e => {
    const b = e.target.closest('.swatch');
    if (!b) return;
    const prev = JSON.parse(localStorage.getItem('vateko.session') || 'null')?.color || cur;
    setColor(b.dataset.c);
    if (!(await call('/auth/v1/user', { method: 'PUT', body: { data: { color: b.dataset.c } }, token })).ok) setColor(prev);
  };
}

function avatarEditor(token) {
  const msg = t => { $('av-msg').textContent = t; };
  const uid = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).sub;
  const setMeta = avatar_url => call('/auth/v1/user', { method: 'PUT', body: { data: { avatar_url } }, token });
  $('av-file').onchange = async e => {
    const f = e.target.files[0]; e.target.value = '';
    if (!f) return;
    if (f.size > 10 * 1048576) return msg('Pick an image under 10 MB.');
    msg('Uploading.');
    let blob;
    try { blob = await square(f); } catch { return msg('That file is not an image. Pick a PNG, JPEG, WebP or GIF.'); }
    const up = await fetch(`${url}/storage/v1/object/avatars/${uid}/avatar.jpg`, {
      method: 'POST', headers: { apikey: key, Authorization: `Bearer ${token}`, 'Content-Type': 'image/jpeg', 'x-upsert': 'true' }, body: blob,
    }).catch(() => null);
    if (!up?.ok) return msg("Couldn't upload the picture. Try again in a moment.");
    const src = `${url}/storage/v1/object/public/avatars/${uid}/avatar.jpg?v=${Date.now()}`;
    if (!(await setMeta(src)).ok) return msg("Couldn't save the picture. Try again in a moment.");
    showAvatar(src);
    msg('Saved. The app picks it up next time you open it.');
  };
  $('av-remove').onclick = async () => {
    if (!(await setMeta('')).ok) return msg("Couldn't remove the picture. Try again in a moment.");
    await call(`/storage/v1/object/avatars/${uid}/avatar.jpg`, { method: 'DELETE', token });
    showAvatar('');
    msg('Removed.');
  };
}

function device() {
  const ua = navigator.userAgent;
  const b = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
  const os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : '';
  return `${b} (${os || 'web'})`;
}

// city from the IP for the Location column (ipwho.is, free, no key); cached for this tab
async function place(ip) {
  if (!ip) return '';
  const k = 'geo:' + ip, hit = sessionStorage.getItem(k);
  if (hit !== null) return hit;
  try {
    const g = await (await fetch(`https://ipwho.is/${encodeURIComponent(ip)}?fields=success,city,region,country_code`)).json();
    const v = g.success ? [g.city, g.region, g.country_code].filter(Boolean).join(', ') : '';
    sessionStorage.setItem(k, v);
    return v;
  } catch { return ''; }
}
const when = t => new Date(t).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

async function renderDevices(list, token) {
  const me = device();
  list.sort((a, b) => (b.device === me) - (a.device === me) || new Date(b.last_seen) - new Date(a.last_seen));
  $('ph-devs').textContent = list.length;
  const locs = await Promise.all(list.map(d => place(d.ip)));
  $('devs').innerHTML = list.map((d, i) => `<tr>
    <td>${esc(d.device)}${d.device === me ? '<span class="cur">Current</span>' : ''}</td>
    <td>${esc(locs[i] || d.ip || 'Unknown')}</td>
    <td>${esc(when(d.created_at ?? d.last_seen))}</td>
    <td>${esc(when(d.last_seen))}</td>
    <td><button class="dots" aria-label="More for ${esc(d.device)}" aria-haspopup="menu" aria-expanded="false" data-i="${i}">⋮</button></td>
  </tr>`).join('') || '<tr><td colspan="5" class="devs-empty">No devices yet. Log in to the app and it shows up here.</td></tr>';

  const close = () => { document.querySelector('.menu')?.remove(); document.querySelectorAll('.dots[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded', 'false')); };
  $('devs').onclick = e => {
    const b = e.target.closest('.dots');
    if (!b) return;
    const open = b.getAttribute('aria-expanded') === 'true';
    close();
    if (open) return;
    b.setAttribute('aria-expanded', 'true');
    const m = document.createElement('div');
    m.className = 'menu'; m.setAttribute('role', 'menu');
    m.innerHTML = '<button role="menuitem">Log out</button>';
    b.parentElement.append(m);
    m.firstChild.focus();
    m.firstChild.onclick = async () => {
      const d = list[b.dataset.i];
      // removes the device from the list; this browser is logged out right away
      await call(`/rest/v1/devices?device=eq.${encodeURIComponent(d.device)}`, { method: 'DELETE', token });
      if (d.device === me) { await call('/auth/v1/logout', { body: {}, token }); localStorage.removeItem('vateko.session'); location.replace('login.html'); return; }
      list.splice(b.dataset.i, 1);
      renderDevices(list, token);
    };
  };
  document.onclick = e => { if (!e.target.closest('.dots, .menu')) close(); };
  document.onkeydown = e => { if (e.key === 'Escape') close(); };
}

(async () => {
  if (!stored) return;
  // refresh tokens rotate: swap for a fresh access token and keep the new refresh token
  const t = await call('/auth/v1/token?grant_type=refresh_token', { body: { refresh_token: stored.refresh } });
  if (t.status === 0) { $('d-err').textContent = "Couldn't reach the server. Refresh the page to try again."; return; }
  if (!t.ok || !t.j.access_token) { localStorage.removeItem('vateko.session'); location.replace('login.html'); return; }
  localStorage.setItem('vateko.session', JSON.stringify({ ...stored, refresh: t.j.refresh_token }));
  const token = t.j.access_token, user = t.j.user ?? {}, meta = user.user_metadata ?? {};

  const name = meta.display_name || meta.handle || user.email || '', handle = meta.handle ? '@' + meta.handle : '';
  const initials = name.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  $('p-name').textContent = $('me-name').textContent = $('ph-name').textContent = name;
  $('p-handle').textContent = $('me-handle').textContent = $('ph-handle').textContent = handle;
  $('p-av').textContent = $('me-av').textContent = $('ph-av').textContent = initials;
  showAvatar(meta.avatar_url);
  colorEditor(token, meta.color, meta.handle);
  avatarEditor(token);
  if (handle) document.querySelectorAll('.who').forEach(el => { el.textContent = handle; });
  $('p-email').textContent = $('me-email').textContent = user.email ?? '';
  $('p-since').textContent = user.created_at ? new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

  // blocked: back to the login page, which shows the reason
  const st = await call('/rest/v1/rpc/my_status', { body: {}, token });
  if (st.j?.ban) {
    sessionStorage.setItem('vateko.ban', JSON.stringify(st.j.ban));
    localStorage.removeItem('vateko.session');
    location.replace('login.html');
    return;
  }
  if (st.j?.founder) {
    $('founder-group').hidden = false;
    document.querySelectorAll('[data-founder]').forEach(el => { el.hidden = false; });
    tab();
    renderFounder(token);
  }
  renderTop(token);
  await call('/rest/v1/rpc/touch_device', { body: { device: device() }, token });
  const [lis, dev] = await Promise.all([
    call('/rest/v1/listening?select=day,seconds&order=day', { token }),
    call('/rest/v1/devices?select=device,ip,created_at,last_seen&order=last_seen.desc', { token }),
  ]);
  renderStreak(lis.ok && Array.isArray(lis.j) ? lis.j : []);
  renderDevices(dev.ok && Array.isArray(dev.j) ? dev.j : [], token);
})();
