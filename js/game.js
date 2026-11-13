// ===== Match engine: input, fixed-step loop, rounds, collisions, ultimates, fatality flow =====
(function () {
  const GY = () => G.GROUND;
  // ---------- keyboard + gamepad input (with stick dead zones) ----------
  const KEYMAP = { KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r', KeyW: 'u', ArrowUp: 'u', KeyS: 'd', ArrowDown: 'd', KeyO: 'blk', Space: 'blk' };
  const BTNMAP = { KeyJ: 'FP', KeyI: 'BP', KeyK: 'FK', KeyL: 'BK', KeyU: 'TH', KeyR: 'ULT', KeyF: 'FAT' };
  const kb = { l: 0, r: 0, u: 0, d: 0, blk: 0 }; const pendingPress = [];
  window.addEventListener('keydown', e => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (KEYMAP[e.code] || BTNMAP[e.code] || e.code === 'Escape' || e.code === 'KeyP') e.preventDefault();
    if (e.repeat) return;
    if (KEYMAP[e.code]) kb[KEYMAP[e.code]] = 1;
    if (BTNMAP[e.code]) pendingPress.push(BTNMAP[e.code]);
    if ((e.code === 'Escape' || e.code === 'KeyP') && G.game) G.game.togglePause();
    if (e.code === 'F2') { G.S.boxes = !G.S.boxes; G.saveSettings(); }
  });
  window.addEventListener('keyup', e => { if (KEYMAP[e.code]) kb[KEYMAP[e.code]] = 0; });
  window.addEventListener('blur', () => { for (const k in kb) kb[k] = 0; });
  const DEAD = 0.35; let padPrev = {};
  function pollPad(held) {
    const pads = navigator.getGamepads ? navigator.getGamepads() : []; const p = pads && [...pads].find(x => x); if (!p) return;
    let ax = p.axes[0] || 0, ay = p.axes[1] || 0; const mag = Math.hypot(ax, ay);
    if (mag < DEAD) { ax = 0; ay = 0; } else { const k = (mag - DEAD) / (1 - DEAD) / mag; ax *= k; ay *= k; } // radial dead zone, rescaled
    const b = i => p.buttons[i] && p.buttons[i].pressed;
    if (ax < -0.4 || b(14)) held.l = 1; if (ax > 0.4 || b(15)) held.r = 1; if (ay < -0.5 || b(12)) held.u = 1; if (ay > 0.5 || b(13)) held.d = 1; if (b(5)) held.blk = 1;
    const map = { 2: 'FP', 3: 'BP', 0: 'FK', 1: 'BK', 4: 'TH', 7: 'ULT', 6: 'FAT' };
    for (const i in map) { if (b(+i) && !padPrev[i]) pendingPress.push(map[i]); padPrev[i] = b(+i); }
    if (b(9) && !padPrev.s && G.game) G.game.togglePause(); padPrev.s = b(9);
  }

  const overlap = (a, b) => a[0] < b[0] + b[2] && a[0] + a[2] > b[0] && a[1] < b[1] + b[3] && a[1] + a[3] > b[1];

  class Game {
    constructor(p1, p2, stage) {
      this.stage = stage; stage.init(); G.FX.dustCol = stage.dust; G.FX.groundY = GY();
      this.fighters = [new G.Fighter(p1, 0, false), new G.Fighter(p2, 1, true)];
      for (const f of this.fighters) f.g = this;
      this.bot = new G.Bot(this.fighters[1], G.S.diff);
      this.wins = [0, 0]; this.round = 1; this.t = 0; this.cam = { x: 640, y: 360, z: 1 }; this.paused = false;
      this.hud = [0, 1].map(() => ({ ox: 0, oy: 0, vx: 0, vy: 0, rot: 0, vr: 0, cracks: 0, loose: 0, grab: false }));
      this.startRound();
    }
    overlap(a, b) { return overlap(a, b); }
    startRound() {
      const [a, b] = this.fighters; a.reset(400); b.reset(880); a.meter = a.meter || 0;
      this.projectiles = []; this.minions = []; this.vis = []; this.hazards = []; G.FX.clear();
      this.timer = 99 * 60; this.phase = 'intro'; this.pt = 0; this.ult = null; this.flood = 0; this.gray = 0; this.slowmo = 0; this.banner = null; this.lastAdv = null; this.advTrack = null;
      for (const h of this.hud) Object.assign(h, { ox: 0, oy: 0, vx: 0, vy: 0, rot: 0, vr: 0, cracks: 0, loose: 0, grab: false });
      G.music('game');
    }
    say(text, voice, col, size) { this.banner = { text, t: 0, col: col || '#fff', size: size || 120 }; if (voice !== false) G.say(voice || text); }
    togglePause() { if (!['fight', 'intro'].includes(this.phase) && !this.paused) return; this.paused = !this.paused; G.ui && G.ui.pause(this.paused); }
    cancelFlash(f) { G.FX.ring(f.x, f.y - 80, 70, '#38e1ff', 5, 12); }
    endSummon(f) { const m = f.summon; if (m) { m.dead = true; G.FX.dust(m.x, m.y, 8, 0.9); f.summon = null; } if (f.state === 'summoning') f.setState('idle'); }
    hudImpact(f) {
      const side = f.x < 640 ? 0 : 1, h = this.hud[side]; h.cracks++; G.sfx('crack'); G.FX.shake(10, 12); f.hp -= 3; f.lastHitBy && 0;
      G.FX.text(f.x, 260, 'UI DAMAGE!', '#ff3b3b', 30);
      for (let i = 0; i < 20; i++) G.FX.add({ k: 'debris', x: f.x + (Math.random() - 0.5) * 80, y: 220, vx: (Math.random() - 0.5) * 12, vy: -Math.random() * 6, s: 3 + Math.random() * 6, life: 50, t: 0, col: i % 2 ? '#fff' : '#ff3b3b', rot: 0, vr: 0.2 });
      if (h.cracks >= 2 && !h.loose) { h.loose = 220; h.vx = (side ? 1 : -1) * 2; h.vy = -4; h.vr = (side ? 1 : -1) * 0.04; }
      if (f.hp <= 0) this.onLethal(f, f.lastHitBy);
    }
    hudGrab(side) { this.hud[side].grab = true; }
    hudRelease(side) { const h = this.hud[side]; h.grab = false; h.cracks = 2; h.loose = 200; h.vy = 2; h.vx = 0; h.vr = 0.03; }
    startUltimate(f) {
      const def = f.sp.ult, o = f.opp; if (!def || this.ult || this.phase !== 'fight') return;
      this.ult = { f, o, t: 0, def }; f.meter = 0; f.move = null; f.setState('ultlock'); f.vx = 0; f.ultPose = 'cast2';
      if (f.summon) this.endSummon(f); if (o.summon) this.endSummon(o);
      o.move = null; o.forced = { t: 0, len: 1e9, fn: () => {} }; o.setState('forced'); o.status = {};
      this.projectiles.length = 0; G.sfx('ult'); G.say(def.name, { pitch: 0.45 }); G.FX.flash(8, f.ch.glow);
    }
    endUltimate() {
      const u = this.ult; if (!u) return; this.ult = null; const { f, o } = u;
      f.ultPose = null; if (f.state === 'ultlock') f.setState(f.onGround ? 'idle' : 'air');
      if (o.forced && o.forced.len > 1e8) { o.forced = null; o.noGrav = false; if (o.state === 'forced') o.setState(o.onGround ? 'idle' : 'air'); }
      o.dissolve = 0; this.flood = 0; this.gray = 0; this.aishaBar = null; this.screenTilt = 0; this.pantheonBeam = null;
      for (const h of this.hud) if (h.grab) { h.grab = false; }
    }
    onLethal(def, att) {
      if (def.ch.id === 'sean' && !def.undyingUsed && this.phase === 'fight') {
        def.undyingUsed = true; def.hp = 1; def.invuln = 90; G.FX.text(def.x, def.y - 200, 'UNDYING!', '#cfe0ff', 44, 80); G.FX.flash(10, '#cfe0ff'); G.sfx('rewind'); G.FX.ring(def.x, def.y - 80, 160, '#cfe0ff', 8, 30); return;
      }
      def.hp = 0; if (this.phase !== 'fight') return;
      if (this.ult) this.endUltimate();
      this.koFighter(def);
    }
    koFighter(loser, time) {
      const w = this.fighters[1 - loser.side]; this.phase = 'ko'; this.pt = 0; this.winner = w; this.loser = loser;
      loser.forced = null; loser.move = null; if (loser.summon) this.endSummon(loser); if (w.summon) this.endSummon(w);
      if (!time) { if (loser.state !== 'launch') { loser.vx = (loser.x > w.x ? 1 : -1) * 9; loser.vy = -10; loser.onGround = false; loser.setState('launch'); loser.stun = 999; } this.slowmo = 70; G.FX.impact(6, loser.x, loser.y - 90); G.sfx('ko'); }
      this.say(time ? 'TIME!' : 'K.O.', time ? 'Time' : 'K O', '#ff3b3b', 160);
    }
    // ---------- main update ----------
    update() {
      if (this.paused) return;
      this.t++; this.pt++; G.hype = Math.max(0, (G.hype || 0) - 1);
      if (this.banner) this.banner.t++;
      const [a, b] = this.fighters;
      // inputs
      const held = Object.assign({}, kb); pollPad(held); a.ctrl.held = held;
      while (pendingPress.length) a.ctrl.press(pendingPress.shift());
      if (this.phase === 'fight' || this.phase === 'finish') { this.bot.update(this); if (this.p1bot) this.p1bot.update(this); }
      if (this.slowmo > 0) { this.slowmo--; if (this.slowmo % 3) { G.FX.update(); return; } }
      for (const f of this.fighters) f.ctrl.tick(f.face);

      switch (this.phase) {
        case 'intro':
          if (this.pt === 1) this.say('ROUND ' + this.round, 'Round ' + this.round, '#ffd34d');
          if (this.pt === 80) this.say('FIGHT!', 'Fight!', '#ff3b3b', 170);
          if (this.pt >= 100) this.phase = 'fight';
          for (const f of this.fighters) { f.ctrl.buf.length = 0; f.update(this); }
          break;
        case 'fight': this.simulate(); if (!this.ult) { this.timer--; if (this.timer <= 0) { const l = a.hp === b.hp ? b : (a.hp < b.hp ? a : b); this.koFighter(l, true); } } break;
        case 'ko':
          this.simulate(true);
          if (this.pt === 110) {
            const w = this.winner; this.wins[w.side]++;
            if (this.wins[w.side] >= 2) { // FINISH THEM
              const l = this.loser; l.hp = Math.max(l.hp, 0); l.x = Math.max(200, Math.min(1080, l.x)); l.y = GY(); l.onGround = true; l.vx = l.vy = 0; l.spin = 0; l.setState('dizzy'); l.forced = null; l.dead = false;
              w.setState('idle'); this.phase = 'finish'; this.pt = 0; this.say('FINISH THEM!', 'Finish them!', '#ff3b3b', 120); this.projectiles.length = 0;
            } else { this.phase = 'roundEnd'; this.pt = 0; this.say(w.ch.name + ' WINS', w.ch.name + ' wins', '#ffd34d', 90); w.setState('victory'); }
          }
          break;
        case 'roundEnd': this.simulate(true); if (this.pt > 130) { this.round++; this.startRound(); } break;
        case 'finish': {
          const w = this.winner, c = w.ctrl;
          let fat = c.take('FAT', 20) || (c.has('FP', 8) >= 0 && c.motion(['D', 'F', 'D'], 34) && c.take('FP'));
          if (w.isBot && this.pt === 70 && Math.random() < 0.7) fat = true;
          c.buf = c.buf.filter(e => !['FP', 'BP', 'FK', 'BK', 'TH', 'ULT'].includes(e.b));
          if (fat) { this.phase = 'fatality'; this.pt = 0; w.move = null; w.setState('ultlock'); w.ultPose = 'raise'; G.sfx('glitch'); G.applyVolumes(); break; }
          this.simulate(true);
          if (this.pt > 330) this.endMatch(false);
          break;
        }
        case 'fatality': {
          const l = this.loser, w = this.winner;
          for (const f of this.fighters) f.update(this);
          if (this.pt < 110 && this.pt % 14 === 0) G.sfx('glitch');
          if (this.pt >= 110 && this.pt < 330) { const prog = (this.pt - 110) / 220; l.dissolve = prog; if (this.pt % 3 === 0) G.sfx('tick'); const sk = G.skel(G.POSES.dizzy, l.face, 0), keys = Object.keys(sk).filter(k => Array.isArray(sk[k])); const k = keys[(Math.random() * keys.length) | 0]; G.FX.pixels(l.x + sk[k][0], l.y + sk[k][1], 3, [l.ch.col, l.ch.acc, '#fff'][this.pt % 3]); }
          if (this.pt === 330) { l.dissolve = 1; l.dead = true; G.sfx('corrupt'); G.FX.shake(20, 40); G.FX.flash(10, '#ff0040'); }
          if (this.pt === 360) { this.say('FATALITY', 'Fatality', '#ff0040', 150); }
          if (this.pt > 470) this.endMatch(true);
          G.FX.update(); for (const v of this.vis) v.t++;
          break;
        }
        case 'matchEnd': for (const f of this.fighters) f.update(this); G.FX.update(); break;
      }
      this.updHud(); this.updCam();
    }
    endMatch(fatality) {
      this.phase = 'matchEnd'; this.pt = 0; const w = this.winner; if (!w.dead) w.setState('victory'); w.ultPose = null;
      if (!fatality) this.say(w.ch.name + ' WINS', w.ch.name + ' wins', '#ffd34d', 100);
      G.markPlayed && G.markPlayed(this.fighters[0].ch.id);
      setTimeout(() => G.ui && G.ui.results(w.side === 0, fatality), 1400);
    }
    simulate(noHazard) {
      const fs = this.fighters, [a, b] = fs;
      if (this.ult) { const u = this.ult; u.t++; if (u.t > 70) u.def.run(this, u.f, u.o, u.t - 70); if (u.t - 70 >= u.def.len) this.endUltimate(); }
      for (const f of fs) { if (f.status.slow && this.t % 2 && !this.ult) { f.ctrl.tick && 0; continue; } f.update(this); if (f.state === 'dash' || f.state === 'launch' || f.state === 'ultlock') { if (this.t % 2 === 0) { f.after.push({ x: f.x, y: f.y, spin: f.spin, st: f.state, life: 10 }); } } for (const t of f.after) t.life--; f.after = f.after.filter(t => t.life > 0); }
      // body push
      if (a.onGround && b.onGround && !a.forced && !b.forced && Math.abs(a.x - b.x) < 44 && a.state !== 'knockdown' && b.state !== 'knockdown') { const d = (44 - Math.abs(a.x - b.x)) / 2, s = a.x < b.x ? -1 : 1; a.x += s * d; b.x -= s * d; }
      if (this.ult) { this.updMisc(); return; }
      // melee hits
      for (const f of fs) {
        const hb = f.activeHitbox(); if (!hb) continue; const o = f.opp, d = f.move.def;
        if (!f.move.hits.has(o.id) && overlap(hb, o.hurtbox())) {
          f.move.hits.add(o.id);
          if (d.throw && o.ctrl.has('TH', 10) >= 0) { o.ctrl.take('TH'); G.FX.text((f.x + o.x) / 2, f.y - 180, 'THROW BREAK', '#fff', 28); f.vx = -f.face * 9; o.vx = f.face * 9; G.sfx('block'); f.move.connected = true; continue; }
          const h = { dmg: typeof d.dmg === 'number' ? d.dmg : (d.hitDmg || 2), hs: d.hs, bs: d.bs, push: d.push, kb: d.kb, kbg: d.kbg, ang: d.ang, lvl: d.lvl || 'mid', heavy: d.heavy, launch: d.launch, knockdown: d.knockdown, spike: d.spike, throw: d.throw, unblockable: d.unblockable, onHit: d.onHit, col: f.ch.glow };
          const r = G.applyHit(f, o, h, this, f.x, hb[1] + hb[3] / 2);
          if (r === 'hit' || r === 'block') this.advTrack = { a: f, d: o, name: d.name, block: r === 'block' };
        }
        for (const m of this.minions) if (m.owner !== f && !m.dead && !f.move.hits.has('m' + m.x) && overlap(hb, [m.x - m.w / 2, m.y - m.h, m.w, m.h])) { m.hp -= (typeof d.dmg === 'number' ? d.dmg : 3) * 1.5; f.move.hits.add('m' + m.x); G.FX.hitBurst(m.x, m.y - m.h / 2, 0.6, f.face, '#fff'); G.sfx('hit', 0.6); f.hitstop = 4; }
      }
      // projectiles
      for (const p of this.projectiles) {
        p.t++; if (p.update) p.update(p, this); else { p.vy += p.grav || 0; p.x += p.vx; p.y += p.vy; if (p.bounce && p.y > GY() - p.h / 2) { p.y = GY() - p.h / 2; p.vy *= -0.6; p.vx *= 0.85; } }
        if (p.t >= p.life || p.x < -200 || p.x > 1480) { p.dead = true; continue; }
        if (p.inactive) continue;
        const box = [p.x - p.w / 2, p.y - p.h / 2, p.w, p.h], o = p.owner.opp;
        if (!o.dead && overlap(box, o.hurtbox()) && (!p.hitT[o.id] || (p.rehit && this.t - p.hitT[o.id] > p.rehit))) {
          p.hitT[o.id] = this.t; const r = G.applyHit(p.owner, o, Object.assign({ proj: true }, p.hit), this, p.x - (p.vx || 0), p.y);
          if (r !== 'miss') { if (r === 'hit' && p.onHit) p.onHit(p, o, this); if (!p.pierce) p.dead = true; }
        }
        for (const m of this.minions) if (m.owner !== p.owner && !m.dead && overlap(box, [m.x - m.w / 2, m.y - m.h, m.w, m.h])) { m.hp -= p.hit.dmg * 1.5; G.FX.hitBurst(m.x, m.y - m.h / 2, 0.5, 1, '#fff'); if (!p.pierce) p.dead = true; }
      }
      for (let i = 0; i < this.projectiles.length; i++) for (let j = i + 1; j < this.projectiles.length; j++) { const p = this.projectiles[i], q = this.projectiles[j];
        if (p.owner !== q.owner && !p.dead && !q.dead && !p.noClash && !q.noClash && !p.inactive && !q.inactive && overlap([p.x - p.w / 2, p.y - p.h / 2, p.w, p.h], [q.x - q.w / 2, q.y - q.h / 2, q.w, q.h])) { p.dead = q.dead = true; G.FX.hitBurst((p.x + q.x) / 2, (p.y + q.y) / 2, 0.8, 1, '#fff'); G.FX.text((p.x + q.x) / 2, p.y - 40, 'CLASH!', '#fff', 26); G.sfx('block'); } }
      this.projectiles = this.projectiles.filter(p => !p.dead);
      // minions
      for (const m of this.minions) if (!m.dead) m.update(m, this); this.minions = this.minions.filter(m => !m.dead);
      // hazards
      if (!noHazard && this.stage.hazard) this.stage.hazard(this, this.t);
      for (const h of this.hazards) { h.t++; if (h.t < h.warn) continue; h.x += h.vx; h.y += h.vy; h.vy += h.grav; if (h.bounce && h.y > GY() - 13) { h.y = GY() - 13; h.vy *= -0.7; }
        if (h.kind === 'ice' && h.y > GY() - 25) { h.life = 0; G.FX.dust(h.x, GY(), 5, 0.6, 0, '#e8f6ff'); }
        if (h.kind === 'meteor' && h.y > GY() - 20) { h.life = 0; G.FX.landDust(h.x, GY(), 2.2); G.FX.shake(12, 14); G.sfx('heavy'); for (const f of fs) if (Math.abs(f.x - h.x) < 120 && f.onGround) G.applyHit(null, f, { dmg: h.dmg, hs: 24, kb: 12, kbg: 4, ang: 70, launch: true, heavy: true, col: '#ff8a2a' }, this, h.x, GY() - 40); }
        const box = this.hazBox(h);
        for (const f of fs) { const last = h.hit[f.id]; if ((last == null || (h.tick && this.t - last > 15)) && overlap(box, f.hurtbox())) { h.hit[f.id] = this.t; G.applyHit(null, f, { dmg: h.dmg, hs: 20, bs: 10, kb: h.kb, kbg: 3, ang: h.ang, launch: h.kb > 9, unblockable: h.kind === 'bolt' || h.kind === 'rad', col: '#ffd34d' }, this, h.x - (h.vx || 0) * 3, f.y - 80); if (h.kind === 'rad') G.FX.text(f.x, f.y - 170, '☢', '#7f7', 30, 20); } }
        if (h.t === h.warn && h.kind === 'bolt') { G.sfx('thunder'); G.FX.flash(4); G.FX.dust(h.x, GY(), 8, 1.2); }
      }
      this.hazards = this.hazards.filter(h => h.t < h.life && h.x > -400 && h.x < 1700);
      this.updMisc();
      // frame advantage tracker
      const at = this.advTrack; if (at) { if (!at.aT && at.a.actionable()) at.aT = this.t; if (!at.dT && at.d.actionable()) at.dT = this.t; if (at.aT && at.dT) { this.lastAdv = { name: at.name, v: at.dT - at.aT, block: at.block }; this.advTrack = null; } if (this.t - (at.t0 || (at.t0 = this.t)) > 200) this.advTrack = null; }
    }
    updMisc() { for (const v of this.vis) v.t++; this.vis = this.vis.filter(v => v.t < v.life); G.FX.update(); }
    hazBox(h) {
      if (h.kind === 'bolt' || h.kind === 'rad') return [h.x - h.w / 2, 0, h.w, GY()];
      if (h.kind === 'car') return [h.x - 85, h.y - 38, 170, 90];
      if (h.kind === 'moose') return [h.x - 65, h.y, 130, 110];
      return [h.x - h.w / 2, h.y - h.h / 2, h.w, h.h];
    }
    updHud() {
      for (let s = 0; s < 2; s++) { const h = this.hud[s];
        if (h.loose > 0) { h.loose--; h.vy += 0.5; h.ox += h.vx; h.oy += h.vy; h.rot += h.vr; if (h.oy > 640) { h.oy = 640; h.vy *= -0.3; h.vr *= 0.5; } if (h.loose === 0) { Object.assign(h, { ox: 0, oy: 0, vx: 0, vy: 0, rot: 0, vr: 0, cracks: 0 }); G.FX.text(s ? 1000 : 280, 120, 'CTRL+Z', '#7ff3ff', 26, 40); G.sfx('select'); } }
      }
    }
    updCam() {
      const [a, b] = this.fighters, c = this.cam; const dist = Math.abs(a.x - b.x);
      let z = Math.max(1, Math.min(1.32, 1280 / (dist + 760))); if (this.phase === 'ko' && this.pt < 70) z = 1.45; if (this.phase === 'fatality') z = 1.2; if (this.ult && this.ult.t < 70) z = 1.4;
      const focus = this.phase === 'ko' && this.pt < 70 ? this.loser : this.ult && this.ult.t < 70 ? this.ult.f : null;
      let cx = focus ? focus.x : (a.x + b.x) / 2; const vw = 1280 / z; cx = Math.max(vw / 2, Math.min(1280 - vw / 2, cx));
      let cy = 660 - 300 / z; const top = Math.min(a.y, b.y) - 190; if (top < cy - 360 / z + 60) cy = top + 360 / z - 60; cy = Math.min(cy, 660 - 300 / z);
      c.z += (z - c.z) * 0.08; c.x += (cx - c.x) * 0.12; c.y += (cy - c.y) * 0.12;
    }
  }
  G.Game = Game;

  // ---------- loop ----------
  let last = 0, acc = 0;
  function loop(ts) {
    requestAnimationFrame(loop);
    const dt = Math.min(100, ts - (last || ts)); last = ts; acc += dt;
    const g = G.game;
    while (acc >= 1000 / 60) { acc -= 1000 / 60; if (g) g.update(); else if (G.idleUpdate) G.idleUpdate(); }
    if (g) g.draw(G.ctx); else if (G.idleDraw) G.idleDraw(G.ctx);
  }
  G.startLoop = () => { G.cv = document.getElementById('cv'); G.ctx = G.cv.getContext('2d'); requestAnimationFrame(loop); };
  G.startMatch = function (p1, p2, stage) { G.game = new Game(G.byId(p1), G.byId(p2), stage); };
})();
