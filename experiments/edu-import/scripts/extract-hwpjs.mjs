// hwp.js로 .hwp 텍스트 추출 가능성 평가.
// 사용: node scripts/extract-hwpjs.mjs <hwpPath> [outDir]
// 본앱과 격리된 실험. 결과는 ./out/*.txt + ./out/*.stats.json.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "hwp.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("usage: node scripts/extract-hwpjs.mjs <hwpPath> [outDir]");
  process.exit(1);
}
const hwpPath = path.resolve(args[0]);
const outDir = path.resolve(root, args[1] ?? "out");
fs.mkdirSync(outDir, { recursive: true });

const baseName = path.basename(hwpPath, path.extname(hwpPath));
const outTxt = path.join(outDir, `${baseName}.txt`);
const outStats = path.join(outDir, `${baseName}.stats.json`);

console.log(`[hwpjs] reading: ${hwpPath}`);
const buf = fs.readFileSync(hwpPath);
console.log(`[hwpjs] size: ${buf.length} bytes`);

let doc;
try {
  doc = parse(buf, { type: "buffer" });
} catch (e) {
  console.error(`[hwpjs] parse FAILED: ${e?.message ?? e}`);
  fs.writeFileSync(outStats, JSON.stringify({ error: String(e?.message ?? e) }, null, 2));
  process.exit(2);
}

// 통계
const stats = {
  file: path.basename(hwpPath),
  sizeBytes: buf.length,
  sections: doc.sections.length,
  paragraphs: 0,
  chars: 0,
  controls: 0,
  charTypes: { Char: 0, Inline: 0, Extened: 0 },
  controlIds: {},
};

const lines = [];
for (const section of doc.sections) {
  for (const p of section.content) {
    stats.paragraphs += 1;
    stats.controls += p.controls?.length ?? 0;
    for (const c of p.controls ?? []) {
      const id = c?.id ?? c?.constructor?.name ?? "unknown";
      stats.controlIds[id] = (stats.controlIds[id] ?? 0) + 1;
    }

    const parts = [];
    for (const ch of p.content) {
      stats.chars += 1;
      const tName = ["Char", "Inline", "Extened"][ch.type] ?? `T${ch.type}`;
      stats.charTypes[tName] = (stats.charTypes[tName] ?? 0) + 1;
      if (ch.type === 0) {
        // Char — value가 number(코드포인트) 또는 string
        if (typeof ch.value === "string") parts.push(ch.value);
        else if (typeof ch.value === "number") parts.push(String.fromCharCode(ch.value));
      }
      // Inline/Extened은 컨트롤 marker → 텍스트 본체엔 안 넣음
    }
    lines.push(parts.join(""));
  }
  lines.push(""); // 섹션 사이 빈 줄
}

const text = lines.join("\n");
fs.writeFileSync(outTxt, text, "utf8");
fs.writeFileSync(outStats, JSON.stringify(stats, null, 2), "utf8");

// 빠른 진단
const headLines = lines.slice(0, 40).filter((l) => l.trim().length > 0);
console.log(`[hwpjs] sections=${stats.sections} paragraphs=${stats.paragraphs} chars=${stats.chars} controls=${stats.controls}`);
console.log(`[hwpjs] saved: ${outTxt}`);
console.log(`[hwpjs] saved: ${outStats}`);
console.log(`[hwpjs] --- first non-empty lines ---`);
for (const l of headLines.slice(0, 12)) console.log(`  | ${l.slice(0, 80)}`);
