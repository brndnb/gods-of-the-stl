// ===== Special moves + ultimates, part 1 (helpers, James, Kyle, Laura, Lorenzo, Zephyra, Jacob) =====
(function () {
  const S = G.SPECIALS = {};
  const GY = () => G.GROUND;
  const R = (a, b) => a + Math.random() * (b - a);
  const C = (ctx, x, y, r, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, 7); ctx.fill(); };
  const hand = f => [f.x + f.face * 46, f.y - 112];
  const H = (dmg, x) => Object.assign({ dmg, hs: 16 + dmg, bs: 10 + (dmg * 0.6 | 0), push: 5, kb: 4 + dmg * 0.4, kbg: 2 + dmg * 0.35, ang: 32 }, x);
  const proj = (g, f, o) => { const p = Object.assign({ owner: f, t: 0, life: 120, w: 30, h: 30, vx: 0, vy: 0, grav: 0, hit: H(6), hitT: {}, face: f.face }, o); g.projectiles.push(p); return p; };
  const vis = (g, o) => { const v = Object.assign({ t: 0, life: 60 }, o); g.vis.push(v); return v; };
  const force = (o, len, fn) => { o.forced = { t: 0, len, fn }; o.move = null; o.setState('forced'); };
  const uhit = (g, f, o, dmg, x) => G.applyHit(f, o, Object.assign({ dmg, hs: 30, bs: 0, kb: 0.5, kbg: 0, ang: 90, unblockable: true, ult: true, keepForced: true, proj: true, noScale: true }, x), g, o.x - f.face * 30, o.y - 90);
  const ufinal = (g, f, o, dmg, x) => { o.forced = null; return G.applyHit(f, o, Object.assign({ dmg, hs: 40, kb: 16, kbg: 6, ang: 55, unblockable: true, ult: true, launch: true, heavy: true, proj: true, noScale: true }, x), g, o.x - f.face * 30, o.y - 90); };
  const hold = (o, x, y) => { o.x += (x - o.x) * 0.15; o.y += (y - o.y) * 0.15; o.vx = 0; o.vy = 0; o.onGround = o.y >= GY() - 1; };
  G.SPX = { H, proj, vis, force, uhit, ufinal, hold, hand, C, R };
  const sp = (o) => Object.assign({ s: 10, a: 1, r: 18, dmg: 0, pose: 'cast', silent: false }, o);

  // ================= JAMES — thoughts made real =================
  const cloudFist = (ctx, x, y, s, face) => { ctx.save(); ctx.translate(x, y); ctx.scale(face * s, s);
    for (const [dx, dy, r] of [[-18, 0, 18], [0, -10, 20], [18, 0, 18], [6, 12, 16], [-26, 10, 12]]) C(ctx, dx, dy, r + 3, '#9fb4ff');
    for (const [dx, dy, r] of [[-18, 0, 18], [0, -10, 20], [18, 0, 18], [6, 12, 16], [-26, 10, 12]]) C(ctx, dx, dy, r, '#fff');
    for (let i = 0; i < 4; i++) { C(ctx, 32, -14 + i * 9, 6, '#dfe8ff'); } ctx.restore(); };
  S.james = {
    s1: sp({ name: 'Thought Fist', s: 12, r: 20, dmg: 8, frame(f, g, fr) { if (fr === 12) { const [x, y] = hand(f); proj(g, f, { x, y, vx: 11 * f.face, w: 64, h: 46, life: 90, hit: H(8, { ang: 30, col: '#fff' }), draw: (ctx, p, t) => cloudFist(ctx, p.x, p.y, 1 + Math.sin(t * 0.3) * 0.05, p.face) }); G.sfx('whoosh', 1.2); } } }),
    s2: sp({ name: 'Mind Hammer', s: 14, a: 5, r: 20, lunge: 8, dmg: 11, pose: 'jhammer', hb: [10, -200, 120, 200], lvl: 'ovh', heavy: true, hs: 30, bs: 16, kb: 10, kbg: 6, ang: -60, spike: true, push: 4,
      drawFx(ctx, f, fr) { if (fr < 6) return; const k = Math.min(1, (fr - 6) / 12), a = -1.6 + k * 2.4; ctx.save(); ctx.translate(f.x, f.y - 140); ctx.rotate(a * f.face); ctx.globalAlpha = 0.9; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#9fb4ff'; ctx.lineWidth = 4; ctx.fillRect(-6 * f.face, -120, 12, 120); ctx.strokeRect(-6 * f.face, -120, 12, 120); G.rr(ctx, -40, -160, 80, 50, 14); ctx.fill(); ctx.stroke(); ctx.restore(); },
      frame(f, g, fr) { if (fr === 16) { G.FX.dust(f.x + f.face * 90, GY(), 10, 1.4); G.FX.shake(8, 10); G.sfx('heavy'); } } }),
    s3: sp({ name: 'Brain Cage', s: 16, r: 18, dmg: 4, frame(f, g, fr) { if (fr === 16) proj(g, f, { x: f.x + f.face * 40, y: GY() - 40, vx: 13 * f.face, w: 40, h: 60, life: 60, hit: H(4, { hs: 10, kb: 1, kbg: 0 }),
      draw: (ctx, p, t) => { ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); for (let i = -2; i <= 2; i++) { ctx.moveTo(p.x + i * 8, p.y - 30); ctx.lineTo(p.x + i * 8, p.y + 30); } ctx.stroke(); },
      onHit: (p, o, g) => { if (o.hp <= 0) return; force(o, 75, (o2, g2, t) => { o2.vx = 0; if (!o2.onGround) o2.vy += 0.5; }); vis(g, { life: 75, draw: (ctx, v) => { const x = o.x, y = o.y; ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 5; ctx.strokeRect(x - 40, y - 160, 80, 160); ctx.beginPath(); for (let i = 1; i < 6; i++) { ctx.moveTo(x - 40 + i * 13.3, y - 160); ctx.lineTo(x - 40 + i * 13.3, y); } ctx.stroke(); for (let i = 0; i < 4; i++) C(ctx, x - 40 + i * 27, y - 160, 12, '#fff'); } }); G.FX.text(o.x, o.y - 180, 'CAGED!', '#fff', 26); } }); } }),
    s4: sp({ name: 'Idea Cannon', s: 30, r: 26, dmg: 16, pose: 'cast2', drawFx(ctx, f, fr) { if (fr > 30) return; const [x, y] = hand(f); C(ctx, x, y, 8 + fr * 1.1, 'rgba(255,255,255,0.8)'); C(ctx, x, y, 4 + fr * 0.6, '#9fb4ff'); },
      frame(f, g, fr) { if (fr === 1) G.sfx('charge'); if (fr === 30) { const [x, y] = hand(f); G.FX.shake(10, 12); G.sfx('beam'); proj(g, f, { x, y, vx: 19 * f.face, w: 130, h: 96, life: 70, pierce: false, hit: H(16, { launch: true, heavy: true, ang: 35, kb: 14, kbg: 7 }),
        draw: (ctx, p, t) => { for (let i = 0; i < 6; i++) C(ctx, p.x - p.face * i * 26, p.y + Math.sin(t * 0.5 + i) * 10, 48 - i * 6, `rgba(255,255,255,${0.9 - i * 0.12})`); C(ctx, p.x, p.y, 30, '#dfe8ff'); } }); } } }),
    ult: { name: 'MIND BREAKER', len: 330,
      run(g, f, o, t) {
        hold(o, 760 + (f.x < 640 ? 0 : -240), GY() - 160); f.x += (f.x < 640 ? 300 - f.x : 980 - f.x) * 0.1;
        const things = ['hand', 'shark', 'train', 'sword', 'brain', 'piano', 'anvil', 'dragon', 'rocket', 'boxing'];
        if (t > 10 && t < 250 && t % 20 === 0) { const k = things[(t / 20 | 0) % things.length], fromL = (t / 20 | 0) % 2;
          vis(g, { life: 26, k, sx: fromL ? -100 : 1380, sy: R(100, 600), draw: (ctx, v) => { const q = v.t / 18, x = v.sx + (o.x - v.sx) * Math.min(1, q), y = v.sy + (o.y - 90 - v.sy) * Math.min(1, q); thought(ctx, v.k, x, y, fromL ? 1 : -1, g.t); } });
        }
        if (t > 28 && t < 268 && t % 20 === 8) { uhit(g, f, o, 2.4); G.FX.shake(6, 8); }
        if (t === 280) { ufinal(g, f, o, 9, { ang: 70 }); G.FX.impact(5, o.x, o.y - 90); }
      },
      bg(ctx, g, f, o, t) { ctx.save(); ctx.globalAlpha = Math.min(0.92, t / 30); ctx.fillStyle = '#f6f7ff'; ctx.fillRect(-400, -300, 2080, 1300);
        ctx.strokeStyle = 'rgba(80,90,140,0.25)'; ctx.lineWidth = 2; for (let i = 0; i < 40; i++) { const x = (i * 211) % 1400 - 60, y = (i * 137) % 760 - 20; ctx.beginPath(); ctx.arc(x, y, 20 + (i % 5) * 9, 0, 7); ctx.stroke(); }
        ctx.fillStyle = 'rgba(80,90,140,0.4)'; ctx.font = 'italic 900 26px Rubik'; ['what if...', 'IMAGINE', 'think BIGGER', '???!', 'ideas'].forEach((s, i) => ctx.fillText(s, 120 + i * 230, 120 + (i % 2) * 380 + Math.sin(g.t * 0.03 + i) * 20)); ctx.restore(); },
    },
  };
  function thought(ctx, k, x, y, d, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(d, 1); ctx.lineWidth = 4; ctx.strokeStyle = '#4a5a9a'; ctx.fillStyle = '#fff';
    switch (k) {
      case 'hand': G.rr(ctx, -40, -30, 60, 60, 16); ctx.fill(); ctx.stroke(); for (let i = 0; i < 4; i++) { G.rr(ctx, 18, -28 + i * 15, 30, 12, 6); ctx.fill(); ctx.stroke(); } break;
      case 'shark': ctx.beginPath(); ctx.moveTo(-70, 0); ctx.quadraticCurveTo(0, -40, 60, 0); ctx.quadraticCurveTo(0, 30, -70, 0); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-10, -18); ctx.lineTo(0, -48); ctx.lineTo(14, -16); ctx.fill(); ctx.stroke(); ctx.beginPath(); for (let i = 0; i < 5; i++) { ctx.moveTo(30 + i * 5, 2); ctx.lineTo(32 + i * 5, 10); } ctx.stroke(); break;
      case 'train': G.rr(ctx, -80, -40, 120, 70, 8); ctx.fill(); ctx.stroke(); ctx.fillRect(30, -10, 40, 40); ctx.strokeRect(30, -10, 40, 40); for (const wx of [-60, -20, 20]) { ctx.beginPath(); ctx.arc(wx, 34, 12, 0, 7); ctx.fill(); ctx.stroke(); } break;
      case 'sword': ctx.fillRect(-60, -6, 110, 12); ctx.strokeRect(-60, -6, 110, 12); ctx.beginPath(); ctx.moveTo(50, -6); ctx.lineTo(74, 0); ctx.lineTo(50, 6); ctx.fill(); ctx.stroke(); ctx.fillRect(-66, -22, 8, 44); ctx.strokeRect(-66, -22, 8, 44); break;
      case 'brain': for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.arc(-30 + (i % 4) * 20, -10 + (i / 4 | 0) * 20, 18, 0, 7); ctx.fill(); ctx.stroke(); } break;
      case 'piano': ctx.fillRect(-60, -40, 120, 60); ctx.strokeRect(-60, -40, 120, 60); ctx.fillStyle = '#4a5a9a'; for (let i = 0; i < 8; i++) if (i % 3 !== 2) ctx.fillRect(-54 + i * 15, -40, 8, 34); break;
      case 'anvil': ctx.beginPath(); ctx.moveTo(-50, -30); ctx.lineTo(60, -30); ctx.lineTo(40, -10); ctx.lineTo(20, -10); ctx.lineTo(30, 30); ctx.lineTo(-30, 30); ctx.lineTo(-20, -10); ctx.lineTo(-50, -10); ctx.closePath(); ctx.fill(); ctx.stroke(); break;
      case 'dragon': ctx.beginPath(); ctx.moveTo(-80, 10); for (let i = 0; i < 6; i++) ctx.quadraticCurveTo(-60 + i * 25, -30 * (i % 2 ? 1 : -1), -50 + i * 25, 0); ctx.lineTo(80, -10); ctx.lineTo(70, 14); ctx.closePath(); ctx.fill(); ctx.stroke(); break;
      case 'rocket': ctx.beginPath(); ctx.moveTo(70, 0); ctx.lineTo(30, -20); ctx.lineTo(-50, -20); ctx.lineTo(-50, 20); ctx.lineTo(30, 20); ctx.closePath(); ctx.fill(); ctx.stroke(); C(ctx, -60, 0, 14 + Math.random() * 6, '#ffb347'); break;
      default: C(ctx, 0, 0, 34, '#fff'); ctx.stroke(); ctx.fillStyle = '#e33'; G.rr(ctx, -20, -20, 50, 40, 14); ctx.fill();
    }
    ctx.restore();
  }

  // ================= KYLE — games =================
  const PIPS = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
  const die = (ctx, x, y, s, n, rot) => { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = '#111'; G.rr(ctx, -s / 2 - 2, -s / 2 - 2, s + 4, s + 4, 6); ctx.fill(); ctx.fillStyle = '#fff'; G.rr(ctx, -s / 2, -s / 2, s, s, 5); ctx.fill(); for (const [a, b] of PIPS[n]) C(ctx, a * s * 0.27, b * s * 0.27, s * 0.09, '#c51d2a'); ctx.restore(); };
  const card = (ctx, x, y, rot, col, label) => { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = '#111'; G.rr(ctx, -16, -24, 32, 48, 5); ctx.fill(); ctx.fillStyle = col; G.rr(ctx, -14, -22, 28, 44, 4); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(0, 0, 10, 16, 0.5, 0, 7); ctx.fill(); ctx.fillStyle = col; ctx.font = '900 12px Rubik'; ctx.textAlign = 'center'; ctx.fillText(label, 0, 5); ctx.restore(); };
  G.drawDie = die; G.drawCard = card;
  S.kyle = {
    s1: sp({ name: 'Dice Roll', s: 10, r: 18, dmg: '3-12', frame(f, g, fr) { if (fr === 10) { const n = 1 + (Math.random() * 6 | 0); f.dieFace = n; const [x, y] = hand(f); G.sfx('dice');
      proj(g, f, { x, y, vx: 10 * f.face, vy: -6, grav: 0.45, bounce: true, w: 30, h: 30, life: 110, n, hit: H(1.5 + n * 1.75, { ang: 40 + n * 4, launch: n >= 5, heavy: n === 6 }), draw: (ctx, p, t) => die(ctx, p.x, p.y, 28, p.t < 30 ? 1 + (t >> 2) % 6 : p.n, p.t * 0.3 * p.face),
        onHit: (p, o) => G.FX.text(o.x, o.y - 180, 'ROLLED ' + p.n + '!', p.n === 6 ? '#ffd34d' : '#fff', 26) }); } } }),
    s2: sp({ name: "Knight's Move", s: 6, a: 22, r: 10, keepAir: true, dmg: 10, pose: 'jdrop', lvl: 'ovh', heavy: true, hs: 28, bs: 14, kb: 9, kbg: 5, ang: 70, launch: true, hb: [-20, -100, 90, 110],
      frame(f, g, fr, m) { if (fr === 1) { f.vy = -17; f.onGround = false; f.vx = 0; f.noGrav = false; } if (fr === 14) { const o = f.opp; const d = Math.max(-260, Math.min(260, o.x - f.x)); f.vx = d / 10; f.vy = 4; G.FX.speed(f.x, f.y - 60, f.face); }
        if (fr > 14 && fr < 28) { f.vy = Math.max(f.vy, 14); m.def.keepAir = false; } if (fr === 1) m.def.keepAir = true; },
      drawFx(ctx, f, fr) { ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = '#ddd'; ctx.font = '900 54px serif'; ctx.textAlign = 'center'; ctx.fillText('♞', f.x, f.y - 160); ctx.restore(); } }),
    s3: sp({ name: 'Falling Blocks', s: 14, r: 16, dmg: '5x3', pose: 'raise', frame(f, g, fr) { if (fr === 14) { const o = f.opp; const shapes = [[[0, 0], [1, 0], [2, 0], [3, 0]], [[0, 0], [1, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [2, 0], [1, 1]], [[0, 0], [0, 1], [1, 1], [2, 1]]], cols = ['#38e1ff', '#ffd34d', '#c56bff', '#ff8a2a'];
      for (let i = 0; i < 3; i++) { const sh = shapes[(Math.random() * 4) | 0], col = cols[i % 4]; proj(g, f, { x: o.x + (i - 1) * 70, y: -40 - i * 90, vy: 2, grav: 0.35, w: 70, h: 40, life: 140, sh, col, hit: H(5, { lvl: 'ovh', ang: -40, spike: true }),
        draw: (ctx, p) => { for (const [a, b] of p.sh) { ctx.fillStyle = '#111'; ctx.fillRect(p.x - 35 + a * 18 - 1, p.y - 20 + b * 18 - 1, 20, 20); ctx.fillStyle = p.col; ctx.fillRect(p.x - 35 + a * 18, p.y - 20 + b * 18, 18, 18); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(p.x - 35 + a * 18, p.y - 20 + b * 18, 18, 4); } },
        update: (p, g2) => { p.vy += p.grav; p.y += p.vy; if (p.y > GY() - 20) { p.life = 0; G.FX.dust(p.x, GY(), 4, 0.6); G.sfx('land', 0.5); } } }); } } } }),
    s4: sp({ name: 'Jackpot', s: 22, r: 30, dmg: '6 / 18', pose: 'cast2', frame(f, g, fr) {
      if (fr === 1) { f.jack = Math.random() < 0.3 ? 7 : -1; const sy = [R(0, 9) | 0, R(0, 9) | 0, R(0, 9) | 0]; if (f.jack === 7) sy.fill(7); else if (sy[0] === sy[1] && sy[1] === sy[2]) sy[2] = (sy[2] + 1) % 10;
        vis(g, { life: 70, draw: (ctx, v) => { const x = f.x, y = f.y - 230; ctx.fillStyle = '#111'; G.rr(ctx, x - 80, y - 30, 160, 60, 10); ctx.fill(); ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 4; ctx.stroke();
          for (let i = 0; i < 3; i++) { const stop = v.t > 10 + i * 6; ctx.fillStyle = '#fff'; ctx.fillRect(x - 70 + i * 48, y - 22, 40, 44); ctx.fillStyle = stop && sy[i] === 7 ? '#d01c2c' : '#111'; ctx.font = '900 32px Rubik'; ctx.textAlign = 'center'; ctx.fillText(stop ? sy[i] : (v.t * 3 + i * 4) % 10, x - 50 + i * 48, y + 12); } } }); G.sfx('dice'); }
      if (fr === 22) { const [x, y] = hand(f); if (f.jack === 7) { G.FX.text(f.x, f.y - 280, 'JACKPOT!!!', '#ffd34d', 44); G.sfx('confirm'); G.FX.flash(6, '#ffd34d');
        proj(g, f, { x, y, vx: 16 * f.face, w: 140, h: 120, life: 60, hit: H(18, { launch: true, heavy: true, ang: 45, kb: 15, kbg: 7, col: '#ffd34d' }), draw: (ctx, p, t) => { for (let i = 0; i < 14; i++) C(ctx, p.x + Math.sin(i * 2.3 + t * 0.4) * 50, p.y + Math.cos(i * 1.7 + t * 0.3) * 45, 10, i % 2 ? '#ffd34d' : '#e8a020'); } }); }
        else { G.FX.text(f.x, f.y - 280, 'NO LUCK…', '#aaa', 30); for (let i = 0; i < 3; i++) proj(g, f, { x, y, vx: (8 + i * 2) * f.face, vy: -4 + i * 2, grav: 0.2, w: 22, h: 22, life: 60, hit: H(2.2, { ang: 30 }), draw: (ctx, p) => { C(ctx, p.x, p.y, 10, '#e8a020'); C(ctx, p.x, p.y, 6, '#ffd34d'); } }); } } } }),
    ult: { name: 'GAME NIGHT OVERLOAD', len: 330,
      run(g, f, o, t) {
        hold(o, f.x + f.face * 330, GY() - 170 - Math.sin(t * 0.05) * 20);
        if (t < 90 && t % 6 === 0) { const lab = ['+4', '+2', '⊘', '7', '+4'][(t / 6) % 5]; const col = ['#d01c2c', '#1f8fff', '#2bbf4a', '#ffd34d'][(t / 6) % 4];
          vis(g, { life: 14, draw: (ctx, v) => { const q = v.t / 14, x = f.x + (o.x - f.x) * q, y = f.y - 110 + (o.y - 90 - f.y + 110) * q; card(ctx, x, y, v.t * 0.6, col, lab); } }); if (t > 10) uhit(g, f, o, 0.9, { sfx: 'card' }); }
        if (t >= 90 && t < 160 && t % 7 === 0) { const sx = o.x + R(-60, 60); vis(g, { life: 16, draw: (ctx, v) => { const y = -40 + (o.y - 60) * v.t / 16; ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(sx, y, 22, 8, 0, 0, 7); ctx.fill(); ctx.fillStyle = ['#d01c2c', '#1f1f1f', '#2b6be0'][v.t % 3]; ctx.beginPath(); ctx.ellipse(sx, y - 2, 20, 7, 0, 0, 7); ctx.fill(); } }); uhit(g, f, o, 1.1, { sfx: 'block' }); }
        if (t >= 160 && t < 250) { if (t === 160) vis(g, { life: 100, draw: (ctx, v) => { const x = o.x - 140, y = o.y - 260; ctx.fillStyle = '#1f5fe0'; ctx.fillRect(x, y, 280, 240); for (let i = 0; i < 7; i++) for (let j = 0; j < 6; j++) { const filled = (i * 6 + j) < v.t / 2.2; C(ctx, x + 22 + i * 39, y + 22 + j * 39, 15, filled ? ((i + j) % 2 ? '#d01c2c' : '#ffd34d') : '#0b0b12'); } } }); if (t % 9 === 0) uhit(g, f, o, 1.3, { sfx: 'land' }); }
        if (t === 262) vis(g, { life: 50, draw: (ctx, v) => { ctx.save(); ctx.translate(o.x + f.face * 60, GY()); ctx.rotate(-f.face * Math.min(1.5, v.t * 0.08)); ctx.fillStyle = '#f2f2f2'; ctx.strokeStyle = '#111'; ctx.lineWidth = 4; ctx.font = '900 260px serif'; ctx.textAlign = 'center'; ctx.strokeText('♚', 0, 0); ctx.fillText('♚', 0, 0); ctx.restore(); } });
        if (t === 282) { ufinal(g, f, o, 9, { ang: 40 }); G.FX.text(640, 220, 'CHECKMATE', '#fff', 70, 80); }
      } },
  };

  // ================= LAURA — life =================
  const vineLine = (ctx, x0, y0, x1, y1, t, w) => { ctx.strokeStyle = '#2f9d3a'; ctx.lineWidth = w || 7; ctx.lineCap = 'round'; ctx.beginPath(); const n = 18; for (let i = 0; i <= n; i++) { const k = i / n, x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k + Math.sin(k * 9 + t * 0.3) * 8 * (1 - k); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); for (let i = 1; i < 5; i++) G.leaf(ctx, x0 + (x1 - x0) * i / 5, y0 + (y1 - y0) * i / 5, i, 9, '#5fd16a'); };
  S.laura = {
    s1: sp({ name: 'Vine Whip', s: 9, a: 6, r: 16, dmg: 8, hb: [20, -118, 210, 30], hs: 22, bs: 13, kb: 7, kbg: 4, ang: 25, push: 7, pose: 'cast',
      drawFx(ctx, f, fr) { const [x, y] = hand(f); const ext = fr < 9 ? fr / 9 * 120 : fr <= 15 ? 220 : Math.max(0, 220 - (fr - 15) * 14); vineLine(ctx, x, y, x + f.face * ext, y - 6, fr); } }),
    s2: sp({ name: 'Thorn Burst', s: 16, r: 18, dmg: 9, pose: 'raise', frame(f, g, fr) { if (fr === 16) { const o = f.opp; proj(g, f, { x: o.x, y: GY() - 60, w: 70, h: 120, life: 34, delay: 12, hit: H(9, { launch: true, ang: 82, kb: 12, kbg: 6, lvl: 'low' }),
      update: (p) => { if (p.t < p.delay) p.inactive = true; else p.inactive = false; }, draw: (ctx, p) => { if (p.t < p.delay) { ctx.fillStyle = 'rgba(80,200,80,0.5)'; ctx.beginPath(); ctx.ellipse(p.x, GY(), 40, 8, 0, 0, 7); ctx.fill(); return; } const k = Math.min(1, (p.t - p.delay) / 6);
        for (let i = -3; i <= 3; i++) { ctx.fillStyle = i % 2 ? '#2f7d2a' : '#3fbf4f'; ctx.beginPath(); ctx.moveTo(p.x + i * 12 - 9, GY()); ctx.lineTo(p.x + i * 14, GY() - (120 - Math.abs(i) * 22) * k); ctx.lineTo(p.x + i * 12 + 9, GY()); ctx.fill(); } } }); G.FX.dust(o.x, GY(), 6, 0.8); } } }),
    s3: sp({ name: 'Possession Spore', s: 12, r: 22, dmg: 2, frame(f, g, fr) { if (fr === 12) { const [x, y] = hand(f); proj(g, f, { x, y, vx: 7.5 * f.face, w: 30, h: 30, life: 120, y0: y, hit: H(2, { hs: 14, kb: 1, kbg: 0, push: 1 }),
      update: (p) => { p.x += p.vx; p.y = p.y0 + Math.sin(p.t * 0.2) * 16; }, draw: (ctx, p, t) => { C(ctx, p.x, p.y, 16, 'rgba(125,255,90,0.3)'); C(ctx, p.x, p.y, 9, '#7dff5a'); for (let i = 0; i < 5; i++) C(ctx, p.x + Math.cos(t * 0.2 + i) * 14, p.y + Math.sin(t * 0.2 + i) * 14, 2, '#d8ffb0'); },
      onHit: (p, o) => { if (o.hp <= 0) return; o.status.possessed = 120; G.sfx('possess'); G.FX.text(o.x, o.y - 190, 'POSSESSED!', '#7dff5a', 32); } }); } } }),
    s4: sp({ name: 'Bloom Crush', s: 22, a: 6, r: 26, dmg: 15, hb: [110, -180, 190, 180], heavy: true, launch: true, hs: 30, bs: 16, kb: 13, kbg: 7, ang: 72, pose: 'cast2',
      drawFx(ctx, f, fr) { const x = f.x + f.face * 205, y = GY(); const open = fr < 22 ? 1 : Math.max(0, 1 - (fr - 22) / 5);
        ctx.strokeStyle = '#2f9d3a'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 90); ctx.stroke();
        for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.45 * open; ctx.save(); ctx.translate(x, y - 90); ctx.rotate(a); ctx.fillStyle = i % 2 ? '#ff5aa0' : '#ff8ac0'; ctx.beginPath(); ctx.ellipse(0, -45, 22, 50, 0, 0, 7); ctx.fill(); ctx.restore(); } C(ctx, x, y - 90, 14, '#ffe24d'); } }),
    ult: { name: 'OVERGROWTH', len: 300,
      run(g, f, o, t) { hold(o, o.x, GY() - 120 - Math.min(140, t * 1.2));
        if (t % 24 === 0 && t > 20 && t < 250) { uhit(g, f, o, 3.2, { col: '#7dff5a' }); G.FX.dust(o.x + R(-60, 60), GY(), 4, 1); G.FX.shake(7, 8); }
        if (t === 270) ufinal(g, f, o, 7, { ang: 85 }); },
      bg(ctx, g, f, o, t) { const x = o.x, h = Math.min(520, t * 5); const tw = 60 + Math.min(60, t * 0.4);
        ctx.fillStyle = '#5a3a1a'; ctx.beginPath(); ctx.moveTo(x - tw, GY()); ctx.quadraticCurveTo(x - tw * 0.4, GY() - h * 0.5, x - 30, GY() - h); ctx.lineTo(x + 30, GY() - h); ctx.quadraticCurveTo(x + tw * 0.4, GY() - h * 0.5, x + tw, GY()); ctx.fill();
        for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.33, r = Math.min(260, t * 2.5); C(ctx, x + Math.cos(a) * r, GY() - h + Math.sin(a) * r * 0.6, 70 + (i % 3) * 15, i % 2 ? '#2f9d3a' : '#3fbf4f'); }
        ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 12; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(x + (i - 2) * 50, GY()); ctx.quadraticCurveTo(x + (i - 2) * 30 + Math.sin(t * 0.1 + i) * 30, o.y - 80, x + Math.cos(t * 0.15 + i) * 30, o.y - 60 - i * 20); ctx.stroke(); } } },
  };

  // ================= LORENZO — rogue creatures =================
  const BEASTS = {
    lion:  { col: '#d9a040', spd: 6, dmg: 8, rng: 80, hp: 22, w: 110, h: 70 },
    eagle: { col: '#6a4a2a', spd: 7, dmg: 7, rng: 70, hp: 14, w: 90, h: 50, fly: true },
    wolf:  { col: '#7a7a8a', spd: 8, dmg: 5, rng: 70, hp: 16, w: 100, h: 60 },
    bear:  { col: '#5a3a1a', spd: 3.6, dmg: 12, rng: 90, hp: 32, w: 120, h: 100 },
    rhino: { col: '#8a8a90', spd: 4.5, dmg: 11, rng: 100, hp: 30, w: 140, h: 90, charge: true },
    cobra: { col: '#3a7a2a', spd: 3, dmg: 6, rng: 260, hp: 14, w: 80, h: 70, spit: true },
  };
  G.drawBeast = function (ctx, kind, x, y, face, t, atk) {
    const b = BEASTS[kind] || BEASTS.lion; ctx.save(); ctx.translate(x, y); ctx.scale(face, 1); ctx.lineWidth = 3; ctx.strokeStyle = '#111'; ctx.fillStyle = b.col; const run = Math.sin(t * 0.4) * 8, a = atk ? 1 : 0;
    switch (kind) {
      case 'eagle': { const fl = Math.sin(t * 0.5) * 30; ctx.beginPath(); ctx.ellipse(0, 0, 32, 14, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-10, -4); ctx.lineTo(-30, -30 - fl); ctx.lineTo(10, -6); ctx.fill(); ctx.stroke(); C(ctx, 30, -6, 11, '#fff'); ctx.fillStyle = '#ffb000'; ctx.beginPath(); ctx.moveTo(38, -8); ctx.lineTo(50, -2); ctx.lineTo(38, 0); ctx.fill(); C(ctx, 32, -9, 2, '#111'); break; }
      case 'cobra': ctx.lineWidth = 14; ctx.strokeStyle = b.col; ctx.beginPath(); ctx.moveTo(-40, 0); ctx.quadraticCurveTo(-10, -10, 0, -30); ctx.quadraticCurveTo(6, -50, 14, -60); ctx.stroke(); ctx.fillStyle = b.col; ctx.beginPath(); ctx.ellipse(16, -64, 18, 12, 0, 0, 7); ctx.fill(); C(ctx, 22, -66, 2.5, '#ff0'); if (a) { ctx.strokeStyle = '#f33'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(32, -62); ctx.lineTo(42, -58); ctx.stroke(); } break;
      default: {
        const L = kind === 'bear' ? 1.25 : kind === 'rhino' ? 1.3 : kind === 'wolf' ? 0.9 : 1;
        ctx.scale(L, L);
        for (const [lx, ph] of [[-28, 0], [-18, 2], [18, 1], [28, 3]]) { ctx.fillStyle = G.shade(b.col, -0.2); ctx.fillRect(lx - 5, -20, 10, 20 + Math.sin(t * 0.4 + ph) * 4); }
        ctx.fillStyle = b.col; ctx.beginPath(); ctx.ellipse(0, -32, 40, 20, 0, 0, 7); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(40 + a * 8, -44 - run * 0.2, 18, 15, 0.2, 0, 7); ctx.fill(); ctx.stroke();
        if (kind === 'lion') { ctx.fillStyle = '#8a4a10'; ctx.beginPath(); ctx.arc(36 + a * 8, -46, 22, 0, 7); ctx.fill(); ctx.fillStyle = b.col; ctx.beginPath(); ctx.ellipse(42 + a * 8, -44, 14, 12, 0, 0, 7); ctx.fill(); }
        if (kind === 'rhino') { ctx.fillStyle = '#ddd'; ctx.beginPath(); ctx.moveTo(52, -48); ctx.lineTo(70, -66); ctx.lineTo(58, -42); ctx.fill(); }
        if (kind === 'wolf') { ctx.beginPath(); ctx.moveTo(34, -56); ctx.lineTo(38, -70); ctx.lineTo(44, -56); ctx.fill(); }
        C(ctx, 48 + a * 8, -48, 2.5, '#111'); ctx.strokeStyle = b.col; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-38, -34); ctx.quadraticCurveTo(-56, -40 + run, -60, -26); ctx.stroke();
        if (a) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(60 + i * 6, -60 + i * 10); ctx.lineTo(80 + i * 6, -40 + i * 10); ctx.stroke(); } }
      }
    }
    ctx.restore();
  };
  G.BEASTS = BEASTS;
  S.lorenzo = {
    s1: sp({ name: 'Wild Summon', s: 14, r: 4, dmg: 'varies', pose: 'raise', frame(f, g, fr) { if (fr === 14) {
      const kinds = Object.keys(BEASTS); let k = kinds[(Math.random() * kinds.length) | 0]; if (k === f.lastBeast) k = kinds[(kinds.indexOf(k) + 1) % kinds.length]; f.lastBeast = k; const b = BEASTS[k];
      const m = { owner: f, kind: k, b, x: f.x + f.face * 60, y: b.fly ? GY() - 200 : GY(), vx: 0, vy: 0, face: f.face, hp: b.hp, w: b.w, h: b.h, t: 0, life: 360, atk: 0, cd: 0, hitDone: false,
        update: beastUpdate, draw: (ctx, m2, t) => { ctx.save(); if (m2.life < 30) ctx.globalAlpha = m2.life / 30; G.drawBeast(ctx, m2.kind, m2.x, m2.y, m2.face, t, m2.atk > 4); ctx.restore(); } };
      g.minions.push(m); f.summon = m; f.move = null; f.setState('summoning'); G.sfx(k === 'eagle' ? 'screech' : 'roar'); G.FX.dust(m.x, GY(), 10, 1.2); G.FX.text(m.x, GY() - 180, k.toUpperCase() + '!', '#ffb35a', 34); } } }),
    s2: sp({ name: 'Tiger Pounce', s: 10, a: 12, r: 14, keepAir: true, dmg: 9, hb: [0, -130, 90, 110], heavy: false, hs: 22, bs: 12, kb: 8, kbg: 5, ang: 35, pose: 'jkick',
      frame(f, g, fr, m) { if (fr === 10) { f.vy = -9; f.vx = 11 * f.face; f.onGround = false; G.FX.dust(f.x, GY(), 6, 0.8, -f.face); G.sfx('roar'); m.def.keepAir = true; } if (fr === 12) m.def.keepAir = false; } }),
    s3: sp({ name: 'Cape Lash', s: 8, a: 5, r: 14, dmg: 7, hb: [10, -150, 120, 90], hs: 20, bs: 12, kb: 7, kbg: 4, ang: 40, pose: 'straight',
      drawFx(ctx, f, fr) { if (fr < 6 || fr > 16) return; const x = f.x + f.face * 90, y = f.y - 110; ctx.save(); ctx.translate(x, y); ctx.scale(f.face, 1); ctx.fillStyle = '#f08a1c'; ctx.strokeStyle = '#111'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 0, 40, 28, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(10 + i * 6, -6); ctx.lineTo(13 + i * 6, 6); ctx.lineTo(16 + i * 6, -6); ctx.fill(); } C(ctx, 14, -14, 4, '#ffe24d'); ctx.restore(); } }),
    s4: sp({ name: 'Alpha Roar', s: 20, a: 8, r: 24, dmg: 10, hb: [0, -220, 260, 220], heavy: true, launch: true, hs: 26, bs: 16, kb: 13, kbg: 6, ang: 55, pose: 'cast2',
      frame(f, g, fr) { if (fr === 20) { G.sfx('roar'); G.FX.shake(12, 20); for (let i = 0; i < 3; i++) G.FX.ring(f.x + f.face * 60, f.y - 110, 140 + i * 70, '#ffb35a', 8, 22 + i * 4); } } }),
    ult: { name: 'STAMPEDE', len: 300,
      run(g, f, o, t) { hold(o, 640 + Math.sin(t * 0.1) * 40, GY() - 120 - Math.abs(Math.sin(t * 0.13)) * 120);
        if (t > 20 && t < 250 && t % 14 === 0) { const kinds = ['lion', 'rhino', 'bear', 'wolf', 'lion', 'rhino']; const k = kinds[(t / 14 | 0) % kinds.length]; const y = GY() - R(0, 30);
          vis(g, { life: 50, k, y, draw: (ctx, v) => { const x = (f.face > 0 ? -160 : 1440) + f.face * v.t * 36; G.drawBeast(ctx, v.k, x, v.y, f.face, g.t, true); if (v.t % 3 === 0) G.FX.dust(x - f.face * 40, GY(), 2, 0.8, -f.face); } }); }
        if (t > 40 && t < 260 && t % 14 === 6) { uhit(g, f, o, 2.2); G.FX.shake(5, 6); }
        if (t === 275) ufinal(g, f, o, 9, { ang: 35 }); },
      bg(ctx, g, f, o, t) { ctx.fillStyle = `rgba(120,70,20,${Math.min(0.35, t / 120)})`; ctx.fillRect(-400, -300, 2080, 1300); } },
  };
  function beastUpdate(m, g) {
    const f = m.owner, c = f.ctrl, h = c.held, b = m.b, o = f.opp; m.t++; m.life--; if (m.cd > 0) m.cd--;
    if (f.state !== 'summoning') { m.life = Math.min(m.life, 20); }
    if (c.fresh && c.fresh.blk && m.t > 10) { g.endSummon(f); return; }
    if (m.atk > 0) { m.atk--; if (m.atk === 10 && b.spit) g.projectiles.push({ owner: f, x: m.x + m.face * 40, y: m.y - 64, vx: 10 * m.face, vy: 0, grav: 0, w: 22, h: 14, t: 0, life: 50, hitT: {}, face: m.face, hit: H(b.dmg, { ang: 20, col: '#7dff5a' }), draw: (ctx, p) => { C(ctx, p.x, p.y, 7, '#7dff5a'); } });
      if (!b.spit && m.atk < 12 && m.atk > 3 && !m.hitDone) { const hx = m.face > 0 ? m.x + 10 : m.x - 10 - b.rng, hb = [hx, m.y - (b.fly ? 40 : b.h + 20), b.rng, b.h + 30];
        if (g.overlap(hb, o.hurtbox())) { m.hitDone = true; G.applyHit(f, o, H(b.dmg, { proj: true, ang: b.fly ? 60 : 35, heavy: b.dmg > 9, launch: b.dmg > 10 }), g, m.x, m.y - 50); } } }
    let sp = b.spd; if (b.charge && m.atk > 0) sp *= 2.4;
    const dx = h.r - h.l; if (dx) m.face = dx;
    m.vx = (dx || (m.atk > 0 && b.charge ? m.face : 0)) * sp;
    if (b.fly) { m.vy = (h.d - h.u) * sp * 0.8; if (m.atk > 0) m.vy += 3; m.y = Math.max(140, Math.min(GY() - 30, m.y + m.vy)); }
    else { if (c.fresh && c.fresh.u && m.y >= GY()) m.vy = -13; m.vy += 0.8; m.y = Math.min(GY(), m.y + m.vy); if (m.y >= GY()) m.vy = 0; }
    m.x = Math.max(40, Math.min(1240, m.x + m.vx));
    if (m.cd <= 0) for (const btn of ['FP', 'BP', 'FK', 'BK']) if (c.take(btn)) { m.atk = 18; m.cd = 30; m.hitDone = false; if (!b.charge && !b.spit) m.x += m.face * 20; G.sfx(m.kind === 'eagle' ? 'screech' : 'whoosh'); break; }
    if (m.life <= 0 || m.hp <= 0) { m.dead = true; if (f.summon === m) g.endSummon(f); G.FX.dust(m.x, m.y, 8, 1); }
  }

  // ================= ZEPHYRA — cosmic characters =================
  S.zephyra = {
    s1: sp({ name: 'Gauntlet Laser', s: 14, a: 18, r: 18, dmg: '2x5', hb: [40, -128, 900, 30], hs: 14, bs: 8, kb: 3, kbg: 1, ang: 15, push: 3, pose: 'cast',
      frame(f, g, fr, m) { if (fr === 14) G.sfx('beam'); if (fr > 14 && (fr - 15) % 4 === 0) m.hits.clear(); },
      drawFx(ctx, f, fr) { const [x, y] = hand(f); if (fr < 14) { C(ctx, x, y, fr * 1.2, 'rgba(255,211,77,0.7)'); return; } if (fr > 32) return; const w = 26 + Math.sin(fr) * 6;
        const gr = ctx.createLinearGradient(0, y - w / 2, 0, y + w / 2); gr.addColorStop(0, 'rgba(200,100,255,0)'); gr.addColorStop(0.5, '#fff'); gr.addColorStop(1, 'rgba(200,100,255,0)');
        ctx.fillStyle = 'rgba(197,139,255,0.6)'; ctx.fillRect(f.face > 0 ? x : x - 900, y - w, 900, w * 2); ctx.fillStyle = gr; ctx.fillRect(f.face > 0 ? x : x - 900, y - w / 2, 900, w); C(ctx, x, y, 20, '#ffd34d'); } }),
    s2: sp({ name: 'Cosmic Board', s: 10, r: 18, dmg: '6x2', frame(f, g, fr) { if (fr === 10) { const [x, y] = hand(f); proj(g, f, { x, y, vx: 15 * f.face, w: 80, h: 22, life: 140, pierce: true, rehit: 30, hit: H(6, { ang: 30 }),
      update: (p) => { p.vx -= p.face * 0.42; p.x += p.vx; p.y += (f.y - 110 - p.y) * 0.05; if (p.t > 20 && Math.abs(p.x - f.x) < 30) p.life = 0; },
      draw: (ctx, p, t) => { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.sin(t * 0.2) * 0.2); const gr = ctx.createLinearGradient(-44, 0, 44, 0); gr.addColorStop(0, '#9aa'); gr.addColorStop(0.5, '#fff'); gr.addColorStop(1, '#9aa'); ctx.fillStyle = gr; ctx.strokeStyle = '#334'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, 44, 10, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore(); } }); } } }),
    s3: sp({ name: 'Phoenix Flare', s: 16, r: 20, dmg: 10, pose: 'raise', frame(f, g, fr) { if (fr === 16) { const o = f.opp; proj(g, f, { x: f.x, y: 60, w: 70, h: 50, life: 90, hit: H(10, { launch: true, ang: 60, heavy: true, col: '#ff8a2a' }),
      update: (p) => { const tx = o.x, ty = o.y - 80, dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy) || 1; p.vx += dx / d * 1.6; p.vy += dy / d * 1.6; const s = Math.hypot(p.vx, p.vy); if (s > 14) { p.vx *= 14 / s; p.vy *= 14 / s; } p.x += p.vx; p.y += p.vy; if (p.t % 2 === 0) G.FX.sparks(p.x, p.y, -Math.sign(p.vx) || 1, 2, '#ffb347', 4); },
      draw: (ctx, p, t) => { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.vy, p.vx)); ctx.fillStyle = '#ff8a2a'; ctx.beginPath(); ctx.ellipse(0, 0, 26, 12, 0, 0, 7); ctx.fill(); const fl = Math.sin(t * 0.6) * 18; ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-20, -40 - fl); ctx.lineTo(14, -4); ctx.moveTo(-6, 0); ctx.lineTo(-20, 40 + fl); ctx.lineTo(14, 4); ctx.fill(); C(ctx, 26, 0, 9, '#fff3a0'); ctx.restore(); } }); G.sfx('screech'); } } }),
    s4: sp({ name: 'Black Hole', s: 24, r: 22, dmg: '1x8 + 8', pose: 'cast2', frame(f, g, fr) { if (fr === 24) { const bx = Math.max(100, Math.min(1180, f.x + f.face * 300)), o = f.opp; G.sfx('rewind');
      proj(g, f, { x: bx, y: GY() - 130, w: 80, h: 80, life: 110, pierce: true, rehit: 12, noClash: true, hit: H(1, { hs: 14, kb: 0.5, kbg: 0, push: 0, ang: 90 }),
        update: (p) => { const dx = p.x - o.x; if (Math.abs(dx) < 420 && !o.dead && o.state !== 'ko') { o.x += Math.sign(dx) * Math.min(5, Math.abs(dx) * 0.05); } if (p.t === 108) { G.applyHit(f, o, H(8, { proj: true, launch: true, ang: 70, heavy: true }), g, p.x, p.y); } },
        draw: (ctx, p, t) => { for (let i = 0; i < 4; i++) { ctx.strokeStyle = `rgba(197,139,255,${0.6 - i * 0.12})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(p.x, p.y, 70 + i * 16 + Math.sin(t * 0.2 + i) * 4, 20 + i * 6, t * 0.03, 0, 7); ctx.stroke(); } C(ctx, p.x, p.y, 34, '#000'); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, 36, 0, 7); ctx.stroke(); } }); } } }),
    ult: { name: 'THE SNAP', len: 300,
      run(g, f, o, t) { hold(o, o.x, o.y > GY() - 2 ? GY() : o.y); f.ultPose = 'raise';
        if (t === 100) { G.FX.flash(14, '#fff'); G.sfx('zap'); G.FX.impact(6, f.x, f.y - 160); G.FX.text(f.x, f.y - 260, '*SNAP*', '#ffd34d', 54); }
        if (t > 110 && t < 240) { if (t % 2 === 0) G.FX.pixels(o.x + R(-30, 30), o.y - R(0, 140), 3, [o.ch.col, o.ch.acc, '#8a6a4a'][t % 3]); if (t % 10 === 0) uhit(g, f, o, 2.5, { col: '#c58bff' }); o.dissolve = Math.min(0.6, (t - 110) / 200); }
        if (t === 250) o.dissolve = 0;
        if (t === 262) { o.dissolve = 0; ufinal(g, f, o, 6, { ang: 60 }); } },
      bg(ctx, g, f, o, t) { ctx.fillStyle = `rgba(30,10,60,${Math.min(0.6, t / 60)})`; ctx.fillRect(-400, -300, 2080, 1300); if (t < 100) { const [x, y] = [f.x + f.face * 10, f.y - 190]; for (let i = 0; i < 6; i++) C(ctx, x + Math.cos(i + t * 0.1) * 26, y + Math.sin(i + t * 0.1) * 26, 6 + Math.sin(t * 0.3 + i) * 2, ['#f33', '#3f3', '#33f', '#ff3', '#f8f', '#f80'][i]); } } },
  };

  // ================= JACOB — liquids =================
  S.jacob = {
    s1: sp({ name: 'Water Jet', s: 10, a: 16, r: 16, dmg: '2x4', hb: [30, -122, 380, 30], hs: 14, bs: 8, kb: 3, kbg: 1, push: 4, ang: 10, pose: 'cast',
      frame(f, g, fr, m) { if (fr === 10) G.sfx('splash'); if (fr > 10 && (fr - 11) % 5 === 0) m.hits.clear(); },
      drawFx(ctx, f, fr) { if (fr < 10 || fr > 28) return; const [x, y] = hand(f); for (let i = 0; i < 24; i++) { const k = i / 24, xx = x + f.face * k * 380, yy = y + Math.sin(k * 12 + fr) * 6; C(ctx, xx, yy, 14 - k * 4, i % 2 ? 'rgba(127,224,255,0.8)' : 'rgba(31,143,255,0.7)'); } } }),
    s2: sp({ name: 'Bubble Trap', s: 12, r: 20, dmg: 3, frame(f, g, fr) { if (fr === 12) { const [x, y] = hand(f); proj(g, f, { x, y, vx: 6.5 * f.face, vy: -0.4, w: 46, h: 46, life: 110, hit: H(3, { hs: 10, kb: 0.5, kbg: 0, push: 0 }),
      draw: (ctx, p, t) => { ctx.strokeStyle = 'rgba(191,244,255,0.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, 22 + Math.sin(t * 0.3) * 2, 0, 7); ctx.stroke(); C(ctx, p.x - 8, p.y - 8, 5, 'rgba(255,255,255,0.8)'); },
      onHit: (p, o, g2) => { if (o.hp <= 0) return; force(o, 80, (o2, g3, t) => { o2.vx *= 0.8; o2.vy = -1.3; o2.onGround = false; o2.noGrav = true; if (t === 79) { o2.noGrav = false; G.sfx('splash'); G.FX.ring(o2.x, o2.y - 70, 70, '#bff4ff'); G.applyHit(f, o2, H(3, { proj: true, hs: 20, ang: 90, kb: 3 }), g3, o2.x, o2.y - 70); } });
        vis(g2, { life: 80, draw: (ctx, v) => { ctx.strokeStyle = 'rgba(191,244,255,0.9)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(o.x, o.y - 75, 90, 0, 7); ctx.stroke(); ctx.fillStyle = 'rgba(127,224,255,0.15)'; ctx.fill(); C(ctx, o.x - 40, o.y - 120, 12, 'rgba(255,255,255,0.7)'); } }); } }); } } }),
    s3: sp({ name: 'Geyser Uppercut', s: 6, a: 12, r: 22, keepAir: true, dmg: 10, hb: [-10, -180, 80, 180], heavy: true, launch: true, hs: 26, bs: 14, kb: 12, kbg: 6, ang: 84, pose: 'uppercut',
      frame(f, g, fr, m) { if (fr === 6) { f.vy = -17; f.onGround = false; G.sfx('splash'); G.FX.dust(f.x, GY(), 6, 1, 0, '#7fe0ff'); m.def.keepAir = true; } if (fr === 10) m.def.keepAir = false; },
      drawFx(ctx, f, fr) { if (fr < 6 || fr > 24) return; ctx.fillStyle = 'rgba(127,224,255,0.6)'; ctx.fillRect(f.x - 26, f.y - 20, 52, GY() - f.y + 20); for (let i = 0; i < 5; i++) C(ctx, f.x + R(-30, 30), f.y - 10 + R(-10, 10), 10, 'rgba(191,244,255,0.8)'); } }),
    s4: sp({ name: 'Tsunami Fist', s: 18, a: 12, r: 24, lunge: 14, dmg: 13, hb: [10, -150, 130, 150], heavy: true, launch: true, hs: 30, bs: 16, kb: 18, kbg: 7, ang: 14, pose: 'straight',
      frame(f, g, fr) { if (fr === 18) G.sfx('splash', 1.5); if (fr > 18 && fr < 30) G.FX.dust(f.x - f.face * 20, GY(), 1, 0.8, -f.face, '#7fe0ff'); },
      drawFx(ctx, f, fr) { if (fr < 14 || fr > 32) return; ctx.save(); ctx.translate(f.x + f.face * 40, GY()); ctx.scale(f.face, 1); ctx.fillStyle = 'rgba(31,143,255,0.75)'; ctx.beginPath(); ctx.moveTo(-80, 0); ctx.quadraticCurveTo(0, -60, 40, -170); ctx.quadraticCurveTo(90, -200, 110, -150); ctx.quadraticCurveTo(70, -150, 80, -100); ctx.quadraticCurveTo(110, -40, 120, 0); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.8)'; for (let i = 0; i < 6; i++) C(ctx, 50 + i * 12, -180 + i * 6, 6, '#fff'); ctx.restore(); } }),
    ult: { name: 'NESTEA FLOOD', len: 340,
      run(g, f, o, t) {
        const lvl = t < 120 ? 0 : t < 200 ? (t - 120) / 80 : t < 250 ? 1 : Math.max(0, 1 - (t - 250) / 60); g.flood = lvl;
        const wy = GY() - lvl * 330; if (t >= 100 && t < 112) { G.FX.shake(14, 16); if (t === 100) { G.sfx('crack'); G.sfx('splash', 2); } }
        if (lvl > 0.2) { hold(o, o.x + Math.sin(t * 0.05) * 6 + f.face * 2, wy - 40 + Math.sin(t * 0.15) * 30); f.x += (f.x < 640 ? 200 - f.x : 1080 - f.x) * 0.05; f.y = Math.min(GY(), wy + 10); f.onGround = true; }
        else hold(o, o.x, Math.min(GY(), o.y));
        if (t > 140 && t < 280 && t % 14 === 0) { uhit(g, f, o, 2.6, { col: '#e8a020', sfx: 'splash' }); }
        if (t === 300) { g.flood = 0; f.y = GY(); ufinal(g, f, o, 7, { ang: 50 }); } },
      bg(ctx, g, f, o, t) { // the giant iced tea can
        if (t > 260) return; const drop = Math.min(1, t / 50), x = 640, y = -260 + drop * 470, burst = t > 100;
        ctx.save(); ctx.translate(x, y); ctx.rotate(burst ? Math.sin(t * 0.5) * 0.04 : 0);
        ctx.fillStyle = '#c9ccd2'; ctx.fillRect(-110, -230, 220, 22); ctx.fillRect(-110, 208, 220, 22);
        const gr = ctx.createLinearGradient(-110, 0, 110, 0); gr.addColorStop(0, '#7a3a0a'); gr.addColorStop(0.35, '#e8a020'); gr.addColorStop(0.6, '#ffcf6a'); gr.addColorStop(1, '#7a3a0a');
        ctx.fillStyle = gr; ctx.fillRect(-110, -210, 220, 420); ctx.fillStyle = '#fff'; ctx.font = '900 54px Rubik'; ctx.textAlign = 'center'; ctx.save(); ctx.rotate(-Math.PI / 2); ctx.fillText('NESTEA', 0, 18); ctx.restore();
        ctx.fillStyle = '#ffe24d'; ctx.beginPath(); ctx.arc(-50, -120, 30, 0, 7); ctx.fill(); G.leaf(ctx, 40, 120, -0.6, 40, '#2bbf4a');
        if (burst) { ctx.strokeStyle = '#111'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-20, -210); ctx.lineTo(10, -120); ctx.lineTo(-10, -60); ctx.lineTo(30, 40); ctx.stroke();
          ctx.fillStyle = 'rgba(200,120,20,0.85)'; for (let i = 0; i < 8; i++) { const k = ((t * 0.05 + i / 8) % 1); C(ctx, (i - 4) * 20 + Math.sin(i) * 30, -100 + k * 360, 26 * (1 - k * 0.4), 'rgba(220,140,30,0.8)'); } }
        ctx.restore(); },
      fg(ctx, g, f, o, t) { const lvl = g.flood || 0; if (lvl <= 0) return; const wy = GY() - lvl * 330;
        ctx.save(); ctx.fillStyle = 'rgba(214,130,30,0.55)'; ctx.beginPath(); ctx.moveTo(-400, 900); ctx.lineTo(-400, wy); for (let x = -400; x <= 1700; x += 30) ctx.lineTo(x, wy + Math.sin(x * 0.02 + t * 0.15) * 12); ctx.lineTo(1700, 900); ctx.fill();
        ctx.fillStyle = 'rgba(255,240,200,0.6)'; for (let i = 0; i < 20; i++) { const x = (i * 97 + t * 3) % 1500 - 100; C(ctx, x, wy + 30 + (i * 53) % 200, 4 + i % 4, 'rgba(255,240,200,0.5)'); }
        for (let i = 0; i < 6; i++) { const x = (i * 260 + t * 2) % 1500 - 100; ctx.fillStyle = 'rgba(230,240,255,0.7)'; ctx.fillRect(x, wy + 20 + (i % 3) * 40, 26, 26); } ctx.restore(); } },
  };
})();
