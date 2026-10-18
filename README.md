# Wavefold

Build a sound, see what it's made of.

Wavefold is a free, open-source signal playground for exploring how sine waves combine. Adjust waves, hear the result, and connect the waveform to its frequency spectrum.

## Project status

Day 2 prototype: a complete browser instrument with up to four sine waves, editable frequency/amplitude/phase, a combined waveform, an ideal frequency spectrum, four guided experiments, share links, and audio playback. The interface uses a light scientific workspace. First-release feature scope is frozen; release testing and Cloudflare deployment come next.

Built with React, TypeScript, Vite, Canvas 2D, and the Web Audio API. Everything runs locally in the browser. There are no accounts, backend services, or database. Fonts are bundled with the application.

The frequency-components view combines waves at the same frequency using their phases, so cancellation is represented correctly. Share links restore experiment settings without starting audio. Links point to whichever host is running the application; localhost links require that local server, and public sharing becomes available after deployment.

## First release

- Up to four sine waves with frequency, amplitude, phase, mute, and remove controls.
- Combined waveform with individual wave overlays and a frequency spectrum.
- Explicit play/stop controls, low initial volume, and smooth audio changes.
- Four experiments: Pure tone, Beats, Cancellation, and Harmonics.
- Shareable links that restore wave settings.
- Desktop and mobile layouts with keyboard-accessible controls.

Microphone input, uploads, custom wave drawing, filters, exports, and Fourier-circle animations are outside the first release.

## Development

Use Node.js 22.12 or newer (developed with Node.js 24) and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Audio requires localhost or HTTPS and starts only after pressing **Play sound**. Switching away from the tab stops playback.

Start with the two default waves at 220 Hz and 224 Hz. Change the second frequency to 222 Hz to slow the beating. Choose a 10 ms time window to inspect individual oscillations. For cancellation, give both waves the same frequency and amplitude, then set one phase to 180 degrees.

```sh
npm run typecheck
npm test
npx playwright install chromium
npm run test:browser
npm run build
npm run preview
```

`npm run format` formats the project; `npm run format:check` checks formatting.

Cloudflare static hosting is the intended deployment target. The production build outputs to `dist/`. The prototype has not been deployed.

## How it works

See the [Day 1 walkthrough](docs/architecture.md) for the signal model, audio lifecycle, plotting decisions, and code map. The [Day 2 walkthrough](docs/day-2-walkthrough.md) covers the spectrum mathematics, presets, URL sharing, responsive layout, test coverage, and frozen release scope.

## License

MIT. See [LICENSE](LICENSE).
