import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });

async function test(label, width, height) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:5174/');
  await page.waitForTimeout(600);
  await page.screenshot({ path: `/tmp/ui-home-${label}.png`, fullPage: false });

  // Start game on easy
  await page.click('.btn-play');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  await page.screenshot({ path: `/tmp/ui-game-${label}.png`, fullPage: false });

  // Check answer layout
  const answers = await page.$$('.answer-btn');
  const firstBox = await answers[0].boundingBox();
  const secondBox = await answers[1].boundingBox();
  const is2x2 = Math.abs(firstBox.y - secondBox.y) < 5; // same row = 2x2
  console.log(`${label} — answers: ${answers.length}, 2×2 grid: ${is2x2}`);

  // Answer a question — check transition
  await page.click('.answer-btn:first-child');
  await page.waitForTimeout(100);
  const frameOpacity = await page.$eval('.question-frame', el => el.style.opacity);
  console.log(`${label} — frame opacity mid-exit: ${frameOpacity || '(transitioning)'}`);
  await page.waitForTimeout(1100);

  // Should now be on question 2 — check entry animation ran
  const counter = await page.textContent('.game-counter').catch(() => null);
  console.log(`${label} — counter after transition: ${counter}`);
  await page.screenshot({ path: `/tmp/ui-q2-${label}.png`, fullPage: false });

  // Play through all 10 questions quickly
  for (let i = 0; i < 9; i++) {
    const btns = await page.$$('.answer-btn');
    if (!btns.length) break;
    await btns[0].click();
    await page.waitForTimeout(1100);
  }
  await page.waitForTimeout(500);
  await page.screenshot({ path: `/tmp/ui-result-${label}.png`, fullPage: false });

  const hasBreakdown = await page.isVisible('.result-breakdown');
  const breakdownItems = await page.$$('.breakdown-item');
  console.log(`${label} — result: breakdown visible: ${hasBreakdown}, items: ${breakdownItems.length}`);

  await ctx.close();
}

await test('mobile', 390, 844);
await test('desktop', 1280, 800);

await browser.close();
