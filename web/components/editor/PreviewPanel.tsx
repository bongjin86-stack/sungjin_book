"use client";

// BookPreviewPanel — Atticus 스타일 미리보기 (페이지 분할 + 네비게이션).
//
// 구조:
//   ┌ 상단 툴바 (판형/기기 라벨)
//   ├ 책 프레임 영역 (flex-1, ResizeObserver 측정 대상)
//   ├ (N pages) 페이지 수 표시
//   ├ 네비 2×2 (◀ Page / Page ▶ / |◀ Chapter / Chapter ▶|)
//   └ 하단 기기 전환 드롭다운
//
// 페이지 분할은 usePreviewLayout → usePagination 으로 결정. 현재 활성 챕터 1개만 분할.

import { useEffect, useRef, useState } from "react";
import type { BookOptions, PreviewDevice, TrimSize } from "@/types/book";
import { usePreviewLayout } from "@/hooks/usePreviewLayout";
import { usePagination } from "@/hooks/usePagination";

interface BookPreviewPanelProps {
  options: BookOptions;
  trim: TrimSize;
  previewContent: {
    chapterNum: string;
    title: string;
    body: string;
  };
  /** 챕터 전환 식별자 — 바뀌면 currentPage가 0으로 리셋 */
  resetPageKey?: string | null;
}

const TRIM_SIZE_LABEL: Record<TrimSize, string> = {
  "신국판": "152 × 225",
  "46배판": "188 × 257",
  "문고판": "105 × 148",
};

function deviceLabel(device: Exclude<PreviewDevice, "print">): string {
  if (device === "kindle") return "Kindle Paperwhite";
  if (device === "ipad") return "iPad";
  return "스마트폰";
}

// 챕터 헤더(번호+제목+여백)가 차지하는 줄 수 추정값.
// 정확한 측정은 2단계에서 동적으로.
function estimateChapterHeaderLines(showChapterNumber: boolean): number {
  return showChapterNumber ? 4 : 3;
}

export function BookPreviewPanel({
  options,
  trim,
  previewContent,
  resetPageKey,
}: BookPreviewPanelProps) {
  const [device, setDevice] = useState<PreviewDevice>("print");
  const [currentPage, setCurrentPage] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const { chapterNum, title, body } = previewContent;
  const isEmpty = !title.trim() && !body.trim();
  const paragraphs = body.split(/\n+/).filter((p) => p.trim().length > 0);

  const layout = usePreviewLayout({ containerRef, trim, options, device });

  const { pages, totalPages } = usePagination({
    paragraphs,
    linesPerPage: layout.linesPerPage,
    charsPerLine: layout.charsPerLine,
    chapterHeaderLines: estimateChapterHeaderLines(options.showChapterNumber),
  });

  // 챕터 전환 시 0으로 리셋
  useEffect(() => {
    setCurrentPage(0);
  }, [resetPageKey]);

  // totalPages 변경 시 currentPage 클램프 (옵션 변경에서도 처음으로 점프하지 않게)
  useEffect(() => {
    setCurrentPage((p) => Math.min(Math.max(0, p), Math.max(0, totalPages - 1)));
  }, [totalPages]);

  // 키보드 ← / → — 미리보기 패널 포커스 시만 (에디터 캐럿과 충돌 방지)
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault();
      setCurrentPage((p) => Math.max(0, p - 1));
    } else if (e.key === "ArrowRight" || e.key === "PageDown") {
      e.preventDefault();
      setCurrentPage((p) => Math.min(totalPages - 1, p + 1));
    }
  }

  const goPage = (delta: number) =>
    setCurrentPage((p) => Math.max(0, Math.min(totalPages - 1, p + delta)));

  const visibleParagraphIdx = pages[currentPage] ?? [];
  const showChapterHeader = currentPage === 0;

  // 쪽번호 (인쇄본만). 챕터 시작 페이지(0)에서 hideChapterStartPageNumber 적용
  const pnVisible =
    device === "print" &&
    options.showPageNumber &&
    !(options.hideChapterStartPageNumber && currentPage === 0);
  const previewPageNumber = currentPage + 1;

  let pnPositionStyle: React.CSSProperties = {};
  if (options.pageNumberPosition === "bottom-center") {
    pnPositionStyle = {
      bottom: `${layout.paddingPx.bottom / 2}px`,
      left: 0,
      right: 0,
      textAlign: "center",
    };
  } else if (options.pageNumberPosition === "top-outside") {
    pnPositionStyle = {
      top: `${layout.paddingPx.top / 2}px`,
      right: `${layout.paddingPx.outer / 2}px`,
    };
  } else {
    pnPositionStyle = {
      bottom: `${layout.paddingPx.bottom / 2}px`,
      right: `${layout.paddingPx.outer / 2}px`,
    };
  }

  return (
    <aside
      className="w-full h-full bg-[#EDEBE5] border-l border-border flex flex-col overflow-hidden focus:outline-none"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      {/* 상단 툴바 */}
      <div className="h-10 px-4 flex items-center justify-between border-b border-border flex-shrink-0">
        <span className="text-[11px] text-text-secondary font-medium">
          {device === "print"
            ? `${trim} ${TRIM_SIZE_LABEL[trim]}`
            : deviceLabel(device)}
        </span>
        <span className="text-[11px] text-text-muted">
          {device === "print" ? "인쇄본" : "전자책"}
        </span>
      </div>

      {/* 책 프레임 영역 — ResizeObserver 측정 대상 */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden flex items-center justify-center px-3 py-3"
      >
        {layout.ready && layout.bookWidth > 0 && (
          <BookFrame
            device={device}
            widthPx={layout.bookWidth}
            heightPx={layout.bookHeight}
            paddingPx={layout.paddingPx}
            fontFamily={options.bodyFont === "sans" ? "sans-serif" : "serif"}
            fontSizePx={layout.fontSizePx}
            lineHeightPx={layout.lineHeightPx}
            renderHeader={showChapterHeader && !isEmpty}
            renderEmptyMessage={isEmpty}
            chapterNum={chapterNum}
            title={title}
            showChapterNumber={options.showChapterNumber}
            dropCaps={options.dropCaps}
            paragraphIndent={options.paragraphIndent}
            paragraphTexts={visibleParagraphIdx.map((i) => paragraphs[i])}
            paragraphAbsoluteIndices={visibleParagraphIdx}
            currentPage={currentPage}
            pnVisible={pnVisible && !isEmpty}
            pnPositionStyle={pnPositionStyle}
            pageNumber={previewPageNumber}
          />
        )}
      </div>

      {/* 페이지 수 표시 */}
      <div className="px-4 pt-1 flex items-center justify-center flex-shrink-0">
        <span className="text-[11px] text-text-muted">({totalPages} pages)</span>
      </div>

      {/* 페이지 네비 — 좌/우 한 줄 */}
      <div className="px-4 pt-2 pb-2 grid grid-cols-2 gap-1 flex-shrink-0">
        <NavButton
          label="◀ Page"
          onClick={() => goPage(-1)}
          disabled={currentPage === 0}
        />
        <NavButton
          label="Page ▶"
          onClick={() => goPage(1)}
          disabled={currentPage >= totalPages - 1}
        />
      </div>

      {/* 하단 — 기기 전환 드롭다운 */}
      <div className="h-11 px-4 flex items-center justify-center border-t border-border flex-shrink-0">
        <select
          value={device}
          onChange={(e) => setDevice(e.target.value as PreviewDevice)}
          className="bg-surface border border-border text-[11px] text-text-secondary rounded-[6px] px-2 py-1 outline-none cursor-pointer hover:border-border-hover transition-colors"
        >
          <optgroup label="인쇄본">
            <option value="print">
              {trim} ({TRIM_SIZE_LABEL[trim]})
            </option>
          </optgroup>
          <optgroup label="전자책">
            <option value="kindle">Kindle Paperwhite</option>
            <option value="ipad">iPad</option>
            <option value="smartphone">스마트폰</option>
          </optgroup>
        </select>
      </div>
    </aside>
  );
}

// ─── 네비 버튼 ──────────────────────────────────────────────────────────────
function NavButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`text-[11px] py-[6px] rounded-[6px] border border-border transition-colors ${
        disabled
          ? "bg-transparent text-text-muted/40 cursor-not-allowed"
          : "bg-surface text-text-secondary hover:border-accent hover:text-accent"
      }`}
    >
      {label}
    </button>
  );
}

// ─── 책 프레임 (인쇄본 + 전자기기 통합) ────────────────────────────────────
interface BookFrameProps {
  device: PreviewDevice;
  widthPx: number;
  heightPx: number;
  paddingPx: { top: number; bottom: number; inner: number; outer: number };
  fontFamily: string;
  fontSizePx: number;
  lineHeightPx: number;
  renderHeader: boolean;
  renderEmptyMessage: boolean;
  chapterNum: string;
  title: string;
  showChapterNumber: boolean;
  dropCaps: boolean;
  paragraphIndent: boolean;
  paragraphTexts: string[];
  paragraphAbsoluteIndices: number[];
  currentPage: number;
  pnVisible: boolean;
  pnPositionStyle: React.CSSProperties;
  pageNumber: number;
}

function BookFrame(props: BookFrameProps) {
  const {
    device,
    widthPx,
    heightPx,
    paddingPx,
    fontFamily,
    fontSizePx,
    lineHeightPx,
    renderHeader,
    renderEmptyMessage,
    chapterNum,
    title,
    showChapterNumber,
    dropCaps,
    paragraphIndent,
    paragraphTexts,
    paragraphAbsoluteIndices,
    currentPage,
    pnVisible,
    pnPositionStyle,
    pageNumber,
  } = props;

  const isPrint = device === "print";
  const isKindle = device === "kindle";
  const bezelColor = isKindle ? "#8A8480" : "#2A2A2A";
  const screenBg = isKindle ? "#F2EFE9" : "#FFFFFF";
  const bezelPct = device === "smartphone" ? 0.05 : 0.06;
  const radius = device === "smartphone" ? 14 : isPrint ? 2 : 8;

  return (
    <div
      className="relative flex-shrink-0"
      style={{
        width: widthPx,
        height: heightPx,
      }}
    >
      {isPrint && (
        <>
          {/* 페이지 뒷장 두께 효과 */}
          <div
            className="absolute inset-0 rounded-[2px]"
            style={{
              transform: "translate(3px, 4px)",
              background: "#C8C4BC",
              boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
            }}
            aria-hidden
          />
          <div
            className="absolute inset-0 rounded-[2px]"
            style={{ transform: "translate(1.5px, 2px)", background: "#D8D4CC" }}
            aria-hidden
          />
        </>
      )}

      {/* 종이 / 화면 */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          background: isPrint ? "#FFFFFF" : bezelColor,
          borderRadius: radius,
          padding: isPrint ? 0 : `${widthPx * bezelPct}px`,
          boxShadow: isPrint
            ? "0 6px 20px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.10)"
            : "0 8px 20px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.12)",
        }}
      >
        <div
          className="relative w-full h-full overflow-hidden"
          style={{
            background: isPrint ? "transparent" : screenBg,
            borderRadius: isPrint ? 0 : device === "smartphone" ? 6 : 3,
          }}
        >
          {/* 제본선 (인쇄본만) */}
          {isPrint && (
            <>
              <div
                className="absolute top-0 bottom-0 left-0 pointer-events-none"
                style={{
                  width: `${paddingPx.inner}px`,
                  background:
                    "linear-gradient(to right, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.04) 40%, rgba(0,0,0,0) 100%)",
                }}
                aria-hidden
              />
              <div
                className="absolute top-0 bottom-0 left-0 pointer-events-none"
                style={{ width: "1px", background: "rgba(0,0,0,0.08)" }}
                aria-hidden
              />
            </>
          )}

          {/* 본문 영역 */}
          <div
            className="absolute inset-0"
            style={{
              paddingTop: paddingPx.top,
              paddingBottom: paddingPx.bottom,
              paddingLeft: paddingPx.inner,
              paddingRight: paddingPx.outer,
              boxSizing: "border-box",
              fontFamily,
              fontSize: `${fontSizePx}px`,
              lineHeight: `${lineHeightPx}px`,
              color: "#1F1B16",
            }}
          >
            <div
              className="w-full h-full overflow-hidden"
              key={currentPage} // opacity 페이드용 (CSS animation으로 대체 가능)
              style={{ animation: "previewFade 120ms ease-out" }}
            >
              {renderEmptyMessage ? (
                <div
                  className="text-center leading-[1.7]"
                  style={{ fontSize: "10px", color: "#BDBDBD", paddingTop: "15%" }}
                >
                  챕터를 입력하면
                  <br />
                  여기에 미리보기가 표시됩니다.
                </div>
              ) : (
                <>
                  {renderHeader && (
                    <>
                      {showChapterNumber && (
                        <div
                          className="text-center font-bold"
                          style={{
                            fontFamily: "sans-serif",
                            fontSize: `${fontSizePx * 0.95}px`,
                            color: "#111",
                            marginBottom: `${fontSizePx * 0.3}px`,
                          }}
                        >
                          {chapterNum}
                        </div>
                      )}
                      <div
                        className="text-center font-bold leading-[1.3]"
                        style={{
                          fontFamily: "sans-serif",
                          fontSize: `${fontSizePx * 1.4}px`,
                          color: "#111",
                          marginBottom: `${fontSizePx * 0.8}px`,
                        }}
                      >
                        {title || "(제목 없음)"}
                      </div>
                    </>
                  )}
                  <div style={{ textAlign: "justify" }}>
                    {paragraphTexts.map((p, localIdx) => {
                      const absIdx = paragraphAbsoluteIndices[localIdx];
                      const isFirstParagraphOfChapter = absIdx === 0;
                      return (
                        <p
                          key={`${currentPage}-${localIdx}`}
                          style={{
                            textIndent: paragraphIndent && !isFirstParagraphOfChapter ? "1em" : "0",
                            margin: 0,
                          }}
                          className={dropCaps && isFirstParagraphOfChapter ? "drop-caps-para" : ""}
                        >
                          {p}
                        </p>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 쪽번호 */}
          {pnVisible && (
            <div
              className="absolute pointer-events-none"
              style={{
                ...pnPositionStyle,
                fontFamily: "serif",
                fontSize: `${Math.max(8, fontSizePx * 0.7)}px`,
                color: "#555",
              }}
            >
              {pageNumber}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
