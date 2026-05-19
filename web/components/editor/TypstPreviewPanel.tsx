"use client";

// S3-1: typst-ts 기반 미리보기 패널.
// bookData(트랙 B)를 받아 신국판 Classic 템플릿으로 컴파일 → SVG 출력.
// 입력이 바뀌면 디바운스 후 재컴파일. 컴파일 실패는 onFallback으로 호출자에게 알린다.

import { useEffect, useRef, useState } from "react";
import type { BookData } from "@/types/book";
import { compileBookSvg } from "@/lib/typst/compiler";
import { trackBToTypst } from "@/lib/typst/buildSource";

const DEBOUNCE_MS = 300;

interface Props {
  bookData: BookData;
  /** 사용자가 클릭한 블록 id. typst 미리보기를 그 챕터 페이지로 스크롤. */
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
  const svgRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRun = useRef(true);

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

  useEffect(() => {
    if (state.kind === "ok" && svgRef.current) {
      svgRef.current.innerHTML = state.svg;
    }
  }, [state]);

  // 활성 블록이 바뀌면 그 블록의 typst 페이지로 자동 스크롤.
  // 정확한 페이지 위치는 typst 컴파일 결과에서만 알 수 있지만, 룰 기반 추정:
  //   matter blocks (half-title, copyright, toc, *-page) → 각 1페이지
  //   chapter → 2페이지 (홀수 시작 + 짝수 빈 페이지)
  //   interlude → 0 (1단계 스킵)
  // 본문이 길면 부정확하지만 챕터 근처로는 점프함.
  useEffect(() => {
    if (state.kind !== "ok") return;
    if (!activeBlockId) return;
    const root = svgRef.current;
    const scroller = scrollRef.current;
    if (!root || !scroller) return;

    // typst pagebreak(to: "odd")는 짝수 빈 페이지를 자동 추가.
    // 모든 블록(chapter/matter)이 홀수 시작이라 평균 2페이지 사용.
    let targetIdx = 0;
    for (const b of bookData.blocks) {
      if (b.id === activeBlockId) break;
      if (b.type === "interlude") continue;
      targetIdx += 2;
    }

    const pages = root.querySelectorAll<SVGGElement>("g.typst-page");
    if (pages.length === 0) return;
    const clamped = Math.min(targetIdx, pages.length - 1);
    const target = pages[clamped];
    const targetRect = target.getBoundingClientRect();
    const scrollerRect = scroller.getBoundingClientRect();
    const offset = targetRect.top - scrollerRect.top + scroller.scrollTop - 24;
    scroller.scrollTo({ top: offset, behavior: "smooth" });
  }, [activeBlockId, state, bookData.blocks]);

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg-pane-right)" }}>
      <div
        className="px-4 py-2 text-xs flex items-center gap-3"
        style={{ color: "var(--text-muted)" }}
      >
        <span>Typst 엔진</span>
        <span aria-hidden>·</span>
        {state.kind === "idle" && <span>대기</span>}
        {state.kind === "loading" && <span>{state.phase}…</span>}
        {state.kind === "ok" && <span>{state.elapsedMs}ms</span>}
        {state.kind === "error" && (
          <span style={{ color: "#a00" }}>오류 — 폴백 예정</span>
        )}
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

      <div
        ref={scrollRef}
        className="flex-1 overflow-auto px-6 py-6 flex justify-center"
      >
        <div
          ref={svgRef}
          className="bg-white shadow-sm"
          style={{ maxWidth: "100%" }}
        />
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
    hideChapterStartPageNumber: o.hideChapterStartPageNumber,
    paragraphIndent: o.paragraphIndent,
  };
}
