"use client";

// 신국판(152×225mm) 비율의 책 프레임 미리보기 (Vellum 스타일).
// 단순 흰 박스가 아니라 제본선 음영 + 입체 그림자로 "진짜 책" 느낌.
// PDF 100% 재현이 아닌 95% HTML 근사치 — 옵션 변경 시 즉시 반영이 목표.
// Phase 2에서 Typst PDF 응답으로 교체 예정.

import type { BookOptions } from "@/types/book";

interface PreviewPanelProps {
  open: boolean;
  onClose: () => void;
  options: BookOptions;
  previewContent: {
    chapterNum: string;
    title: string;
    body: string;
  };
}

const FONT_SIZE_PX: Record<BookOptions["bodyFontSize"], string> = {
  "9pt": "12px",
  "10pt": "13px",
  "11pt": "14px",
};

const LINE_HEIGHT: Record<BookOptions["lineSpacing"], string> = {
  narrow: "1.6",
  normal: "1.8",
  wide: "2.0",
};

export function PreviewPanel({ open, onClose, options, previewContent }: PreviewPanelProps) {
  const { chapterNum, title, body } = previewContent;
  const isEmpty = !title.trim() && !body.trim();

  const fontFamily = options.bodyFont === "sans" ? "sans-serif" : "serif";
  const fontSize = FONT_SIZE_PX[options.bodyFontSize];
  const lineHeight = LINE_HEIGHT[options.lineSpacing];

  const paragraphs = body.split(/\n+/).filter((p) => p.trim().length > 0);

  // 미리보기는 1페이지 = 챕터 시작 = 홀수(오른쪽 펼침) 가정.
  // → 안쪽 여백은 "왼쪽" (제본선이 왼쪽).
  const isChapterStartPage = true;
  const pnVisible =
    options.showPageNumber &&
    !(options.hideChapterStartPageNumber && isChapterStartPage);

  let pnPositionStyle: React.CSSProperties = {};
  if (options.pageNumberPosition === "bottom-center") {
    pnPositionStyle = { bottom: "5%", left: 0, right: 0, textAlign: "center" };
  } else if (options.pageNumberPosition === "top-outside") {
    // 홀수 페이지 가정 → 외측 = 오른쪽
    pnPositionStyle = { top: "5%", right: "11%" };
  } else {
    // bottom-outside (기본)
    pnPositionStyle = { bottom: "5%", right: "11%" };
  }

  return (
    <div
      className={`bg-[#1A1A1A] transition-[width,border-width] duration-300 flex flex-col overflow-hidden ${
        open ? "w-[450px] border-l border-border" : "w-0 border-l-0"
      }`}
    >
      <div className="px-4 py-3 border-b border-[#2A2A2A] flex items-center flex-shrink-0">
        <span className="text-[12px] text-[#888] flex-1">📖 실시간 미리보기</span>
        <button
          type="button"
          onClick={onClose}
          className="bg-transparent border-none text-[#666] text-[14px] px-[6px] py-[2px] hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-8 flex justify-center items-start">
        {/* 책 프레임 wrapper — 그림자/페이지 두께 효과 */}
        <div
          className="relative w-[340px]"
          style={{ aspectRatio: "152 / 225" }}
        >
          {/* 페이지 뒷장 두께 — 살짝 비껴 깔린 회색 카드로 "여러 장이 쌓인 느낌" */}
          <div
            className="absolute inset-0 rounded-[2px]"
            style={{
              transform: "translate(2px, 3px)",
              background: "#D8D4CC",
              boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
            }}
            aria-hidden
          />
          <div
            className="absolute inset-0 rounded-[2px]"
            style={{
              transform: "translate(1px, 1.5px)",
              background: "#ECE7DD",
            }}
            aria-hidden
          />

          {/* 실제 종이 */}
          <div
            className="absolute inset-0 rounded-[2px] overflow-hidden"
            style={{
              background: "#FAFAFA",
              boxShadow:
                "0 14px 32px rgba(0,0,0,0.55), 0 4px 10px rgba(0,0,0,0.35)",
            }}
          >
            {/* 제본선(spine) 음영 — 왼쪽 안쪽 여백에 부드러운 어둠 */}
            <div
              className="absolute top-0 bottom-0 left-0 pointer-events-none"
              style={{
                width: "10%",
                background:
                  "linear-gradient(to right, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.08) 40%, rgba(0,0,0,0) 100%)",
              }}
              aria-hidden
            />
            {/* 제본선 끝 미세한 라인 (책등 가장자리) */}
            <div
              className="absolute top-0 bottom-0 left-0 pointer-events-none"
              style={{
                width: "1px",
                background: "rgba(0,0,0,0.15)",
              }}
              aria-hidden
            />

            {/* 본문 영역 — Typst 여백 비율 근사 */}
            <div
              className="absolute inset-0"
              style={{
                paddingTop: "10%",
                paddingBottom: "12%",
                paddingLeft: "13%",
                paddingRight: "11%",
                fontFamily,
                fontSize,
                lineHeight,
                color: "#1F1B16",
              }}
            >
              {isEmpty ? (
                <div className="text-[12px] text-[#999] text-center pt-12 leading-[1.7]">
                  챕터를 입력하면
                  <br />
                  여기에 미리보기가 표시됩니다.
                </div>
              ) : (
                <>
                  {options.showChapterNumber && (
                    <div
                      className="text-center font-bold mb-[6px]"
                      style={{ fontFamily: "sans-serif", fontSize: "11px", color: "#111" }}
                    >
                      제 {chapterNum.replace(/장$/, "")} 장
                    </div>
                  )}
                  <div
                    className="text-center font-bold mb-[14px] leading-[1.3]"
                    style={{ fontFamily: "sans-serif", fontSize: "15px", color: "#111" }}
                  >
                    {title || "(제목 없음)"}
                  </div>
                  <div style={{ textAlign: "justify" }}>
                    {paragraphs.map((p, i) => (
                      <p
                        key={i}
                        style={{
                          textIndent: options.paragraphIndent && i > 0 ? "1em" : "0",
                          margin: 0,
                        }}
                      >
                        {p}
                      </p>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* 쪽번호 */}
            {pnVisible && !isEmpty && (
              <div
                className="absolute pointer-events-none"
                style={{
                  ...pnPositionStyle,
                  fontFamily: "serif",
                  fontSize: "9px",
                  color: "#555",
                }}
              >
                1
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
