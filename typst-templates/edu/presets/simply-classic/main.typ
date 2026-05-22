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

// Page master — options.size: "A4" 면 A4, default는 신국판(simply-classic 원본)
#let _meta = data.at("meta", default: (:))
#let _options = data.at("options", default: (:))
#let _master = if _options.at("size", default: "") == "A4" {
  mp-a4.a4-master(
    title: _meta.at("title", default: ""),
    subject: _meta.at("subject", default: ""),
  )
} else {
  mp.main-master
}


// ── 페이지 + 글로벌 텍스트 ───────────────────────────────────────────────────
//
// 기본 페이지는 본문(passages) 기준. chapter loop 안에서 type 따라 set page 갱신.
// part-cover/answer-key는 1단 + background 제거 (자기 라벨을 직접 그리므로 master 라벨과 충돌 방지).
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
#let render-inline-run(run) = {
  let out = run.at("text", default: "")
  let marks = run.at("marks", default: ())
  if "strong" in marks {
    out = text(weight: "bold")[#out]
  }
  if "underline" in marks {
    out = underline(out)
  }
  out
}

#let render-rich(inlines) = {
  if type(inlines) == str {
    inlines
  } else {
    for run in inlines {
      render-inline-run(run)
    }
  }
}

#let render-rich-paragraphs(style, paragraphs) = {
  if type(paragraphs) == str {
    for para in paragraphs.split("\n") {
      if para.trim() != "" {
        apply-para-style(style, para)
      }
    }
  } else {
    for para in paragraphs {
      if type(para) == str {
        if para.trim() != "" {
          apply-para-style(style, para)
        }
      } else if para.len() > 0 {
        apply-para-style(style, [
          #for run in para {
            render-inline-run(run)
          }
        ])
      }
    }
  }
}

#let _pad2(n) = if n < 10 { "0" + str(n) } else { str(n) }

// 한 문제를 1개 block(breakable: false)로 박는다 — 번호만 column 바닥에 떨어지거나
// 발문/선지가 어색하게 분리되는 상황 차단. 한 문제가 column보다 길면 다음 column 통째.
// 5지선다 한 문제 분량은 column 길이의 1/3 이하라 빈 공간 폭증 위험 낮음.
#let render-question(q) = {
  block(breakable: false, width: 100%,
        below: t.space.between-questions, above: 0pt)[
    // 윗단
    #apply-para-style(
      pick("번호(NEW)") + t.typography.question-number,
      [#_pad2(q.number)],
    )
    #v(t.space.number-to-stem, weak: true)
    #apply-para-style(
      pick("문제명조") + t.typography.question-stem,
      if "stem_rich" in q { render-rich(q.stem_rich.at(0)) } else { q.stem },
    )
    #v(t.space.stem-to-choices, weak: true)

    // boki (있을 때)
    #if "boki" in q {
      render-boki(q.boki)
      v(t.space.boki-around, weak: true)
    }

    // 아랫단
    #for c in q.choices {
      render-choice(c.glyph, if "text_rich" in c { render-rich(c.text_rich.at(0)) } else { c.text })
      v(t.space.between-choices, weak: true)
    }
  ]
}


// ── 컴포넌트: passage (header strip + body box + source + glossary) ─────────
//
// IDML simply-classic 시그니처 복원:
//   - header strip block (옅은 시안 배경 + bottom rule)
//   - 그 아래 body box (청색 0.3pt stroke, breakable)
//   두 박스가 width 100% + header.below=0 + body-box.above=0 으로 시각 연결.
//
// 긴 지문은 body box가 column/page 경계를 넘어 자연스럽게 이어진다.
//
// 주의: typst raw에서 `~`는 nbsp로 해석. range 표기 시 "~"를 명시 문자로 박는다.
#let render-passage(p) = {
  if p.header != "" or p.range != none {
    block(
      fill: t.passage-header.fill,
      stroke: t.passage-header.stroke,
      inset: (x: t.passage-header.inset-x, y: t.passage-header.inset-y),
      width: 100%,
      above: t.passage-header.above,
      below: t.passage-header.below,
      breakable: false,
      sticky: true,
    )[
      #if p.range != none {
        // "~"는 명시 문자로 박음 (typst nbsp 해석 회피).
        let rng = "[" + str(p.range.at(0)) + "~" + str(p.range.at(1)) + "]"
        text(fill: t.passage-header.range-fill,
             weight: t.passage-header.range-weight,
             size: 10.5pt)[#rng]
        h(0.6em)
      }
      #if p.header != "" {
        text(size: 9.5pt, fill: t.color.body, weight: "medium")[#p.header]
      }
    ]
  }
  // body box — 지문 본문만 둘러싸는 청색 stroke. column/page 넘으면 분할.
  block(
    stroke: t.passage-body-box.stroke,
    fill: t.passage-body-box.fill,
    inset: (x: t.passage-body-box.inset-x, y: t.passage-body-box.inset-y),
    width: 100%,
    above: t.passage-body-box.above,
    below: t.passage-body-box.below,
    breakable: t.passage-body-box.breakable,
  )[
    #for para in (if "body_rich" in p { () } else { p.body.split("\n") }) {
      if para.trim() != "" {
        apply-para-style(pick("지문:지문"), para)
      }
    }
    #if "body_rich" in p {
      render-rich-paragraphs(t.typography.passage-body, p.body_rich)
    }
    #if "source" in p {
      align(right)[#text(size: 9pt, fill: t.color.muted)[#p.source]]
      v(t.space.after-source, weak: true)
    }
    #if "glossary" in p {
      v(t.space.after-passage-body, weak: true)
      for g in p.glossary {
        apply-para-style(pick("보기명조"), [\* #g])
      }
    }
  ]
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
//
// 두 번째 이후 passage는 새 column 또는 새 페이지에서 시작 — header strip + body box
// 첫 줄들이 column 하단에 잘려 다음 column으로 흘러가는 orphan 방지.
// 첫 passage는 그대로 시작 (자연스러운 chapter 흐름 유지).
//
// 정교한 잔여 높이 측정 대신 colbreak(weak)로 1차 안전 규칙. weak이라 이미 column 시작이면
// skip되므로 빈 column 폭증 위험 낮음.
#let render-passages-chapter(passages, questions) = {
  let _passages = passages
  let groups = group-by-passage(questions)
  let first = true
  for g in groups {
    if not first {
      colbreak(weak: true)
    }
    first = false
    let p = none
    for pp in _passages { if pp.id == g.pid { p = pp } }
    if p != none { render-passage(p) }
    if p != none and p.at("layout_mode", default: "default") == "question-split" {
      colbreak(weak: true)
    }
    for q in g.qs { render-question(q) }
  }
}


// passages 페이지 background — 본문 단 외곽 시안 보더 (IDML simply-classic 시그니처).
// 페이지 마진 안쪽 본문 영역을 columns 수에 따라 좌·우(또는 1단) rect stroke로 그림.
//
// 변수명: typst alignment 키워드(top/left)와 충돌 피하려 m-* 접두 사용.
#let _passages-background(master, columns, gutter) = {
  let debug-border = _options.at("debugColumnBorder", default: false)
  if not (t.column-border.enabled or debug-border) { return none }
  let pw = master.width
  let ph = master.height
  let m = master.margin
  let m-left = m.inside
  let m-right = m.outside
  let m-top = m.top
  let m-bottom = m.bottom
  let body-w = pw - m-left - m-right
  let body-h = ph - m-top - m-bottom
  let col-w = if columns > 1 { (body-w - gutter * (columns - 1)) / columns } else { body-w }
  [
    #for i in range(columns) [
      #place(top + left,
             dx: m-left + i * (col-w + gutter),
             dy: m-top,
             rect(width: col-w, height: body-h,
                  stroke: t.column-border.width + t.column-border.color,
                  fill: none))
    ]
  ]
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
//
// chapter type별 페이지 master + columns + background 갱신:
//   part-cover  → 1단, background 제거 (자기 PART 라벨 직접 그림)
//   passages    → master + _layout.columns + 본문 단 외곽 시안 보더 background
//   answer-key  → master_5_빠른정답 + 1단 + background 제거
#let _passages-bg = _passages-background(_master, _layout.columns, _layout.gutter)

#for c in _chapters {
  if c.type == "part-cover" {
    set page(
      width: _master.width,
      height: _master.height,
      margin: (x: 20mm, y: 20mm),
      columns: 1,
      background: none,
    )
    render-part-cover(c.label, c.at("subtitle", default: ""))
  } else if c.type == "passages" {
    set page(.._master, columns: _layout.columns, background: _passages-bg)
    render-passages-chapter(c.at("passages", default: ()),
                            c.at("questions", default: ()))
  } else if c.type == "answer-key" {
    set page(..mp.master_5_빠른정답, columns: 1, background: none)
    render-answer-key(c.at("answers", default: (:)))
  }
}
