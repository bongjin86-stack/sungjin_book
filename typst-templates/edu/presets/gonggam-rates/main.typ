// presets/gonggam-rates/main.typ
//
// 공감연구소_정답률 페이지의 top-level entry point.
// compiler.ts(web) 또는 typst CLI가 이 파일을 컴파일.
//
// 역할:
//   1. 데이터 로드 (data.json)
//   2. set page (master + paragraph style의 본문 기본을 top-level에서 박음 — typst quirk 우회)
//   3. set text / set par (본문 cascade base)
//   4. test-paper(data) 호출 (본문 식자 흐름)

#import "/typst-templates/edu/design-system/paragraph-style.typ": apply-para-style, apply-char-style
#import "/typst-templates/edu/presets/gonggam-rates/paragraph-styles.typ" as ps
#import "/typst-templates/edu/presets/gonggam-rates/master-pages.typ" as mp
#import "/typst-templates/edu/test-paper/v0.3/template.typ": test-paper

#let data = json("/data.json")
#let heading = data.meta.at("heading", default: (:))

#set page(..mp.teacher-rates(heading: heading))

#set text(
  font: ps.body.font,
  size: ps.body.size,
  fill: ps.body.fill,
  lang: "ko",
  cjk-latin-spacing: auto,
)
#set par(
  leading: ps.body.leading,
  first-line-indent: ps.body.first-line-indent,
  justify: ps.body.alignment == "justify",
)

#test-paper(data)
