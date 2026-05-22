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

### 추출 가이드 (내일 IDML 배경 추출의 표적)

내일 IDML Spread XML에서 추출해서 채울 데이터 슬롯:

| 추출 대상 | 무엇 | 어떻게 |
|--|--|--|
| **자유 frame 위치** | 페이지마다 박힌 box, 라벨, 색박스 | Spread XML의 Rectangle/TextFrame ItemTransform |
| **색 채움 영역** | 회색 배경, 청색 라벨 영역 | Rectangle의 FillColor + bbox |
| **라인/구분선** | 수평선, 세로 구분선, 점선 | Line element + StrokeColor + StrokeWeight |
| **이미지 placeholder** | 그림 들어갈 자리 | Rectangle + Image placeholder |
| **페이지 헤더/푸터 위치** | y 좌표·정렬 | TextFrame y < margin.top 또는 y > height - margin.bottom |
| **PART 라벨 위치** | 외측 큰 청색 라벨 | TextFrame 좌측 상단, font size 큼, accent color |
| **column 구조** | 단 수, gutter, 세로선 | TextFrame width × position 분석 |

추출 결과는 `master-pages.typ` (이미 일부 자동 생성) 확장 또는 `decorations.typ` 새 파일로.

### 정의해야 할 룰 (TODO — 내일 추출 결과로 채움)

**RULE P1 — 단 수 (columns)**
- 1단: 수학·이미지 많은 과목 (가로폭 필요)
- 2단: 국어·사탐·과탐 (text 많고 단 균형)
- preset 토큰: `columns: 1 | 2`
- ✅ 이미 구현 (page-1col, page-2col)

**RULE P2 — 묶음 배치 (passage + questions)**
- 지문이 먼저 흘러간 후 묶음 안 문제들이 이어짐
- 지문 끝에 출처/낱말 라인 (`passage-source`, `passage-glossary`)
- 한 묶음의 모든 문제가 같은 페이지에 있을 필요는 없음
- ✅ 부분 구현 (v22 group-by-passage)

**RULE P3 — 박스 column 분배**
- 자동 sequential fill (좌단 가득 후 우단)
- 박스(특히 boki 박스 포함 question)은 column 경계 넘지 않음
- ✅ 부분 구현 (set page columns + boki breakable: false)

**RULE P4 — 긴 문제 분할** (미정의 — 내일 디자인 검토)
- 한 문제가 한 column보다 길면 분할 가능
- 어디에서 자를지: stem 다음 / 선지 사이 / 박스 후 / 임의
- IDML reference 보고 결정 (디자이너 의도 발견)

**RULE P5 — 헤더/푸터** (master-pages-a4 부분 구현)
- 짝수 페이지: PART N + 페이지 번호 좌측
- 홀수 페이지: 제목 + 페이지 번호 우측
- 챕터 시작 페이지: 푸터 숨김 후보
- ✅ A4 master 부분 구현 (제목 · 과목 · 페이지번호)

**RULE P6 — 배경 decoration** (TODO — 내일)
- PART 라벨 외측 (큰 청색)
- 회색 색박스 (보기·테마 영역)
- 라인 (수평 구분선, 세로 단 구분)
- 이미지/표 placeholder

### 토큰 (현재값 + TODO)

```typst
// 현재 (design-tokens.typ)
page-1col, page-2col      ✅ columns/gutter/rule 토글
master-pages              ✅ 자동 추출 master
master-pages-a4           ✅ A4 변형

// 내일 추가
decorations.typ           TODO — IDML 배경 추출 결과
  rect-fills              색박스 배열 (color × bbox)
  lines                   라인 배열 (stroke × from/to)
  part-label              PART 외측 라벨 (text × position × style)
```

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

### 핵심 컨셉 — Preset = "한 묶음"

> **IDML 1개 = 1 preset = 학원선생이 고르는 단위.**

문제 스타일과 배경 스타일을 **분리하지 않는다**. 디자이너가 만든 한 묶음 안에 문제(L1) + 배경(L2)이 들어있고, 사용자는 한 번 클릭으로 통째 적용. Vellum 패턴 (Pier·Crimson 같은 서식이 폰트+마진+챕터 디자인 한 묶음).

```
preset (디자이너 1명의 1 묶음)
  ├─ L1 부분: paragraph-styles + design-tokens (문제 식자)
  └─ L2 부분: master-pages + decoration (배경·페이지)
```

### 이유

- IDML이 원래 한 묶음으로 설계됨. 분리하면 디자이너 의도 깨짐.
- 학원선생 입장 — "이 시험지처럼" 한 번 클릭이 쉬움. 조합 옵션 = 헷갈림.
- 추출 1번 = preset 1개 완성. 분리하면 추출 N×M번.

### 디렉토리 구조

```
/typst-templates/edu/presets/
   simply-classic/              ← preset 1 (IDML "심플리 고전소설")
      design-tokens.typ          토큰 (색·폰트·간격) — 사용자 override 가능
      paragraph-styles.typ       L1 문제 스타일 (IDML 자동 추출)
      master-pages.typ           L2 배경 스타일 (IDML 자동 추출, 신국판)
      master-pages-a4.typ        L2 배경 스타일 (A4 변형)
      colors.typ                 IDML 색 swatch
      main.typ                   L1+L2 식자 시퀀스
   gonggam-rates/               ← preset 2 (IDML "공감연구소 정답률")
      ...
   학원형-A/                    ← 앞으로 추가 (IDML 1개씩)
      ...
```

### Preset 추가 = IDML 1개 추출

새 디자인을 시스템에 넣는 흐름:
1. 디자이너의 IDML 받음 (또는 PDF로부터 reverse engineer)
2. `extract-idml-to-typst.py` 실행 → L1 부분 자동 추출
3. `extract-story-content.py` 실행 → 본문 분석
4. master spread 추출 → L2 배경 부분 (현재 R&D)
5. design-tokens.typ로 토큰 분리
6. 새 preset 디렉토리 완성

### Tokens — 사용자 override 가능

같은 preset 룰 위에 토큰만 바꿔 변형:
- 색 (accent): 청색 → 빨강 → 초록
- 폰트 (serif/sans): Source Han → Nanum → KoPub
- 간격 (space): 더 좁게 / 더 넓게
- 페이지 (columns): 1단/2단 토글

> 룰 자체는 STS 공통. preset은 IDML에서 추출한 룰의 값. Tokens는 그 위에 사용자가 추가 override.

### 학원선생 UI (구상)

```
[심플리 고전소설] [공감연구소 정답률] [학원형 A] [모의평가형] [모던]
   ↑ 한 번 클릭 = preset 통째 적용 (문제 + 배경)

미세 조정 (선택):
  ┌─ 색 ─────────┐ ┌─ 폰트 ─────┐
  │ ● ● ● ●     │ │ Pretendard │ ← 토큰 override
  └─────────────┘ └────────────┘
```

### 콘텐츠 입력 형식 (2026-05-22 결정)

학원선생이 콘텐츠를 넣는 방법은 **(B) + (C) 둘 다 지원**.

**(B) 챕터별 분리** — 책 안에 챕터/회차/PART가 있는 경우
- 챕터마다 HWP 파일 1개 업로드 (또는 폼 직접 입력)
- 챕터 라벨(`PART 1` / `1회` / `단원 1`) + 부제(`프롤로그` 등)는 **폼에서 직접 입력**
- HWP 안에 챕터 표시가 있어도 무시 (라벨은 항상 폼이 권위)

**(C) 단일 책** — 모의고사 1회·단원 1개짜리
- HWP 1개 통째 업로드. 챕터 개념 없음
- 간지(챕터 표지) 안 박힘. 본문만 흐름

**(A) HWP 1개 통째 + 자동 챕터 분리** — ❌ 보류
- 휴리스틱 잘못 잡히면 책 망함. 학원선생 디버깅 못함
- Phase Ⅴ 베타 사용자 의견 받고 결정

### 콘텐츠 JSON 스키마 (chapters 필드 — TODO 도입)

```jsonc
{
  "meta":  { "title": "...", "author": "...", "subject": "...", "watermark": "..." },
  "preset": "simply-classic",
  "options": { "size": "A4" },     // preset이 지원하는 범위
  "chapters": [
    { "type": "part-cover", "label": "PART 1", "subtitle": "프롤로그" },
    { "type": "passages",   "passages": [...], "questions": [...] },
    { "type": "part-cover", "label": "PART 2", "subtitle": "본격" },
    { "type": "passages",   "passages": [...], "questions": [...] },
    { "type": "answer-key", "answers": [...] }
  ]
}
```

단일 책(C)는 chapters 1개만:
```jsonc
{ "chapters": [{ "type": "passages", "passages": [...], "questions": [...] }] }
```

### preset 안 chapter type → master 매핑 (도입 예정)

각 preset이 자기 매핑 보유. 다른 preset이 같은 chapter type을 다른 master로 그림.

```typst
// simply-classic/main.typ 안
#let chapter-type-to-master = (
  "part-cover": master_1_파트1,
  "passages":   master_2_파트2_같이하기,
  "answer-key": master_5_빠른정답,
  "toc":        master_목차,     // 추출 추가 필요
  "front":      master_속표지,   // 추출 추가 필요
)
```

→ 콘텐츠 JSON은 preset 무관. preset이 type → master 결정.

## 7. IDML 흡수 R&D

IDML 원본을 STS preset으로 매핑하는 과정:
1. **Style 추출** — paragraph-styles.typ 자동 생성 (✅ simply-classic)
2. **Master 뼈대 추출** — master-pages.typ 자동 생성 (✅ simply-classic)
3. **Story 콘텐츠 추출** — 본문 텍스트 → JSON (✅ extract-story-content.py)
4. **Spread 페이지 매핑** — 페이지별 frame 위치 (미완)
5. **배경 깊이 추출** — Spread XML의 자유 frame, 색박스, 라인, decorations (내일)

### 추출 우선순위 (Phase Ⅳ — 차별화)

5번 (배경 깊이 추출)이 진짜 차별화. 같은 콘텐츠가 더 다양한 책 모양 → preset N개 늘림 → 학원선생 선택 폭.

## 8. 비전 — 학원계 Vellum

### 5 Phase 로드맵

| Phase | 무엇 | 가치 |
|--|--|--|
| **Ⅰ** | MVP 흐름 (HWP 업로드 → simply-classic → PDF) | 학원선생 1명이 끝까지 사용 가능 |
| **Ⅱ** | 문제 스타일 N개 (preset 5개) | 사용자가 골라봄 |
| **Ⅲ** | 베타 출시 + 학원 커뮤니티 피드백 | 진짜 사용자 의견 |
| **Ⅳ** | 조판/배경 R&D (IDML 깊이 추출) | 차별화 |
| **Ⅴ** | Vellum-like 부가 (쪽번호·메타·챕터 누적·회원 저장) | 한 권 완성 도구 |

### 진행 원칙

> "한 흐름이 끝까지 동작" 우선. 그 다음 늘림.

지금 위치: Ⅰ 진행 중 (Edu100 진입 화면 ✅, 작업 화면 simply-classic 통합은 Ⅱ에서).

내일: Phase Ⅳ의 첫 한 발 = IDML 배경 추출.
