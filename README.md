# Wavefold

Build a sound, see what it's made of.

[Open Wavefold](https://wavefold.pages.dev/) · [Source](https://github.com/sroko/wavefold)

A free, open-source instrument for exploring how sine waves combine. No accounts, database, or backend. All signal calculations and audio run in your browser; fonts are bundled locally.

## Try it

Press **Play sound** to hear the default 220 Hz and 224 Hz waves. Change the second frequency to 222 Hz to slow the beats. Try **Cancellation** to see and hear two opposite-phase waves cancel, or **Harmonics** to explore a richer sound. **Share experiment** creates a link containing your settings; opening it never starts sound.

- Up to four sine waves, each with frequency (20–2,000 Hz), amplitude, phase, and mute controls.
- Combined waveform, individual overlays, adjustable time window, and ideal frequency spectrum.
- Four guided presets: Pure tone, Beats, Cancellation, and Harmonics.
- Keyboard controls, responsive layout, and shareable experiments.

The first-release feature scope is frozen. Microphone input, uploads, custom wave drawing, filters, exports, and Fourier-circle animations are outside this release.

## Run locally

Requires Node.js 22.12+ and npm (developed with Node.js 24).

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. Audio requires HTTPS or localhost and a browser supporting AudioContext and AudioWorklet. Playback starts only after pressing Play and stops when you leave the tab. Start at a comfortable device volume.

Tab moves through controls; arrow keys adjust focused sliders. Enter or Space activates buttons. Escape closes the share dialog and restores focus to Share.

## Validate

```sh
npm run typecheck
npm test
npx playwright install chromium firefox webkit
npm run test:browser
npm run format:check
```

Browser tests build and serve the production bundle, then check presets, signal edits, audio, sharing, keyboard access, narrow layouts, and automated WCAG accessibility rules. Linux environments may need `npx playwright install --with-deps`.

The Windows Playwright WebKit build lacks Web Audio. Its two audio-specific tests skip explicitly; other WebKit tests verify the interface and graceful unsupported-audio message. Chromium and Firefox exercise the actual bundled AudioWorklet. Real Safari/iOS audio remains a manual validation gap. Automated accessibility tests do not establish full accessibility conformance.

## Deploy to Cloudflare Pages

```sh
npx wrangler login
npm run deploy
```

The deploy script builds `dist/` and uploads it to the existing `wavefold` Pages project on the production branch. It supports deploying local uncommitted changes; deployment does not commit or push Git changes. Publishing requires access to the project's Cloudflare account.

For your own fork, create your own Pages project and change `--project-name` in the deploy script. This project uses direct asset upload, not automatic Git deployment. Cloudflare direct-upload projects cannot later switch to Git integration; create a new project if you need that workflow. No runtime secrets or environment variables are needed.

For a local production preview:

```sh
npm run build
npm run preview
```

## How it works

React and TypeScript manage the controls. Canvas draws the waveform; SVG draws the ideal spectrum. Every wave uses `A sin(2πft + φ)`. Equal-frequency components combine as phase vectors before their spectral magnitude is displayed, so opposite phases cancel correctly. This is an analytical line spectrum, not an FFT or a microphone measurement.

The Web Audio worklet shares the waveform's signal function. Edits fade down for 5 ms before resetting the phase reference and fading back in. Fixed headroom keeps four full-amplitude waves below clipping. Master volume affects listening only, not the mathematical graphs.

## Contributing

Open an issue with a reproducible example, browser/version, and an experiment link when useful. For a code change, run the validation commands above and explain the behavior it fixes. Please discuss feature additions first to keep the instrument focused.

## License

MIT. See [LICENSE](LICENSE).
