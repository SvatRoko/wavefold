import { expect, test } from '@playwright/test';

test('all presets apply their settings and cancellation removes the spectral line', async ({
  page,
}) => {
  await page.goto('/');
  const presets = page.getByRole('navigation', { name: 'Experiments' });
  const spectrum = page.getByRole('region', { name: 'What’s in the mix?' });
  await expect(spectrum.locator('.spectrum-component')).toHaveCount(2);
  await presets.getByRole('button', { name: /Pure tone/ }).click();
  await expect(page.locator('.wave-card')).toHaveCount(1);
  await expect(
    page.getByRole('img', {
      name: /Frequency components: 220 Hz at amplitude 0.7/,
    }),
  ).toBeVisible();
  await presets.getByRole('button', { name: /Cancellation/ }).click();
  await expect(spectrum.locator('.spectrum-component')).toHaveCount(0);
  await expect(spectrum.getByText('cancelled', { exact: true })).toBeVisible();
  const phase = page
    .getByRole('region', { name: 'Wave 2', exact: true })
    .getByRole('spinbutton', { name: 'Phase value' });
  await phase.fill('0');
  await phase.press('Enter');
  await expect(
    page.getByRole('img', {
      name: /Frequency components: 220 Hz at amplitude 1.4/,
    }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Reset experiment' }).click();
  await expect(phase).toHaveValue('180');
  await expect(spectrum.locator('.spectrum-component')).toHaveCount(0);
  await presets.getByRole('button', { name: /Harmonics/ }).click();
  await expect(page.locator('.wave-card')).toHaveCount(4);
  await expect(spectrum.locator('.spectrum-component')).toHaveCount(4);
  await expect(
    page.getByRole('button', { name: 'Four waves in the mix' }),
  ).toBeDisabled();
  await presets.getByRole('button', { name: /Beats/ }).click();
  await expect(page.locator('.wave-card')).toHaveCount(2);
  await expect(page.getByRole('combobox', { name: 'Time window' })).toHaveValue(
    '0.5',
  );
  await page
    .getByRole('combobox', { name: 'Frequency range' })
    .selectOption('full');
  await page.getByRole('button', { name: 'Reset view' }).click();
  await expect(
    page.getByRole('combobox', { name: 'Frequency range' }),
  ).toHaveValue('auto');
});

test('shared links restore a modified experiment and views with sound off', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Harmonics/ }).click();
  const phase = page
    .getByRole('region', { name: 'Wave 3', exact: true })
    .getByRole('spinbutton', { name: 'Phase value' });
  await phase.fill('91');
  await phase.press('Enter');
  await page.getByRole('button', { name: 'Mute wave 2', exact: true }).click();
  await page
    .getByRole('combobox', { name: 'Time window' })
    .selectOption('0.05');
  await page
    .getByRole('combobox', { name: 'Frequency range' })
    .selectOption('full');
  await page.getByRole('checkbox', { name: 'Show individual waves' }).uncheck();
  if (await page.evaluate(() => 'AudioContext' in window)) {
    await page.getByRole('button', { name: 'Play sound' }).click();
    await page.getByRole('button', { name: 'Stop sound' }).waitFor();
  }
  await page.getByRole('button', { name: 'Share experiment' }).click();
  const link = await page
    .getByRole('textbox', { name: 'Experiment link' })
    .inputValue();
  const recipient = await context.newPage();
  await recipient.goto(link);
  await expect(
    recipient.getByText('Shared experiment loaded.', { exact: false }),
  ).toBeVisible();
  await expect(
    recipient.getByRole('button', { name: 'Play sound' }),
  ).toBeVisible();
  await expect(
    recipient
      .getByRole('region', { name: 'Wave 3', exact: true })
      .getByRole('spinbutton', { name: 'Phase value' }),
  ).toHaveValue('91');
  await expect(
    recipient.getByRole('button', { name: 'Unmute wave 2', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    recipient.getByRole('combobox', { name: 'Time window' }),
  ).toHaveValue('0.05');
  await expect(
    recipient.getByRole('combobox', { name: 'Frequency range' }),
  ).toHaveValue('full');
  await expect(
    recipient.getByRole('checkbox', { name: 'Show individual waves' }),
  ).not.toBeChecked();
  await expect(
    recipient.getByRole('slider', { name: 'Master volume' }),
  ).toHaveValue('0.15');
});

test('copy succeeds, clipboard denial has a manual fallback, and Escape closes the dialog', async ({
  page,
}) => {
  await page.goto('/');
  await page.evaluate(() =>
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          (window as unknown as { copied: string }).copied = text;
        },
      },
    }),
  );
  await page.getByRole('button', { name: 'Share experiment' }).click();
  await page.getByRole('button', { name: 'Copy link' }).click();
  await expect(
    page.getByText('Copied. Your experiment is ready to share.'),
  ).toBeVisible();
  expect(
    await page.evaluate(() => (window as unknown as { copied: string }).copied),
  ).toContain('#experiment=');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Share experiment' }),
  ).toBeFocused();
  await page.evaluate(() =>
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error('denied');
        },
      },
    }),
  );
  await page.getByRole('button', { name: 'Share experiment' }).click();
  await page.getByRole('button', { name: 'Copy link' }).click();
  await expect(
    page.getByText(/Automatic copying is unavailable/),
  ).toBeVisible();
  await expect(
    page.getByRole('textbox', { name: 'Experiment link' }),
  ).toBeFocused();
});

test('bad incoming links fall back safely and later hash navigation reloads an experiment', async ({
  page,
}) => {
  await page.goto('/#experiment=%ZZ');
  await expect(
    page.getByText(/This experiment link could not be read/),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /02 Beats/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: /Pure tone/ }).click();
  await page.getByRole('button', { name: 'Share experiment' }).click();
  const link = await page
    .getByRole('textbox', { name: 'Experiment link' })
    .inputValue();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /Harmonics/ }).click();
  await page.evaluate((hash) => {
    window.location.hash = hash;
  }, new URL(link).hash);
  await expect(page.locator('.wave-card')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Play sound' })).toBeVisible();
});

test('complete workspace and share dialog fit small screens', async ({
  page,
}) => {
  for (const width of [360, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.getByRole('button', { name: /Harmonics/ }).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByRole('img', { name: /Frequency components/ }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Share experiment' }).click();
    const box = await page.getByRole('dialog').boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    await page.keyboard.press('Escape');
  }
});
