// typst-templates/ 폴더의 .typ 파일을 web/public/typst-templates/ 로 복사.
// 브라우저(typst.ts)가 fetch로 가져와 mapShadow 또는 addSource로 박는다.
// 단일 source of truth는 root의 typst-templates/. public 쪽은 자동 동기화 사본.

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(here, "..");
const projectRoot = resolve(webRoot, "..");
const src = join(projectRoot, "typst-templates");
const dst = join(webRoot, "public", "typst-templates");

if (!existsSync(src)) {
  console.warn(`[typst-templates] 원본 없음: ${src}`);
  process.exit(0);
}

if (existsSync(dst)) rmSync(dst, { recursive: true, force: true });
mkdirSync(dst, { recursive: true });

function copyDir(from, to) {
  for (const entry of readdirSync(from)) {
    const fromPath = join(from, entry);
    const toPath = join(to, entry);
    const s = statSync(fromPath);
    if (s.isDirectory()) {
      mkdirSync(toPath, { recursive: true });
      copyDir(fromPath, toPath);
    } else if (s.isFile() && entry.endsWith(".typ")) {
      copyFileSync(fromPath, toPath);
      console.log(`[typst-templates] ${relative(projectRoot, fromPath)} → ${relative(projectRoot, toPath)}`);
    }
  }
}

copyDir(src, dst);
