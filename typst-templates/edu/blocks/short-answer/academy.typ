// 주관식 — 학원형 (academy) — placeholder
//
// 현재 v0.3는 평가원형에서 주관식이 별도 식자로 분리되지 않음.
// 단답형(수학 등)을 정식으로 처리할 때 여기 채움.
// 인터페이스: render-question(q)
//   - q.number, q.stem, q.score, q.choices(빈 배열)
//
// 임시: 객관식 학원형과 동일한 번호 박스 + 발문만 (보기 없음).

#import "/typst-templates/_core/sungjin-core.typ": *

#let render-question(q) = block(
  breakable: true,
  spacing: 1.3em,
  above: 1.1em,
)[
  #box(
    fill: accent,
    inset: (x: 6pt, y: 1pt),
    radius: 2pt,
    baseline: 0.2em,
  )[
    #text(font: sans-fonts, weight: "bold", size: 1.0em, fill: white)[#q.number]
  ]
  #h(0.5em)
  #render-with-markers(q.stem)
  #if q.score != none [
    #h(0.5em)#text(font: sans-fonts, size: 0.82em, fill: ink-muted)[\[#(q.score)점\]]
  ]
]
