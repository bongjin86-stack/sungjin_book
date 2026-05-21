# Sungjin Typography System (STS)

> 성진북스 식자 시스템.
> 한국어 출판물(교재·단행본) 자동 식자를 위한 룰·토큰·컴포넌트 체계.
> 룰만 정확하면 어떤 콘텐츠가 들어와도 자동 식자.

## 0. 공통 어휘 (Vocabulary)

대화·코드·문서에서 같은 단어 사용.

| 한국어 | 영어 | 정의 |
|--|--|--|
| 윗단 | header band | 문항번호 + 지시문 그룹 |
| 아랫단 | choices band | 선지 ①②③④⑤ 그룹 |
| 문항번호 | question-number | "01" "02" 큰 청색 |
| 지시문 | question-stem | 발문 본문 |
| 선지 | choice | 한 선택지 (glyph + text) |
| 지문 | passage | 본문 단락 묶음 (소설/논설 등) |
| 묶음 | passage group | 한 지문 + 그에 딸린 문제들 |
| 보기 박스 | boki-box | 회색 `< 보기 >` 회색 박스 |
| line A | line A | column.left 정렬 라인 |
| line B | line B | column.left + indent 들여쓰기 라인 |
| 수직 위계 | vertical hierarchy | 그룹 간 간격으로 표현되는 위계 |
| 시각 위계 | visual hierarchy | 크기/굵기/색으로 표현되는 위계 |
| baseline grid | baseline grid | 모든 줄 18pt grid 정렬 |

## 1. 시스템 구조 — 4 Layers

| Layer | 이름 | 다루는 것 | 상태 |
|--|--|--|--|
| **L1** | **문제 STS** (Question) | 한 문제 안 식자 | ✅ v27 완성 |
| **L2** | **레이아웃 STS** (Layout) | 페이지·실제 조판 (IDML 분석 필요) | 미시작 |
| **L3** | **챕터·목차 STS** (Chapter) | 챕터 표지·목차·PART 단위 | 미시작 |
| **L4** | **UI/UX** | 작가/선생님 입력·조정 도구 | 마지막 |

각 Layer는 **룰 + 토큰**으로 정의. 같은 Layer 안에서 여러 **스타일(preset)** 공존 가능.

### 진행 원칙

> "너무 앞서나가지 말자" — 한 Layer를 다지고 다음으로.

현재: L1 문제 STS의 **simply-classic** 스타일 완성. 같은 L1에서 다른 스타일(다른 디자인의 IDML)도 추가 가능.

## 2. Layer 1 — Question 룰 (v22 확정)

**RULE Q1 — 선지 좌측 정렬**
- ① 글자 = line A (column.left)
- 선지 본문 첫 줄 = line B (column.left + 14pt)
- wrap된 둘째 줄 = line B (동일)
- 구현: `place(dx: -14pt)` + `block.inset.left = 14pt`

**RULE Q2 — 수직 위계 = 간격**
- 문항번호 ↔ 지시문: **6pt** (같은 그룹 = 좁게)
- (윗단) ↔ (아랫단): **14pt** (다른 그룹 = 분리)
- 선지 ↔ 선지: **6pt** (같은 묶음)
- 문제 ↔ 문제: **24pt** (가장 멀리)

**RULE Q3 — 시각 위계 = 크기/굵기/색**
| role | size | weight | color |
|--|--|--|--|
| 문항번호 | 14pt | extrabold | 청색(#0091db) |
| 지시문 | 10.5pt | medium | 검정(#222) |
| 선지 | 10pt | regular | 검정 |
- 지시문이 선지보다 **0.5pt 큼** = 윗단/아랫단 시각 분리.

**RULE Q4 — 좌측 정렬 2개 라인**
- line A: 문항번호 / 지시문 / ① 글자
- line B: 선지 본문 + wrap된 모든 줄

**RULE Q5 — Baseline grid**
- 모든 줄 18pt grid 정렬
- typst leading = `18pt - size` 변환 (InDesign vs typst 단위 차이)

## 3. Layer 2 — Page 룰 (정의 중)

### 콘셉트: 문제는 "박스 덩어리"

페이지 구성 단위는 **문제 박스**. 페이지는 박스들을 흘려 배치.
- 박스: 한 문제 (윗단 + 아랫단 + 선택적 보기박스)
- 박스는 가능한 한 column 안에서 자르지 않음 (`breakable: false` 후보)

### 정의해야 할 룰 (TODO)

**RULE P1 — 단 수 (columns)**
- 1단: 수학·이미지 많은 과목 (가로폭 필요)
- 2단: 국어·사탐·과탐 (text 많고 단 균형)
- preset 토큰: `columns: 1 | 2`

**RULE P2 — 묶음 배치 (passage + questions)**
- 지문이 먼저 흘러간 후 묶음 안 문제들이 이어짐
- 지문 끝에 출처/낱말 라인 (`passage-source`, `passage-glossary`)
- 한 묶음의 모든 문제가 같은 페이지에 있을 필요는 없음

**RULE P3 — 박스 column 분배**
- 자동 sequential fill (좌단 가득 후 우단)
- 박스(특히 boki 박스 포함 question)은 column 경계 넘지 않음

**RULE P4 — 긴 문제 분할**
- 한 문제가 한 column보다 길면 분할 가능
- 어디에서 자를지: stem 다음 / 선지 사이 (TODO 디자인 결정)

**RULE P5 — 헤더/푸터**
- 짝수 페이지: PART N + 페이지 번호 좌측
- 홀수 페이지: 제목 + 페이지 번호 우측
- 챕터 시작 페이지: 푸터 숨김 후보

### 토큰 (TODO)

- `page.columns`: 1 | 2
- `page.column-gutter`: 6mm (현재값)
- `page.column-rule`: none | 0.3pt + gray (세로선)
- `box.breakable`: false (문제 박스 column 넘김 금지)

## 4. Layer 3 — Chapter 룰 (TODO)

- 챕터 시작 페이지: 홀수 페이지에서 시작
- 챕터 표지: 큰 청색 "PART 1" + 부제
- 챕터 사이 빈 페이지

## 5. Layer 4 — Book 룰 (TODO)

- 표지 (front cover)
- 속표지 / 판권지
- 목차
- 챕터들 (L3)
- 빠른 정답 (answer key)
- Z-창고 (부록)

## 6. Preset 시스템

각 디자인은 preset으로:
- `presets/simply-classic/` — 심플리 고전소설 (IDML 자동 추출)
- `presets/gonggam-rates/` — 공감연구소 정답률 (손박음)
- 향후: `presets/sinkukpan/` — 신국판 단행본
- ...

preset이 override하는 것:
- 색 (accent)
- 폰트 (serif 우선순위)
- 간격 (space.*) 토큰
- 정렬 indent (align-rule.choice-text-indent)
- baseline grid (필요 시)
- page 토큰 (columns, gutter, rule)

룰 자체는 STS 공통. preset은 룰의 값만 override.

## 7. IDML 흡수 R&D

IDML 원본을 STS 룰로 매핑하는 과정:
1. **Style 추출** — paragraph-styles.typ 자동 생성 (✅)
2. **Master 추출** — master-pages.typ 자동 생성 (✅)
3. **Story 추출** — 본문 텍스트 → JSON (✅)
4. **Spread 페이지 매핑** — 페이지별 frame 위치 (미완)
5. **배경 추출** — 자유 배치 frame, 색박스, 라인, decorations (TODO)
