// γ 통합 검증 — 본문 식자 + 추출 배경 frame을 한 페이지에 합성.
//
// 비교 대상: 원본 PDF page 12 (Spread_u93569의 좌측 Page Name="12").
// 컨텐츠: content.json의 passages[0] + questions[0..3].
//   ↑ IDML 1~4번 문제 = 우리 content.json passages[0] (range [1, 4]).
//
// 결과는 experiments/idml-recon/test-integrated-p12.pdf.
// → visual-diff.py 원본 p12와 비교.

#import "/typst-templates/edu/design-system/paragraph-style.typ": apply-para-style
#import "/typst-templates/edu/presets/simply-classic/paragraph-styles.typ": paragraph-styles
#import "/typst-templates/edu/presets/simply-classic/design-tokens.typ" as t
#import "/typst-templates/edu/presets/simply-classic/decorations.typ": page-decorations

#let data = json("/experiments/idml-recon/simply-classic/content.json")
#let pick(name) = paragraph-styles.at(name, default: (:))
#let p1 = data.passages.at(0)
// passage body가 너무 길어 일부만 — IDML p12에 들어간 분량만 비슷하게.
#let p1-cut = (
  id: p1.id,
  header: p1.header,
  range: p1.range,
  body: p1.body.slice(0, count: calc.min(1200, p1.body.len())),
)
#let qs = ()  // 본문 단 보더 안에 식자가 어떻게 박히는지 먼저

// ── 페이지: IDML과 같은 크기, 2단, 페이지 background에 추출 frame 오버레이
#set page(
  width: 623.62pt, height: 850.39pt,
  margin: (left: 56.69pt, right: 56.69pt, top: 56.69pt, bottom: 56.69pt),
  background: page-decorations.at("12", default: []),
)
#set text(font: t.font.serif, size: 10pt, lang: "ko", cjk-latin-spacing: auto)
#set par(leading: 0.7em, justify: true)

// ── 본문 식자 (main.typ render-* 로직 일부 발췌) ────────────────────────────
#let _pad2(n) = if n < 10 { "0" + str(n) } else { str(n) }

#let render-choice(glyph, body) = {
  block(above: 0pt, below: 0pt, width: 100%,
        inset: (left: t.align-rule.choice-text-indent))[
    #place(left + top, dx: t.align-rule.choice-glyph-dx, dy: 0pt)[
      #set text(font: t.font.serif-fallback-glyph, size: 10pt); #glyph
    ]
    #set text(font: t.font.serif-fallback-glyph, size: 10pt, tracking: -0.04em)
    #set par(leading: t.space.choice-wrap-leading, justify: true)
    #body
  ]
}

#let render-question(q) = {
  apply-para-style(pick("번호(NEW)") + t.typography.question-number,
                   [#_pad2(q.number)])
  v(t.space.number-to-stem, weak: true)
  apply-para-style(pick("문제명조") + t.typography.question-stem, q.stem)
  v(t.space.stem-to-choices, weak: true)
  for c in q.choices {
    render-choice(c.glyph, c.text)
    v(t.space.between-choices, weak: true)
  }
  v(t.space.between-questions, weak: true)
}

#let render-passage(p) = {
  if p.header != "" {
    apply-para-style(pick("물음에답하시오"), [
      #if p.range != none {
        text(fill: t.color.accent, weight: "bold")[\[#p.range.at(0)~#p.range.at(1)\]]
        h(0.5em)
      }
      #p.header
    ])
  }
  for para in p.body.split("\n") {
    if para.trim() != "" {
      apply-para-style(pick("지문:지문"), para)
    }
  }
}

#columns(2, gutter: 21.95pt, {
  render-passage(p1-cut)
  for q in qs { render-question(q) }
})
