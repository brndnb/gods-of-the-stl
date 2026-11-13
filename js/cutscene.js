// ===== Opening cinematic: TGOE creates The STL and its gods + animated lobby backdrop =====
(function () {
  const C = (ctx, x, y, r, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, 7); ctx.fill(); };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), ease = k => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  const LINES = [
    [20, 'Before time. Before space. There was only the goo.'],
    [300, 'And from it rose David. The God of Everything.'],
    [640, 'Across the endless multiverse, he gathered the pieces of a world.'],
    [1000, 'He named it... The S T L.'],
    [1330, 'Then he breathed life into eighteen gods.'],
    [1720, 'Now they fight. For his amusement. For their glory.'],
  ];
  const CAPS = [[0, 290, 'BEFORE TIME. BEFORE SPACE. THERE WAS ONLY THE GOO.'], [290, 630, 'DAVID — THE GOD OF EVERYTHING (TGOE)'], [630, 990, 'ACROSS THE MULTIVERSE HE GATHERED THE PIECES OF A WORLD…'], [990, 1320, 'HE NAMED IT  “THE STL”'], [1320, 1710, '…AND BREATHED LIFE INTO 18 GODS.'], [1710, 2000, 'NOW THEY FIGHT.']];
  const END = 2000;
  function planet(ctx, x, y, r, t, form) {
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.clip();
    const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.1, x, y, r); g.addColorStop(0, '#9a6aff'); g.addColorStop(0.6, '#3a1a7a'); g.addColorStop(1, '#0a0420'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    for (let i = 0; i < 9; i++) { const a = i * 0.7 + t * 0.004, cx = x + Math.cos(a) * r * 0.6 - ((t * 0.6 + i * 80) % (r * 2.4)) + r * 1.2, cy = y + Math.sin(i * 2.1) * r * 0.6; C(ctx, cx, cy, r * (0.12 + (i % 3) * 0.06) * form, i % 2 ? '#f5c542' : '#c58bff'); }
    ctx.restore(); ctx.strokeStyle = 'rgba(245,197,66,0.8)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(x, y, r * 1.6, r * 0.32, -0.25, 0, 7); ctx.stroke();
    ctx.strokeStyle = 'rgba(197,139,255,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y, r * 1.85, r * 0.4, -0.25, 0, 7); ctx.stroke();
  }
  function stars(ctx, t, n = 200, spd = 0.2) { for (let i = 0; i < n; i++) { const x = (i * 197 + t * spd * (1 + i % 3)) % 1280, y = (i * 113) % 720; ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.03 + i)); C(ctx, x, y, (i % 3) * 0.6 + 0.4, '#fff'); } ctx.globalAlpha = 1; }
  function caption(ctx, t) { for (const [a, b, s] of CAPS) if (t >= a && t < b) { const k = Math.min(1, (t - a) / 30, (b - t) / 30); ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 610, 1280, 70); ctx.font = 'italic 900 30px Rubik'; ctx.textAlign = 'center'; ctx.fillStyle = '#f5c542'; ctx.fillText(s, 640, 656); ctx.restore(); } }
  function bars(ctx) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 1280, 60); ctx.fillRect(0, 660, 1280, 60); }

  const CS = G.Cutscene = { t: 0, on: false, done: null,
    start(cb) { this.t = 0; this.on = true; this.done = cb; G.music('lobby'); },
    skip() { if (!this.on) return; this.on = false; if ('speechSynthesis' in window) speechSynthesis.cancel(); this.done && this.done(); },
    update() { if (!this.on) return; this.t++; for (const [at, s] of LINES) if (this.t === at) G.say(s, { pitch: 0.25, rate: 0.85, boom: at === 1000 || at === 300 }); if (this.t === 1000 || this.t === 1330) G.sfx('boom'); if (this.t >= END) this.skip(); },
    draw(ctx) {
      const t = this.t; ctx.save(); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 1280, 720);
      if (t < 290) { // goo void
        stars(ctx, t, 80, 0.05); const k = clamp((t - 40) / 200, 0, 1);
        if (t < 120) { const y = -40 + t * 4.2; ctx.strokeStyle = '#1d0b33'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(640, -10); ctx.lineTo(640, y); ctx.stroke(); G.drawGoo(ctx, 640, y, 16, t, 1); }
        else { G.drawGoo(ctx, 640, 600, 30 + (1 - k) * 60, t, 2); ctx.save(); ctx.globalAlpha = ease(k); G.drawTGOE(ctx, 640, 600, 0.4 + k * 1.2, t, { arms: 'side', eyes: k }); ctx.restore(); }
      } else if (t < 630) { // reveal close-up
        const k = ease(clamp((t - 290) / 120, 0, 1)); const g = ctx.createRadialGradient(640, 300, 20, 640, 300, 700); g.addColorStop(0, '#2a0f4a'); g.addColorStop(1, '#000'); ctx.fillStyle = g; ctx.fillRect(0, 0, 1280, 720);
        for (let i = 0; i < 40; i++) { ctx.strokeStyle = `rgba(245,197,66,${0.08 + (i % 4) * 0.03})`; ctx.lineWidth = 3; const a = i / 40 * Math.PI * 2 + t * 0.002; ctx.beginPath(); ctx.moveTo(640, 300); ctx.lineTo(640 + Math.cos(a) * 1000, 300 + Math.sin(a) * 1000); ctx.stroke(); }
        G.drawTGOE(ctx, 640, 1080 - k * 140, 2.6 + (1 - k) * 0.8, t, { arms: t > 470 ? 'point' : 'side', eyes: 0.6 + 0.4 * Math.sin(t * 0.1) });
        if (t > 380) { ctx.font = '900 110px Bebas Neue, Impact'; ctx.textAlign = 'center'; ctx.globalAlpha = clamp((t - 380) / 30, 0, 1); ctx.fillStyle = '#f5c542'; ctx.fillText('T  G  O  E', 640, 150); ctx.globalAlpha = 1; }
      } else if (t < 990) { // multiverse gathering
        stars(ctx, t, 220, 0.6); const k = clamp((t - 630) / 360, 0, 1);
        for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2 + t * 0.006, r = 520 * (1 - ease(k)) + 40, x = 640 + Math.cos(a) * r * 1.3, y = 380 + Math.sin(a) * r * 0.6;
          ctx.strokeStyle = `hsla(${i * 23},90%,70%,0.8)`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 30 + (i % 4) * 10, 0, 7); ctx.stroke(); ctx.fillStyle = `hsla(${i * 23},90%,60%,0.18)`; ctx.fill(); C(ctx, x + 6, y - 6, 4, '#fff'); }
        ctx.save(); ctx.globalAlpha = 0.95; G.drawTGOE(ctx, 640, 700, 1.3, t, { arms: 'raise', eyes: 1 }); ctx.restore();
        if (k > 0.7) C(ctx, 640, 380, (k - 0.7) * 300, `rgba(255,240,200,${(k - 0.7) * 2})`);
      } else if (t < 1320) { // The STL forms
        stars(ctx, t, 260, 0.3); const k = ease(clamp((t - 990) / 120, 0, 1));
        if (t < 1010) { ctx.fillStyle = `rgba(255,255,255,${1 - (t - 990) / 20})`; ctx.fillRect(0, 0, 1280, 720); }
        planet(ctx, 640, 360, 70 + k * 150, t, k);
        if (t > 1080) { const q = clamp((t - 1080) / 40, 0, 1); ctx.save(); ctx.globalAlpha = q; ctx.font = '900 150px Bebas Neue, Impact'; ctx.textAlign = 'center'; ctx.lineWidth = 10; ctx.strokeStyle = '#000'; ctx.strokeText('THE STL', 640, 640 - 40); ctx.fillStyle = '#f5c542'; ctx.fillText('THE STL', 640, 600); ctx.restore(); }
      } else if (t < 1710) { // 18 gods descend
        stars(ctx, t, 200, 0.2); planet(ctx, 640, 860, 380, t, 1); ctx.save(); ctx.globalAlpha = 0.9; G.drawTGOE(ctx, 640, 300, 0.9, t, { arms: 'raise', eyes: 1 }); ctx.restore();
        for (let i = 0; i < 18; i++) { const k = clamp((t - 1340 - i * 9) / 80, 0, 1); if (k <= 0) continue; const sx = 640 + (i % 2 ? 66 : -66), sy = 50, tx = 120 + i * 61, ty = 520; const x = sx + (tx - sx) * ease(k), y = sy + (ty - sy) * ease(k) - Math.sin(k * Math.PI) * 120;
          C(ctx, x, y, 14, `hsla(${i * 20},95%,70%,0.35)`); C(ctx, x, y, 6, '#fff'); }
        if (t > 1500) { const i = Math.min(11, ((t - 1500) / 17) | 0), ch = G.ROSTER[i]; ctx.save(); ctx.translate(640, 560); ctx.scale(1.8, 1.8); G.drawFigure(ctx, ch, 0, 0, G.POSES.victory, 1, { t, dieFace: 6 }); ctx.restore();
          ctx.font = 'italic 900 54px Rubik'; ctx.textAlign = 'center'; ctx.lineWidth = 8; ctx.strokeStyle = '#000'; ctx.strokeText(ch.name, 640, 250); ctx.fillStyle = ch.glow; ctx.fillText(ch.name, 640, 250); ctx.font = '800 20px Rubik'; ctx.fillStyle = '#fff'; ctx.fillText(ch.title.toUpperCase(), 640, 280); }
      } else { // title
        stars(ctx, t, 220, 0.4); planet(ctx, 1000, 520, 150, t, 1); G.drawTGOE(ctx, 300, 640, 1.6, t, { arms: 'cross', eyes: 1 });
        const k = clamp((t - 1730) / 40, 0, 1); ctx.save(); ctx.globalAlpha = k; ctx.translate(700, 260); ctx.scale(1 + (1 - k) * 0.6, 1 + (1 - k) * 0.6); ctx.font = '900 130px Bebas Neue, Impact'; ctx.textAlign = 'center'; ctx.lineWidth = 12; ctx.strokeStyle = '#000'; ctx.strokeText('GODS OF THE STL', 0, 0); ctx.fillStyle = '#f5c542'; ctx.fillText('GODS OF THE STL', 0, 0); ctx.restore();
      }
      bars(ctx); caption(ctx, t);
      if ((t > 985 && t < 1000) || (t > 1695 && t < 1712)) G.FX.glitch(ctx, G.cv, 0.6);
      ctx.restore();
    } };

  // ---------- lobby backdrop (behind menus) ----------
  let lt = 0;
  G.idleUpdate = function () { lt++; if (CS.on) CS.update(); };
  G.idleDraw = function (ctx) {
    if (CS.on) return CS.draw(ctx);
    ctx.save(); const g = ctx.createLinearGradient(0, 0, 0, 720); g.addColorStop(0, '#12052b'); g.addColorStop(1, '#3a1466'); ctx.fillStyle = g; ctx.fillRect(0, 0, 1280, 720);
    stars(ctx, lt, 160, 0.15); planet(ctx, 1080, 620, 220, lt, 1);
    ctx.globalAlpha = 0.55; G.drawTGOE(ctx, 170, 760, 1.9, lt, { arms: 'cross', eyes: 0.7 + 0.3 * Math.sin(lt * 0.04) }); ctx.globalAlpha = 1;
    for (let i = 0; i < 8; i++) { ctx.fillStyle = `rgba(255,255,255,${0.04})`; ctx.save(); ctx.translate(((i * 220 + lt * 1.5) % 1700) - 200, 0); ctx.rotate(0.3); ctx.fillRect(0, -200, 40, 1200); ctx.restore(); }
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, 1280, 720); ctx.restore();
  };
})();
