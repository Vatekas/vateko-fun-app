// Local accounts: one JSON file, passwords stored only as scrypt hashes.
const crypto = require('crypto');
const fs = require('fs');

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HANDLE = /^[a-z0-9_]{3,30}$/;
const read = file => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return {}; } };
const hash = (password, salt) => crypto.scryptSync(password, salt, 64).toString('hex');
const clean = email => String(email ?? '').trim().toLowerCase();
const cleanHandle = handle => String(handle ?? '').trim().replace(/^@/, '').toLowerCase();

function register(file, { email, password, handle, name }) {
  email = clean(email);
  handle = cleanHandle(handle);
  name = String(name ?? '').trim();
  password = String(password ?? '');
  if (!EMAIL.test(email)) return { error: 'email' };
  if (password.length < 8) return { error: 'password' };
  if (!HANDLE.test(handle)) return { error: 'handle' };
  if (!name || name.length > 40) return { error: 'name' };
  const users = read(file);
  if (users[email]) return { error: 'exists' };
  if (Object.values(users).some(u => u.handle === handle)) return { error: 'handleTaken' };
  const salt = crypto.randomBytes(16).toString('hex');
  users[email] = { handle, name, salt, hash: hash(password, salt), created: Date.now() };
  // write then rename, so a crash never leaves a half-written accounts file
  fs.writeFileSync(file + '.tmp', JSON.stringify(users, null, 2));
  fs.renameSync(file + '.tmp', file);
  return { ok: true, name, handle };
}

function login(file, { email, password }) {
  const user = read(file)[clean(email)];
  const ok = user && crypto.timingSafeEqual(Buffer.from(hash(String(password ?? ''), user.salt), 'hex'), Buffer.from(user.hash, 'hex'));
  return ok ? { ok: true, name: user.name, handle: user.handle ?? '' } : { error: 'credentials' };
}

const exists = (file, email) => Boolean(read(file)[clean(email)]);
const profile = (file, email) => { const u = read(file)[clean(email)]; return u ? { name: u.name, handle: u.handle ?? '' } : null; };

module.exports = { register, login, exists, profile };
