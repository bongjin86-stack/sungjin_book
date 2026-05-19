// /dev/typst PoC 양쪽 샘플 캡처해서 SVG가 실제로 렌더되는지 확인.

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || "3001";
const URL = `http://localhost:${PORT}/dev/typst`;
const OUT = join(here, "shots-typst");

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } });
const page = await ctx.newPage();

const consoleLines = [];
page.on("console", (msg) => consoleLines.push(`[${msg.type()}] ${msg.text()}`));
page.on("pageerror", (err) => consoleLines.push(`[pageerror] ${err.message}`));

console.log(`> ${URL}`);
await page.goto(URL, { waitUntil: "domcontentloaded" });

// 1) hello 샘플 — 기본 선택 상태
try {
  await page.waitForSelector("svg", { timeout: 15000 });
} catch (e) {
  console.error("SVG 대기 타임아웃 — 콘솔 덤프:");
  for (const l of consoleLines) console.error(l);
  const bodyText = await page.locator("body").innerText();
  console.error("--- body text ---\n" + bodyText.slice(0, 1500));
  await page.screenshot({ path: join(OUT, "00-fail-hello.png"), fullPage: true });
  throw e;
}
await page.waitForTimeout(500);
const statusHello = await page.locator("text=/완료|오류/").first().textContent();
console.log("hello 상태:", statusHello);
await page.screenshot({ path: join(OUT, "01-hello.png"), fullPage: true });

async function pickAndCapture(label, fileBase) {
  await page.getByRole("button", { name: label }).click();
  // 새 SVG 컴파일 완료 대기 — 상태가 "완료"로 다시 바뀔 때까지
  await page.waitForFunction(
    () => /완료 \(\d+ms\)/.test(document.body.innerText) || /오류/.test(document.body.innerText),
    { timeout: 60000 },
  );
  await page.waitForTimeout(500);
  const status = await page.locator("text=/완료|오류/").first().textContent();
  console.log(`${fileBase} 상태:`, status);
  await page.screenshot({ path: join(OUT, `${fileBase}.png`), fullPage: true });
}

// 2) classic 샘플
await pickAndCapture(/신국판 Classic 미니/, "02-classic");

// 3) 콘텐츠 JSON → 책
await pickAndCapture(/콘텐츠 JSON/, "03-book");

console.log("--- console ---");
for (const l of consoleLines) console.log(l);

await browser.close();
