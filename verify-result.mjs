import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();

await page.goto('http://localhost:5174/');
await page.waitForTimeout(600);
await page.click('.btn-play');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(800);

// Play through all 10 questions — 1500ms per question to be safe
for (let i = 0; i < 10; i++) {
  const btns = await page.$$('.answer-btn');
  if (!btns.length) { console.log(`Q${i+1}: no buttons found`); break; }
  await btns[0].click();
  console.log(`Q${i+1}: answered`);
  await page.waitForTimeout(1500);
}

// Check what screen we're on
const screen = await page.evaluate(() => {
  if (document.querySelector('.result')) return 'result'
  if (document.querySelector('.game')) return 'game'
  if (document.querySelector('.home')) return 'home'
  return 'unknown'
})
console.log('Screen after 10 questions:', screen);

await page.screenshot({ path: '/tmp/result-desktop.png', fullPage: false });

const breakdown = await page.$$('.breakdown-item');
const score = await page.textContent('.result-score-num').catch(() => null);
console.log('Score shown:', score, '| Breakdown items:', breakdown.length);

// Check 5x2 grid layout
if (breakdown.length > 0) {
  const item0 = await breakdown[0].boundingBox();
  const item5 = await breakdown[5]?.boundingBox();
  if (item5) {
    const is2rows = item5.y > item0.y + 10;
    console.log('5×2 grid (2 rows):', is2rows, `| row0 y:${Math.round(item0.y)} row1 y:${Math.round(item5.y)}`);
  }
}

await browser.close();
