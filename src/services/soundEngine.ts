// Web Audio API ambient sound generator engine
// Generates realistic, perpetual, zero-bandwidth ambient soundscapes

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private soundNodes: Map<string, { gain: GainNode; stop: () => void }> = new Map();
  private isMuted: boolean = false;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMasterVolume(vol: number) {
    this.initContext();
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : vol, this.ctx.currentTime, 0.05);
    }
  }

  public toggleMute(muted: boolean) {
    this.isMuted = muted;
    this.initContext();
    if (this.masterGain && this.ctx) {
      const current = this.isMuted ? 0 : 0.8;
      this.masterGain.gain.setTargetAtTime(current, this.ctx.currentTime, 0.05);
    }
  }

  public setSoundVolume(type: string, volume: number) {
    const node = this.soundNodes.get(type);
    if (node && this.ctx) {
      node.gain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.05);
    }
  }

  public playSound(type: string, volume: number = 0.5) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    if (this.soundNodes.has(type)) {
      this.setSoundVolume(type, volume);
      return;
    }

    const soundGain = this.ctx.createGain();
    soundGain.gain.setValueAtTime(volume, this.ctx.currentTime);
    soundGain.connect(this.masterGain);

    let stopFn: () => void = () => {};

    switch (type) {
      case 'rain':
        stopFn = this.createRain(soundGain);
        break;
      case 'fire':
        stopFn = this.createFire(soundGain);
        break;
      case 'waves':
        stopFn = this.createWaves(soundGain);
        break;
      case 'birds':
        stopFn = this.createBirds(soundGain);
        break;
      case 'cafe':
        stopFn = this.createCafe(soundGain);
        break;
      case 'keyboard':
        stopFn = this.createKeyboard(soundGain);
        break;
      case 'whitenoise':
        stopFn = this.createWhiteNoise(soundGain);
        break;
      case 'lofi':
        stopFn = this.createLofiDrone(soundGain);
        break;
    }

    this.soundNodes.set(type, { gain: soundGain, stop: stopFn });
  }

  public stopSound(type: string) {
    const item = this.soundNodes.get(type);
    if (item) {
      item.stop();
      this.soundNodes.delete(type);
    }
  }

  public stopAll() {
    this.soundNodes.forEach((item) => item.stop());
    this.soundNodes.clear();
  }

  // --- Chime Alert for Pomodoro Completion ---
  public playChime() {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.15);

      gain.gain.setValueAtTime(0, this.ctx.currentTime + idx * 0.15);
      gain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + idx * 0.15 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.15 + 1.8);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(this.ctx.currentTime + idx * 0.15);
      osc.stop(this.ctx.currentTime + idx * 0.15 + 2);
    });
  }

  // --- Sound Synthesizers ---
  private createNoiseBuffer(duration = 5): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private createRain(dest: GainNode): () => void {
    if (!this.ctx) return () => {};
    const noiseBuffer = this.createNoiseBuffer(5);
    if (!noiseBuffer) return () => {};

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, this.ctx.currentTime);

    const highpass = this.ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(200, this.ctx.currentTime);

    noiseSource.connect(highpass);
    highpass.connect(filter);
    filter.connect(dest);

    noiseSource.start();

    return () => {
      try {
        noiseSource.stop();
        noiseSource.disconnect();
      } catch {}
    };
  }

  private createWaves(dest: GainNode): () => void {
    if (!this.ctx) return () => {};
    const noiseBuffer = this.createNoiseBuffer(5);
    if (!noiseBuffer) return () => {};

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, this.ctx.currentTime);

    const waveGain = this.ctx.createGain();

    // LFO to create ebb and flow of waves
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // ~8 second wave cycle
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(0.4, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(waveGain.gain);

    noise.connect(filter);
    filter.connect(waveGain);
    waveGain.connect(dest);

    noise.start();
    lfo.start();

    return () => {
      try {
        noise.stop();
        lfo.stop();
      } catch {}
    };
  }

  private createFire(dest: GainNode): () => void {
    if (!this.ctx) return () => {};
    // Base flame roar
    const noiseBuffer = this.createNoiseBuffer(3);
    if (!noiseBuffer) return () => {};

    const baseNoise = this.ctx.createBufferSource();
    baseNoise.buffer = noiseBuffer;
    baseNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, this.ctx.currentTime);

    baseNoise.connect(filter);
    filter.connect(dest);
    baseNoise.start();

    // Crackle generator timer
    const interval = setInterval(() => {
      if (!this.ctx || Math.random() > 0.4) return;
      const crackleOsc = this.ctx.createOscillator();
      const crackleGain = this.ctx.createGain();
      crackleOsc.type = 'triangle';
      crackleOsc.frequency.setValueAtTime(120 + Math.random() * 800, this.ctx.currentTime);

      crackleGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      crackleGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05 + Math.random() * 0.08);

      crackleOsc.connect(crackleGain);
      crackleGain.connect(dest);

      crackleOsc.start(this.ctx.currentTime);
      crackleOsc.stop(this.ctx.currentTime + 0.15);
    }, 180);

    return () => {
      clearInterval(interval);
      try {
        baseNoise.stop();
      } catch {}
    };
  }

  private createBirds(dest: GainNode): () => void {
    if (!this.ctx) return () => {};
    let isStopped = false;

    const chirp = () => {
      if (isStopped || !this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const baseFreq = 2200 + Math.random() * 1200;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq + 600, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(baseFreq - 300, now + 0.18);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.25);

      const nextDelay = 2000 + Math.random() * 4500;
      setTimeout(chirp, nextDelay);
    };

    chirp();

    return () => {
      isStopped = true;
    };
  }

  private createCafe(dest: GainNode): () => void {
    if (!this.ctx) return () => {};
    const noiseBuffer = this.createNoiseBuffer(4);
    if (!noiseBuffer) return () => {};

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const bandpass1 = this.ctx.createBiquadFilter();
    bandpass1.type = 'bandpass';
    bandpass1.frequency.setValueAtTime(500, this.ctx.currentTime);
    bandpass1.Q.setValueAtTime(1.5, this.ctx.currentTime);

    noise.connect(bandpass1);
    bandpass1.connect(dest);
    noise.start();

    return () => {
      try {
        noise.stop();
      } catch {}
    };
  }

  private createKeyboard(dest: GainNode): () => void {
    if (!this.ctx) return () => {};
    let isStopped = false;

    const typeKey = () => {
      if (isStopped || !this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(300 + Math.random() * 400, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.04);

      const nextDelay = 120 + Math.random() * 320;
      setTimeout(typeKey, nextDelay);
    };

    typeKey();

    return () => {
      isStopped = true;
    };
  }

  private createWhiteNoise(dest: GainNode): () => void {
    if (!this.ctx) return () => {};
    const noiseBuffer = this.createNoiseBuffer(5);
    if (!noiseBuffer) return () => {};

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(dest);
    noise.start();

    return () => {
      try {
        noise.stop();
      } catch {}
    };
  }

  private createLofiDrone(dest: GainNode): () => void {
    if (!this.ctx) return () => {};
    // Lush soothing electric piano / synth warm chords
    const chordFrequencies = [155.56, 196.00, 233.08, 293.66]; // Eb3, G3, Bb3, D4 (EbMaj7)
    const oscillators: OscillatorNode[] = [];

    chordFrequencies.forEach((freq) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, this.ctx.currentTime);

      osc.connect(filter);
      filter.connect(dest);
      osc.start();
      oscillators.push(osc);
    });

    return () => {
      oscillators.forEach((osc) => {
        try {
          osc.stop();
        } catch {}
      });
    };
  }
}

export const soundEngine = typeof window !== 'undefined' ? new SoundEngine() : ({} as SoundEngine);

