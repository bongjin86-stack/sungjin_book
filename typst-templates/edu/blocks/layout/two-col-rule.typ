// 배열 — 2단 + 가운데 세로선 (two-col-rule)
//
// 시험지 페이지 설정 (헤더/푸터 제외 — 그건 호출자 책임).
// 단 사이 가운데에 가는 세로선. A4 좌여백 13mm + 단폭 88mm + gutter 8mm 가정.
// 시험지 템플릿이 set page() 다음에 columns()로 본문 감싸기 전 호출.

#import "/typst-templates/_core/sungjin-core.typ": *

// 페이지 배경에 그릴 세로선 (단 사이).
// 호출자가 set page(background: ...) 인자로 넘김.
#let column-rule = place(
  top + left,
  dx: 105mm,
  dy: 33mm,
  line(angle: 90deg, length: 245mm, stroke: 0.3pt + line-thin),
)

// 본문을 2단으로 감싸는 show 룰 헬퍼.
#let wrap-columns(body) = columns(2, gutter: 8mm, body)
