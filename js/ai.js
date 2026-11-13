// ===== Bot AI: drives a Controller exactly like a human would (motions, buffers, blocks, techs) =====
(function () {
  const rnd = Math.random;
  const MOT = { s1: [['D'], ['D', 'F'], ['F']], s2: [['B'], [], ['F']], s3: [['D'], ['D', 'B'], ['B']], s4: [['D'], [], ['D']] };
  const BTN = { s1: 'FP', s2: 'BP', s3: 'FK', s4: 'BK' };
  class Bot {
    constructor(f, diff) { this.f = f; this.d = diff; this.plan = []; this.wait = 30; this.mem = 0;
      this.react = [26, 18, 12, 7, 3][diff - 1]; this.blockP = [0.15, 0.3, 0.5, 0.68, 0.85][diff - 1]; this.techP = [0.1, 0.25, 0.45, 0.65, 0.85][diff - 1]; this.comboP = [0.1, 0.3, 0.55, 0.75, 0.95][diff - 1]; }
    push(steps) { this.plan.push(...steps); }
    dirs(list) { const f = this.f, h = { l: 0, r: 0, u: 0, d: 0, blk: 0 }; for (const k of list) { if (k === 'F') h[f.face > 0 ? 'r' : 'l'] = 1; else if (k === 'B') h[f.face > 0 ? 'l' : 'r'] = 1; else if (k === 'U') h.u = 1; else if (k === 'D') h.d = 1; else if (k === 'BLK') h.blk = 1; } return h; }
    special(slot) { const m = MOT[slot]; const steps = m.map(d => ({ h: d })); steps.push({ h: m[m.length - 1], p: BTN[slot] }); steps.push({ h: [] }); this.push(steps); }
    update(g) {
      const f = this.f, o = f.opp, c = f.ctrl; c.held = { l: 0, r: 0, u: 0, d: 0, blk: 0 };
      if (g.phase !== 'fight' || g.ult || f.state === 'ko' || f.state === 'dizzy') { this.plan.length = 0; return; }
      const dx = o.x - f.x, dist = Math.abs(dx);
      // drive Lorenzo's summoned creature
      if (f.state === 'summoning' && f.summon) { const m = f.summon, mdx = o.x - m.x; if (Math.abs(mdx) > m.b.rng * 0.7) c.held[mdx > 0 ? 'r' : 'l'] = 1; else c.held[mdx > 0 ? 'r' : 'l'] = rnd() < 0.1 ? 1 : 0;
        if (m.b.fly) { c.held.d = m.y < o.y - 120 ? 1 : 0; c.held.u = m.y > o.y - 70 ? 1 : 0; } if (Math.abs(mdx) < m.b.rng + 40 && rnd() < 0.15) c.press('FP'); if (m.t > 280 && rnd() < 0.05) c.held.blk = 1; return; }
      // puppet / forced: nothing to do
      if (f.forced) return;
      // launched: DI + tech
      if (f.state === 'launch') { c.held.u = rnd() < 0.5 ? 1 : 0; c.held[f.vx > 0 ? 'l' : 'r'] = 1; if ((f.y > G.GROUND - 110 || f.x < 110 || f.x > 1170) && rnd() < this.techP * 0.35) c.held.blk = (g.t % 2); return; }
      if (f.state === 'hitstun' && this.d >= 3 && rnd() < 0.3) { c.held[dx > 0 ? 'l' : 'r'] = 1; }
      // reactive defense
      const threat = (o.state === 'attack' && o.move && o.move.fr <= o.move.def.s + o.move.def.a && dist < 330) || g.projectiles.some(p => p.owner === o && !p.invisible && Math.abs(p.x - f.x) < 240 && Math.sign(p.vx || (f.x - p.x)) === Math.sign(f.x - p.x));
      if (threat && f.actionable() && f.onGround) { if (this.mem <= 0) { this.mem = this.react; this.blockNow = rnd() < this.blockP; }
        if (this.blockNow) { this.plan.length = 0; c.held.blk = 1; const low = o.move && o.move.def.lvl === 'low'; c.held.d = low ? 1 : 0; if (this.d >= 4 && rnd() < 0.03 && f.sp.s2 && f.ch.id === 'joldyne') this.special('s2'); return; } }
      if (this.mem > 0) this.mem--;
      // ultimate
      if (f.meter >= 100 && f.actionable() && dist < 600 && rnd() < 0.02 * this.d) { c.press('ULT'); return; }
      // combo continuation
      if (f.move && f.move.connected && f.move.kind === 'normal' && rnd() < this.comboP * 0.25) { const k = f.move.def.key || ''; const nx = { FP: 'BP', BP: 'FK', FK: 'BK', dFP: 'dBP', dFK: 'dBK', jFP: 'jFK', jFK: 'jBK' }[k];
        if (nx) c.press(nx.replace(/^[dj]/, '')); else if (rnd() < 0.5) this.special(['s1', 's2', 's4'][(rnd() * 3) | 0]); if (k[0] === 'd') c.held.d = 1; }
      // execute plan
      if (this.plan.length) { const s = this.plan.shift(); const h = this.dirs(s.h || []); Object.assign(c.held, h); if (s.p) c.press(s.p); return; }
      if (this.wait > 0) { this.wait--; if (dist > 260 && f.actionable()) c.held[dx > 0 ? 'r' : 'l'] = rnd() < 0.7 ? 1 : 0; return; }
      if (!f.actionable()) return;
      this.wait = this.react + (rnd() * 20 | 0);
      // anti-air
      if (!o.onGround && dist < 170 && o.y < G.GROUND - 60 && rnd() < 0.3 + this.d * 0.1) { this.push([{ h: ['D'] }, { h: ['D'], p: 'BP' }, { h: ['D'] }]); return; }
      const r = rnd();
      if (dist > 430) {
        if (r < 0.35) this.special(rnd() < 0.7 ? 's1' : 's4');
        else if (r < 0.55) this.push([{ h: ['F'] }, { h: [] }, { h: ['F'] }, ...Array(10).fill({ h: ['F'] })]);
        else this.push(Array(20 + (rnd() * 20 | 0)).fill({ h: ['F'] }));
      } else if (dist > 160) {
        if (r < 0.22) this.special(['s1', 's2', 's3', 's4'][(rnd() * 4) | 0]);
        else if (r < 0.4) this.push([{ h: ['U', 'F'] }, ...Array(14).fill({ h: ['F'] }), { h: [], p: rnd() < 0.5 ? 'FK' : 'BP' }, ...Array(6).fill({ h: [] }), { h: [], p: 'BK' }]);
        else if (r < 0.75) this.push(Array(16).fill({ h: ['F'] }));
        else this.push(Array(10).fill({ h: ['B'] }));
      } else {
        if (r < 0.14) this.push([{ h: [], p: 'TH' }]);
        else if (r < 0.42) this.push([{ h: [], p: 'FP' }, ...Array(7).fill({ h: [] }), { h: [], p: 'BP' }, ...Array(9).fill({ h: [] }), { h: [], p: 'FK' }, ...Array(10).fill({ h: [] }), { h: [], p: 'BK' }]);
        else if (r < 0.56) this.push([{ h: ['D'], p: 'FK' }, ...Array(8).fill({ h: ['D'] }), { h: ['D'], p: 'BK' }, { h: ['D'] }]);
        else if (r < 0.7) this.special(['s2', 's3', 's4'][(rnd() * 3) | 0]);
        else if (r < 0.8) this.push([{ h: ['D'], p: 'BP' }, { h: ['D'] }]);
        else if (r < 0.9) this.push(Array(14).fill({ h: ['B'] }));
        else this.push(Array(16).fill({ h: ['BLK'] }));
      }
    }
  }
  G.Bot = Bot;
})();
