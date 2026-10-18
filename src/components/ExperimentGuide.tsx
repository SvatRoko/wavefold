import { getPreset, matchesPreset, type PresetId } from '../presets';
import type { Wave } from '../signal';
import { frequencyComponents } from '../spectrum';

export default function ExperimentGuide({
  waves,
  preset,
}: {
  waves: Wave[];
  preset: PresetId;
}) {
  const source = getPreset(preset);
  const edited = !matchesPreset(waves, preset);
  const active = waves.filter((w) => !w.muted && w.amplitude > 0);
  const components = frequencyComponents(waves).filter((c) => c.amplitude > 0);
  const beatRate =
    active.length === 2
      ? Math.abs(active[0].frequency - active[1].frequency)
      : 0;
  let observation = `${components.length} distinct frequencies remain in the combined signal. Change an amplitude to change its contribution.`;
  if (!active.length)
    observation =
      'There are no active waves. Add a wave, unmute one, or increase its amplitude to explore again.';
  else if (!components.length)
    observation =
      'The active waves cancel completely. The waveform is flat and no spectral line remains. Change a phase to bring the signal back.';
  else if (active.length === 1)
    observation = `One sine wave at ${active[0].frequency} Hz: one line in the spectrum. Frequency changes pitch; amplitude changes its strength.`;
  else if (beatRate > 0 && beatRate <= 20)
    observation = `These waves are ${beatRate} Hz apart, producing ${beatRate} ${beatRate === 1 ? 'beat' : 'beats'} per second. Closer frequencies make slower pulses.`;
  else if (components.length === 1)
    observation = `The waves share one frequency. Their phases combine to produce a single ${components[0].frequency} Hz component with amplitude ${Number(components[0].amplitude.toFixed(3))}.`;
  else if (
    components.every(
      (c) =>
        Math.abs(
          c.frequency / components[0].frequency -
            Math.round(c.frequency / components[0].frequency),
        ) < 1e-10,
    )
  )
    observation = `The frequencies are whole-number multiples of ${components[0].frequency} Hz. Their relative amplitudes shape the tone while the combined wave repeats.`;
  return (
    <section className="insight" aria-labelledby="insight-heading">
      <div className="insight-symbol" aria-hidden="true">
        ∿
      </div>
      <div>
        <p className="eyebrow">
          {edited ? 'EXPLORING FROM' : 'A SMALL EXPERIMENT'} /{' '}
          {source.name.toUpperCase()}
        </p>
        <h2 id="insight-heading">{source.subtitle}</h2>
        <p>{source.description}</p>
        <p className="live-observation" aria-live="polite">
          {observation}
        </p>
        <div className="try-note">
          <span>TRY THIS</span>
          {source.tryThis}
        </div>
      </div>
    </section>
  );
}
