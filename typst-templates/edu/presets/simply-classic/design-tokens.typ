// presets/simply-classic/design-tokens.typ
//
// simply-classic 디자인 시스템의 명명·간격·정렬 토큰.
// v21에서 사용자 시각 검증으로 확정된 값들.
//
// 사용:
//   #import "/typst-templates/edu/presets/simply-classic/design-tokens.typ" as tokens
//   #tokens.space.between-questions  // 문제 사이 여백
//
// 변경 시 시각 결과 즉시 확인 — 두 PNG 띄우고 비교하는 워크플로우.

#import "/typst-templates/edu/presets/simply-classic/colors.typ": swatches


// ── 시각 요소 명명 (Element Names) ────────────────────────────────────────────
//
// 한 문제(question)의 구조:
//
//   윗단 (header band)         아랫단 (choices band)
//   ┌─────────────────┐         ┌──────────────────────┐
//   │ ❶ question-number│         │ ① choice-glyph        │
//   │ ❷ question-stem  │         │   choice-text  (wrap) │
//   └─────────────────┘         │ ② ...                 │
//                                │ ⑤ ...                 │
//                                └──────────────────────┘
//
//   passage band (선택):
//     passage-header (라벨)
//     passage-body (지문)
//     passage-source (출처) / passage-glossary (낱말)
//     boki-box (<보기> 회색 박스, question에 종속)


// ── Baseline Grid ────────────────────────────────────────────────────────────
//
// 모든 줄이 18pt grid에 정렬. 좌단/우단 같은 y에 줄이 와야 함.
#let baseline-grid = 18pt


// ── 색 (Color) ────────────────────────────────────────────────────────────────
#let color = (
  accent: swatches.at("C=100 M=0 Y=0 K=0", default: rgb("#0091db")),  // 청색 (번호)
  body:   rgb("#222222"),                                              // 본문 검정 (#000 아님)
  muted:  rgb("#666666"),                                              // 보조 텍스트 (출처, 낱말)
)


// ── 폰트 (Font) ──────────────────────────────────────────────────────────────
//
// CJK Enclosed Numerals (①②③④⑤) — Source Han Serif Subset 결락 가능 → Batang 우선.
#let font = (
  serif:    ("Source Han Serif KR", "Batang", "Noto Serif KR"),
  serif-fallback-glyph: ("Batang", "Source Han Serif KR", "Noto Serif KR"),
  sans:     ("Malgun Gothic", "Noto Sans KR"),
)


// ── 간격 (Space) ─────────────────────────────────────────────────────────────
//
// 웹의 margin과 동일 개념. typst block.above/below + v() 박음.
// baseline-grid의 0.5x/1x/1.5x 배수로 박는 게 시각 일관성 좋음.
#let space = (
  // 한 문제 안 (intra-question)
  number-to-stem:    6pt,   // ❶ 번호 → ❷ stem
  stem-to-choices:   14pt,  // ❷ stem → 첫 선지 (사용자: 9pt 좁음, 18pt 넓음)
  between-choices:   6pt,   // 선지 ↔ 선지
  boki-around:       18pt,  // <보기> 박스 위·아래 (grid 1배)

  // 문제 간격 (inter-question)
  between-questions: 24pt,  // 문제 set 사이

  // passage 영역
  after-passage-body:  6pt,   // passage 본문 → 출처
  after-source:        4pt,   // 출처 → 낱말
)


// ── 정렬 (Alignment) ─────────────────────────────────────────────────────────
//
// 좌측 정렬 기준 라인:
//   column-left (= 페이지 column.left edge)
//     = 01 번호 위치
//     = stem 첫 글자 위치
//     = ① 글자 위치 (place로 박힘)
//
// 들여쓰기 위치:
//   choice-text-indent = column-left + 14pt
//     = ① 다음 텍스트 첫 글자 위치
//     = wrap된 둘째 줄 시작 위치
//     = ① 글자 폭(약 11pt) + 시각 여백(3pt)
#let align-rule = (
  choice-text-indent: 14pt,   // 선지 본문 들여쓰기 (block.inset.left)
  choice-glyph-dx:    -14pt,  // ① 글자를 본문보다 14pt 왼쪽 (place dx)
)


// ── 시각 위계 (Typography Role) ──────────────────────────────────────────────
//
// 역할별 paragraph spec 이름과 의도된 시각 위계:
//
//   role               | size  | weight   | color  | usage
//   ───────────────────┼───────┼──────────┼────────┼──────────────────
//   question-number    | 14pt  | extrabold| accent | "01" 큰 청색
//   question-stem      | 10.5pt| medium   | body   | 발문 (선지보다 살짝 큼)
//   choice-text        | 10pt  | regular  | body   | 선지 본문
//   choice-glyph       | 10pt  | regular  | body   | ①②③④⑤
//   passage-body       | 10.5pt| regular  | body   | 지문
//   passage-header     | 10pt  | bold     | accent | [1~4] 다음 글을 읽고
//   passage-source     | 9pt   | regular  | body   | "- 작자 미상 -"
//   passage-glossary   | 9pt   | regular  | body   | "* 조대: 낚시터"
//   boki-label         | 8.5pt | bold     | body   | "< 보기 >"
//   boki-body          | 10pt  | regular  | body   | <보기> 박스 안 텍스트
//
// 위계 룰:
//   - 윗단 (number + stem)이 아랫단 (choices)보다 시각적으로 큼
//   - 색은 청색(accent)을 번호와 passage-header에만, 나머지는 검정
//   - weight는 stem만 medium, 나머지 regular


// ── 박스 (Box) ────────────────────────────────────────────────────────────────
#let boki-box = (
  fill:        rgb("#f1f1f1"),
  stroke:      0.3pt + rgb("#888"),
  inset-x:     10pt,
  inset-y:     8pt,
  radius:      0pt,
  breakable:   false,  // column 경계 넘지 않음
  label-size:  8.5pt,
)
