import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

// 1. Admin login screen
await page.goto('http://localhost:5175/#admin');
await page.waitForTimeout(1000);
await page.screenshot({ path: '/tmp/admin-login.png', fullPage: true });
const loginTitle = await page.textContent('.admin-login-title').catch(() => null);
const inputVisible = await page.isVisible('.admin-login-input');
console.log('LOGIN — title:', loginTitle, '| input visible:', inputVisible);

// 2. Wrong password
await page.fill('.admin-login-input', 'wrongpass');
await page.click('.admin-login-btn');
await page.waitForTimeout(400);
const errorMsg = await page.textContent('.admin-login-error').catch(() => null);
console.log('Wrong password error:', errorMsg);

// 3. Correct password
await page.fill('.admin-login-input', 'WNBA1');
await page.click('.admin-login-btn');
await page.waitForTimeout(1000);
await page.screenshot({ path: '/tmp/admin-table.png', fullPage: true });
const headerTitle = await page.textContent('.admin-header-title').catch(() => null);
const rowCount = await page.$$eval('.admin-row', rows => rows.length);
const firstRowName = await page.textContent('.admin-row:first-child .admin-td-name').catch(() => null);
const firstRowTeam = await page.textContent('.admin-row:first-child .admin-td-team').catch(() => null);
const thumbVisible = await page.isVisible('.admin-row:first-child .admin-thumb');
const statVals = await page.$$eval('.admin-stat-val', els => els.map(e => e.textContent));
console.log('TABLE — header:', headerTitle, '| rows:', rowCount, '| first name:', firstRowName, '| team:', firstRowTeam, '| thumb visible:', thumbVisible, '| stats:', statVals);

// 4. Search
await page.fill('.admin-search', 'Dream');
await page.waitForTimeout(400);
const filteredRows = await page.$$eval('.admin-row', rows => rows.length);
const resultsCount = await page.textContent('.admin-results-count').catch(() => null);
await page.screenshot({ path: '/tmp/admin-search.png', fullPage: true });
console.log('SEARCH "Dream" — rows:', filteredRows, '| count label:', resultsCount);

// 5. Back to game
await page.fill('.admin-search', '');
await page.click('.admin-back-btn');
await page.waitForTimeout(800);
await page.screenshot({ path: '/tmp/game-home.png', fullPage: true });
const homeTitle = await page.textContent('.home-title').catch(() => null);
console.log('BACK TO GAME — home title:', homeTitle);

// 6. Start a game
await page.click('.btn-play');
await page.waitForTimeout(600);
await page.screenshot({ path: '/tmp/game-playing.png', fullPage: true });
const answerBtns = await page.$$('.answer-btn');
const counter = await page.textContent('.game-counter').catch(() => null);
console.log('GAME — answer buttons:', answerBtns.length, '| counter:', counter);

await browser.close();
