import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

// --- Diagnose hard mode ---
await page.goto('http://localhost:5174/');
await page.waitForTimeout(800);

// Check difficulty toggle buttons
const diffToggles = await page.$$eval('.toggle-group', groups =>
  groups.map(g => g.innerText.split('\n'))
);
console.log('Toggle groups:', JSON.stringify(diffToggles));

// Select Hard
const allToggleBtns = await page.$$('.toggle-btn');
const labels = await Promise.all(allToggleBtns.map(b => b.textContent()));
console.log('All toggle buttons:', labels);

// Click Hard (last toggle button)
await allToggleBtns[allToggleBtns.length - 1].click();
await page.waitForTimeout(100);
await page.click('.btn-play');
await page.waitForTimeout(500);

// Check the data-difficulty attribute on wrapper
const wrapAttr = await page.$eval('.player-image-wrap', el => el.getAttribute('data-difficulty'));
const imgAttr = await page.$eval('.player-img', el => el.getAttribute('data-difficulty'));
const wrapBg = await page.$eval('.player-image-wrap', el => getComputedStyle(el).backgroundColor);
console.log('Hard: wrap data-difficulty:', wrapAttr, '| img data-difficulty:', imgAttr, '| bg:', wrapBg);

// Screenshot hard mode at different points
await page.screenshot({ path: '/tmp/hard2-t0.png', clip: { x: 0, y: 0, width: 390, height: 460 } });
await page.waitForTimeout(100);
await page.screenshot({ path: '/tmp/hard2-t100.png', clip: { x: 0, y: 0, width: 390, height: 460 } });

// --- Diagnose medium mode ---
await page.goto('http://localhost:5174/');
await page.waitForTimeout(500);

const allBtns2 = await page.$$('.toggle-btn');
const lbls2 = await Promise.all(allBtns2.map(b => b.textContent()));
// Find Medium button
const medIdx = lbls2.findIndex(l => l.trim() === 'Medium');
console.log('Medium button index:', medIdx, '| labels:', lbls2);
await allBtns2[medIdx].click();
await page.waitForTimeout(100);
await page.click('.btn-play');
await page.waitForTimeout(900);

// Get difficulty from badge
const badge = await page.textContent('.difficulty-badge').catch(() => null);
console.log('Difficulty badge:', badge);

await page.screenshot({ path: '/tmp/medium2-before.png', clip: { x: 0, y: 0, width: 390, height: 460 } });
await page.click('.answer-btn:first-child');
await page.waitForTimeout(100);
const imgClass = await page.$eval('.player-img', el => el.className).catch(() => null);
console.log('Img class 100ms after answer:', imgClass);
await page.screenshot({ path: '/tmp/medium2-answer.png', clip: { x: 0, y: 0, width: 390, height: 460 } });
await page.waitForTimeout(450);
await page.screenshot({ path: '/tmp/medium2-revealed.png', clip: { x: 0, y: 0, width: 390, height: 460 } });

await browser.close();
