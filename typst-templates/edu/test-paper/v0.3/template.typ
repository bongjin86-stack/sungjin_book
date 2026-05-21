// 교재형 — 평가원풍 시험지 v0.3 (variant 디스패치 + 페이지 모드 분기)
//
// v0.3는 더 이상 식자를 직접 박지 않는다. 블록(variant 라이브러리)에서 골라 조합한다.
//
// 사용자가 meta.style 4가지를 골라 식자 디자인을 구성:
//   - multiple_choice: 객관식 식자        (multiple-choice/*)
//   - short_answer  : 주관식 식자        (short-answer/*)
//   - passage       : 묶음(지문) 식자    (passage/*)
//   - layout        : 단 배열 + 세로선   (layout/*)
//
// 페이지 모드(meta.mode)로 시험지 vs 출판물 분기:
//   - "exam-paper"   : 평가원형 (헤더+가운데 푸터, 디폴트)
//   - "teacher-book" : 학원 출판물형 (좌/우 outer 세로 라벨, outer 정렬 푸터)
//
// 입력 스키마: edu-import/v0 (+ 선택적 meta.style / meta.mode / meta.heading)

#import "/typst-templates/_core/sungjin-core.typ": *

// ── variant 라이브러리 ───────────────────────────────────────────────────────
#import "/typst-templates/edu/blocks/multiple-choice/academy.typ" as mc-academy
#import "/typst-templates/edu/blocks/multiple-choice/publisher.typ" as mc-publisher

#import "/typst-templates/edu/blocks/short-answer/academy.typ" as sa-academy

#import "/typst-templates/edu/blocks/passage/sidebar-label.typ" as ps-sidebar-label
#import "/typst-templates/edu/blocks/passage/boxed-dashed.typ" as ps-boxed-dashed
#import "/typst-templates/edu/blocks/passage/plain.typ" as ps-plain

#import "/typst-templates/edu/blocks/layout/two-col-rule.typ" as lo-two-col-rule
#import "/typst-templates/edu/blocks/layout/one-col.typ" as lo-one-col

#let mc-variants = (
  "academy": mc-academy.render-question,
  "publisher": mc-publisher.render-question,
)
#let sa-variants = (
  "academy": sa-academy.render-question,
)
#let ps-variants = (
  "sidebar-label": ps-sidebar-label.render-passage,
  "boxed-dashed": ps-boxed-dashed.render-passage,
  "plain": ps-plain.render-passage,
)
#let layout-variants = (
  "two-col-rule": lo-two-col-rule,
  "one-col": lo-one-col,
)

#let passage-by-id(passages, id) = {
  let found = none
  for p in passages { if p.id == id { found = p } }
  found
}

// ── 시험지 진입점 ────────────────────────────────────────────────────────────
// 페이지 모드별 set page는 헬퍼 함수로 분리하지 않고 test-paper 안에 직접 박는다.
// 이유: typst 0.14에서 set page footer/background에 외부 함수 안에서 박힌 content가
// silent failure로 무효화됨 (CLI/WASM 둘 다 재현). 함수 wrapper 금지.
#let test-paper(data) = {
  let subject-name = if "subject" in data.meta { data.meta.subject } else { "국어" }
  let mode = data.meta.at("mode", default: "exam-paper")

  let style = data.meta.at("style", default: (:))
  let style-mc = style.at("multiple_choice", default: "academy")
  let style-sa = style.at("short_answer", default: "academy")
  let style-ps = style.at("passage", default: "sidebar-label")
  let style-layout = style.at("layout", default: "two-col-rule")

  let render-question-mc = mc-variants.at(style-mc, default: mc-academy.render-question)
  let render-question-sa = sa-variants.at(style-sa, default: sa-academy.render-question)
  let render-passage = ps-variants.at(style-ps, default: ps-sidebar-label.render-passage)
  let layout-mod = layout-variants.at(style-layout, default: lo-two-col-rule)

  let render-q-dispatch = (q) => {
    if q.choices.len() == 0 {
      render-question-sa(q)
    } else {
      render-question-mc(q)
    }
  }

  // 페이지 모드(set page) + 본문 기본(set text/par)은 caller(main.typ)의 top-level 책임.
  // 이 함수는 본문 식자 흐름만. typst quirk(함수 안 set page footer/bg silent failure) 우회.

  show: rest => layout-mod.wrap-columns(rest)

  // teacher-book 모드는 정답률 페이지 = 묶음 본문 미표시 (기준 PDF p57 패턴)
  let skip-passages = mode == "teacher-book"

  let prev-pid = none
  for q in data.questions {
    if q.passage_id != prev-pid {
      if not skip-passages {
        let p = passage-by-id(data.passages, q.passage_id)
        if p != none {
          render-passage(p)
          v(0.5em, weak: true)
        }
      }
      prev-pid = q.passage_id
    }
    render-q-dispatch(q)
  }
}
