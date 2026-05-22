// presets/simply-classic/main.typ
//
// IDML 흡수 검증 entry — 우리 HWP→JSON 데이터를 simply-classic IDML 디자인으로 식자.
// v22 (2026-05-22 오후) chapters[] 분기 구조 도입.
//
// 데이터 모양 (web/lib/schema/edu-book.ts와 1:1):
//   data = { meta, preset, options, chapters: [{type: "part-cover"|"passages"|"answer-key", ...}] }
//
// chapter type별 master:
//   part-cover  → 챕터 표지 (큰 청색 PART 라벨 + 부제). pagebreak 후 가운데 식자.
//   passages    → 본문 (지문 + 문제 묶음). 기본 master_2_파트2_같이하기.
//   answer-key  → 답안 표. 기본 master_5_빠른정답.
//
// 하위 호환: data.chapters 없고 data.passages/data.questions 있으면 단일 passages 챕터로 자동 wrap.
//
// 명명·간격·정렬 룰은 design-tokens.typ. 이 파일은 시퀀스만.

#import "/typst-templates/edu/design-system/paragraph-style.typ": apply-para-style
#import "/typst-templates/edu/presets/simply-classic/paragraph-styles.typ": paragraph-styles
#import "/typst-templates/edu/presets/simply-classic/master-pages.typ" as mp
#import "/typst-templates/edu/presets/simply-classic/master-pages-a4.typ" as mp-a4
#import "/typst-templates/edu/presets/simply-classic/design-tokens.typ" as t

#let data = json("/data.json")
#let pick(name) = paragraph-styles.at(name, default: (:))

// Layer 2: 단 수 — data.layout 또는 default 2단
#let _layout = if "layout" in data and data.layout == "1col" { t.page-1col } else { t.page-2col }

// Page master — meta.size: "A4" 면 A4, default는 신국판(simply-classic 원본)
#let _meta = data.at("meta", default: (:))
#let _master = if _meta.at("size", default: "") == "A4" {
  mp-a4.a4-master(
    title: _meta.at("title", default: ""),
    subject: _meta.at("subject", default: ""),
  )
} else {
  mp.main-master
}


// ── 페이지 + 글로벌 텍스트 ───────────────────────────────────────────────────
#set page(.._master, columns: _layout.columns)
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
    #set par(leading: t.space.choice-wrap-leading, justify: true)
    #body
  ]
}


// ── 컴포넌트: 한 문제 (윗단 + boki? + 아랫단) ────────────────────────────────
#let _pad2(n) = if n < 10 { "0" + str(n) } else { str(n) }

#let render-question(q) = {
  // 윗단 — IDML 추출 spec 위에 STS typography 토큰 override (font, size, weight, color)
  apply-para-style(
    pick("번호(NEW)") + t.typography.question-number,
    [#_pad2(q.number)],
  )
  v(t.space.number-to-stem, weak: true)
  apply-para-style(
    pick("문제명조") + t.typography.question-stem,
    q.stem,
  )
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


// ── chapter 핸들러 ──────────────────────────────────────────────────────────

// part-cover: 챕터 표지. pagebreak + 가운데 청색 PART 라벨 + 부제.
#let render-part-cover(label, subtitle) = {
  pagebreak(weak: true)
  v(1fr)
  align(center, text(font: ("Pretendard", "Noto Sans KR"),
                     size: 36pt, weight: "extrabold",
                     fill: t.color.accent)[#label])
  if subtitle != none and subtitle != "" {
    v(1em)
    align(center, text(font: ("Pretendard", "Noto Sans KR"),
                       size: 14pt, fill: t.color.muted)[#subtitle])
  }
  v(2fr)
  pagebreak(weak: true)
}

// passages: 지문 + 문제 묶음.
#let render-passages-chapter(passages, questions) = {
  let _passages = passages
  for g in group-by-passage(questions) {
    let p = none
    for pp in _passages { if pp.id == g.pid { p = pp } }
    if p != none { render-passage(p) }
    for q in g.qs { render-question(q) }
  }
}

// answer-key: 빠른 정답 표.
#let render-answer-key(answers) = {
  pagebreak(weak: true)
  align(center, text(font: ("Pretendard", "Noto Sans KR"),
                     size: 18pt, weight: "bold",
                     fill: t.color.accent)[빠른 정답])
  v(1.5em)
  // 4열 그리드 (번호 / 답)
  let pairs = answers.pairs()
  let cells = ()
  for pair in pairs {
    cells.push(box(width: 100%, inset: 4pt,
                   text(weight: "semibold")[#pair.at(0)]))
    cells.push(box(width: 100%, inset: 4pt,
                   text(font: t.font.serif, size: 12pt)[#pair.at(1)]))
  }
  grid(
    columns: (auto, 1fr, auto, 1fr),
    column-gutter: 8pt,
    row-gutter: 4pt,
    ..cells,
  )
}


// ── chapters 정규화 (하위 호환) ─────────────────────────────────────────────
//
// 옛 data 형태(passages + questions 직결)면 단일 passages 챕터로 자동 wrap.
#let _chapters = if "chapters" in data {
  data.chapters
} else {
  ((
    type: "passages",
    passages: data.at("passages", default: ()),
    questions: data.at("questions", default: ()),
  ),)
}

// ── 디스패치 ────────────────────────────────────────────────────────────────
#for c in _chapters {
  if c.type == "part-cover" {
    render-part-cover(c.label, c.at("subtitle", default: ""))
  } else if c.type == "passages" {
    render-passages-chapter(c.at("passages", default: ()),
                            c.at("questions", default: ()))
  } else if c.type == "answer-key" {
    render-answer-key(c.at("answers", default: (:)))
  }
}
