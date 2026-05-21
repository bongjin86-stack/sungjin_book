import { chromium } from "playwright";
import { mkdirSync } from "fs";

const URL = process.env.URL ?? "http://localhost:3003/edu";
const OUT_DIR = process.env.OUT_DIR ?? "../issue/capture-edu";
mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1200 } });
const page = await ctx.newPage();

page.on("pageerror", (e) => console.error("[pageerror]", e.message));
page.on("console", (m) => {
  if (m.type() === "error") console.error("[console.error]", m.text());
});

console.log(`→ ${URL}`);
await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });

console.log("→ Typst 컴파일 완료 대기");
await page
  .waitForFunction(
    () => {
      const txt = document.body.innerText;
      return /Typst 엔진/.test(txt) && /\d+ms/.test(txt);
    },
    { timeout: 120000 },
  )
  .catch(() => console.warn("컴파일 표시 타임아웃 — 그래도 캡처"));
await page.waitForTimeout(2000);

// SVG host (백색 박스)만 클립 캡처 — 큰 해상도
// SVG 자체를 1200px 너비로 강제하여 글자 가독성 확보
async function shoot(name) {
  await page.evaluate(() => {
    const host = document.querySelector("section .bg-white.shadow-md");
    if (!host) return;
    const svg = host.querySelector("svg");
    if (svg) {
      const vb = svg.getAttribute("viewBox");
      if (vb) {
        const [, , w, h] = vb.split(" ").map(Number);
        svg.setAttribute("width", "1200");
        svg.setAttribute("height", String((1200 * h) / w));
        svg.style.maxWidth = "none";
        svg.style.maxHeight = "none";
      }
    }
    host.style.maxWidth = "none";
    host.style.maxHeight = "none";
    host.style.width = "auto";
    host.style.height = "auto";
    host.style.aspectRatio = "auto";
  });
  await page.waitForTimeout(200);
  const host = await page.locator("section .bg-white.shadow-md").first();
  await host.screenshot({ path: `${OUT_DIR}/${name}.png` });
}
await shoot("edu-p1");

for (let i = 1; i < 4; i++) {
  const nextBtn = page.locator("button[aria-label='다음 페이지']").first();
  if (!(await nextBtn.isEnabled().catch(() => false))) break;
  await nextBtn.click();
  await page.waitForTimeout(800);
  await shoot(`edu-p${i + 1}`);
}

// 페이지 1로 돌아가 fullPage screenshot — 마진/세로 라벨 확인용
const prevBtn = page.locator("button[aria-label='이전 페이지']").first();
for (let i = 0; i < 5; i++) {
  if (!(await prevBtn.isEnabled().catch(() => false))) break;
  await prevBtn.click();
  await page.waitForTimeout(300);
}
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT_DIR}/edu-fullpage.png`, fullPage: true });

console.log("완료");
await browser.close();
