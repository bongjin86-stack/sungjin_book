import { chromium } from "playwright";
import { writeFileSync } from "fs";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
await page.goto("http://localhost:3003/edu", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForFunction(
  () => /Typst 엔진/.test(document.body.innerText) && (/\d+ms/.test(document.body.innerText) || /오류/.test(document.body.innerText)),
  { timeout: 120000 },
);
await page.waitForTimeout(2000);
// 오류 메시지 가져오기
const err = await page.evaluate(() => {
  const pre = document.querySelector("pre");
  return pre ? pre.innerText : null;
});
if (err) {
  console.log("ERROR ON PAGE:", err);
}
const info = await page.evaluate(() => {
  const svg = document.querySelector("section .bg-white.shadow-md svg");
  if (!svg) return { error: "no svg" };
  const pages = svg.querySelectorAll("g.typst-page");
  return {
    width: svg.getAttribute("width"),
    height: svg.getAttribute("height"),
    viewBox: svg.getAttribute("viewBox"),
    pageCount: pages.length,
    outerStart: svg.outerHTML.slice(0, 600),
  };
});
console.log(JSON.stringify(info, null, 2));
const outer = await page.evaluate(
  () => document.querySelector("section .bg-white.shadow-md svg").outerHTML,
);
const debugVL = (outer.match(/DEBUG-VL/g) || []).length;
const debugFT = (outer.match(/DEBUG-FT/g) || []).length;
console.log("DEBUG-VL:", debugVL, " DEBUG-FT:", debugFT);
const themeMatches = (outer.match(/Theme/g) || []).length;
const samegoMatches = (outer.match(/같이하기/g) || []).length;
const part2Matches = (outer.match(/PART2/g) || []).length;
const rotateMatches = (outer.match(/rotate\(/gi) || []).length;
const dokseo = (outer.match(/독서/g) || []).length;
const textElems = (outer.match(/<text /g) || []).length;
const transforms = (outer.match(/transform="[^"]*"/g) || []).length;
console.log("Theme matches:", themeMatches);
console.log("같이하기 matches:", samegoMatches);
console.log("PART2 matches:", part2Matches);
console.log("rotate(...) matches:", rotateMatches);
console.log("독서 matches:", dokseo);
console.log("<text> elems:", textElems);
console.log("transform=... count:", transforms);
// data-fontsize 또는 다른 텍스트 위치 정보
const tspan = (outer.match(/<tspan/g) || []).length;
console.log("<tspan> count:", tspan);
// 한국어가 path glyph로 변환됐는지 — 첫 <g> 자식 점검
const sample = outer.indexOf("typst-page");
console.log("first typst-page chunk:");
console.log(outer.slice(sample, sample + 500));
// 전체 SVG의 길이와 끝 부분
console.log("\nSVG length:", outer.length);
const tail = outer.slice(-2000);
console.log("\nSVG TAIL (last 2000):", tail);
// 텍스트 노드 — SVG에 박힌 textual content
const txtMatches = outer.match(/>[^<]{3,40}</g) || [];
console.log("\ntext nodes (>...<) count:", txtMatches.length);
console.log("first 20 text node samples:");
txtMatches.slice(0, 20).forEach((t, i) => console.log(` ${i}:`, JSON.stringify(t)));
await browser.close();
