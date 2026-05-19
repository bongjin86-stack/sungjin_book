"use client";

// BookPreviewPanel — 에디터 우측에 항상 고정되는 미리보기 패널 (Vellum/Atticus 스타일).
// 인쇄본(판형 비율)과 전자기기(Kindle/iPad/Smartphone) 프레임을 전환할 수 있다.
//
// 크기 결정:
//   기기 프레임 너비는 160px 고정, 높이는 비율로 자동 계산.
//   세로가 패널보다 길면 overflow-y-auto 스크롤, 짧으면 세로 중앙 정렬.
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

const FRAME_WIDTH = 160; // px — 모든 기기 프레임의 너비 고정

export function BookPreviewPanel({ options, trim, previewContent }: BookPreviewPanelProps) {
  const [device, setDevice] = useState<PreviewDevice>("print");

  const { chapterNum, title, body } = previewContent;
  const isEmpty = !title.trim() && !body.trim();

  const fontFamily = options.bodyFont === "sans" ? "sans-serif" : "serif";
  const fontSize = FONT_SIZE_PX[options.bodyFontSize];
  const lineHeight = LINE_HEIGHT[options.lineSpacing];
  const paragraphs = body.split(/\n+/).filter((p) => p.trim().length > 0);

  const ratio = device === "print" ? TRIM_RATIO[trim] : DEVICE_RATIO[device];

  // 본문 영역 padding — print 는 판형별, 전자기기는 공통값
  const padding = device === "print" ? TRIM_PADDING[trim] : DEVICE_PADDING;

  // 쪽번호 (인쇄본만)
  const isChapterStartPage = true;
  const pnVisible =
    device === "print" &&
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
    <aside className="w-[280px] flex-shrink-0 bg-[#1C1C1E] border-l border-[#2A2A2A] flex flex-col overflow-hidden">
      {/* 상단 툴바 — 기기 라벨 */}
      <div className="h-10 px-3 flex items-center justify-between border-b border-[#2A2A2A] flex-shrink-0">
        <span className="text-[11px] text-[#BBB] font-medium">
          {device === "print" ? `${trim} ${TRIM_SIZE_LABEL[trim]}` : deviceLabel(device)}
        </span>
        <span className="text-[11px] text-[#888]">
          {device === "print" ? "인쇄본" : "전자책"}
        </span>
      </div>

      {/* 프레임 영역 */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-4 py-5">
        {device === "print" ? (
          <PrintFrame
            ratio={ratio}
            paddingInner={padding.inner}
            innerBody={innerBody}
            pnVisible={pnVisible && !isEmpty}
            pnPositionStyle={pnPositionStyle}
          />
        ) : (
          <DeviceFrame device={device} ratio={ratio} innerBody={innerBody} />
        )}
      </div>

      {/* 하단 — 기기 전환 드롭다운 */}
      <div className="h-10 px-3 flex items-center justify-center border-t border-[#2A2A2A] flex-shrink-0">
        <select
          value={device}
          onChange={(e) => setDevice(e.target.value as PreviewDevice)}
          className="bg-transparent text-[11px] text-[#BBB] outline-none cursor-pointer"
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

function deviceLabel(device: Exclude<PreviewDevice, "print">): string {
  if (device === "kindle") return "Kindle Paperwhite";
  if (device === "ipad") return "iPad";
  return "스마트폰";
}

// ─── 인쇄본 프레임 (종이/제본선/쪽번호) ──────────────────────────────────────
function PrintFrame({
  ratio,
  paddingInner,
  innerBody,
  pnVisible,
  pnPositionStyle,
}: {
  ratio: number;
  paddingInner: string;
  innerBody: React.ReactNode;
  pnVisible: boolean;
  pnPositionStyle: React.CSSProperties;
}) {
  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: `${FRAME_WIDTH}px`, aspectRatio: `${ratio}` }}
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
            width: paddingInner,
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

        {innerBody}

        {pnVisible && (
          <div
            className="absolute pointer-events-none"
            style={{ ...pnPositionStyle, fontFamily: "serif", fontSize: "7px", color: "#555" }}
          >
            1
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
  // Kindle: 회색 베젤, iPad/Smartphone: 검은 베젤
  const bezelColor = isKindle ? "#A8A29A" : "#1A1A1A";
  const screenBg = isKindle ? "#F2EFE9" : "#FFFFFF";
  // 베젤 두께(% width 기준) — 폰은 얇게, 패드/킨들은 살짝 두껍게
  const bezel = device === "smartphone" ? "5%" : "6%";
  const radius = device === "smartphone" ? "14px" : "8px";

  return (
    <div
      className="relative flex-shrink-0"
      style={{
        width: `${FRAME_WIDTH}px`,
        aspectRatio: `${ratio}`,
        background: bezelColor,
        borderRadius: radius,
        padding: bezel,
        boxShadow: "0 10px 24px rgba(0,0,0,0.5), 0 3px 8px rgba(0,0,0,0.35)",
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
