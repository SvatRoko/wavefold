import { useEffect, useRef, useState } from 'react';
import { AudioEngine } from './audio/engine';
import WaveControls from './components/WaveControls';
import Waveform from './components/Waveform';
import Spectrum from './components/Spectrum';
import ExperimentGuide from './components/ExperimentGuide';
import ShareDialog from './components/ShareDialog';
import {
  defaultExperiment,
  decodeExperiment,
  type Experiment,
} from './experiment';
import { getPreset, matchesPreset, PRESETS, type PresetId } from './presets';
import { COLORS, MAX_WAVES, type Wave } from './signal';

export default function App() {
  const [initial] = useState(() => decodeExperiment(window.location.hash));
  const [waves, setWaves] = useState<Wave[]>(
    () => (initial ?? defaultExperiment()).waves,
  );
  const [preset, setPreset] = useState<PresetId>(initial?.preset ?? 'beats');
  const [spectrumView, setSpectrumView] = useState<'auto' | 'full'>(
    initial?.spectrumView ?? 'auto',
  );
  const [shareOpen, setShareOpen] = useState(false);
  const [linkNotice, setLinkNotice] = useState(() =>
    initial
      ? 'Shared experiment loaded. Press Play when you’re ready.'
      : window.location.hash
        ? 'This experiment link could not be read. The default Beats experiment is loaded instead.'
        : '',
  );
  const [volume, setVolume] = useState(0.15);
  const [playing, setPlaying] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [duration, setDuration] = useState(initial?.duration ?? 0.5);
  const [showComponents, setShowComponents] = useState(
    initial?.showComponents ?? true,
  );
  const engine = useRef<AudioEngine | null>(null);
  const latest = useRef({ waves, volume });
  latest.current = { waves, volume };
  const playAttempt = useRef(0);

  function applyExperiment(experiment: Experiment) {
    setWaves(experiment.waves.map((w) => ({ ...w })));
    setPreset(experiment.preset);
    setDuration(experiment.duration);
    setShowComponents(experiment.showComponents);
    setSpectrumView(experiment.spectrumView);
  }

  function selectPreset(id: PresetId) {
    const selected = getPreset(id);
    applyExperiment({
      waves: selected.waves,
      preset: id,
      duration: selected.duration,
      showComponents: true,
      spectrumView: 'auto',
    });
    setLinkNotice('');
  }

  useEffect(() => {
    const loadLink = () => {
      ++playAttempt.current;
      engine.current?.stop();
      setPlaying(false);
      setStarting(false);
      setShareOpen(false);
      setVolume(0.15);
      const decoded = decodeExperiment(window.location.hash);
      applyExperiment(decoded ?? defaultExperiment());
      setLinkNotice(
        decoded
          ? 'Shared experiment loaded. Press Play when you’re ready.'
          : window.location.hash
            ? 'This experiment link could not be read. The default Beats experiment is loaded instead.'
            : '',
      );
    };
    window.addEventListener('hashchange', loadLink);
    return () => window.removeEventListener('hashchange', loadLink);
  }, []);

  useEffect(() => {
    engine.current = new AudioEngine();
    const stop = () => {
      if (document.hidden) {
        ++playAttempt.current;
        engine.current?.stop();
        setPlaying(false);
        setStarting(false);
      }
    };
    document.addEventListener('visibilitychange', stop);
    return () => {
      ++playAttempt.current;
      document.removeEventListener('visibilitychange', stop);
      engine.current?.dispose();
    };
  }, []);
  useEffect(() => engine.current?.setWaves(waves), [waves]);
  useEffect(() => engine.current?.setVolume(volume), [volume]);

  async function togglePlayback() {
    if (starting) return;
    setError('');
    if (
      typeof AudioContext === 'undefined' ||
      typeof AudioWorkletNode === 'undefined'
    ) {
      setError(
        'Audio is unavailable in this browser. You can still explore the waves and graphs. Try a browser with Web Audio support to listen.',
      );
      return;
    }
    if (playing) {
      engine.current?.stop();
      setPlaying(false);
      return;
    }
    const attempt = ++playAttempt.current;
    setStarting(true);
    try {
      await engine.current!.play(latest.current.waves, latest.current.volume);
      if (attempt !== playAttempt.current) return;
      engine.current!.setWaves(latest.current.waves);
      engine.current!.setVolume(latest.current.volume);
      setPlaying(true);
    } catch {
      if (attempt !== playAttempt.current) return;
      engine.current?.stop();
      setError(
        'Audio could not start. Try Play again in a current browser on localhost or HTTPS.',
      );
    } finally {
      if (attempt === playAttempt.current) setStarting(false);
    }
  }

  const edited = !matchesPreset(waves, preset);

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="./" aria-label="Wavefold home">
          <svg viewBox="0 0 36 28" aria-hidden="true">
            <path d="M2 14C7-2 12-2 18 14s11 16 16 0" />
          </svg>
          Wavefold<span className="brand-period">.</span>
        </a>
        <div className="header-note">AN OPEN EXPLORATION OF SOUND</div>
        <a
          className="source-link"
          href="https://github.com/sroko/wavefold"
          target="_blank"
          rel="noreferrer"
        >
          Source code <span aria-hidden="true">↗</span>
        </a>
      </header>

      <main>
        <div className="intro">
          <div>
            <p className="eyebrow">
              <span /> THE WAVE LAB
            </p>
            <h1>A little room for sound.</h1>
            <p className="intro-copy">
              Build a wave. Add another. See what happens between them.
            </p>
          </div>
          <div className="edition">
            <span>
              EXPERIMENT /{' '}
              {String(PRESETS.findIndex((p) => p.id === preset) + 1).padStart(
                3,
                '0',
              )}
            </span>
            <strong>
              {getPreset(preset).name}
              {edited ? ' · edited' : ''}
            </strong>
          </div>
        </div>

        <div className="transport">
          <div className="transport-left">
            <button
              className={`play-button ${playing ? 'is-playing' : ''}`}
              onClick={togglePlayback}
              aria-disabled={starting}
            >
              <span aria-hidden="true">{playing ? '■' : '▶'}</span>
              {starting ? 'Starting…' : playing ? 'Stop sound' : 'Play sound'}
            </button>
            <span className="play-status" aria-live="polite">
              <span className={playing ? 'status-dot active' : 'status-dot'} />
              {playing ? 'Sound is playing' : 'Ready when you are'}
            </span>
          </div>
          <div className="transport-right">
            <label className="master-volume">
              <span>Volume</span>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.01"
                value={volume}
                onChange={(event) => setVolume(Number(event.target.value))}
                aria-label="Master volume"
              />
              <output>{Math.round(volume * 100)}%</output>
            </label>
            <button
              className="share-button"
              onClick={(event) => {
                event.currentTarget.focus();
                setShareOpen(true);
              }}
            >
              Share experiment <span aria-hidden="true">↗</span>
            </button>
          </div>
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        {linkNotice && (
          <p className="link-notice" role="status">
            {linkNotice}
            <button
              className="text-button"
              aria-label="Dismiss link notice"
              onClick={() => setLinkNotice('')}
            >
              ×
            </button>
          </p>
        )}
        <nav className="presets" aria-label="Experiments">
          {PRESETS.map((item, index) => (
            <button
              key={item.id}
              className={`preset-button ${preset === item.id ? 'selected' : ''}`}
              aria-pressed={preset === item.id}
              onClick={() => selectPreset(item.id)}
            >
              <span className="preset-number">0{index + 1}</span>
              <span>
                <strong>{item.name}</strong>
                <small>{item.subtitle}</small>
              </span>
              {preset === item.id && (
                <span className="preset-mark" aria-hidden="true">
                  {edited ? '↳' : '•'}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="workspace">
          <div className="visual-column">
            <section className="plot-panel" aria-labelledby="waveform-heading">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">01 / TIME DOMAIN</p>
                  <h2 id="waveform-heading">The waves, together.</h2>
                </div>
                <span className="plot-badge">
                  {playing ? 'SOUND ON' : 'SOUND OFF'}
                </span>
              </div>
              <div className="legend">
                <span>
                  <i style={{ background: '#263d33' }} />
                  Combined signal
                </span>
                {waves.map((w) => (
                  <span className={w.muted ? 'legend-muted' : ''} key={w.id}>
                    <i style={{ background: COLORS[w.id] }} />
                    Wave {w.id + 1}
                    {w.muted ? ' · muted' : ''}
                  </span>
                ))}
              </div>
              <Waveform
                waves={waves}
                duration={duration}
                showComponents={showComponents}
              />
              <div className="plot-toolbar">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={showComponents}
                    onChange={(event) =>
                      setShowComponents(event.target.checked)
                    }
                  />
                  Show individual waves
                </label>
                <label className="time-window">
                  Time window{' '}
                  <select
                    aria-label="Time window"
                    value={duration}
                    onChange={(event) =>
                      setDuration(Number(event.target.value))
                    }
                  >
                    <option value="0.01">10 ms · close up</option>
                    <option value="0.05">50 ms</option>
                    <option value="0.1">100 ms</option>
                    <option value="0.5">500 ms · wide view</option>
                    <option value="1">1 second</option>
                  </select>
                </label>
              </div>
              <p className="plot-caption">
                A stationary view from t = 0. Change the time window to inspect
                the shape; amplitude scale adjusts automatically.
              </p>
            </section>

            <Spectrum
              waves={waves}
              view={spectrumView}
              onViewChange={setSpectrumView}
            />
            <ExperimentGuide waves={waves} preset={preset} />
            <div className="equation-note">
              <span>THE IDEA IS SIMPLE</span>
              <code>y(t) = Σ Aᵢ sin(2πfᵢt + φᵢ)</code>
              <p>
                Amplitude sets the height. Frequency sets the pace. Phase sets
                the starting point.
              </p>
            </div>
          </div>

          <aside className="controls-panel" aria-label="Wave controls">
            <div className="controls-heading">
              <div>
                <p className="eyebrow">YOUR INGREDIENTS</p>
                <h2>Sine waves</h2>
              </div>
              <span className="wave-count">
                {waves.length} / {MAX_WAVES}
              </span>
            </div>
            <div className="wave-cards">
              {waves.map((wave) => (
                <WaveControls
                  key={wave.id}
                  wave={wave}
                  onChange={(patch) =>
                    setWaves((current) =>
                      current.map((w) =>
                        w.id === wave.id ? { ...w, ...patch } : w,
                      ),
                    )
                  }
                  onRemove={() =>
                    setWaves((current) =>
                      current.filter((w) => w.id !== wave.id),
                    )
                  }
                />
              ))}
            </div>
            {waves.length === 0 && (
              <p className="empty-state">
                A quiet canvas. Add a sine wave to get started.
              </p>
            )}
            <button
              className="add-button"
              disabled={waves.length >= MAX_WAVES}
              onClick={() =>
                setWaves((current) => {
                  if (current.length >= MAX_WAVES) return current;
                  const id = [0, 1, 2, 3].find(
                    (id) => !current.some((w) => w.id === id),
                  )!;
                  return [
                    ...current,
                    {
                      id,
                      frequency: 220,
                      amplitude: 0.5,
                      phase: 0,
                      muted: false,
                    },
                  ];
                })
              }
            >
              <span aria-hidden="true">+</span>
              {waves.length >= MAX_WAVES
                ? 'Four waves in the mix'
                : 'Add a wave'}
            </button>
            <button
              className="reset-button"
              onClick={() => {
                selectPreset(preset);
              }}
            >
              ↺ Reset experiment
            </button>
            <p className="controls-hint">
              Drag to explore. Type a value and press Enter for precision.
            </p>
            <details className="control-help">
              <summary>What do these controls do?</summary>
              <dl>
                <dt>Frequency · Hz</dt>
                <dd>
                  Cycles per second. Higher values produce a higher pitch.
                  Explore 20–2,000 Hz.
                </dd>
                <dt>Amplitude · 0–1</dt>
                <dd>
                  The height of a wave before master volume. Higher amplitudes
                  contribute more to the combined sound.
                </dd>
                <dt>Phase · degrees</dt>
                <dd>
                  The starting position in a cycle. A 180° shift flips a sine
                  wave; 360° returns to its starting position.
                </dd>
                <dt>Mute</dt>
                <dd>
                  Removes a wave from the sound and graphs while keeping its
                  settings.
                </dd>
              </dl>
            </details>
          </aside>
        </div>
      </main>
      <footer>
        <span>Made for curious ears and minds.</span>
        <span>Free to explore. Open by nature.</span>
      </footer>
      {shareOpen && (
        <ShareDialog
          experiment={{ waves, preset, duration, showComponents, spectrumView }}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}
