import { test, expect } from '@playwright/test';
test('overview renders fixed three-column groups and a mobile game remains usable', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 1100 });
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('.game-card')).toHaveCount(21);
  for (const grid of await page.locator('.game-grid').all())
    expect(
      (await grid.evaluate((node) => getComputedStyle(node).gridTemplateColumns)).split(' '),
    ).toHaveLength(3);
  await page.screenshot({ path: testInfo.outputPath('overview.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('Working-Memory/Picture-Span/');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  const slider = page.locator('#display-scale');
  const before = await page.locator('#memory-frame').boundingBox();
  await slider.fill('50');
  await slider.dispatchEvent('input');
  const after = await page.locator('#memory-frame').boundingBox();
  expect(after.height).toBeLessThan(before.height * 0.7);
  await page.screenshot({ path: testInfo.outputPath('picture-mobile.png'), fullPage: true });
});
