// Web Audio engine: everything (voices + ringtone) goes through one AudioContext so it
// keeps working after a single user gesture (needed on iOS Safari).

class AudioEngine {
  ctx: AudioContext | null = null;
  master: GainNode | null = null; // user volume
  duck: GainNode | null = null; // lowered while shaking
  private ringTimer: number | null = null;
  private ringNodes: AudioNode[] = [];
  private current: AudioBufferSourceNode | null = null;

  ensure() {
    if (!this.ctx) {
      const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new C();
      this.master = this.ctx.createGain();
      this.duck = this.ctx.createGain();
      this.duck.connect(this.master);
      this.master.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  /** call from a user gesture */
  async unlock() {
    const ctx = this.ensure();
    if (ctx.state !== 'running') await ctx.resume();
    const b = ctx.createBuffer(1, 1, 22050);
    const s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0);
  }

  get unlocked() { return !!this.ctx && this.ctx.state === 'running'; }

  setVolume(v: number) { this.ensure(); this.master!.gain.value = Math.max(0, Math.min(1, v / 100)); }

  setDuck(level: number) {
    const ctx = this.ensure();
    this.duck!.gain.cancelScheduledValues(ctx.currentTime);
    this.duck!.gain.setTargetAtTime(level, ctx.currentTime, 0.15);
  }

  private bell(t: number, freq: number, dur = 1.6, vol = 0.28) {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(this.duck!);
    for (const [mul, amp] of [[1, 1], [2.01, 0.25], [3.02, 0.08]] as const) {
      const o = ctx.createOscillator(); const og = ctx.createGain();
      o.type = 'sine'; o.frequency.value = freq * mul; og.gain.value = amp;
      o.connect(og); og.connect(g); o.start(t); o.stop(t + dur + 0.05);
      this.ringNodes.push(o);
    }
  }

  /** "晨露" default ringtone, loops until stopRing() */
  startRing() {
    const ctx = this.ensure();
    this.stopRing();
    const notes = [1046.5, 1318.5, 1568, 2093, 1568, 1318.5];
    let next = ctx.currentTime + 0.05;
    const schedule = () => {
      while (next < ctx.currentTime + 1.2) {
        notes.forEach((f, i) => this.bell(next + i * 0.18, f));
        next += 2.2;
      }
    };
    schedule();
    this.ringTimer = window.setInterval(schedule, 300);
  }

  stopRing() {
    if (this.ringTimer) clearInterval(this.ringTimer);
    this.ringTimer = null;
    for (const n of this.ringNodes) { try { (n as OscillatorNode).stop(); } catch { /* */ } }
    this.ringNodes = [];
  }

  /** preview a short bit of the ringtone */
  previewRing(ms = 2400) { this.startRing(); setTimeout(() => this.stopRing(), ms); }

  async decode(buf: ArrayBuffer) {
    const ctx = this.ensure();
    return await new Promise<AudioBuffer>((res, rej) => ctx.decodeAudioData(buf.slice(0), res, rej));
  }

  playBuffer(buffer: AudioBuffer, gain = 1) {
    const ctx = this.ensure();
    this.stopVoice();
    return new Promise<void>((resolve) => {
      const s = ctx.createBufferSource(); s.buffer = buffer;
      const g = ctx.createGain(); g.gain.value = gain;
      s.connect(g); g.connect(this.master!);
      s.onended = () => { if (this.current === s) this.current = null; resolve(); };
      this.current = s; s.start();
    });
  }

  stopVoice() { if (this.current) { try { this.current.stop(); } catch { /* */ } this.current = null; } }

  stopAll() { this.stopRing(); this.stopVoice(); }
}

export const audio = new AudioEngine();

export function pickMime() {
  const MR = (window as unknown as { MediaRecorder?: typeof MediaRecorder }).MediaRecorder;
  if (!MR) return null;
  for (const m of ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg']) {
    try { if (MR.isTypeSupported(m)) return m; } catch { /* */ }
  }
  return '';
}

export class Recorder {
  private rec: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private t0 = 0;
  level = 0;
  private analyser: AnalyserNode | null = null;
  private raf = 0;

  async start(onLevel?: (v: number) => void) {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    const mime = pickMime();
    this.rec = new MediaRecorder(this.stream, mime ? { mimeType: mime } : undefined);
    this.chunks = [];
    this.rec.ondataavailable = (e) => { if (e.data.size) this.chunks.push(e.data); };
    this.rec.start(250);
    this.t0 = Date.now();
    try {
      const ctx = audio.ensure();
      const src = ctx.createMediaStreamSource(this.stream);
      this.analyser = ctx.createAnalyser(); this.analyser.fftSize = 512;
      src.connect(this.analyser);
      const data = new Uint8Array(this.analyser.fftSize);
      const tick = () => {
        this.analyser!.getByteTimeDomainData(data);
        let s = 0; for (const v of data) s += Math.abs(v - 128);
        this.level = Math.min(1, s / data.length / 30);
        onLevel?.(this.level);
        this.raf = requestAnimationFrame(tick);
      };
      tick();
    } catch { /* level meter optional */ }
  }

  async stop(): Promise<{ blob: Blob; ms: number }> {
    cancelAnimationFrame(this.raf);
    const rec = this.rec!;
    const done = new Promise<void>((r) => { rec.onstop = () => r(); });
    if (rec.state !== 'inactive') rec.stop();
    await done;
    this.stream?.getTracks().forEach((t) => t.stop());
    const type = rec.mimeType || this.chunks[0]?.type || 'audio/webm';
    return { blob: new Blob(this.chunks, { type }), ms: Date.now() - this.t0 };
  }

  cancel() {
    cancelAnimationFrame(this.raf);
    try { this.rec?.stop(); } catch { /* */ }
    this.stream?.getTracks().forEach((t) => t.stop());
  }
}
