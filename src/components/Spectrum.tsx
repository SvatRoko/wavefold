import { useEffect, useRef, useState } from 'react';
import { COLORS, type Wave } from '../signal';
import { frequencyComponents, frequencyRange } from '../spectrum';

export default function Spectrum({
  waves,
  view,
  onViewChange,
}: {
  waves: Wave[];
  view: 'auto' | 'full';
  onViewChange: (view: 'auto' | 'full') => void;
}) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(240, entry.contentRect.width)),
    );
    if (wrapper.current) observer.observe(wrapper.current);
    return () => observer.disconnect();
  }, []);
  const components = frequencyComponents(waves);
  const visible = components.filter((component) => component.amplitude > 0);
  const [min, max] = view === 'auto' ? frequencyRange(waves) : [0, 2200];
  const ceiling = Math.max(
    1,
    Math.ceil(Math.max(0, ...visible.map((c) => c.amplitude)) * 2) / 2,
  );
  const left = 42,
    right = width - 18,
    top = 24,
    bottom = 170;
  const x = (frequency: number) =>
    left + ((frequency - min) / (max - min)) * (right - left);
  const y = (amplitude: number) =>
    bottom - (amplitude / ceiling) * (bottom - top);
  return (
    <section
      className="plot-panel spectrum-panel"
      aria-labelledby="spectrum-heading"
    >
      <div className="panel-heading">
        <div>
          <p className="eyebrow">02 / FREQUENCY DOMAIN</p>
          <h2 id="spectrum-heading">What’s in the mix?</h2>
        </div>
        <span className="plot-badge">IDEAL SPECTRUM</span>
      </div>
      <p className="spectrum-intro">
        Each line is a frequency in the combined signal.
      </p>
      <div ref={wrapper} className="spectrum-plot">
        <svg
          viewBox={`0 0 ${width} 210`}
          role="img"
          aria-label={
            visible.length
              ? `Frequency components: ${visible.map((c) => `${c.frequency} Hz at amplitude ${Number(c.amplitude.toFixed(3))}`).join(', ')}.`
              : 'Frequency components: no remaining components. The combined signal is silent.'
          }
        >
          {[0, 1, 2, 3, 4].map((index) => {
            const frequency = min + ((max - min) * index) / 4;
            return (
              <g key={`x-${index}`}>
                <line
                  x1={x(frequency)}
                  x2={x(frequency)}
                  y1={top}
                  y2={bottom}
                  className="spectrum-grid"
                />
                <text x={x(frequency)} y={189} textAnchor="middle">
                  {Number(frequency.toFixed(1))}
                </text>
              </g>
            );
          })}
          {[0, 0.5, 1].map((fraction) => (
            <g key={`y-${fraction}`}>
              <line
                x1={left}
                x2={right}
                y1={y(fraction * ceiling)}
                y2={y(fraction * ceiling)}
                className="spectrum-grid"
              />
              <text x={left - 9} y={y(fraction * ceiling) + 4} textAnchor="end">
                {fraction * ceiling}
              </text>
            </g>
          ))}
          <text x={left} y={12}>
            amplitude
          </text>
          <text x={right} y={207} textAnchor="end">
            frequency / Hz
          </text>
          {visible.map((component) => (
            <g key={component.frequency} className="spectrum-component">
              <title>
                {component.frequency} Hz · amplitude{' '}
                {Number(component.amplitude.toFixed(3))} ·{' '}
                {component.waveIds.map((id) => `Wave ${id + 1}`).join(' + ')}
              </title>
              <line
                x1={x(component.frequency)}
                x2={x(component.frequency)}
                y1={bottom}
                y2={y(component.amplitude)}
                stroke={
                  component.waveIds.length === 1
                    ? COLORS[component.waveIds[0]]
                    : '#263d33'
                }
                strokeWidth="2.5"
              />
              <circle
                cx={x(component.frequency)}
                cy={y(component.amplitude)}
                r="3.5"
                fill={
                  component.waveIds.length === 1
                    ? COLORS[component.waveIds[0]]
                    : '#263d33'
                }
              />
            </g>
          ))}
          {!visible.length && (
            <text
              x={(left + right) / 2}
              y={98}
              textAnchor="middle"
              className="spectrum-silence"
            >
              {components.length
                ? 'Equal and opposite. Nothing remains.'
                : 'No active frequencies.'}
            </text>
          )}
        </svg>
      </div>
      {components.length > 0 && (
        <ul
          className="component-values"
          aria-label="Exact frequency components"
        >
          {components.map((c) => (
            <li key={c.frequency}>
              <i
                style={{
                  background:
                    c.waveIds.length === 1 ? COLORS[c.waveIds[0]] : '#263d33',
                }}
              />
              <strong>{c.frequency} Hz</strong>
              <span>
                {c.amplitude === 0
                  ? 'cancelled'
                  : `A ${Number(c.amplitude.toFixed(3))}`}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="plot-toolbar">
        <label className="time-window">
          Frequency range{' '}
          <select
            aria-label="Frequency range"
            value={view}
            onChange={(event) =>
              onViewChange(event.target.value as 'auto' | 'full')
            }
          >
            <option value="auto">Fit to waves</option>
            <option value="full">Full range</option>
          </select>
        </label>
        <button className="text-button" onClick={() => onViewChange('auto')}>
          Reset view
        </button>
      </div>
      <details className="plot-help">
        <summary>How to read this</summary>
        <p>
          This is the exact mathematical spectrum, not a microphone measurement
          or FFT. Waves at the same frequency combine using their amplitudes and
          phases. Cancelled waves leave no line. The horizontal range fits your
          waves automatically; use Full range to compare experiments on one
          frequency scale. Vertical scaling is automatic, and exact amplitudes
          appear below the plot.
        </p>
      </details>
    </section>
  );
}
