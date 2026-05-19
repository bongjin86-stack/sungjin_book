"use client";

// BookPreviewPanel — 에디터 우측에 항상 고정되는 미리보기 패널 (Vellum/Atticus 스타일).
// 인쇄본(판형 비율)과 전자기기(Kindle/iPad/Smartphone) 프레임을 전환할 수 있다.
//
// 판형 여백 기준 (Typst 표준 근사치 — 절대 변경 금지):
//   신국판(152×225): top 20mm / bottom 22mm / inner 20mm / outer 16mm
//   46배판(188×257): top 22mm / bottom 25mm / inner 22mm / outer 18mm
//   문고판(105×148): top 14mm / bottom 16mm / inner 14mm / outer 12mm

import { useState } from "react";
import type { BookOptions, PreviewDevice, TrimSize } from "@/types/book";

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

// 판형별 여백 — CSS padding % 는 부모 너비 기준이므로 너비 기준 % 로 환산.
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

// 전자기기 비율 (width / height)
const DEVICE_RATIO: Record<Exclude<PreviewDevice, "print">, number> = {
  kindle: 3 / 4,         // 0.75
  ipad: 3 / 4,           // 0.75
  smartphone: 9 / 19.5,  // ≈ 0.461
};

// 전자기기 본문 padding — 베젤 안쪽 본문 영역 (% width 기준)
const DEVICE_PADDING = {
  top: "10%",
  bottom: "10%",
  inner: "9%",
  outer: "9%",
} as const;

// 미리보기 폰트 크기 — 책 프레임 너비가 작아 실제 mm 비율보다 키워서 옵션 차이가 눈에 보이게.
// (정확한 mm→px 변환은 2단계 동적 레이아웃에서 처리)
const FONT_SIZE_PX: Record<BookOptions["bodyFontSize"], string> = {
  "9pt": "13px",
  "10pt": "15px",
  "11pt": "17px",
};

// 여백 프리셋 배율 — 판형별 기준 여백에 곱하는 계수
const MARGIN_MULTIPLIER: Record<BookOptions["marginPreset"], number> = {
  narrow: 0.7,
  normal: 1.0,
  wide: 1.3,
};

function scalePadding(
  base: { top: string; bottom: string; inner: string; outer: string },
  mult: number,
) {
  const scale = (s: string) => {
    const n = parseFloat(s);
    return `${(n * mult).toFixed(2)}%`;
  };
  return { top: scale(base.top), bottom: scale(base.bottom), inner: scale(base.inner), outer: scale(base.outer) };
}

const LINE_HEIGHT: Record<BookOptions["lineSpacing"], string> = {
  narrow: "1.6",
  normal: "1.8",
  wide: "2.0",
};

function deviceLabel(device: Exclude<PreviewDevice, "print">): string {
  if (device === "kindle") return "Kindle Paperwhite";
  if (device === "ipad") return "iPad";
  return "스마트폰";
}

export function BookPreviewPanel({ options, trim, previewContent }: BookPreviewPanelProps) {
  const [device, setDevice] = useState<PreviewDevice>("print");

  const { chapterNum, title, body } = previewContent;
  const isEmpty = !title.trim() && !body.trim();

  const fontFamily = options.bodyFont === "sans" ? "sans-serif" : "serif";
  const fontSize = FONT_SIZE_PX[options.bodyFontSize];
  const lineHeight = LINE_HEIGHT[options.lineSpacing];
  const paragraphs = body.split(/\n+/).filter((p) => p.trim().length > 0);

  const ratio = device === "print" ? TRIM_RATIO[trim] : DEVICE_RATIO[device];

  // 본문 영역 padding — print 는 판형별 × 여백 프리셋 배율, 전자기기는 공통값
  const padding =
    device === "print"
      ? scalePadding(TRIM_PADDING[trim], MARGIN_MULTIPLIER[options.marginPreset])
      : DEVICE_PADDING;

  // 쪽번호 (인쇄본만).
  // 미리보기는 "본문 페이지" 기준으로 옵션 효과를 보여준다 — showPageNumber 토글이 즉시 보이도록
  // 챕터 시작 페이지에서 숨김 처리하는 옵션(hideChapterStartPageNumber)은 2단계 페이지 분할에서 실제 동작.
  const previewPageNumber = 2;
  const pnVisible = device === "print" && options.showPageNumber;

  let pnPositionStyle: React.CSSProperties = {};
  if (options.pageNumberPosition === "bottom-center") {
    pnPositionStyle = { bottom: padding.bottom, left: 0, right: 0, textAlign: "center" };
  } else if (options.pageNumberPosition === "top-outside") {
    pnPositionStyle = { top: padding.top, right: padding.outer };
  } else {
    pnPositionStyle = { bottom: padding.bottom, right: padding.outer };
  }

  const innerBody = (
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
                className={options.dropCaps && i === 0 ? "drop-caps-para" : ""}
              >
                {p}
              </p>
            ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    /* 밝은 크림색 배경 — 에디터 영역과 자연스럽게 이어지도록 */
    <aside className="w-full h-full bg-[#EDEBE5] border-l border-border flex flex-col overflow-hidden">
      {/* 상단 툴바 */}
      <div className="h-10 px-4 flex items-center justify-between border-b border-border flex-shrink-0">
        <span className="text-[11px] text-text-secondary font-medium">
          {device === "print" ? `${trim} ${TRIM_SIZE_LABEL[trim]}` : deviceLabel(device)}
        </span>
        <span className="text-[11px] text-text-muted">
          {device === "print" ? "인쇄본" : "전자책"}
        </span>
      </div>

      {/* 프레임 영역 — 패널 너비의 75% 를 프레임 너비로 사용, max-w 제한 없음 */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-4 py-8">
        {device === "print" ? (
          <div className="w-[75%] min-w-[140px]">
            <PrintFrame
              ratio={ratio}
              paddingInner={padding.inner}
              innerBody={innerBody}
              pnVisible={pnVisible && !isEmpty}
              pnPositionStyle={pnPositionStyle}
              pageNumber={previewPageNumber}
            />
          </div>
        ) : (
          <div className="w-[75%] min-w-[140px]">
            <DeviceFrame device={device} ratio={ratio} innerBody={innerBody} />
          </div>
        )}
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

// ─── 인쇄본 프레임 (종이/제본선/쪽번호) ──────────────────────────────────────
function PrintFrame({
  ratio,
  paddingInner,
  innerBody,
  pnVisible,
  pnPositionStyle,
  pageNumber,
}: {
  ratio: number;
  paddingInner: string;
  innerBody: React.ReactNode;
  pnVisible: boolean;
  pnPositionStyle: React.CSSProperties;
  pageNumber: number;
}) {
  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: "100%", aspectRatio: `${ratio}` }}
    >
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

      {/* 실제 종이 */}
      <div
        className="absolute inset-0 rounded-[2px] overflow-hidden"
        style={{
          background: "#FAFAFA",
          boxShadow: "0 6px 20px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.10)",
        }}
      >
        {/* 제본선(spine) 음영 */}
        <div
          className="absolute top-0 bottom-0 left-0 pointer-events-none"
          style={{
            width: paddingInner,
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

        {innerBody}

        {pnVisible && (
          <div
            className="absolute pointer-events-none"
            style={{ ...pnPositionStyle, fontFamily: "serif", fontSize: "9px", color: "#555" }}
          >
            {pageNumber}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 전자기기 프레임 (Kindle / iPad / Smartphone) ────────────────────────────
function DeviceFrame({
  device,
  ratio,
  innerBody,
}: {
  device: Exclude<PreviewDevice, "print">;
  ratio: number;
  innerBody: React.ReactNode;
}) {
  const isKindle = device === "kindle";
  // Kindle: 따뜻한 회색 베젤, iPad/Smartphone: 어두운 베젤
  const bezelColor = isKindle ? "#8A8480" : "#2A2A2A";
  const screenBg = isKindle ? "#F2EFE9" : "#FFFFFF";
  const bezel = device === "smartphone" ? "5%" : "6%";
  const radius = device === "smartphone" ? "14px" : "8px";

  return (
    <div
      className="relative flex-shrink-0"
      style={{
        width: "100%",
        aspectRatio: `${ratio}`,
        background: bezelColor,
        borderRadius: radius,
        padding: bezel,
        boxShadow: "0 8px 20px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.12)",
      }}
    >
      {/* 화면 */}
      <div
        className="relative w-full h-full overflow-hidden"
        style={{
          background: screenBg,
          borderRadius: device === "smartphone" ? "6px" : "3px",
        }}
      >
        {innerBody}
      </div>
    </div>
  );
}
