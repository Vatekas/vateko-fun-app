// Blocked account: the main menu blurs behind a card with the reason, who blocked it and a Log out button.
// main.js checks my_status() right after sign-in and every minute, and sends 'ban' when a founder blocks this account.
(() => {
  const L = (lt, en) => (localStorage.lang === 'en' ? en : lt);
  const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const css = `
    .ban-wall{position:fixed;inset:0;z-index:2147483647;border-radius:12px;overflow:hidden;display:grid;place-items:center;padding:24px;background:rgba(6,8,14,.55);backdrop-filter:blur(22px) saturate(.8);animation:ban-in .35s ease}
    @keyframes ban-in{from{opacity:0}}
    .ban-card{width:min(420px,100%);display:grid;justify-items:center;gap:12px;text-align:center;padding:34px 30px 28px;border-radius:24px;background:rgba(22,24,32,.92);color:#fff;border:1px solid rgba(255,255,255,.08);box-shadow:0 40px 90px -30px #000}
    .ban-ico{width:64px;height:64px;border-radius:50%;display:grid;place-items:center;background:rgba(255,72,96,.14);color:#ff5a72}
    .ban-ico svg{width:30px;height:30px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
    .ban-card h2{font-size:22px;font-weight:700;margin:4px 0 0}
    .ban-card p{margin:0;color:rgba(255,255,255,.7);font-size:14px;line-height:1.5}
    .ban-why{width:100%;text-align:left;padding:14px 16px;border-radius:14px;background:rgba(255,255,255,.06);display:grid;gap:4px;margin-top:6px}
    .ban-why small{color:rgba(255,255,255,.5);font-size:12px}
    .ban-why b{font-weight:500;font-size:14px;color:#fff;white-space:pre-wrap;word-break:break-word}
    .ban-out{margin-top:8px;width:100%;font:inherit;font-weight:600;font-size:14px;padding:12px;border:0;border-radius:12px;background:#fff;color:#0b1020;cursor:pointer}
    .ban-out:hover{background:#e8ebf2}`;
  function show(b) {
    if (!b || document.querySelector('.ban-wall')) return;
    const st = document.createElement('style');
    st.textContent = css;
    document.head.append(st);
    const when = b.at ? new Date(b.at).toLocaleDateString(localStorage.lang === 'en' ? 'en-GB' : 'lt-LT', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
    const wall = document.createElement('div');
    wall.className = 'ban-wall';
    wall.setAttribute('role', 'alertdialog');
    wall.setAttribute('aria-modal', 'true');
    wall.setAttribute('aria-labelledby', 'ban-t');
    wall.innerHTML = `<div class="ban-card">
      <span class="ban-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/></svg></span>
      <h2 id="ban-t">${L('Jūs gavote blokavimą', 'Your account is blocked')}</h2>
      <p>${L('Šia paskyra naudotis nebegalima. Jei manai, kad tai klaida, susisiek su Vateko.fun.', "This account can't be used anymore. If you think this is a mistake, contact Vateko.fun.")}</p>
      <div class="ban-why"><small>${L('Priežastis', 'Reason')}</small><b>${esc(b.reason)}</b></div>
      <div class="ban-why"><small>${L('Užblokavo', 'Blocked by')}</small><b>${esc(b.by)}${when ? ` · ${esc(when)}` : ''}</b></div>
      <button class="ban-out" id="ban-out">${L('Atsijungti', 'Log out')}</button>
    </div>`;
    document.body.append(wall);
    // nothing behind the card can be reached by keyboard either
    for (const el of document.body.children) if (el !== wall && el.tagName !== 'SCRIPT') el.inert = true;
    document.getElementById('ban-out').addEventListener('click', () => api.logout());
    document.getElementById('ban-out').focus();
  }
  api.ban().then(show);
  api.onBan(show);
})();
