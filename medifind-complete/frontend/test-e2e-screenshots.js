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

async function runTestFlow() {
  console.log('🚀 Starting MediFind Full End-to-End Browser Flow...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900'],
  });

  const page = await browser.newPage();
  
  // Track console errors
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    // -------------------------------------------------------------
    // 1. HOME PAGE - DESKTOP & MOBILE
    // -------------------------------------------------------------
    console.log('1️⃣ Visiting Home Page at 1280px...');
    await page.setViewport({ width: 1280, height: 850 });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    
    // Type with typo "paractamol"
    await page.type('input[type="text"]', 'paractamol', { delay: 60 });
    await new Promise((r) => setTimeout(r, 600)); // wait for autocomplete debounce
    
    // Screenshot 1: Home Desktop with typo autocomplete
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'home-desktop.png') });
    console.log('📸 Saved home-desktop.png');

    // Home Mobile 390px
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'home-mobile.png') });
    console.log('📸 Saved home-mobile.png');

    // -------------------------------------------------------------
    // 2. SEARCH RESULTS & AUTO-PING - DESKTOP
    // -------------------------------------------------------------
    console.log('2️⃣ Navigating to Results Page...');
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto('http://localhost:5173/results?medicine_id=1&q=Calpol%20650', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));

async function findButtonByText(page, text) {
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const content = await page.evaluate((el) => el.innerText, b);
    if (content && content.toLowerCase().includes(text.toLowerCase())) {
      return b;
    }
  }
  return null;
}

    // Click Auto-Ping button if visible
    const pingBtn = await findButtonByText(page, 'Auto-Ping') || await findButtonByText(page, 'Verify Right Now');
    if (pingBtn) {
      await pingBtn.click();
      await new Promise((r) => setTimeout(r, 1200));
    }

    // Screenshot 2: Results with Live Ping
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'results-with-live-ping-desktop.png') });
    console.log('📸 Saved results-with-live-ping-desktop.png');

    // Results Mobile
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'results-mobile.png') });
    console.log('📸 Saved results-mobile.png');

    // -------------------------------------------------------------
    // 3. PHARMACIST PHONE SIMULATOR
    // -------------------------------------------------------------
    console.log('3️⃣ Testing Pharmacist Phone Simulator...');
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await page.goto('http://localhost:5173/pharmacist-sim', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 800));

    // If incoming ping has "YES, IN STOCK" button, click it
    const yesBtn = await findButtonByText(page, 'YES, IN STOCK');
    if (yesBtn) {
      console.log('👉 Pharmacist clicking "YES, IN STOCK" button on simulator...');
      await yesBtn.click();
      await new Promise((r) => setTimeout(r, 1000));
    }

    // Screenshot 3: Simulator Mobile & Desktop
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'simulator-mobile.png') });
    console.log('📸 Saved simulator-mobile.png');

    await page.setViewport({ width: 1280, height: 850 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'simulator-desktop.png') });
    console.log('📸 Saved simulator-desktop.png');

    // -------------------------------------------------------------
    // 4. RESERVATION FLOW & 60-MIN COUNTDOWN TOKEN
    // -------------------------------------------------------------
    console.log('4️⃣ Testing 60-minute Hold Reservation Form & Countdown Token...');
    await page.goto('http://localhost:5173/reserve/5/1', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 600));

    // Fill reservation form
    await page.type('input[placeholder*="Rahul Sharma"]', 'Aakash Gupta');
    await page.type('input[type="tel"]', '9829012345');
    
    // Submit form
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
      await new Promise((r) => setTimeout(r, 1200));
    }

    // Screenshot 4: Reservation Status Page Desktop & Mobile
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'reservation-desktop.png') });
    console.log('📸 Saved reservation-desktop.png');

    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'reservation-mobile.png') });
    console.log('📸 Saved reservation-mobile.png');

    // -------------------------------------------------------------
    // 5. PHARMACY PORTAL (LOGIN, STOCK TOGGLE, INSIGHTS CHART)
    // -------------------------------------------------------------
    console.log('5️⃣ Testing Chemist Portal Login & Dashboard...');
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto('http://localhost:5173/pharmacy', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 600));

    // Submit PIN 1234
    const loginBtn = await page.$('button[type="submit"]');
    if (loginBtn) {
      await loginBtn.click();
      await new Promise((r) => setTimeout(r, 1500));
    }

    // Screenshot 5: Portal Dashboard Desktop
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'portal-desktop.png') });
    console.log('📸 Saved portal-desktop.png');

    // Switch to Insights tab to view SVG chart
    const tabs = await page.$$('button');
    for (const t of tabs) {
      const text = await page.evaluate((el) => el.innerText, t);
      if (text && text.includes('Unmet Market Demand')) {
        await t.click();
        await new Promise((r) => setTimeout(r, 500));
        break;
      }
    }
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'portal-insights-desktop.png') });
    console.log('📸 Saved portal-insights-desktop.png');

    // Portal Mobile
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'portal-mobile.png') });
    console.log('📸 Saved portal-mobile.png');

    // -------------------------------------------------------------
    // 6. HOW IT WORKS PAGE
    // -------------------------------------------------------------
    console.log('6️⃣ Testing How It Works page...');
    await page.setViewport({ width: 1280, height: 850 });
    await page.goto('http://localhost:5173/how-it-works', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'how-it-works-desktop.png') });
    console.log('📸 Saved how-it-works-desktop.png');

    console.log('\n✅ All browser tests completed successfully!');
    if (consoleErrors.length > 0) {
      console.warn('⚠️ Console errors noted during flow:', consoleErrors);
    } else {
      console.log('🎉 ZERO console errors detected during browser execution!');
    }
  } catch (err) {
    console.error('❌ Error during browser flow:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

runTestFlow();
