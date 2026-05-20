// 교재형 Vellum — 2단 시험지 v0.1 (평가원형 5지선다)
//
// 입력 스키마: edu-import/v0 (web/types/question.ts 와 1:1)
// 절대 원칙:
//   - typst-templates/sinkukpan/ 과 어떤 코드도 공유하지 않는다.
//   - 단행본 도메인과 분리. 이 파일만 단독으로 컴파일 가능해야 한다.
//
// 입력 JSON 형태
//   {
//     meta: { source, extracted_at, schema },
//     passages: [{ id, range:[a,b], header, body }],
//     questions: [{ number, passage_id, stem, score, choices:[{index,glyph,text,has_placeholder}], ... }]
//   }
//
// 본 v0.1의 한계 (의도적):
//   - 수식·이미지·복잡한 표는 placeholder("그림"/"표") 박스로 표시만.
//   - 정답·해설 분리 없음 (학생용 print mode 만).
//   - 표지·과목 헤더는 단순 한 줄.

// ── 폰트 fallback ────────────────────────────────────────────────────────────
// fonts/ 폴더 동봉본만 사용 (Noto KR 4종). CJK KR fallback은 시스템에 따라
// 경고가 날 수 있어 제외.
#let serif-fonts = ("Noto Serif KR",)
#let sans-fonts  = ("Noto Sans KR", "Noto Serif KR")

// ── <그림>/<표> placeholder → 회색 박스 ──────────────────────────────────────
#let placeholder(label) = box(
  fill: luma(235),
  stroke: 0.3pt + luma(170),
  inset: (x: 0.4em, y: 0.1em),
  outset: (y: 0.1em),
  radius: 1pt,
)[#text(font: sans-fonts, size: 0.8em, fill: luma(80))[#label]]

// 텍스트 안에 끼어든 <그림>/<표>를 박스로 치환.
// $...$ 마커는 인라인 수식으로 해석 (eval markup 모드).
#let render-text(s) = {
  show "<그림>": placeholder("그림")
  show "<표>":   placeholder("표")
  eval(s, mode: "markup")
}

// ── 묶음 지문에서 ID로 객체 찾기 ────────────────────────────────────────────
#let passage-by-id(passages, id) = {
  let found = none
  for p in passages {
    if p.id == id { found = p }
  }
  found
}

// ── 묶음 박스 ──────────────────────────────────────────────────────────────
#let render-passage(p) = block(
  fill: luma(248),
  stroke: (left: 2pt + luma(70)),
  inset: (left: 8pt, top: 6pt, right: 6pt, bottom: 6pt),
  spacing: 1em,
  breakable: true,
  width: 100%,
)[
  #text(font: sans-fonts, weight: "bold", size: 0.95em)[
    [#p.range.at(0)~#p.range.at(1)] #p.header
  ]
  #v(0.4em, weak: true)
  #render-text(p.body)
]

// ── 보기 한 줄 ─────────────────────────────────────────────────────────────
#let render-choice(c) = block(spacing: 0.45em, above: 0.35em)[
  #text(font: sans-fonts)[#c.glyph] #h(0.2em) #render-text(c.text)
]

// ── 문항 ───────────────────────────────────────────────────────────────────
#let render-question(q) = block(
  breakable: true,
  spacing: 1em,
  above: 0.8em,
)[
  #text(font: sans-fonts, weight: "bold")[#q.number.]#h(0.3em)#render-text(q.stem)
  #if q.score != none [
    #h(0.4em)#text(font: sans-fonts, size: 0.85em, fill: luma(80))[\[#(q.score)점\]]
  ]
  #v(0.2em, weak: true)
  #if q.choices.len() == 0 [
    #text(font: sans-fonts, size: 0.85em, fill: luma(140), style: "italic")[
      \[보기: 표/그림 안에 있어 텍스트 추출 단계에서 빠짐 — v2에서 회수\]
    ]
  ] else {
    for c in q.choices {
      render-choice(c)
    }
  }
]

// ── 시험지 진입점 ───────────────────────────────────────────────────────────
#let test-paper(data) = {
  set page(
    paper: "a4",
    margin: (top: 14mm, bottom: 14mm, left: 12mm, right: 12mm),
    footer: context align(center)[
      #text(font: sans-fonts, size: 8pt, fill: luma(120))[
        #counter(page).display() / #counter(page).final().at(0)
      ]
    ],
  )
  set text(
    font: serif-fonts,
    size: 9.5pt,
    lang: "ko",
    cjk-latin-spacing: auto,
  )
  set par(justify: true, leading: 0.55em, first-line-indent: 0pt)

  // 헤더 (1단 — 한 번만 그림)
  let subject-name = if "subject" in data.meta { data.meta.subject } else { "국어" }
  align(center)[
    #text(font: sans-fonts, weight: "bold", size: 16pt)[#subject-name 영역]
    #v(0.2em, weak: true)
    #text(font: sans-fonts, size: 8.5pt, fill: luma(110))[
      #data.meta.source — #data.questions.len() 문항 (v0.1 골격)
    ]
  ]
  v(2mm)
  line(length: 100%, stroke: 0.5pt + luma(180))
  v(2mm)

  // 2단 본문
  show: rest => columns(2, gutter: 7mm, rest)

  let prev-pid = none
  for q in data.questions {
    if q.passage_id != prev-pid {
      let p = passage-by-id(data.passages, q.passage_id)
      if p != none {
        render-passage(p)
        v(0.4em, weak: true)
      }
      prev-pid = q.passage_id
    }
    render-question(q)
  }
}
