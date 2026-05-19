// React 폴백 검증 — env=react 일 때 옛 미리보기 동작.

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, "shots-verify");
mkdirSync(OUT, { recursive: true });

const sampleBook = {
  meta: {
    title: "테스트 책", author: "성진", trim: "신국판", bookType: "chapter",
    options: {
      theme: "classic", showChapterNumber: true, showPreviewPanel: true,
      showSeriesName: false, showEnglishTitle: false, includeISBN: false,
      interludeStyle: "1p", bodyFont: "serif", bodyFontSize: "10pt",
      lineSpacing: "normal", marginPreset: "normal", showPageNumber: true,
      pageNumberPosition: "bottom-outside", hideChapterStartPageNumber: true,
      paragraphIndent: true, dropCaps: false, sceneBreakStyle: "none",
    },
  },
  blocks: [
    { id: "c1", type: "chapter", chapterNum: "제1장", title: "첫 챕터",
      body: "본문입니다.", charCount: 7, includeInToc: true, showChapterNumber: true, createdAt: Date.now() },
  ],
  createdAt: Date.now(), updatedAt: Date.now(),
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();

await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
await page.evaluate((d) => localStorage.setItem("sungjin-book/v1", JSON.stringify(d)), sampleBook);
await page.goto("http://localhost:3000/editor", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);

const hasTypstHeader = await page.locator("text=Typst 엔진").count();
const hasReactPreview = await page.locator("text=현재 페이지").count() + await page.locator("text=전체 책").count();
console.log(`Typst 엔진 헤더: ${hasTypstHeader}개 (0이어야 함)`);
console.log(`React 미리보기 마커: ${hasReactPreview}개 (>=1이면 OK)`);

await page.screenshot({ path: join(OUT, "07-react-fallback.png"), fullPage: true });

await browser.close();
