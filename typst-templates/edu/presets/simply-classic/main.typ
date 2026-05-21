// presets/simply-classic/main.typ
//
// IDML 흡수 검증 entry — 우리 HWP→JSON 데이터를 simply-classic IDML 디자인으로 식자.
// v21 (2026-05-22) 사용자 시각 검증으로 확정된 패턴.
//
// 식자 시퀀스 (한 문제):
//   ❶ question-number  → ❷ question-stem  →  [boki-box?] →  choice-glyph + choice-text
//
// 명명·간격·정렬 룰은 design-tokens.typ. 이 파일은 시퀀스만.

#import "/typst-templates/edu/design-system/paragraph-style.typ": apply-para-style
#import "/typst-templates/edu/presets/simply-classic/paragraph-styles.typ": paragraph-styles
#import "/typst-templates/edu/presets/simply-classic/master-pages.typ" as mp
#import "/typst-templates/edu/presets/simply-classic/design-tokens.typ" as t

#let data = json("/data.json")
#let pick(name) = paragraph-styles.at(name, default: (:))

// Layer 2: 단 수 — data.layout 또는 default 2단
#let _layout = if "layout" in data and data.layout == "1col" { t.page-1col } else { t.page-2col }


// ── 페이지 + 글로벌 텍스트 ───────────────────────────────────────────────────
#set page(..mp.main-master, columns: _layout.columns)
#set text(font: t.font.serif, size: 10pt, lang: "ko", cjk-latin-spacing: auto)
#set par(leading: 0.7em, justify: true)


// ── 컴포넌트: <보기> 박스 ────────────────────────────────────────────────────
#let render-boki(body) = {
  block(
    fill: t.boki-box.fill,
    stroke: t.boki-box.stroke,
    inset: (x: t.boki-box.inset-x, y: t.boki-box.inset-y),
    width: 100%,
    radius: t.boki-box.radius,
    breakable: t.boki-box.breakable,
  )[
    #align(center)[#text(size: t.boki-box.label-size, weight: "bold")[< 보기 >]]
    #v(2pt)
    #apply-para-style(pick("보기"), body)
  ]
}


// ── 컴포넌트: 선지 (① 글자 + 본문) ──────────────────────────────────────────
//
// ① 글자는 paragraph 밖 hanging position. 본문은 들여쓰기 위치에서 시작.
// 결과: ① 글자(column.left), 본문 첫 줄(column.left + 14pt), wrap된 둘째 줄(column.left + 14pt)
#let render-choice(glyph, body) = {
  block(
    above: 0pt,
    below: 0pt,
    width: 100%,
    inset: (left: t.align-rule.choice-text-indent),
  )[
    #place(left + top, dx: t.align-rule.choice-glyph-dx, dy: 0pt)[
      #set text(font: t.font.serif-fallback-glyph, size: 10pt)
      #glyph
    ]
    #set text(font: t.font.serif-fallback-glyph, size: 10pt, tracking: -0.04em)
    #set par(leading: t.baseline-grid - 10pt, justify: true)
    #body
  ]
}


// ── 컴포넌트: 한 문제 (윗단 + boki? + 아랫단) ────────────────────────────────
#let _pad2(n) = if n < 10 { "0" + str(n) } else { str(n) }

#let render-question(q) = {
  // 윗단
  apply-para-style(pick("번호(NEW)"), [#_pad2(q.number)])
  v(t.space.number-to-stem, weak: true)
  apply-para-style(pick("문제명조"), q.stem)
  v(t.space.stem-to-choices, weak: true)

  // boki (있을 때)
  if "boki" in q {
    render-boki(q.boki)
    v(t.space.boki-around, weak: true)
  }

  // 아랫단
  for c in q.choices {
    render-choice(c.glyph, c.text)
    v(t.space.between-choices, weak: true)
  }
  v(t.space.between-questions, weak: true)
}


// ── 컴포넌트: passage (header + body + source + glossary) ────────────────────
#let render-passage(p) = {
  if p.header != "" {
    apply-para-style(
      pick("물음에답하시오"),
      [
        #if p.range != none {
          text(fill: t.color.accent, weight: "bold")[\[#p.range.at(0)~#p.range.at(1)\]]
          h(0.5em)
        }
        #p.header
      ],
    )
  }
  for para in p.body.split("\n") {
    if para.trim() != "" {
      apply-para-style(pick("지문:지문"), para)
    }
  }
  if "source" in p {
    align(right)[#text(size: 9pt, fill: t.color.muted)[#p.source]]
    v(t.space.after-source, weak: true)
  }
  if "glossary" in p {
    v(t.space.after-passage-body, weak: true)
    for g in p.glossary {
      apply-para-style(pick("보기명조"), [\* #g])
    }
  }
}


// ── 시퀀스 ───────────────────────────────────────────────────────────────────

#let group-by-passage(questions) = {
  let groups = ()
  let cur-pid = none
  let cur-list = ()
  for q in questions {
    if q.passage_id != cur-pid {
      if cur-list.len() > 0 {
        groups.push((pid: cur-pid, qs: cur-list))
      }
      cur-pid = q.passage_id
      cur-list = ()
    }
    cur-list.push(q)
  }
  if cur-list.len() > 0 {
    groups.push((pid: cur-pid, qs: cur-list))
  }
  groups
}

#for g in group-by-passage(data.questions) {
  let p = none
  for pp in data.passages { if pp.id == g.pid { p = pp } }
  if p != none { render-passage(p) }
  for q in g.qs { render-question(q) }
}
