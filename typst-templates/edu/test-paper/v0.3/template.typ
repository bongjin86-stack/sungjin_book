// 교재형 — 평가원풍 2단 시험지 v0.3
//
// v0.2 대비 변경:
//   - sungjin-core.typ import: 폰트·색 토큰·헬퍼 공유
//   - 묶음 박스 디자인 = 왼쪽 굵은 사이드바 + 라벨 (평가원 실제 스타일에 더 가까움)
//   - 발문/보기 식자 정교화 (글꼴 크기·간격 미세 조정)
//   - 보기 ①~⑤ 균등 정렬 — 본문이 한 줄에 다 들어가는 케이스
//   - 단 사이 가는 세로선
//   - 빈 보기 안내문 디자인
//   - 인라인 마커(⟦수식⟧, ⟨IMG:path⟩) 처리는 core의 render-with-markers 위임
//
// 입력 스키마: edu-import/v0

#import "/typst-templates/_core/sungjin-core.typ": *

// ── 묶음 박스 (평가원 스타일: 왼쪽 굵은 사이드바) ────────────────────────────
#let render-passage(p) = block(
  spacing: 1em,
  breakable: true,
  width: 100%,
)[
  #grid(
    columns: (2.5pt, 1fr),
    column-gutter: 7pt,
    rect(width: 2.5pt, height: 100%, fill: accent, stroke: none),
    [
      #text(font: sans-fonts, weight: "bold", size: 0.9em, fill: accent)[
        \[#p.range.at(0) ~ #p.range.at(1)\] #p.header
      ]
      #v(0.4em, weak: true)
      #text(size: 0.95em)[#render-with-markers(p.body)]
    ],
  )
]

// ── 보기 한 줄 ───────────────────────────────────────────────────────────────
// 글리프는 sans · 본문은 serif. 평가원 식자 그대로.
#let render-choice(c) = block(spacing: 0.45em, above: 0.35em)[
  #text(font: sans-fonts, fill: ink-strong)[#c.glyph]#h(0.4em)#render-with-markers(c.text)
]

// ── 빈 보기 안내문 ───────────────────────────────────────────────────────────
#let empty-choices-notice = block(spacing: 0.5em)[
  #text(font: sans-fonts, size: 0.82em, fill: luma(150), style: "italic")[
    \[보기가 화학식·표·그림 안에 있어 텍스트 추출 단계에서 빠짐 — v2에서 회수 예정\]
  ]
]

// ── 문항 ─────────────────────────────────────────────────────────────────────
#let render-question(q) = block(
  breakable: true,
  spacing: 1.15em,
  above: 0.95em,
)[
  #text(font: sans-fonts, weight: "bold", size: 1.02em, fill: ink-strong)[#q.number.]#h(0.4em)#render-with-markers(q.stem)
  #if q.score != none [
    #h(0.5em)#text(font: sans-fonts, size: 0.82em, fill: ink-muted)[\[#(q.score)점\]]
  ]
  #v(0.3em, weak: true)
  #let all-empty = q.choices.len() > 0 and q.choices.all(c => c.text.trim() == "")
  #if q.choices.len() == 0 or all-empty {
    empty-choices-notice
  } else {
    for c in q.choices { render-choice(c) }
  }
]

// ── 묶음 ID 검색 ─────────────────────────────────────────────────────────────
#let passage-by-id(passages, id) = {
  let found = none
  for p in passages { if p.id == id { found = p } }
  found
}

// ── 시험지 진입점 ────────────────────────────────────────────────────────────
#let test-paper(data) = {
  let subject-name = if "subject" in data.meta { data.meta.subject } else { "국어" }

  set page(
    paper: "a4",
    margin: (top: 22mm, bottom: 15mm, left: 13mm, right: 13mm),
    header: three-part-header(
      left-text: [2025학년도 대학수학능력시험 문제지],
      center-text: [#subject-name 영역],
      right-text: context [#counter(page).get().at(0)],
    ),
    header-ascent: 8mm,
    footer: page-footer([#subject-name 영역]),
    footer-descent: 6mm,
  )
  setup-korean(size: 9.8pt, leading: leading-body)

  // 2단 본문
  show: rest => columns(2, gutter: 8mm, rest)

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
