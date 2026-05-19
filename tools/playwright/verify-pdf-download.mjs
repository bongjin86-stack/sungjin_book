// PDF 생성 버튼 → typst.ts 컴파일 → 다운로드 검증.

import { chromium } from "playwright";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { statSync, writeFileSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || "3000";
const ORIGIN = `http://localhost:${PORT}`;
const OUT = join(here, "shots-pdf");
import { mkdirSync } from "node:fs";
mkdirSync(OUT, { recursive: true });

const sampleBook = {
  meta: {
    title: "테스트 책",
    author: "성진",
    trim: "신국판",
    bookType: "chapter",
    publisher: "성진북스",
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
      body: "첫 챕터의 본문 한 단락입니다.\n\n두 번째 단락입니다.",
      charCount: 30, includeInToc: true, showChapterNumber: true, createdAt: Date.now() },
  ],
  createdAt: Date.now(), updatedAt: Date.now(),
};

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1400, height: 900 },
  acceptDownloads: true,
});
const page = await ctx.newPage();

page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") console.log(`[${m.type()}] ${m.text()}`);
});
page.on("pageerror", (e) => console.log(`[pageerror] ${e.message}`));

await page.goto(`${ORIGIN}/`, { waitUntil: "domcontentloaded" });
await page.evaluate((d) => localStorage.setItem("sungjin-book/v1", JSON.stringify(d)), sampleBook);
await page.goto(`${ORIGIN}/editor`, { waitUntil: "domcontentloaded" });

await page.waitForSelector("text=Typst 엔진", { timeout: 30000 });
await page.waitForFunction(() => /Typst 엔진[\s·]*\d+ms/.test(document.body.innerText), { timeout: 60000 });

console.log("PDF 버튼 클릭");
const [download] = await Promise.all([
  page.waitForEvent("download", { timeout: 60000 }),
  page.locator("button:has-text('PDF 생성')").click(),
]);

const dest = join(OUT, "out.pdf");
await download.saveAs(dest);
const size = statSync(dest).size;
console.log(`다운로드 완료: ${dest} (${(size / 1024).toFixed(1)} KB)`);

await page.screenshot({ path: join(OUT, "after-pdf-click.png"), fullPage: true });

await browser.close();
console.log("끝.");
