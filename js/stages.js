// ===== Stages: backgrounds, NPC crowds, TGOE watching, platforms, hazards =====
(function () {
  const GY = 600; G.GROUND = GY;
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const C = (ctx, x, y, r, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); };
  function sky(ctx, a, b, c) { const g = ctx.createLinearGradient(0, -200, 0, GY); g.addColorStop(0, a); g.addColorStop(0.6, b); g.addColorStop(1, c || b); ctx.fillStyle = g; ctx.fillRect(-400, -300, 2080, GY + 300); }
  function stars(ctx, n, seed, t) { const r = rng(seed); for (let i = 0; i < n; i++) { const x = r() * 2080 - 400, y = r() * 700 - 300, s = r() * 1.8 + 0.3; ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 0.05 + i); C(ctx, x, y, s, '#fff'); } ctx.globalAlpha = 1; }
  function ground(ctx, top, side, line) { ctx.fillStyle = top; ctx.fillRect(-400, GY, 2080, 300); ctx.fillStyle = side; ctx.fillRect(-400, GY + 14, 2080, 300); ctx.fillStyle = line || 'rgba(0,0,0,0.35)'; ctx.fillRect(-400, GY, 2080, 4); }
  function skyline(ctx, seed, base, col, winCol, hMin, hMax, t) {
    const r = rng(seed); let x = -400;
    while (x < 1700) { const w = 40 + r() * 70, h = hMin + r() * (hMax - hMin); ctx.fillStyle = col; ctx.fillRect(x, base - h, w, h);
      if (winCol) { ctx.fillStyle = winCol; for (let wy = base - h + 10; wy < base - 10; wy += 16) for (let wx = x + 6; wx < x + w - 8; wx += 12) if (r() < 0.45) ctx.fillRect(wx, wy, 6, 8); }
      x += w + 2 + r() * 6; }
  }
  function cloud(ctx, x, y, s, col) { ctx.fillStyle = col; for (const [dx, dy, r] of [[0, 0, 22], [24, -8, 26], [50, 0, 20], [24, 8, 22]]) { ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, r * s, 0, 7); ctx.fill(); } }
  function sign(ctx, x, y, w, h, txt, bg, fg, font) { ctx.fillStyle = bg; ctx.fillRect(x, y, w, h); ctx.strokeStyle = '#111'; ctx.lineWidth = 3; ctx.strokeRect(x, y, w, h); ctx.fillStyle = fg; ctx.font = font || '900 16px Rubik'; ctx.textAlign = 'center'; ctx.fillText(txt, x + w / 2, y + h / 2 + 6); }

  // ---------- NPCs ----------
  G.drawNPC = function (ctx, n, t) {
    const ph = t * 0.1 + n.seed * 10; let bob = 0, armA = 0.3, legA = 0;
    if (n.act === 'walk') { legA = Math.sin(ph) * 0.5; bob = Math.abs(Math.sin(ph)) * -2; }
    if (n.act === 'cheer' || G.hype > 0) { bob = -Math.abs(Math.sin(ph * 1.6)) * 10; armA = 2.6 + Math.sin(ph * 2) * 0.3; }
    if (n.act === 'talk') armA = 0.8 + Math.sin(ph) * 0.4;
    const s = n.s, x = n.x, y = n.y + bob * s, f = n.dir;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * f, s); ctx.lineCap = 'round';
    const col = n.col, sk = n.skin;
    ctx.strokeStyle = col; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(Math.sin(legA) * 14, 0); ctx.moveTo(0, -30); ctx.lineTo(-Math.sin(legA) * 14, 0); ctx.stroke();
    ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(0, -62); ctx.stroke();
    ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, -58); ctx.lineTo(Math.sin(armA) * 20, -58 + Math.cos(armA) * 20); ctx.moveTo(0, -58); ctx.lineTo(-Math.sin(armA * 0.9) * 20, -58 + Math.cos(armA * 0.9) * 20); ctx.stroke();
    const hx = 0, hy = -74;
    switch (n.type) {
      case 'alien': C(ctx, hx, hy, 12, '#7be36b'); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(hx + 4, hy, 4, 6, 0.3, 0, 7); ctx.ellipse(hx - 4, hy, 4, 6, -0.3, 0, 7); ctx.fill();
        ctx.strokeStyle = '#7be36b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(hx - 4, hy - 10); ctx.lineTo(hx - 8, hy - 22); ctx.moveTo(hx + 4, hy - 10); ctx.lineTo(hx + 8, hy - 22); ctx.stroke(); C(ctx, hx - 8, hy - 22, 3, '#ff5'); C(ctx, hx + 8, hy - 22, 3, '#ff5'); break;
      case 'anime': C(ctx, hx, hy, 11, sk); ctx.fillStyle = n.hair; ctx.beginPath(); for (let i = 0; i < 7; i++) { const a = Math.PI + i * Math.PI / 6; ctx.lineTo(hx + Math.cos(a) * 12, hy + Math.sin(a) * 12); ctx.lineTo(hx + Math.cos(a + 0.26) * 24, hy + Math.sin(a + 0.26) * 22); } ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#c33'; ctx.fillRect(hx - 12, hy - 6, 24, 4); break;
      case 'god': C(ctx, hx, hy, 11, sk); ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(hx, hy - 17, 10, 3, 0, 0, 7); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillRect(-8, -64, 16, 30); break;
      case 'astro': C(ctx, hx, hy, 14, '#eee'); C(ctx, hx + 3, hy, 9, '#246'); break;
      case 'robot': ctx.fillStyle = '#9aa'; ctx.fillRect(hx - 11, hy - 11, 22, 20); ctx.fillStyle = '#f33'; ctx.fillRect(hx - 6, hy - 4, 12, 4); break;
      case 'worker': C(ctx, hx, hy, 11, sk); ctx.fillStyle = '#ffcc00'; ctx.beginPath(); ctx.arc(hx, hy - 3, 13, Math.PI, 0); ctx.fill(); ctx.fillRect(hx - 15, hy - 4, 30, 3); break;
      case 'teacher': C(ctx, hx, hy, 11, sk); ctx.fillStyle = n.hair; ctx.beginPath(); ctx.arc(hx, hy - 3, 11, Math.PI, 0); ctx.fill(); ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5; ctx.strokeRect(hx + 1, hy - 3, 7, 5); ctx.fillStyle = '#7a1f1f'; ctx.fillRect(14, -52, 10, 13); break;
      case 'student': C(ctx, hx, hy, 11, sk); ctx.fillStyle = n.hair; ctx.beginPath(); ctx.arc(hx, hy - 3, 12, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#244a8a'; ctx.fillRect(-14, -62, 8, 22); break;
      case 'protester': C(ctx, hx, hy, 11, sk); ctx.fillStyle = n.hair; ctx.beginPath(); ctx.arc(hx, hy - 3, 11, Math.PI, 0); ctx.fill();
        ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(16, -40); ctx.lineTo(16, -110); ctx.stroke(); ctx.scale(f, 1); sign(ctx, -24 + 16 * f, -132, 56, 26, n.txt, '#fff', '#c00', '900 12px Rubik'); break;
      default: C(ctx, hx, hy, 11, sk); ctx.fillStyle = n.hair; ctx.beginPath(); ctx.arc(hx, hy - 3, 11, Math.PI, 0); ctx.fill();
    }
    ctx.restore();
  };
  function makeCrowd(seed, types, n, y0, y1, s0, s1) {
    const r = rng(seed), out = [], skins = ['#f1c9a5', '#c68e62', '#8d5a3b', '#5a3a28', '#e8b98a'], hairs = ['#222', '#5a3a1a', '#d9b34a', '#a33', '#ddd'], cols = ['#e84a4a', '#3a7be8', '#3ab06b', '#e8b33a', '#8a4ae8', '#333', '#eee'];
    const txts = ['NON !', 'GRÈVE', 'LIBERTÉ', 'STOP!', '#STL', 'RÉSISTE'];
    for (let i = 0; i < n; i++) {
      const y = y0 + r() * (y1 - y0), sc = s0 + (y - y0) / (y1 - y0 || 1) * (s1 - s0);
      out.push({ type: types[Math.floor(r() * types.length)], x: r() * 1500 - 110, y, s: sc, dir: r() < 0.5 ? -1 : 1, seed: r(), col: cols[Math.floor(r() * cols.length)], skin: skins[Math.floor(r() * 5)], hair: hairs[Math.floor(r() * 5)], act: ['idle', 'walk', 'talk', 'cheer'][Math.floor(r() * 4)], speed: 0.3 + r() * 0.5, txt: txts[Math.floor(r() * txts.length)] });
    }
    return out.sort((a, b) => a.y - b.y);
  }
  function updCrowd(crowd) { for (const n of crowd) { if (n.act === 'walk') { n.x += n.dir * n.speed; if (n.x < -150 || n.x > 1430) n.dir *= -1; } else if (Math.random() < 0.002) n.dir *= -1; if (Math.random() < 0.001) n.act = ['idle', 'walk', 'talk', 'cheer'][Math.floor(Math.random() * 4)]; } }

  // ---------- hazards (generic) ----------
  G.makeHazard = (o) => Object.assign({ t: 0, life: 200, warn: 50, hit: {}, dmg: 6, kb: 10, ang: 45, w: 40, h: 40, vx: 0, vy: 0, grav: 0 }, o);

  // ---------- stage definitions ----------
  const TG = (ctx, t, x, y, s) => { G.drawTGOE(ctx, x, y, s, t, { arms: 'cross', eyes: 0.6 + 0.4 * Math.sin(t * 0.03) }); };
  G.STAGES = [
    { id: 'stl', name: 'THE STL', dust: '#cdb8ff', plats: [[300, 440, 200], [780, 440, 200]],
      init() { this.crowd = makeCrowd(11, ['god', 'alien', 'anime', 'robot'], 22, 470, 520, 0.45, 0.6); },
      draw(ctx, t) { sky(ctx, '#12052b', '#3a1466', '#7a3aa8'); stars(ctx, 160, 3, t);
        for (let i = 0; i < 7; i++) { const x = (i * 260 + t * 0.2) % 1900 - 300, y = 40 + (i * 53) % 200, r = 30 + (i * 17) % 50; ctx.strokeStyle = `hsla(${i * 50},90%,70%,0.5)`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke(); ctx.fillStyle = `hsla(${i * 50},90%,60%,0.12)`; ctx.fill(); }
        TG(ctx, t, 640, 420, 0.85);
        ctx.fillStyle = '#2a1050'; ctx.beginPath(); ctx.ellipse(640, 640, 900, 130, 0, Math.PI, 0); ctx.fill();
        G.drawCrowd(ctx, this.crowd, t); ground(ctx, '#5a3a8a', '#2a1650'); },
      hazard(g, t) { if (t % 900 === 450) g.hazards.push(G.makeHazard({ kind: 'bolt', x: 200 + Math.random() * 880, y: 0, w: 60, h: GY, warn: 60, life: 90, dmg: 8, kb: 14, ang: 80 })); } },
    { id: 'moon', name: 'THE MOON', dust: '#c9c9cf', grav: 0.6,
      init() { this.crowd = makeCrowd(5, ['astro', 'alien', 'robot'], 14, 480, 520, 0.45, 0.55); },
      draw(ctx, t) { sky(ctx, '#000', '#05050c'); stars(ctx, 260, 7, t);
        C(ctx, 1050, 120, 70, '#2b6be0'); ctx.fillStyle = '#3ab06b'; ctx.beginPath(); ctx.ellipse(1035, 105, 30, 20, 0.5, 0, 7); ctx.ellipse(1075, 150, 20, 14, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#7d7d86'; ctx.beginPath(); ctx.moveTo(-400, 520); for (let x = -400; x <= 1700; x += 80) ctx.lineTo(x, 480 + Math.sin(x * 0.01) * 30); ctx.lineTo(1700, GY); ctx.lineTo(-400, GY); ctx.fill();
        TG(ctx, t, 300, 500, 0.7); G.drawCrowd(ctx, this.crowd, t); ground(ctx, '#a9a9b1', '#6d6d76');
        for (const [x, r] of [[150, 30], [520, 18], [900, 40], [1180, 22]]) { ctx.fillStyle = '#8a8a93'; ctx.beginPath(); ctx.ellipse(x, GY + 40, r * 2, r * 0.5, 0, 0, 7); ctx.fill(); } } },
    { id: 'pluto', name: 'PLUTO', dust: '#e8eefc', fric: 0.25,
      init() { this.crowd = makeCrowd(9, ['alien', 'robot', 'astro'], 12, 480, 520, 0.4, 0.55); },
      draw(ctx, t) { sky(ctx, '#020210', '#141436'); stars(ctx, 220, 9, t); C(ctx, 200, 90, 8, '#fff7c0');
        ctx.fillStyle = '#c9b7a0'; ctx.beginPath(); ctx.moveTo(-400, 540); for (let x = -400; x <= 1700; x += 60) ctx.lineTo(x, 470 + Math.abs(Math.sin(x * 0.013)) * 50); ctx.lineTo(1700, GY); ctx.lineTo(-400, GY); ctx.fill();
        ctx.fillStyle = '#f0e6da'; ctx.beginPath(); ctx.moveTo(640, 590); ctx.bezierCurveTo(500, 520, 520, 460, 600, 470); ctx.bezierCurveTo(630, 475, 640, 495, 640, 505); ctx.bezierCurveTo(640, 495, 650, 475, 680, 470); ctx.bezierCurveTo(760, 460, 780, 520, 640, 590); ctx.fill();
        TG(ctx, t, 1000, 510, 0.7); G.drawCrowd(ctx, this.crowd, t); ground(ctx, '#dfeaff', '#9fb4d8'); },
      hazard(g, t) { if (t % 420 === 200) g.hazards.push(G.makeHazard({ kind: 'ice', x: 100 + Math.random() * 1080, y: -60, w: 26, h: 50, vy: 0, grav: 0.4, warn: 40, life: 200, dmg: 6, kb: 8, ang: 60 })); } },
    { id: 'earth', name: 'EARTH', dust: '#c9a77a',
      init() { this.crowd = makeCrowd(13, ['anime', 'civ', 'civ', 'god', 'alien'], 18, 480, 525, 0.45, 0.6); },
      draw(ctx, t) { sky(ctx, '#3b8ee8', '#9fd3ff', '#d9f0ff'); C(ctx, 1100, 90, 46, '#fff4b0');
        for (let i = 0; i < 5; i++) cloud(ctx, ((i * 330 + t * 0.3) % 2000) - 300, 60 + i * 30, 1 + (i % 2) * 0.4, 'rgba(255,255,255,0.9)');
        skyline(ctx, 21, 500, '#7fa8c8', null, 60, 200, t);
        ctx.fillStyle = '#4caf50'; ctx.beginPath(); ctx.moveTo(-400, 540); for (let x = -400; x <= 1700; x += 50) ctx.lineTo(x, 500 + Math.sin(x * 0.008) * 20); ctx.lineTo(1700, GY); ctx.lineTo(-400, GY); ctx.fill();
        TG(ctx, t, 220, 510, 0.7); G.drawCrowd(ctx, this.crowd, t); ground(ctx, '#6dbf4a', '#7a5434'); },
      hazard(g, t) { if (t % 1200 === 600) g.hazards.push(G.makeHazard({ kind: 'meteor', x: Math.random() * 1000 + 140, y: -120, w: 50, h: 50, vx: -2, vy: 6, warn: 70, life: 200, dmg: 10, kb: 16, ang: 70 })); } },
    { id: 'jupiter', name: 'JUPITER', dust: '#e8c49a', plats: [[540, 430, 200]],
      init() { this.crowd = makeCrowd(17, ['alien', 'god', 'robot'], 10, 480, 520, 0.4, 0.5); this.wind = 0; },
      draw(ctx, t) { const bands = ['#c99a6b', '#e8cfa8', '#b8784a', '#efe0c4', '#a8683e', '#d9b48a'];
        for (let i = 0; i < 12; i++) { ctx.fillStyle = bands[i % 6]; const y = -300 + i * 80; ctx.beginPath(); ctx.moveTo(-400, y); for (let x = -400; x <= 1700; x += 40) ctx.lineTo(x, y + Math.sin(x * 0.01 + t * 0.01 + i) * 10); ctx.lineTo(1700, y + 90); ctx.lineTo(-400, y + 90); ctx.fill(); }
        ctx.fillStyle = '#b23a1e'; ctx.beginPath(); ctx.ellipse(950, 200, 120, 60, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#d9643a'; ctx.beginPath(); ctx.ellipse(950, 200, 80, 36, t * 0.01, 0, 7); ctx.fill();
        if (this.wind) { ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; for (let i = 0; i < 30; i++) { const x = ((i * 97 + t * 14 * Math.sign(this.wind)) % 1600 + 1600) % 1600 - 160, y = (i * 61) % 560; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 50 * Math.sign(this.wind), y); ctx.stroke(); } }
        TG(ctx, t, 640, 470, 0.6); G.drawCrowd(ctx, this.crowd, t); ground(ctx, '#7a6a8a', '#3a2f4a'); },
      hazard(g, t) { const c = t % 700; this.wind = c > 500 && c < 640 ? (Math.floor(t / 700) % 2 ? 1 : -1) * 0.55 : 0; for (const f of g.fighters) if (!f.onGround || true) f.x += this.wind * (f.onGround ? 1 : 2); } },
    { id: 'france', name: 'PARIS — PROTEST', dust: '#cfc4b0',
      init() { this.crowd = makeCrowd(23, ['protester', 'protester', 'civ', 'anime'], 26, 470, 525, 0.45, 0.62); },
      draw(ctx, t) { sky(ctx, '#7d8aa6', '#c9b7a8', '#e8d0b8');
        ctx.strokeStyle = '#4a4a55'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(900, 470); ctx.lineTo(980, 120); ctx.lineTo(1060, 470); ctx.moveTo(920, 400); ctx.lineTo(1040, 400); ctx.moveTo(945, 300); ctx.lineTo(1015, 300); ctx.moveTo(980, 120); ctx.lineTo(980, 70); ctx.stroke();
        ctx.fillStyle = '#e6dccb'; for (let i = 0; i < 9; i++) { const x = -300 + i * 220; ctx.fillRect(x, 300, 200, 200); ctx.fillStyle = '#4a5a7a'; ctx.fillRect(x, 285, 200, 20); ctx.fillStyle = '#7a6a5a'; for (let w = 0; w < 4; w++) for (let h = 0; h < 3; h++) ctx.fillRect(x + 18 + w * 46, 320 + h * 55, 22, 36); ctx.fillStyle = '#e6dccb'; }
        for (let i = 0; i < 4; i++) { const x = 100 + i * 330, k = (t * 0.5 + i * 60) % 200; ctx.fillStyle = `rgba(230,60,60,${0.25})`; C(ctx, x, 470 - k, 20 + k * 0.3, `rgba(255,150,150,${0.3 * (1 - k / 200)})`); }
        TG(ctx, t, 640, 480, 0.65); G.drawCrowd(ctx, this.crowd, t); ground(ctx, '#8a8178', '#5a524a'); },
      hazard(g, t) { if (t % 360 === 180) { const fromL = Math.random() < 0.5; g.hazards.push(G.makeHazard({ kind: Math.random() < 0.5 ? 'baguette' : 'tomato', x: fromL ? -40 : 1320, y: 420, vx: fromL ? 9 : -9, vy: -6, grav: 0.18, w: 40, h: 16, warn: 0, life: 200, dmg: 4, kb: 7, ang: 40 })); } } },
    { id: 'germany', name: 'BERLIN, GERMANY', dust: '#d4ccbc',
      init() { this.crowd = makeCrowd(31, ['civ', 'civ', 'anime', 'robot'], 18, 480, 525, 0.45, 0.6); },
      draw(ctx, t) { sky(ctx, '#5a6e8a', '#a8b8c8');
        ctx.strokeStyle = '#6a7380'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(1100, 470); ctx.lineTo(1100, 120); ctx.stroke(); C(ctx, 1100, 160, 26, '#8a939e'); ctx.fillStyle = '#c33'; ctx.fillRect(1097, 70, 6, 50);
        ctx.fillStyle = '#d8ccb0'; ctx.fillRect(380, 250, 520, 40); ctx.fillRect(400, 230, 480, 22); for (let i = 0; i < 6; i++) ctx.fillRect(400 + i * 92, 290, 26, 200);
        ctx.fillStyle = '#4a7a5a'; ctx.fillRect(600, 196, 80, 34); C(ctx, 640, 196, 10, '#4a7a5a');
        for (let i = 0; i < 3; i++) { ctx.fillStyle = ['#000', '#d00', '#fc0'][i]; ctx.fillRect(160, 200 + i * 16, 60, 16); } ctx.fillStyle = '#555'; ctx.fillRect(156, 196, 4, 300);
        TG(ctx, t, 260, 500, 0.65); G.drawCrowd(ctx, this.crowd, t); ground(ctx, '#9a9a9a', '#5a5a5a'); } },
    { id: 'canada', name: 'TORONTO, CANADA', dust: '#f4f8ff',
      init() { this.crowd = makeCrowd(41, ['civ', 'civ', 'anime', 'alien'], 18, 480, 525, 0.45, 0.6); },
      draw(ctx, t) { sky(ctx, '#2a4a7a', '#8ab0d8', '#d8e8f8');
        skyline(ctx, 44, 490, '#3a4a66', '#ffe9a0', 80, 260, t);
        ctx.fillStyle = '#c8ccd4'; ctx.beginPath(); ctx.moveTo(880, 490); ctx.lineTo(895, 160); ctx.lineTo(905, 160); ctx.lineTo(920, 490); ctx.fill(); ctx.beginPath(); ctx.ellipse(900, 200, 24, 12, 0, 0, 7); ctx.fill(); ctx.fillRect(898, 40, 4, 130);
        ctx.fillStyle = '#d52b1e'; ctx.fillRect(140, 180, 30, 40); ctx.fillRect(230, 180, 30, 40); ctx.fillStyle = '#fff'; ctx.fillRect(170, 180, 60, 40); ctx.fillStyle = '#d52b1e'; G.leaf(ctx, 186, 202, -0.4, 18, '#d52b1e'); ctx.fillStyle = '#555'; ctx.fillRect(136, 176, 4, 320);
        ctx.fillStyle = 'rgba(255,255,255,0.85)'; for (let i = 0; i < 80; i++) { const x = (i * 131 + t * (0.5 + i % 3 * 0.3)) % 1700 - 200, y = (i * 71 + t * (1 + i % 4 * 0.4)) % 640; C(ctx, x, y, 1.5 + i % 3, 'rgba(255,255,255,0.85)'); }
        TG(ctx, t, 640, 495, 0.62); G.drawCrowd(ctx, this.crowd, t); ground(ctx, '#f4f8ff', '#a8b8cc'); },
      hazard(g, t) { if (t % 800 === 400) { const fromL = Math.random() < 0.5; g.hazards.push(G.makeHazard({ kind: 'moose', x: fromL ? -160 : 1440, y: GY - 110, vx: fromL ? 8 : -8, w: 130, h: 110, warn: 80, life: 280, dmg: 9, kb: 15, ang: 50 })); } } },
    { id: 'city', name: 'NEON CITY', dust: '#b8b8c8',
      init() { this.crowd = makeCrowd(51, ['civ', 'anime', 'robot', 'alien', 'god'], 20, 480, 525, 0.45, 0.6); },
      draw(ctx, t) { sky(ctx, '#05030f', '#1a0f3a', '#4a1a5a'); stars(ctx, 60, 4, t);
        skyline(ctx, 52, 480, '#140a28', '#ff4df0', 140, 380, t); skyline(ctx, 53, 500, '#0a0618', '#38e1ff', 60, 220, t);
        sign(ctx, 180, 260, 150, 44, 'RAMEN 24/7', '#14002a', '#ff4df0', '900 20px Rubik'); sign(ctx, 900, 230, 170, 44, 'STL ARENA', '#00141a', '#38e1ff', '900 20px Rubik');
        TG(ctx, t, 1040, 500, 0.65); G.drawCrowd(ctx, this.crowd, t); ground(ctx, '#2a2a36', '#15151d'); ctx.fillStyle = '#ffd34d'; for (let x = -400; x < 1700; x += 120) ctx.fillRect(x, GY + 40, 60, 6); },
      hazard(g, t) { if (t % 750 === 375) { const fromL = Math.random() < 0.5; g.hazards.push(G.makeHazard({ kind: 'car', x: fromL ? -200 : 1480, y: GY - 60, vx: fromL ? 15 : -15, w: 170, h: 60, warn: 70, life: 200, dmg: 10, kb: 18, ang: 35 })); } } },
    { id: 'nuclear', name: 'NUCLEAR FACTORY', dust: '#c9d4a8',
      init() { this.crowd = makeCrowd(61, ['worker', 'worker', 'robot', 'alien'], 14, 480, 525, 0.45, 0.6); },
      draw(ctx, t) { sky(ctx, '#3a4a2a', '#8a9a6a', '#b8c49a');
        for (const [x, s] of [[150, 1], [420, 1.2], [1050, 1]]) { ctx.fillStyle = '#b8b8b0'; ctx.beginPath(); ctx.moveTo(x - 90 * s, 480); ctx.quadraticCurveTo(x - 50 * s, 330, x - 70 * s, 220 * (2 - s) - 60); ctx.lineTo(x + 70 * s, 220 * (2 - s) - 60); ctx.quadraticCurveTo(x + 50 * s, 330, x + 90 * s, 480); ctx.fill();
          for (let i = 0; i < 4; i++) { const k = (t * 0.4 + i * 40) % 160; C(ctx, x + Math.sin(i + t * 0.01) * 20, 220 * (2 - s) - 60 - k, 30 + k * 0.4, `rgba(240,240,240,${0.5 * (1 - k / 160)})`); } }
        ctx.fillStyle = '#5a6a4a'; ctx.fillRect(600, 330, 300, 160); ctx.fillStyle = '#ffd34d'; ctx.fillRect(600, 330, 300, 14); sign(ctx, 680, 360, 140, 40, '☢ REACTOR 4', '#ffd34d', '#111', '900 16px Rubik');
        TG(ctx, t, 760, 500, 0.62); G.drawCrowd(ctx, this.crowd, t); ground(ctx, '#6a6a5a', '#3a3a30');
        for (const x of [60, 1200]) { ctx.fillStyle = '#e8c21a'; ctx.fillRect(x, GY - 50, 36, 50); ctx.fillStyle = '#111'; ctx.font = '900 20px Rubik'; ctx.textAlign = 'center'; ctx.fillText('☢', x + 18, GY - 18); } },
      hazard(g, t) { if (t % 480 === 240) g.hazards.push(G.makeHazard({ kind: 'rad', x: 150 + Math.random() * 980, y: 0, w: 90, h: GY, warn: 70, life: 140, dmg: 1, tick: true, kb: 3, ang: 90 })); } },
    { id: 'school', name: 'ST. LAWRENCE CATHOLIC SCHOOL', dust: '#cbbfa8',
      init() { this.crowd = makeCrowd(71, ['student', 'student', 'student', 'teacher', 'anime'], 24, 480, 525, 0.45, 0.6); },
      draw(ctx, t) { sky(ctx, '#5aa0e8', '#b8dcff'); for (let i = 0; i < 4; i++) cloud(ctx, ((i * 400 + t * 0.25) % 2000) - 300, 50 + i * 25, 1.1, 'rgba(255,255,255,0.9)');
        ctx.fillStyle = '#9a4a32'; ctx.fillRect(80, 250, 1120, 240); ctx.fillStyle = '#7a3a26'; ctx.fillRect(80, 240, 1120, 16);
        ctx.fillStyle = '#bfe0f5'; for (let i = 0; i < 14; i++) for (let j = 0; j < 2; j++) { if (i === 6 || i === 7) continue; ctx.fillRect(110 + i * 78, 285 + j * 90, 50, 56); }
        ctx.fillStyle = '#5a3a2a'; ctx.fillRect(600, 380, 80, 110); ctx.fillStyle = '#bfe0f5'; ctx.fillRect(610, 390, 26, 60); ctx.fillRect(644, 390, 26, 60);
        sign(ctx, 470, 200, 340, 44, 'ST. LAWRENCE CATHOLIC SCHOOL', '#0b2a5a', '#ffd34d', '900 16px Rubik');
        ctx.fillStyle = '#fff'; ctx.font = '700 12px Rubik'; ctx.textAlign = 'center'; ctx.fillText('2216 Lawrence Ave E · Scarborough, ON', 640, 238);
        ctx.fillStyle = '#ffd34d'; ctx.fillRect(637, 150, 6, 50); ctx.fillRect(624, 165, 32, 6);
        ctx.fillStyle = '#f2b705'; G.rr(ctx, 1000, 420, 220, 70, 10); ctx.fill(); ctx.fillStyle = '#111'; ctx.font = '900 13px Rubik'; ctx.fillText('SCHOOL BUS', 1110, 445); C(ctx, 1040, 490, 14, '#111'); C(ctx, 1180, 490, 14, '#111');
        TG(ctx, t, 300, 495, 0.62); G.drawCrowd(ctx, this.crowd, t); ground(ctx, '#7a7a80', '#4a4a50'); ctx.fillStyle = '#fff'; for (let x = -400; x < 1700; x += 100) ctx.fillRect(x, GY + 50, 50, 5); },
      hazard(g, t) { if (t % 420 === 210) { const fromL = Math.random() < 0.5; g.hazards.push(G.makeHazard({ kind: 'ball', x: fromL ? -30 : 1310, y: 380, vx: fromL ? 10 : -10, vy: -4, grav: 0.25, bounce: true, w: 26, h: 26, warn: 0, life: 260, dmg: 4, kb: 9, ang: 50 })); } } },
  ];
  G.drawCrowd = function (ctx, crowd, t) { updCrowd(crowd); for (const n of crowd) G.drawNPC(ctx, n, t); };
  G.drawHazard = function (ctx, h, t) {
    ctx.save();
    if (h.t < h.warn) { ctx.globalAlpha = 0.3 + 0.3 * Math.sin(h.t * 0.6); ctx.fillStyle = '#ff2a2a';
      if (h.kind === 'bolt' || h.kind === 'rad') ctx.fillRect(h.x - h.w / 2, 0, h.w, GY);
      else if (h.vx) { ctx.fillRect(h.vx > 0 ? 0 : 1240, GY - 140, 40, 140); ctx.globalAlpha = 1; ctx.font = '900 40px Rubik'; ctx.fillStyle = '#ff2a2a'; ctx.textAlign = 'center'; ctx.fillText('!', h.vx > 0 ? 20 : 1260, GY - 150); }
      else { ctx.beginPath(); ctx.arc(h.x, GY - 4, 30, 0, 7); ctx.fill(); }
      ctx.restore(); return; }
    const x = h.x, y = h.y;
    switch (h.kind) {
      case 'bolt': ctx.strokeStyle = '#fff6a0'; ctx.lineWidth = 10; ctx.shadowColor = '#f5c542'; ctx.shadowBlur = 30; ctx.beginPath(); let yy = 0, xx = x; ctx.moveTo(xx, 0); while (yy < GY) { yy += 40; xx = x + (Math.random() - 0.5) * 50; ctx.lineTo(xx, yy); } ctx.stroke(); break;
      case 'rad': { const g2 = ctx.createLinearGradient(x - h.w / 2, 0, x + h.w / 2, 0); g2.addColorStop(0, 'rgba(80,255,80,0)'); g2.addColorStop(0.5, 'rgba(120,255,90,0.6)'); g2.addColorStop(1, 'rgba(80,255,80,0)'); ctx.fillStyle = g2; ctx.fillRect(x - h.w / 2, 0, h.w, GY); break; }
      case 'ice': ctx.fillStyle = '#cfefff'; ctx.strokeStyle = '#6ab'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 12, y - 25); ctx.lineTo(x + 12, y - 25); ctx.lineTo(x, y + 25); ctx.closePath(); ctx.fill(); ctx.stroke(); break;
      case 'meteor': C(ctx, x, y, 28, '#6a3a1a'); C(ctx, x - 6, y - 6, 14, '#ff8a2a'); for (let i = 0; i < 5; i++) C(ctx, x + 20 + i * 12, y - 30 - i * 14, 14 - i * 2, `rgba(255,${120 + i * 20},40,${0.6 - i * 0.1})`); break;
      case 'baguette': ctx.translate(x, y); ctx.rotate(h.t * 0.3); ctx.fillStyle = '#d9a24a'; G.rr(ctx, -22, -6, 44, 12, 6); ctx.fill(); ctx.strokeStyle = '#8a5a1a'; ctx.lineWidth = 2; for (let i = -12; i < 16; i += 9) { ctx.beginPath(); ctx.moveTo(i, -4); ctx.lineTo(i + 5, 4); ctx.stroke(); } break;
      case 'tomato': C(ctx, x, y, 11, '#e02a2a'); C(ctx, x - 3, y - 4, 3, '#ff8a8a'); ctx.fillStyle = '#2a8a2a'; ctx.fillRect(x - 3, y - 13, 6, 4); break;
      case 'moose': ctx.translate(x, y + h.h); ctx.scale(h.vx > 0 ? 1 : -1, 1); ctx.fillStyle = '#5a3a1a'; ctx.fillRect(-55, -80, 100, 45); for (const lx of [-45, -25, 20, 35]) ctx.fillRect(lx, -38, 9, 38 + Math.sin(h.t * 0.5 + lx) * 3);
        ctx.fillRect(40, -100, 30, 40); ctx.fillStyle = '#c9a77a'; ctx.beginPath(); ctx.ellipse(45, -110, 26, 10, -0.3, 0, 7); ctx.fill(); break;
      case 'car': ctx.translate(x, y); ctx.scale(h.vx > 0 ? 1 : -1, 1); ctx.fillStyle = '#d02a4a'; G.rr(ctx, -85, -10, 170, 40, 10); ctx.fill(); ctx.fillStyle = '#a01a3a'; G.rr(ctx, -50, -38, 90, 32, 10); ctx.fill(); ctx.fillStyle = '#9fd8ff'; ctx.fillRect(-40, -32, 34, 22); ctx.fillRect(2, -32, 32, 22);
        C(ctx, -50, 32, 15, '#111'); C(ctx, 50, 32, 15, '#111'); ctx.fillStyle = '#fff6a0'; ctx.fillRect(80, 0, 8, 10); ctx.globalAlpha = 0.3; ctx.beginPath(); ctx.moveTo(88, 5); ctx.lineTo(260, -30); ctx.lineTo(260, 40); ctx.fill(); break;
      case 'ball': C(ctx, x, y, 13, '#fff'); ctx.fillStyle = '#111'; ctx.beginPath(); for (let i = 0; i < 5; i++) { const a = i * 1.256 + h.t * 0.2; ctx.lineTo(x + Math.cos(a) * 6, y + Math.sin(a) * 6); } ctx.fill(); break;
    }
    ctx.restore();
  };
  G.drawStageThumb = function (cv, st, t = 120) {
    const ctx = cv.getContext('2d'); ctx.save(); ctx.scale(cv.width / 1280, cv.height / 720); ctx.translate(0, 40);
    if (!st.crowd) st.init(); st.draw(ctx, t); ctx.restore();
  };
})();
