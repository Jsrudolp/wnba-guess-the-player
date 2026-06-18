import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto('http://localhost:5175/#admin');
await page.waitForTimeout(800);

// Auth
await page.fill('.admin-login-input', 'WNBA1');
await page.click('.admin-login-btn');
await page.waitForTimeout(1000);

// Filter: No Photo
await page.selectOption('.admin-select:nth-of-type(2)', 'no');
await page.waitForTimeout(300);
const noPhotoRows = await page.$$eval('.admin-row', r => r.length);
const resultsLabel = await page.textContent('.admin-results-count');
await page.screenshot({ path: '/tmp/filter-no-photo.png', fullPage: false });
console.log('No-photo filter — rows:', noPhotoRows, '| label:', resultsLabel);

// Check Clear button appears
const clearVisible = await page.isVisible('.admin-clear-btn');
console.log('Clear button visible:', clearVisible);

// Filter: Team = Chicago Sky
await page.selectOption('.admin-select:nth-of-type(1)', 'Chicago Sky');
await page.waitForTimeout(300);
const skyRows = await page.$$eval('.admin-row', r => r.length);
await page.screenshot({ path: '/tmp/filter-team.png', fullPage: false });
console.log('Chicago Sky + no-photo — rows:', skyRows);

// Clear filters
await page.click('.admin-clear-btn');
await page.waitForTimeout(300);
const afterClear = await page.$$eval('.admin-row', r => r.length);
const clearGone = !(await page.isVisible('.admin-clear-btn'));
console.log('After clear — rows:', afterClear, '| clear btn gone:', clearGone);

// Filter: All-Stars only
await page.selectOption('.admin-select:nth-of-type(3)', 'yes');
await page.waitForTimeout(300);
const allStarRows = await page.$$eval('.admin-row', r => r.length);
await page.screenshot({ path: '/tmp/filter-allstars.png', fullPage: false });
console.log('All-Stars only — rows:', allStarRows);

await browser.close();
