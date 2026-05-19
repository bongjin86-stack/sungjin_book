// 긴 한국어 본문 + 영문 혼용 + 구두점 → PDF 생성해서 줄바꿈 결과 봄.
// KLREQ G1(줄 처음 금칙) / G2(줄 끝 금칙) / S1(한영 자간) Typst lang:"ko" 충분한가.

import { chromium } from "playwright";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync, statSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, "shots-klreq");
mkdirSync(OUT, { recursive: true });

const longBody = `채만식의 「태평천하」를 떠올리면, 우리는 우선 "이십팔 관, 하고도 육백 몸메……!"라는 비유를 만난다. 그 인물이 어떤 사람이었는지, 그 시대가 어떤 시대였는지는 별도의 토론을 요한다. 다만 한 가지, 영문 단어 "weight"를 함께 사용하면 한영 혼용의 자간이 어떻게 처리되는지 즉시 확인할 수 있다.

문장 부호의 처리도 흥미롭다. 마침표·물음표·느낌표는 절대 줄 처음에 와서는 안 된다. 그래서 "정말입니까?"가 한 줄에 다 들어가지 못하면, 일반적인 KLREQ 규칙은 "정말입니"+"까?"가 아니라 "정말입니까?"를 통째로 다음 줄에 보내거나, 적어도 "?"가 줄 처음에 오지 않도록 조정한다. 우리 Typst lang:"ko" 설정이 이 룰을 어디까지 처리하는지 보는 게 이번 검증의 핵심이다.

여는 괄호(「)나 닫는 괄호(」)도 마찬가지다. 「태평천하」처럼 인용 부호가 한 줄을 넘어가면, 「가 줄 끝에 남고 」가 다음 줄 처음에 오는 사고가 없어야 한다. 영문 따옴표 "double quote"나 작은따옴표 'single' 역시 동일한 룰이 적용된다.

자간 측면에서도 살펴보자. "Bukk POD 입고용 PDF"라는 짧은 영문 토큰이 한국어 문장에 섞일 때, 한글-영문 경계마다 약간의 여백이 들어가야 자연스럽다. 이를 한영 자간 1/4각 룰이라고 부르며, KLREQ S1에 해당한다. Typst의 cjk-latin-spacing:auto가 이를 자동으로 처리한다.

마지막으로 들여쓰기. 챕터 직후의 첫 단락은 들여쓰기를 하지 않고, 둘째 단락부터 1em만큼 들여 쓴다. 이게 KLREQ I1의 "정책 c"다. 우리 template.typ의 first-line-indent: (amount: 1em, all: false) 설정이 정확히 이 동작을 한다.`;

const book = {
  meta: {
    title: "KLREQ 검증",
    author: "테스트",
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
    {
      id: "c1", type: "chapter", chapterNum: "제1장",
      title: "한국어 조판 검증",
      subtitle: "", body: longBody,
      charCount: longBody.length, includeInToc: true, showChapterNumber: true,
      createdAt: Date.now(),
    },
  ],
  createdAt: Date.now(), updatedAt: Date.now(),
};

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1400, height: 900 },
  acceptDownloads: true,
});
const page = await ctx.newPage();

await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
await page.evaluate((d) => localStorage.setItem("sungjin-book/v1", JSON.stringify(d)), book);
await page.goto("http://localhost:3000/editor", { waitUntil: "domcontentloaded" });
await page.waitForSelector("text=Typst 엔진", { timeout: 30000 });
await page.waitForFunction(() => /Typst 엔진[\s·]*\d+ms/.test(document.body.innerText), { timeout: 60000 });

await page.waitForTimeout(800);
await page.screenshot({ path: join(OUT, "01-editor-long.png"), fullPage: true });

const [download] = await Promise.all([
  page.waitForEvent("download", { timeout: 60000 }),
  page.locator("button:has-text('PDF 생성')").click(),
]);
const pdf = join(OUT, "klreq.pdf");
await download.saveAs(pdf);
console.log(`PDF: ${pdf} (${(statSync(pdf).size / 1024).toFixed(1)} KB)`);

await browser.close();
