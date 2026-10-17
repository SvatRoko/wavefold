import { describe, expect, it } from 'vitest';
import {
  AUDIO_HEADROOM,
  INITIAL_WAVES,
  signalAt,
  waveAt,
  type Wave,
} from './signal';
import { Synth } from './audio/synth';

const wave: Wave = {
  id: 0,
  frequency: 220,
  amplitude: 1,
  phase: 0,
  muted: false,
};
const render = (synth: Synth, count: number) =>
  Array.from({ length: count }, () => synth.nextSample());
const rms = (samples: number[]) =>
  Math.sqrt(
    samples.reduce((sum, value) => sum + value * value, 0) / samples.length,
  );

describe('signal mathematics', () => {
  it('has the expected quarter-period amplitude', () => {
    expect(waveAt(wave, 1 / (4 * wave.frequency))).toBeCloseTo(1, 12);
  });
  it('doubles equal in-phase waves and cancels opposite-phase waves across time', () => {
    for (let index = 0; index < 1000; index++) {
      const time = index / 48000;
      expect(signalAt([wave, wave], time)).toBeCloseTo(
        2 * waveAt(wave, time),
        12,
      );
      expect(signalAt([wave, { ...wave, phase: 180 }], time)).toBeCloseTo(
        0,
        12,
      );
    }
  });
  it('silences muted and empty inputs', () => {
    expect(signalAt([{ ...wave, muted: true }], 0.001)).toBe(0);
    expect(signalAt([], 0.001)).toBe(0);
  });
  it('matches the analytical beating identity for the default experiment', () => {
    for (let index = 0; index < 1000; index++) {
      const time = index / 2000;
      const expected =
        1.4 *
        Math.sin(2 * Math.PI * 222 * time) *
        Math.cos(2 * Math.PI * 2 * time);
      expect(signalAt(INITIAL_WAVES, time)).toBeCloseTo(expected, 11);
    }
  });
});

describe.each([44100, 48000])('audio synthesis at %i Hz', (rate) => {
  it('starts silent and reaches the expected sine RMS with fixed headroom', () => {
    const synth = new Synth(rate);
    synth.setWaves([wave]);
    synth.setVolume(1);
    expect(rms(render(synth, rate / 10))).toBe(0);
    synth.setPlaying(true);
    render(synth, rate / 10);
    expect(rms(render(synth, rate))).toBeCloseTo(
      AUDIO_HEADROOM / Math.sqrt(2),
      5,
    );
  });
  it('cancels in the audio path and remains below clipping with four full waves', () => {
    const synth = new Synth(rate);
    synth.setVolume(1);
    synth.setPlaying(true);
    synth.setWaves([wave, { ...wave, phase: 180 }]);
    render(synth, rate / 10);
    expect(rms(render(synth, rate / 10))).toBeLessThan(1e-10);
    synth.setWaves([wave, wave, wave, wave]);
    render(synth, rate / 10);
    expect(
      Math.max(...render(synth, rate / 10).map(Math.abs)),
    ).toBeLessThanOrEqual(0.8 + 1e-12);
  });
  it('fades to silence on stop and replaces the signal when edited', () => {
    const synth = new Synth(rate);
    synth.setWaves([wave]);
    synth.setVolume(1);
    synth.setPlaying(true);
    render(synth, rate / 10);
    synth.setWaves([{ ...wave, frequency: 440 }]);
    render(synth, rate / 10);
    const samples = render(synth, rate);
    const positiveCrossings = samples
      .slice(1)
      .filter((value, i) => samples[i] <= 0 && value > 0).length;
    expect(positiveCrossings).toBeGreaterThanOrEqual(439);
    expect(positiveCrossings).toBeLessThanOrEqual(441);
    synth.setPlaying(false);
    render(synth, Math.ceil(rate * 0.01));
    expect(rms(render(synth, 1000))).toBe(0);
  });
});
