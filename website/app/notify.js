// Error toast + "Ryšys nepavyko" dialog. Use: Notify.toast(title, text[, ok]), Notify.connection(); ok = green check instead of the red X
(() => {
  const X = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 3l6 6M9 3 3 9"/></svg>';
  const OK = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="m2.5 6.2 2.3 2.3L9.5 3.8"/></svg>';
  const icon = d => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
  const esc = t => String(t).replace(/[&<>"]/g, c => `&#${c.charCodeAt(0)};`);
  document.body.insertAdjacentHTML('beforeend', `
    <div class="n-toast" id="n-toast" role="alert" tabindex="0" hidden><span class="n-x">${X}</span><div class="n-txt"><span class="n-in" id="n-in"></span></div></div>
    <div class="n-overlay" id="n-overlay" hidden>
      <div class="n-card" role="dialog" aria-modal="true" aria-labelledby="n-title">
        <button class="n-close" id="n-close" aria-label="Uždaryti" title="Uždaryti">${icon('M18 6 6 18M6 6l12 12')}</button>
        <div class="n-head"><span class="n-badge">${icon('M2 2l20 20M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5.17-2.8M19 13a10 10 0 0 0-2.27-1.7M2 8.82a15 15 0 0 1 4.17-2.65M22 8.82A15 15 0 0 0 11.06 5.07M12 20h.01')}</span>
          <div><h2 id="n-title">Ryšys nepavyko</h2><p>Vateko.Fun negali pasiekti savo serverių. Tavo paskyra ir nustatymai saugūs.</p></div></div>
        <h3>Greiti sprendimai</h3>
        <ul class="n-tips">
          <li>Patikrink, ar veikia Wi-Fi arba laidas ir ar naršyklėje atsidaro puslapiai.</li>
          <li>Minutei išjunk VPN, proxy ar DNS filtrus: jie dažnai blokuoja programą.</li>
          <li>Leisk Vateko.Fun per ugniasienę ir antivirusinės tinklo apsaugą.</li>
          <li>Perkrauk maršrutizatorių ir paspausk „Bandyti dar“.</li>
        </ul>
        <div class="n-checks"><div class="n-sum" id="n-sum">Ryšio patikra · dar nevykdyta</div><ul class="n-list" id="n-list"></ul></div>
        <div class="n-actions">
          <button class="n-btn main" id="n-retry">Bandyti dar</button>
          <button class="n-btn" id="n-copy">${icon('M8 8h11v11H8zM5 16V5h11')}Kopijuoti ataskaitą</button>
          <button class="n-btn" id="n-save">${icon('M12 4v11m-5-5 5 5 5-5M5 20h14')}Išsaugoti ataskaitą</button>
        </div>
        <p class="n-foot">Išsaugotą ataskaitą gali prisegti, kai kreipsiesi pagalbos.</p>
      </div>
    </div>`);
  const $ = id => document.getElementById(id);
  const toastEl = $('n-toast'), overlay = $('n-overlay'), retry = $('n-retry');
  let hideTimer, reportText = '';

  // one state at a time: 'idle' (hidden), 'shown', 'held' (finger / mouse on it), 'leaving' (sliding away)
  let state = 'idle', leaveTimer, startY = 0, dy = 0;
  const place = (y, op, anim) => {
    toastEl.classList.toggle('snap', anim);
    toastEl.style.setProperty('--dy', `${y}px`);
    toastEl.style.setProperty('--op', String(op));
  };
  const autoHide = ms => { clearTimeout(hideTimer); hideTimer = setTimeout(dismiss, ms); };
  function toast(title, text, ok = false) {
    clearTimeout(leaveTimer);
    toastEl.classList.toggle('ok', ok);
    toastEl.querySelector('.n-x').innerHTML = ok ? OK : X;
    $('n-in').innerHTML = `<b>${esc(title)}</b>${text ? ` <span>· ${esc(text)}</span>` : ''}`;
    toastEl.classList.remove('drag');
    toastEl.hidden = false;
    place(0, 1, false);
    // replays the drop-in animation for every new message
    toastEl.style.animation = 'none'; void toastEl.offsetWidth; toastEl.style.animation = '';
    state = 'shown';
    // long text scrolls inside the pill (measured after layout)
    requestAnimationFrame(() => {
      const box = toastEl.querySelector('.n-txt'), inner = $('n-in'), shift = box.clientWidth - inner.scrollWidth;
      box.classList.toggle('scroll', shift < 0);
      box.style.setProperty('--shift', `${shift}px`);
      box.style.setProperty('--dur', `${Math.max(6, -shift / 25)}s`);
    });
    autoHide(ok ? 3500 : 7000);
  }
  function dismiss() {
    if (state === 'idle' || state === 'leaving') return;
    clearTimeout(hideTimer);
    state = 'leaving';
    toastEl.classList.remove('drag');
    place(-80, 0, true);
    leaveTimer = setTimeout(() => { toastEl.hidden = true; toastEl.classList.remove('snap'); state = 'idle'; }, 260);
  }
  // grab and swipe up to dismiss; it only moves up, never sideways. A tap closes it (an error tap opens the details).
  toastEl.addEventListener('pointerdown', e => {
    if (state !== 'shown' || e.button !== 0) return;
    e.preventDefault(); // no text selection / native drag that would swallow the pointerup
    state = 'held'; startY = e.clientY; dy = 0;
    clearTimeout(hideTimer);
    toastEl.setPointerCapture(e.pointerId);
    toastEl.classList.add('drag');
  });
  toastEl.addEventListener('pointermove', e => {
    if (state !== 'held') return;
    dy = Math.min(0, e.clientY - startY);
    place(dy, Math.max(0, 1 + dy / 80), false);
  });
  const release = tap => {
    if (state !== 'held') return;
    toastEl.classList.remove('drag');
    state = 'shown';
    if (dy < -30) return dismiss();
    if (tap && Math.abs(dy) < 4) { const err = !toastEl.classList.contains('ok'); dismiss(); if (err) connection(); return; }
    place(0, 1, true); // not far enough: back in place, then hides by itself
    autoHide(4000);
  };
  toastEl.addEventListener('pointerup', () => release(true));
  // capture lost (window lost focus, alt-tab, OS took the mouse): never leave it stuck half-dragged
  toastEl.addEventListener('pointercancel', () => release(false));
  toastEl.addEventListener('lostpointercapture', () => release(false));
  addEventListener('blur', () => release(false));
  toastEl.addEventListener('keydown', e => { if (e.key === 'Escape' || e.key === 'Delete') dismiss(); });

  async function runChecks() {
    retry.disabled = true; retry.textContent = 'Tikrinama…';
    try {
      const { results, report } = await window.api.netChecks();
      reportText = report;
      const ok = results.filter(r => r.ok).length;
      $('n-sum').textContent = `${ok} iš ${results.length} patikrų sėkmingos · ${new Date().toLocaleTimeString('lt-LT')}`;
      $('n-list').innerHTML = results.map(r => `<li class="${r.ok ? '' : 'fail'}"><i></i><b>${esc(r.name)} <span>· ${r.ms}ms</span></b><em>${r.ok ? 'ok' : 'klaida'}</em><small>${esc(r.detail)}</small></li>`).join('');
      return ok === results.length;
    } catch {
      $('n-sum').textContent = 'Ryšio patikros paleisti nepavyko';
      return false;
    } finally {
      retry.disabled = false; retry.textContent = 'Bandyti dar';
    }
  }
  function connection() {
    if (!overlay.hidden) return;
    overlay.hidden = false;
    retry.focus();
    runChecks();
  }
  const close = () => { overlay.hidden = true; };
  $('n-close').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !overlay.hidden) close(); });
  retry.addEventListener('click', async () => { if (await runChecks()) close(); });
  $('n-copy').addEventListener('click', async () => { if (!reportText) await runChecks(); await window.api.copyReport(reportText); $('n-copy').lastChild.textContent = 'Nukopijuota'; setTimeout(() => { $('n-copy').lastChild.textContent = 'Kopijuoti ataskaitą'; }, 1500); });
  $('n-save').addEventListener('click', async () => { if (!reportText) await runChecks(); await window.api.saveReport(reportText); });

  // internet drops: say it right away
  addEventListener('offline', () => { toast('Nėra interneto', 'Patikrink ryšį, programa jungsis automatiškai.'); connection(); });
  addEventListener('online', () => { close(); });

  window.Notify = { toast, connection, dismiss };
})();
