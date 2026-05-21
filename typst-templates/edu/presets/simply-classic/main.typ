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

#set page(..mp.main-master)
#set text(font: ("Noto Serif KR",), size: 10pt, lang: "ko", cjk-latin-spacing: auto)
#set par(leading: 0.7em, justify: true)

// 본문 흐름 — 우리 데이터(평가원 시험지 추출 JSON)를 IDML 디자인으로 식자
#let prev-pid = none
#for q in data.questions {
  // 묶음 진입
  if q.passage_id != prev-pid {
    let p = none
    for pp in data.passages { if pp.id == q.passage_id { p = pp } }
    if p != none {
      // 묶음 헤더 — [n~m] 부분만 청색 강조
      apply-para-style(
        pick("물음에답하시오"),
        [
          #text(fill: accent, weight: "bold")[\[#p.range.at(0)~#p.range.at(1)\]]
          #h(0.5em)
          #p.header
        ],
      )
      // 묶음 본문 — \n으로 단락 분리해 들여쓰기 발동
      for para in p.body.split("\n") {
        if para.trim() != "" {
          apply-para-style(pick("지문:지문"), para)
        }
      }
    }
    prev-pid = q.passage_id
  }
  apply-para-style(pick("번호(NEW)"), [#str(q.number)])
  apply-para-style(pick("문제명조"), q.stem)
  for c in q.choices {
    apply-para-style(pick("선지"), [#c.glyph#h(0.3em)#c.text])
  }
}
