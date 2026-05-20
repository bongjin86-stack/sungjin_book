// 객관식 — 학원형 (academy)
//
// 특징:
//   - 번호: accent 배경 + 흰 글자 박스
//   - 발문: 박스 옆에 인라인 시작
//   - 보기: 좌측 1em 들여쓰기, 시각 위계 분리
//   - [점수]: 발문 끝에 인라인, 작게 muted

#import "/typst-templates/_core/sungjin-core.typ": *

#let render-choice(c) = block(
  spacing: 0.65em,
  above: 0.5em,
  inset: (left: 1em),
)[
  #text(font: sans-fonts, fill: ink-strong)[#c.glyph]#h(0.4em)#render-with-markers(c.text)
]

#let empty-choices-notice = block(spacing: 0.5em)[
  #text(font: sans-fonts, size: 0.82em, fill: luma(150), style: "italic")[
    \[보기가 화학식·표·그림 안에 있어 텍스트 추출 단계에서 빠짐 — v2에서 회수 예정\]
  ]
]

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
  #v(0.5em, weak: true)
  #let all-empty = q.choices.len() > 0 and q.choices.all(c => c.text.trim() == "")
  #if q.choices.len() == 0 or all-empty {
    empty-choices-notice
  } else {
    for c in q.choices { render-choice(c) }
  }
]
