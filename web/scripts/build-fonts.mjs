// Noto Serif CJK KR 슬림 서브셋 빌드.
// 원본 17MB .otf → 한글 11,172자 + ASCII + 일반 구두점만 추려서
// web/public/fonts/NotoSerifCJKkr-Regular.slim.ttf 로 저장.
// pyftsubset(Python fonttools) 필요. `pip install fonttools`.

import { spawnSync } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { request as httpsRequest } from "node:https";

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(here, "..");
const projectRoot = resolve(webRoot, "..");

const SRC_URL =
  "https://raw.githubusercontent.com/notofonts/noto-cjk/refs/heads/main/Serif/OTF/Korean/NotoSerifCJKkr-Regular.otf";

const cacheDir = join(projectRoot, "build", "fonts-src");
const cachedOtf = join(cacheDir, "NotoSerifCJKkr-Regular.otf");

const outDir = join(webRoot, "public", "fonts");
const slimTtf = join(outDir, "NotoSerifCJKkr-Regular.slim.ttf");

// 유니코드 범위:
//  U+0020..007E   ASCII 기본 (영문/숫자/구두점)
//  U+00A0..00FF   라틴-1 보충 (일반 구두점 일부)
//  U+2000..206F   일반 구두점 (대시·따옴표·말줄임표 등)
//  U+2010..2027   하이픈/대시/따옴표
//  U+2030..2052   ‰ † ‡ ‹ › 등
//  U+AC00..D7A3   한글 음절 11,172자 전체
//  U+1100..11FF   한글 자모 (조합용)
//  U+3000..303F   CJK 기호·구두점 (、。〈〉《》 등)
//  U+FF00..FFEF   반각/전각 변환
const UNICODE_RANGES = [
  "U+0020-007E",
  "U+00A0-00FF",
  "U+2000-206F",
  "U+2070-209F",
  "U+20A0-20CF",
  "U+2100-214F",
  "U+AC00-D7A3",
  "U+1100-11FF",
  "U+3000-303F",
  "U+FF00-FFEF",
].join(",");

function downloadWithRedirect(url, dest, maxRedirects = 5) {
  return new Promise((resolveFn, rejectFn) => {
    const tryGet = (currentUrl, remaining) => {
      const req = httpsRequest(currentUrl, { method: "GET" }, (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          if (remaining <= 0) {
            rejectFn(new Error("too many redirects"));
            return;
          }
          const next = new URL(res.headers.location, currentUrl).toString();
          res.resume();
          tryGet(next, remaining - 1);
          return;
        }
        if (res.statusCode !== 200) {
          rejectFn(new Error(`HTTP ${res.statusCode} ${currentUrl}`));
          res.resume();
          return;
        }
        const file = createWriteStream(dest);
        res.pipe(file);
        file.on("finish", () => file.close(resolveFn));
        file.on("error", rejectFn);
      });
      req.on("error", rejectFn);
      req.end();
    };
    tryGet(url, maxRedirects);
  });
}

async function ensureSource() {
  mkdirSync(cacheDir, { recursive: true });
  if (existsSync(cachedOtf)) {
    const size = statSync(cachedOtf).size;
    console.log(
      `[fonts] 원본 캐시 발견: ${cachedOtf} (${(size / 1024 / 1024).toFixed(1)} MB)`,
    );
    return;
  }
  console.log(`[fonts] 원본 다운로드 시작: ${SRC_URL}`);
  await downloadWithRedirect(SRC_URL, cachedOtf);
  const size = statSync(cachedOtf).size;
  console.log(`[fonts] 원본 저장: ${cachedOtf} (${(size / 1024 / 1024).toFixed(1)} MB)`);
}

function runPyftsubset() {
  mkdirSync(outDir, { recursive: true });

  const args = [
    cachedOtf,
    `--output-file=${slimTtf}`,
    `--unicodes=${UNICODE_RANGES}`,
    "--flavor=", // 압축 없이 .ttf (typst.ts가 woff2 못 받음)
    "--no-hinting",
    "--desubroutinize",
    "--name-IDs=*",
    "--name-legacy",
    "--name-languages=*",
    "--glyph-names",
    "--symbol-cmap",
    "--legacy-cmap",
    "--notdef-glyph",
    "--notdef-outline",
    "--recommended-glyphs",
    "--layout-features=*",
    "--drop-tables+=DSIG",
  ];

  // Windows에서는 `pyftsubset.exe` 또는 `py -m fontTools.subset`이 더 안정적
  const candidates = [
    { cmd: "pyftsubset", args },
    { cmd: "py", args: ["-m", "fontTools.subset", ...args] },
    { cmd: "python", args: ["-m", "fontTools.subset", ...args] },
  ];

  for (const c of candidates) {
    const r = spawnSync(c.cmd, c.args, { stdio: "inherit", shell: false });
    if (r.error) {
      if (r.error.code === "ENOENT") continue;
      throw r.error;
    }
    if (r.status === 0) return c.cmd;
    throw new Error(`${c.cmd} 종료 코드 ${r.status}`);
  }
  throw new Error(
    "pyftsubset / py -m fontTools.subset / python -m fontTools.subset 모두 못 찾음. `pip install fonttools` 확인.",
  );
}

(async () => {
  await ensureSource();
  console.log("[fonts] 서브셋 시작 — KS 한글 11,172자 + ASCII + 일반 구두점");
  const used = runPyftsubset();
  const size = statSync(slimTtf).size;
  console.log(
    `[fonts] 서브셋 완료 (${used}): ${slimTtf} — ${(size / 1024 / 1024).toFixed(2)} MB`,
  );
})().catch((e) => {
  console.error("[fonts] 실패:", e.message);
  process.exit(1);
});
