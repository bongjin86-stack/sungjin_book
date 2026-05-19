"use client";

// BookPreviewPanel — 현재 페이지 / 전체 책 두 가지 모드.
//
// 모드:
//   - current: 사이드바에서 선택한 블록의 previewContent만 페이지화
//   - book:    bookData.blocks 전체를 한 권의 책처럼 이어서 페이지화

import { useEffect, useMemo, useRef, useState } from "react";
import type { BookData, BookOptions, PreviewDevice, TrimSize } from "@/types/book";
import { usePreviewLayout } from "@/hooks/usePreviewLayout";
import { paginateParagraphs, type PageParagraph } from "@/hooks/usePagination";
import { useBookPagination } from "@/hooks/useBookPagination";

interface BookPreviewPanelProps {
  options: BookOptions;
  trim: TrimSize;
  bookData: BookData;
  previewContent: {
    chapterNum: string;
    title: string;
    subtitle?: string;
    body: string;
    showChapterNumber?: boolean;
  };
  /** 챕터 전환 식별자 — 바뀌면 current 모드 currentPage가 0으로 리셋 */
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

function estimateChapterHeaderLines(showChapterNumber: boolean): number {
  return showChapterNumber ? 4 : 3;
}

interface RenderedPage {
  blockType: string;
  title: string;
  subtitle?: string;
  chapterNum?: string;
  showChapterNumber: boolean;
  isFirstPageOfBlock: boolean;
  paragraphs: PageParagraph[];
}

export function BookPreviewPanel({
  options,
  trim,
  bookData,
  previewContent,
  resetPageKey,
}: BookPreviewPanelProps) {
  const [device, setDevice] = useState<PreviewDevice>("print");
  const [mode, setMode] = useState<"current" | "book">("current");
  const [currentPage, setCurrentPage] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const { chapterNum, title, subtitle = "", body } = previewContent;
  const isCurrentEmpty = !title.trim() && !body.trim();

  const layout = usePreviewLayout({ containerRef, trim, options, device });

  // current 모드 페이지 (선택 블록 1개)
  const currentParagraphs = useMemo(
    () => body.split(/\n+/).filter((p) => p.trim().length > 0),
    [body],
  );
  const currentShowChapterNumber =
    previewContent.showChapterNumber ?? options.showChapterNumber;

  const currentPages = useMemo(() => {
    if (!layout.ready) return [[]];
    return paginateParagraphs(
      currentParagraphs.length > 0 ? currentParagraphs : [""],
      layout.linesPerPage,
      layout.charsPerLine,
      estimateChapterHeaderLines(currentShowChapterNumber),
    );
  }, [currentParagraphs, layout.ready, layout.linesPerPage, layout.charsPerLine, currentShowChapterNumber]);

  // book 모드 페이지 (책 전체)
  const { pages: bookPages } = useBookPagination({
    bookData,
    linesPerPage: layout.ready ? layout.linesPerPage : 1,
    charsPerLine: layout.ready ? layout.charsPerLine : 1,
    defaultShowChapterNumber: options.showChapterNumber,
  });

  const totalPages = mode === "current" ? currentPages.length : Math.max(1, bookPages.length);

  // current 모드: resetPageKey 변하면 0으로
  useEffect(() => {
    if (mode === "current") setCurrentPage(0);
  }, [resetPageKey, mode]);

  // totalPages 변경 시 클램프
  useEffect(() => {
    setCurrentPage((p) => Math.min(Math.max(0, p), Math.max(0, totalPages - 1)));
  }, [totalPages]);

  function switchMode(next: "current" | "book") {
    if (next === mode) return;
    setMode(next);
    setCurrentPage(0);
  }

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

  // 현재 페이지에 표시할 데이터를 모드에 따라 통일
  let active: RenderedPage;
  let renderEmpty = false;

  if (mode === "current") {
    renderEmpty = isCurrentEmpty;
    active = {
      blockType: "chapter",
      title,
      subtitle,
      chapterNum,
      showChapterNumber: currentShowChapterNumber,
      isFirstPageOfBlock: currentPage === 0,
      paragraphs: currentPages[currentPage] ?? [],
    };
  } else {
    const page = bookPages[currentPage];
    if (!page) {
      renderEmpty = true;
      active = {
        blockType: "chapter",
        title: "",
        showChapterNumber: false,
        isFirstPageOfBlock: true,
        paragraphs: [],
      };
    } else {
      active = {
        blockType: page.blockType,
        title: page.title,
        subtitle: page.subtitle,
        chapterNum: page.chapterNum,
        showChapterNumber: page.showChapterNumber,
        isFirstPageOfBlock: page.isFirstPageOfBlock,
        paragraphs: page.paragraphs,
      };
    }
  }

  const showHeader = active.isFirstPageOfBlock && !renderEmpty;

  // 쪽번호 — chapter 블록 시작 페이지에서 hideChapterStartPageNumber 적용
  const isChapterStart =
    active.blockType === "chapter" && active.isFirstPageOfBlock;
  const pnVisible =
    device === "print" &&
    options.showPageNumber &&
    !(options.hideChapterStartPageNumber && isChapterStart);
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
      {/* 상단 툴바 — 모드 토글 + 판형/기기 라벨 */}
      <div className="h-10 px-4 flex items-center justify-between border-b border-border flex-shrink-0">
        <div className="flex items-center gap-1">
          <ModeButton
            label="현재 페이지"
            active={mode === "current"}
            onClick={() => switchMode("current")}
          />
          <ModeButton
            label="전체 책"
            active={mode === "book"}
            onClick={() => switchMode("book")}
          />
        </div>
        <span className="text-[11px] text-text-secondary font-medium">
          {device === "print"
            ? `${trim} ${TRIM_SIZE_LABEL[trim]}`
            : deviceLabel(device)}
        </span>
      </div>

      {/* 책 프레임 영역 */}
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
            renderHeader={showHeader}
            renderEmptyMessage={renderEmpty}
            chapterNum={active.chapterNum ?? ""}
            title={active.title}
            subtitle={active.subtitle ?? ""}
            showChapterNumber={active.showChapterNumber}
            blockType={active.blockType}
            dropCaps={options.dropCaps}
            paragraphIndent={options.paragraphIndent}
            paragraphChunks={active.paragraphs}
            currentPage={currentPage}
            pnVisible={pnVisible && !renderEmpty}
            pnPositionStyle={pnPositionStyle}
            pageNumber={previewPageNumber}
          />
        )}
      </div>

      {/* 페이지 수 표시 */}
      <div className="px-4 pt-1 flex items-center justify-center flex-shrink-0">
        <span className="text-[11px] text-text-muted">
          {currentPage + 1} / {totalPages}쪽
        </span>
      </div>

      {/* 페이지 네비 */}
      <div className="px-4 pt-2 pb-2 grid grid-cols-2 gap-1 flex-shrink-0">
        <NavButton
          label="◀ 이전 쪽"
          onClick={() => goPage(-1)}
          disabled={currentPage === 0}
        />
        <NavButton
          label="다음 쪽 ▶"
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

function ModeButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-[11px] font-medium px-[10px] py-[4px] rounded-[6px] border transition-colors ${
        active
          ? "bg-accent text-white border-accent"
          : "bg-transparent text-text-muted border-border hover:border-accent hover:text-accent"
      }`}
    >
      {label}
    </button>
  );
}

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

// ─── 책 프레임 ───────────────────────────────────────────────────────────────
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
  subtitle?: string;
  showChapterNumber: boolean;
  blockType: string;
  dropCaps: boolean;
  paragraphIndent: boolean;
  paragraphChunks: PageParagraph[];
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
    subtitle = "",
    showChapterNumber,
    blockType,
    dropCaps,
    paragraphIndent,
    paragraphChunks,
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

  // 챕터 블록의 드롭캡은 본문 시작 단락에만
  const isChapterBlock = blockType === "chapter";

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
              key={`${blockType}-${currentPage}`}
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
                      {isChapterBlock && showChapterNumber && chapterNum && (
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
                      {subtitle && (
                        <div
                          className="text-center"
                          style={{
                            fontFamily: "sans-serif",
                            fontSize: `${fontSizePx * 0.82}px`,
                            color: "#555",
                            marginTop: `${fontSizePx * -0.35}px`,
                            marginBottom: `${fontSizePx * 0.8}px`,
                          }}
                        >
                          {subtitle}
                        </div>
                      )}
                    </>
                  )}
                  <div style={{ textAlign: "justify" }}>
                    {paragraphChunks.map((chunk, localIdx) => {
                      const isFirstParagraphOfChapter =
                        isChapterBlock &&
                        chunk.paragraphIndex === 0 &&
                        chunk.startsParagraph;
                      return (
                        <p
                          key={`${currentPage}-${localIdx}`}
                          style={{
                            textIndent:
                              paragraphIndent && chunk.startsParagraph && !isFirstParagraphOfChapter
                                ? "1em"
                                : "0",
                            margin: 0,
                          }}
                          className={dropCaps && isFirstParagraphOfChapter ? "drop-caps-para" : ""}
                        >
                          {chunk.lines.map((line, lineIdx) => (
                            <span key={`${localIdx}-${lineIdx}`}>
                              {line}
                              {lineIdx < chunk.lines.length - 1 && <br />}
                            </span>
                          ))}
                        </p>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

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
