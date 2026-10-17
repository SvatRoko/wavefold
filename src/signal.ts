export interface Wave {
  id: number;
  frequency: number;
  amplitude: number;
  phase: number;
  muted: boolean;
}

export const TAU = 2 * Math.PI;
export const MAX_WAVES = 4;
export const MIN_FREQUENCY = 20;
export const MAX_FREQUENCY = 2000;
// Fixed headroom preserves relative loudness and avoids clipping at four full waves.
export const AUDIO_HEADROOM = 0.2;
export const COLORS = ['#356bba', '#c16a30', '#8560ad', '#278a82'];
export const INITIAL_WAVES: Wave[] = [
  { id: 0, frequency: 220, amplitude: 0.7, phase: 0, muted: false },
  { id: 1, frequency: 224, amplitude: 0.7, phase: 0, muted: false },
];

export function waveAt(wave: Wave, seconds: number): number {
  return wave.muted
    ? 0
    : wave.amplitude *
        Math.sin(TAU * wave.frequency * seconds + (wave.phase * Math.PI) / 180);
}

export function signalAt(waves: readonly Wave[], seconds: number): number {
  return waves.reduce((sum, wave) => sum + waveAt(wave, seconds), 0);
}

export function amplitudeBound(waves: readonly Wave[]): number {
  return waves.reduce(
    (sum, wave) => sum + (wave.muted ? 0 : wave.amplitude),
    0,
  );
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
