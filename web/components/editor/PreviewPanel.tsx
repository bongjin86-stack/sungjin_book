"use client";

// 신국판(152×225mm) 비율의 종이 미리보기.
// PDF 100% 재현이 아니라 95% HTML 근사치 — 옵션 변경 시 즉시 반영되는 게 목표.
// 폰트/크기/줄간격/들여쓰기/쪽번호 위치를 동적으로 반영한다.
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

  // 쪽번호 정렬 + 표시 여부 (미리보기는 1페이지 = 챕터 시작 기준)
  const isChapterStartPage = true;
  const pnVisible =
    options.showPageNumber &&
    !(options.hideChapterStartPageNumber && isChapterStartPage);
  const pnAlignClass =
    options.pageNumberPosition === "bottom-center"
      ? "left-0 right-0 text-center"
      : "right-[12%]"; // outside (홀수 우측 가정)
  const pnVerticalClass =
    options.pageNumberPosition === "top-outside" ? "top-[5%]" : "bottom-[5%]";

  return (
    <div
      className={`bg-[#1A1A1A] transition-[width,border-width] duration-300 flex flex-col overflow-hidden ${
        open ? "w-[380px] border-l border-border" : "w-0 border-l-0"
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
      <div className="flex-1 overflow-y-auto px-4 py-6 flex justify-center items-start">
        <div
          className="w-full max-w-[300px] bg-white rounded-[4px] shadow-[0_4px_24px_rgba(0,0,0,0.4)] relative"
          style={{ aspectRatio: "152 / 225" }}
        >
          <div
            className="absolute inset-0 pt-[10%] pb-[12%] px-[12%] overflow-hidden"
            style={{ fontFamily, fontSize, lineHeight }}
          >
            {isEmpty ? (
              <div className="text-[12px] text-[#999] text-center pt-10 leading-[1.7]">
                챕터를 입력하면
                <br />
                여기에 미리보기가 표시됩니다.
              </div>
            ) : (
              <>
                {options.showChapterNumber && (
                  <div
                    className="text-center font-bold text-[#111] mb-[6px]"
                    style={{ fontFamily: "sans-serif", fontSize: "11px" }}
                  >
                    제 {chapterNum.replace(/장$/, "")} 장
                  </div>
                )}
                <div
                  className="text-center font-bold text-[#111] mb-[14px] leading-[1.3]"
                  style={{ fontFamily: "sans-serif", fontSize: "15px" }}
                >
                  {title || "(제목 없음)"}
                </div>
                <div
                  className="text-[#2A2A2A] preview-body"
                  style={{ textAlign: "justify" }}
                >
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

          {pnVisible && !isEmpty && (
            <div
              className={`absolute ${pnVerticalClass} ${pnAlignClass}`}
              style={{ fontFamily: "serif", fontSize: "9px", color: "#666" }}
            >
              {options.pageNumberPosition === "bottom-center" ? "1" : "1"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
