import type { Wave } from './signal';

export interface FrequencyComponent {
  frequency: number;
  amplitude: number;
  waveIds: number[];
}

/** Add sine coefficients (phasors) at each exact frequency before taking magnitude. */
export function frequencyComponents(
  waves: readonly Wave[],
): FrequencyComponent[] {
  const groups = new Map<
    number,
    { real: number; imaginary: number; waveIds: number[] }
  >();
  for (const wave of waves) {
    if (wave.muted || wave.amplitude === 0) continue;
    const group = groups.get(wave.frequency) ?? {
      real: 0,
      imaginary: 0,
      waveIds: [],
    };
    const radians = (wave.phase * Math.PI) / 180;
    group.real += wave.amplitude * Math.cos(radians);
    group.imaginary += wave.amplitude * Math.sin(radians);
    group.waveIds.push(wave.id);
    groups.set(wave.frequency, group);
  }
  return [...groups.entries()]
    .map(([frequency, group]) => {
      const magnitude = Math.hypot(group.real, group.imaginary);
      return {
        frequency,
        amplitude: magnitude < 1e-10 ? 0 : magnitude,
        waveIds: group.waveIds,
      };
    })
    .sort((a, b) => a.frequency - b.frequency);
}

export function frequencyRange(waves: readonly Wave[]): [number, number] {
  const frequencies = waves
    .filter((wave) => !wave.muted && wave.amplitude > 0)
    .map((wave) => wave.frequency);
  if (!frequencies.length) return [0, 1000];
  const low = Math.min(...frequencies);
  const high = Math.max(...frequencies);
  const padding = Math.max(10, (high - low) * 0.15);
  return [Math.max(0, low - padding), high + padding];
}
