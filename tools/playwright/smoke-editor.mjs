import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const URL = "http://localhost:3000";
const OUT = "./shots-editor";

async function run() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  const consoleErrs = [];
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrs.push(m.text());
  });
  page.on("pageerror", (e) => consoleErrs.push("PAGEERROR: " + e.message));

  // Clear localStorage to start fresh
  await page.goto(URL + "/", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());

  // ── Onboarding ──
  await page.goto(URL + "/", { waitUntil: "networkidle" });
  await page.screenshot({ path: `${OUT}/01-onboarding.png` });

  await page.fill('input[placeholder="예: 태평천하"]', "태평천하");
  await page.fill('input[placeholder="예: 채만식 장편소설"]', "채만식 장편소설");
  await page.fill('input[placeholder="예: 채만식"]', "채만식");
  await page.fill('input[placeholder="예: 성진북스"]', "성진북스");
  await page.screenshot({ path: `${OUT}/02-filled.png` });

  await page.click("button:has-text('시작하기')");
  await page.waitForURL("**/editor");
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: `${OUT}/03-editor-empty.png` });

  // ── Type chapter ──
  await page.fill('input[placeholder="챕터 제목을 입력하세요"]', "제1장 — 양반(兩班) 윤직원(尹直員) 영감");

  // BlockNote editor — contenteditable
  const editorBox = page.locator(".bn-editor, [contenteditable='true']").first();
  await editorBox.click();
  await editorBox.type("추석을 지나 이윽고, 짙어 가는 가을 햇볕에 향기 그윽한 만돌리나의 멜로디가 한가롭다.\n\n예순두 살은 두 살이지만 윤직원 영감은 인력거에서 내려선다.");
  await page.screenshot({ path: `${OUT}/04-chapter-typed.png` });

  // Save (exact text only — 헤더 "자동저장됨" 매치 회피)
  await page.locator("button:text-is('저장')").click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/05-after-save.png` });

  // Toggle preview panel
  await page.click("text=미리보기 패널");
  await page.waitForTimeout(400);
  await page.fill('input[placeholder="챕터 제목을 입력하세요"]', "제2장");
  const ed2 = page.locator(".bn-editor, [contenteditable='true']").first();
  await ed2.click();
  await ed2.type("두 번째 챕터 본문입니다.");
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/06-preview-panel.png` });

  // Add interlude
  await page.click("button:has-text('간지 추가')");
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${OUT}/07-with-interlude.png` });

  // Full preview
  await page.click("button:has-text('전체 미리보기')");
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/08-full-preview.png` });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);

  // Reload — check persistence
  await page.reload({ waitUntil: "networkidle" });
  await page.screenshot({ path: `${OUT}/09-after-reload.png` });

  const tocCount = await page.locator(".group").count();
  console.log(`TOC items after reload: ${tocCount}`);

  if (consoleErrs.length) {
    console.log("\n=== CONSOLE ERRORS ===");
    consoleErrs.forEach((e) => console.log("- " + e));
  } else {
    console.log("\nNo console errors.");
  }

  await browser.close();
}

run().catch((e) => {
  console.error("SMOKE FAILED:", e);
  process.exit(1);
});
