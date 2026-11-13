// ===== Special moves + ultimates, part 2 (Mathew, Sean, Kryztian, Hunter, Aisha, Joldyne) =====
(function () {
  const S = G.SPECIALS, X = G.SPX, { H, proj, vis, force, uhit, ufinal, hold, hand, C, R } = X;
  const GY = () => G.GROUND;
  const sp = (o) => Object.assign({ s: 10, a: 1, r: 18, dmg: 0, pose: 'cast' }, o);

  // ================= MATHEW — pharaoh, commands shabti servants / whip stance =================
  function shabti(ctx, x, y, face, t, atk, alpha) {
    ctx.save(); ctx.globalAlpha = alpha == null ? 1 : alpha; ctx.translate(x, y); ctx.scale(face * 0.85, 0.85); ctx.lineCap = 'round';
    const w = Math.sin(t * 0.3) * 0.5; ctx.strokeStyle = '#c9a060'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(0, -40); ctx.lineTo(Math.sin(w) * 14, 0); ctx.moveTo(0, -40); ctx.lineTo(-Math.sin(w) * 14, 0); ctx.stroke();
    ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(0, -40); ctx.lineTo(0, -80); ctx.stroke();
    ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, -76); ctx.lineTo(atk ? 30 : 14, atk ? -78 : -52); ctx.stroke();
    if (atk) { ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(26, -78); ctx.lineTo(60, -82); ctx.stroke(); }
    C(ctx, 0, -94, 12, '#c9a060'); ctx.fillStyle = '#1d3f9e'; ctx.fillRect(-13, -104, 26, 8); ctx.fillStyle = '#111'; ctx.fillRect(3, -97, 4, 3);
    ctx.restore();
  }
  G.drawShabti = shabti;
  function servant(f, g, x) {
    const m = { owner: f, x, y: GY(), vx: 0, face: f.face, hp: 10, w: 40, h: 90, t: 0, life: 420, cd: 30, atk: 0,
      update(m2, g2) { const o = f.opp; m2.t++; m2.life--; if (m2.cd > 0) m2.cd--; if (m2.atk > 0) m2.atk--; const dx = o.x - m2.x; m2.face = dx > 0 ? 1 : -1;
        if (Math.abs(dx) > 55) m2.x += m2.face * 2.6; else if (m2.cd <= 0) { m2.atk = 14; m2.cd = 50; }
        if (m2.atk === 7 && Math.abs(dx) < 80) G.applyHit(f, o, H(3.5, { proj: true, ang: 25, col: '#f2c230' }), g2, m2.x, m2.y - 70);
        if (m2.life <= 0 || m2.hp <= 0) { m2.dead = true; G.FX.dust(m2.x, GY(), 8, 0.8, 0, '#e8c48a'); } },
      draw(ctx, m2, t) { shabti(ctx, m2.x, m2.y, m2.face, t + m2.x, m2.atk > 3, m2.life < 30 ? m2.life / 30 : 1); } };
    g.minions.push(m); G.FX.dust(x, GY(), 6, 0.8, 0, '#e8c48a');
  }
  S.mathew = {
    s1: f => f.mode === 'whip'
      ? sp({ name: 'Whip Crack', s: 12, a: 4, r: 18, dmg: 9, hb: [20, -130, 240, 34], heavy: true, hs: 24, bs: 14, kb: 9, kbg: 5, ang: 30, pose: 'whip', start: (f2) => f2.whipLen = 30, frame: (f2, g, fr) => { f2.whipLen = fr < 12 ? 30 : fr < 17 ? 240 : 60; if (fr === 13) G.sfx('zap'); } })
      : sp({ name: 'Command: Shabti', s: 14, r: 16, dmg: '3.5 per hit', pose: 'cast', frame: (f2, g, fr) => { if (fr === 14) { const n = g.minions.filter(m => m.owner === f2).length; if (n >= 4) { G.FX.text(f2.x, f2.y - 180, 'MAX SERVANTS', '#f2c230', 20); return; } servant(f2, g, f2.x + f2.face * 50); servant(f2, g, f2.x - f2.face * 30); G.sfx('land'); G.FX.text(f2.x, f2.y - 190, 'RISE!', '#f2c230', 30); } } }),
    s2: f => f.mode === 'whip'
      ? sp({ name: 'Whip Grab', s: 12, a: 4, r: 20, dmg: 4, hb: [20, -130, 250, 34], hs: 34, bs: 12, kb: 1, kbg: 0, ang: 0, push: 0, pose: 'whip',
        start: (f2) => f2.whipLen = 30, frame: (f2, g, fr) => { f2.whipLen = fr < 12 ? 30 : fr < 17 ? 250 : 40; }, onHit: (a, o) => { o.vx = -a.face * 16; G.FX.text(o.x, o.y - 180, 'GET OVER HERE', '#f2c230', 22); } })
      : sp({ name: 'Command: Spears', s: 14, r: 18, dmg: '4x3', frame: (f2, g, fr) => { if (fr === 14) for (let i = 0; i < 3; i++) proj(g, f2, { x: f2.x - f2.face * (40 + i * 30), y: GY() - 120, vx: (9 + i * 1.5) * f2.face, vy: -9 + i, grav: 0.4, w: 50, h: 12, life: 90, hit: H(4, { ang: 30 }),
        update: (p) => { p.vy += p.grav; p.x += p.vx; p.y += p.vy; if (p.y > GY()) { p.life = 0; G.FX.dust(p.x, GY(), 3, 0.5, 0, '#e8c48a'); } },
        draw: (ctx, p) => { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.vy, p.vx)); ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(20, 0); ctx.stroke(); ctx.fillStyle = '#f2c230'; ctx.beginPath(); ctx.moveTo(20, -6); ctx.lineTo(34, 0); ctx.lineTo(20, 6); ctx.fill(); ctx.restore(); } }); } }),
    s3: sp({ name: 'Stance Switch', s: 6, r: 8, dmg: '—', pose: 'raise', frame: (f, g, fr) => { if (fr === 6) { f.mode = f.mode === 'whip' ? 'command' : 'whip'; G.FX.text(f.x, f.y - 190, f.mode === 'whip' ? 'WHIP STANCE' : 'COMMAND STANCE', '#f2c230', 26); G.sfx('select'); G.FX.dust(f.x, GY(), 6, 0.6, 0, '#e8c48a'); } } }),
    s4: f => f.mode === 'whip'
      ? sp({ name: 'Whip Frenzy', s: 14, a: 30, r: 22, dmg: '3x6', hb: [10, -150, 200, 120], hs: 16, bs: 10, kb: 3, kbg: 1, ang: 20, push: 2, pose: 'whip', start: (f2) => f2.whipLen = 30,
        frame: (f2, g, fr, m) => { f2.whipLen = 60 + Math.abs(Math.sin(fr * 0.6)) * 180; if (fr > 14 && (fr - 15) % 5 === 0) { m.hits.clear(); G.sfx('zap'); } } })
      : sp({ name: 'Sand Tomb', s: 20, r: 24, dmg: 12, pose: 'raise', frame: (f2, g, fr) => { if (fr === 20) { const o = f2.opp; proj(g, f2, { x: o.x, y: GY() - 80, w: 90, h: 160, life: 30, hit: H(3, { hs: 20, kb: 0.5, kbg: 0 }), draw: (ctx, p, t) => { for (let i = 0; i < 10; i++) C(ctx, p.x + Math.cos(t * 0.4 + i) * 40, p.y + 60 - i * 14, 14, 'rgba(232,196,138,0.7)'); },
        onHit: (p, o2, g2) => { if (o2.hp <= 0) return; force(o2, 60, (o3, g3, t) => { o3.vx = 0; if (t % 15 === 14) G.applyHit(f2, o3, H(2.2, { proj: true, keepForced: true, hs: 12, kb: 0.3, kbg: 0 }), g3, o3.x, o3.y - 60); if (t === 59) G.applyHit(f2, o3, H(3, { proj: true, launch: true, ang: 80 }), g3, o3.x, o3.y - 60); });
          vis(g2, { life: 60, draw: (ctx, v) => { for (let i = 0; i < 26; i++) { const a = v.t * 0.3 + i, r = 40 + (i % 5) * 10; C(ctx, o2.x + Math.cos(a) * r, o2.y - (i * 7) % 170, 10, `rgba(220,180,120,${0.6})`); } } }); } }); } } }),
    ult: { name: 'ARMY OF THE DUNES', len: 320,
      run(g, f, o, t) { hold(o, o.x, GY() - Math.abs(Math.sin(t * 0.09)) * 90);
        if (t > 30 && t < 240 && t % 6 === 0) vis(g, { life: 60, y: GY() + R(-6, 6), off: R(0, 40), draw: (ctx, v) => { const x = (f.face > 0 ? -60 : 1340) + f.face * v.t * 26 + v.off; shabti(ctx, x, v.y, f.face, g.t + v.off, v.t % 12 < 6); } });
        if (t > 50 && t < 260 && t % 12 === 0) { uhit(g, f, o, 1.9, { col: '#f2c230' }); }
        if (t === 270) vis(g, { life: 40, draw: (ctx, v) => { const y = -200 + Math.min(1, v.t / 10) * (GY() + 200); ctx.fillStyle = '#e8c48a'; ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(o.x - 160, y); ctx.lineTo(o.x, y - 220); ctx.lineTo(o.x + 160, y); ctx.closePath(); ctx.fill(); ctx.stroke(); } });
        if (t === 280) { G.FX.shake(18, 20); G.FX.landDust(o.x, GY(), 2.5); ufinal(g, f, o, 9, { ang: 60 }); } },
      bg(ctx, g, f, o, t) { ctx.fillStyle = `rgba(200,150,80,${Math.min(0.55, t / 80)})`; ctx.fillRect(-400, -300, 2080, 1300); for (let i = 0; i < 60; i++) { const x = (i * 83 + t * 18 * f.face) % 1700, y = (i * 47) % 640; C(ctx, (x + 1700) % 1700 - 200, y, 2 + i % 3, 'rgba(255,220,160,0.6)'); } } },
  };

  // ================= SEAN — immortality / sorrow =================
  S.sean = {
    passive(f, g) { if (f.status.regenGlow) {} },
    s1: sp({ name: 'Tear Lance', s: 12, r: 18, dmg: 8, frame: (f, g, fr) => { if (fr === 12) { const [x, y] = hand(f); proj(g, f, { x, y, vx: 15 * f.face, w: 70, h: 16, life: 60, hit: H(8, { ang: 25, col: '#bfe4ff' }),
      draw: (ctx, p) => { ctx.save(); ctx.translate(p.x, p.y); ctx.scale(p.face, 1); const gr = ctx.createLinearGradient(-40, 0, 40, 0); gr.addColorStop(0, 'rgba(127,200,255,0)'); gr.addColorStop(1, '#e8f6ff'); ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(-40, -5); ctx.lineTo(30, -6); ctx.lineTo(44, 0); ctx.lineTo(30, 6); ctx.lineTo(-40, 5); ctx.fill(); ctx.restore(); } }); G.sfx('zap'); } } }),
    s2: sp({ name: 'Grief Chains', s: 14, r: 20, dmg: 5, frame: (f, g, fr) => { if (fr === 14) { const [x, y] = hand(f); const p = proj(g, f, { x, y, vx: 14 * f.face, w: 30, h: 24, life: 34, sx: x, sy: y, hit: H(5, { hs: 36, kb: 0.5, kbg: 0, push: 0 }),
      draw: (ctx, p2) => { ctx.strokeStyle = '#8d9bb0'; ctx.lineWidth = 4; ctx.setLineDash([8, 5]); ctx.beginPath(); ctx.moveTo(f.x + f.face * 40, f.y - 112); ctx.lineTo(p2.x, p2.y); ctx.stroke(); ctx.setLineDash([]); C(ctx, p2.x, p2.y, 9, '#5d6b8c'); },
      onHit: (p2, o) => { o.vx = -f.face * 15; o.status.slow = 60; G.FX.text(o.x, o.y - 180, 'SLOWED', '#8d9bb0', 24); } }); } } }),
    s3: sp({ name: 'Eternal Embrace', s: 8, a: 3, r: 26, dmg: 9, hb: [10, -140, 64, 140], throw: true, unblockable: true, hs: 30, kb: 9, kbg: 4, ang: 40, pose: 'grab',
      onHit: (a, o, g) => { a.hp = Math.min(100, a.hp + 6); G.FX.text(a.x, a.y - 190, '+6 LIFE', '#7fffb0', 26); for (let i = 0; i < 12; i++) G.FX.pixels(o.x, o.y - 80, 1, '#cfe0ff'); } }),
    s4: sp({ name: 'Last Lament', s: 20, a: 18, r: 22, dmg: '4x3', hb: [-120, -230, 420, 240], hs: 16, bs: 10, kb: 4, kbg: 2, ang: 50, pose: 'raise',
      frame: (f, g, fr, m) => { if (fr > 20 && (fr - 21) % 6 === 0) { m.hits.clear(); G.FX.ring(f.x, f.y - 120, 220, 'rgba(207,224,255,0.8)', 6, 20); G.sfx('rewind'); } } }),
    ult: { name: 'ENDLESS REQUIEM', len: 320,
      run(g, f, o, t) { hold(o, o.x, Math.min(GY(), o.y)); g.gray = Math.min(1, t / 40);
        if (t > 40 && t < 260 && t % 11 === 0) { uhit(g, f, o, 1.45, { col: '#bfe4ff', hs: 20 }); f.hp = Math.min(100, f.hp + 0.75); }
        if (t === 270) { g.gray = 0; G.FX.flash(10, '#fff'); G.sfx('crack'); ufinal(g, f, o, 8, { ang: 70 }); } },
      fg(ctx, g, f, o, t) { ctx.save(); ctx.strokeStyle = 'rgba(190,220,255,0.7)'; ctx.lineWidth = 2; for (let i = 0; i < 80; i++) { const x = (i * 53 + t * 2) % 1400 - 60, y = (i * 97 + t * 14) % 760 - 20; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 16); ctx.stroke(); }
        const cx = 640, cy = 150; ctx.globalAlpha = 0.85; ctx.strokeStyle = '#e8eef8'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, 80, 0, 7); ctx.stroke(); for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 66, cy + Math.sin(a) * 66); ctx.lineTo(cx + Math.cos(a) * 76, cy + Math.sin(a) * 76); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - 56); ctx.moveTo(cx, cy); ctx.lineTo(cx + 40, cy + 10); ctx.stroke(); ctx.font = 'italic 900 24px Rubik'; ctx.fillStyle = '#e8eef8'; ctx.textAlign = 'center'; ctx.fillText('TIME HAS STOPPED', cx, cy + 120); ctx.restore(); } },
  };

  // ================= KRYZTIAN — religion & mythology =================
  const bolt = (ctx, x, y0, y1, col, w) => { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.shadowColor = col; ctx.shadowBlur = 20; ctx.beginPath(); ctx.moveTo(x, y0); let y = y0; while (y < y1) { y += 30; ctx.lineTo(x + R(-22, 22), Math.min(y, y1)); } ctx.stroke(); ctx.lineWidth = w * 0.4; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.restore(); };
  const mjolnir = (ctx, x, y, rot) => { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = '#6a4a2a'; ctx.fillRect(-4, -4, 8, 40); ctx.fillStyle = '#9aa4b0'; ctx.strokeStyle = '#333'; ctx.lineWidth = 3; ctx.fillRect(-26, -26, 52, 26); ctx.strokeRect(-26, -26, 52, 26); ctx.restore(); };
  S.kryztian = {
    s1: sp({ name: 'Zeus Bolt', s: 14, r: 18, dmg: 10, pose: 'raise', frame: (f, g, fr) => { if (fr === 14) { const o = f.opp, x = o.x; proj(g, f, { x, y: GY() - 300, w: 60, h: 600, life: 22, delay: 10, noClash: true, hit: H(10, { launch: true, heavy: true, ang: 80, col: '#fff6a0', sfx: 'thunder' }),
      update: (p) => { p.inactive = p.t < p.delay; if (p.t === p.delay) { G.sfx('thunder'); G.FX.flash(4, '#fff6a0'); G.FX.dust(p.x, GY(), 6, 1); } },
      draw: (ctx, p) => { if (p.t < p.delay) { ctx.fillStyle = 'rgba(255,246,160,0.35)'; ctx.fillRect(p.x - 30, 0, 60, GY()); return; } bolt(ctx, p.x, -40, GY(), '#fff6a0', 12); } }); } } }),
    s2: sp({ name: 'Lotus Palm', s: 10, a: 4, r: 16, lunge: 8, dmg: 9, hb: [20, -130, 84, 56], heavy: true, launch: true, hs: 24, bs: 14, kb: 14, kbg: 6, ang: 20, pose: 'jab',
      drawFx(ctx, f, fr) { if (fr < 9 || fr > 22) return; const [x, y] = hand(f); for (let i = 0; i < 8; i++) { ctx.save(); ctx.translate(x + f.face * 16, y); ctx.rotate(i * Math.PI / 4 + fr * 0.05); ctx.fillStyle = i % 2 ? '#ff8ac0' : '#ffc2dc'; ctx.beginPath(); ctx.ellipse(0, -18, 8, 18, 0, 0, 7); ctx.fill(); ctx.restore(); } C(ctx, x + f.face * 16, y, 7, '#ffe24d'); } }),
    s3: sp({ name: 'Pillar of Fire', s: 16, r: 18, dmg: '3x4', frame: (f, g, fr) => { if (fr === 16) { const x = Math.max(80, Math.min(1200, f.x + f.face * 260)); proj(g, f, { x, y: GY() - 200, w: 80, h: 400, life: 44, pierce: true, rehit: 9, noClash: true, hit: H(3, { hs: 18, ang: 85, kb: 5, kbg: 1 }),
      draw: (ctx, p, t) => { const k = Math.min(1, p.t / 6); for (let i = 0; i < 16; i++) { const yy = GY() - i * 26 * k, ww = 40 - i * 1.4 + Math.sin(t * 0.6 + i) * 6; C(ctx, p.x + Math.sin(t * 0.5 + i) * 6, yy, ww, i % 3 ? 'rgba(255,140,30,0.75)' : 'rgba(255,230,120,0.85)'); } } }); G.sfx('beam'); } } }),
    s4: sp({ name: 'Thunder Hammer', s: 18, r: 22, dmg: 12, frame: (f, g, fr) => { if (fr === 18) { const [x, y] = hand(f); proj(g, f, { x, y, vx: 16 * f.face, w: 56, h: 40, life: 120, pierce: true, rehit: 40, hit: H(12, { heavy: true, launch: true, ang: 45, col: '#7ab8ff', sfx: 'thunder' }),
      update: (p) => { p.vx -= p.face * 0.55; p.x += p.vx; if (p.t > 20 && Math.abs(p.x - f.x) < 34) p.life = 0; }, draw: (ctx, p, t) => { mjolnir(ctx, p.x, p.y, t * 0.5 * p.face); if (p.t % 4 < 2) bolt(ctx, p.x + R(-30, 30), p.y - 40, p.y + 40, '#7ab8ff', 3); } }); } } }),
    ult: { name: 'PANTHEON', len: 320,
      run(g, f, o, t) { hold(o, o.x, GY() - 100 - Math.min(80, t)); const seq = [[70, 'zeus'], [100, 'thor'], [130, 'ra'], [160, 'lotus'], [190, 'light']];
        for (const [tt, k] of seq) if (t === tt) { g.pantheonBeam = { k, t: 0 }; uhit(g, f, o, 4.2, { sfx: k === 'zeus' || k === 'thor' ? 'thunder' : 'beam' }); G.FX.shake(8, 10); }
        if (t === 240) { G.FX.flash(12, '#fff8d0'); G.sfx('thunder'); G.FX.shake(20, 30); g.pantheonBeam = { k: 'all', t: 0 }; }
        if (t === 262) { ufinal(g, f, o, 10, { ang: 75 }); g.pantheonBeam = null; } if (g.pantheonBeam) g.pantheonBeam.t++; },
      bg(ctx, g, f, o, t) { ctx.fillStyle = `rgba(20,10,40,${Math.min(0.65, t / 50)})`; ctx.fillRect(-400, -300, 2080, 1300);
        const icons = [['⚡', '#fff6a0'], ['🔨', '#7ab8ff'], ['☀', '#ff9a2a'], ['❀', '#ff8ac0'], ['✦', '#fff']]; ctx.font = '900 54px serif'; ctx.textAlign = 'center';
        icons.forEach(([s, c], i) => { const x = 240 + i * 200, y = 90 + Math.sin(g.t * 0.05 + i) * 10; ctx.globalAlpha = Math.min(1, Math.max(0, (t - 20 - i * 8) / 20)); ctx.shadowColor = c; ctx.shadowBlur = 24; ctx.fillStyle = c; ctx.fillText(s, x, y); }); ctx.globalAlpha = 1; ctx.shadowBlur = 0;
        const b = g.pantheonBeam; if (!b || b.t > 24) return; const ox = o.x, oy = o.y - 80;
        const draw1 = (k, i) => { const sx = 240 + i * 200, sy = 100; if (k === 'zeus' || k === 'thor') { ctx.save(); ctx.translate(sx, sy); const a = Math.atan2(oy - sy, ox - sx), d = Math.hypot(ox - sx, oy - sy); ctx.rotate(a - Math.PI / 2); bolt(ctx, 0, 0, d, k === 'zeus' ? '#fff6a0' : '#7ab8ff', 10); ctx.restore(); }
          else { ctx.strokeStyle = k === 'ra' ? '#ff9a2a' : k === 'lotus' ? '#ff8ac0' : '#fffbe0'; ctx.lineWidth = 28 * (1 - b.t / 24); ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 30; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ox, oy); ctx.stroke(); ctx.shadowBlur = 0; } };
        const ks = ['zeus', 'thor', 'ra', 'lotus', 'light']; if (b.k === 'all') ks.forEach(draw1); else draw1(b.k, ks.indexOf(b.k)); } },
  };

  // ================= HUNTER — darkness =================
  S.hunter = {
    s1: sp({ name: 'Void Orb', s: 12, r: 18, dmg: 8, frame: (f, g, fr) => { if (fr === 12) { const [x, y] = hand(f), o = f.opp; proj(g, f, { x, y, vx: 9 * f.face, w: 44, h: 44, life: 110, hit: H(8, { ang: 35, col: '#7a2cff' }),
      update: (p) => { p.x += p.vx; p.y += Math.sign(o.y - 90 - p.y) * 1.2; }, draw: (ctx, p, t) => { C(ctx, p.x, p.y, 26, 'rgba(122,44,255,0.35)'); C(ctx, p.x, p.y, 18, '#0d0d14'); ctx.strokeStyle = '#ff2a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, 18, t * 0.2, t * 0.2 + 4); ctx.stroke(); } }); } } }),
    s2: sp({ name: 'Dark Choke', s: 14, r: 24, dmg: 10, pose: 'cast', frame: (f, g, fr) => { if (fr === 14) { const [x, y] = hand(f); proj(g, f, { x, y, vx: 22 * f.face, w: 50, h: 120, life: 17, invisible: true, hit: H(1, { hs: 10, kb: 0.2, kbg: 0, push: 0 }),
      draw: (ctx, p) => { ctx.fillStyle = 'rgba(122,44,255,0.35)'; C(ctx, p.x, p.y, 16, 'rgba(122,44,255,0.4)'); },
      onHit: (p, o, g2) => { if (o.hp <= 0) return; G.FX.text(o.x, o.y - 200, 'KNEEL BEFORE THE DARK', '#ff2a3a', 22, 60); force(o, 70, (o2, g3, t) => { o2.vx = 0; o2.noGrav = true; o2.onGround = false; o2.y += (GY() - 110 - o2.y) * 0.1; if (t % 20 === 10) G.applyHit(f, o2, H(2.2, { proj: true, keepForced: true, hs: 14, kb: 0, kbg: 0 }), g3, o2.x, o2.y - 120);
        if (t === 69) { o2.noGrav = false; G.applyHit(f, o2, H(4, { proj: true, spike: true, ang: -80, kb: 12, heavy: true }), g3, o2.x, o2.y - 100); } }); } }); } } }),
    s3: sp({ name: 'Shadow Step', s: 6, r: 10, dmg: '—', pose: 'dash', frame: (f, g, fr) => { if (fr === 1) f.invuln = 18; if (fr === 6) { const o = f.opp; for (let i = 0; i < 14; i++) G.FX.pixels(f.x, f.y - 70, 1, '#3a1a6a'); f.x = Math.max(60, Math.min(1220, o.x - o.face * 70)); f.face = o.x > f.x ? 1 : -1; for (let i = 0; i < 14; i++) G.FX.pixels(f.x, f.y - 70, 1, '#7a2cff'); G.sfx('whoosh'); } } }),
    s4: sp({ name: 'Night Tendrils', s: 18, r: 24, dmg: '5x3', frame: (f, g, fr) => { if (fr === 18) for (let i = 0; i < 3; i++) { const x = f.x + f.face * (110 + i * 120); proj(g, f, { x, y: GY() - 80, w: 50, h: 160, life: 30 + i * 8, delay: i * 8, noClash: true, hit: H(5, { launch: true, ang: 78, kb: 9, lvl: 'low' }),
      update: (p) => { p.inactive = p.t < p.delay; }, draw: (ctx, p, t) => { if (p.t < p.delay) return; const k = Math.min(1, (p.t - p.delay) / 5); ctx.strokeStyle = '#0d0d14'; ctx.lineWidth = 16; ctx.lineCap = 'round'; for (let j = -1; j <= 1; j++) { ctx.beginPath(); ctx.moveTo(p.x + j * 14, GY()); ctx.quadraticCurveTo(p.x + j * 30 + Math.sin(t * 0.3 + j) * 20, GY() - 90 * k, p.x + j * 10, GY() - 170 * k); ctx.stroke(); } C(ctx, p.x, GY() - 170 * k, 4, '#ff2a3a'); } }); } } }),
    ult: { name: 'ALL EVIL', len: 310,
      run(g, f, o, t) { hold(o, o.x, GY() - 120); if (t > 40 && t < 250 && t % 14 === 0) { uhit(g, f, o, 2.2, { col: '#ff2a3a' }); const a = R(0, 6.28); vis(g, { life: 10, a, draw: (ctx, v) => { ctx.strokeStyle = '#000'; ctx.lineWidth = 22; ctx.lineCap = 'round'; const r0 = 500 - v.t * 40; ctx.beginPath(); ctx.moveTo(o.x + Math.cos(v.a) * 900, o.y - 90 + Math.sin(v.a) * 900); ctx.lineTo(o.x + Math.cos(v.a) * Math.max(30, r0), o.y - 90 + Math.sin(v.a) * Math.max(30, r0)); ctx.stroke(); } }); }
        if (t === 265) { G.FX.impact(6, o.x, o.y - 90); ufinal(g, f, o, 9, { ang: 50 }); } },
      bg(ctx, g, f, o, t) { ctx.fillStyle = `rgba(0,0,0,${Math.min(0.88, t / 30)})`; ctx.fillRect(-400, -300, 2080, 1300);
        for (let i = 0; i < 36; i++) { const x = (i * 157) % 1300, y = (i * 89) % 560 + 20, op = Math.max(0, Math.sin(t * 0.06 + i * 1.7)); if (t < i * 3) continue; ctx.fillStyle = `rgba(255,30,50,${op})`; ctx.beginPath(); ctx.ellipse(x - 9, y, 7, 3, 0.3, 0, 7); ctx.ellipse(x + 9, y, 7, 3, -0.3, 0, 7); ctx.fill(); } } },
  };

  // ================= AISHA — control =================
  const cursor = (ctx, x, y, s, grab) => { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
    if (grab) { G.rr(ctx, -10, -6, 22, 20, 6); ctx.fill(); ctx.stroke(); for (let i = 0; i < 4; i++) { G.rr(ctx, -10 + i * 6, -14, 5, 10, 2); ctx.fill(); ctx.stroke(); } }
    else { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 28); ctx.lineTo(7, 21); ctx.lineTo(12, 32); ctx.lineTo(17, 30); ctx.lineTo(12, 19); ctx.lineTo(21, 19); ctx.closePath(); ctx.fill(); ctx.stroke(); } ctx.restore(); };
  G.drawCursor = cursor;
  S.aisha = {
    s1: sp({ name: 'Override Cursor', s: 12, r: 20, dmg: 11, frame: (f, g, fr) => { if (fr === 12) { const [x, y] = hand(f); proj(g, f, { x, y, vx: 12 * f.face, w: 34, h: 40, life: 70, hit: H(2, { hs: 14, kb: 0.3, kbg: 0, push: 0, col: '#7ff3ff' }), draw: (ctx, p) => cursor(ctx, p.x, p.y - 14, 1.4),
      onHit: (p, o, g2) => { if (o.hp <= 0) return; G.sfx('select'); const tx = f.x + f.face * 120; force(o, 70, (o2, g3, t) => { o2.noGrav = true; o2.onGround = false; if (t < 45) { o2.x += (tx - o2.x) * 0.08; o2.y += (GY() - 330 - o2.y) * 0.08; } else { o2.vy = 26; o2.noGrav = false; }
        if (t === 69 || (t > 45 && o2.y >= GY() - 2)) { o2.forced = null; G.FX.landDust(o2.x, GY(), 2); G.applyHit(f, o2, H(9, { proj: true, heavy: true, launch: true, ang: 70, kb: 8 }), g3, o2.x, o2.y - 60); } });
        vis(g2, { life: 52, draw: (ctx, v) => cursor(ctx, o.x - 6, o.y - 160, 1.8, true) }); } }); } } }),
    s2: sp({ name: 'Gravity Pull', s: 10, r: 18, dmg: 3, pose: 'grab', frame: (f, g, fr) => { if (fr === 10) { const o = f.opp; if (Math.abs(o.x - f.x) < 650 && o.invuln <= 0 && o.state !== 'ko') { G.sfx('rewind'); vis(g, { life: 16, draw: (ctx, v) => { ctx.strokeStyle = 'rgba(56,225,255,0.8)'; ctx.lineWidth = 3; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(f.x + f.face * 40, f.y - 110); ctx.lineTo(o.x, o.y - 40 - i * 22); ctx.stroke(); } } });
      const r = G.applyHit(f, o, H(3, { proj: true, hs: 30, kb: 0, kbg: 0, push: 0 }), g, o.x + f.face * 10, o.y - 90); if (r === 'hit') { o.vx = 0; force(o, 14, (o2) => { o2.x += (f.x + f.face * 80 - o2.x) * 0.3; }); } } } } }),
    s3: sp({ name: 'Puppet Strings', s: 14, r: 20, dmg: 2, frame: (f, g, fr) => { if (fr === 14) { const [x, y] = hand(f); proj(g, f, { x, y, vx: 13 * f.face, w: 28, h: 28, life: 50, hit: H(2, { hs: 10, kb: 0, kbg: 0, push: 0 }), draw: (ctx, p) => { ctx.strokeStyle = '#7ff3ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(f.x, f.y - 120); ctx.lineTo(p.x, p.y); ctx.stroke(); C(ctx, p.x, p.y, 6, '#7ff3ff'); },
      onHit: (p, o, g2) => { if (o.hp <= 0) return; G.FX.text(o.x, o.y - 190, 'CONTROLLED (not forever)', '#7ff3ff', 22); force(o, 90, (o2, g3, t) => { const h = f.ctrl.held; o2.vx = (h.r - h.l) * 5; o2.face = o2.vx ? Math.sign(o2.vx) : o2.face; if (t % 30 === 29) G.applyHit(f, o2, H(2.5, { proj: true, keepForced: true, hs: 10, kb: 0, kbg: 0 }), g3, o2.x, o2.y - 90); });
        vis(g2, { life: 90, draw: (ctx) => { ctx.strokeStyle = 'rgba(127,243,255,0.85)'; ctx.lineWidth = 1.5; for (const dx of [-24, -8, 8, 24]) { ctx.beginPath(); ctx.moveTo(o.x + dx, 0); ctx.lineTo(o.x + dx * 0.6, o.y - 100 + Math.abs(dx)); ctx.stroke(); } ctx.fillStyle = '#b8c2cc'; ctx.fillRect(o.x - 40, 0, 80, 10); } }); } }); } } }),
    s4: sp({ name: 'System Slam', s: 20, r: 26, dmg: 14, pose: 'raise', frame: (f, g, fr) => { if (fr === 6) g.hudGrab(1 - f.side); if (fr === 20) { const o = f.opp; proj(g, f, { x: o.x, y: 40, vy: 4, grav: 1.4, w: 260, h: 40, life: 60, noClash: true, hit: H(14, { heavy: true, spike: true, ang: -70, kb: 10, lvl: 'ovh', col: '#7ff3ff' }),
      update: (p) => { p.vy += p.grav; p.y += p.vy; if (p.y > GY() - 20) { p.life = 0; G.FX.landDust(p.x, GY(), 2); G.FX.shake(12, 14); G.sfx('crack'); g.hudRelease(1 - f.side); } },
      draw: (ctx, p) => { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(0.08); ctx.fillStyle = '#111'; ctx.fillRect(-134, -24, 268, 48); ctx.fillStyle = '#ff3b3b'; ctx.fillRect(-128, -18, 256 * Math.max(0.05, o.hp / 100), 36); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.strokeRect(-134, -24, 268, 48); ctx.fillStyle = '#fff'; ctx.font = '900 18px Rubik'; ctx.textAlign = 'center'; ctx.fillText(o.ch.name + ' — HP', 0, 7); ctx.restore(); } }); } } }),
    ult: { name: 'TOTAL CONTROL', len: 320,
      run(g, f, o, t) { const bx = o.x + Math.cos(t * 0.18) * 140, by = o.y - 90 + Math.sin(t * 0.18) * 110; g.aishaBar = t > 40 && t < 250 ? [bx, by, t * 0.18] : null; if (t === 40) g.hudGrab(o.side);
        hold(o, 640 + Math.sin(t * 0.04) * 120, GY() - 140 + Math.sin(t * 0.07) * 60);
        if (t > 50 && t < 250 && t % 17 === 0) { uhit(g, f, o, 2.5, { col: '#7ff3ff', sfx: 'crack' }); G.FX.shake(6, 8); }
        if (t === 255) { g.aishaBar = null; g.hudRelease(o.side); g.screenTilt = 0.08; }
        if (t === 272) { g.screenTilt = 0; G.FX.shake(20, 20); ufinal(g, f, o, 8, { ang: -70, spike: true }); } },
      fg(ctx, g, f, o, t) { if (g.aishaBar) { const [x, y, a] = g.aishaBar; ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = '#111'; ctx.fillRect(-150, -20, 300, 40); ctx.fillStyle = '#ff3b3b'; ctx.fillRect(-144, -14, 288 * Math.max(0.05, o.hp / 100), 28); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.strokeRect(-150, -20, 300, 40); ctx.restore(); cursor(ctx, x - 10, y - 10, 1.6, true); }
        ctx.save(); ctx.strokeStyle = 'rgba(56,225,255,0.25)'; ctx.lineWidth = 1; for (let i = 0; i < 1280; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 720); ctx.stroke(); } for (let j = 0; j < 720; j += 40) { ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(1280, j); ctx.stroke(); } ctx.font = '900 18px monospace'; ctx.fillStyle = '#7ff3ff'; ctx.fillText('> sudo control ' + o.ch.name.toLowerCase() + ' --all', 30, 690); ctx.restore(); } },
  };

  // ================= JOLDYNE — autism, owls, patterns, hyperfocus =================
  S.joldyne = {
    s1: sp({ name: 'Owl Swoop', s: 10, r: 16, dmg: 8, frame: (f, g, fr) => { if (fr === 10) { const o = f.opp; G.sfx('hoot'); proj(g, f, { x: f.x - f.face * 10, y: f.y - 150, vx: 6 * f.face, vy: -6, w: 50, h: 40, life: 90, hit: H(8, { ang: 40, col: '#ffb347' }),
      update: (p) => { const dx = o.x - p.x, dy = o.y - 90 - p.y, d = Math.hypot(dx, dy) || 1; p.vx += dx / d * 1.3; p.vy += dy / d * 1.3; const s = Math.hypot(p.vx, p.vy); if (s > 13) { p.vx *= 13 / s; p.vy *= 13 / s; } p.x += p.vx; p.y += p.vy; },
      draw: (ctx, p, t) => { G.drawOwl(ctx, p.x, p.y, 1.3, p.vx > 0 ? 1 : -1, t); ctx.fillStyle = '#8a5a2b'; const fl = Math.sin(t * 0.8) * 16; ctx.beginPath(); ctx.moveTo(p.x - 8, p.y); ctx.lineTo(p.x - 34, p.y - 14 - fl); ctx.lineTo(p.x - 8, p.y + 8); ctx.moveTo(p.x + 8, p.y); ctx.lineTo(p.x + 34, p.y - 14 - fl); ctx.lineTo(p.x + 8, p.y + 8); ctx.fill(); } }); } } }),
    s2: sp({ name: 'Pattern Lock', s: 3, a: 40, r: 12, dmg: 11, pose: 'block', frame: (f, g, fr) => { if (fr === 3) { f.status.counter = 40; G.sfx('tick'); } if (fr > 3 && !f.status.counter && fr < 43) f.endMove(); },
      drawFx(ctx, f, fr) { if (fr < 3 || fr > 43 || !f.status.counter) return; ctx.save(); ctx.strokeStyle = 'rgba(255,179,71,0.8)'; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + fr * 0.05; ctx.beginPath(); ctx.moveTo(f.x, f.y - 80); ctx.lineTo(f.x + Math.cos(a) * 90, f.y - 80 + Math.sin(a) * 90); ctx.stroke(); } for (let r = 30; r < 100; r += 30) { ctx.beginPath(); ctx.arc(f.x, f.y - 80, r, 0, 7); ctx.stroke(); } ctx.restore(); } }),
    s3: sp({ name: 'Hyperfocus', s: 10, r: 10, dmg: '—', pose: 'temple', frame: (f, g, fr) => { if (fr === 10) { if (f.status.hfCd) { G.FX.text(f.x, f.y - 190, 'RECHARGING…', '#aaa', 20); return; } f.opp.status.slow = 90; f.status.hfCd = 540; f.status.focus = 180; G.sfx('rewind'); G.FX.text(f.x, f.y - 200, 'HYPERFOCUS', '#ffb347', 36); G.FX.ring(f.x, f.y - 80, 300, '#ffb347', 6, 30); } } }),
    s4: sp({ name: 'Night Hoot', s: 18, a: 10, r: 22, dmg: 9, hb: [20, -180, 330, 160], hs: 26, bs: 14, kb: 5, kbg: 2, ang: 20, pose: 'cast2',
      frame: (f, g, fr) => { if (fr === 18) { G.sfx('hoot'); for (let i = 0; i < 4; i++) G.FX.ring(f.x + f.face * (60 + i * 70), f.y - 110, 50 + i * 20, '#ffe0a0', 5, 18 + i * 3); } },
      onHit: (a, o, g) => { if (o.hp <= 0) return; force(o, 50, (o2) => { o2.vx = 0; }); G.FX.text(o.x, o.y - 190, 'STUNNED', '#ffe0a0', 26); vis(g, { life: 50, draw: (ctx, v) => { for (let i = 0; i < 3; i++) G.star && (ctx.fillStyle = '#ffe24d', G.star(ctx, o.x + Math.cos(v.t * 0.2 + i * 2) * 30, o.y - 160 + Math.sin(v.t * 0.2 + i * 2) * 8, 8)); } }); } }),
    ult: { name: 'PARLIAMENT OF OWLS', len: 330,
      run(g, f, o, t) { hold(o, o.x, GY() - 110 - Math.min(60, t * 0.5));
        if (t > 30 && t < 260 && t % 6 === 0) { const i = t / 6 | 0, a = i * 0.5; vis(g, { life: 26, a, i, draw: (ctx, v) => { const k = v.t / 26, sx = 640 + Math.cos(v.a) * 900, sy = -100 + Math.sin(v.a) * 120, x = sx + (o.x - sx) * k * k, y = sy + (o.y - 90 - sy) * k * k; G.drawOwl(ctx, x, y, 1.1, o.x > sx ? 1 : -1, g.t + v.i); } }); }
        if (t > 50 && t < 270 && t % 10 === 0) uhit(g, f, o, 1.05, { col: '#ffb347' });
        if (t === 275) vis(g, { life: 30, draw: (ctx, v) => G.drawOwl(ctx, (f.face > 0 ? -200 : 1480) + f.face * v.t * 70, o.y - 100, 5, f.face, g.t) });
        if (t === 290) { G.sfx('hoot'); ufinal(g, f, o, 10, { ang: 45 }); } },
      bg(ctx, g, f, o, t) { const a = Math.min(0.85, t / 40); ctx.fillStyle = `rgba(8,12,40,${a})`; ctx.fillRect(-400, -300, 2080, 1300); ctx.globalAlpha = a; C(ctx, 1000, 140, 90, '#fff6d8'); C(ctx, 970, 120, 18, '#ece0b8'); C(ctx, 1030, 170, 12, '#ece0b8');
        for (let i = 0; i < 60; i++) C(ctx, (i * 211) % 1400 - 60, (i * 67) % 400, 1.4, '#fff'); ctx.globalAlpha = 1; } },
  };
})();
