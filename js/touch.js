// ===== Mobile touch controls: floating joystick (with dead zone) + attack / special / block / ultimate buttons =====
(function () {
  const wrap = document.getElementById('wrap');
  G.touchHeld = { l: 0, r: 0, u: 0, d: 0, blk: 0 };
  const isTouch = () => G.forceTouch || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || matchMedia('(pointer: coarse)').matches;

  const css = document.createElement('style');
  css.textContent = `
  #touch{position:absolute;inset:0;display:none;z-index:5;pointer-events:none;touch-action:none}
  #touch.on{display:block}
  #touch *{touch-action:none;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}
  #tzone{position:absolute;left:0;top:150px;width:600px;height:570px;pointer-events:auto}
  #tbase{position:absolute;width:210px;height:210px;margin:-105px 0 0 -105px;border-radius:50%;border:4px solid rgba(255,255,255,.45);background:rgba(0,0,0,.25);left:175px;top:555px;pointer-events:none}
  #tknob{position:absolute;width:96px;height:96px;margin:-48px 0 0 -48px;border-radius:50%;background:rgba(255,255,255,.55);border:4px solid #fff;left:175px;top:555px;pointer-events:none}
  .tb{position:absolute;width:112px;height:112px;margin:-56px 0 0 -56px;border-radius:50%;border:4px solid rgba(255,255,255,.85);background:rgba(20,20,35,.55);color:#fff;font:900 italic 24px Rubik,sans-serif;display:flex;align-items:center;justify-content:center;flex-direction:column;line-height:1;pointer-events:auto;box-shadow:0 4px 0 rgba(0,0,0,.5)}
  .tb small{font:800 12px Rubik,sans-serif;opacity:.85;margin-top:3px;font-style:normal}
  .tb.down{background:rgba(255,90,40,.85);transform:scale(.93)}
  .tb.sm{width:92px;height:92px;margin:-46px 0 0 -46px;font-size:18px}
  #tSP.down,#tSP.lock{background:rgba(160,80,255,.9)}
  #tULT.ready{background:rgba(255,211,77,.95);color:#000;animation:tpulse .6s infinite alternate}
  #tFAT{background:rgba(220,0,40,.9);display:none}
  @keyframes tpulse{to{box-shadow:0 0 30px #ffd34d}}
  #tPause{position:absolute;left:640px;top:128px;width:84px;height:40px;margin-left:-42px;border-radius:10px;border:3px solid #fff;background:rgba(0,0,0,.55);color:#fff;font:900 16px Rubik;display:flex;align-items:center;justify-content:center;pointer-events:auto}
  #rotate{position:fixed;inset:0;background:#0b0b12;color:#fff;z-index:99;display:none;align-items:center;justify-content:center;flex-direction:column;font:900 italic 26px Rubik,sans-serif;text-align:center;padding:20px}
  @media (orientation:portrait) and (pointer:coarse){#rotate{display:flex}}`;
  document.head.appendChild(css);

  const rot = document.createElement('div'); rot.id = 'rotate'; rot.innerHTML = '<div style="font-size:70px">📱↻</div>TURN YOUR PHONE SIDEWAYS<br><span style="font:600 16px Rubik;opacity:.7;margin-top:10px">Gods of The STL plays in landscape</span>'; document.body.appendChild(rot);

  const T = document.createElement('div'); T.id = 'touch';
  // attack diamond (MK layout: punches up-left, kicks down-right), plus SPECIAL modifier, BLOCK, THROW, ULT, FATALITY
  const B = [
    ['tFP', 'FP', 'J', 1000, 470], ['tBP', 'BP', 'I', 1120, 380], ['tFK', 'FK', 'K', 1120, 560], ['tBK', 'BK', 'L', 1240 - 10, 470],
    ['tBLK', 'BLOCK', '', 880, 610, 'sm'], ['tSP', 'SPECIAL', 'hold + attack', 880, 330, 'sm'], ['tTH', 'THROW', '', 1000, 640, 'sm'], ['tULT', 'ULT', '', 1000, 290, 'sm'], ['tFAT', 'FATALITY', '', 1000, 200, 'sm'],
  ];
  T.innerHTML = `<div id="tzone"></div><div id="tbase"></div><div id="tknob"></div><div id="tPause">❚❚</div>` +
    B.map(b => `<div class="tb ${b[5] || ''}" id="${b[0]}" style="left:${b[3]}px;top:${b[4]}px">${b[1]}${b[2] ? '<small>' + b[2] + '</small>' : ''}</div>`).join('');
  wrap.appendChild(T);
  const $ = id => document.getElementById(id);

  // convert screen point to 1280x720 game space
  function toGame(e) { const r = wrap.getBoundingClientRect(); return [(e.clientX - r.left) * 1280 / r.width, (e.clientY - r.top) * 720 / r.height]; }

  // ---------- joystick ----------
  let jId = null, jo = [175, 555]; const RAD = 95, DEAD = 0.3;
  const zone = $('tzone'), base = $('tbase'), knob = $('tknob');
  function setStick(dx, dy) {
    const m = Math.hypot(dx, dy), k = m > RAD ? RAD / m : 1; dx *= k; dy *= k;
    knob.style.left = (jo[0] + dx) + 'px'; knob.style.top = (jo[1] + dy) + 'px';
    const nx = dx / RAD, ny = dy / RAD, h = G.touchHeld;
    if (Math.hypot(nx, ny) < DEAD) { h.l = h.r = h.u = h.d = 0; return; } // radial dead zone
    h.l = nx < -0.38 ? 1 : 0; h.r = nx > 0.38 ? 1 : 0; h.u = ny < -0.55 ? 1 : 0; h.d = ny > 0.55 ? 1 : 0;
  }
  zone.addEventListener('pointerdown', e => { e.preventDefault(); if (jId !== null) return; jId = e.pointerId; try { zone.setPointerCapture(e.pointerId); } catch (_) {} jo = toGame(e); base.style.left = jo[0] + 'px'; base.style.top = jo[1] + 'px'; setStick(0, 0); });
  zone.addEventListener('pointermove', e => { if (e.pointerId !== jId) return; const p = toGame(e); setStick(p[0] - jo[0], p[1] - jo[1]); });
  const jEnd = e => { if (e.pointerId !== jId) return; jId = null; setStick(0, 0); };
  zone.addEventListener('pointerup', jEnd); zone.addEventListener('pointercancel', jEnd);

  // ---------- buttons ----------
  let spHeld = false;
  const MOT = { FP: [2, 6], BP: [4, 6], FK: [2, 4], BK: [2, 5, 2] }; // relative numpad motions for the 4 specials
  function attack(btn) {
    const g = G.game; if (!g) return;
    if (spHeld && MOT[btn]) { const c = g.fighters[0].ctrl; for (const d of MOT[btn]) c.hist.push({ d, f: c.frame }); }
    G.pushPress(btn);
  }
  function bind(id, down, up) {
    const el = $(id);
    el.addEventListener('pointerdown', e => { e.preventDefault(); down(); el.classList.add('down'); try { el.setPointerCapture(e.pointerId); } catch (_) {} try { navigator.vibrate && navigator.vibrate(12); } catch (_) {} });
    const end = e => { el.classList.remove('down'); up && up(); };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  }
  ['FP', 'BP', 'FK', 'BK'].forEach(b => bind('t' + b, () => attack(b)));
  bind('tBLK', () => G.touchHeld.blk = 1, () => G.touchHeld.blk = 0);
  bind('tSP', () => spHeld = true, () => spHeld = false);
  bind('tTH', () => G.pushPress('TH'));
  bind('tULT', () => G.pushPress('ULT'));
  bind('tFAT', () => G.pushPress('FAT'));
  $('tPause').addEventListener('pointerdown', e => { e.preventDefault(); G.game && G.game.togglePause(); });

  // ---------- show only during a fight on touch devices ----------
  setInterval(() => {
    const g = G.game, anyScreen = !!document.querySelector('.scr.on');
    const show = isTouch() && g && !anyScreen && g.phase !== 'matchEnd';
    T.classList.toggle('on', !!show);
    if (!show) { for (const k in G.touchHeld) G.touchHeld[k] = 0; spHeld = false; return; }
    const me = g.fighters[0];
    $('tULT').classList.toggle('ready', me.meter >= 100);
    $('tFAT').style.display = g.phase === 'finish' && g.winner === me ? 'flex' : 'none';
  }, 100);
})();
