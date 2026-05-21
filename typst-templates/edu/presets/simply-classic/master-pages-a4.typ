// presets/simply-classic/master-pages-a4.typ
//
// Edu100용 A4 master. simply-classic의 디자인 룰을 A4 사이즈에 맞춤.
// 사용자 입력 (교재 제목, 과목)을 헤더/푸터에 반영 가능하도록 함수형.

#import "/typst-templates/edu/design-system/master-page.typ": master-spec
#import "/typst-templates/edu/presets/simply-classic/design-tokens.typ" as t

// A4: 595.276 × 841.89 pt = 210 × 297 mm
#let a4-master(title: "", subject: "") = master-spec(
  width: 595.276pt,
  height: 841.89pt,
  // A4 margin — 좌우 동일 (단행본 mirror 안 함, 교재용)
  margin: (
    inside: 18mm,
    outside: 18mm,
    top: 20mm,
    bottom: 18mm,
  ),
  header: none,
  footer: context {
    let pn = counter(page).get().at(0)
    align(center)[
      #text(font: t.font.sans, size: 9pt, fill: rgb("#666"))[
        #if title != "" { [#title #h(1em)] }
        #if subject != "" { [· #subject #h(1em)] }
        #pn
      ]
    ]
  },
  footer-descent: 10mm,
)
