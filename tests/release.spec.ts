import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('presets and sharing meet automated accessibility checks', async ({
  page,
}) => {
  await page.goto('/');
  for (const name of ['Pure tone', 'Beats', 'Cancellation', 'Harmonics']) {
    await page
      .getByRole('navigation', { name: 'Experiments' })
      .getByRole('button', { name: new RegExp(name) })
      .click();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      results.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    ).toEqual([]);
  }
  await page.getByRole('button', { name: 'Share experiment' }).click();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
});

test('keyboard playback, modal focus, mute, and narrow layout remain usable', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');
  const play = page.getByRole('button', { name: 'Play sound' });
  await play.focus();
  await page.keyboard.press('Enter');
  if (await page.evaluate(() => 'AudioContext' in window)) {
    await expect(
      page.getByRole('button', { name: 'Stop sound' }),
    ).toBeVisible();
    await page.keyboard.press('Enter');
  } else
    await expect(page.getByRole('alert')).toContainText('Audio is unavailable');
  await expect(play).toBeVisible();
  await page.getByRole('button', { name: 'Share experiment' }).focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    expect(
      await dialog.evaluate((element) =>
        element.contains(document.activeElement),
      ),
    ).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Share experiment' }),
  ).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('rapid edits and repeated playback produce no browser errors', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  test.skip(
    !(await page.evaluate(() => 'AudioContext' in window)),
    'The Windows WebKit test build has no Web Audio implementation.',
  );
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: 'Play sound' }).click();
    const frequency = page
      .getByRole('region', { name: 'Wave 2', exact: true })
      .getByRole('slider', { name: 'Frequency', exact: true });
    await frequency.focus();
    for (let j = 0; j < 12; j++) await page.keyboard.press('ArrowRight');
    await page.getByRole('button', { name: 'Stop sound' }).click();
  }
  expect(errors).toEqual([]);
});
