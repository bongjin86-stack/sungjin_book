// IDML 자동 추출 — 성진_2027_공감연구소_심플리_고전소설.idml
// MasterSpread별 master-spec 자동 생성. 직접 편집 대신 추출기 보정 룰 추가 권장.

#import "/typst-templates/edu/design-system/master-page.typ": master-spec
#import "/typst-templates/edu/presets/simply-classic/colors.typ": swatches

// 메인 청 (CMYK 시안 100% — Japan Color 2001 근사)
#let accent-strong = swatches.at("C=100 M=0 Y=0 K=0", default: rgb("#0091db"))

// Master: 2-파트2-같이하기
#let master_2_파트2_같이하기 = master-spec(
  width: 623.62pt,
  height: 850.39pt,
  margin: (inside: 56.69pt, outside: 141.73pt, top: 56.69pt, bottom: 56.69pt),
  header: none,
  footer: context {
    let pn = counter(page).get().at(0)
    let is-even = calc.rem(pn, 2) == 0
    let body = if is-even {
      text(font: ("Noto Sans KR",), size: 9pt)[#pn#h(1.5em)심플리[고전 소설]]
    } else {
      text(font: ("Noto Sans KR",), size: 9pt)[PART 2#h(1.5em)#pn]
    }
    align(if is-even { left } else { right })[#body]
  },
  footer-descent: 8mm,
  background: context {
    let pn = counter(page).get().at(0)
    let is-even = calc.rem(pn, 2) == 0
    if is-even {
      place(left + top, dx: 8mm, dy: 18mm)[
        #text(font: ("Noto Sans KR",), size: 10pt, weight: "bold", fill: accent-strong)[PART 2]
        \
        #text(font: ("Noto Sans KR",), size: 9pt)[같이하기]
      ]
    }
  },
)

// Master: 5-빠른정답
#let master_5_빠른정답 = master-spec(
  width: 623.62pt,
  height: 850.39pt,
  margin: (inside: 56.69pt, outside: 141.73pt, top: 56.69pt, bottom: 56.69pt),
  header: none,
  footer: context {
    let pn = counter(page).get().at(0)
    let is-even = calc.rem(pn, 2) == 0
    let body = if is-even {
      text(font: ("Noto Sans KR",), size: 9pt)[#pn#h(1.5em)심플리[고전 시가]]
    } else {
      text(font: ("Noto Sans KR",), size: 9pt)[빠른 정답#h(1.5em)#pn]
    }
    align(if is-even { left } else { right })[#body]
  },
  footer-descent: 8mm,
)

// Master: 3-에필로그
#let master_3_에필로그 = master-spec(
  width: 623.62pt,
  height: 850.39pt,
  margin: (inside: 56.69pt, outside: 141.73pt, top: 56.69pt, bottom: 56.69pt),
  header: none,
  footer: context {
    let pn = counter(page).get().at(0)
    let is-even = calc.rem(pn, 2) == 0
    let body = if is-even {
      text(font: ("Noto Sans KR",), size: 9pt)[#pn#h(1.5em)심플리[고전 소설]]
    } else {
      text(font: ("Noto Sans KR",), size: 9pt)[PART 3#h(1.5em)#pn]
    }
    align(if is-even { left } else { right })[#body]
  },
  footer-descent: 8mm,
  background: context {
    let pn = counter(page).get().at(0)
    let is-even = calc.rem(pn, 2) == 0
    if is-even {
      place(left + top, dx: 8mm, dy: 18mm)[
        #text(font: ("Noto Sans KR",), size: 10pt, weight: "bold", fill: accent-strong)[PART 3]
        \
        #text(font: ("Noto Sans KR",), size: 9pt)[에피소드 Ⅱ]
      ]
    }
  },
)

// Master: 2*-파트2-혼자하기
#let master_2star_파트2_혼자하기 = master-spec(
  width: 623.62pt,
  height: 850.39pt,
  margin: (inside: 56.69pt, outside: 141.73pt, top: 56.69pt, bottom: 56.69pt),
  header: none,
  footer: context {
    let pn = counter(page).get().at(0)
    let is-even = calc.rem(pn, 2) == 0
    let body = if is-even {
      text(font: ("Noto Sans KR",), size: 9pt)[#pn#h(1.5em)심플리[고전 소설]]
    } else {
      text(font: ("Noto Sans KR",), size: 9pt)[PART 2#h(1.5em)#pn]
    }
    align(if is-even { left } else { right })[#body]
  },
  footer-descent: 8mm,
)

// Master: 1-파트1
#let master_1_파트1 = master-spec(
  width: 623.62pt,
  height: 850.39pt,
  margin: (inside: 56.69pt, outside: 141.73pt, top: 56.69pt, bottom: 56.69pt),
  header: none,
  footer: context {
    let pn = counter(page).get().at(0)
    let is-even = calc.rem(pn, 2) == 0
    let body = if is-even {
      text(font: ("Noto Sans KR",), size: 9pt)[#pn#h(1.5em)심플리[고전 소설]]
    } else {
      text(font: ("Noto Sans KR",), size: 9pt)[PART 1#h(1.5em)#pn]
    }
    align(if is-even { left } else { right })[#body]
  },
  footer-descent: 8mm,
  background: context {
    let pn = counter(page).get().at(0)
    let is-even = calc.rem(pn, 2) == 0
    if is-even {
      place(left + top, dx: 8mm, dy: 18mm)[
        #text(font: ("Noto Sans KR",), size: 10pt, weight: "bold", fill: accent-strong)[PART 1]
        \
        #text(font: ("Noto Sans KR",), size: 9pt)[프롤로그]
      ]
    }
  },
)

// Master: Z-창고
#let master_Z_창고 = master-spec(
  width: 623.62pt,
  height: 850.39pt,
  margin: (inside: 56.69pt, outside: 141.73pt, top: 56.69pt, bottom: 56.69pt),
  header: none,
)

// 기본 main master — 본문 페이지용 (이름 휴리스틱)
#let main-master = master_2_파트2_같이하기