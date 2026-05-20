// 묶음(지문) — 사이드바 + 라벨 박스 (sidebar-label)
//
// 특징:
//   - 좌측 가는 사이드바 (accent 1.4pt)
//   - 묶음 본문 위 라벨 박스: accent 배경 + 흰 글자 [범위] 안내
//   - 묶음 본문은 본문 폰트 약간 작게

#import "/typst-templates/_core/sungjin-core.typ": *

#let render-passage(p) = block(
  spacing: 1.1em,
  breakable: true,
  width: 100%,
)[
  #grid(
    columns: (1.4pt, 1fr),
    column-gutter: 8pt,
    rect(width: 1.4pt, height: 100%, fill: accent, stroke: none),
    [
      #box(
        fill: accent,
        inset: (x: 5pt, y: 2pt),
        radius: 1pt,
      )[
        #text(font: sans-fonts, weight: "bold", size: 0.85em, fill: white)[
          \[#p.range.at(0)~#p.range.at(1)\] #p.header
        ]
      ]
      #v(0.55em, weak: true)
      #text(size: 0.95em)[#render-with-markers(p.body)]
    ],
  )
]
