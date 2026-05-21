// 페이지 표지 — PART 표지 한 페이지 (part-cover)
//
// 기준: 성진_2027_공감연구소_기출의테마DNA1.0 p1 (인디자인 PART 표지)
// 특징:
//   - 페이지 전면 옅은 파랑 배경
//   - 큰 산스 "PART N" 상단 / 부제 한 줄
//   - 중앙 가로선 + 시리즈 워터마크
//   - 하단 "THEME N" + 테마 제목 + 한 줄 설명
//
// 사용:
//   #render-part-cover(part: "2", part-title: "같이하기",
//     theme: "1", theme-title: "지문 속 모든 문장은...",
//     theme-subtitle: "'같이하기'는 본인이 예습을 한...")

#import "/typst-templates/_core/sungjin-core.typ": *

#let render-part-cover(
  part: "1",
  part-title: "",
  theme: none,
  theme-title: "",
  theme-subtitle: "",
  series: "2027 THEME DNA 1.0",
  bg: rgb("#bfd9ef"),
  fg: rgb("#1c87c0"),
  fg-strong: rgb("#176aa0"),
) = {
  pagebreak(weak: true)
  set page(
    margin: 0pt,
    fill: bg,
    header: none,
    footer: none,
  )
  align(center)[
    #v(1.6fr)
    #text(font: sans-fonts, weight: "regular", size: 62pt, fill: fg)[PART #part]
    #v(0.4em)
    #text(font: sans-fonts, weight: "bold", size: 15pt, fill: fg-strong)[#part-title]
    #v(7fr)
    #block(width: 70%)[
      #line(length: 100%, stroke: 0.6pt + fg-strong)
      #v(0.3em)
      #text(font: sans-fonts, size: 9pt, fill: fg-strong)[#series]
    ]
    #v(7fr)
    #if theme != none {
      text(font: sans-fonts, weight: "bold", size: 28pt, fill: fg-strong)[THEME #theme]
      v(0.4em)
      text(font: sans-fonts, weight: "bold", size: 13pt, fill: fg-strong)[#theme-title]
      v(0.4em)
      block(width: 70%)[
        #text(font: sans-fonts, size: 8.5pt, fill: fg-strong)[#theme-subtitle]
      ]
    }
    #v(1.4fr)
  ]
  pagebreak(weak: true)
}
