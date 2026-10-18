# Wavefold — Day 2 walkthrough

Day 2 completes the first-release feature set: an ideal spectrum, four guided presets, explanations, shareable links, and responsive layout. Day 1 is committed and pushed as `e19b9b9`; Day 2 changes are intentionally left uncommitted for review.

## Try the complete experience

1. Open Wavefold. Beats remains the default experiment: 220 Hz and 224 Hz.
2. Press Play. Look at the two separate frequency lines, then change 224 Hz to 222 Hz and hear the pulses slow down.
3. Select Cancellation. Both source waves remain visible, but their combined waveform is flat, the spectrum has no remaining line, and playback is silent. Set Wave 2's phase to 0° to bring back a 220 Hz component with amplitude 1.4.
4. Select Harmonics. Four lines appear at 220, 440, 660, and 880 Hz. Mute the upper harmonics one by one and listen to the tone simplify.
5. Select Pure tone to return to a single sine wave.
6. Edit any experiment, select Share experiment, and copy its link. Opening the link restores the wave controls and graph views, with sound stopped and master volume at 15%.

Preset changes apply immediately while audio is playing. Reset experiment resets the currently selected preset, rather than always returning to Beats. An edited experiment retains its source preset so its explanatory context stays available.

## The frequency spectrum

The waveform answers: “What is the signal's value at each moment?” The spectrum answers: “Which frequencies remain, and with what amplitude?”

We already know every sine wave's frequency, amplitude, and phase. For this release, we can calculate the exact ideal spectrum directly. We do not need an FFT, microphone input, audio playback, or a time-window-dependent frequency estimate.

`src/spectrum.ts` groups active waves by exact frequency. Within each group, it adds two coefficients:

```text
real = Σ amplitude × cos(phase)
imaginary = Σ amplitude × sin(phase)
combined amplitude = sqrt(real² + imaginary²)
```

Phase is converted to radians before using sine and cosine. These coefficients follow from expanding `sin(angle + phase)`. They represent the contributions along two perpendicular phase directions. The length of their sum is the remaining amplitude.

This matters because adding amplitudes alone would be wrong. Two equal 0.7-amplitude waves:

| Phase difference | Remaining amplitude |
| ---------------- | ------------------- |
| 0°               | 1.4                 |
| 90°              | approximately 0.990 |
| 180°             | 0                   |

Very small floating-point remnants below `1e-10` are treated as zero. A cancelled group stays in the textual readout as “cancelled,” but has no spectral line. Muted and zero-amplitude waves are excluded.

## Drawing decisions

`src/components/Spectrum.tsx` draws the spectrum with SVG. The waveform still uses Canvas because it draws many sample points. The spectrum has at most four lines, so SVG makes labels, line descriptions, and responsive scaling straightforward.

The default frequency range fits the active waves with padding. This separates nearby frequencies such as 220 Hz and 224 Hz. Full range uses 0–2,200 Hz, covering the supported 20–2,000 Hz controls with some space at the edge. Reset view returns to automatic fitting. Widely separated components can make nearby lines overlap in the full-range view; the exact frequency/amplitude list remains readable below the plot.

The amplitude axis also fits the signal and is explicitly labeled. Single-wave components use their wave's color. Multiple waves combined at one frequency use the dark combined-signal color. Each plot has an accessible text summary, and exact values appear as ordinary text below it.

The spectrum is independent of the waveform's time window and master playback volume. It describes the mathematical signal, including while playback is stopped.

## Presets and explanations

`src/presets.ts` is the single source for preset settings and descriptions:

- Pure tone: one 220 Hz wave at amplitude 0.7.
- Beats: 220 and 224 Hz, both at amplitude 0.7.
- Cancellation: two 220 Hz waves at amplitude 0.7, with phases 0° and 180°.
- Harmonics: 220, 440, 660, and 880 Hz at amplitudes 0.6, 0.3, 0.2, and 0.15.

Each preset chooses a useful time window. Beats uses 500 ms to reveal the envelope; the others use 10 ms to reveal the waveform shape.

`src/components/ExperimentGuide.tsx` separates the original lesson from a live observation of the current settings. It recognizes silence, cancellation, single tones, beating, same-frequency combination, and harmonic relationships. Editing a preset changes the observation and marks the experiment as edited. A suggested action gives the user something specific to try next.

Expandable help explains the frequency spectrum and the frequency, amplitude, phase, and mute controls without crowding the workspace.

## Share links and restoration

`src/experiment.ts` encodes a versioned JSON object into a URL fragment beginning with `#experiment=`. It contains:

- Wave IDs, frequencies, amplitudes, phases, and mute settings.
- The source preset.
- The waveform time window and individual-wave visibility.
- The spectrum range mode.

The fragment is part of the link and is not sent to the hosting server in ordinary HTTP requests. No database, account, or link-shortening service is needed. Playback state and master volume are deliberately excluded. A recipient always chooses when to start audio.

The decoder treats incoming settings as untrusted data. It checks the schema version, supported preset and view values, maximum payload length, wave count, unique wave IDs, finite numbers, and allowed ranges. It constructs a fresh object using only recognized properties. Invalid or unsupported links show a clear notice and load the default Beats experiment.

The application also responds to fragment changes while it is already open. It stops playback before restoring the new experiment. This covers pasted links and browser navigation within the same page.

`src/components/ShareDialog.tsx` uses a native modal dialog. Copy link calls the clipboard API. If permission is denied or the API is unavailable, the link remains selected for manual copying. Escape and the close button dismiss the dialog and return keyboard focus to Share experiment.

Links use the application's current host. A localhost link is useful on a machine running the local preview; publicly usable links require the eventual Cloudflare deployment. This is hosting behavior, not a separate feature or storage dependency.

## Responsive layout

The desktop layout keeps the waveform and spectrum in the main column, with wave controls beside them. Presets appear in one row. Smaller screens use two preset columns and a stacked workspace. Sharing controls wrap, the modal fits the viewport, and graph labels are drawn against the actual available width.

The spectrum uses ResizeObserver to keep its SVG dimensions current. This avoids shrinking fixed-size text unnecessarily when moving between desktop and mobile widths.

## Tests and evidence

The complete suite contains 18 unit tests and 9 browser tests. Day 2 adds coverage for:

- Exact phase-aware combination, cancellation, close frequencies, and all harmonic components.
- Independence of single-wave spectral magnitude from phase.
- Ignoring muted and zero-amplitude contributions.
- Link round trips for every preset, modified settings, sparse IDs, and an empty canvas.
- Rejection of malformed, oversized, duplicate-ID, unknown-version, and out-of-range link data.
- Applying every preset and resetting the selected experiment.
- Sharing while audio is playing and restoring silently in another page.
- Clipboard success, denial fallback, dialog Escape behavior, and keyboard-focus restoration.
- Invalid-link recovery, in-page fragment navigation, and small-screen layout.

Day 1's mathematical, audio, and browser checks remain in the suite. Automated browser coverage currently uses Chromium. TypeScript checks and the production build validate the complete static bundle.

## Feature freeze

The first-release features are implemented. Day 3 is reserved for release verification, bug fixes, accessibility and browser/device checks, documentation polish, and Cloudflare deployment. No new product features are planned for this release. There are no accounts, backend services, uploads, microphone capture, filters, custom wave drawing, or export tools.

Local commands are unchanged: `npm run dev`, `npm test`, `npm run test:browser`, `npm run typecheck`, and `npm run build`. Use `npm run preview` to inspect the built production files.
