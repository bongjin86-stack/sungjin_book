// typst.ts WASM을 node_modules에서 public/wasm/으로 복사.
// /dev/typst 등 클라이언트가 fetch할 수 있게 정적 호스팅.
// next.js dev/build 전에 postinstall로 자동 실행.

import { mkdirSync, copyFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(here, "..");
const dest = join(webRoot, "public", "wasm");

const files = [
  {
    from: join(
      webRoot,
      "node_modules",
      "@myriaddreamin",
      "typst-ts-web-compiler",
      "pkg",
      "typst_ts_web_compiler_bg.wasm",
    ),
    to: join(dest, "typst_ts_web_compiler_bg.wasm"),
  },
  {
    from: join(
      webRoot,
      "node_modules",
      "@myriaddreamin",
      "typst-ts-renderer",
      "pkg",
      "typst_ts_renderer_bg.wasm",
    ),
    to: join(dest, "typst_ts_renderer_bg.wasm"),
  },
];

mkdirSync(dest, { recursive: true });

for (const { from, to } of files) {
  if (!existsSync(from)) {
    console.warn(`[typst-wasm] 원본 없음, skip: ${from}`);
    continue;
  }
  copyFileSync(from, to);
  console.log(`[typst-wasm] ${from} → ${to}`);
}
