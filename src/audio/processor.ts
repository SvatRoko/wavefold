import { Synth } from './synth';
import type { Wave } from '../signal';

declare const sampleRate: number;
declare class AudioWorkletProcessor {
  readonly port: MessagePort;
}
declare function registerProcessor(
  name: string,
  processor: typeof AudioWorkletProcessor,
): void;

export type AudioMessage =
  | { type: 'waves'; waves: Wave[] }
  | { type: 'playing'; playing: boolean }
  | { type: 'volume'; volume: number };

class WavefoldProcessor extends AudioWorkletProcessor {
  private synth = new Synth(sampleRate);

  constructor() {
    super();
    this.port.onmessage = ({ data }: MessageEvent<AudioMessage>) => {
      if (data.type === 'waves') this.synth.setWaves(data.waves);
      if (data.type === 'playing') this.synth.setPlaying(data.playing);
      if (data.type === 'volume') this.synth.setVolume(data.volume);
    };
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]) {
    const channel = outputs[0]?.[0];
    if (channel)
      for (let index = 0; index < channel.length; index++)
        channel[index] = this.synth.nextSample();
    return true;
  }
}

registerProcessor('wavefold-synth', WavefoldProcessor);
