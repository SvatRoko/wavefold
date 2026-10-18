import { describe, expect, it } from 'vitest';
import {
  decodeExperiment,
  defaultExperiment,
  encodeExperiment,
} from './experiment';
import { PRESETS } from './presets';

describe('shareable experiments', () => {
  it('round-trips all presets and view settings without playback state', () => {
    for (const preset of PRESETS) {
      const state = {
        ...defaultExperiment(),
        preset: preset.id,
        duration: preset.duration,
        waves: preset.waves,
        showComponents: false,
        spectrumView: 'full' as const,
      };
      expect(decodeExperiment(encodeExperiment(state))).toEqual(state);
      expect(encodeExperiment(state)).not.toContain('playing');
      expect(encodeExperiment(state)).not.toContain('volume');
    }
  });
  it('round-trips mute, phase, sparse wave IDs, and an empty canvas', () => {
    const state = {
      ...defaultExperiment(),
      waves: [
        { id: 3, frequency: 777, amplitude: 0.31, phase: 273, muted: true },
      ],
    };
    expect(decodeExperiment(encodeExperiment(state))).toEqual(state);
    expect(
      decodeExperiment(encodeExperiment({ ...state, waves: [] }))?.waves,
    ).toEqual([]);
  });
  it('rejects malformed, unknown-version, oversized, and out-of-range payloads', () => {
    const encode = (value: unknown) =>
      '#experiment=' + encodeURIComponent(JSON.stringify(value));
    const valid = { v: 1, ...defaultExperiment() };
    for (const hash of [
      '',
      '#experiment=%ZZ',
      '#experiment=null',
      '#experiment=' + 'x'.repeat(6001),
      encode({ ...valid, v: 2 }),
      encode({ ...valid, duration: -1 }),
      encode({ ...valid, spectrumView: 'unknown' }),
      encode({ ...valid, preset: 'unknown' }),
      encode({ ...valid, showComponents: 'true' }),
      encode({ ...valid, waves: Array(5).fill(valid.waves[0]) }),
    ])
      expect(decodeExperiment(hash)).toBeNull();
    for (const patch of [
      { frequency: 0 },
      { frequency: 2001 },
      { frequency: '220' },
      { frequency: 220.5 },
      { phase: 361 },
      { amplitude: -1 },
      { amplitude: 2 },
      { amplitude: null },
      { id: 4 },
      { muted: 1 },
    ])
      expect(
        decodeExperiment(
          encode({ ...valid, waves: [{ ...valid.waves[0], ...patch }] }),
        ),
      ).toBeNull();
    expect(
      decodeExperiment(
        encode({ ...valid, waves: [valid.waves[0], valid.waves[0]] }),
      ),
    ).toBeNull();
  });
});
