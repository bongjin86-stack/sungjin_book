// typst.ts 얇은 추상화 레이어.
// 호출자(PoC, TypstPreview 등)는 이 모듈만 의존. typst.ts 패키지를 직접 import 금지.
// 이유: 엔진 교체(예: 본진 WASM, 다른 컴파일러) 시 콜사이트 손 안 대도록.
//
// 사용:
//   import { compileSvg } from "@/lib/typst/compiler";
//   const svg = await compileSvg(typSource);

"use client";

import type { TypstSnippet } from "@myriaddreamin/typst.ts/dist/esm/contrib/snippet.mjs";

/** typst.ts 0.6 기준 자산 경로. self-host (/public/...).
 *  ?v= 쿼리는 폰트 슬림본 빌드 키 — 한자 범위(U+4E00-9FFF) 추가 후 캐시 무효화.
 */
const FONT_VER = "2026-05-20-hanja";
const ASSETS = {
  webCompilerWasm: "/wasm/typst_ts_web_compiler_bg.wasm",
  rendererWasm: "/wasm/typst_ts_renderer_bg.wasm",
  /** 노토 KR 슬림 서브셋 — 본문(세리프 Regular) + 챕터/제목(산스 Regular/Bold). */
  fonts: [
    `/fonts/NotoSerifCJKkr-Regular.slim.ttf?v=${FONT_VER}`,
    `/fonts/NotoSansCJKkr-Regular.slim.ttf?v=${FONT_VER}`,
    `/fonts/NotoSansCJKkr-Bold.slim.ttf?v=${FONT_VER}`,
  ],
};

type Snippet = TypstSnippet;

/**
 * dev HMR 시 모듈이 reset되므로 init 상태는 globalThis에 저장.
 * 같은 브라우저 세션 안에선 항상 같은 $typst 인스턴스를 한 번만 init.
 */
const GLOBAL_KEY = "__sungjin_typst_init_promise__";
const G = globalThis as unknown as Record<string, Promise<Snippet> | undefined>;

async function getInstance(): Promise<Snippet> {
  const existing = G[GLOBAL_KEY];
  if (existing) return existing;

  const p = (async () => {
    const { $typst, preloadRemoteFonts } = await import(
      "@myriaddreamin/typst.ts"
    );

    $typst.setCompilerInitOptions({
      beforeBuild: [preloadRemoteFonts(ASSETS.fonts)],
      getModule: () => ASSETS.webCompilerWasm,
    });
    $typst.setRendererInitOptions({
      getModule: () => ASSETS.rendererWasm,
    });

    // Warmup: $typst.getCompiler/getRenderer가 매 호출 시 함수→객체 캐시 전환을
    // race condition 없이 마치도록, 첫 컴파일을 init promise 안에서 직렬화한다.
    // 작은 빈 페이지 한 장으로 한 번에 둘 다 set.
    await $typst.svg({
      mainContent: "#set page(width: 1pt, height: 1pt)\n ",
    });

    return $typst;
  })();

  G[GLOBAL_KEY] = p;
  return p;
}

/** .typ 소스를 SVG 문자열로 컴파일. */
export async function compileSvg(typSource: string): Promise<string> {
  const t = await getInstance();
  return t.svg({ mainContent: typSource });
}

/** 가상 파일시스템에 파일 매핑. 같은 path 다시 호출하면 덮어쓴다. */
export async function addSource(path: string, content: string): Promise<void> {
  const t = await getInstance();
  await t.addSource(path, content);
}

/** .typ 소스를 PDF 바이너리로 컴파일. */
export async function compilePdf(typSource: string): Promise<Uint8Array> {
  const t = await getInstance();
  const out = await t.pdf({ mainContent: typSource });
  if (!out) throw new Error("typst pdf() returned empty");
  return out;
}

export const TYPST_ASSETS = ASSETS;

/**
 * bookData(JSON)를 신국판 Classic 템플릿으로 컴파일한 SVG 반환.
 * 내부적으로 /template.typ과 /data.json을 가상 파일시스템에 박고 컴파일.
 */
export async function compileBookSvg(book: unknown): Promise<string> {
  const { buildMainSource, buildDataJson } = await import("./buildSource");

  const templateUrl =
    "/typst-templates/sinkukpan/classic/template.typ";
  const tpl = await fetch(templateUrl).then((r) => {
    if (!r.ok) throw new Error(`template fetch ${r.status}`);
    return r.text();
  });

  await addSource("/template.typ", tpl);
  await addSource("/data.json", buildDataJson(book as never));

  return compileSvg(buildMainSource());
}

// ─── 교재(시험지) 컴파일 ──────────────────────────────────────────────────────
// v0.3 시험지 템플릿은 절대 경로 import (`#import "/typst-templates/_core/...":*`)
// 라서 core·v0.3 두 파일을 그 경로 그대로 가상 파일시스템에 박는다.

const TEST_PAPER_MAIN_SRC = `#import "/typst-templates/edu/test-paper/v0.3/template.typ": test-paper
#let data = json("/data.json")
#test-paper(data)
`;

async function loadTestPaperSources(): Promise<void> {
  // v0.3는 blocks/ variant 라이브러리를 import — 모두 가상 FS에 박혀 있어야 함.
  const paths = [
    "/typst-templates/_core/sungjin-core.typ",
    "/typst-templates/edu/blocks/multiple-choice/academy.typ",
    "/typst-templates/edu/blocks/short-answer/academy.typ",
    "/typst-templates/edu/blocks/passage/sidebar-label.typ",
    "/typst-templates/edu/blocks/layout/two-col-rule.typ",
    "/typst-templates/edu/blocks/layout/one-col.typ",
    "/typst-templates/edu/test-paper/v0.3/template.typ",
  ];
  const srcs = await Promise.all(
    paths.map((p) =>
      fetch(p).then((r) => {
        if (!r.ok) throw new Error(`fetch ${p}: ${r.status}`);
        return r.text();
      }),
    ),
  );
  for (let i = 0; i < paths.length; i++) {
    await addSource(paths[i], srcs[i]);
  }
}

/** 시험지 데이터 JSON을 v0.3 템플릿으로 컴파일한 SVG 반환. */
export async function compileTestPaperSvg(paperData: unknown): Promise<string> {
  await loadTestPaperSources();
  await addSource("/data.json", JSON.stringify(paperData));
  return compileSvg(TEST_PAPER_MAIN_SRC);
}

/** 시험지 데이터 JSON을 v0.3 템플릿으로 컴파일한 PDF 바이너리 반환. */
export async function compileTestPaperPdf(paperData: unknown): Promise<Uint8Array> {
  await loadTestPaperSources();
  await addSource("/data.json", JSON.stringify(paperData));
  return compilePdf(TEST_PAPER_MAIN_SRC);
}
