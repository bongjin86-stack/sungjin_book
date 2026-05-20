// 교재형 — 평가원풍 시험지 v0.3 (variant 디스패치)
//
// v0.3는 더 이상 식자를 직접 박지 않는다. 블록(variant 라이브러리)에서 골라 조합한다.
//
// 사용자가 meta.style 4가지를 골라 시험지 디자인을 구성:
//   - multiple_choice: 객관식 식자        (multiple-choice/*)
//   - short_answer  : 주관식 식자        (short-answer/*)
//   - passage       : 묶음(지문) 식자    (passage/*)
//   - layout        : 단 배열 + 세로선   (layout/*)
//
// 디폴트는 모두 "academy"/"sidebar-label"/"two-col-rule" — 학원형 + 평가원풍.
//
// 입력 스키마: edu-import/v0 (+ 선택적 meta.style)

#import "/typst-templates/_core/sungjin-core.typ": *

// ── variant 라이브러리 (전부 top-level import) ────────────────────────────────
#import "/typst-templates/edu/blocks/multiple-choice/academy.typ" as mc-academy

#import "/typst-templates/edu/blocks/short-answer/academy.typ" as sa-academy

#import "/typst-templates/edu/blocks/passage/sidebar-label.typ" as ps-sidebar-label

#import "/typst-templates/edu/blocks/layout/two-col-rule.typ" as lo-two-col-rule
#import "/typst-templates/edu/blocks/layout/one-col.typ" as lo-one-col

// ── variant 디스패치 dict ────────────────────────────────────────────────────
#let mc-variants = (
  "academy": mc-academy.render-question,
)
#let sa-variants = (
  "academy": sa-academy.render-question,
)
#let ps-variants = (
  "sidebar-label": ps-sidebar-label.render-passage,
)
#let layout-variants = (
  "two-col-rule": lo-two-col-rule,
  "one-col": lo-one-col,
)

// ── 묶음 ID 검색 ─────────────────────────────────────────────────────────────
#let passage-by-id(passages, id) = {
  let found = none
  for p in passages { if p.id == id { found = p } }
  found
}

// ── 시험지 진입점 ────────────────────────────────────────────────────────────
#let test-paper(data) = {
  let subject-name = if "subject" in data.meta { data.meta.subject } else { "국어" }

  // 스타일 선택 (메타에 없으면 디폴트)
  let style = data.meta.at("style", default: (:))
  let style-mc = style.at("multiple_choice", default: "academy")
  let style-sa = style.at("short_answer", default: "academy")
  let style-ps = style.at("passage", default: "sidebar-label")
  let style-layout = style.at("layout", default: "two-col-rule")

  // variant 함수 꺼내기 (없으면 academy 디폴트)
  let render-question-mc = mc-variants.at(style-mc, default: mc-academy.render-question)
  let render-question-sa = sa-variants.at(style-sa, default: sa-academy.render-question)
  let render-passage = ps-variants.at(style-ps, default: ps-sidebar-label.render-passage)
  let layout-mod = layout-variants.at(style-layout, default: lo-two-col-rule)

  // 객관식 vs 주관식 판별: choices가 비어있고 stem 끝이 "?"가 아니거나 q.kind="short" 등이면 주관식
  // 현재 데이터엔 명시 필드 없으므로 choices 빈 케이스만 주관식으로 간주
  let render-q-dispatch = (q) => {
    if q.choices.len() == 0 {
      render-question-sa(q)
    } else {
      render-question-mc(q)
    }
  }

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
    background: layout-mod.column-rule,
  )
  // 평가원 시험지보다 약간 빽빽하던 인상 — 행간 한 단계 늘려 가독성 확보.
  setup-korean(size: 9.8pt, leading: leading-loose)

  // 본문 배열 (1단 또는 2단)
  show: rest => layout-mod.wrap-columns(rest)

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
    render-q-dispatch(q)
  }
}
