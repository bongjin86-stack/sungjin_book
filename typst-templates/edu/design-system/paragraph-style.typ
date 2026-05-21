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

  block(
    above: _get(spec, "space-before"),
    below: _get(spec, "space-after"),
    inset: (
      left: _get(spec, "left-indent"),
      right: _get(spec, "right-indent"),
    ),
  )[
    #set par(
      justify: a == "justify",
      leading: _get(spec, "leading"),
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
