// ===== Juice: cel-shaded dust, sparks, impact frames, screen shake, glitch pipeline, deletion cinematic =====
(function () {
  const R = (a, b) => a + Math.random() * (b - a);
  const FX = G.FX = { list: [], groundY: 600, shakeMag: 0, shakeT: 0, impactT: 0, impactFocus: [640, 360], flashT: 0, flashCol: '#fff' };
  FX.clear = function () { this.list.length = 0; this.shakeT = 0; this.impactT = 0; this.flashT = 0; };
  FX.add = function (p) { if (this.list.length < 900) this.list.push(p); return p; };

  // Animation-vs style dust: chunky puffs with a darker rim + light top highlight, expanding and rising
  FX.dust = function (x, y, n = 8, pow = 1, dir = 0, col) {
    const base = col || FX.dustCol || '#d9cbb0';
    for (let i = 0; i < n; i++) {
      const side = dir || (Math.random() < 0.5 ? -1 : 1);
      FX.add({ k: 'dust', x: x + R(-10, 10), y: y - R(0, 8), vx: side * R(1, 6) * pow, vy: -R(0.3, 2.2) * pow, r: R(6, 13) * (0.7 + pow * 0.4), gr: R(0.25, 0.6), life: R(26, 48), t: 0, col: base, drag: 0.9 });
    }
    for (let i = 0; i < n * 0.6; i++) FX.add({ k: 'debris', x: x + R(-14, 14), y: y - 4, vx: R(-5, 5) * pow, vy: -R(3, 9) * pow, s: R(2, 5), life: R(30, 60), t: 0, col: G.shade(base, -0.45), rot: R(0, 6), vr: R(-0.3, 0.3) });
  };
  FX.landDust = function (x, y, pow) { FX.dust(x - 12, y, 4 + pow * 3 | 0, pow, -1); FX.dust(x + 12, y, 4 + pow * 3 | 0, pow, 1); if (pow > 1.2) FX.crack(x, y, pow); };
  FX.crack = function (x, y, pow) { const lines = []; for (let i = 0; i < 5; i++) { let px = x, py = y, pts = [[px, py]]; const d = (i - 2) * 0.5 + R(-0.2, 0.2); for (let j = 0; j < 4; j++) { px += Math.cos(d) * R(10, 22) * pow * (i % 2 ? 1 : -1); py += R(-1, 3); pts.push([px, py]); } lines.push(pts); } FX.add({ k: 'crack', lines, life: 70, t: 0 }); };
  FX.sparks = function (x, y, dir, n, col, spd = 10) { for (let i = 0; i < n; i++) { const a = (dir > 0 ? 0 : Math.PI) + R(-1.1, 1.1); FX.add({ k: 'spark', x, y, vx: Math.cos(a) * R(spd * 0.4, spd), vy: Math.sin(a) * R(spd * 0.4, spd), life: R(10, 20), t: 0, col }); } };
  FX.ring = function (x, y, r, col, w = 6, life = 18) { FX.add({ k: 'ring', x, y, r0: r * 0.2, r1: r, life, t: 0, col, w }); };
  FX.star = function (x, y, s, col) { FX.add({ k: 'star', x, y, s, life: 10, t: 0, col, rot: R(0, 1) }); };
  FX.text = function (x, y, str, col = '#fff', size = 34, life = 50) { FX.add({ k: 'text', x, y, str, col, size, life, t: 0, vy: -1.2 }); };
  FX.blood = function (x, y, dir, n) { for (let i = 0; i < n; i++) FX.add({ k: 'blood', x, y, vx: dir * R(1, 7) + R(-1, 1), vy: -R(1, 7), r: R(1.5, 3.5), life: R(30, 60), t: 0 }); };
  FX.speed = function (x, y, dir) { for (let i = 0; i < 6; i++) FX.add({ k: 'line', x: x - dir * R(0, 40), y: y + R(-60, 10), len: R(30, 80), dir, life: 10, t: 0 }); };
  FX.pixels = function (x, y, n, col) { for (let i = 0; i < n; i++) FX.add({ k: 'pix', x: x + R(-4, 4), y: y + R(-4, 4), vx: R(-2, 2), vy: -R(0.5, 3), s: R(2, 6), life: R(30, 70), t: 0, col }); };
  FX.flash = function (frames, col = '#fff') { this.flashT = frames; this.flashCol = col; };

  // big hit = stars + sparks + rings + dust if grounded
  FX.hitBurst = function (x, y, pow, dir, col, blood) {
    FX.star(x, y, 26 + pow * 22, '#fff'); FX.star(x, y, 14 + pow * 14, col || '#ffd34d');
    FX.sparks(x, y, dir, 6 + pow * 6 | 0, blood ? '#d0102a' : (col || '#fff'), 8 + pow * 6);
    FX.ring(x, y, 40 + pow * 40, 'rgba(255,255,255,0.9)', 4 + pow * 3);
    if (blood) FX.blood(x, y, dir, 4 + pow * 6 | 0);
  };

  FX.shake = function (mag, frames) { if (mag > this.shakeMag || this.shakeT <= 0) { this.shakeMag = mag; } this.shakeT = Math.max(this.shakeT, frames); };
  FX.shakeOffset = function () { if (this.shakeT <= 0) return [0, 0]; const m = this.shakeMag * Math.min(1, this.shakeT / 10); return [R(-m, m), R(-m, m)]; };
  FX.impact = function (frames, x, y) { this.impactT = frames; this.impactFocus = [x, y]; };

  FX.update = function () {
    if (this.shakeT > 0) this.shakeT--; if (this.flashT > 0) this.flashT--;
    const gy = this.groundY;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i]; p.t++;
      switch (p.k) {
        case 'dust': p.x += p.vx; p.y += p.vy; p.vx *= p.drag; p.vy *= 0.94; p.vy -= 0.03; p.r += p.gr; break;
        case 'debris': p.x += p.vx; p.y += p.vy; p.vy += 0.5; p.rot += p.vr; if (p.y > gy) { p.y = gy; p.vy *= -0.4; p.vx *= 0.7; } break;
        case 'spark': p.x += p.vx; p.y += p.vy; p.vx *= 0.86; p.vy *= 0.86; break;
        case 'blood': p.x += p.vx; p.y += p.vy; p.vy += 0.4; if (p.y > gy) { p.y = gy; p.vx = 0; p.vy = 0; } break;
        case 'text': p.y += p.vy; p.vy *= 0.95; break;
        case 'pix': p.x += p.vx; p.y += p.vy; p.vy -= 0.04; break;
        case 'line': p.x += p.dir * 6; break;
      }
      if (p.t >= p.life) this.list.splice(i, 1);
    }
  };
  FX.draw = function (ctx, layer) {
    for (const p of this.list) {
      const k = p.t / p.life;
      if (layer === 'back' && p.k !== 'crack') continue;
      if (layer !== 'back' && p.k === 'crack') continue;
      ctx.save();
      switch (p.k) {
        case 'dust': {
          const a = k < 0.15 ? 1 : 1 - (k - 0.15) / 0.85; ctx.globalAlpha = Math.max(0, a);
          G.circ(ctx, [p.x, p.y], p.r + 2.5, G.shade(p.col, -0.4));
          G.circ(ctx, [p.x, p.y], p.r, p.col);
          G.circ(ctx, [p.x - p.r * 0.25, p.y - p.r * 0.3], p.r * 0.55, G.shade(p.col, 0.45));
          break;
        }
        case 'debris': ctx.globalAlpha = 1 - k; ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.col; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s); break;
        case 'crack': ctx.globalAlpha = 1 - k; ctx.strokeStyle = 'rgba(0,0,0,0.65)'; ctx.lineWidth = 3; ctx.beginPath(); for (const l of p.lines) { ctx.moveTo(l[0][0], l[0][1]); for (const q of l) ctx.lineTo(q[0], q[1]); } ctx.stroke(); break;
        case 'spark': ctx.globalAlpha = 1 - k; ctx.strokeStyle = p.col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 2.2, p.y - p.vy * 2.2); ctx.stroke(); break;
        case 'ring': ctx.globalAlpha = 1 - k; ctx.strokeStyle = p.col; ctx.lineWidth = p.w * (1 - k) + 0.5; ctx.beginPath(); ctx.arc(p.x, p.y, p.r0 + (p.r1 - p.r0) * Math.sqrt(k), 0, 7); ctx.stroke(); break;
        case 'star': { ctx.globalAlpha = 1 - k * 0.6; ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.col; const s = p.s * (k < 0.3 ? k / 0.3 : 1 - (k - 0.3) * 0.8);
          ctx.beginPath(); for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, r = i % 2 ? s * 0.3 : s * (i % 4 ? 0.8 : 1.2); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.fill(); break; }
        case 'blood': ctx.globalAlpha = 1 - k; G.circ(ctx, [p.x, p.y], p.r, '#b3001b'); break;
        case 'text': ctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1; ctx.font = `italic 900 ${p.size}px Rubik`; ctx.textAlign = 'center'; ctx.lineWidth = 6; ctx.strokeStyle = '#000'; ctx.strokeText(p.str, p.x, p.y); ctx.fillStyle = p.col; ctx.fillText(p.str, p.x, p.y); break;
        case 'pix': ctx.globalAlpha = 1 - k; ctx.fillStyle = p.col; ctx.fillRect(p.x, p.y, p.s, p.s); break;
        case 'line': ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.dir * p.len, p.y); ctx.stroke(); break;
      }
      ctx.restore();
    }
  };

  // ---------- Impact frame: invert + desaturate + crush, radial spikes toward focus (Animation-vs / anime impact) ----------
  FX.drawImpact = function (ctx) {
    if (this.impactT <= 0) return; this.impactT--;
    const [fx, fy] = this.impactFocus, odd = this.impactT % 2;
    ctx.save();
    ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 1280, 720);
    ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, 1280, 720);
    ctx.globalCompositeOperation = 'hard-light'; ctx.fillStyle = odd ? '#202020' : '#e0e0e0'; ctx.fillRect(0, 0, 1280, 720);
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = odd ? '#000' : '#fff';
    for (let i = 0; i < 46; i++) { const a = Math.random() * Math.PI * 2, r0 = R(120, 260), r1 = 1100, w = R(0.004, 0.02);
      ctx.beginPath(); ctx.moveTo(fx + Math.cos(a) * r0, fy + Math.sin(a) * r0); ctx.lineTo(fx + Math.cos(a - w) * r1, fy + Math.sin(a - w) * r1); ctx.lineTo(fx + Math.cos(a + w) * r1, fy + Math.sin(a + w) * r1); ctx.fill(); }
    ctx.restore();
  };
  FX.drawFlash = function (ctx) { if (this.flashT <= 0) return; ctx.save(); ctx.globalAlpha = Math.min(1, this.flashT / 6) * 0.8; ctx.fillStyle = this.flashCol; ctx.fillRect(0, 0, 1280, 720); ctx.restore(); };

  // ---------- Glitch "shader" pipeline: grab screen -> slice into bands -> offset + chroma split + digital noise ----------
  const buf = document.createElement('canvas'); buf.width = 1280; buf.height = 720; const bctx = buf.getContext('2d');
  const noise = document.createElement('canvas'); noise.width = 256; noise.height = 256;
  (function () { const n = noise.getContext('2d'), id = n.createImageData(256, 256); for (let i = 0; i < id.data.length; i += 4) { const v = Math.random() < 0.5 ? 0 : 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = Math.random() * 120; } n.putImageData(id, 0, 0); })();
  FX.glitch = function (ctx, cv, amt) {
    if (amt <= 0) return;
    bctx.globalCompositeOperation = 'copy'; bctx.drawImage(cv, 0, 0); bctx.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    let y = 0;
    while (y < 720) {
      const h = Math.random() < 0.7 ? R(2, 14) : R(20, 70), off = Math.random() < 0.55 ? R(-1, 1) * amt * 90 : 0;
      ctx.drawImage(buf, 0, y, 1280, h, off, y, 1280, h);
      if (Math.abs(off) > 10 && Math.random() < 0.6) { // chromatic split ghost
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35;
        ctx.fillStyle = Math.random() < 0.5 ? '#ff0040' : '#00e5ff'; ctx.fillRect(off * 1.4, y, 1280, h);
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      }
      y += h;
    }
    for (let i = 0; i < 12 * amt; i++) { ctx.fillStyle = ['#ff00aa', '#00ffee', '#ffffff', '#000000', '#39ff14'][i % 5]; ctx.globalAlpha = R(0.3, 0.9); ctx.fillRect(R(0, 1280), R(0, 720), R(10, 260) * amt, R(2, 18)); }
    ctx.globalAlpha = 0.5 * amt; const ox = R(0, 256), oy = R(0, 256);
    ctx.fillStyle = ctx.createPattern(noise, 'repeat'); ctx.translate(-ox, -oy); ctx.fillRect(ox, oy, 1280, 720); ctx.translate(ox, oy);
    ctx.globalAlpha = 0.18; ctx.fillStyle = '#000'; for (let s = 0; s < 720; s += 4) ctx.fillRect(0, s, 1280, 1);
    ctx.restore();
  };

  // ---------- Faux OS "Deleting..." window ----------
  const FILES = ['soul.dll', 'moveset.json', 'hitbox.dat', 'hurtbox.dat', 'ultimate.exe', 'memories.db', 'ego.sys', 'powers.pak', 'voice.wav', 'vector_lines.svg', 'frame_data.csv', 'godhood.key', 'name.txt'];
  FX.drawDeleteWindow = function (ctx, name, prog, t, done) {
    const W = 560, H = 210, x = 640 - W / 2 + (done ? R(-6, 6) : 0), y = 110 + (done ? R(-4, 4) : 0);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x + 10, y + 10, W, H);
    ctx.fillStyle = '#e9e9ef'; ctx.fillRect(x, y, W, H); ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.strokeRect(x, y, W, H);
    const tg = ctx.createLinearGradient(x, 0, x + W, 0); tg.addColorStop(0, '#16163a'); tg.addColorStop(1, '#5a2a8a'); ctx.fillStyle = tg; ctx.fillRect(x, y, W, 30);
    ctx.font = '700 15px Rubik'; ctx.fillStyle = '#f5c542'; ctx.textAlign = 'left'; ctx.fillText('TGOE_Kernel.exe — Removing God', x + 12, y + 20);
    for (let i = 0; i < 3; i++) { ctx.fillStyle = ['#d33', '#ccc', '#ccc'][i]; ctx.fillRect(x + W - 30 - i * 26, y + 6, 20, 18); }
    ctx.fillStyle = '#fff'; ctx.font = '900 14px Rubik'; ctx.fillText('✕', x + W - 25, y + 20);
    ctx.fillStyle = '#111'; ctx.font = '600 17px Rubik';
    ctx.fillText(done ? 'ERROR 0xDEAD: ' + name + '.god could not be found.' : 'Deleting  C:\\TheSTL\\Gods\\' + name + '.god ...', x + 22, y + 62);
    const fi = Math.min(FILES.length - 1, Math.floor(prog * FILES.length));
    ctx.font = '500 14px monospace'; ctx.fillStyle = '#555'; ctx.fillText(done ? 'System integrity: CORRUPTED' : 'Removing: ' + FILES[fi] + '   (' + Math.floor(prog * 2048) + ' / 2048 nodes)', x + 22, y + 88);
    const bx = x + 22, by = y + 110, bw = W - 44, bh = 30;
    ctx.fillStyle = '#fff'; ctx.fillRect(bx, by, bw, bh); ctx.strokeStyle = '#444'; ctx.strokeRect(bx, by, bw, bh);
    const segs = Math.floor(prog * 40); for (let i = 0; i < segs; i++) { ctx.fillStyle = done ? (i % 2 ? '#c00' : '#300') : '#1fbf4a'; ctx.fillRect(bx + 3 + i * (bw - 6) / 40, by + 3, (bw - 6) / 40 - 2, bh - 6); }
    ctx.fillStyle = '#111'; ctx.font = '900 22px Rubik'; ctx.textAlign = 'right'; ctx.fillText(Math.floor(prog * 100) + '%', x + W - 22, y + 180);
    ctx.textAlign = 'left'; ctx.font = '600 13px Rubik'; ctx.fillStyle = '#666'; ctx.fillText(done ? 'Press nothing. It is already over.' : 'Do not turn off the multiverse.', x + 22, y + 180);
    ctx.restore();
  };
})();
