// Noto Serif/Sans CJK KR 슬림 서브셋 빌드.
// 원본 .otf → 한글 11,172자 + ASCII + 일반 구두점만 추려 .ttf 출력.
// pyftsubset(Python fonttools) 필요. `pip install fonttools`.

import { spawnSync } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { request as httpsRequest } from "node:https";

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(here, "..");
const projectRoot = resolve(webRoot, "..");

const FONTS = [
  {
    name: "NotoSerifCJKkr-Regular",
    url: "https://raw.githubusercontent.com/notofonts/noto-cjk/refs/heads/main/Serif/OTF/Korean/NotoSerifCJKkr-Regular.otf",
  },
  {
    name: "NotoSansCJKkr-Regular",
    url: "https://raw.githubusercontent.com/notofonts/noto-cjk/refs/heads/main/Sans/OTF/Korean/NotoSansCJKkr-Regular.otf",
  },
  {
    name: "NotoSansCJKkr-Bold",
    url: "https://raw.githubusercontent.com/notofonts/noto-cjk/refs/heads/main/Sans/OTF/Korean/NotoSansCJKkr-Bold.otf",
  },
];

const cacheDir = join(projectRoot, "build", "fonts-src");
const outDir = join(webRoot, "public", "fonts");

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

async function ensureSource(font) {
  const otf = join(cacheDir, `${font.name}.otf`);
  if (existsSync(otf)) {
    const size = statSync(otf).size;
    console.log(`[fonts] 캐시: ${font.name}.otf (${(size / 1024 / 1024).toFixed(1)} MB)`);
    return otf;
  }
  console.log(`[fonts] 다운로드: ${font.url}`);
  await downloadWithRedirect(font.url, otf);
  const size = statSync(otf).size;
  console.log(`[fonts] 저장: ${otf} (${(size / 1024 / 1024).toFixed(1)} MB)`);
  return otf;
}

function runPyftsubset(srcOtf, outTtf) {
  const args = [
    srcOtf,
    `--output-file=${outTtf}`,
    `--unicodes=${UNICODE_RANGES}`,
    "--flavor=",
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
  throw new Error("pyftsubset/py/python 모두 못 찾음. `pip install fonttools` 확인.");
}

(async () => {
  mkdirSync(cacheDir, { recursive: true });
  mkdirSync(outDir, { recursive: true });

  for (const font of FONTS) {
    const outTtf = join(outDir, `${font.name}.slim.ttf`);
    if (existsSync(outTtf) && !process.env.FORCE_REBUILD) {
      const size = statSync(outTtf).size;
      console.log(`[fonts] 스킵 (이미 있음): ${outTtf} — ${(size / 1024 / 1024).toFixed(2)} MB`);
      continue;
    }
    const otf = await ensureSource(font);
    console.log(`[fonts] 서브셋: ${font.name}`);
    runPyftsubset(otf, outTtf);
    const size = statSync(outTtf).size;
    console.log(`[fonts] 완료: ${outTtf} — ${(size / 1024 / 1024).toFixed(2)} MB`);
  }
})().catch((e) => {
  console.error("[fonts] 실패:", e.message);
  process.exit(1);
});
