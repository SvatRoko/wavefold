import { describe, expect, it } from 'vitest';
import { getPreset } from './presets';
import { frequencyComponents, frequencyRange } from './spectrum';
import type { Wave } from './signal';

const wave: Wave = {
  id: 0,
  frequency: 220,
  amplitude: 0.7,
  phase: 0,
  muted: false,
};

describe('ideal frequency spectrum', () => {
  it('keeps close frequencies separate and auto-fits them', () => {
    const waves = getPreset('beats').waves;
    expect(frequencyComponents(waves).map((c) => c.frequency)).toEqual([
      220, 224,
    ]);
    const [low, high] = frequencyRange(waves);
    expect(low).toBeLessThan(220);
    expect(high).toBeGreaterThan(224);
    expect(high - low).toBeLessThanOrEqual(30);
  });
  it('combines same-frequency waves before taking magnitude', () => {
    expect(
      frequencyComponents([wave, { ...wave, id: 1 }])[0].amplitude,
    ).toBeCloseTo(1.4, 12);
    expect(
      frequencyComponents([wave, { ...wave, id: 1, phase: 90 }])[0].amplitude,
    ).toBeCloseTo(Math.sqrt(2) * 0.7, 12);
    expect(
      frequencyComponents(getPreset('cancellation').waves)[0].amplitude,
    ).toBe(0);
    expect(
      frequencyComponents([
        wave,
        { ...wave, id: 1, amplitude: 0.3, phase: 180 },
      ])[0].amplitude,
    ).toBeCloseTo(0.4, 12);
  });
  it('preserves single-wave magnitude through phase changes', () => {
    for (const phase of [0, 37, 90, 180, 270, 360])
      expect(
        frequencyComponents([{ ...wave, phase }])[0].amplitude,
      ).toBeCloseTo(0.7, 12);
  });
  it('ignores muted and zero-amplitude waves, including their frequencies when framing', () => {
    const waves = [
      wave,
      { ...wave, id: 1, frequency: 1500, muted: true },
      { ...wave, id: 2, frequency: 2000, amplitude: 0 },
    ];
    expect(frequencyComponents(waves)).toHaveLength(1);
    expect(frequencyRange(waves)).toEqual([210, 230]);
    expect(frequencyComponents([])).toEqual([]);
    expect(frequencyRange([])).toEqual([0, 1000]);
  });
  it('represents all four harmonic components exactly', () => {
    expect(
      frequencyComponents(getPreset('harmonics').waves).map((c) => [
        c.frequency,
        c.amplitude,
      ]),
    ).toEqual([
      [220, 0.6],
      [440, 0.3],
      [660, 0.2],
      [880, 0.15],
    ]);
  });
});
