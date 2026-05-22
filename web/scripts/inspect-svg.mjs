import { chromium } from "playwright";

const HOME = "http://localhost:3004/";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
const page = await ctx.newPage();

await page.goto(HOME, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(500);

// 책 설정 → 다음 다음 시작
const inputs = await page.locator("input[type='text'], input:not([type])").all();
if (inputs.length >= 1) await inputs[0].fill("SVG 검사용 책");
if (inputs.length >= 4) {
  await inputs[2].fill("저자");
  await inputs[3].fill("출판사");
}
for (let i = 0; i < 5; i++) {
  const finish = page.locator("button:has-text('시작'), button:has-text('완료'), button:has-text('만들기')").first();
  if (await finish.isVisible().catch(() => false)) {
    await finish.click();
    await page.waitForTimeout(2500);
    break;
  }
  const next = page.locator("button:has-text('다음')").first();
  if (!(await next.isVisible().catch(() => false))) break;
  await next.click();
  await page.waitForTimeout(800);
}

// Typst 컴파일 대기
await page.waitForFunction(
  () => /Typst 엔진/.test(document.body.innerText) && /\d+ms/.test(document.body.innerText),
  { timeout: 60000 },
).catch(() => {});
await page.waitForTimeout(1500);

const info = await page.evaluate(() => {
  const host = document.querySelector(".typst-svg-host");
  const svg = host?.querySelector("svg");
  return {
    hostBox: host ? host.getBoundingClientRect() : null,
    hostClasses: host?.className,
    hostInline: host?.getAttribute("style"),
    svgExists: !!svg,
    svgAttrs: svg
      ? {
          width: svg.getAttribute("width"),
          height: svg.getAttribute("height"),
          viewBox: svg.getAttribute("viewBox"),
          computedWidth: svg.getBoundingClientRect().width,
          computedHeight: svg.getBoundingClientRect().height,
          pages: svg.querySelectorAll("g.typst-page").length,
        }
      : null,
    parentBox: host?.parentElement?.getBoundingClientRect(),
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
