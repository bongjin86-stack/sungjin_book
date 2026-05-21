// presets/simply-classic/master-pages.typ
// IDML 자동 추출 (master-spreads-dump.txt) 결과를 손으로 박은 master page.
//
// 페이지 크기: 624 × 850pt (220 × 300mm) — Page.GeometricBounds
// 마진: inside 56.7pt / outside 141.7pt / top 56.7pt / bottom 56.7pt
//
// master "2-파트2-같이하기" 4 frames:
//   - [right-bottom-body] "PART 2"             → 우측 페이지 하단 푸터 (좌측 정렬, 페이지 번호 옆)
//   - [left-bottom-body]  "심플리[고전 소설]"  → 좌측 페이지 하단 푸터
//   - [left-top-outer]    "같이하기"           → 좌측 페이지 outer 라벨 (아래)
//   - [left-top-outer]    "PART 2"             → 좌측 페이지 outer 라벨 (위, 청색)

#import "/typst-templates/edu/design-system/master-page.typ": master-spec
#import "/typst-templates/edu/presets/simply-classic/colors.typ": swatches

// IDML 색 견본에서 메인 청 lookup (CMYK 시안 100% → Japan Color 2001 근사)
#let accent-strong = swatches.at("C=100 M=0 Y=0 K=0")

// 푸터 — 좌/우 페이지 분기
//   좌측 페이지(짝수): "심플리[고전 소설]" + 페이지번호 (좌측 정렬)
//   우측 페이지(홀수): 페이지번호 + "PART 2" (우측 정렬)
#let main-footer(left-label, right-label) = context {
  let pn = counter(page).get().at(0)
  let is-even = calc.rem(pn, 2) == 0
  let font = ("Noto Sans KR",)
  let body = if is-even {
    text(font: font, size: 9pt, fill: rgb("#222"))[#pn#h(1.5em)#left-label]
  } else {
    text(font: font, size: 9pt, fill: rgb("#222"))[#right-label#h(1.5em)#pn]
  }
  align(if is-even { left } else { right })[#body]
}

// 좌측 outer 마진 라벨 — 좌측 페이지에만 박힘
//   2-파트2-같이하기 master 기준 spread 좌표:
//   tx=-491.93 + bbox.x_min=-75 → spread x ≈ -567 (좌측 가장자리 -624부터 57pt 안쪽)
//   ty=-295.63 + bbox.y_min=-75 → spread y ≈ -371 (페이지 상단 -425부터 54pt 아래)
//   → page-relative (left, top) = (57pt, 54pt + 페이지 높이/2 = 479? 다시...)
//   spread y의 페이지-상대: -371 + 페이지 높이/2 (425) = 54pt → page top에서 54pt 아래
#let outer-label-block(part-text, sub-text) = context {
  let pn = counter(page).get().at(0)
  let is-even = calc.rem(pn, 2) == 0
  if is-even {
    place(left + top, dx: 8mm, dy: 18mm)[
      #text(font: ("Noto Sans KR",), size: 10pt, weight: "bold", fill: accent-strong)[
        #part-text
      ]
      \
      #text(font: ("Noto Sans KR",), size: 9pt, fill: rgb("#222"))[
        #sub-text
      ]
    ]
  }
}

// 본문 페이지(part2-같이하기) master
#let main-master = master-spec(
  width: 623.62pt,
  height: 850.39pt,
  margin: (
    inside: 56.69291338582678pt,
    outside: 141.73228346456693pt,
    top: 56.69291338582678pt,
    bottom: 56.69291338582678pt,
  ),
  header: none,
  footer: main-footer("심플리[고전 소설]", "PART 2"),
  footer-descent: 8mm,
  background: outer-label-block("PART 2", "같이하기"),
)
