// 객관식 — 출판사형 (publisher)
//
// 기준: 성진_2027_공감연구소_기출의테마DNA1.0 (인디자인 작업본)
// 특징:
//   - 번호: 박스 없음, 큰 산스 굵게 + accent 컬러("01" 단독 줄)
//   - 발문: 다음 줄, 발문 끝에 정답률 컬러 굵게 (옵셔널)
//   - 선지: ①~⑤ 끝에 정답률 inline. 정답만 accent 굵게, 오답은 회색
//   - 정답률/정답 표시는 데이터에 있을 때만. 없으면 깨끗한 객관식만 식자

#import "/typst-templates/_core/sungjin-core.typ": *

#let pub-accent     = rgb("#0088c8")  // 강조 청: 번호·정답·정답률
#let pub-rate-muted = luma(150)        // 오답 정답률

// 정답률 dict 렌더링 — ("화작": 73, "언매": 82) 형태
#let render-rate-dict(rate-dict, strong: false) = {
  if rate-dict == none { return }
  let pairs = ()
  for k in rate-dict.keys() {
    let v = rate-dict.at(k)
    pairs.push(
      if strong {
        text(font: sans-fonts, weight: "bold", size: 0.95em, fill: pub-accent)[#k #v%]
      } else {
        text(font: sans-fonts, size: 0.85em, fill: pub-rate-muted)[#k #v%]
      }
    )
  }
  pairs.join(h(0.5em))
}

#let render-choice(c) = block(
  spacing: 0.55em,
  above: 0.4em,
)[
  #grid(
    // 선지 본문 + 정답률을 자연스러운 너비로. 정답률 우측 정렬 + 너무 멀지 않게.
    columns: (1fr, auto),
    column-gutter: 1.2em,
    align: (left, right + horizon),
    [#c.glyph#h(0.35em)#render-with-markers(c.text)],
    {
      let rate = c.at("rate", default: none)
      let correct = c.at("is_correct", default: false)
      if rate != none { render-rate-dict(rate, strong: correct) }
    },
  )
]

#let empty-choices-notice = block(spacing: 0.5em)[
  #text(font: sans-fonts, size: 0.82em, fill: luma(150), style: "italic")[
    \[보기가 추출 단계에서 빠짐\]
  ]
]

// "1" → "01" 두 자리 패딩
#let pad2(n) = {
  let s = str(n)
  if s.len() < 2 { "0" + s } else { s }
}

#let render-question(q) = block(
  breakable: true,
  spacing: 1.7em,
  above: 1.5em,
)[
  // 큰 컬러 번호 — 두 자리 패딩 + 단독 줄
  #text(font: sans-fonts, weight: "bold", size: 1.95em, fill: pub-accent)[#pad2(q.number)]
  #v(0.1em, weak: true)

  // 발문 (좌) + 발문 끝 정답률 (우)
  #grid(
    columns: (1fr, auto),
    column-gutter: 8pt,
    align: (left, right + horizon),
    [
      #render-with-markers(q.stem)
      #if q.score != none [
        #h(0.4em)#text(font: sans-fonts, size: 0.82em, fill: ink-muted)[\[#(q.score)점\]]
      ]
    ],
    {
      let rate = q.at("correct_rate", default: none)
      if rate != none { render-rate-dict(rate, strong: true) }
    },
  )

  #v(0.45em, weak: true)

  // 선지
  #let all-empty = q.choices.len() > 0 and q.choices.all(c => c.text.trim() == "")
  #if q.choices.len() == 0 or all-empty {
    empty-choices-notice
  } else {
    for c in q.choices { render-choice(c) }
  }
]
