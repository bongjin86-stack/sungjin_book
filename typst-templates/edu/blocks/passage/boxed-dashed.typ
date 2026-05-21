// 묶음(지문) — 점선 박스 + 가로지르는 라벨 (boxed-dashed)
//
// 기준: 학원형 출판물 자료/<보기> 박스 식자
// 특징:
//   - 점선 둘레 박스 (accent 컬러)
//   - 박스 상단을 가로지르는 라벨 박스 (흰 배경 + accent 글자)
//   - 본문은 박스 안 들여쓰기

#import "/typst-templates/_core/sungjin-core.typ": *

#let render-passage(p) = block(
  spacing: 1.2em,
  breakable: true,
  width: 100%,
  stroke: (paint: accent, thickness: 0.5pt, dash: "dashed"),
  inset: (top: 14pt, left: 12pt, right: 12pt, bottom: 10pt),
  radius: 2pt,
)[
  #place(top + left, dx: 6pt, dy: -7pt)[
    #box(
      fill: white,
      inset: (x: 5pt, y: 1pt),
    )[
      #text(font: sans-fonts, weight: "bold", size: 0.88em, fill: accent)[
        \[#p.range.at(0)~#p.range.at(1)\] #p.header
      ]
    ]
  ]
  #render-with-markers(p.body)
]
