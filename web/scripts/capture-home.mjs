import { chromium } from "playwright";
import { mkdirSync } from "fs";

const URL = process.env.URL ?? "http://localhost:3003/";
const OUT_DIR = process.env.OUT_DIR ?? "../issue/capture-home";
mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();

await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT_DIR}/home.png`, fullPage: false });

console.log("완료");
await browser.close();
