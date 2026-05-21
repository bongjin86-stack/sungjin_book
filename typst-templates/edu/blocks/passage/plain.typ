// 묶음(지문) — 박스 없이 본문만 (plain)
//
// 기준: 학원 출판물(분석서) — 묶음 자체는 박스로 둘러싸지 않고 본문이 페이지에 흐른다.
// 묶음 라벨 [1~3] 다음 글을 읽고… 은 본문 위에 한 줄 헤더로만.

#import "/typst-templates/_core/sungjin-core.typ": *

#let render-passage(p) = block(
  spacing: 0.9em,
  breakable: true,
  width: 100%,
)[
  #block(spacing: 0.5em)[
    #text(font: sans-fonts, weight: "bold", size: 0.95em, fill: ink-strong)[
      \[#p.range.at(0)~#p.range.at(1)\] #p.header
    ]
  ]
  #render-with-markers(p.body)
]
