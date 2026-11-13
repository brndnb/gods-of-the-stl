// ===== Vector stick-figure renderer (Animation-vs lines + Smash-style flair), poses, TGOE =====
(function () {
  const D2R = Math.PI / 180;
  const L = { torso: 36, neck: 5, head: 12, ua: 19, fa: 18, th: 23, sh: 23 };
  const SC = 1.3; G.FIG_SCALE = SC;
  // angles in degrees. limbs: 0 = straight down, +90 = forward, 180 = up, -90 = backward. torso t: 0 upright, + leans forward
  const P = G.POSES = {
    idle:     { t: 6,   uaF: 35,  faF: 135, uaB: 25,  faB: 120, thF: 18,  shF: 2,   thB: -16, shB: -4 },
    crouch:   { t: 22,  uaF: 50,  faF: 140, uaB: 40,  faB: 130, thF: 85,  shF: -5,  thB: 40,  shB: -60 },
    jump:     { t: 0,   uaF: 120, faF: 150, uaB: -40, faB: 10,  thF: 70,  shF: -20, thB: 20,  shB: -30 },
    fall:     { t: 4,   uaF: 140, faF: 165, uaB: 125, faB: 160, thF: 30,  shF: -10, thB: -10, shB: -30 },
    squat:    { t: 18,  uaF: 20,  faF: 60,  uaB: -20, faB: 20,  thF: 70,  shF: -15, thB: 45,  shB: -50 },
    jab:      { t: 14,  uaF: 92,  faF: 90,  uaB: 30,  faB: 130, thF: 26,  shF: 2,   thB: -22, shB: -6 },
    straight: { t: 26,  uaF: 20,  faF: 120, uaB: 88,  faB: 90,  thF: 30,  shF: 0,   thB: -26, shB: -8 },
    fkick:    { t: -14, uaF: 50,  faF: 130, uaB: -20, faB: 60,  thF: 95,  shF: 92,  thB: -6,  shB: -2 },
    hkick:    { t: -30, uaF: 60,  faF: 110, uaB: -40, faB: 20,  thF: -12, shF: -4,  thB: 125, shB: 118 },
    cjab:     { t: 24,  uaF: 88,  faF: 88,  uaB: 40,  faB: 130, thF: 85,  shF: -5,  thB: 40,  shB: -60 },
    uppercut: { t: 12,  uaF: 20,  faF: 110, uaB: 165, faB: 178, thF: 20,  shF: 0,   thB: -30, shB: -10 },
    clow:     { t: 30,  uaF: 50,  faF: 140, uaB: 40,  faB: 120, thF: 80,  shF: 86,  thB: 40,  shB: -60 },
    sweep:    { t: 40,  uaF: 60,  faF: 20,  uaB: -30, faB: -20, thF: 40,  shF: -60, thB: 92,  shB: 92 },
    jpunch:   { t: 10,  uaF: 110, faF: 100, uaB: -20, faB: 40,  thF: 60,  shF: -10, thB: 10,  shB: -20 },
    jhammer:  { t: 30,  uaF: 140, faF: 60,  uaB: 140, faB: 60,  thF: 60,  shF: -10, thB: 0,   shB: -30 },
    jkick:    { t: -10, uaF: 120, faF: 160, uaB: -30, faB: 30,  thF: 80,  shF: 80,  thB: 30,  shB: -40 },
    jdrop:    { t: -40, uaF: 160, faF: 170, uaB: 150, faB: 170, thF: 95,  shF: 95,  thB: 85,  shB: 85 },
    grab:     { t: 20,  uaF: 85,  faF: 80,  uaB: 75,  faB: 70,  thF: 28,  shF: 0,   thB: -24, shB: -6 },
    hit:      { t: -24, uaF: -20, faF: 40,  uaB: -40, faB: -10, thF: 18,  shF: 10,  thB: -20, shB: -10 },
    hitlow:   { t: 34,  uaF: 10,  faF: -20, uaB: -10, faB: -30, thF: 40,  shF: -10, thB: -20, shB: -20 },
    block:    { t: 4,   uaF: 60,  faF: 170, uaB: 55,  faB: 165, thF: 20,  shF: 2,   thB: -20, shB: -6 },
    cblock:   { t: 20,  uaF: 70,  faF: 170, uaB: 60,  faB: 165, thF: 85,  shF: -5,  thB: 40,  shB: -60 },
    cast:     { t: 10,  uaF: 92,  faF: 92,  uaB: 70,  faB: 100, thF: 35,  shF: 5,   thB: -30, shB: -10 },
    cast2:    { t: 18,  uaF: 100, faF: 100, uaB: 95,  faB: 95,  thF: 38,  shF: 5,   thB: -32, shB: -10 },
    windup:   { t: -8,  uaF: -30, faF: 60,  uaB: -60, faB: 0,   thF: 25,  shF: 2,   thB: -25, shB: -6 },
    raise:    { t: -6,  uaF: 160, faF: 175, uaB: 150, faB: 170, thF: 18,  shF: 2,   thB: -18, shB: -4 },
    temple:   { t: 4,   uaF: 120, faF: -150, uaB: 110, faB: -140, thF: 20, shF: 2,  thB: -20, shB: -4 },
    down:     { t: -92, uaF: -100, faF: -120, uaB: -60, faB: -80, thF: 88, shF: 92, thB: 80,  shB: 95 },
    dizzy:    { t: 14,  uaF: 10,  faF: 20,  uaB: -10, faB: 0,   thF: 16,  shF: 4,   thB: -14, shB: -2 },
    victory:  { t: 0,   uaF: 170, faF: 175, uaB: 30,  faB: 60,  thF: 15,  shF: 0,   thB: -15, shB: 0 },
    dash:     { t: 34,  uaF: -50, faF: 0,   uaB: -70, faB: -30, thF: 70,  shF: 0,   thB: -50, shB: -30 },
    whip:     { t: 20,  uaF: 120, faF: 95,  uaB: 20,  faB: 100, thF: 30,  shF: 0,   thB: -26, shB: -8 },
  };
  const KEYS = ['t', 'uaF', 'faF', 'uaB', 'faB', 'thF', 'shF', 'thB', 'shB'];
  G.lerpPose = function (a, b, k) { const o = {}; for (const key of KEYS) o[key] = a[key] + (b[key] - a[key]) * k; return o; };
  G.walkPose = function (ph, speed) {
    const p = Object.assign({}, P.idle), s = Math.sin(ph), c = Math.cos(ph), amp = 26 * speed;
    p.thF = 6 + s * amp; p.shF = p.thF - 10 - Math.max(0, -c) * 30 * speed; p.thB = 6 - s * amp; p.shB = p.thB - 10 - Math.max(0, c) * 30 * speed;
    p.t = 8 + 6 * speed; p.uaF = 35 - s * 18 * speed; p.uaB = 25 + s * 18 * speed; return p;
  };

  function skel(pose, face, rot) {
    const f = face, v = (a, len) => [Math.sin(a * D2R) * f * len * SC, Math.cos(a * D2R) * len * SC];
    const add = (p, d) => [p[0] + d[0], p[1] + d[1]];
    const hip = [0, 0];
    const td = [Math.sin(pose.t * D2R) * f, -Math.cos(pose.t * D2R)];
    const chest = [td[0] * L.torso * SC, td[1] * L.torso * SC];
    const neck = add(chest, [td[0] * L.neck * SC, td[1] * L.neck * SC]);
    const head = add(neck, [td[0] * L.head * SC, td[1] * L.head * SC]);
    const elF = add(chest, v(pose.uaF, L.ua)), haF = add(elF, v(pose.faF, L.fa));
    const elB = add(chest, v(pose.uaB, L.ua)), haB = add(elB, v(pose.faB, L.fa));
    const knF = add(hip, v(pose.thF, L.th)), ftF = add(knF, v(pose.shF, L.sh));
    const knB = add(hip, v(pose.thB, L.th)), ftB = add(knB, v(pose.shB, L.sh));
    const pts = { hip, chest, neck, head, elF, haF, elB, haB, knF, ftF, knB, ftB };
    if (rot) { const cx = chest[0] / 2, cy = chest[1] / 2, cs = Math.cos(rot), sn = Math.sin(rot); for (const k in pts) { const p = pts[k], x = p[0] - cx, y = p[1] - cy; pts[k] = [cx + x * cs - y * sn, cy + x * sn + y * cs]; } }
    let maxY = -1e9; for (const k in pts) { const yy = pts[k][1] + (k === 'head' ? L.head * SC : 0); if (yy > maxY) maxY = yy; }
    for (const k in pts) pts[k] = [pts[k][0], pts[k][1] - maxY - 1];
    return pts;
  }
  G.skel = skel;

  const W = 7.5 * SC; // limb width
  function seg(ctx, a, b, w, col) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
  function circ(ctx, p, r, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 7); ctx.fill(); }
  const mid = (a, b, k = 0.5) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];

  // ---------- main figure draw ----------
  // o: {t, alpha, flash, rot, dissolve(0..1), mode, dieFace, scale, silhouette}
  G.drawFigure = function (ctx, ch, x, y, pose, face, o = {}) {
    const t = o.t || 0, pts = skel(pose, face, o.rot || 0);
    ctx.save(); ctx.translate(x, y); if (o.scale) ctx.scale(o.scale, o.scale);
    ctx.globalAlpha = o.alpha == null ? 1 : o.alpha; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const dis = o.dissolve || 0, deco = Math.max(0, 1 - dis * 2.5);
    const sil = o.silhouette; // impact-frame silhouette color
    // segment list (back limbs first)
    const segs = [
      ['elB', 'chest', 'limbB'], ['haB', 'elB', 'limbB'], ['knB', 'hip', 'limbB'], ['ftB', 'knB', 'limbB'],
      ['hip', 'chest', 'torso'], ['knF', 'hip', 'limb'], ['ftF', 'knF', 'limb'], ['elF', 'chest', 'limb'], ['haF', 'elF', 'limb'],
    ];
    const keep = s => (s.idx / segs.length) >= dis;
    segs.forEach((s, i) => s.idx = i);
    if (!sil && deco > 0) { ctx.globalAlpha *= deco; (COST[ch.id] && COST[ch.id].pre || noop)(ctx, pts, ch, face, t, o); ctx.globalAlpha = o.alpha == null ? 1 : o.alpha; }
    const colOf = k => sil ? sil : k === 'limbB' ? shade(ch.col, -0.25) : ch.col;
    // outline pass
    if (!sil) for (const s of segs) if (keep(s)) seg(ctx, pts[s[0]], pts[s[1]], (s[2] === 'torso' ? W * 1.35 : W) + 5, o.flash ? '#fff' : '#06060c');
    for (const s of segs) if (keep(s)) seg(ctx, pts[s[0]], pts[s[1]], s[2] === 'torso' ? W * 1.35 : W, o.flash ? '#fff' : colOf(s[2]));
    // head
    if (dis < 0.95) {
      const hr = L.head * SC * (ch.id === 'kryztian' ? 1.12 : 1);
      if (sil) circ(ctx, pts.head, hr, sil);
      else if (!(COST[ch.id] && COST[ch.id].head)) { circ(ctx, pts.head, hr + 2.5, '#06060c'); circ(ctx, pts.head, hr, o.flash ? '#fff' : ch.skin); }
      if (!sil && deco > 0) { ctx.globalAlpha *= deco; (COST[ch.id] && COST[ch.id].head || eyes)(ctx, pts, ch, face, t, o, hr); }
    }
    if (!sil && deco > 0) { ctx.globalAlpha = (o.alpha == null ? 1 : o.alpha) * deco; (COST[ch.id] && COST[ch.id].post || noop)(ctx, pts, ch, face, t, o); }
    ctx.restore();
    pts.x = x; pts.y = y; return pts;
  };
  function noop() {}
  function eyes(ctx, p, ch, f, t, o, hr) {
    const h = p.head; ctx.fillStyle = o.eyeCol || '#fff';
    const blink = (Math.sin(t * 0.05 + ch.id.length) > 0.985) ? 0.3 : 1;
    ctx.fillRect(h[0] + f * 3 - 2, h[1] - 3, 3.5, 5 * blink); ctx.fillRect(h[0] + f * 8 - 2, h[1] - 3, 3.5, 5 * blink);
  }
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = v => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
    return '#' + ((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1);
  }
  G.shade = shade;

  // ---------- costumes ----------
  const COST = {
    james: {
      pre(ctx, p, ch, f, t) {
        for (let i = 0; i < 14; i++) { const a = t * 0.03 + i * 0.9, r = 34 + Math.sin(t * 0.05 + i) * 8;
          const c = mid(p.hip, p.chest, (i % 5) / 4); circ(ctx, [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r * 0.9], 7 + (i % 3) * 3, 'rgba(255,255,255,0.55)'); }
        for (let i = 0; i < 3; i++) { const k = ((t * 0.01 + i / 3) % 1); circ(ctx, [p.head[0] + f * (10 + i * 6), p.head[1] - 20 - k * 50], 3 + k * 6, `rgba(255,255,255,${0.7 - k * 0.7})`); }
      },
      post(ctx, p) { for (const k of ['haF', 'haB', 'ftF', 'ftB', 'elF', 'knF']) circ(ctx, p[k], 6, 'rgba(255,255,255,0.85)'); }
    },
    kyle: {
      head(ctx, p, ch, f, t, o, hr) {
        const h = p.head, s = hr * 1.9; ctx.save(); ctx.translate(h[0], h[1]); ctx.rotate((o.spin || 0) + f * 0.08);
        ctx.fillStyle = '#06060c'; rr(ctx, -s / 2 - 2.5, -s / 2 - 2.5, s + 5, s + 5, 7); ctx.fill();
        ctx.fillStyle = '#f7f7f7'; rr(ctx, -s / 2, -s / 2, s, s, 6); ctx.fill();
        ctx.fillStyle = '#c51d2a'; const face = o.dieFace || 5, q = s * 0.28;
        const pipMap = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
        for (const [a, b] of pipMap[face]) circ(ctx, [a * q, b * q], 2.6, face === 1 ? '#c51d2a' : '#111');
        ctx.restore();
      },
      post(ctx, p, ch, f) {
        const c = p.chest, n = mid(p.chest, p.hip, 0.45);
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(c[0] - 5, c[1] + 2); ctx.lineTo(c[0] + 5, c[1] + 2); ctx.lineTo(n[0], n[1]); ctx.fill();
        seg(ctx, [c[0], c[1] + 3], mid(c, n, 0.8), 3.5, '#d01c2c');
        circ(ctx, p.haF, 4.5, ch.skin); circ(ctx, p.haB, 4.5, ch.skin);
      }
    },
    laura: {
      pre(ctx, p, ch, f, t) { // leafy hair
        const h = p.head; for (let i = 0; i < 11; i++) { const a = -Math.PI * 0.95 + i * 0.32, r = 15 + (i % 2) * 4; leaf(ctx, h[0] + Math.cos(a) * r - f * 4, h[1] + Math.sin(a) * r, a + Math.sin(t * 0.04 + i) * 0.2, 9, i % 3 ? '#2f9d3a' : '#5fd16a'); }
      },
      post(ctx, p, ch, f, t) {
        for (const [a, b] of [['chest', 'elF'], ['elF', 'haF'], ['hip', 'knF'], ['knF', 'ftF'], ['hip', 'chest'], ['chest', 'elB'], ['hip', 'knB']]) vine(ctx, p[a], p[b], t);
        for (const k of ['elF', 'knF', 'chest', 'elB']) leaf(ctx, p[k][0], p[k][1], t * 0.02 + k.length, 8, '#4fc95a');
        circ(ctx, [p.head[0] - f * 9, p.head[1] - 10], 4, '#ff7ab6'); circ(ctx, [p.head[0] - f * 9, p.head[1] - 10], 1.6, '#ffe24d');
      }
    },
    lorenzo: {
      pre(ctx, p, ch, f, t) { // tiger cape
        const s = p.chest, sway = Math.sin(t * 0.08) * 6, back = -f;
        ctx.fillStyle = '#f08a1c'; ctx.strokeStyle = '#06060c'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(s[0] - 6 * f, s[1] - 4); ctx.quadraticCurveTo(s[0] + back * 40, s[1] + 30 + sway, s[0] + back * (34 + sway), p.hip[1] + 44);
        ctx.lineTo(s[0] + back * 6, p.hip[1] + 30); ctx.quadraticCurveTo(s[0] + back * 4, s[1] + 20, s[0] + 6 * f, s[1] - 2); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#111'; ctx.lineWidth = 3.5;
        for (let i = 1; i < 5; i++) { const y = s[1] + i * 15; ctx.beginPath(); ctx.moveTo(s[0] + back * (6 + i * 4), y); ctx.lineTo(s[0] + back * (18 + i * 5), y + 6); ctx.stroke(); }
      },
      head(ctx, p, ch, f, t, o, hr) {
        const h = p.head; circ(ctx, h, hr + 2.5, '#06060c'); circ(ctx, h, hr, ch.skin); eyes(ctx, p, ch, f, t, { eyeCol: '#222' });
        // tiger head hood
        ctx.fillStyle = '#f08a1c'; ctx.strokeStyle = '#06060c'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.ellipse(h[0] - f * 2, h[1] - 10, 17, 11, 0, Math.PI, 0); ctx.fill(); ctx.stroke();
        for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(h[0] + s * 12 - f * 2, h[1] - 15); ctx.lineTo(h[0] + s * 16 - f * 2, h[1] - 25); ctx.lineTo(h[0] + s * 6 - f * 2, h[1] - 19); ctx.fill(); ctx.stroke(); }
        ctx.strokeStyle = '#111'; ctx.lineWidth = 2; for (const s of [-6, 0, 6]) { ctx.beginPath(); ctx.moveTo(h[0] + s - f * 2, h[1] - 20); ctx.lineTo(h[0] + s - f * 2, h[1] - 14); ctx.stroke(); }
        circ(ctx, [h[0] + f * 6, h[1] - 13], 2, '#ffe24d'); circ(ctx, [h[0] + f * 12, h[1] - 13], 2, '#ffe24d');
      }
    },
    zephyra: {
      pre(ctx, p, ch, f, t) { // flowing white hair
        const h = p.head; ctx.strokeStyle = '#f4f4ff'; ctx.lineWidth = 5;
        for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(h[0] + f * 4, h[1] - 9 + i); ctx.quadraticCurveTo(h[0] - f * (20 + i * 3), h[1] + 4 + Math.sin(t * 0.07 + i) * 5, h[0] - f * (26 + i * 4), h[1] + 34 + i * 3 + Math.sin(t * 0.05 + i) * 6); ctx.stroke(); }
        const g = ctx.createRadialGradient(p.chest[0], p.chest[1], 2, p.chest[0], p.chest[1], 70); g.addColorStop(0, 'rgba(180,120,255,0.35)'); g.addColorStop(1, 'rgba(80,40,200,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.chest[0], p.chest[1], 70, 0, 7); ctx.fill();
      },
      post(ctx, p, ch, f, t) {
        const pts = ['hip', 'chest', 'elF', 'haF', 'knF', 'ftF', 'elB', 'knB', 'head'];
        for (let i = 0; i < 26; i++) { const a = p[pts[i % pts.length]], b = p[pts[(i * 7 + 3) % pts.length]], k = (i * 0.37) % 1, q = mid(a, b, k);
          const tw = 0.5 + 0.5 * Math.sin(t * 0.15 + i * 2); circ(ctx, [q[0] + Math.sin(i) * 3, q[1] + Math.cos(i) * 3], 1 + tw * 1.4, i % 4 ? '#fff' : '#8fd8ff'); }
        ctx.fillStyle = '#ffd34d'; circ(ctx, p.haF, 6, '#e8b23a'); for (let i = 0; i < 6; i++) circ(ctx, [p.haF[0] + Math.cos(i) * 4, p.haF[1] + Math.sin(i) * 4], 1.6, ['#f33', '#3f3', '#33f', '#ff3', '#f8f', '#f80'][i]);
      }
    },
    jacob: {
      pre(ctx, p, ch, f, t) {
        ctx.strokeStyle = 'rgba(120,210,255,0.35)'; ctx.lineWidth = W + 16;
        for (const [a, b] of [['hip', 'chest'], ['chest', 'elF'], ['elF', 'haF'], ['chest', 'elB'], ['elB', 'haB'], ['hip', 'knF'], ['knF', 'ftF'], ['hip', 'knB'], ['knB', 'ftB']]) seg(ctx, p[a], p[b], W + 14 + Math.sin(t * 0.2 + a.length) * 3, 'rgba(120,210,255,0.3)');
        for (let i = 0; i < 6; i++) { const a = t * 0.05 + i, c = p.chest; circ(ctx, [c[0] + Math.cos(a) * 40, c[1] + 20 + Math.sin(a * 1.3) * 40], 3 + i % 3, 'rgba(190,240,255,0.7)'); }
      },
      post(ctx, p, ch, f, t) { for (let i = 0; i < 4; i++) { const k = (t * 0.03 + i / 4) % 1; circ(ctx, [p.haF[0], p.haF[1] + k * 30], 2.5 * (1 - k), '#bff4ff'); } }
    },
    mathew: {
      pre(ctx, p, ch, f) { const h = p.head; // nemes back
        ctx.fillStyle = '#1d3f9e'; ctx.beginPath(); ctx.moveTo(h[0] - 14, h[1] - 6); ctx.lineTo(h[0] + 14, h[1] - 6); ctx.lineTo(h[0] + 20 - f * 4, h[1] + 26); ctx.lineTo(h[0] - 20 - f * 4, h[1] + 26); ctx.fill();
      },
      head(ctx, p, ch, f, t, o, hr) {
        const h = p.head; circ(ctx, h, hr + 2.5, '#06060c'); circ(ctx, h, hr, ch.skin); eyes(ctx, p, ch, f, t, o);
        ctx.fillStyle = '#f2c230'; ctx.beginPath(); ctx.moveTo(h[0] - hr - 4, h[1] + 2); ctx.lineTo(h[0] - hr + 2, h[1] - hr - 6); ctx.lineTo(h[0] + hr - 2, h[1] - hr - 6); ctx.lineTo(h[0] + hr + 4, h[1] + 2); ctx.lineTo(h[0] + hr - 1, h[1] - 4); ctx.lineTo(h[0] - hr + 1, h[1] - 4); ctx.fill();
        ctx.strokeStyle = '#1d3f9e'; ctx.lineWidth = 2.5; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(h[0] - hr + 1, h[1] - 9 - i * 4); ctx.lineTo(h[0] + hr - 1, h[1] - 9 - i * 4); ctx.stroke(); }
        circ(ctx, [h[0] + f * 3, h[1] - hr - 8], 3, '#f2c230');
        ctx.strokeStyle = '#06060c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(h[0] + f * 4, h[1] + hr - 1); ctx.lineTo(h[0] + f * 5, h[1] + hr + 7); ctx.stroke();
      },
      post(ctx, p, ch, f, t, o) {
        const c = p.chest; ctx.strokeStyle = '#f2c230'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(c[0], c[1] + 2, 9, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
        ctx.fillStyle = '#f3efe2'; const hp = p.hip; ctx.beginPath(); ctx.moveTo(hp[0] - 12, hp[1] - 6); ctx.lineTo(hp[0] + 12, hp[1] - 6); ctx.lineTo(hp[0] + 16 + f * 4, hp[1] + 22); ctx.lineTo(hp[0] - 16 + f * 4, hp[1] + 22); ctx.fill();
        ctx.fillStyle = '#f2c230'; ctx.fillRect(hp[0] - 12, hp[1] - 8, 24, 5);
        circ(ctx, mid(p.elF, p.chest, 0.3), 4, '#f2c230');
        if (o.mode === 'whip') { const a = p.haF; ctx.strokeStyle = '#5a3418'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(a[0], a[1]);
          const len = o.whipLen || 30; ctx.quadraticCurveTo(a[0] + f * len * 0.6, a[1] + 26, a[0] + f * len, a[1] + 10 + Math.sin(t * 0.2) * 6); ctx.stroke(); }
        else { const a = p.haB; ctx.strokeStyle = '#f2c230'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(a[0], a[1] + 30); ctx.lineTo(a[0], a[1] - 30); ctx.arc(a[0] + f * 6, a[1] - 30, 6, Math.PI, 0, f < 0); ctx.stroke(); }
      }
    },
    sean: {
      pre(ctx, p, ch, f, t) { // ghost wisps + tattered cloak
        for (let i = 0; i < 5; i++) { const k = (t * 0.015 + i / 5) % 1; circ(ctx, [p.chest[0] - f * (10 + k * 60), p.chest[1] + 10 - k * 40 + Math.sin(t * 0.1 + i) * 6], 8 * (1 - k), `rgba(200,215,255,${0.35 * (1 - k)})`); }
        ctx.fillStyle = 'rgba(40,46,66,0.9)'; const c = p.chest; ctx.beginPath(); ctx.moveTo(c[0] - 8, c[1] - 4); ctx.lineTo(c[0] + 8, c[1] - 4);
        for (let i = 0; i <= 6; i++) ctx.lineTo(c[0] + 14 - i * 5 - f * 10, p.hip[1] + 30 + (i % 2) * 10 + Math.sin(t * 0.06 + i) * 3); ctx.fill();
      },
      head(ctx, p, ch, f, t, o, hr) {
        const h = p.head; circ(ctx, h, hr + 2.5, '#06060c'); circ(ctx, h, hr, ch.skin);
        ctx.fillStyle = '#1a1f2e'; ctx.beginPath(); ctx.ellipse(h[0] + f * 3, h[1] - 2, 3, 4.5, 0, 0, 7); ctx.ellipse(h[0] + f * 9, h[1] - 2, 3, 4.5, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = '#7fc8ff'; ctx.lineWidth = 2; for (const ex of [3, 9]) { const k = (t * 0.02 + ex) % 1; ctx.beginPath(); ctx.moveTo(h[0] + f * ex, h[1] + 2); ctx.lineTo(h[0] + f * ex, h[1] + 5 + k * 10); ctx.stroke(); }
        ctx.fillStyle = 'rgba(30,34,50,0.95)'; ctx.beginPath(); ctx.arc(h[0], h[1] - 1, hr + 4, Math.PI * 1.05, Math.PI * 1.95); ctx.lineTo(h[0] - f * (hr + 8), h[1] + 10); ctx.fill();
      }
    },
    kryztian: {
      pre(ctx, p, ch, f, t) { const h = p.head; ctx.strokeStyle = 'rgba(255,215,80,0.85)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(h[0] - f * 2, h[1] - 22, 13, 4, 0, 0, 7); ctx.stroke(); },
      head(ctx, p, ch, f, t, o, hr) {
        const h = p.head; circ(ctx, h, hr + 2.5, '#06060c'); circ(ctx, h, hr, ch.skin);
        ctx.fillStyle = '#2b1a10'; ctx.beginPath(); ctx.arc(h[0] - f * 2, h[1] - 4, hr, Math.PI, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#06060c'; ctx.lineWidth = 2.2; // smug half-closed eyes + raised brow + smirk
        ctx.beginPath(); ctx.moveTo(h[0] + f * 1, h[1] - 1); ctx.lineTo(h[0] + f * 6, h[1] - 1); ctx.moveTo(h[0] + f * 8, h[1] - 1); ctx.lineTo(h[0] + f * 13, h[1] - 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(h[0] + f * 8, h[1] - 7); ctx.lineTo(h[0] + f * 14, h[1] - 10); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(h[0] + f * 4, h[1] + 7); ctx.quadraticCurveTo(h[0] + f * 9, h[1] + 9, h[0] + f * 13, h[1] + 4); ctx.stroke();
        if (Math.sin(t * 0.07) > 0.6) { ctx.fillStyle = '#fff6b0'; star(ctx, h[0] + f * 18, h[1] - 14, 5); }
      },
      post(ctx, p, ch, f, t) { // bathrobe
        const c = p.chest, hp = p.hip; ctx.fillStyle = '#d8c39a'; ctx.strokeStyle = '#06060c'; ctx.lineWidth = 3;
        const kn = mid(p.knF, p.knB);
        ctx.beginPath(); ctx.moveTo(c[0] - 13, c[1] - 3); ctx.lineTo(c[0] + 13, c[1] - 3); ctx.lineTo(kn[0] + 20, kn[1] + 6); ctx.lineTo(kn[0] - 20, kn[1] + 6); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#b89c66'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(c[0] - 7, c[1] - 2); ctx.lineTo(hp[0] + f * 5, hp[1] - 4); ctx.lineTo(c[0] + 7, c[1] - 2); ctx.stroke();
        ctx.strokeStyle = '#8f6f3a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(hp[0] - 14, hp[1] - 8); ctx.lineTo(hp[0] + 14, hp[1] - 8); ctx.lineTo(hp[0] + f * 10, hp[1] + 12); ctx.stroke();
        for (const [a, b] of [['chest', 'elF'], ['elF', 'haF']]) seg(ctx, p[a], p[b], W + 6, '#d8c39a');
        circ(ctx, p.haF, 5, ch.skin); circ(ctx, p.haB, 5, ch.skin);
      }
    },
    hunter: {
      pre(ctx, p, ch, f, t) { for (let i = 0; i < 16; i++) { const k = (t * 0.02 + i / 16) % 1, b = p[['hip', 'chest', 'head', 'knF', 'knB', 'elF'][i % 6]]; circ(ctx, [b[0] + Math.sin(i * 3 + t * 0.05) * 14, b[1] - k * 46], 12 * (1 - k), `rgba(90,30,180,${0.35 * (1 - k)})`); } },
      head(ctx, p, ch, f, t, o, hr) { const h = p.head; circ(ctx, h, hr + 3, '#2a0a50'); circ(ctx, h, hr, '#050508');
        ctx.shadowColor = '#ff2a3a'; ctx.shadowBlur = 10; ctx.fillStyle = '#ff2a3a';
        ctx.beginPath(); ctx.moveTo(h[0] + f * 1, h[1] - 3); ctx.lineTo(h[0] + f * 7, h[1] - 1); ctx.lineTo(h[0] + f * 1, h[1] + 1); ctx.fill();
        ctx.beginPath(); ctx.moveTo(h[0] + f * 8, h[1] - 1); ctx.lineTo(h[0] + f * 14, h[1] - 4); ctx.lineTo(h[0] + f * 13, h[1] + 1); ctx.fill(); ctx.shadowBlur = 0; }
    },
    aisha: {
      post(ctx, p, ch, f, t) {
        for (const [a, b] of [['chest', 'elF'], ['elF', 'haF'], ['hip', 'knF'], ['knF', 'ftF']]) { seg(ctx, p[a], p[b], W - 1, '#d9e2ea'); seg(ctx, mid(p[a], p[b], 0.2), mid(p[a], p[b], 0.8), 2, '#38e1ff'); }
        for (const k of ['elF', 'knF', 'haF']) { circ(ctx, p[k], 5, '#6b7783'); circ(ctx, p[k], 2, '#38e1ff'); }
        seg(ctx, p.hip, p.chest, 2.5, '#38e1ff');
      },
      head(ctx, p, ch, f, t, o, hr) { const h = p.head; circ(ctx, h, hr + 2.5, '#06060c'); circ(ctx, h, hr, ch.skin);
        ctx.fillStyle = '#b8c2cc'; ctx.beginPath(); ctx.arc(h[0], h[1], hr, -Math.PI / 2, Math.PI / 2, f < 0); ctx.fill();
        ctx.fillStyle = '#1b1b1b'; ctx.beginPath(); ctx.arc(h[0] - f * 2, h[1] - 3, hr + 1, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
        ctx.shadowColor = '#38e1ff'; ctx.shadowBlur = 12; circ(ctx, [h[0] + f * 8, h[1] - 1], 3, '#7ff3ff'); ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff'; ctx.fillRect(h[0] + f * 2 - 1.5, h[1] - 3, 3, 4); }
    },
    joldyne: {
      head(ctx, p, ch, f, t, o, hr) {
        const h = p.head; circ(ctx, h, hr + 2.5, '#06060c'); circ(ctx, h, hr, ch.skin); eyes(ctx, p, ch, f, t, o);
        ctx.fillStyle = '#e07a2a'; ctx.beginPath(); ctx.arc(h[0], h[1] - 2, hr + 2, Math.PI, 0); ctx.fill(); // beanie
        for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(h[0] + s * 6, h[1] - hr - 1); ctx.lineTo(h[0] + s * 13, h[1] - hr - 11); ctx.lineTo(h[0] + s * 13, h[1] - hr + 2); ctx.fill(); } // owl-ear tufts
        circ(ctx, [h[0] - 5, h[1] - hr + 1], 3, '#fff'); circ(ctx, [h[0] + 5, h[1] - hr + 1], 3, '#fff'); circ(ctx, [h[0] - 5, h[1] - hr + 1], 1.5, '#111'); circ(ctx, [h[0] + 5, h[1] - hr + 1], 1.5, '#111');
        ctx.strokeStyle = '#2b2b3a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(h[0], h[1], hr + 3, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); // headphones
        ctx.fillStyle = '#7a5cff'; rr(ctx, h[0] - f * 2 - 5, h[1] - 4, 10, 12, 4); ctx.fill();
      },
      post(ctx, p, ch, f, t, o) {
        const c = mid(p.chest, p.hip, 0.35); ctx.lineWidth = 3; const cols = ['#ff4d4d', '#ffb347', '#ffe24d', '#4dd96b', '#4db5ff', '#a06bff'];
        for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, x = Math.cos(a) * 9, y = Math.sin(2 * a) * 4; circ(ctx, [c[0] + x, c[1] + y], 1.8, cols[i % 6]); } // infinity
        if (!o.noOwl) { const s = p.chest, bob = Math.sin(t * 0.1) * 2; owl(ctx, s[0] - f * 10, s[1] - 12 + bob, 0.7, f, t); }
      }
    },
  };
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function leaf(ctx, x, y, a, s, col) { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(s * 0.6, -s * 0.5, s * 1.4, 0); ctx.quadraticCurveTo(s * 0.6, s * 0.5, 0, 0); ctx.fill(); ctx.restore(); }
  function vine(ctx, a, b, t) { ctx.strokeStyle = '#2f9d3a'; ctx.lineWidth = 2.5; ctx.beginPath(); const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
    for (let i = 0; i <= 12; i++) { const k = i / 12, w = Math.sin(k * Math.PI * 3 + t * 0.05) * 5; const x = a[0] + dx * k + nx * w, y = a[1] + dy * k + ny * w; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
  function star(ctx, x, y, r) { ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr2 = i % 2 ? r * 0.35 : r; ctx.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); } ctx.fill(); }
  function owl(ctx, x, y, s, f, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * f, s);
    ctx.fillStyle = '#8a5a2b'; ctx.strokeStyle = '#06060c'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(0, 0, 11, 14, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-9, -8); ctx.lineTo(-11, -18); ctx.lineTo(-3, -11); ctx.moveTo(9, -8); ctx.lineTo(11, -18); ctx.lineTo(3, -11); ctx.fill();
    ctx.fillStyle = '#f3e0b5'; ctx.beginPath(); ctx.ellipse(0, 5, 7, 8, 0, 0, 7); ctx.fill();
    const bl = Math.sin(t * 0.05) > 0.95 ? 0.2 : 1; ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.ellipse(-4.5, -5, 4, 4 * bl, 0, 0, 7); ctx.ellipse(4.5, -5, 4, 4 * bl, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(-4, -5, 1.8 * bl, 0, 7); ctx.arc(5, -5, 1.8 * bl, 0, 7); ctx.fill();
    ctx.fillStyle = '#e07a2a'; ctx.beginPath(); ctx.moveTo(-2, -2); ctx.lineTo(2, -2); ctx.lineTo(0, 2); ctx.fill(); ctx.restore();
  }
  G.drawOwl = owl; G.rr = rr; G.leaf = leaf; G.star = star; G.circ = circ; G.seg = seg;

  // ---------- TGOE (The God Of Everything) ----------
  // goo head/hands, gold+black vendetta-style mask, fedora, suit. arms: 'cross' | 'raise' | 'side'
  function goo(ctx, x, y, r, t, seed) {
    ctx.beginPath();
    for (let i = 0; i <= 28; i++) { const a = i / 28 * Math.PI * 2, n = Math.sin(a * 3 + t * 0.06 + seed) * 0.08 + Math.sin(a * 5 - t * 0.09 + seed * 2) * 0.05; const rr2 = r * (1 + n); i ? ctx.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2) : ctx.moveTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); }
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.4, r * 0.1, x, y, r * 1.1); g.addColorStop(0, '#5a2a8a'); g.addColorStop(0.5, '#1d0b33'); g.addColorStop(1, '#07020f');
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = 'rgba(210,170,255,0.55)'; ctx.beginPath(); ctx.ellipse(x - r * 0.35, y - r * 0.45, r * 0.22, r * 0.1, -0.5, 0, 7); ctx.fill();
    for (let i = 0; i < 3; i++) { const k = ((t * 0.008 + i * 0.37 + seed) % 1), dx = x + (i - 1) * r * 0.5, dy = y + r * 0.85;
      ctx.strokeStyle = '#1d0b33'; ctx.lineWidth = r * 0.14 * (1 - k * 0.5); ctx.beginPath(); ctx.moveTo(dx, dy - 2); ctx.lineTo(dx, dy + k * r * 1.2); ctx.stroke();
      circ(ctx, [dx, dy + k * r * 1.2], r * 0.09 * (1.2 - k * 0.4), '#2a0f4a'); }
  }
  G.drawGoo = goo;
  G.drawTGOE = function (ctx, x, y, s, t, opts = {}) {
    const arms = opts.arms || 'cross';
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (opts.aura !== false) { const g = ctx.createRadialGradient(0, -110, 10, 0, -110, 160); g.addColorStop(0, 'rgba(245,197,66,0.25)'); g.addColorStop(1, 'rgba(120,40,200,0)'); ctx.fillStyle = g; ctx.fillRect(-170, -280, 340, 330); }
    // legs + shoes
    ctx.fillStyle = '#0c0c12'; ctx.fillRect(-20, -78, 17, 76); ctx.fillRect(3, -78, 17, 76);
    ctx.fillStyle = '#000'; rr(ctx, -26, -6, 25, 8, 4); ctx.fill(); rr(ctx, 1, -6, 25, 8, 4); ctx.fill();
    // suit torso
    ctx.fillStyle = '#121219'; ctx.beginPath(); ctx.moveTo(-36, -170); ctx.lineTo(36, -170); ctx.lineTo(28, -74); ctx.lineTo(-28, -74); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8e8e8'; ctx.beginPath(); ctx.moveTo(-11, -170); ctx.lineTo(11, -170); ctx.lineTo(0, -128); ctx.fill();
    ctx.fillStyle = '#f5c542'; ctx.beginPath(); ctx.moveTo(-3, -166); ctx.lineTo(3, -166); ctx.lineTo(4, -132); ctx.lineTo(0, -126); ctx.lineTo(-4, -132); ctx.fill();
    ctx.strokeStyle = '#2a2a36'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-11, -170); ctx.lineTo(-20, -130); ctx.lineTo(0, -100); ctx.lineTo(20, -130); ctx.lineTo(11, -170); ctx.stroke();
    ctx.fillStyle = '#f5c542'; ctx.beginPath(); ctx.arc(0, -110, 2, 0, 7); ctx.arc(0, -96, 2, 0, 7); ctx.fill();
    // arms
    ctx.strokeStyle = '#121219'; ctx.lineWidth = 15;
    let hl, hr2;
    if (arms === 'cross') { ctx.beginPath(); ctx.moveTo(-32, -164); ctx.lineTo(-30, -126); ctx.lineTo(18, -122); ctx.moveTo(32, -164); ctx.lineTo(30, -126); ctx.lineTo(-18, -118); ctx.stroke(); hl = [22, -122]; hr2 = [-22, -118]; }
    else if (arms === 'raise') { const w = Math.sin(t * 0.05) * 6; ctx.beginPath(); ctx.moveTo(-32, -164); ctx.lineTo(-62, -200 + w); ctx.lineTo(-74, -246 + w); ctx.moveTo(32, -164); ctx.lineTo(62, -200 - w); ctx.lineTo(74, -246 - w); ctx.stroke(); hl = [-74, -250 + w]; hr2 = [74, -250 - w]; }
    else if (arms === 'point') { ctx.beginPath(); ctx.moveTo(-32, -164); ctx.lineTo(-36, -118); ctx.lineTo(-30, -84); ctx.moveTo(32, -164); ctx.lineTo(74, -170); ctx.lineTo(116, -180); ctx.stroke(); hl = [-30, -80]; hr2 = [120, -181]; }
    else { ctx.beginPath(); ctx.moveTo(-32, -164); ctx.lineTo(-38, -120); ctx.lineTo(-34, -82); ctx.moveTo(32, -164); ctx.lineTo(38, -120); ctx.lineTo(34, -82); ctx.stroke(); hl = [-34, -78]; hr2 = [34, -78]; }
    goo(ctx, hl[0], hl[1], 9, t, 1.3); goo(ctx, hr2[0], hr2[1], 9, t, 2.1);
    // goo head
    goo(ctx, 0, -200, 27, t, 0.4);
    // mask (gold + black vendetta-style)
    ctx.save(); ctx.translate(0, -200);
    ctx.fillStyle = '#f5c542'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-17, -16); ctx.quadraticCurveTo(0, -22, 17, -16); ctx.quadraticCurveTo(20, 4, 12, 18); ctx.quadraticCurveTo(0, 28, -12, 18); ctx.quadraticCurveTo(-20, 4, -17, -16); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.moveTo(-14, -8); ctx.quadraticCurveTo(-8, -14, -2, -9); ctx.quadraticCurveTo(-8, -10, -14, -8); ctx.fill(); ctx.beginPath(); ctx.moveTo(14, -8); ctx.quadraticCurveTo(8, -14, 2, -9); ctx.quadraticCurveTo(8, -10, 14, -8); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-7, -3, 4, 2, 0.15, 0, 7); ctx.ellipse(7, -3, 4, 2, -0.15, 0, 7); ctx.fill();
    const eg = opts.eyes || 0; if (eg) { ctx.shadowColor = '#f5c542'; ctx.shadowBlur = 12; ctx.fillStyle = `rgba(255,220,90,${eg})`; ctx.beginPath(); ctx.arc(-7, -3, 1.6, 0, 7); ctx.arc(7, -3, 1.6, 0, 7); ctx.fill(); ctx.shadowBlur = 0; ctx.fillStyle = '#111'; }
    ctx.beginPath(); ctx.moveTo(-12, 7); ctx.quadraticCurveTo(-6, 4, 0, 7); ctx.quadraticCurveTo(6, 4, 12, 7); ctx.quadraticCurveTo(14, 12, 9, 10); ctx.quadraticCurveTo(0, 9, -9, 10); ctx.quadraticCurveTo(-14, 12, -12, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-2, 13); ctx.lineTo(2, 13); ctx.lineTo(0, 22); ctx.fill();
    ctx.strokeStyle = '#111'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.quadraticCurveTo(-12, 8, -9, 12); ctx.moveTo(10, 0); ctx.quadraticCurveTo(12, 8, 9, 12); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-17 + i * 2, -14 + i * 7); ctx.lineTo(-11 + i, -12 + i * 7); ctx.stroke(); }
    ctx.restore();
    // fedora
    ctx.fillStyle = '#0a0a0f'; ctx.beginPath(); ctx.ellipse(0, -222, 44, 8, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-26, -222); ctx.quadraticCurveTo(-28, -252, -12, -254); ctx.quadraticCurveTo(0, -246, 12, -254); ctx.quadraticCurveTo(28, -252, 26, -222); ctx.fill();
    ctx.fillStyle = '#f5c542'; ctx.fillRect(-26, -231, 52, 6);
    ctx.restore();
  };

  // portrait for select screen
  G.drawPortrait = function (cv, ch, t = 0) {
    const ctx = cv.getContext('2d'); const w = cv.width, h = cv.height;
    const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, shade(ch.acc, -0.55)); g.addColorStop(1, '#0b0b12');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.25; ctx.fillStyle = ch.glow; for (let i = 0; i < 6; i++) ctx.fillRect(i * 34 - 20, 0, 12, h); ctx.globalAlpha = 1;
    ctx.save(); ctx.translate(w / 2 - 6, h + 70); ctx.scale(1.55, 1.55);
    G.drawFigure(ctx, ch, 0, 0, P.idle, 1, { t, dieFace: 6, noOwl: false }); ctx.restore();
  };
})();
