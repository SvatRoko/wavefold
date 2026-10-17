import { useEffect, useRef, useState } from 'react';
import { AudioEngine } from './audio/engine';
import WaveControls from './components/WaveControls';
import Waveform from './components/Waveform';
import { COLORS, INITIAL_WAVES, MAX_WAVES, type Wave } from './signal';

export default function App() {
  const [waves, setWaves] = useState<Wave[]>(() =>
    INITIAL_WAVES.map((w) => ({ ...w })),
  );
  const [volume, setVolume] = useState(0.15);
  const [playing, setPlaying] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [duration, setDuration] = useState(0.5);
  const [showComponents, setShowComponents] = useState(true);
  const engine = useRef<AudioEngine | null>(null);
  const latest = useRef({ waves, volume });
  latest.current = { waves, volume };
  const playAttempt = useRef(0);

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
    setError('');
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

  const active = waves.filter((w) => !w.muted && w.amplitude > 0);
  const beatRate =
    active.length === 2
      ? Math.abs(active[0].frequency - active[1].frequency)
      : null;
  const beats = beatRate !== null && beatRate > 0 && beatRate <= 20;

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
            <span>EXPERIMENT / 001</span>
            <strong>Superposition</strong>
          </div>
        </div>

        <div className="transport">
          <div className="transport-left">
            <button
              className={`play-button ${playing ? 'is-playing' : ''}`}
              onClick={togglePlayback}
              disabled={starting}
            >
              <span aria-hidden="true">{playing ? '■' : '▶'}</span>
              {starting ? 'Starting…' : playing ? 'Stop sound' : 'Play sound'}
            </button>
            <span className="play-status" aria-live="polite">
              <span className={playing ? 'status-dot active' : 'status-dot'} />
              {playing ? 'Sound is playing' : 'Ready when you are'}
            </span>
          </div>
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
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

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

            <section className="insight" aria-labelledby="insight-heading">
              <div className="insight-symbol" aria-hidden="true">
                ∿
              </div>
              <div>
                <p className="eyebrow">A SMALL EXPERIMENT</p>
                <h2 id="insight-heading">
                  {beats
                    ? 'Hear the space between two notes.'
                    : 'Every wave adds to the story.'}
                </h2>
                <p>
                  {beats ? (
                    <>
                      These waves are <strong>{beatRate} Hz apart</strong>.
                      Together, they produce {beatRate}{' '}
                      {beatRate === 1 ? 'beat' : 'beats'} per second. Bring
                      their frequencies closer and listen to the pulsing slow
                      down.
                    </>
                  ) : (
                    'Waves add point by point. Match two frequencies, give them equal amplitudes, and set one phase to 180° to hear them cancel.'
                  )}
                </p>
                <div className="try-note">
                  <span>TRY THIS</span>
                  {beats
                    ? 'Set the time window to 10 ms to see the individual oscillations.'
                    : 'Change a frequency or phase and watch the combined signal respond.'}
                </div>
              </div>
            </section>
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
                setWaves(INITIAL_WAVES.map((w) => ({ ...w })));
                setDuration(0.5);
                setShowComponents(true);
              }}
            >
              ↺ Reset experiment
            </button>
            <p className="controls-hint">
              Drag to explore. Type a value and press Enter for precision.
            </p>
          </aside>
        </div>
      </main>
      <footer>
        <span>Made for curious ears and minds.</span>
        <span>Free to explore. Open by nature.</span>
      </footer>
    </div>
  );
}
