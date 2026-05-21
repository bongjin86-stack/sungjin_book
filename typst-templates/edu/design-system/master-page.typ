// design-system/master-page.typ
//
// 인디자인의 "Master Page" 개념을 typst로 매핑.
//
// 중요: typst의 `set page(footer:, background:)`는 함수 안에서 호출 시 silent failure함
// (CLI 0.14 / typst.ts 둘 다 재현 확인). 따라서 이 모듈은 set page를 직접 호출하지 않고
// spec dict + spread 호출 헬퍼만 제공한다.
//
// 사용법:
//   #import "/typst-templates/edu/design-system/master-page.typ": *
//   #let master = master-spec(margin-inside: 22mm, footer: my-footer)
//   // main.typ의 top-level에서:
//   #set page(..master)
//
// 인디자인 Master Page 속성 → typst:
//   paper / width / height        → page(paper: | width: height:)
//   margin (inside/outside/top/bottom) → page(margin:)
//   facing pages (좌우 미러)      → margin의 inside/outside 키 사용 시 자동
//   header / footer 콘텐츠        → page(header:, footer:)
//   header-ascent / footer-descent → page(header-ascent:, footer-descent:)
//   background / foreground       → page(background:, foreground:)
//   page color (fill)             → page(fill:)
//   columns                       → page(columns:)

#let default-master = (
  paper: "a4",
  margin: (inside: 22mm, outside: 22mm, top: 18mm, bottom: 16mm),
  header: none,
  header-ascent: 8mm,
  footer: none,
  footer-descent: 8mm,
  background: none,
  foreground: none,
  fill: none,
  columns: 1,
)

// master-spec(...) — 키워드 인자로 받아 default와 merge한 dict 반환.
// 호출자가 #set page(..master-spec(...))로 spread.
#let master-spec(..args) = {
  let out = default-master
  for (k, v) in args.named() {
    out.insert(k, v)
  }
  out
}

// 헬퍼: 좌측/우측 outer 정렬 푸터 (페이지 번호 + 라벨)
// 좌측 페이지(짝수)는 좌측 정렬, 우측 페이지(홀수)는 우측 정렬.
#let outer-page-number-footer(label: "", font: ("Noto Sans KR",), size: 8.5pt, fill: luma(110)) = context {
  let pn = counter(page).get().at(0)
  let is-even = calc.rem(pn, 2) == 0
  let txt = text(font: font, size: size, fill: fill)[
    #if is-even [#pn#h(1.2em)#label] else [#label#h(1.2em)#pn]
  ]
  align(if is-even { left } else { right })[#txt]
}

// 헬퍼: 좌/우 outer 마진 세로 라벨 (러닝헤드).
// 좌측 페이지(짝수)는 좌측 마진에 -90deg, 우측 페이지(홀수)는 우측 마진에 +90deg.
#let outer-vertical-running-label(label: "", dx: 6mm, dy: 22mm, font: ("Noto Sans KR",), size: 8.5pt, fill: luma(110)) = context {
  let pn = counter(page).get().at(0)
  let is-even = calc.rem(pn, 2) == 0
  let body = text(font: font, size: size, fill: fill)[#label]
  if is-even {
    place(left + top, dx: dx, dy: dy)[
      #rotate(-90deg, origin: left + top)[#body]
    ]
  } else {
    place(right + top, dx: -dx, dy: dy)[
      #rotate(90deg, origin: right + top)[#body]
    ]
  }
}
