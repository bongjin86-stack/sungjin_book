// 교재형 Vellum — 2단 시험지 v0.2 (평가원풍 디자인)
//
// v0.1 대비 변경:
//   - 페이지 상단 영역 헤더 (상하 가로선 + 영역명 + 페이지 번호)
//   - 2단 본문 사이 가는 세로선
//   - 자료/<보기> 박스 디자인 정돈 (가는 테두리 + 회색 배경)
//   - 발문/보기 식자 (행간·들여쓰기·문항번호 굵게)
//   - 인라인 수식 ($...$) 지원 (eval markup 모드)
//   - 푸터 (영역명 + 페이지/총페이지)
//
// 입력 스키마: edu-import/v0 (web/types/question.ts 와 1:1)
// 절대 원칙:
//   - typst-templates/sinkukpan/ 과 어떤 코드도 공유하지 않는다.
//   - 단행본 도메인과 분리. 이 파일만 단독으로 컴파일 가능해야 한다.

// ── 폰트 fallback ────────────────────────────────────────────────────────────
#let serif-fonts = ("Noto Serif KR",)
#let sans-fonts  = ("Noto Sans KR", "Noto Serif KR")

// ── 색상 토큰 ────────────────────────────────────────────────────────────────
#let ink-strong  = luma(30)    // 본문 강조 (번호/헤더)
#let ink-body    = luma(20)    // 본문
#let ink-muted   = luma(110)   // 보조 텍스트(3점, 페이지번호)
#let line-strong = luma(40)    // 굵은 가로선
#let line-thin   = luma(170)   // 가는 가로/세로선
#let box-fill    = luma(248)   // 자료/<보기> 박스 배경
#let box-stroke  = luma(180)   // 자료/<보기> 박스 테두리

// ── <그림>/<표> placeholder → 회색 박스 ──────────────────────────────────────
#let placeholder(label) = box(
  fill: luma(238),
  stroke: 0.3pt + line-thin,
  inset: (x: 0.45em, y: 0.1em),
  outset: (y: 0.15em),
  radius: 1.5pt,
)[#text(font: sans-fonts, size: 0.82em, fill: luma(80))[#label]]

// 텍스트 안 <그림>/<표> 치환 + 인라인 수식 ⟦...⟧ 마커 + 이미지 ⟨IMG:path⟩ 마커.
#let render-text(s) = {
  show "<그림>": placeholder("그림")
  show "<표>":   placeholder("표")
  show regex("⟦([^⟧]*)⟧"): m => {
    let body = m.text.replace("⟦", "").replace("⟧", "").trim()
    if body == "" {
      text(fill: luma(160))[#sym.dots.h]
    } else {
      eval("$" + body + "$", mode: "markup")
    }
  }
  show regex("⟨IMG:[^⟩]+⟩"): m => {
    let path = m.text.replace("⟨IMG:", "").replace("⟩", "").trim()
    // 보기/발문 안 인라인 이미지 — width를 컬럼 폭의 90%로 묶어 가독성 확보
    box(image(path, width: 100%), width: 90%)
  }
  s
}

// ── 묶음 ID 검색 ─────────────────────────────────────────────────────────────
#let passage-by-id(passages, id) = {
  let found = none
  for p in passages {
    if p.id == id { found = p }
  }
  found
}

// ── 묶음 박스 (지문 + 자료) ───────────────────────────────────────────────────
#let render-passage(p) = block(
  fill: box-fill,
  stroke: 0.4pt + box-stroke,
  inset: (left: 8pt, top: 7pt, right: 7pt, bottom: 7pt),
  spacing: 1em,
  breakable: true,
  width: 100%,
  radius: 2pt,
)[
  // 묶음 라벨: [N~M] 헤더
  #text(font: sans-fonts, weight: "bold", size: 0.92em, fill: ink-strong)[
    \[#p.range.at(0) ~ #p.range.at(1)\] #p.header
  ]
  #v(0.45em, weak: true)
  #text(size: 0.95em)[#render-text(p.body)]
]

// ── 보기 한 줄 ───────────────────────────────────────────────────────────────
#let render-choice(c) = block(spacing: 0.5em, above: 0.4em)[
  #text(font: sans-fonts, fill: ink-strong)[#c.glyph]#h(0.35em)#render-text(c.text)
]

// ── 문항 ─────────────────────────────────────────────────────────────────────
#let render-question(q) = block(
  breakable: true,
  spacing: 1.1em,
  above: 0.9em,
)[
  #text(font: sans-fonts, weight: "bold", size: 1.02em, fill: ink-strong)[#q.number.]#h(0.35em)#render-text(q.stem)
  #if q.score != none [
    #h(0.5em)#text(font: sans-fonts, size: 0.82em, fill: ink-muted)[\[#(q.score)점\]]
  ]
  #v(0.25em, weak: true)
  // 보기 0개 또는 모든 보기 본문이 비어있으면 placeholder
  #let all-empty = q.choices.len() > 0 and q.choices.all(c => c.text.trim() == "")
  #if q.choices.len() == 0 or all-empty [
    #text(font: sans-fonts, size: 0.85em, fill: luma(140), style: "italic")[
      \[보기: 화학식·표·그림 안에 있어 텍스트 추출 단계에서 빠짐 — v2에서 회수\]
    ]
  ] else {
    for c in q.choices {
      render-choice(c)
    }
  }
]

// ── 페이지 헤더 (영역명 + 페이지 번호) ────────────────────────────────────────
#let make-header(subject-name) = context {
  let p = counter(page).get().at(0)
  block(width: 100%)[
    #line(length: 100%, stroke: 1.2pt + line-strong)
    #v(2pt, weak: true)
    #grid(
      columns: (1fr, auto, 1fr),
      align: (left + horizon, center + horizon, right + horizon),
      text(font: sans-fonts, size: 9pt, fill: ink-muted)[
        2025학년도 대학수학능력시험 문제지
      ],
      text(font: sans-fonts, size: 13pt, weight: "bold", fill: ink-strong)[
        #subject-name 영역
      ],
      text(font: sans-fonts, size: 12pt, weight: "bold", fill: ink-strong)[
        #p
      ],
    )
    #v(2pt, weak: true)
    #line(length: 100%, stroke: 0.4pt + line-thin)
  ]
}

// ── 페이지 푸터 ──────────────────────────────────────────────────────────────
#let make-footer(subject-name) = context {
  let cur = counter(page).get().at(0)
  let last = counter(page).final().at(0)
  align(center)[
    #text(font: sans-fonts, size: 8.5pt, fill: ink-muted)[
      #subject-name 영역 · #cur / #last
    ]
  ]
}

// ── 시험지 진입점 ────────────────────────────────────────────────────────────
#let test-paper(data) = {
  let subject-name = if "subject" in data.meta { data.meta.subject } else { "국어" }

  set page(
    paper: "a4",
    margin: (top: 22mm, bottom: 15mm, left: 13mm, right: 13mm),
    header: make-header(subject-name),
    header-ascent: 8mm,
    footer: make-footer(subject-name),
    footer-descent: 6mm,
  )
  set text(
    font: serif-fonts,
    size: 9.8pt,
    lang: "ko",
    fill: ink-body,
    cjk-latin-spacing: auto,
  )
  set par(justify: true, leading: 0.62em, first-line-indent: 0pt)

  // 2단 본문 + 단 사이 가는 세로선
  show: rest => columns(2, gutter: 8mm, rest)
  set columns(2, gutter: 8mm)

  let prev-pid = none
  for q in data.questions {
    if q.passage_id != prev-pid {
      let p = passage-by-id(data.passages, q.passage_id)
      if p != none {
        render-passage(p)
        v(0.5em, weak: true)
      }
      prev-pid = q.passage_id
    }
    render-question(q)
  }
}
