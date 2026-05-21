// presets/gonggam-rates/master-pages.typ
//
// 공감연구소_정답률 페이지의 master page 정의.
// 인디자인의 "Master A" 페이지가 이 dict 하나에 대응.
//
// master-spec(...) 반환 — 호출자는 #set page(..teacher-rates(heading: ...))로 spread.

#import "/typst-templates/edu/design-system/master-page.typ": master-spec, outer-page-number-footer, outer-vertical-running-label
#import "/typst-templates/edu/presets/gonggam-rates/paragraph-styles.typ" as ps

// 선생님용 정답률 페이지 (제일 흔한 본문 페이지).
// heading: { footer_outer: "PART2 같이하기 | Theme 1", outer_vertical: "Theme 1", outer_vertical_sub: "같이하기" }
#let teacher-rates(heading: (:)) = {
  let v-main = heading.at("outer_vertical", default: "")
  let v-sub  = heading.at("outer_vertical_sub", default: "")
  let v-label = if v-sub != "" { v-main + "  /  " + v-sub } else { v-main }
  let footer-outer = heading.at("footer_outer", default: "")

  master-spec(
    paper: "a4",
    margin: (inside: 22mm, outside: 22mm, top: 18mm, bottom: 16mm),
    header: none,
    footer: outer-page-number-footer(
      label: footer-outer,
      font: ps.footer-text.font,
      size: ps.footer-text.size,
      fill: ps.footer-text.fill,
    ),
    footer-descent: 8mm,
    background: if v-label != "" {
      outer-vertical-running-label(
        label: v-label,
        dx: 6mm,
        dy: 22mm,
        font: ps.vertical-label.font,
        size: ps.vertical-label.size,
        fill: ps.vertical-label.fill,
      )
    } else { none },
  )
}
