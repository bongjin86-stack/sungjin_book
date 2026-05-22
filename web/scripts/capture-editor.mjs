import { chromium } from "playwright";

const URL = process.env.URL ?? "http://localhost:3005/editor";
const HOME = "http://localhost:3005/";
const OUT_DIR = "../issue/capture-20260520";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
const page = await ctx.newPage();

page.on("pageerror", (e) => console.error("[pageerror]", e.message));
page.on("console", (m) => {
  if (m.type() === "error") console.error("[console.error]", m.text());
});

console.log("→ 홈 (BookSetupScreen)");
await page.goto(HOME, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(2000);
// 캡처 일관성 위해 localStorage 클리어 후 새로고침
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT_DIR}/01-home.png`, fullPage: false });

console.log("→ 책 설정 폼 입력");
const inputs = await page.locator("input[type='text'], input:not([type])").all();
if (inputs.length >= 1) {
  await inputs[0].fill("테스트 책 — Reedsy/Cambric 베이스라인");
  if (inputs.length >= 2) await inputs[1].fill("자동 캡처 검증");
  if (inputs.length >= 3) await inputs[2].fill("성진북스 베타");
  if (inputs.length >= 4) await inputs[3].fill("성진북스");
}
await page.screenshot({ path: `${OUT_DIR}/01b-form-filled.png` });

console.log("→ '다음' 반복 클릭 (최대 6단계) 또는 '시작/완료' 누르기");
for (let i = 0; i < 6; i++) {
  const finish = page.locator("button:has-text('시작'), button:has-text('완료'), button:has-text('만들기')").first();
  if (await finish.isVisible().catch(() => false)) {
    console.log(`  step ${i}: 완료 버튼`);
    await finish.click();
    await page.waitForTimeout(2500);
    break;
  }
  const next = page.locator("button:has-text('다음')").first();
  if (!(await next.isVisible().catch(() => false))) {
    console.log(`  step ${i}: 더 이상 '다음' 없음 — 이미 에디터`);
    break;
  }
  console.log(`  step ${i}: 다음`);
  await next.click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT_DIR}/01c-step${i}.png` });
}
await page.waitForTimeout(3000);
await page.screenshot({ path: `${OUT_DIR}/02-editor-initial.png` });

// 챕터1 본문 채우기 — 드롭캡/러닝헤더 효과를 보려면 어느 정도 분량 필요
console.log("→ 챕터1 본문 입력");
const bodyArea = page.locator("[contenteditable='true'], textarea").first();
if (await bodyArea.isVisible().catch(() => false)) {
  await bodyArea.click();
  const text =
    "한자 검증용 본문. 윤직원 영감 귀택지도(歸宅之圖). 추석(秋夕)을 지나 이윽고, 짙어 가는 가을 해가 저물기 쉬운 어느 날 석양(夕陽). 저 계동(桂洞)의 이름 난 장자〔富者〕윤직원(尹直員) 영감이 마침 어디 출입을 했다가 방금 인력거를 처억 잡숫고 돌아와, 마악 댁의 대문 앞에서 내리는 참입니다.";
  // contenteditable은 fill이 안 먹는 경우가 있어 keyboard.type 폴백.
  try {
    await bodyArea.fill(text);
  } catch {
    await page.keyboard.type(text, { delay: 1 });
  }
  // 만약 fill이 성공해도 내용이 비어 있으면 type으로 강제 입력
  const len = await bodyArea.evaluate((el) => (el.textContent || (el).value || "").length);
  if (len < 5) {
    await bodyArea.click();
    await page.keyboard.type(text, { delay: 1 });
  }
  // 저장 버튼
  const saveBtn = page.locator("button:has-text('수정 저장'), button:has-text('저장')").first();
  if (await saveBtn.isVisible().catch(() => false)) {
    await saveBtn.click();
  }
  await page.waitForTimeout(3000);
}

// Typst 미리보기가 컴파일을 끝낼 때까지 대기
console.log("→ Typst 컴파일 대기");
await page
  .waitForFunction(
    () => {
      const txt = document.body.innerText;
      return /Typst 엔진/.test(txt) && /\d+ms/.test(txt);
    },
    { timeout: 120000 },
  )
  .catch(() => console.warn("타임아웃 (그래도 캡처)"));
await page.waitForTimeout(2000);
await page.screenshot({ path: `${OUT_DIR}/03-editor-typst-ready.png` });

console.log("→ 챕터1 클릭 → 본문 페이지로 자동 스크롤");
const chapter1 = page.locator("text=제1장").first();
if (await chapter1.isVisible().catch(() => false)) {
  await chapter1.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT_DIR}/04-chapter1.png` });
}

console.log("→ '책 스타일' 탭 열기");
const styleTab = page.locator("text=책 스타일").first();
if (await styleTab.isVisible().catch(() => false)) {
  await styleTab.click();
  await page.waitForTimeout(500);
  // 세부 조정 펼치기
  const detail = page.locator("text=세부 조정").first();
  if (await detail.isVisible().catch(() => false)) {
    await detail.click();
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: `${OUT_DIR}/05-format-panel.png`, fullPage: true });
}

console.log("→ 러닝 헤더 토글 ON");
// ToggleRow는 라벨 + 우측 토글 버튼 구조. 라벨 텍스트 클릭으로 시도, 안 되면 형제 토글 찾기.
const rhLabel = page.locator("text=러닝 헤더").first();
if (await rhLabel.isVisible().catch(() => false)) {
  // 라벨의 부모 row 안에서 button/switch 찾기
  const row = rhLabel.locator("xpath=ancestor::*[contains(@class, 'flex') or contains(@class, 'row')][1]");
  const toggle = row.locator("button, [role='switch'], [role='checkbox']").first();
  if (await toggle.count()) {
    await toggle.click({ force: true });
  } else {
    // fallback: 라벨 클릭 (toggle 위에 wrapper로 묶인 패턴)
    await rhLabel.click();
  }
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT_DIR}/06-running-header-on.png` });
}

console.log("→ 드롭캡 토글 ON");
const dcLabel = page.locator("text=드롭캡").first();
if (await dcLabel.isVisible().catch(() => false)) {
  const row = dcLabel.locator("xpath=ancestor::*[contains(@class, 'flex') or contains(@class, 'row')][1]");
  const toggle = row.locator("button, [role='switch'], [role='checkbox']").first();
  if (await toggle.count()) {
    await toggle.click({ force: true });
  } else {
    await dcLabel.click();
  }
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT_DIR}/07-dropcap-on.png` });
}

console.log("→ 속표지 클릭");
const halfTitle = page.locator("text=속표지").first();
if (await halfTitle.isVisible().catch(() => false)) {
  await halfTitle.click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT_DIR}/08-halftitle.png` });
}

console.log("→ 저자 소개 클릭");
const authorBio = page.locator("text=저자 소개").first();
if (await authorBio.isVisible().catch(() => false)) {
  await authorBio.click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT_DIR}/09-authorbio.png` });
}

console.log("완료");
await browser.close();
