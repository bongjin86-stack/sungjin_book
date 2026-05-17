import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '../../docs/research/screenshots/vellum');

const targets = [
  // 메인 마케팅
  { url: 'https://vellum.pub/', slug: '01-home', full: true },
  { url: 'https://store.vellum.pub/', slug: '02-store', full: true },
  { url: 'https://blog.vellum.pub/', slug: '03-blog', full: true },
  { url: 'https://created.vellum.pub/', slug: '04-gallery', full: true },

  // 도움말 허브
  { url: 'https://help.vellum.pub/', slug: '10-help-home', full: true },

  // Getting Started
  { url: 'https://help.vellum.pub/tutorial/', slug: '11-tutorial', full: true },
  { url: 'https://help.vellum.pub/importing/', slug: '12-importing', full: true },
  { url: 'https://help.vellum.pub/purchasing/', slug: '13-purchasing', full: true },

  // Editing & Formatting
  { url: 'https://help.vellum.pub/title-info/', slug: '20-title-info', full: true },
  { url: 'https://help.vellum.pub/elements/', slug: '21-elements', full: true },
  { url: 'https://help.vellum.pub/headings/', slug: '22-headings', full: true },
  { url: 'https://help.vellum.pub/text-features/', slug: '23-text-features', full: true },
  { url: 'https://help.vellum.pub/text-editor/', slug: '24-text-editor', full: true },
  { url: 'https://help.vellum.pub/styles/', slug: '25-styles', full: true },
  { url: 'https://help.vellum.pub/preview/', slug: '26-preview', full: true },

  // Print
  { url: 'https://help.vellum.pub/print/', slug: '30-print', full: true },
  { url: 'https://help.vellum.pub/print/settings/', slug: '31-print-settings', full: true },
  { url: 'https://help.vellum.pub/print/auto-layout/', slug: '32-print-auto-layout', full: true },

  // Generate / Upload
  { url: 'https://help.vellum.pub/generating/', slug: '40-generating', full: true },
  { url: 'https://help.vellum.pub/proofing/', slug: '41-proofing', full: true },
  { url: 'https://help.vellum.pub/uploading/', slug: '42-uploading', full: true },

  // Body styles (deeper into "configure" panel)
  { url: 'https://help.vellum.pub/styles/body/', slug: '50-styles-body', full: true },

  // Guides
  { url: 'https://help.vellum.pub/guides/box-set/', slug: '60-guide-box-set', full: true },
  { url: 'https://help.vellum.pub/guides/anthology/', slug: '61-guide-anthology', full: true },
  { url: 'https://help.vellum.pub/guides/large-print/', slug: '62-guide-large-print', full: true },
  { url: 'https://help.vellum.pub/guides/using-on-windows/', slug: '63-guide-windows', full: true },

  // 82-style flipbook (외부)
  { url: 'https://skinnerbooks.com/vellum-flipbook/', slug: '70-flipbook-skinner', full: true },
];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0 Safari/537.36',
});

const results = [];
let i = 0;
for (const t of targets) {
  i += 1;
  const page = await ctx.newPage();
  const out = path.join(outDir, `${t.slug}.png`);
  try {
    await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    // 쿠키/안내 배너 자동 닫기 시도 (실패해도 통과)
    for (const sel of [
      'button:has-text("Accept")',
      'button:has-text("동의")',
      'button:has-text("OK")',
      '[aria-label="dismiss"]',
    ]) {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 200 }).catch(() => false)) {
        await btn.click().catch(() => {});
      }
    }
    await page.screenshot({ path: out, fullPage: t.full });
    results.push({ ok: true, url: t.url, file: path.basename(out) });
    console.log(`[${i}/${targets.length}] OK  ${t.slug}`);
  } catch (e) {
    results.push({ ok: false, url: t.url, file: path.basename(out), error: String(e).slice(0, 200) });
    console.log(`[${i}/${targets.length}] ERR ${t.slug}: ${e.message}`);
  } finally {
    await page.close();
  }
}

await browser.close();
console.log('\n=== SUMMARY ===');
console.log(`총 ${results.length}건, 성공 ${results.filter(r => r.ok).length}건`);
for (const r of results) {
  if (!r.ok) console.log(`  실패: ${r.url} (${r.error})`);
}
