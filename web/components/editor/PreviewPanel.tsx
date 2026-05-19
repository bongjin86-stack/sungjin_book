"use client";

// BookPreviewPanel — 에디터 우측에 항상 고정되는 책 미리보기 패널 (Vellum/Atticus 스타일).
// 다크 배경 안에 판형 비율 책 프레임을 세로 중앙 정렬로 표시.
// 판형 여백은 한국 단행본 출판 규격 기준의 mm 비율을 그대로 적용.
//
// 여백 기준 (Typst 표준 근사치):
//   신국판(152×225): top 20mm / bottom 22mm / inner 20mm / outer 16mm
//   46배판(188×257): top 22mm / bottom 25mm / inner 22mm / outer 18mm
//   문고판(105×148): top 14mm / bottom 16mm / inner 14mm / outer 12mm
//
// Phase 2에서 책 프레임 내용은 Typst PDF 응답으로 교체될 예정.

import type { BookOptions, TrimSize } from "@/types/book";

interface BookPreviewPanelProps {
  options: BookOptions;
  trim: TrimSize;
  previewContent: {
    chapterNum: string;
    title: string;
    body: string;
  };
}

// 판형별 비율 (width / height)
const TRIM_RATIO: Record<TrimSize, number> = {
  "신국판": 152 / 225,
  "46배판": 188 / 257,
  "문고판": 105 / 148,
};

// 판형별 여백 — CSS padding %는 width 기준이므로 width로 통일하여 근사.
const TRIM_PADDING: Record<
  TrimSize,
  { top: string; bottom: string; inner: string; outer: string }
> = {
  "신국판": { top: "13.2%", bottom: "14.5%", inner: "13.2%", outer: "10.5%" },
  "46배판": { top: "11.7%", bottom: "13.3%", inner: "11.7%", outer: "9.6%" },
  "문고판": { top: "13.3%", bottom: "15.2%", inner: "13.3%", outer: "11.4%" },
};

const TRIM_SIZE_LABEL: Record<TrimSize, string> = {
  "신국판": "152 × 225",
  "46배판": "188 × 257",
  "문고판": "105 × 148",
};

const FONT_SIZE_PX: Record<BookOptions["bodyFontSize"], string> = {
  "9pt": "11px",
  "10pt": "12px",
  "11pt": "13px",
};

const LINE_HEIGHT: Record<BookOptions["lineSpacing"], string> = {
  narrow: "1.6",
  normal: "1.8",
  wide: "2.0",
};

export function BookPreviewPanel({ options, trim, previewContent }: BookPreviewPanelProps) {
  const { chapterNum, title, body } = previewContent;
  const isEmpty = !title.trim() && !body.trim();

  const fontFamily = options.bodyFont === "sans" ? "sans-serif" : "serif";
  const fontSize = FONT_SIZE_PX[options.bodyFontSize];
  const lineHeight = LINE_HEIGHT[options.lineSpacing];
  const paragraphs = body.split(/\n+/).filter((p) => p.trim().length > 0);

  const ratio = TRIM_RATIO[trim];
  const padding = TRIM_PADDING[trim];

  // 쪽번호 위치 (미리보기는 1페이지 = 챕터 시작 = 홀수 가정 → 외측 = 오른쪽)
  const isChapterStartPage = true;
  const pnVisible =
    options.showPageNumber &&
    !(options.hideChapterStartPageNumber && isChapterStartPage);

  let pnPositionStyle: React.CSSProperties = {};
  if (options.pageNumberPosition === "bottom-center") {
    pnPositionStyle = { bottom: padding.bottom, left: 0, right: 0, textAlign: "center" };
  } else if (options.pageNumberPosition === "top-outside") {
    pnPositionStyle = { top: padding.top, right: padding.outer };
  } else {
    pnPositionStyle = { bottom: padding.bottom, right: padding.outer };
  }

  return (
    <aside className="w-[300px] flex-shrink-0 bg-[#1C1C1E] border-l border-[#2A2A2A] flex flex-col overflow-hidden">
      {/* 상단 툴바 */}
      <div className="h-10 px-3 flex items-center justify-between border-b border-[#2A2A2A] flex-shrink-0">
        <span className="text-[11px] text-[#BBB] font-medium">
          {trim} {TRIM_SIZE_LABEL[trim]}
        </span>
        <span className="text-[11px] text-[#888]">인쇄본</span>
      </div>

      {/* 책 프레임 영역 — 높이 기준 크기 결정, 세로 중앙 정렬 */}
      <div className="flex-1 flex items-center justify-center px-5 py-5 overflow-hidden">
        {/*
          높이 기준으로 책 크기를 결정한다.
          패널 높이(flex-1)에서 상하 padding(py-5 = 40px)과 상하 툴바(h-10 × 2 = 80px),
          헤더/상태바 합산을 빼서 실제 사용 가능 높이를 산출. 90% 사용, 너비는 aspect-ratio로 자동.
          max-w는 패널 너비(300px) - 좌우 패딩(40px) = 260px로 제한.
        */}
        <div
          className="relative"
          style={{
            aspectRatio: `${ratio}`,
            height: "min(90%, calc(90vh - 220px))",
            maxWidth: "260px",
            width: "auto",
          }}
        >
          {/* 페이지 뒷장 두께 효과 */}
          <div
            className="absolute inset-0 rounded-[2px]"
            style={{
              transform: "translate(3px, 4px)",
              background: "#3A3633",
              boxShadow: "0 2px 8px rgba(0,0,0,0.45)",
            }}
            aria-hidden
          />
          <div
            className="absolute inset-0 rounded-[2px]"
            style={{ transform: "translate(1.5px, 2px)", background: "#4D4843" }}
            aria-hidden
          />

          {/* 실제 종이 */}
          <div
            className="absolute inset-0 rounded-[2px] overflow-hidden"
            style={{
              background: "#FAFAFA",
              boxShadow: "0 10px 28px rgba(0,0,0,0.55), 0 3px 10px rgba(0,0,0,0.35)",
            }}
          >
            {/* 제본선(spine) 음영 */}
            <div
              className="absolute top-0 bottom-0 left-0 pointer-events-none"
              style={{
                width: padding.inner,
                background:
                  "linear-gradient(to right, rgba(0,0,0,0.14) 0%, rgba(0,0,0,0.06) 40%, rgba(0,0,0,0) 100%)",
              }}
              aria-hidden
            />
            <div
              className="absolute top-0 bottom-0 left-0 pointer-events-none"
              style={{ width: "1px", background: "rgba(0,0,0,0.12)" }}
              aria-hidden
            />

            {/* 본문 영역 */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{
                paddingTop: padding.top,
                paddingBottom: padding.bottom,
                paddingLeft: padding.inner,
                paddingRight: padding.outer,
                fontFamily,
                fontSize,
                lineHeight,
                color: "#1F1B16",
              }}
            >
              {isEmpty ? (
                <div
                  className="text-center leading-[1.7]"
                  style={{ fontSize: "9px", color: "#BDBDBD", paddingTop: "15%" }}
                >
                  챕터를 입력하면
                  <br />
                  여기에 미리보기가 표시됩니다.
                </div>
              ) : (
                <>
                  {options.showChapterNumber && (
                    <div
                      className="text-center font-bold"
                      style={{
                        fontFamily: "sans-serif",
                        fontSize: "9px",
                        color: "#111",
                        marginBottom: "3px",
                      }}
                    >
                      {chapterNum}
                    </div>
                  )}
                  <div
                    className="text-center font-bold leading-[1.3]"
                    style={{
                      fontFamily: "sans-serif",
                      fontSize: "11px",
                      color: "#111",
                      marginBottom: "10px",
                    }}
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
                        // Drop Caps는 ::first-letter라 inline style 불가 → 클래스로 처리
                        className={options.dropCaps && i === 0 ? "drop-caps-para" : ""}
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
                  fontSize: "7px",
                  color: "#555",
                }}
              >
                1
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 하단 페이지 네비게이션 */}
      <div className="h-10 px-3 flex items-center justify-center border-t border-[#2A2A2A] flex-shrink-0">
        <span className="text-[11px] text-[#888]">1 / 1</span>
      </div>
    </aside>
  );
}
