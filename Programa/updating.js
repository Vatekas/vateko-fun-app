// In-app update: the main menu blurs behind the logo, "Updating" and a progress bar while the new version downloads;
// main.js then installs it silently and reopens the app. window.startUpdate(url) is used by Settings > About.
(() => {
  const L = (lt, en) => (localStorage.lang === 'en' ? en : lt);
  const css = `
    .upd-wall{position:fixed;inset:0;z-index:2147483647;border-radius:12px;overflow:hidden;display:grid;place-items:center;background:rgba(6,8,14,.5);backdrop-filter:blur(26px) saturate(.9);animation:upd-in .3s ease}
    .upd-wall.flat{backdrop-filter:none;background:#0a0b10}
    @keyframes upd-in{from{opacity:0}}
    .upd-card{display:grid;justify-items:center;gap:16px;color:#fff;text-align:center}
    .upd-logo{width:84px;height:84px;fill:#fff}
    .upd-logo rect{animation:upd-eq 1s ease-in-out infinite alternate;transform-origin:50% 100%;transform-box:fill-box}
    .upd-logo rect:nth-child(2){animation-delay:.15s}.upd-logo rect:nth-child(3){animation-delay:.3s}
    .upd-logo rect:nth-child(4){animation-delay:.45s}.upd-logo rect:nth-child(5){animation-delay:.6s}
    @keyframes upd-eq{to{transform:scaleY(.45)}}
    @media (prefers-reduced-motion:reduce){.upd-logo rect{animation:none}}
    .upd-card h2{margin:0;font-size:24px;font-weight:700;letter-spacing:-.01em}
    .upd-card p{margin:0;color:rgba(255,255,255,.65);font-size:14px}
    .upd-bar{width:260px;height:6px;border-radius:999px;background:rgba(255,255,255,.15);overflow:hidden}
    .upd-bar i{display:block;height:100%;width:0;border-radius:inherit;background:#fff;transition:width .2s}
    .upd-err{color:#ff8a9a!important}
    .upd-btn{font:inherit;font-weight:600;font-size:14px;padding:10px 18px;border:0;border-radius:10px;background:#fff;color:#0b1020;cursor:pointer}`;
  window.startUpdate = async url => {
    if (document.querySelector('.upd-wall')) return;
    const blur = (await api.settings())?.updBlur !== false; // Settings > About > Update background
    const st = document.createElement('style');
    st.textContent = css;
    document.head.append(st);
    const wall = document.createElement('div');
    wall.className = blur ? 'upd-wall' : 'upd-wall flat';
    wall.setAttribute('role', 'alertdialog');
    wall.setAttribute('aria-modal', 'true');
    wall.setAttribute('aria-labelledby', 'upd-t');
    wall.innerHTML = `<div class="upd-card">
      <svg class="upd-logo" viewBox="0 0 32 32" aria-hidden="true"><rect x="2" y="3" width="4" height="18" rx="2"/><rect x="8" y="7" width="4" height="18" rx="2"/><rect x="14" y="11" width="4" height="18" rx="2"/><rect x="20" y="7" width="4" height="18" rx="2"/><rect x="26" y="3" width="4" height="18" rx="2"/></svg>
      <h2 id="upd-t">${L('Atnaujinama', 'Updating')}</h2>
      <p id="upd-msg">${L('Atsisiunčiama nauja versija…', 'Downloading the new version…')}</p>
      <div class="upd-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div>
    </div>`;
    document.body.append(wall);
    for (const el of document.body.children) if (el !== wall && el.tagName !== 'SCRIPT') el.inert = true;
    const bar = wall.querySelector('.upd-bar'), msg = wall.querySelector('#upd-msg');
    api.onUpdateProgress(p => {
      bar.firstChild.style.width = `${Math.round(p * 100)}%`;
      bar.setAttribute('aria-valuenow', Math.round(p * 100));
      if (p >= 1) msg.textContent = L('Diegiama… Programa tuoj atsidarys iš naujo.', 'Installing… The app reopens in a moment.');
    });
    const r = await api.installUpdate(url);
    if (r?.error) {
      msg.textContent = L('Nepavyko atnaujinti. Patikrink internetą ir bandyk dar kartą.', "Couldn't update. Check your connection and try again.");
      msg.classList.add('upd-err');
      const b = document.createElement('button');
      b.className = 'upd-btn';
      b.textContent = L('Uždaryti', 'Close');
      b.onclick = () => { wall.remove(); st.remove(); for (const el of document.body.children) el.inert = false; };
      wall.querySelector('.upd-card').append(b);
      b.focus();
    }
  };
})();
