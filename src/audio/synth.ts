import { AUDIO_HEADROOM, signalAt, type Wave } from '../signal';

/** Sample-based envelopes are independent of UI frame rate and device sample rate. */
export class Synth {
  private waves: Wave[] = [];
  private pending: Wave[] | null = null;
  private time = 0;
  private envelope = 0;
  private playing = false;
  private volume = 0;
  private targetVolume = 0.15;
  private readonly envelopeStep: number;
  private readonly volumeStep: number;

  constructor(private readonly rate: number) {
    this.envelopeStep = 1 / (rate * 0.005);
    this.volumeStep = 1 / (rate * 0.02);
  }

  setWaves(waves: Wave[]) {
    this.pending = waves.map((wave) => ({ ...wave }));
  }

  setPlaying(playing: boolean) {
    this.playing = playing;
  }
  setVolume(volume: number) {
    this.targetVolume = Math.min(1, Math.max(0, volume));
  }

  nextSample(): number {
    // Fade to zero before resetting the phase reference, then fade the new signal in.
    // This gives the sound and the stationary plot the same initial phase relationship.
    const targetEnvelope = this.playing && !this.pending ? 1 : 0;
    this.envelope = moveToward(
      this.envelope,
      targetEnvelope,
      this.envelopeStep,
    );
    if (this.pending && this.envelope === 0) {
      this.waves = this.pending;
      this.pending = null;
      this.time = 0;
    }
    this.volume = moveToward(this.volume, this.targetVolume, this.volumeStep);
    const sample =
      signalAt(this.waves, this.time) *
      AUDIO_HEADROOM *
      this.volume *
      this.envelope;
    this.time += 1 / this.rate;
    return sample;
  }
}

function moveToward(value: number, target: number, step: number) {
  return value < target
    ? Math.min(target, value + step)
    : Math.max(target, value - step);
}
