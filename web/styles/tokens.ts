// 디자인 토큰 — D-021 (액센트 = 쪽빛) + Vellum 디자인 분석 (회색 3단계).
// CSS 변수와 TS 상수 모두 노출. 컴포넌트는 이 모듈에서 import만, 하드코딩 금지.

export const tokens = {
  /** 단일 액센트. 버튼 활성·선택·로고·강조 텍스트에만. (D-021) */
  accent: "#2a3a5a",

  /** 페이지 배경 — 차가운 회색. 흰색 아님. (Vellum 분석 1.1) */
  bgPage: "#f4f4f3",

  /** 3패널 배경 진폭. 보더 없이 색 단계차로만 분리. */
  bgPane: {
    left: "#f7f6f4", // 따뜻한 라이트 — 구조(목차)
    center: "#ffffff", // 흰색 — 글(본문)
    right: "#e8e6e3", // 차가운 진한 — 결과(미리보기, 전시 케이스)
  },

  /** 텍스트 톤. 순흑색은 회피. */
  text: {
    body: "#222",
    muted: "#777",
    onAccent: "#ffffff",
  },
} as const;

/**
 * `globals.css`의 `:root`에서 사용하는 CSS 변수 이름.
 * - 컴포넌트는 가능하면 CSS 변수 (`var(--accent)`) 사용.
 * - 동적 계산이 필요한 경우만 TS 상수 사용.
 */
export const cssVar = {
  accent: "var(--accent)",
  bgPage: "var(--bg-page)",
  bgPaneLeft: "var(--bg-pane-left)",
  bgPaneCenter: "var(--bg-pane-center)",
  bgPaneRight: "var(--bg-pane-right)",
  textBody: "var(--text-body)",
  textMuted: "var(--text-muted)",
  textOnAccent: "var(--text-on-accent)",
} as const;
