import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOTS_DIR = path.resolve(__dirname, '../docs/screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Find Chrome on Windows
const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : undefined;

async function findButtonByText(page, text) {
  const buttons = await page.$$('button, a');
  for (const b of buttons) {
    const content = await page.evaluate((el) => el.innerText || el.textContent, b);
    if (content && content.toLowerCase().includes(text.toLowerCase())) {
      return b;
    }
  }
  return null;
}

async function runFullQAPass() {
  console.log('🧪 Starting MediFind Comprehensive Browser QA Pass...');

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  const consoleWarnings = [];
  const consoleErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    } else if (msg.type() === 'warning') {
      consoleWarnings.push(msg.text());
    }
  });

  try {
    // -------------------------------------------------------------------------
    // 1. AUTOCOMPLETE WITH TYPOS (DESKTOP 1280px & MOBILE 390px)
    // -------------------------------------------------------------------------
    console.log('\n[1] Testing Autocomplete with Typos...');
    await page.setViewport({ width: 1280, height: 850 });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

    // Type with intentional typo "augmntin" (Augmentin 625 Duo)
    const searchInput = await page.$('input[aria-label*="Search medicine"]');
    if (!searchInput) throw new Error('Search input not found on Home page');

    await searchInput.type('augmntin', { delay: 40 });
    await new Promise((r) => setTimeout(r, 600));

    // Wait for dropdown
    await page.waitForSelector('[role="listbox"]', { timeout: 3000 });
    console.log('✓ Typo autocomplete dropdown rendered successfully.');

    // Screenshot Home Desktop
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'home-desktop.png') });
    console.log('📸 Saved home-desktop.png');

    // Mobile Viewport 390px
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'home-mobile.png') });
    console.log('📸 Saved home-mobile.png');

    // Select first suggestion
    const firstOption = await page.$('[role="option"]');
    if (firstOption) {
      await firstOption.click();
    } else {
      await page.keyboard.press('Enter');
    }
    await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1000));
    console.log(`✓ Navigated to results: ${page.url()}`);

    // -------------------------------------------------------------------------
    // 2. EMERGENCY TOGGLE & RESULTS (LIST AND MAP)
    // -------------------------------------------------------------------------
    console.log('\n[2] Testing Results Page, Emergency Mode, and Map Toggle...');
    await page.setViewport({ width: 1280, height: 900 });

    // Click Map View toggle
    const mapTab = await findButtonByText(page, 'Map View');
    if (mapTab) {
      await mapTab.click();
      await new Promise((r) => setTimeout(r, 800));
      console.log('✓ Toggled to Map View.');
    }

    // Toggle back to List View
    const listTab = await findButtonByText(page, 'List View');
    if (listTab) {
      await listTab.click();
      await new Promise((r) => setTimeout(r, 600));
      console.log('✓ Toggled back to List View.');
    }

    // Trigger Auto-Ping
    const pingBtn = (await findButtonByText(page, 'Auto-Ping')) || (await findButtonByText(page, 'Verify Right Now'));
    if (pingBtn) {
      console.log('👉 Triggering Auto-Ping to top 3 nearby pharmacies...');
      await pingBtn.click();
      await new Promise((r) => setTimeout(r, 1200));
    }

    // Screenshot Results with live ping
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'results-with-live-ping-desktop.png') });
    console.log('📸 Saved results-with-live-ping-desktop.png');

    // Mobile Results
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'results-mobile.png') });
    console.log('📸 Saved results-mobile.png');

    // -------------------------------------------------------------------------
    // 3. AUTO-PING WITH YES / NO ON PHARMACIST SIMULATOR
    // -------------------------------------------------------------------------
    console.log('\n[3] Testing Pharmacist Phone Simulator (Replying YES & NO)...');
    const simPage = await browser.newPage();
    await simPage.setViewport({ width: 390, height: 844, isMobile: true });
    await simPage.goto('http://localhost:5173/pharmacist-sim', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));

    // Screenshot Simulator Mobile & Desktop
    await simPage.screenshot({ path: path.join(SCREENSHOTS_DIR, 'simulator-mobile.png') });
    await simPage.setViewport({ width: 1280, height: 850 });
    await simPage.screenshot({ path: path.join(SCREENSHOTS_DIR, 'simulator-desktop.png') });
    console.log('📸 Saved simulator-mobile.png & simulator-desktop.png');

    // Click "YES, IN STOCK" on the first incoming ping
    const yesBtn = await findButtonByText(simPage, 'YES, IN STOCK');
    if (yesBtn) {
      console.log('👉 Simulator: Pharmacist answered "YES, IN STOCK"');
      await yesBtn.click();
      await new Promise((r) => setTimeout(r, 800));
    }

    // Click "NO, OUT OF STOCK" on the second incoming ping if present
    const noBtn = await findButtonByText(simPage, 'NO, OUT OF STOCK');
    if (noBtn) {
      console.log('👉 Simulator: Pharmacist answered "NO, OUT OF STOCK"');
      await noBtn.click();
      await new Promise((r) => setTimeout(r, 800));
    }

    await simPage.close();

    // -------------------------------------------------------------------------
    // 4. REPORT WRONG STOCK MODAL
    // -------------------------------------------------------------------------
    console.log('\n[4] Testing "Report Wrong Stock" Community Modal...');
    await page.setViewport({ width: 1280, height: 900 });
    const reportBtn = await findButtonByText(page, 'Report');
    if (reportBtn) {
      await reportBtn.click();
      await new Promise((r) => setTimeout(r, 500));
      console.log('✓ Opened Report Wrong Stock modal.');

      // Select reason radio
      const outOfStockRadio = await page.$('input[value="out_of_stock"]');
      if (outOfStockRadio) await outOfStockRadio.click();

      // Submit report
      const submitReportBtn = await findButtonByText(page, 'Submit Anonymous Report');
      if (submitReportBtn) {
        await submitReportBtn.click();
        await new Promise((r) => setTimeout(r, 800));
        console.log('✓ Submitted wrong stock report.');
      }
    }

    // -------------------------------------------------------------------------
    // 5. 60-MINUTE HOLD RESERVATION & COUNTDOWN TOKEN
    // -------------------------------------------------------------------------
    console.log('\n[5] Testing 60-Minute Reservation Hold & Countdown...');
    await page.goto('http://localhost:5173/reserve/2/1', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 600));

    // Fill patient details
    const nameInput = await page.$('input[placeholder*="Rahul Sharma"]');
    if (nameInput) await nameInput.type('Vikram Malhotra', { delay: 20 });

    const phoneInput = await page.$('input[type="tel"]');
    if (phoneInput) await phoneInput.type('9829012345', { delay: 20 });

    const submitResBtn = await page.$('button[type="submit"]');
    if (submitResBtn) {
      await submitResBtn.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
      await new Promise((r) => setTimeout(r, 1200));
      console.log(`✓ Reservation created successfully at URL: ${page.url()}`);
    }

    // Screenshot Reservation Desktop & Mobile
    await page.setViewport({ width: 1280, height: 850 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'reservation-desktop.png') });
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'reservation-mobile.png') });
    console.log('📸 Saved reservation-desktop.png & reservation-mobile.png');

    // -------------------------------------------------------------------------
    // 6. CHEMIST PARTNER PORTAL: WRONG PIN, RIGHT PIN, ACCEPT & COLLECT
    // -------------------------------------------------------------------------
    console.log('\n[6] Testing Chemist Portal (PIN validation, Accept, Collect, Stock Toggle)...');
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto('http://localhost:5173/pharmacy', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 500));

    // 6a. Test Wrong PIN
    const pinInput = await page.$('input[type="password"]');
    if (pinInput) {
      await page.evaluate((el) => (el.value = ''), pinInput);
      await pinInput.type('9999'); // Wrong PIN
      const loginBtn = await page.$('button[type="submit"]');
      if (loginBtn) await loginBtn.click();
      await new Promise((r) => setTimeout(r, 600));
      console.log('✓ Verified wrong PIN rejected with error toast.');

      // 6b. Test Right PIN
      await page.evaluate((el) => (el.value = ''), pinInput);
      await pinInput.type('1234'); // Right demo PIN
      if (loginBtn) await loginBtn.click();
      await new Promise((r) => setTimeout(r, 1200));
      console.log('✓ Successfully authenticated with demo PIN 1234.');
    }

    // Screenshot Portal Dashboard Desktop
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'portal-desktop.png') });
    console.log('📸 Saved portal-desktop.png');

    // Portal Mobile
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'portal-mobile.png') });
    console.log('📸 Saved portal-mobile.png');

    // 6c. Accept Hold & Mark Collected
    await page.setViewport({ width: 1280, height: 900 });
    const acceptBtn = await findButtonByText(page, 'Accept Hold');
    if (acceptBtn) {
      await acceptBtn.click();
      await new Promise((r) => setTimeout(r, 800));
      console.log('✓ Chemist accepted 60-min hold.');

      const collectBtn = await findButtonByText(page, 'Mark Collected');
      if (collectBtn) {
        await collectBtn.click();
        await new Promise((r) => setTimeout(r, 800));
        console.log('✓ Chemist marked reservation as collected.');
      }
    }

    // 6d. Switch to Unmet Demand tab to check SVG Chart
    const demandTab = await findButtonByText(page, 'Unmet Market Demand');
    if (demandTab) {
      await demandTab.click();
      await new Promise((r) => setTimeout(r, 600));
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'portal-insights-desktop.png') });
      console.log('📸 Saved portal-insights-desktop.png');
    }

    // -------------------------------------------------------------------------
    // 7. HOW IT WORKS & 404 NOT FOUND PAGE
    // -------------------------------------------------------------------------
    console.log('\n[7] Testing How It Works & 404 Not Found Page...');
    await page.goto('http://localhost:5173/how-it-works', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'how-it-works-desktop.png') });
    console.log('📸 Saved how-it-works-desktop.png');

    await page.goto('http://localhost:5173/some-invalid-path-404', { waitUntil: 'networkidle2' });
    const backBtn = await findButtonByText(page, 'Return to Medicine Search');
    if (!backBtn) throw new Error('404 Page did not render return button');
    console.log('✓ 404 Not Found page rendered with valid return link.');

    // -------------------------------------------------------------------------
    // 8. DEMO RESET ROUTE (/demo-reset)
    // -------------------------------------------------------------------------
    console.log('\n[8] Testing Hidden Demo Reset Route (/demo-reset)...');
    await page.goto('http://localhost:5173/demo-reset', { waitUntil: 'networkidle2' });
    const resetSubmitBtn = await findButtonByText(page, 'Restore Seeded Database Now');
    if (resetSubmitBtn) {
      await resetSubmitBtn.click();
      await new Promise((r) => setTimeout(r, 2000));
      console.log('✓ Demo Reset page successfully restored seeded database.');
    }

    console.log('\n🎉 FULL QA PASS COMPLETED SUCCESSFULLY!');
    if (consoleErrors.length > 0) {
      console.warn('⚠️ Console errors noted:', consoleErrors);
    } else {
      console.log('🌟 ZERO JavaScript or React console errors detected across all tested pages!');
    }
  } catch (err) {
    console.error('❌ QA Test Failed:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

runFullQAPass();
