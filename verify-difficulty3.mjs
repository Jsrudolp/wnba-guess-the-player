import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

// Capture console errors
page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE ERR:', m.text()) });
page.on('pageerror', e => console.log('PAGE ERR:', e.message));

// Hard mode
await page.goto('http://localhost:5174/');
await page.waitForTimeout(600);
const allBtns = await page.$$('.toggle-btn');
await allBtns[5].click(); // Hard
await page.waitForTimeout(100);
await page.click('.btn-play');
// Wait for image to load
await page.waitForLoadState('networkidle');
await page.waitForTimeout(300);

// Check image load status
const imgSrc = await page.$eval('.player-img', el => el.src).catch(() => 'no img');
const imgNaturalW = await page.$eval('.player-img', el => el.naturalWidth).catch(() => -1);
const imgComplete = await page.$eval('.player-img', el => el.complete).catch(() => false);
console.log('Hard: img src snippet:', imgSrc.slice(-40), '| naturalW:', imgNaturalW, '| complete:', imgComplete);
const imgFilter = await page.$eval('.player-img', el => getComputedStyle(el).filter);
console.log('Hard: computed filter:', imgFilter);
const wrapBg = await page.$eval('.player-image-wrap', el => getComputedStyle(el).backgroundColor);
console.log('Hard: wrap bg:', wrapBg);

await page.screenshot({ path: '/tmp/hard3.png', fullPage: false });

// Medium mode
await page.goto('http://localhost:5174/');
await page.waitForTimeout(600);
const btns2 = await page.$$('.toggle-btn');
await btns2[4].click(); // Medium
await page.waitForTimeout(100);
await page.click('.btn-play');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000);

const medFilter = await page.$eval('.player-img', el => getComputedStyle(el).filter);
console.log('Medium settled filter:', medFilter);
await page.screenshot({ path: '/tmp/medium3-before.png', fullPage: false });

await page.click('.answer-btn:first-child');
await page.waitForTimeout(200);
const medFilterAfter = await page.$eval('.player-img', el => getComputedStyle(el).filter).catch(() => 'gone');
console.log('Medium filter 200ms after answer (mid-reveal):', medFilterAfter);
await page.screenshot({ path: '/tmp/medium3-mid.png', fullPage: false });
await page.waitForTimeout(400);
await page.screenshot({ path: '/tmp/medium3-end.png', fullPage: false });

await browser.close();
