import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto('http://localhost:5174/');
await page.waitForTimeout(600);

const btns = await page.$$('.toggle-btn');
await btns[5].click(); // Hard
await page.waitForTimeout(100);
await page.click('.btn-play');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(500);

// Silhouette state before answer
await page.screenshot({ path: '/tmp/hard-reveal-before.png', fullPage: false });
const filterBefore = await page.$eval('.player-img', el => getComputedStyle(el).filter);
console.log('Filter before answer:', filterBefore);

// Answer
await page.click('.answer-btn:first-child');
await page.waitForTimeout(150);
const filterMid = await page.$eval('.player-img', el => getComputedStyle(el).filter).catch(() => 'gone');
console.log('Filter 150ms into reveal:', filterMid);
await page.screenshot({ path: '/tmp/hard-reveal-mid.png', fullPage: false });

await page.waitForTimeout(500);
const filterEnd = await page.$eval('.player-img', el => getComputedStyle(el).filter).catch(() => 'advanced');
console.log('Filter at 650ms (end of reveal):', filterEnd);
await page.screenshot({ path: '/tmp/hard-reveal-end.png', fullPage: false });

await browser.close();
