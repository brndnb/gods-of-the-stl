// ===== Match rendering: camera, fighters, block visuals, HUD (destructible), banners, ult cut-ins, debug boxes, fatality post-fx =====
(function () {
  const GY = () => G.GROUND, P = G.POSES;
  const C = (ctx, x, y, r, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, 7); ctx.fill(); };
  const ease = k => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;

  function poseOf(f, g) {
    const t = g.t + f.id * 37, base = f.onGround ? P.idle : (f.vy < 0 ? P.jump : P.fall);
    switch (f.state) {
      case 'idle': { const p = Object.assign({}, P.idle); p.uaF += Math.sin(t * 0.08) * 3; p.t += Math.sin(t * 0.08) * 1.5; return p; }
      case 'walk': return G.walkPose(t * 0.25, 1);
      case 'dash': return P.dash;
      case 'crouch': return P.crouch;
      case 'block': return P.block;
      case 'cblock': return P.cblock;
      case 'blockstun': return f.cbs ? P.cblock : P.block;
      case 'jumpsquat': case 'land': return P.squat;
      case 'air': return f.vy < 0 ? P.jump : P.fall;
      case 'hitstun': return f.hitLow ? P.hitlow : P.hit;
      case 'launch': case 'forced': return P.hit;
      case 'knockdown': case 'ko': return P.down;
      case 'getup': return G.lerpPose(P.down, P.idle, ease(Math.min(1, f.st / 16)));
      case 'tech': return P.crouch;
      case 'dizzy': { const p = Object.assign({}, P.dizzy); p.t += Math.sin(t * 0.07) * 12; return p; }
      case 'victory': return P.victory;
      case 'summoning': return P.temple;
      case 'ultlock': return P[f.ultPose || 'cast2'];
      case 'attack': {
        const m = f.move, d = m.def, strike = P[d.pose] || P.cast, b0 = d.crouch ? P.crouch : (!f.onGround ? base : P.idle);
        if (m.fr <= d.s) { const k = m.fr / Math.max(1, d.s); const wind = d.wind ? P[d.wind] : G.lerpPose(b0, P.windup, 0.35); return k < 0.6 ? G.lerpPose(b0, wind, ease(k / 0.6)) : G.lerpPose(wind, strike, ease((k - 0.6) / 0.4)); }
        if (m.fr <= d.s + d.a || d.hold) return strike;
        return G.lerpPose(strike, b0, ease(Math.min(1, (m.fr - d.s - d.a) / Math.max(1, d.r))));
      }
    }
    return P.idle;
  }

  function drawBlock(ctx, f, t) {
    const x = f.x + f.face * 34, y = f.y - (f.isCrouching() ? 50 : 82), fl = f.blockFlash > 0 ? 1.15 : 1; if (f.blockFlash > 0) f.blockFlash--;
    ctx.save(); ctx.translate(x, y); ctx.scale(f.face * fl, fl); ctx.globalAlpha = 0.85;
    switch (f.ch.block) {
      case 'thought': for (let i = 0; i < 7; i++) C(ctx, Math.sin(i * 2 + t * 0.1) * 6, -60 + i * 20, 20, 'rgba(255,255,255,0.85)'); break;
      case 'cards': for (let i = 0; i < 7; i++) G.drawCard(ctx, 0, -10, (i - 3) * 0.28, ['#d01c2c', '#111'][i % 2], ['A', 'K', 'Q', 'J', '10', '9', '8'][i]); break;
      case 'vines': ctx.strokeStyle = '#2f9d3a'; ctx.lineWidth = 6; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-6, 70); ctx.quadraticCurveTo(26 * Math.sin(i + t * 0.05), 0, 4 * (i - 2), -80); ctx.stroke(); } for (let i = 0; i < 8; i++) G.leaf(ctx, Math.sin(i) * 12, -70 + i * 18, i, 12, '#4fc95a'); break;
      case 'cape': ctx.fillStyle = '#f08a1c'; ctx.strokeStyle = '#111'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 0, 26, 80, 0, -Math.PI / 2, Math.PI / 2); ctx.fill(); ctx.stroke(); ctx.lineWidth = 5; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(4, i * 26); ctx.lineTo(20, i * 26 + 8); ctx.stroke(); } break;
      case 'nebula': { const gr = ctx.createRadialGradient(0, 0, 10, 0, 0, 90); gr.addColorStop(0, 'rgba(143,216,255,0)'); gr.addColorStop(0.7, 'rgba(197,139,255,0.45)'); gr.addColorStop(1, 'rgba(197,139,255,0.9)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(-30, 0, 90, -1, 1); ctx.fill(); for (let i = 0; i < 10; i++) C(ctx, 40 + Math.sin(i * 3) * 10, -60 + i * 13, 1.5, '#fff'); break; }
      case 'water': ctx.fillStyle = 'rgba(31,143,255,0.55)'; ctx.beginPath(); ctx.moveTo(-6, -90); for (let i = 0; i <= 18; i++) ctx.lineTo(8 + Math.sin(i * 0.8 + t * 0.3) * 8, -90 + i * 10); ctx.lineTo(-6, 90); ctx.closePath(); ctx.fill(); break;
      case 'sand': ctx.fillStyle = 'rgba(232,196,138,0.85)'; G.rr(ctx, -10, -85, 26, 170, 8); ctx.fill(); G.drawShabti(ctx, 22, 90, 1, t, false, 0.8); break;
      case 'veil': { const gr = ctx.createLinearGradient(-10, 0, 30, 0); gr.addColorStop(0, 'rgba(207,224,255,0)'); gr.addColorStop(1, 'rgba(207,224,255,0.75)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(-10, -90); for (let i = 0; i <= 10; i++) ctx.lineTo(20 + Math.sin(i + t * 0.1) * 6, -90 + i * 18); ctx.lineTo(-10, 90); ctx.fill(); break; }
      case 'halo': ctx.strokeStyle = 'rgba(255,211,77,0.9)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(-40, 0, 90, -1.1, 1.1); ctx.stroke(); ctx.lineWidth = 2; for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(-40 + Math.cos(i * 0.25) * 90, Math.sin(i * 0.25) * 90); ctx.lineTo(-40 + Math.cos(i * 0.25) * 120, Math.sin(i * 0.25) * 120); ctx.stroke(); } break;
      case 'shadow': ctx.fillStyle = 'rgba(10,6,20,0.9)'; ctx.beginPath(); ctx.moveTo(-4, -95); ctx.quadraticCurveTo(40, 0, -4, 95); ctx.quadraticCurveTo(10, 0, -4, -95); ctx.fill(); C(ctx, 14, -20, 3, '#ff2a3a'); C(ctx, 14, -8, 3, '#ff2a3a'); break;
      case 'hex': ctx.strokeStyle = 'rgba(56,225,255,0.9)'; ctx.fillStyle = 'rgba(56,225,255,0.18)'; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { const yy = -75 + i * 30, xx = (i % 2) * 13; ctx.beginPath(); for (let k = 0; k < 6; k++) ctx.lineTo(xx + Math.cos(k * Math.PI / 3) * 15, yy + Math.sin(k * Math.PI / 3) * 15); ctx.closePath(); ctx.fill(); ctx.stroke(); } break;
      case 'sound': ctx.strokeStyle = 'rgba(255,179,71,0.9)'; ctx.lineWidth = 4; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(-30, 0, 40 + i * 18 + (t % 12), -0.9, 0.9); ctx.stroke(); } G.drawOwl(ctx, 30, -60, 0.8, 1, t); break;
    }
    ctx.restore();
  }

  function drawFighter(ctx, f, g) {
    const t = g.t + f.id * 50;
    if (f.dead && f.dissolve >= 1) return;
    // ground shadow
    const sh = Math.max(0.2, 1 - (GY() - f.y) / 400); ctx.fillStyle = `rgba(0,0,0,${0.3 * sh})`; ctx.beginPath(); ctx.ellipse(f.x, (f.plat ? f.plat[1] : GY()) + 3, 40 * sh, 8 * sh, 0, 0, 7); ctx.fill();
    for (const a of f.after) { ctx.save(); ctx.globalAlpha = a.life / 30; G.drawFigure(ctx, f.ch, a.x, a.y, a.st === 'dash' ? P.dash : P.hit, f.face, { silhouette: f.ch.glow, rot: a.spin }); ctx.restore(); }
    if (f.status.possessed) { ctx.save(); ctx.globalAlpha = 0.5; C(ctx, f.x, f.y - 70, 80 + Math.sin(t * 0.3) * 6, 'rgba(125,255,90,0.35)'); ctx.restore(); }
    if (f.status.focus) { ctx.save(); ctx.globalAlpha = 0.6; ctx.strokeStyle = '#ffb347'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(f.x, f.y - 70, 90 + (t % 20), 0, 7); ctx.stroke(); ctx.restore(); }
    if (f.state === 'summoning') { ctx.save(); ctx.strokeStyle = 'rgba(255,60,60,0.7)'; ctx.setLineDash([6, 6]); ctx.lineWidth = 3; ctx.strokeRect(f.x - 34, f.y - 150, 68, 150); ctx.setLineDash([]); ctx.font = '900 14px Rubik'; ctx.fillStyle = '#ff6060'; ctx.textAlign = 'center'; ctx.fillText('VULNERABLE', f.x, f.y - 158); ctx.restore(); }
    const pose = poseOf(f, g);
    let rot = 0; if (f.state === 'launch') rot = f.spin; if (f.state === 'tech') rot = (f.techDir || f.face) * f.st / 16 * Math.PI * 2;
    let x = f.x; if (f.hitstop > 0 && f.inHitstun()) x += (Math.random() - 0.5) * 6;
    const alpha = (f.invuln > 0 && f.state !== 'ultlock' && (g.t >> 2) % 2) ? 0.55 : 1;
    if (f.move && f.move.def.drawFx && f.move.def.under) f.move.def.drawFx(ctx, f, f.move.fr, t);
    G.drawFigure(ctx, f.ch, x, f.y, pose, f.face, { t, flash: f.flashT > 0, rot, dissolve: f.dissolve, mode: f.mode, whipLen: f.whipLen, dieFace: f.dieFace, alpha, spin: f.state === 'launch' ? 0 : 0 });
    if (f.move && f.move.def.drawFx && !f.move.def.under) f.move.def.drawFx(ctx, f, f.move.fr, t);
    if (['block', 'cblock', 'blockstun'].includes(f.state)) drawBlock(ctx, f, t);
    if (f.status.slow) { ctx.save(); ctx.strokeStyle = 'rgba(141,155,176,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(f.x, f.y - 160, 14, 0, 7); ctx.moveTo(f.x, f.y - 160); ctx.lineTo(f.x, f.y - 170); ctx.moveTo(f.x, f.y - 160); ctx.lineTo(f.x + 8, f.y - 158); ctx.stroke(); ctx.restore(); }
    if (f.state === 'dizzy') { for (let i = 0; i < 3; i++) { ctx.fillStyle = '#ffe24d'; G.star(ctx, f.x + Math.cos(t * 0.15 + i * 2.1) * 30, f.y - 170 + Math.sin(t * 0.15 + i * 2.1) * 8, 9); } }
  }

  function bar(ctx, x, y, w, h, k, col, back, flip) { ctx.fillStyle = '#000'; ctx.fillRect(x - 3, y - 3, w + 6, h + 6); ctx.fillStyle = back; ctx.fillRect(x, y, w, h); ctx.fillStyle = col; const ww = w * Math.max(0, Math.min(1, k)); ctx.fillRect(flip ? x + w - ww : x, y, ww, h); }

  G.Game.prototype.drawHud = function (ctx) {
    for (let s = 0; s < 2; s++) {
      const f = this.fighters[s], h = this.hud[s]; if (h.grab) continue;
      ctx.save(); const px = s ? 1240 : 40; ctx.translate(px + h.ox, 30 + h.oy); ctx.rotate(h.rot); ctx.translate(-px, -30);
      const flip = s === 1, x0 = flip ? 760 : 40, w = 480;
      f.hpShow = f.hpShow == null ? f.hp : f.hpShow + (f.hp - f.hpShow) * 0.06;
      bar(ctx, x0, 34, w, 26, f.hpShow / 100, '#ff3b3b', '#2a0a0a', flip);
      const g2 = ctx.createLinearGradient(0, 34, 0, 60); g2.addColorStop(0, '#fff26a'); g2.addColorStop(1, '#e8a020'); ctx.fillStyle = g2; const ww = w * Math.max(0, f.hp / 100); ctx.fillRect(flip ? x0 + w - ww : x0, 34, ww, 26);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(flip ? x0 + w - ww : x0, 34, ww, 6);
      ctx.font = 'italic 900 26px Rubik'; ctx.textAlign = flip ? 'right' : 'left'; ctx.lineWidth = 5; ctx.strokeStyle = '#000';
      const nm = f.ch.name + (s === 0 ? '  (' + (G.username || 'YOU') + ')' : '  (BOT)'); ctx.strokeText(nm, flip ? x0 + w : x0, 26); ctx.fillStyle = '#fff'; ctx.fillText(nm, flip ? x0 + w : x0, 26);
      for (let i = 0; i < 2; i++) { const cx = flip ? x0 + 12 + i * 26 : x0 + w - 12 - i * 26; C(ctx, cx, 18, 9, '#000'); C(ctx, cx, 18, 7, this.wins[s] > i ? '#ffd34d' : '#333'); }
      // Smash-style knockback percent
      const pc = Math.round(f.kbp), heat = Math.min(1, f.kbp / 150); ctx.font = 'italic 900 44px Rubik'; ctx.textAlign = flip ? 'right' : 'left';
      const shake = f.hitstop > 0 ? (Math.random() - 0.5) * 6 : 0; ctx.strokeStyle = '#000'; ctx.lineWidth = 7; ctx.strokeText(pc + '%', (flip ? x0 + w : x0) + shake, 110);
      ctx.fillStyle = `rgb(255,${Math.round(255 - heat * 200)},${Math.round(255 - heat * 230)})`; ctx.fillText(pc + '%', (flip ? x0 + w : x0) + shake, 110);
      ctx.font = '800 11px Rubik'; ctx.fillStyle = '#ccc'; ctx.fillText('KNOCKBACK', (flip ? x0 + w - 120 : x0 + 120), 108);
      // ultimate meter
      const mx = flip ? x0 + w - 300 : x0; bar(ctx, mx, 68, 300, 12, f.meter / 100, f.meter >= 100 ? (this.t % 20 < 10 ? '#fff' : f.ch.glow) : f.ch.acc, '#111', flip);
      if (f.meter >= 100) { ctx.font = 'italic 900 15px Rubik'; ctx.fillStyle = '#fff'; ctx.textAlign = flip ? 'right' : 'left'; ctx.fillText('ULTIMATE READY — ' + (s === 0 ? 'PRESS R' : ''), flip ? mx + 300 : mx, 96 - 30 + 30); }
      if (f.status.possessed) { ctx.font = '900 14px Rubik'; ctx.fillStyle = '#7dff5a'; ctx.fillText('POSSESSED', flip ? x0 + w - 330 : x0 + 330, 82); }
      if (f.ch.id === 'mathew') { ctx.font = '900 14px Rubik'; ctx.fillStyle = '#f2c230'; ctx.fillText(f.mode === 'whip' ? 'WHIP STANCE' : 'COMMAND STANCE', flip ? x0 + w - 330 : x0 + 330, 82); }
      if (f.ch.id === 'sean') { ctx.font = '900 13px Rubik'; ctx.fillStyle = f.undyingUsed ? '#666' : '#cfe0ff'; ctx.fillText(f.undyingUsed ? 'UNDYING USED' : 'UNDYING READY', flip ? x0 + w - 330 : x0 + 330, 82); }
      // cracks
      if (h.cracks > 0) { ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2; const cx = x0 + w / 2 + (s ? -60 : 60); ctx.beginPath(); for (let i = 0; i < 6 * h.cracks; i++) { const a = i * 1.7; ctx.moveTo(cx, 46); ctx.lineTo(cx + Math.cos(a) * (30 + (i * 13) % 60), 46 + Math.sin(a) * (14 + (i * 7) % 20)); } ctx.stroke(); }
      ctx.restore();
    }
    // timer
    ctx.save(); ctx.fillStyle = '#000'; ctx.fillRect(584, 18, 112, 66); ctx.fillStyle = '#16163a'; ctx.fillRect(588, 22, 104, 58); ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 3; ctx.strokeRect(588, 22, 104, 58);
    ctx.font = '900 46px Rubik'; ctx.textAlign = 'center'; ctx.fillStyle = this.timer < 600 && this.t % 30 < 15 ? '#ff3b3b' : '#fff'; ctx.fillText(Math.max(0, Math.ceil(this.timer / 60)), 640, 68);
    ctx.font = '800 12px Rubik'; ctx.fillStyle = '#ffd34d'; ctx.fillText('ROUND ' + this.round, 640, 100); ctx.restore();
    // combo counters
    for (const f of this.fighters) if (f.opp && f.opp.comboHits >= 2 && f.opp.inHitstun()) { const s = f.side; ctx.save(); ctx.font = 'italic 900 54px Rubik'; ctx.textAlign = s ? 'right' : 'left'; ctx.lineWidth = 8; ctx.strokeStyle = '#000'; const x = s ? 1240 : 40; ctx.strokeText(f.opp.comboHits + ' HITS', x, 220); ctx.fillStyle = '#ffd34d'; ctx.fillText(f.opp.comboHits + ' HITS', x, 220); ctx.restore(); }
  };

  G.Game.prototype.drawDebug = function (ctx) {
    ctx.save(); ctx.lineWidth = 2;
    for (const f of this.fighters) {
      const hb = f.hurtbox(); ctx.strokeStyle = f.invuln > 0 ? 'rgba(255,255,255,0.8)' : 'rgba(60,255,120,0.9)'; ctx.fillStyle = 'rgba(60,255,120,0.15)'; ctx.fillRect(...hb); ctx.strokeRect(...hb);
      const a = f.activeHitbox(); if (a) { ctx.strokeStyle = '#ff2a2a'; ctx.fillStyle = 'rgba(255,40,40,0.3)'; ctx.fillRect(...a); ctx.strokeRect(...a); }
      ctx.fillStyle = '#fff'; ctx.font = '700 12px monospace'; ctx.textAlign = 'center'; ctx.fillText(f.state + ' ' + f.st + (f.move ? ' f' + f.move.fr : '') + (f.hitstop ? ' hs' + f.hitstop : ''), f.x, f.y + 18);
    }
    for (const p of this.projectiles) { ctx.strokeStyle = 'orange'; ctx.strokeRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h); }
    for (const m of this.minions) { ctx.strokeStyle = '#3cf'; ctx.strokeRect(m.x - m.w / 2, m.y - m.h, m.w, m.h); }
    for (const h of this.hazards) if (h.t >= h.warn) { ctx.strokeStyle = '#ff0'; ctx.strokeRect(...this.hazBox(h)); }
    ctx.restore();
  };
  G.Game.prototype.drawFrameData = function (ctx) {
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(16, 600, 1248, 104); ctx.font = '700 14px monospace'; ctx.fillStyle = '#9ad'; ctx.textAlign = 'left';
    this.fighters.forEach((f, i) => { const L = f.lastInfo; const y = 624 + i * 22; ctx.fillStyle = i ? '#f99' : '#9df';
      ctx.fillText(`P${i + 1} ${f.ch.name.padEnd(9)} ${L ? `${L.name.padEnd(18)} startup ${String(L.s).padStart(2)}  active ${String(L.a).padStart(2)}  recovery ${String(L.r).padStart(2)}  dmg ${L.dmg}` : '—'}   kb% ${f.kbp.toFixed(0)}  meter ${f.meter.toFixed(0)}`, 28, y); });
    const A = this.lastAdv; ctx.fillStyle = '#ffd34d'; ctx.fillText(A ? `Last: ${A.name} on ${A.block ? 'BLOCK' : 'HIT'} → ${A.v >= 0 ? '+' : ''}${A.v} frames` : 'Hit something to measure frame advantage', 28, 674);
    ctx.fillStyle = '#aaa'; ctx.fillText('F2 toggles hitboxes · green = hurtbox, red = hitbox, orange = projectile, blue = summon, yellow = hazard', 28, 694); ctx.restore();
  };

  G.Game.prototype.draw = function (ctx) {
    const cam = this.cam, [sx, sy] = G.FX.shakeOffset(), t = this.t, u = this.ult;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 1280, 720);
    ctx.translate(640 + sx, 360 + sy); if (this.screenTilt) ctx.rotate(this.screenTilt); ctx.scale(cam.z, cam.z); ctx.translate(-cam.x, -cam.y);
    this.stage.draw(ctx, t);
    if (this.stage.plats) for (const p of this.stage.plats) { ctx.fillStyle = '#1a0f30'; G.rr(ctx, p[0], p[1], p[2], 18, 8); ctx.fill(); ctx.fillStyle = '#f5c542'; ctx.fillRect(p[0] + 6, p[1], p[2] - 12, 4); }
    G.FX.draw(ctx, 'back');
    if (u && u.t > 70 && u.def.bg) u.def.bg(ctx, this, u.f, u.o, u.t - 70);
    for (const h of this.hazards) G.drawHazard(ctx, h, t);
    for (const m of this.minions) m.draw(ctx, m, t);
    const order = [...this.fighters].sort((a, b) => (a.state === 'attack' ? 1 : 0) - (b.state === 'attack' ? 1 : 0));
    for (const f of order) drawFighter(ctx, f, this);
    for (const p of this.projectiles) if (p.draw) p.draw(ctx, p, t);
    for (const v of this.vis) v.draw(ctx, v, t);
    G.FX.draw(ctx);
    if (u && u.t > 70 && u.def.fg) u.def.fg(ctx, this, u.f, u.o, u.t - 70);
    if (G.S.boxes) this.drawDebug(ctx);
    ctx.restore();
    if (this.gray > 0) { ctx.save(); ctx.globalAlpha = this.gray; ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = '#888'; ctx.fillRect(0, 0, 1280, 720); ctx.restore(); }
    G.FX.drawImpact(ctx); G.FX.drawFlash(ctx);
    if (!(this.phase === 'fatality' && this.pt > 100)) this.drawHud(ctx);
    if (G.S.boxes && this.phase === 'fight') this.drawFrameData(ctx);
    if (u && u.t <= 70) this.drawCutIn(ctx, u);
    this.drawBanner(ctx);
    if (this.phase === 'finish') { ctx.save(); ctx.font = '800 20px Rubik'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; const tl = Math.max(0, 5.5 - this.pt / 60).toFixed(1);
      if (!this.winner.isBot) ctx.fillText('FATALITY:  ↓ → ↓ + FP (J)   or press F      ' + tl + 's', 640, 690); ctx.restore(); }
    if (this.phase === 'fatality') this.drawFatality(ctx);
    if (this.phase === 'matchEnd') this.drawEnd(ctx);
  };
  G.Game.prototype.drawCutIn = function (ctx, u) {
    const k = u.t / 70, f = u.f; ctx.save(); ctx.fillStyle = `rgba(0,0,0,${Math.min(0.6, k * 3)})`; ctx.fillRect(0, 0, 1280, 720);
    const slide = Math.min(1, u.t / 12), out = u.t > 60 ? (u.t - 60) / 10 : 0; ctx.translate((1 - slide) * -1400 + out * 1400, 0);
    ctx.fillStyle = f.ch.acc; ctx.beginPath(); ctx.moveTo(0, 220); ctx.lineTo(1280, 170); ctx.lineTo(1280, 470); ctx.lineTo(0, 520); ctx.fill();
    ctx.fillStyle = '#0b0b12'; ctx.beginPath(); ctx.moveTo(0, 240); ctx.lineTo(1280, 190); ctx.lineTo(1280, 450); ctx.lineTo(0, 500); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 2; for (let i = 0; i < 30; i++) { const y = 200 + (i * 37 + u.t * 25) % 300; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1280, y - 50); ctx.stroke(); }
    ctx.save(); ctx.translate(330, 720); ctx.scale(3.2, 3.2); G.drawFigure(ctx, f.ch, 0, 0, P.cast2, 1, { t: this.t, dieFace: 6 }); ctx.restore();
    ctx.font = 'italic 900 78px Rubik'; ctx.textAlign = 'left'; ctx.lineWidth = 10; ctx.strokeStyle = '#000'; ctx.strokeText(u.def.name, 560, 350); ctx.fillStyle = '#fff'; ctx.fillText(u.def.name, 560, 350);
    ctx.font = '800 22px Rubik'; ctx.fillStyle = f.ch.glow; ctx.fillText(f.ch.title.toUpperCase() + ' · ULTIMATE', 566, 392); ctx.restore();
  };
  G.Game.prototype.drawBanner = function (ctx) {
    const b = this.banner; if (!b || b.t > 75) return; const k = b.t / 75; const sc = b.t < 8 ? 2.4 - b.t / 8 * 1.4 : 1; ctx.save(); ctx.globalAlpha = k > 0.8 ? (1 - k) / 0.2 : 1;
    ctx.translate(640, 330); ctx.scale(sc, sc); ctx.rotate(-0.04); ctx.font = `italic 900 ${b.size}px Rubik`; ctx.textAlign = 'center'; ctx.lineWidth = 14; ctx.strokeStyle = '#000'; ctx.strokeText(b.text, 0, 0); ctx.fillStyle = b.col; ctx.fillText(b.text, 0, 0);
    ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.strokeText(b.text, 0, 0); ctx.restore();
  };
  G.Game.prototype.drawFatality = function (ctx) {
    const t = this.pt, l = this.loser;
    if (t < 110) G.FX.glitch(ctx, G.cv, 0.15 + t / 110 * 0.85);
    else if (t < 330) { if (t % 9 < 2) G.FX.glitch(ctx, G.cv, 0.25); G.FX.drawDeleteWindow(ctx, l.ch.name, (t - 110) / 220, t, false); }
    else if (t < 380) { G.FX.glitch(ctx, G.cv, 1); G.FX.drawDeleteWindow(ctx, l.ch.name, 1, t, true); }
    else if (t < 470) { if (t % 12 < 3) G.FX.glitch(ctx, G.cv, 0.4); G.FX.drawDeleteWindow(ctx, l.ch.name, 1, t, true); }
  };
  G.Game.prototype.drawEnd = function (ctx) {
    const w = this.winner, k = Math.min(1, this.pt / 30); ctx.save(); ctx.fillStyle = `rgba(0,0,0,${0.55 * k})`; ctx.fillRect(0, 0, 1280, 720);
    ctx.globalAlpha = k; ctx.save(); ctx.translate(380, 560); ctx.scale(2.4, 2.4); G.drawFigure(ctx, w.ch, 0, 0, P.victory, 1, { t: this.t, dieFace: 6 }); ctx.restore();
    ctx.font = 'italic 900 90px Rubik'; ctx.textAlign = 'left'; ctx.lineWidth = 10; ctx.strokeStyle = '#000'; const txt = (w.side === 0 ? 'YOU WIN' : 'YOU LOSE'); ctx.strokeText(txt, 620, 200); ctx.fillStyle = w.side === 0 ? '#ffd34d' : '#ff3b3b'; ctx.fillText(txt, 620, 200);
    ctx.font = '800 26px Rubik'; ctx.fillStyle = '#fff'; ctx.fillText(w.ch.name + ' — ' + w.ch.title, 624, 244); if (w.hp >= 100) { ctx.fillStyle = '#7ff3ff'; ctx.fillText('FLAWLESS VICTORY', 624, 280); } ctx.restore();
  };
})();
