# Day 1 implementation walkthrough

## From a slider to a sound

1. `src/App.tsx` owns the current waves, playback state, volume, and time window.
2. `src/components/WaveControls.tsx` updates one property of one wave. Sliders update immediately. Number fields apply on Enter or blur, clamp to the supported range, and restore the previous value when empty.
3. React passes the new wave list to `Waveform.tsx`, which redraws the Canvas. It also sends the list through `AudioEngine` to the audio thread.
4. `src/audio/processor.ts` receives the settings and asks `Synth` for each output sample. The browser sends those samples to the audio device.

React handles controls and layout. Canvas handles the graph. The audio worklet produces samples independently of browser paint frames. These separate jobs share the same mathematical calculation.

## The signal model

Each wave has an ID, frequency in Hz, amplitude from 0 to 1, phase in degrees, and a mute flag. There are at most four waves, with frequencies from 20 to 2,000 Hz in this prototype.

`src/signal.ts` implements:

```text
wave(t) = amplitude × sin(2π × frequency × t + phase × π/180)
signal(t) = sum of all unmuted waves
```

Time is measured in seconds. Phase is converted from degrees to radians inside the calculation. Muting contributes zero without losing the wave's settings.

Two identical waves reinforce each other. Equal waves 180 degrees apart cancel. The initial 220 Hz and 224 Hz waves produce four amplitude beats per second. Both the graph and audio use `signalAt`, so the underlying model is shared rather than independently approximated.

## Why a stationary waveform?

The graph shows the mathematical signal beginning at t = 0. It updates when settings change, but does not scroll continuously. This makes phase and cancellation easier to inspect and avoids implying that the graph is a measurement of speaker output.

The time selector ranges from 10 ms to one second. A short window reveals oscillations; a long window reveals the beat envelope. The vertical scale fits the sum of active amplitudes, with a minimum range of ±1. Master volume affects playback only, not these mathematical amplitudes.

At wide time windows, a sine wave can oscillate multiple times within one screen pixel. The renderer takes multiple samples per column and draws their minimum and maximum values instead of misleadingly connecting undersampled points. This is a bounded visual approximation, not a sampled-audio spectrum. A ResizeObserver redraws the graph when its available space changes, and device-pixel scaling keeps it sharp on high-density screens.

## Audio lifecycle and transitions

`src/audio/engine.ts` creates one AudioContext on the first Play click and loads the bundled worklet. It owns starting, stopping, volume updates, and resource cleanup. The worklet is built through Vite's worker URL import but runs as an AudioWorklet, not a regular Web Worker.

`src/audio/synth.ts` advances time by `1 / sampleRate` for each sample. It works at the actual device sample rate. Tests cover both 44.1 kHz and 48 kHz.

Changing wave settings fades the current signal out over 5 ms, resets the phase reference, and fades the new signal in over 5 ms. This keeps the specified phase relationships consistent with the stationary graph. It is intentionally a short cross-transition through silence, not a continuous pitch glide. Rapid slider movement may produce slight amplitude modulation; a more elaborate synthesizer can improve that later.

Master-volume changes are ramped over sample time. The mix uses a fixed gain of 0.2: four full-amplitude waves can reach at most 0.8 before master volume. It does not automatically normalize each experiment, which would obscure relative loudness differences. Initial master volume is 15%, with a UI ceiling of 50%.

Stop fades the signal out before suspending the context. Returning to Play reuses the context. Hiding the tab stops playback. Component cleanup closes the context. Generation counters prevent an unfinished asynchronous Play operation from restarting audio after Stop or cleanup.

## What the tests establish

- Unit tests check quarter-cycle amplitude, reinforcement, cancellation, the beat identity, mute/empty input, RMS output, frequency changes, stop fades, and clipping bounds.
- Browser tests check control editing, numeric validation, keyboard input, drawing updates, wave limits, empty/reset states, responsive layout, and playback lifecycle.
- A browser audio test loads the actual worklet and measures its output with an AnalyserNode: equal waves produce the expected RMS, and opposite waves cancel.
- A production build checks TypeScript and bundles the application, fonts, and worklet into static files.

These checks verify generated signals, not the quality or loudness of a user's physical speakers. Chromium is the automated browser target for Day 1; wider browser/device testing belongs to release preparation.

## Scope after Day 1

The prototype has one default experiment and contextual hints. It does not yet include the ideal frequency-components plot, four selectable presets, URL sharing, or Cloudflare deployment. No authentication or server storage is planned for the first release.
