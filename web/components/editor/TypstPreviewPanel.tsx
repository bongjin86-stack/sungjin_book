"use client";

// S3-1: typst-ts 기반 미리보기 패널.
// bookData(트랙 B)를 받아 신국판 Classic 템플릿으로 컴파일 → SVG 출력.
// 한 페이지씩 표시. 좌우 화살표로 책 넘기듯 페이지 이동 (Vellum/Cambric 표준).
// 입력이 바뀌면 디바운스 후 재컴파일. 컴파일 실패는 onFallback으로 호출자에게 알린다.

import { useEffect, useMemo, useRef, useState } from "react";
import type { BookData } from "@/types/book";
import { compileBookSvg } from "@/lib/typst/compiler";
import { trackBToTypst } from "@/lib/typst/buildSource";

const DEBOUNCE_MS = 300;

interface Props {
  bookData: BookData;
  /** 사용자가 클릭한 블록 id. typst 미리보기를 그 블록의 첫 페이지로 점프. */
  activeBlockId?: string | null;
  /** 컴파일 실패가 충분히 지속되면 호출자가 react 미리보기로 폴백한다. */
  onFallback?: (err: Error) => void;
}

type State =
  | { kind: "idle" }
  | { kind: "loading"; phase: "초기화 중" | "컴파일 중" }
  | { kind: "ok"; svg: string; elapsedMs: number }
  | { kind: "error"; message: string };

export function TypstPreviewPanel({ bookData, activeBlockId, onFallback }: Props) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [pageIdx, setPageIdx] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const svgHostRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRun = useRef(true);

  // bookData 변경 → 재컴파일
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    const delay = firstRun.current ? 0 : DEBOUNCE_MS;
    firstRun.current = false;

    debounceTimer.current = setTimeout(() => {
      let cancelled = false;
      (async () => {
        const t0 = performance.now();
        setState({ kind: "loading", phase: "컴파일 중" });
        try {
          const typstBook = trackBToTypst(
            {
              title: bookData.meta.title,
              author: bookData.meta.author,
              subtitle: bookData.meta.subtitle,
              publisher: bookData.meta.publisher,
              options: serializeOptions(bookData.meta.options),
            },
            bookData.blocks,
          );
          const svg = await compileBookSvg(typstBook);
          if (cancelled) return;
          const elapsedMs = Math.round(performance.now() - t0);
          setState({ kind: "ok", svg, elapsedMs });
        } catch (e) {
          if (cancelled) return;
          const err = e instanceof Error ? e : new Error(String(e));
          setState({ kind: "error", message: err.message });
          onFallback?.(err);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, delay);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [bookData, onFallback]);

  // SVG가 갱신되면 host에 박고 페이지 수 측정 + 현재 페이지만 보이게.
  useEffect(() => {
    if (state.kind !== "ok") return;
    const host = svgHostRef.current;
    if (!host) return;
    host.innerHTML = state.svg;

    const svg = host.querySelector("svg") as SVGSVGElement | null;
    if (!svg) return;
    const pages = svg.querySelectorAll<SVGGElement>("g.typst-page");
    setPageCount(pages.length);
    // 페이지 인덱스가 범위를 벗어나면 첫 페이지로
    setPageIdx((prev) => (prev >= pages.length ? 0 : prev));
  }, [state]);

  // activeBlockId 변경 → 해당 블록의 첫 페이지로 이동.
  // 추정 규칙: 모든 블록(chapter/matter)이 odd 시작이라 평균 2페이지 사용.
  // 본문 길이가 한 페이지 초과면 chapter는 더 많아질 수 있지만 일단 시작 페이지로.
  useEffect(() => {
    if (state.kind !== "ok") return;
    if (!activeBlockId) return;
    let target = 0;
    for (const b of bookData.blocks) {
      if (b.id === activeBlockId) break;
      if (b.type === "interlude") continue;
      target += 2;
    }
    setPageIdx(Math.min(target, Math.max(0, pageCount - 1)));
  }, [activeBlockId, state, bookData.blocks, pageCount]);

  // pageIdx 변경 → SVG viewBox를 해당 페이지 영역으로 좁힘.
  // 페이지 크기를 보이는 콘텐츠가 아닌 SVG 전체 크기 ÷ 페이지 수로 계산.
  // (typst.ts는 SVG width × height에 전체 페이지 합을 넣고, 각 g.typst-page는 y=N으로 transform.)
  useEffect(() => {
    const host = svgHostRef.current;
    if (!host) return;
    const svg = host.querySelector("svg") as SVGSVGElement | null;
    if (!svg) return;
    const pages = Array.from(svg.querySelectorAll<SVGGElement>("g.typst-page"));
    if (pages.length === 0) return;

    const clampedIdx = Math.min(Math.max(pageIdx, 0), pages.length - 1);

    // 원래 SVG 크기 보존 (한 번만 캐싱)
    const orig = svg.getAttribute("data-orig-viewbox");
    let totalW = 0;
    let totalH = 0;
    if (orig) {
      const [, , w, h] = orig.split(" ").map(Number);
      totalW = w;
      totalH = h;
    } else {
      const w = Number(svg.getAttribute("width"));
      const h = Number(svg.getAttribute("height"));
      const vb = svg.getAttribute("viewBox") ?? `0 0 ${w} ${h}`;
      svg.setAttribute("data-orig-viewbox", vb);
      svg.setAttribute("data-orig-w", String(w));
      svg.setAttribute("data-orig-h", String(h));
      totalW = w;
      totalH = h;
    }

    const pageW = totalW;
    const pageH = totalH / pages.length;
    const yStart = clampedIdx * pageH;

    svg.setAttribute("viewBox", `0 ${yStart} ${pageW} ${pageH}`);
    svg.setAttribute("width", String(pageW));
    svg.setAttribute("height", String(pageH));
    // CSS width:100%/height:auto가 svg 크기를 컨테이너 폭으로 늘리면서
    // viewBox 밖의 다른 페이지 내용이 살짝 새어 나오는 케이스를 막기 위해
    // 현재 페이지 외에는 display:none.
    pages.forEach((g, i) => {
      g.style.display = i === clampedIdx ? "" : "none";
    });
  }, [pageIdx, state]);

  const max = Math.max(0, pageCount - 1);
  const canPrev = pageIdx > 0;
  const canNext = pageIdx < max;

  const sizeLabel = useMemo(() => {
    switch (bookData.meta.trim) {
      case "신국판":
        return "신국판 152 × 225";
      case "46배판":
        return "46배판 188 × 257";
      case "문고판":
        return "문고판 105 × 148";
      default:
        return bookData.meta.trim;
    }
  }, [bookData.meta.trim]);

  return (
    <div className="flex flex-col h-full w-full min-w-0" style={{ background: "var(--bg-pane-right)" }}>
      {/* 상단 바: 엔진 상태 + 판형 라벨 */}
      <div
        className="px-4 py-2 text-xs flex items-center justify-between"
        style={{ color: "var(--text-muted)" }}
      >
        <div className="flex items-center gap-2">
          <span>Typst 엔진</span>
          <span aria-hidden>·</span>
          {state.kind === "idle" && <span>대기</span>}
          {state.kind === "loading" && <span>{state.phase}…</span>}
          {state.kind === "ok" && <span>{state.elapsedMs}ms</span>}
          {state.kind === "error" && <span style={{ color: "#a00" }}>오류 — 폴백 예정</span>}
        </div>
        <div className="text-[11px]">{sizeLabel}</div>
      </div>

      {state.kind === "error" && (
        <pre
          className="mx-4 my-2 p-3 text-xs whitespace-pre-wrap"
          style={{
            background: "#fdebeb",
            border: "1px solid #f5b8b8",
            borderRadius: 4,
            color: "#a00",
          }}
        >
          {state.message}
        </pre>
      )}

      {/* 가운데: 한 페이지 카드 (책 한 면).
          .typst-svg-host CSS가 aspect-ratio(152:225) + max-w/h 100%로
          부모 안에 contain 시킨다. */}
      <div className="flex-1 min-h-0 flex items-center justify-center px-4 py-4">
        <div
          ref={svgHostRef}
          className="typst-svg-host bg-white shadow-md"
        />
      </div>

      {/* 하단: 페이지 넘김 컨트롤 */}
      <div
        className="border-t flex items-center justify-center gap-6 py-2 text-xs select-none"
        style={{ borderColor: "rgba(0,0,0,0.08)", color: "var(--text-muted)" }}
      >
        <button
          type="button"
          onClick={() => setPageIdx((i) => Math.max(0, i - 1))}
          disabled={!canPrev}
          className="px-2 py-1 disabled:opacity-30 hover:text-accent transition-colors"
          aria-label="이전 페이지"
        >
          ◀
        </button>
        <span className="min-w-[80px] text-center">
          {pageCount === 0 ? "—" : `${pageIdx + 1} / ${pageCount}`}
        </span>
        <button
          type="button"
          onClick={() => setPageIdx((i) => Math.min(max, i + 1))}
          disabled={!canNext}
          className="px-2 py-1 disabled:opacity-30 hover:text-accent transition-colors"
          aria-label="다음 페이지"
        >
          ▶
        </button>
      </div>
    </div>
  );
}

/** 트랙 B options(중첩 UI 옵션 포함)에서 template.typ이 읽는 키만 추려 평탄화. */
function serializeOptions(o: BookData["meta"]["options"]): Record<string, unknown> {
  return {
    showChapterNumber: o.showChapterNumber,
    bodyFont: o.bodyFont,
    bodyFontSize: o.bodyFontSize,
    lineSpacing: o.lineSpacing,
    showPageNumber: o.showPageNumber,
    pageNumberPosition: o.pageNumberPosition,
    pageNumberFormat: o.pageNumberFormat,
    frontMatterNumbering: o.frontMatterNumbering,
    hideChapterStartPageNumber: o.hideChapterStartPageNumber,
    paragraphIndent: o.paragraphIndent,
    // Reedsy/Cambric 베이스라인 옵션 (2026-05-20)
    dropCaps: o.dropCaps,
    runningHeader: o.runningHeader,
    sceneBreakStyle: o.sceneBreakStyle,
    // Vellum 여백 가이드
    showMarginGuide: o.showMarginGuide,
  };
}
