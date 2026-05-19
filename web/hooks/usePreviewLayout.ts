"use client";

import { useLayoutEffect, useMemo, useState } from "react";
import type { BookOptions, PreviewDevice, TrimSize } from "@/types/book";

/**
 * usePreviewLayout — 미리보기 컨테이너 크기를 측정해 책 프레임의 실제 px 크기와
 * mm→px 스케일을 계산한다. ResizeObserver로 컨테이너 변화 추적.
 *
 * 입력:
 *   containerRef: 책 프레임을 담는 부모 컨테이너 (책 프레임 자체 ❌ — 측정 루프 방지)
 *   trim/options/device: 비율과 폰트/여백 계산용
 *
 * 출력:
 *   bookWidth/Height(px), 폰트/줄간격(px), 패딩(px), linesPerPage, charsPerLine
 */

// 판형 mm 크기 (가로×세로)
const TRIM_MM: Record<TrimSize, { w: number; h: number }> = {
  "신국판": { w: 152, h: 225 },
  "46배판": { w: 188, h: 257 },
  "문고판": { w: 105, h: 148 },
};

// 판형별 실제 여백 mm. 신국판은 1단계 Classic 사양을 그대로 쓴다.
const TRIM_MARGIN_MM: Record<
  TrimSize,
  { top: number; bottom: number; inner: number; outer: number }
> = {
  "신국판": { top: 22, bottom: 25, inner: 20, outer: 18 },
  "46배판": { top: 30, bottom: 34, inner: 22, outer: 18 },
  "문고판": { top: 20, bottom: 23, inner: 14, outer: 12 },
};

const MARGIN_MULT: Record<BookOptions["marginPreset"], number> = {
  narrow: 0.7,
  normal: 1.0,
  wide: 1.3,
};

const LINE_HEIGHT_MULT: Record<BookOptions["lineSpacing"], number> = {
  narrow: 1.6,
  normal: 1.8,
  wide: 2.0,
};

// 기기 비율 (width/height)
const DEVICE_RATIO: Record<Exclude<PreviewDevice, "print">, number> = {
  kindle: 3 / 4,
  ipad: 3 / 4,
  smartphone: 9 / 19.5,
};

// 한글 정사각형 가정 — fontSize 1px = 글자 1개 가로 (대략)
const KOR_CHAR_WIDTH_RATIO = 1.0;

interface UsePreviewLayoutInput {
  containerRef: React.RefObject<HTMLElement | null>;
  trim: TrimSize;
  options: BookOptions;
  device: PreviewDevice;
}

export interface PreviewLayout {
  bookWidth: number;
  bookHeight: number;
  scaleFactor: number; // px / mm
  fontSizePx: number;
  lineHeightPx: number;
  paddingPx: { top: number; bottom: number; inner: number; outer: number };
  bodyBoxPx: { width: number; height: number };
  linesPerPage: number;
  charsPerLine: number;
  ready: boolean;
}

export function usePreviewLayout(input: UsePreviewLayoutInput): PreviewLayout {
  const { containerRef, trim, options, device } = input;
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // 초기 측정
    const initRect = el.getBoundingClientRect();
    setBox({ w: initRect.width, h: initRect.height });

    const ro = new ResizeObserver((entries) => {
      const e = entries[0];
      if (!e) return;
      const { width, height } = e.contentRect;
      if (width > 0 && height > 0) setBox({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef]);

  return useMemo<PreviewLayout>(() => {
    if (!box || box.w < 1 || box.h < 1) {
      return {
        bookWidth: 0,
        bookHeight: 0,
        scaleFactor: 1,
        fontSizePx: 12,
        lineHeightPx: 18,
        paddingPx: { top: 0, bottom: 0, inner: 0, outer: 0 },
        bodyBoxPx: { width: 0, height: 0 },
        linesPerPage: 1,
        charsPerLine: 1,
        ready: false,
      };
    }

    const trimMM = TRIM_MM[trim];
    const ratio = device === "print" ? trimMM.w / trimMM.h : DEVICE_RATIO[device];

    // 컨테이너에 책을 끼워 넣되 상하좌우 6%씩 여유 (네비 영역과 분리되는 시각 마진)
    const maxByH = box.h * 0.94 * ratio;
    const maxByW = box.w * 0.94;
    const bookWidth = Math.min(maxByH, maxByW);
    const bookHeight = bookWidth / ratio;

    const trimWidthMm = trimMM.w;
    const scaleFactor = bookWidth / trimWidthMm;

    // pt → 실물 mm → 화면 px (실물 책이 0.X 배로 축소 표시됨)
    // 1pt = 25.4/72 mm. 그 다음 scaleFactor(px/mm) 곱.
    const ptStr = options.bodyFontSize.replace("pt", "");
    const bodyPt = parseFloat(ptStr) || 10;
    const fontSizeMm = bodyPt * (25.4 / 72);
    const fontSizePx = fontSizeMm * scaleFactor;
    const lineHeightPx = fontSizePx * (LINE_HEIGHT_MULT[options.lineSpacing] ?? 1.8);

    // 패딩 — print는 실제 mm 여백 × marginPreset 배율, 기기는 공통값(10% / 10% / 9% / 9%)
    const mult = MARGIN_MULT[options.marginPreset] ?? 1.0;
    const mmSafe = (n: number) => Math.max(0, n * mult * scaleFactor);

    let paddingPx;
    if (device === "print") {
      const margin = TRIM_MARGIN_MM[trim];
      paddingPx = {
        top: mmSafe(margin.top),
        bottom: mmSafe(margin.bottom),
        inner: mmSafe(margin.inner),
        outer: mmSafe(margin.outer),
      };
    } else {
      paddingPx = {
        top: bookHeight * 0.1,
        bottom: bookHeight * 0.1,
        inner: bookWidth * 0.09,
        outer: bookWidth * 0.09,
      };
    }

    const bodyBoxPx = {
      width: Math.max(0, bookWidth - paddingPx.inner - paddingPx.outer),
      height: Math.max(0, bookHeight - paddingPx.top - paddingPx.bottom),
    };

    const linesPerPage = Math.max(1, Math.floor(bodyBoxPx.height / Math.max(1, lineHeightPx)));
    const charsPerLine = Math.max(
      1,
      Math.floor(bodyBoxPx.width / Math.max(1, fontSizePx * KOR_CHAR_WIDTH_RATIO)),
    );

    return {
      bookWidth,
      bookHeight,
      scaleFactor,
      fontSizePx,
      lineHeightPx,
      paddingPx,
      bodyBoxPx,
      linesPerPage,
      charsPerLine,
      ready: true,
    };
  }, [box, trim, options.bodyFontSize, options.lineSpacing, options.marginPreset, device]);
}
