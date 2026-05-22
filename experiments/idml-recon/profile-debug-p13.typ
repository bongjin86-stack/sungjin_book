// 대표 페이지 디버그 렌더 — profile-idml-layout.py가 자동 생성.
//
// 원본 p13(Spread_u93569 좌측 Page Name="12")과 비교용.
// content.json의 passages[0] + questions[0]만 박음 (같은 콘텐츠).

#import "/typst-templates/edu/design-system/paragraph-style.typ": apply-para-style
#import "/typst-templates/edu/presets/simply-classic/paragraph-styles.typ": paragraph-styles
#import "/typst-templates/edu/presets/simply-classic/master-pages.typ" as mp
#import "/typst-templates/edu/presets/simply-classic/design-tokens.typ" as t

#let data = json("/experiments/idml-recon/simply-classic/content.json")
#let pick(name) = paragraph-styles.at(name, default: (:))
#let p = data.passages.at(0)
#let q = data.questions.at(0)

#set page(..mp.main-master, columns: 2)
#set text(font: t.font.serif, size: 10pt, lang: "ko", cjk-latin-spacing: auto)
#set par(leading: 0.7em, justify: true)

// passage
#if p.header != "" {
  apply-para-style(pick("물음에답하시오"), [
    #if p.range != none {
      text(fill: t.color.accent, weight: "bold")[\[#p.range.at(0)~#p.range.at(1)\]]
      h(0.5em)
    }
    #p.header
  ])
}
#for para in p.body.split("\n") {
  if para.trim() != "" {
    apply-para-style(pick("지문:지문"), para)
  }
}

// question (윗단 + 아랫단)
#let _pad2(n) = if n < 10 { "0" + str(n) } else { str(n) }
#apply-para-style(pick("번호(NEW)") + t.typography.question-number,
                  [#_pad2(q.number)])
#v(t.space.number-to-stem, weak: true)
#apply-para-style(pick("문제명조") + t.typography.question-stem, q.stem)
#v(t.space.stem-to-choices, weak: true)
#for c in q.choices {
  block(above: 0pt, below: 0pt, width: 100%,
        inset: (left: t.align-rule.choice-text-indent))[
    #place(left + top, dx: t.align-rule.choice-glyph-dx, dy: 0pt)[
      #set text(font: t.font.serif-fallback-glyph, size: 10pt)
      #c.glyph
    ]
    #set text(font: t.font.serif-fallback-glyph, size: 10pt, tracking: -0.04em)
    #set par(leading: t.space.choice-wrap-leading, justify: true)
    #c.text
  ]
  v(t.space.between-choices, weak: true)
}
