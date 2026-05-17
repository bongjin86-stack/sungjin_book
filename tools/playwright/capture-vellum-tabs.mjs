import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '../../docs/research/screenshots/vellum');

const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();

await page.goto('https://vellum.pub/', { waitUntil: 'networkidle' });
await page.evaluate(async () => {
  const total = document.body.scrollHeight;
  for (let y = 0; y < total; y += 600) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 60));
  }
  window.scrollTo(0, 0);
});
await page.waitForTimeout(500);

const tabs = [
  { id: 'build',    slug: '01-build' },
  { id: 'style',    slug: '02-style' },
  { id: 'preview',  slug: '03-preview' },
  { id: 'generate', slug: '04-generate' },
  { id: 'update',   slug: '05-update' },
];

const slideClasses = ['slide-1-of-3', 'slide-2-of-3', 'slide-3-of-3'];

for (let i = 0; i < tabs.length; i++) {
  const tab = tabs[i];

  // 1. 탭 라디오 버튼 클릭 (Update만 ID가 다름)
  const ok = await page.evaluate((id) => {
    // onclick 속성으로 매칭 (가장 안정적)
    const targets = Array.from(document.querySelectorAll('input[type="radio"]'));
    const btn = targets.find(
      (el) => (el.getAttribute('onclick') || '').includes(`tour-stop-${id}`)
    );
    if (!btn) return false;
    btn.click();
    btn.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }, tab.id);

  if (!ok) {
    console.log(`  ${tab.id} 라디오 버튼 못찾음`);
    continue;
  }

  // 2. 섹션을 화면 가운데로
  await page.evaluate(() => {
    document.querySelector('#tour')?.scrollIntoView({ block: 'start' });
  });

  // 3. 슬라이드 3장 순회 캡처
  for (let s = 0; s < slideClasses.length; s++) {
    const slideCls = slideClasses[s];
    // 활성 탭의 해당 슬라이드만 보이도록 강제 — 다른 슬라이드는 opacity 0
    await page.evaluate(
      ({ tabId, slideCls }) => {
        const activeClip = document.querySelector(`#tour-clip-${tabId}`);
        if (!activeClip) return;
        // 모든 슬라이드 opacity 0
        activeClip.querySelectorAll('.tour-image.slide').forEach((img) => {
          img.style.opacity = '0';
          img.style.zIndex = '1';
        });
        // 타겟 슬라이드만 보이게
        const target = activeClip.querySelector(`.${slideCls}`);
        if (target) {
          target.style.opacity = '1';
          target.style.zIndex = '10';
        }
      },
      { tabId: tab.id, slideCls }
    );
    await page.waitForTimeout(500);

    const out = path.join(outDir, `80-tab-${tab.slug}-s${s + 1}.png`);
    await page.screenshot({ path: out, fullPage: false });
    console.log(`  ${tab.slug} 슬라이드 ${s + 1}/3 — OK`);
  }
}

await browser.close();
console.log('\n완료. 15장 캡처됨.');
