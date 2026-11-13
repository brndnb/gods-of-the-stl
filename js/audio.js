// ===== Global namespace, settings, procedural music, SFX, announcer =====
window.G = window.G || {};
(function () {
  const DEF = { lobbyVol: 60, gameVol: 55, sfxVol: 80, voice: true, blood: false, boxes: false, diff: 3 };
  function load(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  G.load = load; G.save = save;
  G.S = Object.assign({}, DEF, load('stl_settings', {}));
  G.saveSettings = () => save('stl_settings', G.S);

  let ac = null, master, musicBus, sfxBus, noiseBuf, verb;
  G.audioInit = function () {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); master.gain.value = 0.9;
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    master.connect(comp); comp.connect(ac.destination);
    musicBus = ac.createGain(); musicBus.connect(master);
    sfxBus = ac.createGain(); sfxBus.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 1.5, ac.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // simple feedback-delay "reverb" send
    verb = ac.createDelay(); verb.delayTime.value = 0.23;
    const fb = ac.createGain(); fb.gain.value = 0.35; const vf = ac.createBiquadFilter(); vf.type = 'lowpass'; vf.frequency.value = 2500;
    verb.connect(vf); vf.connect(fb); fb.connect(verb); vf.connect(musicBus);
    G.applyVolumes();
    setInterval(scheduler, 25);
  };
  G.applyVolumes = function () {
    if (!ac) return;
    const mv = (song === 'game' ? G.S.gameVol : G.S.lobbyVol) / 100;
    musicBus.gain.setTargetAtTime(mv * 0.55, ac.currentTime, 0.05);
    sfxBus.gain.setTargetAtTime(G.S.sfxVol / 100, ac.currentTime, 0.02);
  };

  // ---------- instrument primitives ----------
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  function env(g, t, a, peak, dcy, sus, rel, len) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a);
    g.gain.exponentialRampToValueAtTime(Math.max(peak * sus, 0.0001), t + a + dcy);
    g.gain.setValueAtTime(Math.max(peak * sus, 0.0001), t + Math.max(len, a + dcy));
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(len, a + dcy) + rel);
  }
  function osc(type, f, t, len, vol, bus, opts = {}) {
    const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (opts.slide) o.frequency.exponentialRampToValueAtTime(opts.slide, t + (opts.slideT || len));
    if (opts.detune) o.detune.value = opts.detune;
    const g = ac.createGain(); env(g, t, opts.a || 0.005, vol, opts.d || 0.1, opts.s == null ? 0.6 : opts.s, opts.r || 0.08, len);
    let node = o;
    if (opts.lp) { const f2 = ac.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.setValueAtTime(opts.lp, t); if (opts.lpTo) f2.frequency.exponentialRampToValueAtTime(opts.lpTo, t + len); f2.Q.value = opts.q || 1; o.connect(f2); node = f2; }
    node.connect(g); g.connect(bus || musicBus);
    if (opts.verb) { const s = ac.createGain(); s.gain.value = opts.verb; g.connect(s); s.connect(verb); }
    o.start(t); o.stop(t + len + (opts.r || 0.08) + 0.05);
    return o;
  }
  function noise(t, len, vol, bus, type, freq, q, opts = {}) {
    const s = ac.createBufferSource(); s.buffer = noiseBuf; s.playbackRate.value = opts.rate || 1;
    const f = ac.createBiquadFilter(); f.type = type || 'highpass'; f.frequency.setValueAtTime(freq || 6000, t); f.Q.value = q || 0.7;
    if (opts.fTo) f.frequency.exponentialRampToValueAtTime(opts.fTo, t + len);
    const g = ac.createGain(); env(g, t, opts.a || 0.002, vol, opts.d || len * 0.5, opts.s == null ? 0.3 : opts.s, opts.r || 0.05, len);
    s.connect(f); f.connect(g); g.connect(bus || musicBus);
    s.start(t, Math.random() * 0.5); s.stop(t + len + 0.2);
  }
  const kick = (t, v = 1, bus) => { osc('sine', 160, t, 0.16, 0.9 * v, bus, { slide: 38, slideT: 0.14, d: 0.12, s: 0.2, r: 0.05 }); };
  const snare = (t, v = 1, bus) => { noise(t, 0.14, 0.45 * v, bus, 'bandpass', 1800, 0.8); osc('triangle', 200, t, 0.08, 0.35 * v, bus, { slide: 120, s: 0.1 }); };
  const hat = (t, v = 1, bus, open) => noise(t, open ? 0.18 : 0.04, 0.16 * v, bus, 'highpass', 8000, 0.5);

  // ---------- songs (original compositions) ----------
  // Lobby: "Genesis of The STL" — 96 BPM, A minor, i–VI–III–VII
  const LOBBY = {
    bpm: 96,
    chords: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]],
    mel: [76, -1, 74, 72, 71, -1, 72, -1, 69, -1, -1, 67, 69, -1, 72, -1, 72, -1, 71, 69, 67, -1, 64, -1, 67, -1, 69, -1, 71, -1, 74, -1],
    step(i, t, sd) {
      const bar = Math.floor(i / 16) % 4, s = i % 16, ch = this.chords[bar];
      if (s === 0) ch.forEach((n, k) => { osc('sawtooth', mtof(n), t, sd * 15, 0.06, null, { a: 0.4, d: 0.5, s: 0.8, r: 0.8, lp: 900, detune: k * 6 - 6, verb: 0.3 }); osc('sawtooth', mtof(n), t, sd * 15, 0.05, null, { a: 0.4, d: 0.5, s: 0.8, r: 0.8, lp: 700, detune: 9 }); });
      if (s === 0) osc('sine', mtof(ch[0] - 24), t, sd * 14, 0.35, null, { a: 0.02, d: 0.3, s: 0.7, r: 0.3 });
      const arp = [0, 1, 2, 1, 2, 0, 1, 2]; const n = ch[arp[s % 8]] + 12 + (s >= 8 ? 12 : 0);
      osc('triangle', mtof(n), t, sd * 0.5, 0.09, null, { d: 0.12, s: 0.2, r: 0.1, verb: 0.45 });
      if (s % 8 === 0) kick(t, 0.55); if (s % 8 === 4) snare(t, 0.35); if (s % 2 === 1) hat(t, 0.5);
      const phrase = Math.floor(i / 64) % 2;
      if (phrase === 1 || i % 128 >= 32) { const m = this.mel[(i / 2 | 0) % 32]; if (i % 2 === 0 && m > 0) osc('sine', mtof(m), t, sd * 1.6, 0.13, null, { a: 0.01, d: 0.3, s: 0.4, r: 0.4, verb: 0.6 }); }
    }
  };
  // Fight: "Divine Collision" — 152 BPM, D minor, driving
  const FIGHT = {
    bpm: 152,
    roots: [38, 34, 36, 33], // D Bb C A
    lead: [74, 74, 77, 74, 72, 74, -1, 69, 70, -1, 69, 67, 69, -1, 65, 67, 74, 74, 77, 79, 81, -1, 79, 77, 76, -1, 77, 76, 73, -1, 69, -1],
    step(i, t, sd) {
      const bar = Math.floor(i / 16) % 4, s = i % 16, r = this.roots[bar];
      const sect = Math.floor(i / 64) % 4; // 0 intro-ish, 1-3 full
      if (s % 4 === 0) kick(t, 1); if (s === 10 && sect > 0) kick(t, 0.7);
      if (s % 8 === 4) snare(t, 1); if (s === 15 && bar === 3) snare(t, 0.6);
      hat(t, s % 4 === 2 ? 0.9 : 0.45, null, s % 8 === 6);
      const bn = r + (s % 4 === 2 ? 12 : 0) + (s === 14 ? 7 : 0);
      if (s % 2 === 0 || sect > 1) osc('sawtooth', mtof(bn), t, sd * 0.8, 0.22, null, { d: 0.08, s: 0.4, r: 0.04, lp: 1600, lpTo: 300, q: 6 });
      if (s === 0) [0, 3, 7].forEach((k, j) => osc('square', mtof(r + 24 + k + (k === 3 && bar >= 2 ? 1 : 0)), t, sd * 7, 0.035, null, { a: 0.01, d: 0.4, s: 0.5, lp: 2400, verb: 0.2, detune: j * 4 }));
      if (sect > 0 && i % 2 === 0) { const m = this.lead[(i / 2 | 0) % 32]; if (m > 0) osc('square', mtof(m), t, sd * 1.7, 0.07, null, { a: 0.005, d: 0.2, s: 0.6, r: 0.06, lp: 3200, verb: 0.25 }); }
      if (sect === 3 && s % 2 === 1) osc('triangle', mtof(r + 36 + [0, 7, 12, 7][(s >> 1) % 4]), t, sd * 0.4, 0.05, null, { s: 0.2 });
    }
  };
  let song = null, songObj = null, stepI = 0, nextT = 0;
  function scheduler() {
    if (!ac || !songObj) return;
    const sd = 60 / songObj.bpm / 4;
    while (nextT < ac.currentTime + 0.12) { try { songObj.step(stepI, nextT, sd); } catch (e) {} stepI++; nextT += sd; }
  }
  G.music = function (name) {
    if (!ac || song === name) return;
    song = name; songObj = name === 'lobby' ? LOBBY : name === 'game' ? FIGHT : null;
    stepI = 0; nextT = ac.currentTime + 0.08;
    musicBus.gain.cancelScheduledValues(ac.currentTime); musicBus.gain.setValueAtTime(0, ac.currentTime);
    G.applyVolumes();
  };

  // ---------- sound effects ----------
  G.sfx = function (name, p = 1) {
    if (!ac) return; const t = ac.currentTime, B = sfxBus;
    switch (name) {
      case 'hit': kick(t, 0.6 * p, B); noise(t, 0.08 + 0.05 * p, 0.6 * p, B, 'bandpass', 1200 + 800 * p, 1); osc('square', 90, t, 0.06, 0.25 * p, B, { slide: 40 }); break;
      case 'heavy': kick(t, 1.2, B); noise(t, 0.3, 0.8, B, 'lowpass', 3000, 1, { fTo: 300 }); osc('sawtooth', 70, t, 0.25, 0.4, B, { slide: 30, lp: 600 }); break;
      case 'block': osc('square', 1400, t, 0.04, 0.2, B, { slide: 900 }); noise(t, 0.06, 0.3, B, 'bandpass', 4000, 3); break;
      case 'whoosh': noise(t, 0.16, 0.18 * p, B, 'bandpass', 600, 2, { fTo: 2500, a: 0.04 }); break;
      case 'land': kick(t, 0.4 * p, B); noise(t, 0.2, 0.25 * p, B, 'lowpass', 800, 1); break;
      case 'dust': noise(t, 0.35, 0.3 * p, B, 'lowpass', 1200, 0.8, { fTo: 200, a: 0.01 }); break;
      case 'jump': osc('sine', 300, t, 0.1, 0.12, B, { slide: 600 }); break;
      case 'select': osc('square', 660, t, 0.06, 0.12, B); osc('square', 990, t + 0.06, 0.1, 0.12, B); break;
      case 'hover': osc('triangle', 1200, t, 0.03, 0.08, B); break;
      case 'confirm': [523, 659, 784, 1046].forEach((f, k) => osc('square', f, t + k * 0.05, 0.12, 0.1, B, { lp: 3000 })); break;
      case 'boom': kick(t, 1.5, B); noise(t, 1.2, 0.5, B, 'lowpass', 900, 1, { fTo: 60, d: 0.6 }); osc('sine', 55, t, 1.0, 0.6, B, { slide: 30, d: 0.6, s: 0.4 }); break;
      case 'ko': G.sfx('boom'); osc('sawtooth', 220, t, 1.4, 0.2, B, { slide: 55, lp: 1200 }); break;
      case 'beam': osc('sawtooth', 180, t, 0.6 * p, 0.18, B, { slide: 900, lp: 2500, d: 0.3, s: 0.8 }); noise(t, 0.6 * p, 0.2, B, 'bandpass', 2000, 2); break;
      case 'zap': noise(t, 0.25, 0.4, B, 'highpass', 2500, 1); osc('square', 1800, t, 0.2, 0.15, B, { slide: 200 }); break;
      case 'splash': noise(t, 0.5, 0.45 * p, B, 'bandpass', 900, 0.6, { fTo: 300 }); break;
      case 'roar': osc('sawtooth', 120, t, 0.6, 0.35, B, { slide: 70, lp: 900, q: 4 }); noise(t, 0.6, 0.3, B, 'bandpass', 500, 2); break;
      case 'screech': osc('sawtooth', 1500, t, 0.35, 0.18, B, { slide: 2600, lp: 4000 }); break;
      case 'hoot': osc('sine', 520, t, 0.15, 0.25, B, { slide: 440 }); osc('sine', 500, t + 0.22, 0.25, 0.25, B, { slide: 400 }); break;
      case 'dice': for (let k = 0; k < 5; k++) osc('square', 1800 + Math.random() * 900, t + k * 0.04, 0.02, 0.1, B); break;
      case 'card': noise(t, 0.05, 0.25, B, 'highpass', 5000, 1); break;
      case 'charge': osc('sawtooth', 100, t, 1.2, 0.18, B, { slide: 1200, lp: 1800, a: 0.2 }); break;
      case 'ult': G.sfx('charge'); osc('square', 220, t + 0.9, 0.6, 0.2, B, { slide: 880 }); kick(t + 1.0, 1.4, B); break;
      case 'crack': noise(t, 0.12, 0.6, B, 'highpass', 3000, 1); osc('square', 2400, t, 0.05, 0.15, B, { slide: 800 }); noise(t + 0.05, 0.3, 0.3, B, 'bandpass', 5000, 4); break;
      case 'glitch': for (let k = 0; k < 10; k++) osc('square', 80 + Math.random() * 2000, t + k * 0.035, 0.03, 0.14, B, { s: 1 }); noise(t, 0.4, 0.2, B, 'bandpass', 3000, 8); break;
      case 'corrupt':
        for (let k = 0; k < 28; k++) { const tt = t + k * 0.045; osc(k % 2 ? 'square' : 'sawtooth', 40 + Math.random() * 3000, tt, 0.04, 0.16, B, { s: 1 }); if (k % 3 === 0) noise(tt, 0.05, 0.4, B, 'bandpass', 200 + Math.random() * 6000, 10); }
        osc('sawtooth', 60, t, 1.4, 0.3, B, { slide: 20, lp: 500 }); break;
      case 'error': osc('square', 440, t, 0.15, 0.15, B); osc('square', 330, t + 0.17, 0.25, 0.15, B); break;
      case 'tick': osc('square', 2000, t, 0.01, 0.05, B); break;
      case 'tech': osc('triangle', 900, t, 0.06, 0.18, B, { slide: 1600 }); noise(t, 0.06, 0.2, B, 'highpass', 6000); break;
      case 'possess': osc('sine', 200, t, 0.8, 0.25, B, { slide: 90, lp: 800 }); noise(t, 0.6, 0.2, B, 'bandpass', 700, 3, { fTo: 3000 }); break;
      case 'thunder': kick(t, 1.3, B); noise(t, 1.0, 0.7, B, 'lowpass', 2500, 0.8, { fTo: 100, d: 0.5 }); break;
      case 'rewind': osc('sawtooth', 800, t, 0.5, 0.15, B, { slide: 100, lp: 2000 }); break;
    }
  };

  // ---------- announcer ----------
  let voice = null;
  function pickVoice() {
    if (!('speechSynthesis' in window)) return;
    const vs = speechSynthesis.getVoices(); if (!vs.length) return;
    const pref = ['Google UK English Male', 'Microsoft David', 'Daniel', 'Microsoft Mark', 'Microsoft Guy', 'Alex', 'Fred'];
    for (const p of pref) { const v = vs.find(v => v.name.includes(p)); if (v) { voice = v; return; } }
    voice = vs.find(v => /en/i.test(v.lang) && /male/i.test(v.name)) || vs.find(v => /en/i.test(v.lang)) || vs[0];
  }
  if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  G.say = function (text, opts = {}) {
    if (!G.S.voice || !('speechSynthesis' in window)) return;
    if (opts.cut !== false) speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.pitch = opts.pitch != null ? opts.pitch : 0.35; u.rate = opts.rate || 0.82; u.volume = Math.min(1, G.S.sfxVol / 100 + 0.3);
    speechSynthesis.speak(u);
    if (opts.boom !== false) G.sfx('boom');
  };
})();
