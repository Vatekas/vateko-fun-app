const $ = s => document.querySelector(s);

const FLAGS = {
  lt: '<svg class="flag" viewBox="0 0 18 12" aria-hidden="true"><path fill="#FDB913" d="M0 0h18v4H0z"/><path fill="#006A44" d="M0 4h18v4H0z"/><path fill="#C1272D" d="M0 8h18v4H0z"/></svg>',
  en: '<svg class="flag" viewBox="0 0 60 30" aria-hidden="true"><clipPath id="gb"><path d="M30 15h30v15zv15H0zH0V0zV0h30z"/></clipPath><path fill="#012169" d="M0 0h60v30H0z"/><path stroke="#fff" stroke-width="6" d="M0 0l60 30m0-30L0 30"/><path stroke="#C8102E" stroke-width="4" clip-path="url(#gb)" d="M0 0l60 30m0-30L0 30"/><path stroke="#fff" stroke-width="10" d="M30 0v30M0 15h60"/><path stroke="#C8102E" stroke-width="6" d="M30 0v30M0 15h60"/></svg>',
};

const T = {
  lt: {
    langName: 'Lietuvių', signIn: 'Prisijungti', createAccount: 'Sukurti paskyrą',
    step1: 'Žingsnis 1 iš 2', step2: 'Žingsnis 2 iš 2',
    loginTitle: 'Tavo muzika, tavo taisyklės', loginSub: 'Prisijunk ir tęsk ten, kur baigei.',
    joinTitle: 'Prisijunk prie Vateko.Fun', joinSub: 'Susikurk paskyrą ir pradėk kurti savo muzikos biblioteką.',
    nameTitle: 'Susikurk profilį', nameSub: 'Pasirink unikalų slapyvardį ir rodomą vardą.',
    email: 'El. paštas', password: 'Slaptažodis', confirm: 'Pakartok slaptažodį', name: 'Rodomas vardas',
    codeLabel: 'Patvirtinimo kodas', handle: 'Slapyvardis (@handle)', handleHint: '3–30 mažųjų raidžių, skaičių arba apatinių brūkšnių.',
    emailPh: 'tavo@pastas.lt', pwPh: 'Bent 8 simboliai', pwLoginPh: 'Tavo slaptažodis', pw2Ph: 'Pakartok slaptažodį', namePh: 'Pvz. Vatekas',
    continue: 'Tęsti', create: 'Sukurti paskyrą', login: 'Prisijungti', back: 'Atgal',
    terms: 'Tęsdamas sutinki su <u>Naudojimo sąlygomis</u> ir <u>Privatumo politika</u>.',
    rLen: 'Bent 8 simboliai', rCase: 'Didžioji ir mažoji raidė', rNum: 'Bent vienas skaičius', rSym: 'Specialus simbolis (!@#…)',
    show: 'Rodyti slaptažodį', min: 'Sumažinti', max: 'Išdidinti', restore: 'Atkurti', close: 'Uždaryti',
    eEmail: 'Įvesk teisingą el. pašto adresą.', ePassword: 'Slaptažodis turi būti bent 8 simbolių.',
    eConfirm: 'Slaptažodžiai nesutampa.', eName: 'Įvesk rodomą vardą.',
    eHandle: 'Slapyvardis turi būti 3–30 mažųjų raidžių, skaičių arba _.', eHandleTaken: 'Šis slapyvardis jau užimtas.',
    verifyTitle: 'Patvirtink el. paštą', verifySub: 'Įvesk 8 skaitmenų kodą, kurį išsiuntėme į {email}.', verify: 'Patvirtinti',
    resend: 'Siųsti kodą dar kartą', resent: 'Naujas kodas išsiųstas.', eCode: 'Neteisingas arba pasibaigęs kodas.', eRate: 'Per daug bandymų. Palauk minutę ir bandyk vėl.',
    eConfirmMail: 'Patvirtink paskyrą: nuoroda išsiųsta į tavo el. paštą.', eNetwork: 'Nepavyko susisiekti su serveriu. Patikrink internetą.', eRequired: 'Įvesk slaptažodį.',
    eExists: 'Paskyra su šiuo el. paštu jau yra. Prisijunk.', eCredentials: 'Neteisingas el. paštas arba slaptažodis.',
  },
  en: {
    langName: 'English', signIn: 'Sign in', createAccount: 'Create account',
    step1: 'Step 1 of 2', step2: 'Step 2 of 2',
    loginTitle: 'Your music, your way', loginSub: 'Sign in and pick up right where you left off.',
    joinTitle: 'Join Vateko.Fun', joinSub: 'Create an account and start building your personal library.',
    nameTitle: 'Set up your profile', nameSub: 'Choose your unique handle and display name.',
    email: 'Email', password: 'Password', confirm: 'Confirm password', name: 'Display name',
    codeLabel: 'Verification code', handle: 'Username (@handle)', handleHint: '3-30 lowercase characters, numbers or underscores.',
    emailPh: 'you@example.com', pwPh: 'At least 8 characters', pwLoginPh: 'Your password', pw2Ph: 'Repeat your password', namePh: 'e.g. Vatekas',
    continue: 'Continue', create: 'Create account', login: 'Sign in', back: 'Back',
    terms: 'By continuing, you agree to the <u>Terms of Service</u> and <u>Privacy Policy</u>.',
    rLen: 'At least 8 characters', rCase: 'Upper and lower case letter', rNum: 'At least one number', rSym: 'A special character (!@#…)',
    show: 'Show password', min: 'Minimize', max: 'Maximize', restore: 'Restore', close: 'Close',
    eEmail: 'Enter a valid email address.', ePassword: 'Password must contain at least 8 characters.',
    eConfirm: 'Passwords do not match.', eName: 'Enter your display name.',
    eHandle: 'Username must be 3-30 lowercase characters, numbers or underscores.', eHandleTaken: 'This username is already taken.',
    verifyTitle: 'Verify your email', verifySub: 'Enter the 8-digit code we sent to {email}.', verify: 'Verify',
    resend: 'Resend code', resent: 'A new code is on its way.', eCode: 'Wrong or expired code.', eRate: 'Too many attempts. Wait a minute and try again.',
    eConfirmMail: 'Confirm your account: we sent a link to your email.', eNetwork: 'Could not reach the server. Check your connection.', eRequired: 'Enter your password.',
    eExists: 'An account with this email already exists. Sign in.', eCredentials: 'Wrong email or password.',
  },
};

let lang = T[localStorage.lang] ? localStorage.lang : 'lt';
let mode = 'login';
const t = k => T[lang][k];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const serverDown = () => { Notify.toast('Serverio klaida', 'Kažkas nutiko mūsų pusėje. Bandyk vėliau.'); Notify.connection(); };

function render() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
  document.querySelectorAll('[data-tp]').forEach(el => { el.placeholder = t(el.dataset.tp); });
  document.querySelectorAll('[data-tl]').forEach(el => { el.title = t(el.dataset.tl); el.setAttribute('aria-label', el.title); });
  document.querySelectorAll('.eye').forEach(el => el.setAttribute('aria-label', t('show')));
  document.querySelectorAll('[data-show]').forEach(el => { el.hidden = !el.dataset.show.split(' ').includes(mode); });
  document.querySelectorAll('[role=tab]').forEach(el => el.setAttribute('aria-selected', el.dataset.mode === (mode === 'login' ? 'login' : 'register1')));
  $('#lang-cur').innerHTML = `${FLAGS[lang]}`;
  $('#lang-cur').insertAdjacentText('beforeend', ` ${t('langName')}`);
  document.querySelectorAll('#lang-menu li').forEach(li => {
    li.innerHTML = FLAGS[li.dataset.lang];
    li.insertAdjacentText('beforeend', T[li.dataset.lang].langName);
    li.setAttribute('aria-selected', li.dataset.lang === lang);
  });
  $('#step').textContent = t(mode === 'register2' ? 'step2' : 'step1');
  $('#title').textContent = t({ login: 'loginTitle', register1: 'joinTitle', register2: 'nameTitle', verify: 'verifyTitle' }[mode]);
  $('#sub').textContent = t({ login: 'loginSub', register1: 'joinSub', register2: 'nameSub', verify: 'verifySub' }[mode]).replace('{email}', $('#email').value.trim());
  $('#submit').textContent = t({ login: 'login', register1: 'continue', register2: 'create', verify: 'verify' }[mode]);
  $('#terms').innerHTML = t('terms');
  $('#pw').autocomplete = mode === 'login' ? 'current-password' : 'new-password';
  $('#pw').placeholder = t(mode === 'login' ? 'pwLoginPh' : 'pwPh');
  strengthLine();
}

function setMode(m) {
  mode = m;
  clearErrors();
  render();
  if (m === 'register2' && !$('#handle').value) {
    // suggest a handle and display name from the email, like Liner does
    const guess = $('#email').value.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30);
    $('#handle').value = guess;
    $('#name').value ||= guess;
  }
  if (m === 'verify') boxes.forEach(b => { b.value = ''; });
  (m === 'register2' ? $('#handle') : m === 'verify' ? boxes[0] : $('#email')).focus();
}

function clearErrors() {
  $('#form-err').textContent = '';
  $('#form-err').classList.remove('info');
  document.querySelectorAll('input').forEach(el => el.removeAttribute('aria-invalid'));
}

// like Liner: every visible field turns red, one message below them
function fail(key, focusId) {
  document.querySelectorAll('#form .field:not([hidden]) input').forEach(el => el.setAttribute('aria-invalid', 'true'));
  $('#form-err').textContent = t(key);
  if (focusId) $('#' + focusId).focus();
  return false;
}

function validate() {
  clearErrors();
  const email = $('#email').value.trim(), pw = $('#pw').value;
  if (mode === 'register2') {
    if (!/^[a-z0-9_]{3,30}$/.test($('#handle').value)) return fail('eHandle', 'handle');
    return $('#name').value.trim() ? true : fail('eName', 'name');
  }
  if (!EMAIL.test(email)) return fail('eEmail', 'email');
  if (mode === 'login' && !pw) return fail('eRequired', 'pw');
  if (mode === 'register1' && pw.length < 8) return fail('ePassword', 'pw');
  if (mode === 'register1' && $('#pw2').value !== pw) return fail('eConfirm', 'pw2');
  return true;
}

$('#form').addEventListener('submit', async e => {
  e.preventDefault();
  if (!validate()) return;
  const btn = $('#submit');
  btn.disabled = true;
  try {
    const email = $('#email').value, password = $('#pw').value;
    if (mode === 'register1') {
      if (await api.exists(email)) { fail('eExists', 'email'); return; }
      setMode('register2');
      return;
    }
    if (mode === 'verify') {
      const code = boxes.map(b => b.value).join('');
      if (code.length < boxes.length) { fail('eCode', 'c0'); return; }
      const res = await api.verify({ email, token: code });
      if (res.ok) { location.href = 'bar.html'; return; }
      if (res.error === 'network') serverDown();
      fail(res.error === 'network' ? 'eNetwork' : 'eCode', 'c0');
      return;
    }
    const res = mode === 'login'
      ? await api.login({ email, password })
      : await api.register({ email, password, handle: $('#handle').value, name: $('#name').value });
    // e-mail not confirmed yet: ask for the code from the e-mail (login also sends a fresh one)
    if (res.error === 'confirm') {
      if (mode === 'login') await api.resend(email);
      setMode('verify');
      return;
    }
    if (res.ok) { location.href = 'bar.html'; return; }
    if (res.error === 'exists') { setMode('register1'); fail('eExists', 'email'); return; }
    if (res.error === 'handle' || res.error === 'handleTaken') { fail(res.error === 'handle' ? 'eHandle' : 'eHandleTaken', 'handle'); return; }
    if (res.error === 'network') serverDown();
    fail({ email: 'eEmail', password: 'ePassword', name: 'eName', confirm: 'eConfirmMail', network: 'eNetwork' }[res.error] ?? 'eCredentials');
  } finally {
    btn.disabled = false;
  }
});

document.querySelectorAll('[role=tab]').forEach(tab => tab.addEventListener('click', () => setMode(tab.dataset.mode)));
$('#back').addEventListener('click', () => setMode('register1'));
$('#form').addEventListener('input', clearErrors);

// 8 code boxes (Supabase OTP length): type, backspace back, paste the whole code at once
const boxes = [...document.querySelectorAll('#code input')];
boxes.forEach((b, i) => {
  b.addEventListener('input', () => {
    b.value = b.value.replace(/\D/g, '').slice(-1);
    if (b.value && boxes[i + 1]) boxes[i + 1].focus();
    if (boxes.every(x => x.value)) $('#form').requestSubmit();
  });
  b.addEventListener('keydown', e => { if (e.key === 'Backspace' && !b.value && boxes[i - 1]) boxes[i - 1].focus(); });
  b.addEventListener('paste', e => {
    const digits = (e.clipboardData.getData('text').match(/\d/g) ?? []).slice(0, boxes.length);
    if (!digits.length) return;
    e.preventDefault();
    digits.forEach((d, k) => { boxes[k].value = d; });
    boxes[Math.min(digits.length, boxes.length) - 1].focus();
    if (digits.length === boxes.length) $('#form').requestSubmit();
  });
});
$('#resend').addEventListener('click', async () => {
  const res = await api.resend($('#email').value);
  clearErrors();
  if (res.ok) { $('#form-err').classList.add('info'); $('#form-err').textContent = t('resent'); }
  else { if (res.error === 'network') serverDown(); fail(res.error === 'rate' ? 'eRate' : 'eNetwork'); }
});
$('#pw').addEventListener('input', strengthLine);

// 0 empty, 1 weak, 2 medium, 3 strong
function strength(pw) {
  if (!pw) return 0;
  const points = (pw.length >= 8) + (pw.length >= 12) + (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) + /\d/.test(pw) + /[^A-Za-z0-9]/.test(pw);
  return pw.length < 8 || points <= 2 ? 1 : points === 3 ? 2 : 3;
}
function strengthLine() {
  const level = strength($('#pw').value);
  $('#strength').dataset.level = level;
  $('#strength').setAttribute('aria-valuenow', level);
  const pw = $('#pw').value;
  const met = { len: pw.length >= 8, case: /[a-z]/.test(pw) && /[A-Z]/.test(pw), num: /\d/.test(pw), sym: /[^A-Za-z0-9]/.test(pw) };
  document.querySelectorAll('#reqs li').forEach(li => li.classList.toggle('ok', met[li.dataset.r]));
  $('#reqs').classList.toggle('done', Object.values(met).every(Boolean)); // all met: list folds away
  $('#pw').dataset.level = mode === 'register1' ? level : 0; // sign-in keeps the plain blue ring
}
$('#handle').addEventListener('input', e => { e.target.value = e.target.value.toLowerCase(); });


document.querySelectorAll('.eye').forEach(eye => {
  eye.innerHTML = '<svg class="open" viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>' +
    '<svg class="shut" viewBox="0 0 24 24"><path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6C3.7 8.5 2 12 2 12s3.5 7 10 7c1.8 0 3.4-.5 4.8-1.3M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';
  eye.addEventListener('click', () => {
    const input = $('#' + eye.getAttribute('aria-controls'));
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    eye.setAttribute('aria-pressed', show);
  });
});

const menu = $('#lang-menu'), langBtn = $('#lang-btn');
const toggleMenu = open => { menu.hidden = !open; langBtn.setAttribute('aria-expanded', open); };
langBtn.addEventListener('click', e => { e.stopPropagation(); toggleMenu(menu.hidden); });
menu.addEventListener('click', e => {
  const li = e.target.closest('li');
  if (!li) return;
  lang = localStorage.lang = li.dataset.lang;
  toggleMenu(false);
  render();
});
document.addEventListener('click', () => toggleMenu(false));
document.addEventListener('keydown', e => { if (e.key === 'Escape') toggleMenu(false); });

document.querySelectorAll('[data-win]').forEach(b => b.addEventListener('click', () => window.api?.win(b.dataset.win)));
window.api?.onMaximized(max => {
  document.documentElement.classList.toggle('max', max);
  $('[data-win=max]').dataset.tl = max ? 'restore' : 'max';
  render();
});

render();
$('#email').focus();

// ---- dot-matrix sky: value-noise clouds drawn as LED dots, drifting slowly ----
const sky = $('#sky');
const ctx = sky.getContext('2d');
const GAP = 7, DOT = 3;
const small = document.createElement('canvas');
const sctx = small.getContext('2d');
const tile = document.createElement('canvas');
tile.width = tile.height = GAP;
const tctx = tile.getContext('2d');
tctx.beginPath(); tctx.arc(GAP / 2, GAP / 2, DOT, 0, Math.PI * 2); tctx.fill();
let mask, cols, rows, img, vw, vh, ox, oy;

const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
const fade = v => v * v * (3 - 2 * v);
const lerp = (a, b, v) => a + (b - a) * v;
const smooth = (a, b, v) => fade(Math.min(1, Math.max(0, (v - a) / (b - a))));
function noise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), u = fade(x - xi), v = fade(y - yi);
  return lerp(lerp(hash(xi, yi), hash(xi + 1, yi), u), lerp(hash(xi, yi + 1), hash(xi + 1, yi + 1), u), v);
}
function fbm(x, y) {
  let s = 0, a = 0.5;
  for (let o = 0; o < 5; o++) { s += a * noise(x, y); x *= 2; y *= 2; a *= 0.5; }
  return s;
}

function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 1.5); // phones: full retina density stutters the animation
  vw = sky.clientWidth;
  vh = sky.clientHeight;
  sky.width = vw * dpr;
  sky.height = vh * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // dots run edge to edge; the black frame (.screen overflow + radius) clips them like a wall
  cols = Math.ceil(vw / GAP);
  rows = Math.ceil(vh / GAP);
  ox = oy = 0;
  small.width = cols;
  small.height = rows;
  img = sctx.createImageData(cols, rows);
  mask = ctx.createPattern(tile, 'repeat');
}

function draw(time) {
  const drift = time / 1000 * 0.06;
  const d = img.data;
  for (let j = 0; j < rows; j++) {
    const ny = j / rows;
    // sky: deep blue on top, lighter towards the horizon
    const sr = lerp(22, 52, ny), sg = lerp(68, 112, ny), sb = lerp(196, 214, ny);
    for (let i = 0; i < cols; i++) {
      const n = fbm(i * 0.017 + drift, j * 0.026 + drift * 0.25);
      // clouds gather in the lower part, open sky above
      const c = smooth(0.49, 0.55, n + (ny - 0.45) * 0.35);
      const lit = smooth(0.5, 0.7, n + (ny - 0.45) * 0.2);
      const grain = 0.92 + hash(i, j) * 0.12;
      const k = (j * cols + i) * 4;
      d[k] = lerp(sr, lerp(140, 248, lit), c) * grain;
      d[k + 1] = lerp(sg, lerp(172, 250, lit), c) * grain;
      d[k + 2] = lerp(sb, lerp(222, 255, lit), c) * grain;
      d[k + 3] = 255;
    }
  }
  sctx.putImageData(img, 0, 0);
  ctx.save();
  ctx.translate(ox, oy);
  ctx.clearRect(-ox, -oy, vw, vh);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(small, 0, 0, cols * GAP, rows * GAP);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.fillStyle = mask;
  ctx.fillRect(-ox, -oy, vw, vh);
  ctx.restore();
  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, vw, vh);
  ctx.globalCompositeOperation = 'source-over';
}

resize();
addEventListener('resize', () => { resize(); draw(performance.now()); });
if (matchMedia('(prefers-reduced-motion: reduce)').matches) draw(0);
else {
  let last = 0;
  const loop = now => {
    if (now - last > 50) { draw(now); last = now; } // ~20 fps is plenty for an LED look
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
