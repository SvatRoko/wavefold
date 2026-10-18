import { INITIAL_WAVES, type Wave } from './signal';

export const TIME_WINDOWS = [0.01, 0.05, 0.1, 0.5, 1] as const;
export type PresetId = 'pure' | 'beats' | 'cancellation' | 'harmonics';
export interface Preset {
  id: PresetId;
  name: string;
  subtitle: string;
  description: string;
  tryThis: string;
  duration: number;
  waves: Wave[];
}
const sine = (
  id: number,
  frequency: number,
  amplitude: number,
  phase = 0,
): Wave => ({ id, frequency, amplitude, phase, muted: false });

export const PRESETS: Preset[] = [
  {
    id: 'pure',
    name: 'Pure tone',
    subtitle: 'One wave. One frequency.',
    duration: 0.01,
    description:
      'A sine wave contains just one frequency. Its height is amplitude, and the number of cycles per second is frequency.',
    tryThis:
      'Raise the frequency to hear a higher pitch. Change amplitude to hear the same pitch more softly.',
    waves: [sine(0, 220, 0.7)],
  },
  {
    id: 'beats',
    name: 'Beats',
    subtitle: 'Close notes, slow pulses.',
    duration: 0.5,
    description:
      'Two nearby frequencies drift into and out of alignment. Their sum grows and shrinks, creating a pulsing sound.',
    tryThis:
      'Change Wave 2 from 224 Hz to 222 Hz. The beating slows from four pulses per second to two.',
    waves: INITIAL_WAVES.map((w) => ({ ...w })),
  },
  {
    id: 'cancellation',
    name: 'Cancellation',
    subtitle: 'Two waves can make silence.',
    duration: 0.01,
    description:
      'Equal sine waves at the same frequency cancel when their phases differ by 180°. Their sum is zero, so no frequency component remains.',
    tryThis:
      'Move Wave 2’s phase away from 180°. Watch the frequency component return and listen to the sound grow.',
    waves: [sine(0, 220, 0.7), sine(1, 220, 0.7, 180)],
  },
  {
    id: 'harmonics',
    name: 'Harmonics',
    subtitle: 'Build a richer tone.',
    duration: 0.01,
    description:
      'Harmonics are whole-number multiples of a fundamental frequency. Adding them changes the shape of a repeating wave and the character of its sound.',
    tryThis:
      'Mute Waves 2, 3, and 4, then bring them back one at a time. Listen to the tone gain texture.',
    waves: [
      sine(0, 220, 0.6),
      sine(1, 440, 0.3),
      sine(2, 660, 0.2),
      sine(3, 880, 0.15),
    ],
  },
];

export function getPreset(id: PresetId): Preset {
  return PRESETS.find((preset) => preset.id === id)!;
}
export function matchesPreset(waves: Wave[], id: PresetId): boolean {
  const original = getPreset(id).waves;
  return (
    waves.length === original.length &&
    waves.every((wave, index) => {
      const other = original[index];
      return (
        wave.id === other.id &&
        wave.frequency === other.frequency &&
        wave.amplitude === other.amplitude &&
        wave.phase === other.phase &&
        wave.muted === other.muted
      );
    })
  );
}
