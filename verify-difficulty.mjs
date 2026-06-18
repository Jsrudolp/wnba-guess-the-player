import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto('http://localhost:5174/');
await page.waitForTimeout(800);

// --- HARD MODE ---
await page.click('.toggle-btn:nth-child(3)'); // All Players mode
await page.waitForTimeout(100);
// Select Hard difficulty
await page.click('.toggle-group:last-of-type .toggle-btn:last-child');
await page.waitForTimeout(100);
await page.click('.btn-play');
await page.waitForTimeout(200);

// Screenshot at start of hard question (should show silhouette, not face)
await page.screenshot({ path: '/tmp/hard-t0.png', clip: { x: 0, y: 0, width: 390, height: 460 } });
await page.waitForTimeout(300);
await page.screenshot({ path: '/tmp/hard-t300.png', clip: { x: 0, y: 0, width: 390, height: 460 } });
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/hard-settled.png', clip: { x: 0, y: 0, width: 390, height: 460 } });

// Check container background color in hard mode
const bgColor = await page.$eval('.player-image-wrap', el => getComputedStyle(el).backgroundColor);
console.log('Hard mode container bg:', bgColor);

// --- MEDIUM MODE ---
await page.goto('http://localhost:5174/');
await page.waitForTimeout(500);
await page.click('.toggle-group:last-of-type .toggle-btn:nth-child(2)'); // Medium difficulty
await page.waitForTimeout(100);
await page.click('.btn-play');
await page.waitForTimeout(900); // let initial animation finish

// Screenshot before answer (should be blurry)
await page.screenshot({ path: '/tmp/medium-before-answer.png', clip: { x: 0, y: 0, width: 390, height: 460 } });

// Answer a question
const btns = await page.$$('.answer-btn');
await btns[0].click();
await page.waitForTimeout(100);

// Screenshot mid-reveal (should be unblurring)
await page.screenshot({ path: '/tmp/medium-revealing.png', clip: { x: 0, y: 0, width: 390, height: 460 } });
await page.waitForTimeout(400);
// Screenshot at end of reveal (should be clear)
await page.screenshot({ path: '/tmp/medium-revealed.png', clip: { x: 0, y: 0, width: 390, height: 460 } });

const revealingClass = await page.$eval('.player-img', el => el.className);
console.log('Medium img class after answer:', revealingClass);

await browser.close();
