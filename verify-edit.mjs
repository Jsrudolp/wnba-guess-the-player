import { chromium } from 'playwright';
import fs from 'fs';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto('http://localhost:5174/#admin');
await page.waitForTimeout(800);
await page.fill('.admin-login-input', 'WNBA1');
await page.click('.admin-login-btn');
await page.waitForTimeout(1200);

// Verify table loaded via API
const rowCount = await page.$$eval('.admin-row', r => r.length);
console.log('Rows loaded from API:', rowCount);
await page.screenshot({ path: '/tmp/edit-loaded.png', fullPage: false });

// Hover first row to reveal Edit button, then click
await page.hover('.admin-row:first-child');
await page.waitForTimeout(200);
await page.click('.admin-row:first-child .admin-btn-edit');
await page.waitForTimeout(300);
const editRowVisible = await page.isVisible('.admin-row-editing');
console.log('Edit row visible:', editRowVisible);
await page.screenshot({ path: '/tmp/edit-row.png', fullPage: false });

// Change all-star toggle
const toggleText = await page.textContent('.admin-allstar-toggle');
console.log('All-star toggle initial:', toggleText);
await page.click('.admin-allstar-toggle');
const toggleAfter = await page.textContent('.admin-allstar-toggle');
console.log('All-star toggle after click:', toggleAfter);

// Save
await page.click('.admin-btn-save');
await page.waitForTimeout(600);
const editGone = !(await page.isVisible('.admin-row-editing'));
console.log('Edit row gone after save:', editGone);

// Verify the change persisted: check header all-stars count changed
const allStarsVal = await page.$$eval('.admin-stat-val', els => els.map(e => e.textContent));
console.log('Stats after save:', allStarsVal);
await page.screenshot({ path: '/tmp/edit-saved.png', fullPage: false });

// Test Add Player
await page.click('.admin-add-btn');
await page.waitForTimeout(300);
const newRowVisible = await page.isVisible('.admin-row-editing');
console.log('New player row visible:', newRowVisible);
await page.fill('.admin-edit-input', 'Test Player');
await page.selectOption('.admin-edit-select', 'Chicago Sky');
await page.screenshot({ path: '/tmp/edit-new-player.png', fullPage: false });

// Cancel new player
await page.click('.admin-btn-cancel');
await page.waitForTimeout(200);
const newRowGone = !(await page.isVisible('.admin-row-editing'));
console.log('New player row gone after cancel:', newRowGone);

// Revert the all-star change we made
await page.hover('.admin-row:first-child');
await page.waitForTimeout(200);
await page.click('.admin-row:first-child .admin-btn-edit');
await page.waitForTimeout(200);
const toggleNow = await page.textContent('.admin-allstar-toggle');
if (toggleNow === 'All-Star') {
  await page.click('.admin-allstar-toggle');
}
await page.click('.admin-btn-save');
await page.waitForTimeout(600);
console.log('Reverted all-star change');

await browser.close();
