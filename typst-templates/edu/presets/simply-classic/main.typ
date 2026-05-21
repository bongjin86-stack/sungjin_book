// presets/simply-classic/main.typ
//
// IDML 흡수 첫 검증 entry — 우리 HWP→JSON 데이터를 simply-classic IDML의
// paragraph style로 식자한다. 인디자인 원본 디자인이 다른 콘텐츠에도
// 입혀지는지 확인하는 Vellum 검증.
//
// 매핑 (디자이너의 IDML paragraph style 이름 → 우리 콘텐츠 요소):
//   "지문:지문"            → 묶음 본문
//   "물음에답하시오"       → 묶음 헤더 라벨
//   "번호(NEW)"            → 문제 번호
//   "문제(NEW)" 또는 "문제명조" → 발문
//   "선지" 또는 "선지(NEW)"    → 선지
//
// 매핑은 초기 추정 — 시각 결과 보면서 보정 룰 누적.

#import "/typst-templates/edu/design-system/paragraph-style.typ": apply-para-style
#import "/typst-templates/edu/presets/simply-classic/paragraph-styles.typ": paragraph-styles
#import "/typst-templates/edu/presets/simply-classic/master-pages.typ" as mp
#import "/typst-templates/edu/presets/simply-classic/colors.typ": swatches

#let data = json("/data.json")
#let s = paragraph-styles
#let pick(name) = s.at(name, default: (:))
#let accent = swatches.at("C=100 M=0 Y=0 K=0")

#set page(..mp.main-master, columns: 2)
#set text(font: ("Source Han Serif KR", "Batang", "Noto Serif KR"), size: 10pt, lang: "ko", cjk-latin-spacing: auto)
#set par(leading: 0.7em, justify: true)

// 본문 흐름 — passage는 풀 폭, questions은 2단 (원본 시험지 식자 관례)
#let render-boki(boki-text) = {
  // <보기> 회색 박스 — column 경계 넘어가지 않게 breakable: false
  block(
    fill: rgb("#f1f1f1"),
    stroke: 0.3pt + rgb("#888"),
    inset: (x: 10pt, y: 8pt),
    width: 100%,
    radius: 0pt,
    breakable: false,
  )[
    #align(center)[#text(size: 8.5pt, weight: "bold")[< 보기 >]]
    #v(2pt)
    #apply-para-style(pick("보기"), boki-text)
  ]
}

// 식자 간격 — 명시적 v() 박아 column 모드에서도 확정.
#let GAP-NUMBER-TO-STEM = 18pt    // 큰 번호 ↔ 발문
#let GAP-STEM-TO-CHOICES = 9pt    // 발문 ↔ 첫 선지
#let GAP-BETWEEN-CHOICES = 6pt    // 선지 ↔ 선지 (한 줄 leading의 약 60%)
#let GAP-BOKI-AROUND = 18pt       // <보기> 박스 위아래

// 한 자리 → "01", 두 자리 → "12" (원본 시험지 zero-pad 관례)
#let _pad2(n) = if n < 10 { "0" + str(n) } else { str(n) }

#let render-question(q) = {
  apply-para-style(pick("번호(NEW)"), [#_pad2(q.number)])
  v(GAP-NUMBER-TO-STEM, weak: true)
  apply-para-style(pick("문제명조"), q.stem)
  v(GAP-STEM-TO-CHOICES, weak: true)
  if "boki" in q {
    render-boki(q.boki)
    v(GAP-BOKI-AROUND, weak: true)
  }
  for c in q.choices {
    apply-para-style(pick("선지"), [#c.glyph#h(0.3em)#c.text])
    v(GAP-BETWEEN-CHOICES, weak: true)
  }
}

// passage_id별로 묶고 — passage 본문 + 그에 속한 문제들 set 단위 식자
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

#let groups = group-by-passage(data.questions)

// columns는 set page(columns: 2)로 처리. 별도 wrap 불필요.

#for g in groups {
  let p = none
  for pp in data.passages { if pp.id == g.pid { p = pp } }

  if p != none {
    if p.header != "" {
      apply-para-style(
        pick("물음에답하시오"),
        [
          #if p.range != none {
            text(fill: accent, weight: "bold")[\[#p.range.at(0)~#p.range.at(1)\]]
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
      align(right)[#text(size: 9pt)[#p.source]]
    }
    if "glossary" in p {
      v(4pt)
      for g in p.glossary {
        apply-para-style(pick("보기명조"), [\* #g])
      }
    }
  }

  for q in g.qs { render-question(q) }
}
