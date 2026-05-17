import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto('https://vellum.pub/', { waitUntil: 'networkidle' });

const info = await page.evaluate(() => {
  const tourEls = Array.from(document.querySelectorAll('[id*="tour"], [class*="tour"]'));
  return tourEls.slice(0, 40).map((el) => ({
    tag: el.tagName,
    id: el.id,
    cls: el.className.toString().slice(0, 80),
    txt: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
  }));
});

console.log(JSON.stringify(info, null, 2));
await browser.close();
