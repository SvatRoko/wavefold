import processorUrl from './processor.ts?worker&url';
import type { Wave } from '../signal';
import type { AudioMessage } from './processor';

/** Owns the browser audio resources; React only sends small control messages. */
export class AudioEngine {
  private context: AudioContext | null = null;
  private node: AudioWorkletNode | null = null;
  private initializing: Promise<void> | null = null;
  private stopTimer: ReturnType<typeof setTimeout> | undefined;
  private generation = 0;

  private async initialize() {
    if (this.node) return;
    if (this.initializing) return this.initializing;
    const context = (this.context ??= new AudioContext());
    this.initializing = (async () => {
      await context.audioWorklet.addModule(processorUrl);
      if (this.context !== context || context.state === 'closed') return;
      this.node = new AudioWorkletNode(context, 'wavefold-synth', {
        outputChannelCount: [1],
      });
      this.node.connect(context.destination);
    })();
    try {
      await this.initializing;
    } finally {
      this.initializing = null;
    }
  }

  async play(waves: Wave[], volume: number) {
    const generation = ++this.generation;
    clearTimeout(this.stopTimer);
    // Create/resume inside the click handler to honor browser autoplay policies.
    this.context ??= new AudioContext();
    const resume = this.context.resume();
    await Promise.all([this.initialize(), resume]);
    if (generation !== this.generation) return;
    this.setWaves(waves);
    this.setVolume(volume);
    this.send({ type: 'playing', playing: true });
  }

  stop() {
    ++this.generation;
    this.send({ type: 'playing', playing: false });
    clearTimeout(this.stopTimer);
    this.stopTimer = setTimeout(() => {
      void this.context?.suspend().catch(() => {});
    }, 30);
  }

  setWaves(waves: Wave[]) {
    this.send({ type: 'waves', waves });
  }
  setVolume(volume: number) {
    this.send({ type: 'volume', volume });
  }
  private send(message: AudioMessage) {
    this.node?.port.postMessage(message);
  }

  dispose() {
    ++this.generation;
    clearTimeout(this.stopTimer);
    this.node?.disconnect();
    void this.context?.close().catch(() => {});
    this.node = null;
    this.context = null;
  }
}
