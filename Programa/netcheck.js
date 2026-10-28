// Connection checks for our own services only (shown in the "Ryšys nepavyko" dialog).
const dns = require('dns').promises;
const fs = require('fs');

async function timed(fn) {
  const t = Date.now();
  try {
    const detail = await fn();
    return { ok: true, ms: Date.now() - t, detail };
  } catch (e) {
    return { ok: false, ms: Date.now() - t, detail: e.message || String(e) };
  }
}

async function http(url, init = {}) {
  const r = await fetch(url, { ...init, signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return `HTTP ${r.status}`;
}

async function resolve(host) {
  const { address } = await dns.lookup(host);
  return address;
}

// isOnline: Electron's net.isOnline; supa: { url, anonKey } or null; source: library folder or null
async function run(isOnline, supa, source) {
  const checks = [['Įrenginys prisijungęs', async () => { if (!isOnline()) throw new Error('offline'); return 'online'; }]];
  if (supa) {
    const host = new URL(supa.url).host;
    const headers = { apikey: supa.anonKey, 'Content-Type': 'application/json' };
    checks.push(
      [`DNS · ${host}`, () => resolve(host)],
      ['Paskyrų serveris (Auth)', () => http(`${supa.url}/auth/v1/health`, { headers })],
      ['Duomenų bazė', () => http(`${supa.url}/rest/v1/rpc/handle_available`, { method: 'POST', headers, body: '{"h":"ping"}' })],
    );
  }
  checks.push(['Dainų žodžiai (lrclib.net)', () => http('https://lrclib.net/api/search?q=test')]);
  if (source) checks.push(['Grojimo šaltinis', async () => { await fs.promises.access(source, fs.constants.R_OK); return source; }]);
  checks.push(['DNS · vateko.fun', () => resolve('vateko.fun')], ['Svetainė vateko.fun', () => http('https://vateko.fun', { method: 'HEAD' })]);
  return Promise.all(checks.map(async ([name, fn]) => ({ name, ...(await timed(fn)) })));
}

function report(results, when = new Date()) {
  const ok = results.filter(r => r.ok).length;
  return [`Vateko.Fun ryšio ataskaita · ${when.toISOString()}`, `${ok} iš ${results.length} patikrų sėkmingos`, '',
    ...results.map(r => `${r.ok ? 'OK  ' : 'FAIL'}  ${r.name} · ${r.ms}ms · ${r.detail}`)].join('\n');
}

module.exports = { run, report };
