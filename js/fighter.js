// ===== Fighter: input buffer, frame-data state machine, physics, hit resolution (health + knockback hybrid, DI/SDI/tech) =====
(function () {
  const K = G.PHYS = { GRAV: 0.72, JUMP: -15.5, DJUMP: -13, WALKF: 4.4, WALKB: 3.4, AIRACC: 0.6, AIRMAX: 5.4, MAXFALL: 15, FASTFALL: 20, SQUAT: 4, LAND: 4, LANDATK: 9, WALLL: 40, WALLR: 1240, BUFFER: 8 };
  const DIRS = { D: [1, 2, 3], F: [6, 3, 9], B: [4, 1, 7], U: [7, 8, 9] };

  // ---------- Controller: held state + press buffer + direction history (for motion inputs) ----------
  class Controller {
    constructor() { this.held = { l: 0, r: 0, u: 0, d: 0, blk: 0 }; this.buf = []; this.hist = [{ d: 5, f: 0 }]; this.frame = 0; this.dir = 5; this.prevHeld = {}; }
    press(b) { this.buf.push({ b, f: this.frame }); }
    has(b, win = K.BUFFER) { for (let i = this.buf.length - 1; i >= 0; i--) if (this.buf[i].b === b && this.frame - this.buf[i].f <= win) return i; return -1; }
    take(b, win) { const i = this.has(b, win); if (i >= 0) { this.buf.splice(i, 1); return true; } return false; }
    tick(face) {
      this.frame++;
      const h = this.held, fwd = face > 0 ? h.r : h.l, back = face > 0 ? h.l : h.r;
      const x = fwd && !back ? 1 : back && !fwd ? -1 : 0, y = h.u && !h.d ? 1 : h.d && !h.u ? -1 : 0;
      const d = 5 + x + y * 3; this.dir = d;
      if (d !== this.hist[this.hist.length - 1].d) this.hist.push({ d, f: this.frame });
      while (this.hist.length > 1 && this.frame - this.hist[1].f > 40) this.hist.shift();
      this.buf = this.buf.filter(e => this.frame - e.f <= 24);
      this.fresh = {}; for (const k in h) { this.fresh[k] = h[k] && !this.prevHeld[k]; this.prevHeld[k] = h[k]; }
    }
    // motion like ['D','F'] completed within `win` frames of now (relative to facing at tick time)
    motion(seq, win = 20) {
      let si = seq.length - 1;
      for (let i = this.hist.length - 1; i >= 0 && si >= 0; i--) {
        const e = this.hist[i]; if (this.frame - e.f > win) break;
        if (DIRS[seq[si]].includes(e.d)) si--;
      }
      return si < 0;
    }
    // double tap forward/back: F, (neutral), F within 14 frames
    dtap(tok) { const h = this.hist, n = h.length; if (n < 3) return false; const a = h[n - 3], b = h[n - 2], c = h[n - 1];
      return c.f === this.frame && DIRS[tok].includes(c.d) && c.d !== 3 && c.d !== 1 && b.d === 5 && DIRS[tok].includes(a.d) && c.f - a.f < 14; }
  }
  G.Controller = Controller;

  let UID = 1;
  class Fighter {
    constructor(ch, side, isBot) {
      this.ch = ch; this.side = side; this.isBot = isBot; this.id = UID++;
      this.ctrl = new Controller(); this.sp = G.SPECIALS[ch.id] || {};
      this.reset(side === 0 ? 400 : 880);
      this.undyingUsed = false; this.rounds = 0;
    }
    reset(x) {
      Object.assign(this, { x, y: G.GROUND, vx: 0, vy: 0, face: this.side === 0 ? 1 : -1, onGround: true, hp: 100, kbp: 0, meter: this.meter || 0,
        state: 'idle', st: 0, move: null, hitstop: 0, stun: 0, invuln: 0, comboHits: 0, comboTaken: 0, djump: true, spin: 0, flashT: 0,
        status: {}, forced: null, dissolve: 0, mode: 'command', dieFace: 5, techWin: 0, pendingDI: null, lastHitBy: null, after: [], plat: null, dead: false, dash: 0 });
      this.ctrl.buf.length = 0;
    }
    get opp() { return this.g.fighters[1 - this.side]; }
    actionable() { return ['idle', 'walk', 'crouch', 'air', 'block', 'cblock', 'dash'].includes(this.state) && !this.forced && !this.status.possessed && !this.status.trapped; }
    isCrouching() { return ['crouch', 'cblock'].includes(this.state) || (this.state === 'blockstun' && this.cbs) || (this.move && this.move.def.crouch); }
    hurtbox() {
      if (this.state === 'knockdown' || this.state === 'ko') return [this.x - 50, this.y - 36, 100, 36];
      if (this.isCrouching()) return [this.x - 24, this.y - 92, 48, 92];
      if (!this.onGround) return [this.x - 21, this.y - 132, 42, 122];
      return [this.x - 22, this.y - 140, 44, 140];
    }
    hitboxOf(hb) { return [this.face > 0 ? this.x + hb[0] : this.x - hb[0] - hb[2], this.y + hb[1], hb[2], hb[3]]; }
    activeHitbox() {
      const m = this.move; if (!m || this.state !== 'attack') return null; const d = m.def;
      if (!d.hb || m.fr <= d.s || m.fr > d.s + d.a) return null;
      let hb = d.hb; if (this.ch.id === 'mathew' && this.mode === 'whip' && d.whipExt) hb = [hb[0], hb[1], hb[2] + d.whipExt, hb[3]];
      return this.hitboxOf(hb);
    }
    setState(s) { if (this.state !== s) { this.state = s; this.st = 0; } }

    // ---------- start moves ----------
    startMove(def, kind) {
      this.move = { def, fr: 0, kind, hits: new Set(), connected: false };
      this.setState('attack'); this.st = 0;
      if (def.start) def.start(this, this.g, this.move);
      if (!def.silent) G.sfx('whoosh', def.heavy ? 1 : 0.6);
      this.lastInfo = { name: def.name, s: def.s, a: def.a, r: def.r, dmg: def.dmg, adv: def.bs != null ? def.bs - def.r - def.a + 1 : null };
    }
    endMove() { const air = !this.onGround; this.move = null; this.setState(air ? 'air' : (this.ctrl.held.d ? 'crouch' : 'idle')); }
    tryAttack(allowNormals = true) {
      const c = this.ctrl, sp = this.sp, air = !this.onGround;
      if (c.has('ULT') >= 0 && this.meter >= 100 && sp.ult) { c.take('ULT'); this.g.startUltimate(this); return true; }
      const S = [['s4', ['D', 'D'], 'BK'], ['s1', ['D', 'F'], 'FP'], ['s2', ['B', 'F'], 'BP'], ['s3', ['D', 'B'], 'FK']];
      for (const [slot, seq, btn] of S) {
        const d = typeof sp[slot] === 'function' ? sp[slot](this) : sp[slot];
        if (d && c.has(btn) >= 0 && c.motion(seq) && (!air || d.air !== false)) {
          if (d.cost && this.meter < d.cost) continue;
          c.take(btn); if (d.cost) this.meter -= d.cost; this.startMove(d, 'special'); return true;
        }
      }
      if (!allowNormals) return false;
      if (c.has('TH') >= 0 && !air) { c.take('TH'); this.startMove(G.NORMALS.TH, 'normal'); return true; }
      for (const b of ['FP', 'BP', 'FK', 'BK']) {
        if (c.has(b) >= 0) { c.take(b); const key = air ? 'j' + b : (c.held.d ? 'd' + b : b); const n = Object.assign({}, G.NORMALS[key]); n.key = key; if (key[0] === 'd') n.crouch = true; if (!air && this.ch.id === 'mathew' && this.mode === 'whip' && (b === 'FP' || b === 'BP')) { n.whipExt = 70; n.name = 'Whip ' + n.name; }
          this.startMove(n, 'normal'); return true; }
      }
      return false;
    }
    // cancel window: on hit/block during active or first 8 recovery frames -> chain normals / any special
    tryCancel() {
      const m = this.move; if (!m || !m.connected || m.kind !== 'normal') return;
      const d = m.def; if (m.fr < d.s || m.fr > d.s + d.a + 8) return;
      if (this.tryAttack(false)) { this.g.cancelFlash(this); return; }
      const key = d.key || ''; const pre = key[0] === 'd' ? 'd' : key[0] === 'j' ? 'j' : '';
      for (const b of ['FP', 'BP', 'FK', 'BK']) {
        const nk = pre + b; if ((d.chain || []).includes(nk) || (d.chain || []).includes(b) && !pre) {
          if (this.ctrl.has(b) >= 0) { this.ctrl.take(b); const n = Object.assign({}, G.NORMALS[nk]); n.key = nk; if (pre === 'd') n.crouch = true; this.startMove(n, 'normal'); return; }
        }
      }
    }

    // ---------- per-frame update ----------
    update(g) {
      this.g = g; const c = this.ctrl;
      if (this.flashT > 0) this.flashT--;
      if (this.hitstop > 0) { // SDI: each fresh direction during hitstop nudges position
        this.hitstop--;
        if (this.inHitstun() && c.hist.length && c.hist[c.hist.length - 1].f === c.frame && c.dir !== 5) {
          const dx = [0, -1, 0, 1, -1, 0, 1, -1, 0, 1][c.dir] * this.face, dy = c.dir >= 7 ? -1 : c.dir <= 3 ? 1 : 0;
          this.x += dx * 6; if (!this.onGround) this.y += dy * 5; this.sdi = (this.sdi || 0) + 1;
        }
        return;
      }
      this.st++; if (this.invuln > 0) this.invuln--;
      for (const k in this.status) { if (typeof this.status[k] === 'number' && this.status[k] > 0) { this.status[k]--; if (this.status[k] === 0) delete this.status[k]; } }
      if (this.sp.passive) this.sp.passive(this, g);
      if (this.pendingDI) this.applyDI();
      if (c.fresh && c.fresh.blk) this.techWin = 10; else if (this.techWin > 0) this.techWin--;

      if (this.forced) { const fo = this.forced; fo.t++; fo.fn(this, g, fo.t); if (fo.t >= fo.len && this.forced === fo) { this.forced = null; if (this.state === 'forced') this.setState(this.onGround ? 'idle' : 'air'); } this.physics(g, true); return; }
      if (this.status.possessed) this.possessedTick(g);

      const o = this.opp;
      switch (this.state) {
        case 'idle': case 'walk': case 'crouch': case 'block': case 'cblock': case 'dash': this.groundCtl(g, o); break;
        case 'jumpsquat': if (this.st >= K.SQUAT) { this.vy = c.held.u ? K.JUMP : K.JUMP * 0.75; this.vx = (c.held.r - c.held.l) * 4.6; this.onGround = false; this.plat = null; this.setState('air'); G.FX.dust(this.x, this.y, 4, 0.6); G.sfx('jump'); } break;
        case 'air': this.airCtl(g); break;
        case 'land': if (this.st >= this.landLag) this.setState('idle'); break;
        case 'attack': this.runMove(g); break;
        case 'hitstun': if (this.st >= this.stun) { this.setState(this.onGround ? 'idle' : 'air'); this.comboHits = 0; } break;
        case 'blockstun': if (this.st >= this.stun) this.setState(this.cbs ? 'cblock' : 'block'); break;
        case 'launch': this.spin += this.vx * 0.012 * this.face + 0.18; if (this.st >= this.stun && this.vy > -2) { this.setState('air'); this.spin = 0; this.comboHits = 0; } break;
        case 'knockdown': if (this.st >= 38) { this.setState('getup'); this.invuln = 18; } break;
        case 'getup': if (this.st >= 16) { this.setState('idle'); this.comboHits = 0; } break;
        case 'tech': this.vx = this.techDir * 6; if (this.st >= 16) { this.setState('idle'); this.vx = 0; this.comboHits = 0; } break;
        case 'summoning': break;
        case 'dizzy': case 'victory': case 'ko': case 'ultlock': break;
      }
      if (this.state === 'attack' || this.state === 'summoning') this.tryCancel();
      this.physics(g);
    }
    inHitstun() { return ['hitstun', 'launch'].includes(this.state); }

    groundCtl(g, o) {
      const c = this.ctrl, h = c.held;
      if (this.st === 0 || this.state !== 'dash') { if (o && Math.abs(o.x - this.x) > 4) this.face = o.x > this.x ? 1 : -1; }
      if (this.status.possessed) return;
      if (this.tryAttack()) return;
      if (this.state === 'dash') { this.vx = this.face * 10 * (1 - this.st / 16); if (this.st % 4 === 0) G.FX.dust(this.x - this.face * 14, this.y, 1, 0.5, -this.face); if (this.st >= 14) this.setState('idle'); return; }
      if (h.blk) { this.setState(h.d ? 'cblock' : 'block'); this.vx = 0; return; }
      if (h.u) { this.setState('jumpsquat'); this.vx = 0; return; }
      if (h.d) { this.setState('crouch'); this.vx = 0; return; }
      if (c.dtap('F')) { this.setState('dash'); G.FX.dust(this.x, this.y, 5, 0.8, -this.face); G.FX.speed(this.x, this.y - 60, this.face); G.sfx('whoosh'); return; }
      if (c.dtap('B')) { this.vx = -this.face * 9; this.invuln = 6; G.FX.dust(this.x, this.y, 4, 0.7, this.face); }
      const dx = h.r - h.l; const slow = this.status.slow ? 0.5 : 1;
      if (dx) { const fwd = dx === this.face; const sp = (fwd ? K.WALKF : K.WALKB) * slow; this.vx += (dx * sp - this.vx) * 0.5; this.setState('walk'); }
      else if (this.state === 'walk' || this.state === 'block' || this.state === 'cblock' || this.state === 'crouch') this.setState('idle');
    }
    airCtl(g) {
      const c = this.ctrl, h = c.held;
      if (this.tryAttack()) return;
      const dx = h.r - h.l; if (dx) this.vx = Math.max(-K.AIRMAX, Math.min(K.AIRMAX, this.vx + dx * K.AIRACC));
      if (c.fresh.u && this.djump && this.st > 3) { this.djump = false; this.vy = K.DJUMP; G.FX.ring(this.x, this.y, 50, 'rgba(255,255,255,0.8)', 4); G.sfx('jump'); }
      if (c.fresh.d && this.vy > -3) { this.vy = K.FASTFALL; this.fastfall = true; G.FX.star(this.x, this.y - 70, 14, '#fff'); }
    }
    runMove(g) {
      const m = this.move, d = m.def; m.fr++;
      if (d.lunge && m.fr === d.s) this.vx = this.face * d.lunge;
      if (d.frame) d.frame(this, g, m.fr, m);
      if (this.move !== m) return;
      if (!d.hold && m.fr >= d.s + d.a + d.r) this.endMove();
    }
    possessedTick(g) {
      const t = this.status.possessed; this.vx *= 0.5;
      if (t % 30 === 15 && this.state !== 'ko') { // hits itself
        this.setState('hitstun'); this.stun = 12; this.flashT = 4; this.hp -= 2.6; this.kbp += 3; G.FX.hitBurst(this.x + this.face * 10, this.y - 100, 0.5, -this.face, '#7dff5a', G.S.blood); G.sfx('hit', 0.6);
        G.FX.text(this.x, this.y - 170, 'SELF-HIT!', '#7dff5a', 22, 30); if (this.hp <= 0) this.g.onLethal(this, this.lastHitBy);
      }
    }

    // ---------- physics ----------
    physics(g, forced) {
      const st = g.stage; const grav = K.GRAV * (st.grav || 1) * (this.status.bubble ? 0.1 : 1);
      if (!this.onGround && !this.noGrav) { this.vy = Math.min(this.vy + grav, this.fastfall ? K.FASTFALL : K.MAXFALL); }
      const py = this.y; this.x += this.vx; this.y += this.vy;
      if (this.onGround) {
        const fr = this.state === 'launch' ? 0.9 : st.fric != null ? 1 - st.fric * 0.3 : (this.state === 'hitstun' || this.state === 'blockstun' ? 0.88 : 0.75);
        if (!(this.state === 'walk' || this.state === 'dash' || this.state === 'tech')) this.vx *= fr;
        if (this.plat) { const p = this.plat; if (this.x < p[0] || this.x > p[0] + p[2] || (this.ctrl.fresh.d && this.state !== 'attack')) { this.onGround = false; this.plat = null; if (this.actionable()) this.setState('air'); } }
      } else {
        // platforms (pass-through from below, drop with down)
        if (st.plats && this.vy > 0 && !this.ctrl.held.d) for (const p of st.plats) if (py <= p[1] && this.y >= p[1] && this.x > p[0] && this.x < p[0] + p[2]) { this.y = p[1]; this.land(g, p); break; }
        if (this.y >= G.GROUND) { this.y = G.GROUND; this.land(g, null); }
      }
      // walls (wall bounce / wall tech while launched)
      if (this.x < K.WALLL || this.x > K.WALLR) {
        const side = this.x < K.WALLL ? -1 : 1; this.x = side < 0 ? K.WALLL : K.WALLR;
        if (this.state === 'launch' && Math.abs(this.vx) > 6) {
          if (this.techWin > 0) { this.vx = -side * 3; this.vy = -8; this.setState('air'); this.spin = 0; this.invuln = 12; G.FX.text(this.x, this.y - 160, 'WALL TECH!', '#7ff3ff', 26); G.sfx('tech'); G.FX.ring(this.x, this.y - 70, 50, '#7ff3ff'); }
          else { const pow = Math.abs(this.vx) / 10; this.vx = -this.vx * 0.45; this.hp -= 2 + pow * 2; G.FX.dust(this.x, this.y - 70, 8, pow + 0.5, -side, G.FX.dustCol); G.FX.crack(this.x, this.y - 70, 1); G.FX.shake(6 + pow * 6, 12); G.sfx('heavy'); G.FX.text(this.x - side * 60, this.y - 180, 'WALL SPLAT!', '#ffd34d', 28); if (this.hp <= 0) g.onLethal(this, this.lastHitBy); }
        } else this.vx = 0;
      }
      // ceiling = the HUD. Smash into the UI (Animation-vs UI destruction)
      if (this.state === 'launch' && this.y - 140 < 96 && this.vy < -9) { g.hudImpact(this); this.vy = Math.abs(this.vy) * 0.35; this.y = 236; }
      if (this.y < -400) { this.y = -400; this.vy = Math.max(this.vy, 0); }
    }
    land(g, plat) {
      const vy = this.vy; this.onGround = true; this.plat = plat; this.vy = 0; this.djump = true; this.fastfall = false; this.noGrav = false;
      if (this.state === 'launch' || (this.state === 'hitstun' && vy > 4)) {
        if (this.techWin > 0 && this.state === 'launch') { this.setState('tech'); this.techDir = (this.ctrl.held.r - this.ctrl.held.l) || 0; this.invuln = 16; this.spin = 0; G.FX.text(this.x, this.y - 160, 'TECH!', '#7ff3ff', 28); G.sfx('tech'); G.FX.ring(this.x, this.y - 10, 60, '#7ff3ff'); G.FX.dust(this.x, this.y, 5, 0.6); }
        else { this.setState('knockdown'); this.spin = 0; const pow = Math.min(2.2, vy / 8 + Math.abs(this.vx) / 10); G.FX.landDust(this.x, this.y, pow + 0.6); G.FX.shake(4 + pow * 5, 10); G.sfx('land', 1 + pow); G.sfx('dust', pow);
          if (vy > 9) { this.vy = -vy * 0.32; this.onGround = false; this.state = 'launch'; this.stun = 999; this.bounced = (this.bounced || 0) + 1; if (this.bounced > 1) { this.vy = 0; this.onGround = true; this.state = 'knockdown'; this.st = 0; } } else this.bounced = 0; }
        if (this.state === 'knockdown') this.bounced = 0;
        return;
      }
      if (this.state === 'attack' && this.move && this.move.def.key && this.move.def.key[0] === 'j') { this.move = null; this.setState('land'); this.landLag = K.LANDATK; }
      else if (this.state === 'air' || this.state === 'attack' && !this.move.def.keepAir) { if (this.state === 'attack') { this.move = null; } this.setState('land'); this.landLag = K.LAND; }
      if (vy > 6) { G.FX.landDust(this.x, this.y, Math.min(1.6, vy / 12)); G.sfx('land', vy / 15); }
    }

    // DI: on leaving hitstop with a pending launch, held direction rotates launch angle up to 18°
    applyDI() {
      const L = this.pendingDI; this.pendingDI = null; const c = this.ctrl;
      const hx = c.held.r - c.held.l, hy = c.held.u - c.held.d; if (!hx && !hy) return;
      const sp = Math.hypot(this.vx, this.vy); if (sp < 1) return;
      const lx = this.vx / sp, ly = this.vy / sp, inx = hx, iny = -hy, il = Math.hypot(inx, iny);
      const cross = lx * (iny / il) - ly * (inx / il); const rot = cross * 18 * Math.PI / 180;
      const a = Math.atan2(this.vy, this.vx) + rot; this.vx = Math.cos(a) * sp; this.vy = Math.sin(a) * sp;
      if (Math.abs(cross) > 0.5) G.FX.text(this.x, this.y - 170, 'DI', '#9ad', 18, 20);
    }
  }
  G.Fighter = Fighter;

  // ---------- Hit resolution ----------
  // h: {dmg, hs, bs, push, kb, kbg, ang, lvl, heavy, launch, knockdown, spike, throw, unblockable, col, sfx}
  G.applyHit = function (att, def, h, g, srcX, srcY) {
    if (!def || def.invuln > 0 || def.state === 'ko' || def.dead) return 'miss';
    if (h.throw && (!def.onGround || def.inHitstun())) return 'miss';
    const dir = srcX != null ? (def.x >= srcX ? 1 : -1) : att.face;
    const cx = srcX != null ? (srcX + def.x) / 2 : def.x - dir * 16, cy = srcY != null ? srcY : def.y - 100;
    // Joldyne pattern-lock counter
    if (def.status.counter && att && !h.throw && !h.ult) { delete def.status.counter; G.FX.text(def.x, def.y - 180, 'PATTERN FOUND!', '#ffb347', 30); G.FX.flash(6, '#ffb347'); G.sfx('hoot');
      g.slowmo = 20; def.face = att.x > def.x ? 1 : -1; def.x = att.x - def.face * 70; G.applyHit(def, att, { dmg: 11, hs: 30, bs: 0, push: 10, kb: 14, kbg: 8, ang: 50, launch: true, heavy: true, unblockable: true, col: '#ffb347' }, g, def.x, def.y - 100); return 'counter'; }
    // crit on Lorenzo while summoning
    let crit = false; if (def.state === 'summoning' && !h.ult) { crit = true; g.endSummon(def); }
    const facingHit = (srcX == null) || (srcX - def.x) * def.face >= -20;
    const crouching = def.isCrouching();
    const blocking = (['block', 'cblock'].includes(def.state) || def.state === 'blockstun' || (def.actionable() && def.ctrl.held.blk && def.onGround)) && facingHit;
    const blocked = blocking && !crit && !h.throw && !h.unblockable && !(h.lvl === 'low' && !crouching) && !(h.lvl === 'ovh' && crouching);
    if (att && att.move) att.move.connected = true;
    if (blocked) {
      def.cbs = crouching; def.setState('blockstun'); def.stun = h.bs || 10; def.hp -= h.dmg * 0.1;
      def.vx = dir * (h.push || 5) * 0.9; if (att && (def.x <= K.WALLL + 2 || def.x >= K.WALLR - 2) && !h.proj) att.vx = -dir * (h.push || 5);
      const hs = 4 + Math.min(6, h.dmg * 0.3); def.hitstop = hs; if (att && !h.proj) att.hitstop = hs;
      def.meter = Math.min(100, def.meter + h.dmg * 0.5); if (att) att.meter = Math.min(100, att.meter + h.dmg * 0.3);
      def.blockFlash = 10; G.FX.sparks(cx, cy, -dir, 5, def.ch.glow, 7); G.FX.ring(cx, cy, 30, def.ch.glow, 3, 10); G.sfx('block');
      if (def.hp <= 0) def.hp = 0.5;
      return 'block';
    }
    // HIT
    def.comboHits++; if (att) att.comboCount = def.comboHits;
    const scale = h.noScale ? 1 : Math.max(0.35, 1 - 0.09 * (def.comboHits - 1));
    let dmg = h.dmg * scale * (crit ? 1.75 : 1) * (def.status.dmgDown ? 0.7 : 1);
    def.hp -= dmg; def.kbp += dmg * 1.35; def.lastHitBy = att; def.flashT = 4;
    def.meter = Math.min(100, def.meter + dmg * 0.6); if (att) att.meter = Math.min(100, att.meter + dmg * 1.0);
    if (def.move) { def.move = null; } if (def.forced && !h.keepForced) def.forced = null; if (def.state === 'summoning') g.endSummon(def);
    const kbMag = (h.kb || 4) + (h.kbg || 2) * def.kbp / 100 * 1.6;
    const airborne = !def.onGround;
    if (h.launch || h.knockdown || kbMag >= 13 || airborne || h.spike) {
      let ang = (h.ang != null ? h.ang : 45) * Math.PI / 180; const mag = h.knockdown && !h.launch ? Math.max(5, kbMag * 0.6) : Math.max(airborne ? 7 : 6, kbMag);
      def.vx = Math.cos(ang) * mag * dir; def.vy = -Math.sin(ang) * mag; if (h.spike && airborne) { def.vy = Math.abs(def.vy) + 6; }
      if (def.onGround && def.vy > -3) def.vy = -3;
      def.onGround = false; def.plat = null; def.setState('launch'); def.stun = Math.round((h.hs || 20) * 0.6 + mag * 1.2); def.pendingDI = true;
    } else {
      def.setState('hitstun'); def.stun = h.hs || 16; def.vx = dir * (h.push || 5);
      if (att && (def.x <= K.WALLL + 2 || def.x >= K.WALLR - 2) && !h.proj) att.vx = -dir * (h.push || 5) * 0.8;
    }
    def.hitLow = h.lvl === 'low';
    const hs = Math.min(20, 4 + Math.round(dmg * 0.55)) + (crit ? 6 : 0); def.hitstop = hs; if (att && !h.proj) att.hitstop = hs;
    const pow = Math.min(2.4, dmg / 7 + (h.heavy ? 0.5 : 0));
    G.FX.hitBurst(cx, cy, pow, dir, h.col || (att && att.ch.glow), G.S.blood);
    G.FX.shake(2 + pow * 4, 6 + pow * 4); G.sfx(h.heavy || dmg > 8 ? 'heavy' : 'hit', 0.6 + pow * 0.3); if (h.sfx) G.sfx(h.sfx);
    if (h.heavy || crit || dmg >= 9) { G.FX.impact(crit ? 5 : 3, cx, cy); }
    if (def.onGround === false && def.y > G.GROUND - 30) G.FX.dust(def.x, G.GROUND, 5, pow);
    if (crit) { G.FX.text(def.x, def.y - 190, 'CRITICAL!', '#ff3b3b', 40); G.FX.flash(5, '#ff3b3b'); }
    if (def.comboHits >= 3 && att && !h.ult && !h.proj) G.FX.text(cx, cy - 70, def.comboHits + ' HIT COMBO', '#ffd34d', 26 + Math.min(14, def.comboHits * 2), 40);
    G.hype = 40;
    if (h.onHit) h.onHit(att, def, g);
    if (def.hp <= 0) g.onLethal(def, att);
    return 'hit';
  };
})();
