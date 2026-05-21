// presets/gonggam-rates/paragraph-styles.typ
//
// 공감연구소_정답률 페이지의 모든 paragraph style 정의.
// 인디자인의 "Paragraph Styles 패널" 하나하나가 이 파일의 dict 하나에 대응.
//
// 약속된 키 (variant 함수가 이 키로 lookup):
//   body              — 기본 본문 (발문/선지 cascade base)
//   question-number   — 큰 컬러 문제 번호 "01"
//   stem              — 발문 (질문 본문)
//   choice            — 선지 본문 (①~⑤)
//   rate-strong       — 발문 끝 정답률 강조 (인라인)
//   rate-muted-inline — 선지 끝 오답 정답률 (인라인 회색)
//   passage-header    — 묶음 헤더 "[1~3] 다음 글을..."
//   passage-body      — 묶음 본문 (학생용 페이지에서)
//   footer-text       — outer 정렬 푸터
//   vertical-label    — 좌/우 outer 마진 세로 러닝 라벨

#import "/typst-templates/edu/presets/gonggam-rates/colors.typ": *

#let body = (
  font: ("Noto Serif KR",),
  size: 10pt,
  fill: ink-body,
  tracking: 0pt,
  leading: 0.85em,
  first-line-indent: 1em,
  alignment: "justify",
)

#let question-number = (
  font: ("Noto Sans KR",),
  size: 1.95em,
  weight: "bold",
  fill: accent-strong,
  space-before: 1.5em,
  space-after: 0.1em,
  alignment: "left",
)

#let stem = (
  font: ("Noto Serif KR",),
  size: 10pt,
  fill: ink-body,
  leading: 0.7em,
  first-line-indent: 0pt,
  alignment: "left",
)

#let choice = (
  font: ("Noto Serif KR",),
  size: 10pt,
  fill: ink-body,
  leading: 0.7em,
  first-line-indent: 0pt,
  space-before: 0.4em,
  alignment: "left",
)

// 인라인 character style — apply-char-style용
#let rate-strong = (
  font: ("Noto Sans KR",),
  size: 0.95em,
  weight: "bold",
  fill: accent-strong,
)

#let rate-muted-inline = (
  font: ("Noto Sans KR",),
  size: 0.85em,
  fill: rate-muted,
)

#let passage-header = (
  font: ("Noto Sans KR",),
  size: 0.95em,
  weight: "bold",
  fill: ink-strong,
  space-after: 0.5em,
  alignment: "left",
)

#let passage-body = (
  font: ("Noto Serif KR",),
  size: 10pt,
  fill: ink-body,
  leading: 0.85em,
  first-line-indent: 1em,
  alignment: "justify",
)

#let footer-text = (
  font: ("Noto Sans KR",),
  size: 8.5pt,
  fill: ink-muted,
)

#let vertical-label = (
  font: ("Noto Sans KR",),
  size: 8.5pt,
  fill: ink-muted,
)
