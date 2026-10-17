import { expect, test } from '@playwright/test';

test('starts silently, redraws with edits, and plays and stops without errors', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'A little room for sound.' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Play sound' })).toBeEnabled();
  const canvas = page.getByRole('img', { name: /Combined waveform/ });
  const before = await canvas.evaluate((node: HTMLCanvasElement) =>
    node.toDataURL(),
  );
  const wave2 = page.getByRole('region', { name: 'Wave 2', exact: true });
  await wave2.getByRole('spinbutton', { name: 'Frequency value' }).fill('222');
  await wave2
    .getByRole('spinbutton', { name: 'Frequency value' })
    .press('Enter');
  await expect(
    wave2.getByRole('slider', { name: 'Frequency', exact: true }),
  ).toHaveValue('222');
  await expect(page.getByText('2 Hz apart', { exact: true })).toBeVisible();
  const after = await canvas.evaluate((node: HTMLCanvasElement) =>
    node.toDataURL(),
  );
  expect(after).not.toBe(before);
  await page.getByRole('button', { name: 'Play sound' }).click();
  await expect(page.getByRole('button', { name: 'Stop sound' })).toBeVisible();
  await page.getByRole('button', { name: 'Stop sound' }).click();
  await expect(page.getByRole('button', { name: 'Play sound' })).toBeVisible();
  await page.getByRole('button', { name: 'Play sound' }).click();
  await expect(page.getByRole('button', { name: 'Stop sound' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('clamps typed values, supports keyboard controls, mute, four waves, empty state, and reset', async ({
  page,
}) => {
  await page.goto('/');
  const wave1 = page.getByRole('region', { name: 'Wave 1', exact: true });
  const frequency = wave1.getByRole('spinbutton', { name: 'Frequency value' });
  await frequency.fill('99999');
  await frequency.press('Enter');
  await expect(frequency).toHaveValue('2000');
  await frequency.fill('');
  await frequency.press('Enter');
  await expect(frequency).toHaveValue('2000');
  const phase = wave1.getByRole('slider', { name: 'Phase', exact: true });
  await phase.focus();
  await phase.press('ArrowRight');
  await expect(phase).toHaveValue('1');
  await page.getByRole('button', { name: 'Mute wave 1', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Unmute wave 1', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Add a wave' }).click();
  await page.getByRole('button', { name: 'Add a wave' }).click();
  await expect(
    page.getByRole('button', { name: 'Four waves in the mix' }),
  ).toBeDisabled();
  for (let i = 1; i <= 4; i++)
    await page
      .getByRole('button', { name: `Remove wave ${i}`, exact: true })
      .click();
  await expect(
    page.getByText('A quiet canvas. Add a sine wave to get started.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Reset experiment' }).click();
  await expect(frequency).toHaveValue('220');
  await expect(page.getByRole('combobox', { name: 'Time window' })).toHaveValue(
    '0.5',
  );
});

test('fits a mobile viewport and exposes working controls', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole('combobox', { name: 'Time window' })
    .selectOption('0.01');
  await expect(
    page.getByRole('img', { name: /Combined waveform over 10 milliseconds/ }),
  ).toBeVisible();
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true });
});

test('renders the real bundled worklet with expected sound and cancellation', async ({
  page,
}) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    // Exercise the worklet bundle in an actual browser audio graph, not just a mock.
    const imported = await import('/src/audio/processor.ts?worker&url');
    const render = async (phase: number) => {
      const context = new AudioContext({ sampleRate: 48000 });
      await context.resume();
      await context.audioWorklet.addModule(imported.default);
      const node = new AudioWorkletNode(context, 'wavefold-synth', {
        outputChannelCount: [1],
      });
      const analyser = context.createAnalyser();
      analyser.fftSize = 16384;
      node.connect(analyser);
      analyser.connect(context.destination);
      node.port.postMessage({
        type: 'waves',
        waves: [
          { id: 0, frequency: 220, amplitude: 1, phase: 0, muted: false },
          { id: 1, frequency: 220, amplitude: 1, phase, muted: false },
        ],
      });
      node.port.postMessage({ type: 'volume', volume: 1 });
      node.port.postMessage({ type: 'playing', playing: true });
      await new Promise((resolve) => setTimeout(resolve, 650));
      const samples = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(samples);
      const rms = Math.sqrt(
        samples.reduce((sum, v) => sum + v * v, 0) / samples.length,
      );
      await context.close();
      return rms;
    };
    return { inPhase: await render(0), cancelled: await render(180) };
  });
  expect(result.inPhase).toBeCloseTo(0.4 / Math.sqrt(2), 2);
  expect(result.cancelled).toBeLessThan(1e-8);
});
