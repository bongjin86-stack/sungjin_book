"use client";

// 인라인 책 프레임 미리보기 — 에디터 중앙 스크롤 영역에 ChapterForm 아래 직접 배치.
// 판형 비율 및 여백을 한국 단행본 출판 규격 기준으로 정확히 반영한다.
//
// 여백 기준 (Typst 표준 근사치):
//   신국판(152×225): top 20mm / bottom 22mm / inner 20mm / outer 16mm
//   46배판(188×257): top 22mm / bottom 25mm / inner 22mm / outer 18mm
//   문고판(105×148): top 14mm / bottom 16mm / inner 14mm / outer 12mm
//
// 퍼센트는 각 판형의 실제 mm 치수 대비 비율로 계산.
// Phase 2에서 Typst PDF 응답으로 교체 예정.

import type { BookOptions, TrimSize } from "@/types/book";

interface InlinePreviewProps {
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

// 판형별 여백 — 실제 mm 기준 퍼센트 (부모 너비 기준이므로 width 대비 계산)
// inner/outer는 width 기준, top/bottom은 height 기준이나
// CSS padding %는 모두 width 기준이므로 width로 통일하여 근사.
const TRIM_PADDING: Record<TrimSize, { top: string; bottom: string; inner: string; outer: string }> = {
  "신국판": { top: "13.2%", bottom: "14.5%", inner: "13.2%", outer: "10.5%" },
  // 20/152=13.2%, 22/152=14.5%, 20/152=13.2%, 16/152=10.5%
  "46배판": { top: "11.7%", bottom: "13.3%", inner: "11.7%", outer: "9.6%"  },
  // 22/188=11.7%, 25/188=13.3%, 22/188=11.7%, 18/188=9.6%
  "문고판": { top: "13.3%", bottom: "15.2%", inner: "13.3%", outer: "11.4%" },
  // 14/105=13.3%, 16/105=15.2%, 14/105=13.3%, 12/105=11.4%
};

const TRIM_SIZE_LABEL: Record<TrimSize, string> = {
  "신국판": "152 × 225 mm",
  "46배판": "188 × 257 mm",
  "문고판": "105 × 148 mm",
};

const FONT_SIZE_PX: Record<BookOptions["bodyFontSize"], string> = {
  "9pt":  "11px",
  "10pt": "12px",
  "11pt": "13px",
};

const LINE_HEIGHT: Record<BookOptions["lineSpacing"], string> = {
  narrow: "1.6",
  normal: "1.8",
  wide:   "2.0",
};

export function InlinePreview({ options, trim, previewContent }: InlinePreviewProps) {
  const { chapterNum, title, body } = previewContent;
  const isEmpty = !title.trim() && !body.trim();

  const fontFamily = options.bodyFont === "sans" ? "sans-serif" : "serif";
  const fontSize   = FONT_SIZE_PX[options.bodyFontSize];
  const lineHeight = LINE_HEIGHT[options.lineSpacing];
  const paragraphs = body.split(/\n+/).filter((p) => p.trim().length > 0);

  const ratio   = TRIM_RATIO[trim];
  const padding = TRIM_PADDING[trim];

  // 쪽번호 위치
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
    // bottom-outside (기본) — 홀수 페이지 가정 → 외측 = 오른쪽
    pnPositionStyle = { bottom: padding.bottom, right: padding.outer };
  }

  return (
    <div className="w-full max-w-[620px] mt-6 mb-2">
      {/* 구분선 + 레이블 */}
      <div className="flex items-center gap-2 mb-4">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[10px] font-semibold text-text-muted uppercase tracking-[0.7px] flex-shrink-0">
          📖 미리보기 — {trim}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* 책 프레임 wrapper — aspect-ratio로 판형 비율 정확 반영 */}
      <div
        className="relative w-full"
        style={{ aspectRatio: `${ratio}` }}
      >
        {/* 페이지 뒷장 두께 효과 */}
        <div
          className="absolute inset-0 rounded-[2px]"
          style={{ transform: "translate(3px, 4px)", background: "#D8D4CC", boxShadow: "0 2px 8px rgba(0,0,0,0.18)" }}
          aria-hidden
        />
        <div
          className="absolute inset-0 rounded-[2px]"
          style={{ transform: "translate(1.5px, 2px)", background: "#ECE7DD" }}
          aria-hidden
        />

        {/* 실제 종이 */}
        <div
          className="absolute inset-0 rounded-[2px] overflow-hidden"
          style={{ background: "#FAFAFA", boxShadow: "0 8px 28px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)" }}
        >
          {/* 제본선(spine) 음영 */}
          <div
            className="absolute top-0 bottom-0 left-0 pointer-events-none"
            style={{ width: padding.inner, background: "linear-gradient(to right, rgba(0,0,0,0.14) 0%, rgba(0,0,0,0.06) 40%, rgba(0,0,0,0) 100%)" }}
            aria-hidden
          />
          <div
            className="absolute top-0 bottom-0 left-0 pointer-events-none"
            style={{ width: "1px", background: "rgba(0,0,0,0.12)" }}
            aria-hidden
          />

          {/* 본문 영역 — 판형별 여백 정확 적용 */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              paddingTop:    padding.top,
              paddingBottom: padding.bottom,
              paddingLeft:   padding.inner,
              paddingRight:  padding.outer,
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
                    style={{ fontFamily: "sans-serif", fontSize: "9px", color: "#111", marginBottom: "3px" }}
                  >
                    {chapterNum}
                  </div>
                )}
                <div
                  className="text-center font-bold leading-[1.3]"
                  style={{ fontFamily: "sans-serif", fontSize: "11px", color: "#111", marginBottom: "10px" }}
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
              style={{ ...pnPositionStyle, fontFamily: "serif", fontSize: "7px", color: "#555" }}
            >
              1
            </div>
          )}
        </div>
      </div>

      {/* 판형 치수 표기 */}
      <div className="text-center text-[10px] text-text-muted mt-2">
        {TRIM_SIZE_LABEL[trim]}
      </div>
    </div>
  );
}

// ─── 기존 PreviewPanel (슬라이드 패널) — 하위 호환 no-op ──────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function PreviewPanel(_props: {
  open: boolean;
  onClose: () => void;
  options: BookOptions;
  previewContent: { chapterNum: string; title: string; body: string };
}) {
  return null;
}
