import { useEffect, useState, type CSSProperties } from 'react';
import {
  clamp,
  COLORS,
  MAX_FREQUENCY,
  MIN_FREQUENCY,
  type Wave,
} from '../signal';

function Parameter({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const number = Number(draft);
    if (!draft.trim() || !Number.isFinite(number)) {
      setDraft(String(value));
      return;
    }
    const next = Number(
      clamp(Math.round(number / step) * step, min, max).toFixed(2),
    );
    onChange(next);
    setDraft(String(next));
  };
  return (
    <div className="parameter">
      <div className="parameter-heading">
        <span>{label}</span>
        <span className="number-field">
          <input
            aria-label={`${label} value`}
            type="number"
            min={min}
            max={max}
            step={step}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur();
            }}
          />
          <span>{unit}</span>
        </span>
      </div>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

export default function WaveControls({
  wave,
  onChange,
  onRemove,
}: {
  wave: Wave;
  onChange: (patch: Partial<Wave>) => void;
  onRemove: () => void;
}) {
  return (
    <section
      className={`wave-card ${wave.muted ? 'muted' : ''}`}
      aria-label={`Wave ${wave.id + 1}`}
      style={{ '--wave-color': COLORS[wave.id] } as CSSProperties}
    >
      <div className="wave-card-header">
        <div className="wave-title">
          <span className="wave-dot" />
          <h3>Wave {String(wave.id + 1).padStart(2, '0')}</h3>
          <span className="sine-tag">SINE</span>
        </div>
        <div className="wave-actions">
          <button
            className="text-button mute-button"
            aria-label={`${wave.muted ? 'Unmute' : 'Mute'} wave ${wave.id + 1}`}
            aria-pressed={wave.muted}
            onClick={() => onChange({ muted: !wave.muted })}
          >
            {wave.muted ? 'Muted' : 'On'}
          </button>
          <button
            className="remove-button"
            aria-label={`Remove wave ${wave.id + 1}`}
            onClick={onRemove}
          >
            ×
          </button>
        </div>
      </div>
      <Parameter
        label="Frequency"
        value={wave.frequency}
        min={MIN_FREQUENCY}
        max={MAX_FREQUENCY}
        step={1}
        unit="Hz"
        onChange={(frequency) => onChange({ frequency })}
      />
      <Parameter
        label="Amplitude"
        value={wave.amplitude}
        min={0}
        max={1}
        step={0.01}
        unit=""
        onChange={(amplitude) => onChange({ amplitude })}
      />
      <Parameter
        label="Phase"
        value={wave.phase}
        min={0}
        max={360}
        step={1}
        unit="°"
        onChange={(phase) => onChange({ phase })}
      />
    </section>
  );
}
