// /editor 시나리오 검증.
// 1) 챕터 2 클릭 → 미리보기 따라가는가
// 2) 본문에 글자 추가 → 디바운스 후 미리보기 갱신
// 3) matter block(속표지/판권지/목차) 선택 → 어떻게 보이는가
// 4) chapterNum이 "제1장" 같은 한국어일 때 typst가 어떤 번호로 렌더하는가

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || "3000";
const ORIGIN = `http://localhost:${PORT}`;
const OUT = join(here, "shots-verify");
mkdirSync(OUT, { recursive: true });

// 실제 트랙 B 에디터가 만드는 형태에 가깝게 — chapterNum이 한국어 "제1장"/"제2장"
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
      chapterNum: "제1장",
      title: "햇살이 비스듬히 들어오는 마당",
      subtitle: "",
      body: "오래된 한옥 마당에는 늘 햇살이 비스듬히 들어왔다.\n\n처마 끝에서 떨어지는 빗방울 소리가 그쳤다.",
      charCount: 60,
      includeInToc: true,
      showChapterNumber: true,
      createdAt: Date.now(),
    },
    {
      id: "ch2",
      type: "chapter",
      chapterNum: "제2장",
      title: "밤이 오는 시간",
      subtitle: "",
      body: "해가 지면 마당은 천천히 어두워졌다.\n\n별이 떴다.",
      charCount: 30,
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

await page.goto(`${ORIGIN}/`, { waitUntil: "domcontentloaded" });
await page.evaluate((data) => {
  localStorage.setItem("sungjin-book/v1", JSON.stringify(data));
}, sampleBook);
await page.goto(`${ORIGIN}/editor`, { waitUntil: "domcontentloaded" });

await page.waitForSelector("text=Typst 엔진", { timeout: 30000 });

async function waitForCompile(label) {
  // 컴파일 끝 = "...ms" 텍스트가 나타남
  await page.waitForFunction(
    () => /Typst 엔진[\s·]*\d+ms/.test(document.body.innerText),
    { timeout: 60000 },
  );
  console.log(`${label}: 컴파일 완료`);
}

await waitForCompile("초기");
await page.waitForTimeout(800);
await page.screenshot({ path: join(OUT, "01-initial.png"), fullPage: true });

// 사이드바 항목은 <div onClick>이고 dnd-kit이 마우스를 가로챌 수 있어
// 직접 DOM 트리에서 cursor-pointer 가진 부모 div를 찾아 click() 호출.
async function clickSidebar(label) {
  return await page.evaluate((label) => {
    const all = Array.from(document.querySelectorAll("div.cursor-pointer"));
    const target = all.find((el) => el.textContent?.includes(label));
    if (!target) return false;
    target.click();
    return true;
  }, label);
}

// --- 시나리오 1: 챕터 2 클릭 ---
console.log("[시나리오 1] 챕터 2 클릭");
const clicked2 = await clickSidebar("밤이 오는 시간");
console.log(`  사이드바 클릭 ${clicked2 ? "성공" : "실패"}`);
await page.waitForTimeout(1500);
await page.screenshot({ path: join(OUT, "02-after-click-ch2.png"), fullPage: true });

// --- 시나리오 2: 본문 수정 → 디바운스 갱신 ---
// ChapterForm은 BlockNote(contenteditable) 사용. textarea 아님.
console.log("[시나리오 2] 본문 수정 (BlockNote)");
const editable = page.locator("div[contenteditable='true']").last();
if (await editable.count()) {
  await editable.click();
  await editable.focus();
  // 본문 끝으로 이동
  await page.keyboard.press("End");
  await page.keyboard.type(" 추가된문장끝.");
  await page.waitForTimeout(2000);
  await page.screenshot({ path: join(OUT, "03-after-edit.png"), fullPage: true });
} else {
  console.warn("  contenteditable 못 찾음");
  await page.screenshot({ path: join(OUT, "03-after-edit.png"), fullPage: true });
}

// --- 시나리오 3: 미리보기 영역 내부 스크롤 → 챕터 2 보이나 ---
console.log("[시나리오 3] 우측 미리보기 스크롤");
await page.evaluate(() => {
  const scrollable = document.querySelector(".flex-1.overflow-auto");
  if (scrollable) scrollable.scrollTop = 1500;
});
await page.waitForTimeout(400);
await page.screenshot({ path: join(OUT, "04-preview-scrolled.png"), fullPage: true });

// --- 시나리오 4: 속표지 클릭 ---
console.log("[시나리오 4] 속표지 클릭");
const c1 = await clickSidebar("속표지");
console.log(`  속표지 클릭 ${c1 ? "성공" : "실패"}`);
await page.waitForTimeout(1000);
await page.screenshot({ path: join(OUT, "05-after-click-halftitle.png"), fullPage: true });

// --- 시나리오 5: 판권지 ---
console.log("[시나리오 5] 판권지 클릭");
const c2 = await clickSidebar("판권지");
console.log(`  판권지 클릭 ${c2 ? "성공" : "실패"}`);
await page.waitForTimeout(1000);
await page.screenshot({ path: join(OUT, "06-after-click-copyright.png"), fullPage: true });

console.log("--- console (마지막 20) ---");
for (const l of logs.slice(-20)) console.log(l);

await browser.close();
console.log("끝.");
