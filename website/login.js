// Log in / sign up against the same Supabase project as the app (Programa/cloud.js), so one account works in both
const { url, key } = window.SUPA;
const $ = id => document.getElementById(id);
const forms = { login: $('f-login'), signup: $('f-signup'), verify: $('f-verify') };
const ERR = {
  network: "Couldn't reach the server. Check your connection and try again.",
  credentials: 'Wrong email or password.',
  exists: 'An account with this email already exists. Log in instead.',
  handleTaken: 'This username is taken. Pick another one.',
  handle: 'Username: 3-30 lowercase letters, numbers or underscores.',
  password: 'Password must be at least 8 characters.',
  code: 'Wrong or expired code.',
  rate: 'Too many attempts. Wait a minute and try again.',
};
let pending = ''; // email waiting for its code

async function call(route, body) {
  try {
    const r = await fetch(url + route, {
      method: 'POST',
      // sb_publishable_ keys are not JWTs: send them only as apikey
      headers: { apikey: key, 'Content-Type': 'application/json', ...(key.startsWith('sb_') ? {} : { Authorization: `Bearer ${key}` }) },
      body: JSON.stringify(body),
    });
    return { ok: r.ok, status: r.status, j: await r.json().catch(() => ({})) };
  } catch {
    return { ok: false, status: 0, j: {} };
  }
}
const text = j => `${j.msg ?? ''} ${j.message ?? ''} ${j.error_description ?? ''} ${j.error_code ?? ''}`;

function show(name) {
  for (const [k, el] of Object.entries(forms)) el.hidden = k !== name;
  forms[name].querySelector('.auth-err')?.replaceChildren();
  forms[name].querySelector('input')?.focus();
}
function fail(form, code) { form.querySelector('.auth-err').textContent = ERR[code] ?? ERR.network; }
// blocked accounts never get a session on the website; the reason and who blocked it come from my_status()
async function blocked(access) {
  try {
    const r = await fetch(url + '/rest/v1/rpc/my_status', { method: 'POST', headers: { apikey: key, Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' }, body: '{}' });
    return r.ok ? (await r.json())?.ban ?? null : null;
  } catch { return null; }
}
function showBan(ban) {
  show('login');
  forms.login.querySelector('.auth-err').textContent = `This account is blocked. Reason: ${ban.reason} Blocked by ${ban.by}.`;
}
async function signedIn(r) {
  const ban = await blocked(r.j.access_token);
  if (ban) {
    fetch(url + '/auth/v1/logout', { method: 'POST', headers: { apikey: key, Authorization: `Bearer ${r.j.access_token}` } }).catch(() => {});
    return showBan(ban);
  }
  const meta = r.j.user?.user_metadata ?? {};
  localStorage.setItem('vateko.session', JSON.stringify({ refresh: r.j.refresh_token, name: meta.display_name ?? '', handle: meta.handle ?? '', avatar: meta.avatar_url ?? '', color: meta.color ?? '' }));
  render();
}
function render() {
  const s = JSON.parse(localStorage.getItem('vateko.session') || 'null');
  if (!s) return show(location.hash === '#signup' ? 'signup' : 'login');
  location.replace('dashboard.html');
}
function toVerify(email) { pending = email; $('v-mail').textContent = email; show('verify'); }

// buttons stay disabled while a request runs, so a double click can't send twice
function submit(form, fn) {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button');
    btn.disabled = true;
    form.querySelector('.auth-err').textContent = '';
    try { await fn(Object.fromEntries(new FormData(form))); } finally { btn.disabled = false; }
  });
}

submit(forms.login, async ({ email, password }) => {
  email = email.trim().toLowerCase();
  const r = await call('/auth/v1/token?grant_type=password', { email, password });
  if (r.status === 0 || r.status >= 500) return fail(forms.login, 'network');
  if (r.ok) return signedIn(r);
  if (/not confirmed/i.test(text(r.j))) { await call('/auth/v1/resend', { type: 'signup', email }); return toVerify(email); }
  fail(forms.login, r.status === 429 ? 'rate' : 'credentials');
});

submit(forms.signup, async ({ name, handle, email, password }) => {
  const f = forms.signup;
  email = email.trim().toLowerCase(); name = name.trim();
  handle = handle.trim().replace(/^@/, '').toLowerCase();
  if (!/^[a-z0-9_]{3,30}$/.test(handle)) return fail(f, 'handle');
  if (password.length < 8) return fail(f, 'password');
  const free = await call('/rest/v1/rpc/handle_available', { h: handle });
  if (free.status === 0) return fail(f, 'network');
  if (free.ok && free.j === false) return fail(f, 'handleTaken');
  const r = await call('/auth/v1/signup', { email, password, data: { handle, display_name: name } });
  if (!r.ok) {
    const t = text(r.j);
    return fail(f, r.status === 0 ? 'network' : r.status === 429 ? 'rate' : /already|exists/i.test(t) ? 'exists' : /password/i.test(t) ? 'password' : /database error/i.test(t) ? 'handleTaken' : 'network');
  }
  // with "Confirm email" on, an existing address comes back as a user without identities
  if (Array.isArray(r.j.user?.identities) && r.j.user.identities.length === 0) return fail(f, 'exists');
  if (r.j.refresh_token) return signedIn(r);
  toVerify(email);
});

submit(forms.verify, async ({ code }) => {
  const r = await call('/auth/v1/verify', { type: 'signup', email: pending, token: code.trim() });
  if (r.status === 0) return fail(forms.verify, 'network');
  if (!r.ok || !r.j.refresh_token) return fail(forms.verify, r.status === 429 ? 'rate' : 'code');
  signedIn(r);
});

$('resend').addEventListener('click', async e => {
  e.preventDefault();
  const r = await call('/auth/v1/resend', { type: 'signup', email: pending });
  forms.verify.querySelector('.auth-err').textContent = r.ok ? 'A new code is on its way.' : ERR[r.status === 429 ? 'rate' : 'network'];
});
document.querySelectorAll('[data-go]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); history.replaceState(null, '', '#' + a.dataset.go); show(a.dataset.go); }));
render();
// the dashboard sends blocked users back here with the reason
const kicked = sessionStorage.getItem('vateko.ban');
if (kicked) { sessionStorage.removeItem('vateko.ban'); try { showBan(JSON.parse(kicked)); } catch {} }
