// /editor 페이지에 typst 엔진 미리보기가 잘 박혔는지 검증.
// localStorage에 sungjin-book/v1 책 데이터 미리 박고 진입.

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || "3000";
const ORIGIN = `http://localhost:${PORT}`;
const OUT = join(here, "shots-typst");
mkdirSync(OUT, { recursive: true });

const sampleBook = {
  meta: {
    title: "고양이가 사는 집",
    author: "테스트",
    trim: "신국판",
    bookType: "chapter",
    options: {
      theme: "classic",
      showChapterNumber: true,
      showPreviewPanel: true,
      showSeriesName: false,
      showEnglishTitle: false,
      includeISBN: false,
      interludeStyle: "1p",
      bodyFont: "serif",
      bodyFontSize: "10pt",
      lineSpacing: "normal",
      marginPreset: "normal",
      showPageNumber: true,
      pageNumberPosition: "bottom-outside",
      hideChapterStartPageNumber: true,
      paragraphIndent: true,
      dropCaps: false,
      sceneBreakStyle: "none",
    },
  },
  blocks: [
    {
      id: "ch1",
      type: "chapter",
      chapterNum: "1",
      title: "햇살이 비스듬히 들어오는 마당",
      subtitle: "",
      body: "오래된 한옥 마당에는 늘 햇살이 비스듬히 들어왔다. 마루 끝에 앉아 있던 검은 고양이는 햇살을 따라 천천히 자리를 옮겼다.\n\n처마 끝에서 떨어지는 빗방울 소리가 그쳤다. 비가 멎은 뒤에도 마당은 한참을 젖어 있었다.\n\n이른 봄, 마당의 한쪽 구석에 매화 한 그루가 있었다. 가지 끝이 거뭇거뭇한 그 매화는 매년 같은 시기에 같은 자리에서 꽃을 피웠다.",
      charCount: 200,
      includeInToc: true,
      showChapterNumber: true,
      createdAt: Date.now(),
    },
    {
      id: "ch2",
      type: "chapter",
      chapterNum: "2",
      title: "밤이 오는 시간",
      subtitle: "",
      body: "해가 지면 마당은 천천히 어두워졌다. 어둠은 한꺼번에 오는 것이 아니라, 마루 끝에서부터, 그리고 매화 아래에서부터, 조금씩 짙어졌다.\n\n별이 떴다. 처마 밑에서 올려다본 별은 늘 같은 위치에 있었지만, 매번 처음 보는 것 같았다.",
      charCount: 150,
      includeInToc: true,
      showChapterNumber: true,
      createdAt: Date.now(),
    },
  ],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();

const logs = [];
page.on("console", (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));

// localStorage에 책 데이터 먼저 박기 위해 origin에 한 번 접근
await page.goto(`${ORIGIN}/`, { waitUntil: "domcontentloaded" });
await page.evaluate((data) => {
  localStorage.setItem("sungjin-book/v1", JSON.stringify(data));
}, sampleBook);

await page.goto(`${ORIGIN}/editor`, { waitUntil: "domcontentloaded" });

// typst 엔진 표시 또는 SVG 대기
try {
  await page.waitForSelector("text=Typst 엔진", { timeout: 10000 });
  console.log("Typst 엔진 헤더 발견");
} catch {
  console.warn("Typst 엔진 헤더 못 찾음");
}

// SVG 컴파일 완료 대기 (최대 30s, 첫 wasm 로드 포함)
try {
  await page.waitForSelector(".overflow-auto svg", { timeout: 60000 });
  console.log("SVG 렌더 확인");
} catch (e) {
  console.error("SVG 대기 실패");
  for (const l of logs) console.error(l);
}

await page.waitForTimeout(1000);
await page.screenshot({ path: join(OUT, "editor-typst.png"), fullPage: true });
console.log("--- console ---");
for (const l of logs.slice(-15)) console.log(l);

await browser.close();
