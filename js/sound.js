// js/sound.js - High Dopamine Web Audio Synthesizer & Haptics Engine (Extreme Dopamine Edition)

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.soundEnabled = true;
    this.bgmEnabled = false;
    this.hapticsEnabled = true;
    this.bgmInterval = null;
    this.bgmStep = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- Haptics (Vibration API) ---
  vibrate(pattern) {
    if (!this.hapticsEnabled || !navigator.vibrate) return;
    try {
      navigator.vibrate(pattern);
    } catch (e) {}
  }

  vibrateLight() { this.vibrate(12); }
  vibrateMedium() { this.vibrate(35); }
  vibrateHeavy() { this.vibrate([40, 30, 80]); }
  vibrateJackpot() { this.vibrate([50, 40, 50, 40, 80, 50, 200]); }
  vibrateFreeze() { this.vibrate([15, 600, 100, 50, 250]); }

  // 1. UI Tap
  playTap() {
    this.vibrateLight();
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  // 2. Coin / Gem Get
  playCoin() {
    this.vibrateMedium();
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const notes = [987.77, 1318.51, 1567.98, 2093.00];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = this.ctx.currentTime + idx * 0.04;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.15);
    });
  }

  // 3. Task Shatter / Crush
  playShatter() {
    this.vibrateHeavy();
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);

    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    noise.start();
    noise.stop(this.ctx.currentTime + 0.15);
  }

  // 4. Attack Slash
  playAttack() {
    this.vibrateLight();
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  // 5. Critical Strike
  playCritical() {
    this.vibrateHeavy();
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(2400, this.ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(1800, this.ctx.currentTime + 0.3);

    gain1.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start();
    osc1.stop(this.ctx.currentTime + 0.3);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.25);

    gain2.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start();
    osc2.stop(this.ctx.currentTime + 0.25);
  }

  // 6. Giant Explosion (Boss Defeat)
  playExplosion() {
    this.vibrateJackpot();
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * 0.6;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.2));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.5);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.6);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
    noise.stop(this.ctx.currentTime + 0.6);
  }

  // 7. Gacha Tension Drumroll (Buildup)
  playGachaBuildup() {
    this.vibrateMedium();
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    for (let i = 0; i < 18; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime + i * 0.06;
      const freq = 180 + i * 45;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.1 + (i / 18) * 0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.05);
    }
  }

  // 8. Gacha Step-Up Alert (Blue -> Yellow -> Red -> Rainbow)
  playStepUp(level = 1) {
    this.vibrateMedium();
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const freqs = [523.25, 659.25, 880.00, 1174.66, 1760.00];
    const freq = freqs[Math.min(level - 1, freqs.length - 1)];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, this.ctx.currentTime + 0.14);

    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.14);
  }

  // 9. Extreme Pachinko Kyuin-Kyuin Sound (キュインキュインキュイン！！)
  playKyuin() {
    this.vibrateJackpot();
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    // Fast ascending chirp sirens (Kyuin-Kyuin!)
    for (let chirp = 0; chirp < 5; chirp++) {
      const startTime = this.ctx.currentTime + chirp * 0.12;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, startTime);
      osc.frequency.exponentialRampToValueAtTime(3200, startTime + 0.08);

      gain.gain.setValueAtTime(0.4, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.1);
    }
  }

  // 10. Heavy Lever-On Impact (レバーオン激熱音)
  playLeverOn() {
    this.vibrateHeavy();
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(250, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);

    // Spark chime
    const chime = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();
    chime.type = 'sine';
    chime.frequency.setValueAtTime(2800, this.ctx.currentTime);
    chime.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 0.2);

    chimeGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    chimeGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

    chime.connect(chimeGain);
    chimeGain.connect(this.ctx.destination);
    chime.start();
    chime.stop(this.ctx.currentTime + 0.2);
  }

  // 11. Shoukaku Rank-Up Freeze (昇格フリーズ音: まだまだァッ！)
  playShoukaku() {
    this.vibrateJackpot();
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    // Glass shatter + Power chord
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  // 12. Card Flip Reveal
  playCardFlip(isRare = false) {
    if (isRare) this.vibrateHeavy();
    else this.vibrateLight();

    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = isRare ? 'square' : 'sine';
    osc.frequency.setValueAtTime(isRare ? 1200 : 700, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(isRare ? 2400 : 1200, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(isRare ? 0.25 : 0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  // 13. Jackpot Fanfare (Rainbow / SSR / UR Reveal)
  playRainbowFanfare() {
    this.vibrateJackpot();
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const chords = [
      [523.25, 659.25, 783.99],
      [587.33, 739.99, 880.00],
      [659.25, 830.61, 987.77],
      [783.99, 987.77, 1174.66],
      [1046.50, 1318.51, 1567.98, 2093.00]
    ];

    chords.forEach((chord, step) => {
      const t = this.ctx.currentTime + step * 0.12;
      const dur = step === chords.length - 1 ? 0.8 : 0.15;

      chord.forEach(freq => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + dur);
      });
    });
  }

  // 14. FEVER Mode On
  playFever() {
    this.vibrateJackpot();
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const freqs = [440, 554.37, 659.25, 880, 1108.73, 1318.51, 1760];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime + idx * 0.05;

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);
    });
  }

  // 15. Upgrade Jingle
  playUpgrade() {
    this.vibrateMedium();
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const freqs = [523.25, 659.25, 783.99, 1046.50];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime + idx * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  // 16. BGM Loop
  toggleBgm() {
    this.bgmEnabled = !this.bgmEnabled;
    if (this.bgmEnabled) {
      this.startBgm();
    } else {
      this.stopBgm();
    }
    return this.bgmEnabled;
  }

  startBgm() {
    this.init();
    if (!this.ctx) return;
    this.stopBgm();

    const bpm = 130;
    const stepTime = 60 / bpm / 2;
    const bassline = [110, 110, 130.81, 110, 146.83, 110, 164.81, 130.81];
    const leadNotes = [440, 0, 523.25, 659.25, 0, 783.99, 659.25, 523.25];

    this.bgmStep = 0;
    this.bgmInterval = setInterval(() => {
      if (!this.bgmEnabled || !this.ctx) return;

      const t = this.ctx.currentTime;
      const bassFreq = bassline[this.bgmStep % bassline.length];
      const leadFreq = leadNotes[this.bgmStep % leadNotes.length];

      if (bassFreq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(bassFreq / 2, t);

        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + stepTime * 0.9);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + stepTime * 0.9);
      }

      if (leadFreq > 0) {
        const oscLead = this.ctx.createOscillator();
        const gainLead = this.ctx.createGain();
        oscLead.type = 'square';
        oscLead.frequency.setValueAtTime(leadFreq, t);

        gainLead.gain.setValueAtTime(0.04, t);
        gainLead.gain.exponentialRampToValueAtTime(0.001, t + stepTime * 0.8);

        oscLead.connect(gainLead);
        gainLead.connect(this.ctx.destination);
        oscLead.start(t);
        oscLead.stop(t + stepTime * 0.8);
      }

      this.bgmStep++;
    }, stepTime * 1000);
  }

  stopBgm() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
  // 17. Reward Roulette Tick (カチカチ音)
  playRouletteTick() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }

  // 18. Jackpot Hit (大当り確定音)
  playJackpotHit() {
    this.vibrateJackpot();
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    // Rising power chord
    const freqSets = [523.25, 659.25, 783.99, 1046.50, 1318.51, 2093.00];
    freqSets.forEach((f, i) => {
      const t = this.ctx.currentTime + i * 0.055;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = i < 3 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.35);
    });
  }

  // 19. Lever pull down sound (ガチャレバー引き音)
  playLeverPull() {
    this.vibrateHeavy();
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    // Mechanical clunk descend
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.45, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);

    // Mechanical noise burst
    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.2, this.ctx.currentTime);
    ng.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
    noise.connect(ng);
    ng.connect(this.ctx.destination);
    noise.start();
    noise.stop(this.ctx.currentTime + 0.1);
  }

  // 20. Slot spin spinning (スロット回転音)
  playSlotSpin() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(200, this.ctx.currentTime + 0.6);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.6);
  }
}

export const sound = new SoundEngine();
