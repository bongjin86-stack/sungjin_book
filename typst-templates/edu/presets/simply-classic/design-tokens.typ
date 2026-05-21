// presets/simply-classic/design-tokens.typ
//
// STS (Sungjin Typography System) — simply-classic preset 토큰.
// 룰·체계 전체는 design-system/STS-SPEC.md 참조.
//
// 이 파일은 simply-classic이 STS 룰에서 override하는 값들:
//   - 색 (accent 청색)
//   - 폰트 (Source Han Serif KR / Batang fallback)
//   - 간격 (Q2 룰의 값)
//   - 정렬 indent (Q1 룰의 14pt)
//   - baseline grid (Q5 룰의 18pt)
//
// 사용:
//   #import "/typst-templates/edu/presets/simply-classic/design-tokens.typ" as tokens
//   #tokens.space.between-questions  // 문제 사이 여백
//
// 변경 시 시각 결과 즉시 확인 — 두 PNG 띄우고 비교하는 워크플로우.

#import "/typst-templates/edu/presets/simply-classic/colors.typ": swatches


// ═════════════════════════════════════════════════════════════════════════════
// 식자 룰 (Composition Rules)
// ═════════════════════════════════════════════════════════════════════════════
//
// 한 문제 = 항상 [문항번호 / 지시문 / 선지] 3-part 구성.
// 룰만 정확하면 어떤 콘텐츠가 들어와도 자동 식자.
//
// ── RULE 1 — 선지 좌측 정렬 (Choice Alignment) ─────────────────────────────
//
//   ① [A]는 묘사를 통해 인물의 외양을, [B]는 발     ← 첫 줄
//     화를 통해 인물의 감회를 드러내고 있다.        ← wrap된 둘째 줄
//   ^^^^                                              ① 글자 = column.left
//        ^                                            ① 다음 텍스트 = column.left + 14pt
//                                                    wrap된 둘째 줄 = column.left + 14pt (동일)
//
//   구현: place(dx: -14pt)로 ① 글자만 paragraph 밖에 박고, 본문은 inset 14pt 들여쓰기.
//
//
// ── RULE 2 — 수직 위계 = 간격 (Vertical Hierarchy) ──────────────────────────
//
//   같은 그룹은 좁게, 다른 그룹은 넓게.
//
//   ┌─ 문항번호 (윗단 그룹) ─────────────────────┐
//   │ 01                                          │
//   │  ↕ 6pt   ← 한 그룹임을 표시: 좁게         │
//   │ 지시문                                      │
//   └─────────────────────────────────────────────┘
//      ↕ 14pt  ← 윗단↔아랫단 분리: 더 띄움
//   ┌─ 선지 (아랫단 그룹) ───────────────────────┐
//   │ ①                                           │
//   │  ↕ 6pt   ← 선지끼리: 좁게                  │
//   │ ②                                           │
//   │ ...                                         │
//   └─────────────────────────────────────────────┘
//      ↕ 24pt  ← 문제 사이: 가장 멀리
//   ┌─ 다음 문제 ─────────────────────────────────┐
//
//
// ── RULE 3 — 시각 위계 = 크기·굵기·색 (Visual Hierarchy) ────────────────────
//
//   강조 순:  문항번호 > 지시문 > 선지
//
//   문항번호: 14pt   extrabold  청색 (#0091db)   ← 가장 강조
//   지시문:   10.5pt medium     검정 (#222)     ← 윗단, 선지보다 0.5pt 큼
//   선지:     10pt   regular    검정 (#222)     ← 기본
//
//   룰: 선지가 지시문보다 0.5pt 작아야 자연스러운 윗단/아랫단 시각 위계.
//
//
// ── RULE 4 — 좌측 정렬 기준 (Left Alignment Lines) ──────────────────────────
//
//   2개의 수직 정렬 라인:
//
//     line A (column.left)        line B (column.left + 14pt)
//     │                           │
//     01                          │
//     [A]와 [B]에 나타난           │   ← 지시문 첫 글자 = line A
//     ① [A]는 묘사를...           │
//                                  화를 통해...    ← 선지 본문 wrap = line B
//     ② [A]와 달리...             │
//                                  에 대한...      ← 선지 본문 wrap = line B
//
//   line A: 01 번호 / 지시문 첫 글자 / 선지 ① 글자
//   line B: 선지 본문 + wrap된 모든 줄
//
//
// ── RULE 5 — Baseline Grid (모든 줄 18pt grid에 정렬) ───────────────────────
//
//   좌단/우단 같은 y 위치에 줄이 옴.
//   text size에 따라 typst leading = (18pt - size)로 변환.
//
// ═════════════════════════════════════════════════════════════════════════════


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
  number-to-stem:    9pt,   // ❶ 번호 → ❷ stem (사용자 v26: 6pt 좁음, 살짝 더)
  stem-to-choices:   14pt,  // ❷ stem → 첫 선지
  between-choices:   8pt,   // 선지 ↔ 선지
  choice-wrap-leading: 6.5pt, // 한 선지 안 wrap 줄간격 (다른 선지 사이보다 살짝 좁게)
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


// ── Typography (시각 위계 spec override) ────────────────────────────────────
//
// paragraph-styles.typ는 IDML 자동 추출. 이 토큰은 그 위에 override.
// 사용자 확정 (v26): 윗단 고딕 계열, 선지는 명조 그대로.
#let typography = (
  question-number: (
    font: ("Malgun Gothic", "Noto Sans KR"),
    size: 15pt,
    weight: "extrabold",
    fill: rgb("#0091db"),
  ),
  question-stem: (
    font: ("Malgun Gothic", "Noto Sans KR"),
    size: 11.5pt,
    weight: "medium",
    fill: rgb("#222222"),
  ),
)


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


// ── Layer 2: Page 토큰 (단 수·gutter·rule) ──────────────────────────────────
//
// 사용자 정의 변수로 toggle. JSON 데이터에 `layout` 필드 또는 main 호출 시 override.
#let page-1col = (
  columns: 1,
  gutter: 0pt,
  rule: none,
)
#let page-2col = (
  columns: 2,
  gutter: 6mm,
  rule: none,         // simply-classic 원본은 column rule 없음
)
