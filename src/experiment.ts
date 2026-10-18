import { getPreset, PRESETS, TIME_WINDOWS, type PresetId } from './presets';
import { MAX_FREQUENCY, MAX_WAVES, MIN_FREQUENCY, type Wave } from './signal';

export interface Experiment {
  waves: Wave[];
  preset: PresetId;
  duration: number;
  showComponents: boolean;
  spectrumView: 'auto' | 'full';
}

export function defaultExperiment(): Experiment {
  return {
    waves: getPreset('beats').waves.map((w) => ({ ...w })),
    preset: 'beats',
    duration: 0.5,
    showComponents: true,
    spectrumView: 'auto',
  };
}

export function encodeExperiment(experiment: Experiment): string {
  // A versioned, readable fragment. No user data or external storage is involved.
  return (
    '#experiment=' + encodeURIComponent(JSON.stringify({ v: 1, ...experiment }))
  );
}

export function decodeExperiment(hash: string): Experiment | null {
  if (!hash.startsWith('#experiment=') || hash.length > 6000) return null;
  try {
    const data = JSON.parse(
      decodeURIComponent(hash.slice('#experiment='.length)),
    );
    if (
      !data ||
      data.v !== 1 ||
      !PRESETS.some((p) => p.id === data.preset) ||
      !TIME_WINDOWS.includes(data.duration) ||
      typeof data.showComponents !== 'boolean' ||
      !['auto', 'full'].includes(data.spectrumView) ||
      !Array.isArray(data.waves) ||
      data.waves.length > MAX_WAVES
    )
      return null;
    const ids = new Set<number>();
    const waves: Wave[] = [];
    for (const wave of data.waves) {
      if (
        !wave ||
        !Number.isInteger(wave.id) ||
        wave.id < 0 ||
        wave.id >= MAX_WAVES ||
        ids.has(wave.id) ||
        !Number.isInteger(wave.frequency) ||
        wave.frequency < MIN_FREQUENCY ||
        wave.frequency > MAX_FREQUENCY ||
        !Number.isFinite(wave.amplitude) ||
        wave.amplitude < 0 ||
        wave.amplitude > 1 ||
        !Number.isInteger(wave.phase) ||
        wave.phase < 0 ||
        wave.phase > 360 ||
        typeof wave.muted !== 'boolean'
      )
        return null;
      ids.add(wave.id);
      waves.push({
        id: wave.id,
        frequency: wave.frequency,
        amplitude: wave.amplitude,
        phase: wave.phase,
        muted: wave.muted,
      });
    }
    return {
      waves,
      preset: data.preset,
      duration: data.duration,
      showComponents: data.showComponents,
      spectrumView: data.spectrumView,
    };
  } catch {
    return null;
  }
}
