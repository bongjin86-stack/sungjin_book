import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(here, "..");
const projectRoot = resolve(webRoot, "..");
const srcDir = join(projectRoot, "experiments", "idml-recon");
const publicRoot = join(webRoot, "public", "dev", "qa-gallery");

const pagePngRe = /^(.*)-p(\d+)\.png$/;

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleFromBase(base) {
  const known = {
    "block-engine-product": "Block Engine Product QA",
    "block-engine-smoke": "Block Engine smoke test",
    "hwp-simply-classic-debug": "Latest HWP -> simply-classic sample",
    "test-chapters": "Chapters schema smoke test",
    "test-single": "Single-book schema smoke test",
    "diff-integrated": "Visual diff: original vs integrated",
    "ours-integrated": "Our integrated render",
    "ref-orig": "Original IDML reference pages",
    "diff-p9-vs-edu": "Old visual diff experiment",
  };
  if (known[base]) return known[base];
  return base
    .replace(/^hwp-/, "HWP ")
    .replace(/^test-/, "Test ")
    .replace(/^profile-/, "Profile ")
    .replace(/-/g, " ");
}

function descriptionFromBase(base) {
  const known = {
    "block-engine-product":
      "Product-quality block engine check. Same HWP sample rebuilt as preset blocks[] and rendered through simply-classic.",
    "block-engine-smoke":
      "Small connection test for preset block buttons -> blocks[] -> chapters[] -> PDF.",
    "hwp-simply-classic-debug":
      "Latest product-quality check. HWP content rendered through the simply-classic preset.",
    "test-chapters":
      "Older test for the chapters[] EduBook JSON flow. Useful for schema/render regression checks.",
    "test-single":
      "Older test for the one-book/simple EduBook JSON flow.",
    "diff-integrated":
      "Pixel diff from an earlier IDML background/body integration check.",
    "ours-integrated":
      "Our rendered page from the earlier IDML integration check.",
    "ref-orig":
      "Original IDML/PDF reference pages used for visual comparison.",
    "diff-p9-vs-edu":
      "Old comparison image from an early layout experiment.",
  };
  return known[base] ?? "Generated QA sample from experiments/idml-recon.";
}

function collectGroups() {
  const groups = new Map();

  if (!existsSync(srcDir)) return [];

  for (const entry of readdirSync(srcDir)) {
    const pngMatch = entry.match(pagePngRe);
    if (!pngMatch) continue;

    const [, base, pageRaw] = pngMatch;
    const page = Number(pageRaw);
    const sourcePath = join(srcDir, entry);
    const sourceStat = statSync(sourcePath);

    if (!groups.has(base)) {
      groups.set(base, {
        id: slugify(base),
        base,
        title: titleFromBase(base),
        sourceDir: relative(projectRoot, srcDir).replaceAll("\\", "/"),
        pdf: null,
        pages: [],
        updatedAtMs: 0,
      });
    }

    const group = groups.get(base);
    group.pages.push({
      page,
      sourceFile: entry,
      sourcePath,
      widthHint: page,
    });
    group.updatedAtMs = Math.max(group.updatedAtMs, sourceStat.mtimeMs);
  }

  for (const group of groups.values()) {
    const pdfName = `${group.base}.pdf`;
    const pdfPath = join(srcDir, pdfName);
    if (existsSync(pdfPath)) {
      group.pdf = {
        sourceFile: pdfName,
        sourcePath: pdfPath,
      };
      group.updatedAtMs = Math.max(group.updatedAtMs, statSync(pdfPath).mtimeMs);
    }
    group.pages.sort((a, b) => a.page - b.page);
  }

  return Array.from(groups.values())
    .filter((group) => group.pages.length > 0)
    .sort((a, b) => b.updatedAtMs - a.updatedAtMs);
}

function sync() {
  const groups = collectGroups();

  rmSync(publicRoot, { recursive: true, force: true });
  mkdirSync(publicRoot, { recursive: true });

  const manifest = {
    generatedAt: new Date().toISOString(),
    sourceDir: relative(projectRoot, srcDir).replaceAll("\\", "/"),
    groups: [],
  };

  for (const group of groups) {
    const outDir = join(publicRoot, group.id);
    mkdirSync(outDir, { recursive: true });

      const publicGroup = {
      id: group.id,
      title: group.title,
      description: descriptionFromBase(group.base),
      base: group.base,
      updatedAt: new Date(group.updatedAtMs).toISOString(),
      pdf: null,
      pages: [],
    };

    if (group.pdf) {
      const outPdf = join(outDir, group.pdf.sourceFile);
      copyFileSync(group.pdf.sourcePath, outPdf);
      publicGroup.pdf = `/dev/qa-gallery/${group.id}/${group.pdf.sourceFile}`;
    }

    for (const page of group.pages) {
      const outPng = join(outDir, page.sourceFile);
      copyFileSync(page.sourcePath, outPng);
      publicGroup.pages.push({
        page: page.page,
        src: `/dev/qa-gallery/${group.id}/${page.sourceFile}`,
      });
    }

    manifest.groups.push(publicGroup);
  }

  const manifestPath = join(publicRoot, "manifest.json");
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(`[qa-gallery] synced ${manifest.groups.length} groups`);
  console.log(`[qa-gallery] ${relative(projectRoot, manifestPath)}`);
}

sync();
