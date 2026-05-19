// typst.ts 얇은 추상화 레이어.
// 호출자(PoC, TypstPreview 등)는 이 모듈만 의존. typst.ts 패키지를 직접 import 금지.
// 이유: 엔진 교체(예: 본진 WASM, 다른 컴파일러) 시 콜사이트 손 안 대도록.
//
// 사용:
//   import { compileSvg } from "@/lib/typst/compiler";
//   const svg = await compileSvg(typSource);

"use client";

import type { TypstSnippet } from "@myriaddreamin/typst.ts/dist/esm/contrib/snippet.mjs";

/** typst.ts 0.6 기준 자산 경로. self-host (/public/...). */
const ASSETS = {
  webCompilerWasm: "/wasm/typst_ts_web_compiler_bg.wasm",
  rendererWasm: "/wasm/typst_ts_renderer_bg.wasm",
  /** 노토 세리프 CJK KR 슬림 서브셋 (한글 11,172자, 6MB). */
  serifKr: "/fonts/NotoSerifCJKkr-Regular.slim.ttf",
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
      beforeBuild: [preloadRemoteFonts([ASSETS.serifKr])],
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

/** .typ 소스를 PDF 바이너리로 컴파일. */
export async function compilePdf(typSource: string): Promise<Uint8Array> {
  const t = await getInstance();
  const out = await t.pdf({ mainContent: typSource });
  if (!out) throw new Error("typst pdf() returned empty");
  return out;
}

export const TYPST_ASSETS = ASSETS;
