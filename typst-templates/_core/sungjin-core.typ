// sungjin-core.typ — 성진북스 공통 조판 도구 상자
//
// 단행본(sungjin-book-classic)·교재(sungjin-edu-test-paper) 두 도메인이 함께 쓰는
// 조판 프리미티브. 도메인 렌더러는 들어있지 않음. "엔진이 아니라 도구 상자".
//
// 구성:
//   - 폰트 정의
//   - 색·간격 디자인 토큰
//   - 한국어 기본 설정(setup-korean)
//   - placeholder(<그림>/<표>) 박스
//   - info-box(자료/<보기> 박스)
//   - 인라인 수식 마커(⟦...⟧) 처리
//   - 인라인 이미지 마커(⟨IMG:path⟩) 처리
//
// 사용:
//   #import "/typst-templates/_core/sungjin-core.typ": *

// ── 폰트 ─────────────────────────────────────────────────────────────────────
#let serif-fonts = ("Noto Serif KR",)
#let sans-fonts  = ("Noto Sans KR", "Noto Serif KR")
#let mono-fonts  = ("Consolas", "Courier New", "Noto Sans KR")

// ── 색 토큰 (단행본 D-021 쪽빛 #2a3a5a 기준) ─────────────────────────────────
#let ink-strong  = luma(30)       // 본문 강조: 번호, 헤더
#let ink-body    = luma(20)       // 본문
#let ink-muted   = luma(110)      // 보조 텍스트: 3점 표시, 페이지번호
#let line-strong = luma(40)       // 굵은 가로선
#let line-thin   = luma(170)      // 가는 가로/세로선
#let box-fill    = luma(248)      // 자료/<보기> 박스 배경
#let box-stroke  = luma(180)      // 자료/<보기> 박스 테두리
#let accent      = rgb("#2a3a5a") // 쪽빛 — 단행본 액센트 컬러

// ── 간격 토큰 ────────────────────────────────────────────────────────────────
#let leading-tight = 0.55em
#let leading-body  = 0.62em
#let leading-loose = 0.75em

// ── 한국어 기본 설정 ─────────────────────────────────────────────────────────
// 도메인 템플릿이 set page 후 호출한다. 본문 폰트·언어·자간을 한 번에 박는다.
#let setup-korean(size: 9.8pt, leading: leading-body) = {
  set text(
    font: serif-fonts,
    size: size,
    lang: "ko",
    fill: ink-body,
    cjk-latin-spacing: auto,
  )
  set par(
    justify: true,
    leading: leading,
    first-line-indent: 0pt,
  )
}

// ── <그림>/<표> placeholder 박스 ─────────────────────────────────────────────
// 텍스트 추출 단계에서 표/그림이 빠진 자리에 회색 박스로 표시.
#let placeholder(label) = box(
  fill: luma(238),
  stroke: 0.3pt + line-thin,
  inset: (x: 0.45em, y: 0.1em),
  outset: (y: 0.15em),
  radius: 1.5pt,
)[#text(font: sans-fonts, size: 0.82em, fill: luma(80))[#label]]

// ── 자료/<보기> 박스 ────────────────────────────────────────────────────────
// 묶음 지문, 자료 표, <보기> ㄱㄴㄷㄹ 박스 등에 사용.
#let info-box(
  body,
  label: none,
  width: 100%,
  fill: box-fill,
  stroke-color: box-stroke,
) = block(
  fill: fill,
  stroke: 0.4pt + stroke-color,
  inset: (left: 8pt, top: 7pt, right: 7pt, bottom: 7pt),
  spacing: 1em,
  breakable: true,
  width: width,
  radius: 2pt,
)[
  #if label != none [
    #text(font: sans-fonts, weight: "bold", size: 0.92em, fill: ink-strong)[#label]
    #v(0.45em, weak: true)
  ]
  #body
]

// ── 마커 처리 헬퍼 ───────────────────────────────────────────────────────────
// 추출 파이프라인이 본문 텍스트에 박은 마커들:
//   ⟦typst-math⟧    — 인라인 수식 (영어 보기의 $100 가격과 충돌 회피용)
//   ⟨IMG:path⟩      — 인라인 이미지 (BinData에서 추출된 PNG)
//   <그림>, <표>     — 텍스트 추출 단계에서 표/그림이 빠진 자리
//
// render-with-markers는 이 마커들을 모두 자동 치환한다.
// 도메인 템플릿이 발문/보기/문단 내용 표시 시 사용.
#let render-with-markers(s) = {
  show "<그림>": placeholder("그림")
  show "<표>":   placeholder("표")
  show regex("⟦([^⟧]*)⟧"): m => {
    let body = m.text.replace("⟦", "").replace("⟧", "").trim()
    if body == "" {
      text(fill: luma(160))[#sym.dots.h]
    } else {
      eval("$" + body + "$", mode: "markup")
    }
  }
  show regex("⟨IMG:[^⟩]+⟩"): m => {
    let path = m.text.replace("⟨IMG:", "").replace("⟩", "").trim()
    box(image(path, width: 100%), width: 90%)
  }
  s
}

// ── 본문 영역 끝에 두는 푸터 헬퍼 ────────────────────────────────────────────
// 페이지 하단 영역명 + 현재/총 페이지. 단행본·교재 공용 패턴.
#let page-footer(label) = context align(center)[
  #text(font: sans-fonts, size: 8.5pt, fill: ink-muted)[
    #label · #counter(page).get().at(0) / #counter(page).final().at(0)
  ]
]

// ── 상단 헤더 (가로선 + 좌·중·우 3분할) ──────────────────────────────────────
// 평가원 시험지 풍 헤더. 단행본은 다른 헤더 패턴이라 도메인별로 다시 짜도 됨.
// 인자명을 alignment 키워드(left/right/center)와 안 겹치게 *-text로
#let three-part-header(left-text: [], center-text: [], right-text: []) = block(width: 100%)[
  #line(length: 100%, stroke: 1.2pt + line-strong)
  #v(2pt, weak: true)
  #grid(
    columns: (1fr, auto, 1fr),
    align: (left + horizon, center + horizon, right + horizon),
    text(font: sans-fonts, size: 9pt, fill: ink-muted)[#left-text],
    text(font: sans-fonts, size: 13pt, weight: "bold", fill: ink-strong)[#center-text],
    text(font: sans-fonts, size: 12pt, weight: "bold", fill: ink-strong)[#right-text],
  )
  #v(2pt, weak: true)
  #line(length: 100%, stroke: 0.4pt + line-thin)
]
