"use client";

// 인라인 책 프레임 미리보기 — 에디터 중앙 스크롤 영역에 ChapterForm 아래 직접 배치.
// 오른쪽 슬라이드 패널을 제거하고 판형 비율을 정확히 반영한다.
// 신국판 152×225 / 46배판 188×257 / 문고판 105×148
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

// 판형별 mm 치수 → 비율 계산
const TRIM_RATIO: Record<TrimSize, number> = {
  "신국판": 152 / 225,
  "46배판": 188 / 257,
  "문고판": 105 / 148,
};

const FONT_SIZE_PX: Record<BookOptions["bodyFontSize"], string> = {
  "9pt": "11.5px",
  "10pt": "12.5px",
  "11pt": "13.5px",
};

const LINE_HEIGHT: Record<BookOptions["lineSpacing"], string> = {
  narrow: "1.6",
  normal: "1.8",
  wide: "2.0",
};

export function InlinePreview({ options, trim, previewContent }: InlinePreviewProps) {
  const { chapterNum, title, body } = previewContent;
  const isEmpty = !title.trim() && !body.trim();

  const fontFamily = options.bodyFont === "sans" ? "sans-serif" : "serif";
  const fontSize = FONT_SIZE_PX[options.bodyFontSize];
  const lineHeight = LINE_HEIGHT[options.lineSpacing];
  const paragraphs = body.split(/\n+/).filter((p) => p.trim().length > 0);

  const ratio = TRIM_RATIO[trim];

  // 쪽번호 위치
  const isChapterStartPage = true;
  const pnVisible =
    options.showPageNumber &&
    !(options.hideChapterStartPageNumber && isChapterStartPage);

  let pnPositionStyle: React.CSSProperties = {};
  if (options.pageNumberPosition === "bottom-center") {
    pnPositionStyle = { bottom: "4%", left: 0, right: 0, textAlign: "center" };
  } else if (options.pageNumberPosition === "top-outside") {
    pnPositionStyle = { top: "4%", right: "10%" };
  } else {
    pnPositionStyle = { bottom: "4%", right: "10%" };
  }

  return (
    <div className="w-full max-w-[620px] mt-4 mb-2">
      {/* 레이블 */}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[10px] font-semibold text-text-muted uppercase tracking-[0.7px] flex-shrink-0">
          📖 미리보기 — {trim}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* 책 프레임 wrapper */}
      <div
        className="relative w-full"
        style={{ aspectRatio: `${ratio}`, maxHeight: "520px" }}
      >
        {/* 페이지 뒷장 두께 효과 */}
        <div
          className="absolute inset-0 rounded-[2px]"
          style={{
            transform: "translate(3px, 4px)",
            background: "#D8D4CC",
            boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0 rounded-[2px]"
          style={{
            transform: "translate(1.5px, 2px)",
            background: "#ECE7DD",
          }}
          aria-hidden
        />

        {/* 실제 종이 */}
        <div
          className="absolute inset-0 rounded-[2px] overflow-hidden"
          style={{
            background: "#FAFAFA",
            boxShadow: "0 8px 28px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)",
          }}
        >
          {/* 제본선 음영 */}
          <div
            className="absolute top-0 bottom-0 left-0 pointer-events-none"
            style={{
              width: "9%",
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
              paddingTop: "7%",
              paddingBottom: "8%",
              paddingLeft: "11%",
              paddingRight: "9%",
              fontFamily,
              fontSize,
              lineHeight,
              color: "#1F1B16",
            }}
          >
            {isEmpty ? (
              <div
                className="text-center leading-[1.7]"
                style={{ fontSize: "10px", color: "#BDBDBD", paddingTop: "18%" }}
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
                    style={{ fontFamily: "sans-serif", fontSize: "10px", color: "#111", marginBottom: "4px" }}
                  >
                    {chapterNum}
                  </div>
                )}
                <div
                  className="text-center font-bold leading-[1.3]"
                  style={{ fontFamily: "sans-serif", fontSize: "13px", color: "#111", marginBottom: "12px" }}
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
                fontSize: "8px",
                color: "#555",
              }}
            >
              1
            </div>
          )}
        </div>
      </div>

      {/* 판형 치수 표기 */}
      <div className="text-center text-[10px] text-text-muted mt-2">
        {trim === "신국판" && "152 × 225 mm"}
        {trim === "46배판" && "188 × 257 mm"}
        {trim === "문고판" && "105 × 148 mm"}
      </div>
    </div>
  );
}

// ─── 기존 PreviewPanel (슬라이드 패널) — 하위 호환을 위해 no-op 유지 ──────────
// EditorLayout에서 더 이상 렌더링하지 않지만, import 오류 방지용으로 남겨둔다.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function PreviewPanel(_props: {
  open: boolean;
  onClose: () => void;
  options: BookOptions;
  previewContent: { chapterNum: string; title: string; body: string };
}) {
  return null;
}
