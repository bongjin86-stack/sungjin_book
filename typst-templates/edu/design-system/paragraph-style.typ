// design-system/paragraph-style.typ
//
// 인디자인의 "Paragraph Style" 개념을 typst로 매핑.
//
// 사용법:
//   #import "/typst-templates/edu/design-system/paragraph-style.typ": apply-para-style
//   #let style-body = (font: ("Noto Serif KR",), size: 10pt, leading: 0.62em)
//   #apply-para-style(style-body, [본문 내용])
//
// 인디자인 paragraph style의 핵심 속성 → typst:
//   font/style       → text(font:, weight:, style:)
//   size             → text(size:)
//   tracking (자간)  → text(tracking:)
//   color            → text(fill:)
//   leading (행간)   → par(leading:)
//   indent           → par(first-line-indent:) + block(inset:)
//   space before/after → block(above:, below:)
//   alignment        → par(justify:) + align()
//   start paragraph  → pagebreak(weak:, to:)

// Baseline grid — 좌단/우단 줄이 같은 y에 정렬되게 모든 spacing을 grid 배수로.
// 본문 leading (18pt) 기준. 다른 spec.leading은 이 grid 안에서 흡수.
#let BASELINE_GRID = 18pt
#let _grid-snap(d) = {
  if d == 0pt { 0pt } else {
    let n = calc.ceil(d / BASELINE_GRID)
    n * BASELINE_GRID
  }
}

// 기본값 — spec에 없는 키는 여기서 채워짐
#let default-spec = (
  font: ("Noto Serif KR",),
  size: 10pt,
  weight: "regular",
  style: "normal",
  fill: rgb("#222222"),
  tracking: 0pt,
  leading: 0.65em,
  first-line-indent: 0pt,
  left-indent: 0pt,
  right-indent: 0pt,
  space-before: 0pt,
  space-after: 0pt,
  alignment: "justify", // left | right | center | justify
  underline: false,
  start-paragraph: "anywhere", // anywhere | next-page | next-odd | next-even
)

#let _alignment-map = (
  "left": left,
  "right": right,
  "center": center,
  "justify": left, // par.justify가 본질. align은 left fallback
)

// spec과 default-spec을 merge하여 키 access. spec에 없는 키는 default에서.
#let _get(spec, key) = spec.at(key, default: default-spec.at(key))

#let apply-para-style(spec, body) = {
  // 페이지 분기 (인디자인 "Start Paragraph" 옵션)
  let sp = _get(spec, "start-paragraph")
  if sp == "next-page" { pagebreak(weak: true) }
  else if sp == "next-odd" { pagebreak(weak: true, to: "odd") }
  else if sp == "next-even" { pagebreak(weak: true, to: "even") }

  let a = _get(spec, "alignment")
  let inner-body = if _get(spec, "underline") { underline(body) } else { body }
  let aligned = if a in ("left", "right", "center") {
    align(_alignment-map.at(a), inner-body)
  } else {
    inner-body
  }

  // InDesign leading = baseline-to-baseline (CSS line-height와 동일).
  // Typst par.leading = 줄 사이 *추가* 공간 (즉 line-height - font-size).
  // 따라서 IDML 추출값에서 size를 빼야 같은 시각 결과.
  // 그리고 baseline grid: 모든 줄이 18pt grid에 align — leading은 BASELINE_GRID - size.
  let _size = _get(spec, "size")
  let _typst-leading = BASELINE_GRID - _size

  // 단락 경계 최소 spacing — collapsing으로 0이 되면 줄간격 깨짐.
  // space-before/after가 0이면 leading 만큼 강제해 정상 line spacing 유지.
  let _min-block-space = _typst-leading
  let _block-above = _get(spec, "space-before")
  let _block-below = _get(spec, "space-after")
  block(
    above: if _block-above > 0pt { _grid-snap(_block-above) } else { _min-block-space },
    below: if _block-below > 0pt { _grid-snap(_block-below) } else { _min-block-space },
    inset: (
      left: _get(spec, "left-indent"),
      right: _get(spec, "right-indent"),
    ),
  )[
    #set par(
      justify: a == "justify",
      leading: _typst-leading,
      first-line-indent: _get(spec, "first-line-indent"),
    )
    #set text(
      font: _get(spec, "font"),
      size: _get(spec, "size"),
      weight: _get(spec, "weight"),
      style: _get(spec, "style"),
      fill: _get(spec, "fill"),
      tracking: _get(spec, "tracking"),
    )
    #aligned
  ]
}

// 인라인용 — 한 줄 안 일부만 다른 스타일 (인디자인 Character Style 흉내)
// 단락 분기/들여쓰기/간격 없음. text() 속성만.
#let apply-char-style(spec, body) = {
  text(
    font: _get(spec, "font"),
    size: _get(spec, "size"),
    weight: _get(spec, "weight"),
    style: _get(spec, "style"),
    fill: _get(spec, "fill"),
    tracking: _get(spec, "tracking"),
  )[
    #if _get(spec, "underline") { underline(body) } else { body }
  ]
}
