// SVG raw 분석. multi-page 처리가 정상인지.

import { chromium } from "playwright";

const ORIGIN = `http://localhost:${process.env.PORT || "3000"}`;

const sampleBook = {
  meta: {
    title: "T",
    author: "A",
    trim: "신국판",
    bookType: "chapter",
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
    { id: "c1", type: "chapter", chapterNum: "제1장", title: "ch one", body: "본문 1.\n\n본문 2.", charCount: 10, includeInToc: true, showChapterNumber: true, createdAt: Date.now() },
    { id: "c2", type: "chapter", chapterNum: "제2장", title: "ch two", body: "본문 3.\n\n본문 4.", charCount: 10, includeInToc: true, showChapterNumber: true, createdAt: Date.now() },
  ],
  createdAt: Date.now(), updatedAt: Date.now(),
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();
page.on("console", (m) => console.log(`[${m.type()}] ${m.text()}`));

await page.goto(`${ORIGIN}/`, { waitUntil: "domcontentloaded" });
await page.evaluate((d) => localStorage.setItem("sungjin-book/v1", JSON.stringify(d)), sampleBook);
await page.goto(`${ORIGIN}/editor`, { waitUntil: "domcontentloaded" });
await page.waitForSelector("text=Typst 엔진", { timeout: 30000 });
await page.waitForFunction(() => /Typst 엔진[\s·]*\d+ms/.test(document.body.innerText), { timeout: 60000 });
await page.waitForTimeout(500);

// SVG 정보 추출
const info = await page.evaluate(() => {
  const svg = document.querySelector(".overflow-auto svg") || document.querySelector("svg");
  if (!svg) return { error: "no svg" };
  // SVG 안 모든 g element 검사 — 페이지 단위 식별
  const allG = Array.from(svg.querySelectorAll("g"));
  const transforms = allG
    .map((g) => g.getAttribute("transform") || "")
    .filter((t) => /translate/.test(t));
  return {
    width: svg.getAttribute("width"),
    height: svg.getAttribute("height"),
    gCount: allG.length,
    transforms: transforms.slice(0, 10),
    classes: Array.from(new Set(allG.map((g) => g.getAttribute("class")))).slice(0, 10),
    dataAttrs: Array.from(
      new Set(
        allG.flatMap((g) => Array.from(g.attributes).map((a) => a.name)),
      ),
    ).slice(0, 20),
    // 직접 자식 g만 — 페이지 단위 가능성 높음
    directChildren: Array.from(svg.children)
      .filter((c) => c.tagName.toLowerCase() === "g")
      .map((g) => ({
        transform: g.getAttribute("transform"),
        cls: g.getAttribute("class"),
        attrs: Array.from(g.attributes).map((a) => a.name),
      })),
  };
});

console.log(JSON.stringify(info, null, 2));

await browser.close();
