// ===== Screens: gate, cutscene, username, lobby, settings, character select, confirm, stage select, pause, results =====
(function () {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const wrap = $('#wrap');
  function fit() { const s = Math.min(innerWidth / 1280, innerHeight / 720); wrap.style.transform = `translate(-50%,-50%) scale(${s})`; }
  addEventListener('resize', fit); fit();

  G.username = G.load('stl_username', '');
  G.played = new Set(G.load('stl_played', []));
  G.markPlayed = id => { G.played.add(id); G.save('stl_played', [...G.played]); };
  const allPlayed = () => G.ROSTER.every(c => G.played.has(c.id));

  let cur = 'gate', back = 'menu', p1 = null, lastBot = G.load('stl_lastbot', null), stageSel = null, hoverCh = null;
  function show(id) { $$('.scr').forEach(e => e.classList.remove('on')); if (id) $('#' + id).classList.add('on'); cur = id; }
  const click = (el, fn) => el.addEventListener('click', e => { G.sfx('select'); fn(e); });
  $$('.btn').forEach(b => b.addEventListener('mouseenter', () => G.sfx('hover')));

  // gate -> cutscene
  $('#gate').addEventListener('click', () => { G.audioInit(); G.startLoop(); show('cutscene'); G.Cutscene.start(afterCut); });
  const skip = () => G.Cutscene.skip();
  $('#cutscene').addEventListener('click', skip);
  addEventListener('keydown', e => { if (cur === 'cutscene' && (e.code === 'Enter' || e.code === 'Space' || e.code === 'Escape')) skip(); if (cur === 'nameScr' && e.code === 'Enter') confirmName(); });
  function afterCut() { G.music('lobby'); if (!G.username) openName(false); else openMenu(); }

  // username
  let renaming = false;
  function openName(re) { renaming = re; $('#nameIn').value = re ? G.username : ''; $('#nameMsg').textContent = re ? 'Pick a new name. (Unlocked by playing all 12 gods — it will lock again until you play them all once more.)' : 'Choose wisely. You can only change it after you\'ve played as all 12 gods.'; show('nameScr'); setTimeout(() => $('#nameIn').focus(), 50); }
  function confirmName() { const v = $('#nameIn').value.trim().replace(/[<>]/g, ''); if (!v) { $('#nameMsg').textContent = 'Type a username first.'; G.sfx('error'); return; }
    G.username = v.slice(0, 16); G.save('stl_username', G.username); if (renaming) { G.played = new Set(); G.save('stl_played', []); } G.sfx('confirm'); openMenu(); }
  click($('#nameOk'), confirmName);

  // main menu
  function openMenu() { G.game = null; G.music('lobby'); G.applyVolumes(); show('menu'); $('#welcome').textContent = 'WELCOME, ' + G.username.toUpperCase();
    const n = G.ROSTER.filter(c => G.played.has(c.id)).length; const lbl = $('#renameLbl'); lbl.textContent = allPlayed() ? 'CHANGE USERNAME' : `CHANGE USERNAME 🔒 ${n}/12`; lbl.parentElement.classList.toggle('lock', !allPlayed()); }
  $$('#menu .btn').forEach(b => click(b, () => { const a = b.dataset.act;
    if (a === '1v1') openSelect(); else if (a === 'settings') openSettings('menu');
    else if (a === 'rename') { if (allPlayed()) openName(true); else { G.sfx('error'); const left = G.ROSTER.filter(c => !G.played.has(c.id)).map(c => c.name).join(', '); $('#welcome').textContent = 'PLAY AS THESE GODS FIRST: ' + left; } }
    else if (a === 'exit') { show('bye'); G.music(null); try { window.close(); } catch (e) {} } }));
  click($('#byeBack'), openMenu);

  // settings
  const vol = (id, key, lab) => { const el = $(id); el.value = G.S[key]; $(lab).textContent = G.S[key]; el.oninput = () => { G.S[key] = +el.value; $(lab).textContent = el.value; G.saveSettings(); G.applyVolumes(); }; };
  function tog(id, key) { const el = $(id); const r = () => { el.textContent = G.S[key] ? 'ON' : 'OFF'; el.classList.toggle('on', !!G.S[key]); }; r(); el.onclick = () => { G.S[key] = !G.S[key]; G.saveSettings(); r(); G.sfx('select'); }; }
  function openSettings(from) { back = from; vol('#volLobby', 'lobbyVol', '#vLobby'); vol('#volGame', 'gameVol', '#vGame'); vol('#volSfx', 'sfxVol', '#vSfx'); vol('#diff', 'diff', '#vDiff'); tog('#togVoice', 'voice'); tog('#togBlood', 'blood'); tog('#togBoxes', 'boxes'); show('settings'); }
  click($('#setBack'), () => { if (back === 'pause') { show('pause'); if (G.game) G.game.bot.d = G.S.diff; } else openMenu(); });

  // character select
  const grid = $('#grid');
  G.ROSTER.forEach(ch => {
    const c = document.createElement('div'); c.className = 'cell'; c.innerHTML = `<canvas width="160" height="160"></canvas><div class="nm">${ch.name}</div>${G.played.has(ch.id) ? '<div class="done">✔</div>' : ''}`;
    G.drawPortrait(c.querySelector('canvas'), ch, 0); c.dataset.id = ch.id;
    c.addEventListener('mouseenter', () => { hoverCh = ch; info('#p1Info', ch, false); G.sfx('hover'); });
    click(c, () => pick(ch)); grid.appendChild(c);
  });
  function info(sel, ch, right) { $(sel).innerHTML = `<h2 style="color:${ch.glow}">${ch.name}</h2><div class="sub">${ch.title.toUpperCase()} · ${ch.code}</div><p>${ch.bio}</p><p><b>ULTIMATE:</b> ${ch.ult}</p>`; }
  function openSelect() { show('select'); p1 = null; $$('.cell').forEach(c => { c.classList.remove('sel'); const d = c.querySelector('.done'); if (G.played.has(c.dataset.id) && !d) c.insertAdjacentHTML('beforeend', '<div class="done">✔</div>'); });
    $('#p1Info').innerHTML = '<h2>PLAYER 1</h2><div class="sub">' + (G.username || '').toUpperCase() + '</div><p>Hover a god to read about them. Click to choose.</p>';
    $('#p2Info').innerHTML = '<h2>???</h2><div class="sub">THE BOT CHOOSES ITS OWN FIGHTER</div><p>It picks a different god every game.</p>'; }
  function pick(ch) { p1 = ch; $$('.cell').forEach(c => c.classList.toggle('sel', c.dataset.id === ch.id)); info('#p1Info', ch);
    G.say(ch.name, { pitch: 0.3, rate: 0.75 }); setTimeout(() => { $('#confirmTxt').textContent = 'CONTINUE AS ' + ch.name + '?'; show('confirm'); }, 650); }
  click($('#selBack'), openMenu);
  click($('#cNo'), () => { show('select'); });
  click($('#cYes'), openStage);
  click($('#selMoves'), () => openMoves(hoverCh || p1 || G.ROSTER[0], 'select'));

  // move list w/ frame data
  let movesBack = 'select';
  function openMoves(ch, from) { movesBack = from; $('#movesTitle').textContent = ch.name + ' — MOVE LIST'; const N = G.NORMALS, S = G.SPECIALS[ch.id], ins = G.INPUTS;
    const fd = d => d ? `<span class="fd">startup ${d.s} · active ${d.a} · recovery ${d.r}${typeof d.dmg === 'number' ? ' · dmg ' + d.dmg : d.dmg ? ' · dmg ' + d.dmg : ''}${d.bs != null && d.hb ? ' · on block ' + ((d.bs - d.r - d.a + 1) >= 0 ? '+' : '') + (d.bs - d.r - d.a + 1) : ''}</span>` : '';
    let h = `<b>SPECIALS</b><br>`; ['s1', 's2', 's3', 's4'].forEach((k, i) => { const d0 = S[k], d = typeof d0 === 'function' ? d0({ mode: 'command' }) : d0; h += `${ins[k]} — ${ch.sp[i]}<br>${fd(d)}<br>`; if (typeof d0 === 'function') { const w = d0({ mode: 'whip' }); h += `<i>Whip stance:</i> ${w.name}<br>${fd(w)}<br>`; } });
    h += `<br><b>ULTIMATE</b> — ${ins.ult}<br>${ch.ult}<br><br><b>FATALITY</b> — ${ins.fat} (during FINISH THEM)<br>Deletes the loser from existence.<br><br><b>NORMALS</b> (stand / crouch hold ↓ / air)<br>`;
    for (const k of ['FP', 'BP', 'FK', 'BK', 'dFP', 'dBP', 'dFK', 'dBK', 'jFP', 'jBP', 'jFK', 'jBK', 'TH']) { const d = N[k]; const key = k.replace(/^[dj]/, ''); h += `${k[0] === 'd' ? '↓+' : k[0] === 'j' ? 'air ' : ''}${key === 'TH' ? 'U' : G.KEYLBL[key]} ${d.name} [${d.lvl}]${d.chain.length ? ' → chains: ' + d.chain.join(', ') : ''}<br>${fd(d)}<br>`; }
    h += `<br><b>SYSTEM</b><br>Dash: → → · Backdash: ← ← (brief invincibility)<br>Double jump: ↑ in air · Fast fall: ↓ in air · Drop through platform: ↓<br>Block: O / Space (hold ↓ to block lows; overheads beat crouch block)<br>Tech: press Block right before you hit the floor or a wall<br>DI: hold a direction while launched to bend your trajectory<br>SDI: tap directions during hit-freeze to nudge yourself<br>Cancel: hit/block with a normal, then input a special or the next chain button<br>Throw break: press U as you get thrown<br>F2: hitboxes + live frame data`;
    $('#movelist').innerHTML = h; show('moves'); }
  click($('#movesBack'), () => movesBack === 'pause' ? show('pause') : show('select'));

  // stage select
  const sg = $('#stageGrid');
  const STG = [...G.STAGES, { id: 'random', name: '🎲 RANDOM PLANET' }];
  STG.forEach(st => { const d = document.createElement('div'); d.className = 'stg'; d.innerHTML = `<canvas width="250" height="120"></canvas><div>${st.name}</div>`; sg.appendChild(d);
    const cv = d.querySelector('canvas'); if (st.id === 'random') { const c2 = cv.getContext('2d'); c2.fillStyle = '#16163a'; c2.fillRect(0, 0, 250, 120); c2.font = '900 64px Rubik'; c2.fillStyle = '#f5c542'; c2.textAlign = 'center'; c2.fillText('?', 125, 84); } else G.drawStageThumb(cv, st);
    d.addEventListener('mouseenter', () => G.sfx('hover')); click(d, () => { stageSel = st.id === 'random' ? G.STAGES[(Math.random() * G.STAGES.length) | 0] : st; begin(); }); });
  function openStage() { G.sfx('confirm'); show('stage'); }

  function botPick() { let pool = G.ROSTER.filter(c => c.id !== lastBot && c.id !== p1.id); const c = pool[(Math.random() * pool.length) | 0]; lastBot = c.id; G.save('stl_lastbot', lastBot); return c; }
  function begin() {
    const bot = botPick(); show(null); G.audioInit();
    G.say(p1.name + ' versus ' + bot.name, { pitch: 0.3, rate: 0.8 });
    G.startMatch(p1.id, bot.id, stageSel); G.applyVolumes();
  }

  // pause + results
  G.ui = {
    pause(on) { if (on) show('pause'); else show(null); },
    results(won, fat) { show('results'); G.music('lobby'); G.applyVolumes(); },
  };
  $$('#pause .btn').forEach(b => click(b, () => { const a = b.dataset.p; const g = G.game; if (!g) return;
    if (a === 'resume') g.togglePause(); else if (a === 'moves') openMoves(g.fighters[0].ch, 'pause'); else if (a === 'settings') openSettings('pause'); else if (a === 'quit') { g.paused = false; openMenu(); } }));
  $$('#results .btn').forEach(b => click(b, () => { const a = b.dataset.r;
    if (a === 'again') { stageSel = stageSel || G.STAGES[0]; begin(); } else if (a === 'chars') openSelect(); else openMenu(); }));
})();
