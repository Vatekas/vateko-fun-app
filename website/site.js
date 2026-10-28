const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

// moving blurred bands: drawn on a tiny canvas, CSS scales and blurs it (sky behind the screenshot, waves in the footer)
function bands(canvas, layers, bg, speed) {
  if (!canvas) return;
  const g = canvas.getContext('2d'), W = 160, H = 64;
  canvas.width = W; canvas.height = H;
  let t = Math.random() * 100, visible = true;
  const draw = () => {
    g.clearRect(0, 0, W, H);
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, W, H); }
    layers.forEach((b, i) => {
      const grad = g.createLinearGradient(0, b.y * H, 0, H);
      grad.addColorStop(0, b.c[0]); grad.addColorStop(1, b.c[1]);
      g.fillStyle = grad;
      g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x <= W; x += 4) {
        const k = x / W * 6.28;
        const y = b.y + b.a * (Math.sin(k * 1.3 + t * b.s * 6 + i) * .6 + Math.sin(k * 2.7 - t * b.s * 4 + i * 2) * .3 + Math.sin(k * 5.1 + t * b.s * 9) * .1);
        g.lineTo(x, y * H);
      }
      g.lineTo(W, H); g.fill();
    });
  };
  const loop = () => { if (visible) { t += speed; draw(); } requestAnimationFrame(loop); };
  draw();
  if (!still) {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
    loop();
  }
}
bands(document.querySelector('.sky'), [
  { y: .16, a: .07, s: .18, c: ['#d6efff', '#9fd4ff'] },
  { y: .36, a: .09, s: -.13, c: ['#3d8bff', '#0a4cf0'] },
  { y: .66, a: .12, s: .09, c: ['#0a2a8a', '#030a26'] },
], '#f2f3f5', 1 / 24);
bands(document.querySelector('.wave'), [
  { y: .3, a: .14, s: .12, c: ['#e3f1ff', '#bcdcff'] },
  { y: .5, a: .16, s: -.1, c: ['#1f6bff', '#0a4fe8'] },
], '#f2f3f5', 1 / 24);

// scattered pencil dashes, same every load
document.querySelectorAll('svg.dashes').forEach((svg, i) => {
  let seed = 7 + i * 31;
  const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const [x0, x1] = svg.dataset.x.split(',').map(Number), [y0, y1] = svg.dataset.y.split(',').map(Number);
  let out = '';
  for (let n = +svg.dataset.n; n--;) {
    const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), a = (-60 + r() * 50) * Math.PI / 180, l = 3 + r() * 5;
    const col = r() < .2 ? '#1c1f26' : r() < .3 ? '#3b6ff5' : '#9aa1ad';
    out += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + Math.cos(a) * l).toFixed(1)}" y2="${(y + Math.sin(a) * l).toFixed(1)}" stroke="${col}"/>`;
  }
  svg.innerHTML = out;
});

// home page only (the updates page has no download section)
if (document.getElementById('get')) {
// the dotted arrow from the folder fills in as the section scrolls into view (a mask path grows along it)
const flow = document.getElementById('flow'), get = document.getElementById('get');
let FL = 1;
const setFlow = (W, H, x, y) => {
  const cx = W / 2, lx = Math.max(60, x - W * .3);
  const d = `M${cx} 0C${cx} ${H * .34} ${lx} ${H * .28} ${lx} ${H * .55}S${x - 170} ${y + 6} ${x - 24} ${y}`;
  const svg = flow.ownerSVGElement;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.querySelectorAll('path').forEach(p => p.setAttribute('d', d));
  svg.querySelector('.flow-head').setAttribute("d", `M${x - 38} ${y - 11}L${x - 24} ${y}L${x - 37} ${y + 12}`);
  FL = flow.getTotalLength() + 40;
  fill();
};
const fill = () => {
  const r = get.getBoundingClientRect();
  const p = still ? 1 : Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight * .8)));
  flow.style.strokeDasharray = `${FL * p} ${FL}`;
};
addEventListener('scroll', fill, { passive: true });

// "Click me" in blue squares; click: they scatter, regroup as "Good choice", then the login page opens
(() => {
  const cv = document.querySelector('.squares'), ctx = cv.getContext('2d'), btn = document.getElementById('press');
  let W, H, sq = [], box, mouse = { x: -1e4, y: -1e4 }, burstUntil = 0, open = false, running = false, onScreen = false;
  const build = () => {
    const DPR = Math.min(2, devicePixelRatio || 1);
    W = cv.clientWidth; H = cv.clientHeight;
    if (!W || !H) return;
    cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const size = Math.max(30, Math.min(70, W * .058)), step = Math.max(3, Math.round(size / 17));
    const o = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    o.canvas.width = W; o.canvas.height = H;
    o.font = `700 ${size}px Geist, Arial, sans-serif`; o.textBaseline = 'middle';
    const w1 = o.measureText('Click me').width, w2 = o.measureText('Good choice').width;
    // text starts where the arrow ends (path end 560/1000, 230/300 of the arrow box)
    // canvas overhangs the section: ox/oy turn section coords into canvas coords
    const SW = get.clientWidth, SH = flow.ownerSVGElement.clientHeight, ox = (W - SW) / 2, oy = 160;
    const sx = Math.min(SW * .5, SW - Math.max(w1, w2) - 24), sy = SH * .78, x = sx + ox, y = sy + oy;
    setFlow(SW, SH, sx, sy);
    const sample = s => {
      o.clearRect(0, 0, W, H); o.fillText(s, x, y);
      const d = o.getImageData(0, 0, W, H).data, out = [];
      for (let py = 0; py < H; py += step) for (let px = 0; px < W; px += step) if (d[(py * W + px) * 4 + 3] > 128) out.push([px, py]);
      return out.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
    };
    const A = sample('Click me'), B = sample('Good choice'), n = Math.max(A.length, B.length);
    box = { x: x - 10, y: y - size * .7, w: Math.max(w1, w2) + 20, h: size * 1.4 };
    Object.assign(btn.style, { left: box.x - ox + 'px', top: box.y - oy + 'px', width: box.w + 'px', height: box.h + 'px' });
    sq = [];
    for (let i = 0; i < n; i++) {
      const a1 = A[Math.floor(i * A.length / n)], a2 = B[Math.floor(i * B.length / n)];
      sq.push({ x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0, a1, a2, t: open ? a2 : a1 });
    }
    if (still) sq.forEach(d => { [d.x, d.y] = d.t; });
  };
  const frame = () => {
    ctx.clearRect(0, 0, W, H);
    const now = performance.now();
    ctx.fillStyle = '#2f66f0';
    for (const d of sq) {
      if (now > burstUntil) {
        d.vx += (d.t[0] - d.x) * .06; d.vy += (d.t[1] - d.y) * .06;
        const mx = d.x - mouse.x, my = d.y - mouse.y, md = mx * mx + my * my;
        if (md < 5000) { const f = (5000 - md) / 5000 * 1.4; d.vx += mx / Math.sqrt(md + 1) * f; d.vy += my / Math.sqrt(md + 1) * f; }
      }
      const damp = now < burstUntil ? .93 : .78;
      d.vx *= damp; d.vy *= damp; d.x += d.vx; d.y += d.vy;
      ctx.fillRect(d.x - 1.5, d.y - 1.5, 3, 3);
    }
    if (onScreen && !still) requestAnimationFrame(frame); else running = false;
  };
  const kick = () => { if (!running) { running = true; requestAnimationFrame(frame); } };
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; if (onScreen) kick(); }).observe(cv);
  cv.parentElement.addEventListener('mousemove', e => { const r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  cv.parentElement.addEventListener('mouseleave', () => { mouse.x = mouse.y = -1e4; });
  // click: squares regroup as "Good choice", then the login page opens
  btn.addEventListener('click', () => {
    if (open) return;
    open = true;
    burstUntil = performance.now() + 800;
    const ox = box.x + box.w / 2, oy = box.y + box.h / 2;
    for (const d of sq) {
      d.t = d.a2;
      const a = Math.atan2(d.y - oy, d.x - ox) + (Math.random() - .5) * 1.2, s = 6 + Math.random() * 16;
      d.vx = Math.cos(a) * s; d.vy = Math.sin(a) * s;
    }
    if (still) sq.forEach(d => { [d.x, d.y] = d.t; });
    btn.textContent = 'Good choice';
    setTimeout(() => { location.href = 'login.html'; }, 2000);
  });
  document.fonts.ready.then(() => { build(); kick(); new ResizeObserver(() => { build(); kick(); }).observe(cv); });
})();
}

// footer wordmark spans the full width
const wm = document.getElementById('wordmark');
const fitWord = () => {
  const w = wm.parentElement.clientWidth - 48;
  wm.style.fontSize = '100px'; wm.style.display = 'inline-block';
  const k = w / wm.offsetWidth; wm.style.display = ''; wm.style.fontSize = 100 * k + 'px';
};
if (wm) { document.fonts.ready.then(fitWord); addEventListener('resize', fitWord); }

// Updates list: version.json is the same file the app checks, so a new entry shows on the site and in the app
(async () => {
  const list = document.getElementById('u-list');
  if (!list) return;
  const en = x => (typeof x === 'string' ? x : x?.en ?? '');
  const esc = t => String(t).replace(/[&<>"]/g, c => `&#${c.charCodeAt(0)};`);
  try {
    const { updates = [] } = await (await fetch('version.json', { cache: 'no-store' })).json();
    list.innerHTML = updates.map(u => `<li>
      <div class="u-meta"><span class="u-ver">v${esc(u.version)}</span><time datetime="${esc(u.date)}">${esc(new Date(u.date + 'T12:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }))}</time></div>
      <h3>${esc(en(u.title))}</h3>${u.image ? `<img class="u-shot" src="${esc(u.image)}" alt="" loading="lazy">` : ''}
      <ul>${(u.notes ?? []).map(n => `<li>${esc(en(n))}</li>`).join('')}</ul></li>`).join('') || '<li class="u-empty">No updates yet.</li>';
  } catch {
    list.innerHTML = '<li class="u-empty">Updates could not be loaded. Refresh the page to try again.</li>';
  }
})();

// signed in (login.js stores the session): the nav button shows your avatar and name and opens the dashboard
(() => {
  const cta = document.querySelector('.nav-cta');
  let s = null;
  try { s = JSON.parse(localStorage.getItem('vateko.session') || 'null'); } catch {}
  if (!cta || !s) return;
  const name = s.name || s.handle || 'Dashboard';
  const av = document.createElement('span');
  av.className = 'nav-av';
  const AUTO = ['#ef4444', '#f59e0b', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899']; // same as the app and dashboard
  av.style.setProperty('--av', s.color || AUTO[[...String(s.handle || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % AUTO.length]);
  av.textContent = name.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  cta.href = 'dashboard.html';
  cta.classList.add('is-me');
  if (/^https:/.test(s.avatar || '')) { av.style.backgroundImage = `url("${s.avatar.replace(/"/g, '')}")`; av.classList.add('img'); }
  cta.setAttribute('aria-label', `${name}, open your dashboard`);
  cta.title = name;
  cta.replaceChildren(av);
})();
