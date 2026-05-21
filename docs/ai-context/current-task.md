# 현재 작업 상태

> 마지막 업데이트: 2026-05-21 KST 밤 (Story XML → JSON + 첫 시각 diff 95.8%)
> 단계: **교재 트랙 — IDML 흡수 R&D 진행 중**
> 작업 브랜치: `main` 단일

## 이어서 하자 트리거 — 다음 세션 첫 보고

### 진행 위치 (직전 한 발: simply-classic 시각 정합도 한계점 도달)

**측정 metric 2종으로 진짜 격차 노출**
- pixel similarity 95.0% (한계 — metric이 글자 위치 어긋남에 둔감)
- **SSIM 72.4%** — 사람 눈 분간 가까운 metric. 진짜 격차는 28%p.
- visual-diff.py에 scikit-image SSIM 자동 적용.

**한 페이지 직접 입력 baseline 박힘 (data.json = p13 콘텐츠)**
- simply-classic main.typ에 `boki`/`source`/`glossary` 추가 (페이지 부속 박스).
- 페이지 전체를 `columns(2)`로 wrap — passage + Q1·2·3 자동 balance 분배.
- 좌단 (passage + 출처 + 낱말 + Q1) + 우단 (Q2 + Q3 + <보기> 회색박스) 원본과 거의 같은 레이아웃.
- 폰트 Noto Serif KR → Batang fallback (Windows 한국어 명조).

**격차 솔직 진단 (눈으로 본)**
- 본문 wrap 줄당 글자 수 미세 차 — 폰트(Batang vs Sandoll 명조Neo) + 자간.
- 글자 위치 미세 어긋남 (1~5pt 단위).
- 푸터 페이지 번호 다름 (우리 p1 vs 원본 p13).
- 2단 사이 세로선 미적용.

**100% 시각 일치 가능성**
- IDML→typst 자동 흡수만으로는 SSIM 95%+ 매우 어려움.
- 필요 조건: (1) Sandoll 명조Neo 정확 매칭 (Source Han Serif가 최선 대안) (2) Spread XML 페이지 매핑 자동화 (3) 자간·줄간격 미세 fine-tuning.

**Story XML → JSON 추출기 박힘** — `experiments/idml-recon/extract-story-content.py`
- 720 Story 순회. ParagraphStyleRange 시퀀스 → (style, text) flat.
- 스타일 leaf 매칭 (`문제와선지:문제` ≠ choice): 번호/문제/선지/지문/물음/보기/출처 분류.
- 상태 기계로 정규화 → `{passages, questions}` 우리 평가원 스키마.
- 결과: passages 31, questions 119 (1~59 번호. 같이하기+혼자하기 두 번씩).

**같은 콘텐츠 시각 diff 첫 컷**
- subset(passage p1 + Q1~4) → simply-classic main.typ → 37쪽 PDF.
- 우리 p36 vs 원본 p13 (둘 다 1번 문제 있는 페이지) 비교.
- **similarity 95.8%** (이전 89.7% 다른 콘텐츠 → +6.1%p).
- diff PNG: 같은 텍스트가 다른 위치 — 단락→페이지 분할이 안 맞아 통째 어긋남. 식자 자체는 비슷.

### 다음 한 발 후보

**(β) 페이지 매핑** — 진짜 정확도 측정하려면 같은 콘텐츠가 같은 페이지에 박혀야.
1. Story 순서를 Spreads/*.xml에서 페이지 위치로 정렬 (지금은 첫 number 기준).
2. 한 IDML 페이지 = 어떤 Story들 = 어떤 문제 set → 그 set만 한 페이지에 식자.
3. 페이지별 diff → 각 페이지 점수 평균.

**(γ) passage body 정확화** — 첫 passage에 66KB 텍스트 모이는 버그. passage_header 안 잡힌 채 본문이 시작되면 default p1로 흡수. story 정렬 + passage_header 검출 강화.

**(δ) 단순 첫 페이지 시뮬레이션** — IDML의 첫 본문 페이지(원본 p13)에 들어가는 콘텐츠만 우리 typst에 식자. set 단위 잘라 한 페이지에 박히게. 그 한 페이지 99% 도달이 첫 목표점.

### 검증된 파이프라인

```
.idml
  ↓ extract-idml-to-typst.py    (스타일/색/master)
  ↓ extract-story-content.py    (Story → content.json)
data.json
  ↓ typst compile simply-classic/main.typ
output/simply-classic-ours.pdf
  ↓ PyMuPDF render PNG
output/ours-q1.png
  ↓ visual-diff.py vs reference-q1.png
similarity 95.8%
```

### 진행 위치 (직전 직전 commit: `cd9821c`)

**토대 layer 박힘**
- `typst-templates/edu/design-system/`
  - `paragraph-style.typ` — apply-para-style(spec, body)
  - `master-page.typ` — master-spec dict + footer/세로 라벨 헬퍼
  - `typography.typ` — **한국어 책 조판 표준 atoms** (출처 6개 자료 인용)
    - line-height 1.3/1.5/1.65/1.8 ratio
    - tracking -0.030em (본문) / -0.050em (제목)
    - size 8/9/10/11/13/18/28pt
    - margin ratio (Van de Graaf canon)
    - 본문 폭 한국어 28~50자
    - ink-body #222 (완전 검정 아님)
    - validate(spec) — 범위 밖 경고

**프리셋 (2개)**
- `presets/gonggam-rates/` — 공감연구소 정답률 페이지. 손 박음.
- `presets/simply-classic/` — 심플리 고전소설. IDML 자동 추출 + master-pages.typ 자동 생성.

**IDML → typst 추출기 (experiments/idml-recon/)**
- `extract-idml-to-typst.py` — paragraph style 59 + character style 56 + 색 견본 11 + master spread frame 24
- 보정 룰: CMYK→RGB (Japan Color 2001 LUT, 시안 100%→#0091db), 폰트 매핑 (Sandoll→Pretendard 우선), FontStyle→weight, 1/1000em→em
- BasedOn 상속 (resolve_inheritance) — 부모 dict + 자식 override
- master spread frame 좌표 분류 (classify_frame_position — left/right + top/middle/bottom + outer/inner/body)
- master-pages.typ 자동 생성 (render_master_pages_typ)
- **validate_spec** — IDML 추출값을 typography 표준 범위와 비교. simply-classic 118 styles 중 2건만 위반.
- **visual-diff.py** — PIL+numpy 픽셀 diff (mean / changed ratio / similarity), 옵션 SSIM
  - 첫 비교: 원본 PDF p9 vs 우리 edu-p2 → 유사도 **89.7%** (콘텐츠 다르니 제한적)

**web 통합**
- `/` (HomeSelect) → 단행본 / 교재 분기 카드
- `/book` → 단행본 onboarding
- `/edu` → 교재. preset dispatch + 더미 정답률 + 미리보기 max-w 760px

### typography 표준 (검증된 자료)

| 항목 | 표준값 | 출처 |
|---|---|---|
| 줄당 글자 수 | 한국어 30~45자 | Bringhurst, Butterick, Tinker(1963) |
| line-height ratio | 한국어 1.5~1.7 | Bringhurst, Material Design, Apple HIG |
| 자간 tracking | 한국어 본문 -0.03~-0.05em | 산돌·BG 폰트 가이드, KS X 1026 |
| 마진 비율 (안:밖:위:아래) | 1:2:1:2 (Van de Graaf) | Bringhurst |
| 금칙 처리 | KS X 1026 | 한국 산업 규격 |
| 본문 색 | #222~#333 (회색 톤) | 인쇄·웹 표준 |
| 폰트 페어링 | 명조 본문 + 산스 제목 | 출판 관례 |

검증된 자료: practicaltypography.com, Bringhurst 책, WCAG 2.1, 한국타이포그라피학회, Material Design Typography, Tailwind `@tailwindcss/typography`.

### 남은 작업

**(α) 원본 IDML Story → JSON 추출 + 같은 콘텐츠로 시각 diff** ← **진짜 검증 가능해지는 한 발**
- 지금 시각 diff 89.7%는 콘텐츠가 달라서 (고전소설 vs 시험지). 같은 콘텐츠로 비교해야 식자 정확도 측정 가능.

**#21 character style 자동 적용** — Story XML의 CharacterStyleRange → 인라인 강조(밑줄·볼드·기호) 적용. 우리 데이터엔 강조 마커 없어 효과 제한적.

**#22 Spread 자유 frame 추출** — 가장 큰 R&D. 개별 페이지의 [A]/[B] 박스, 자료 박스 같은 자유 배치 추출 + typst place() 매핑. 인디자인 자유 모델 vs typst 흐름 모델 매핑 룰 필요.

**미세 조정** — 줄 사이 간격(leading 미세값), 단어 간격, 단락 간격 등 사용자가 시각 보면서 최소~최대 박기.

### 이번 세션 핵심 결정

- **R&D Phase 0 (토대)** — typography 표준이 IDML 추출 정확도의 검증 기준. 우리가 새로 발명 X, 검증된 자료 인용.
- **시각 diff 도구가 진짜 검증 지표** — 객관 룰 통과 + 시각 점수 0.97+면 사람 분간 X.
- **누적 정확도의 수학** — 디자인 N개 변환할수록 보정 룰 사전 ↑ → 자동 정확도 95%+ 도달 가능.
- **폰트 라이센스** — Pretendard로 한국 무료 라이센스 우선. Sandoll류는 자동 매핑.

### 관련 memory

- `product_vision_textbook_vellum.md` — 교재용 Vellum 포지셔닝
- `product_vision_idml_intake.md` — IDML = 디자인 입력 채널
- `product_vision_rule_based.md` — AI 없는 결정론적 규칙
- `project_track_pivot_2026_05.md` — 단행본 동결 / 교재 우선

### 트리거 시 첫 한 발 권고

**(α) 원본 IDML Story → JSON 추출** — 같은 콘텐츠로 시각 diff 측정. 그게 진짜 R&D 정확도 검증.

## 한 줄 정체성

**한국어 출판물 자동 조판 도구 = 성진북스.** 한 사이트, 단행본 + 교재 두 모드.
단행본은 작가 입력 → PDF (Vellum 신뢰 + Reedsy 가격 + 부크크 출구).
교재는 평가원형 HWP → JSON → 시험지 PDF.

## 통합 상태 (2026-05-21 갱신)

- **main = 단일 통합 브랜치.**
- **단행본 트랙**: `web/`, `typst-templates/sinkukpan/`. Sprint 1~5 일부 진행 후 **동결 중**. 이유: 사용자가 "한글 복붙이 더 편할 수도" 의문 제기 → 교재 트랙 우선 전환 (`memory/hwp-import-insight.md`).
- **교재 트랙**: `experiments/edu-import/`, `typst-templates/edu/`. 5종목 HWP → JSON → PDF 자동 변환 100% 동작. 시험지 템플릿 v0.3 + variant 라이브러리 구조 박힘.
- **공통 코어**: `typst-templates/_core/sungjin-core.typ` 박힘. 폰트·색 토큰(쪽빛 #2a3a5a)·박스 헬퍼·한국어 설정·인라인 마커 처리.

## 2026-05-21 진행 (이 세션)

### 단행본 — 동결 직전 4가지 결정 박음 (사용자 확인 미완)

`typst-templates/sinkukpan/classic/template.typ` + 미러 + 미리보기 + 옵션 기본값:

1. **매터 vs 챕터 추적 분리** — `matter-pages` state 신설. 속표지/판권지/목차/서문은 항상 쪽번호 숨김.
2. **`hideChapterStartPageNumber` 기본값 true → false** — 챕터 시작 페이지에도 쪽번호 표시가 한국 단행본 통례.
3. **챕터 헤더 여백 늘림** — Typst 0.6em→1.2em, 0.4em→0.8em, 2em→2.6em. 미리보기도 동등 비율.
4. **본문↔쪽번호 시각 거리 확대** — 미리보기 쪽번호 위치를 paddingBottom 50% → 35% 지점.

→ 단행본 재개 시 첫 작업: 사용자가 위 4가지 결과를 브라우저에서 확인.

### 교재 — variant 라이브러리 골격 박음

**디렉토리 구조 (`typst-templates/edu/blocks/`)**:
```
multiple-choice/   객관식 — academy.typ (학원형: 번호 박스)
short-answer/      주관식 — academy.typ (placeholder, 향후 채움)
passage/           묶음    — sidebar-label.typ (사이드바 + 라벨박스)
layout/            배열    — two-col-rule.typ (2단+세로선), one-col.typ (1단)
```

**v0.3 template.typ는 디스패치만**: `meta.style` 4가지 키 읽어 variant dict에서 함수 꺼냄. 객관식/주관식은 `q.choices` 빈 케이스로 자동 판별.

**웹 `/edu` MVP 박힘** (`web/app/edu/page.tsx`):
- 좌측 종목 칩(국어만 활성, 나머지 준비 중)
- 가운데 SVG 미리보기 + 페이지 넘김
- 우하단 PDF 다운로드
- `compileTestPaperSvg/Pdf` 함수가 7개 typst 소스를 가상 FS에 박음
- 샘플 데이터: `web/public/dev/edu/korean.json` (raw 추출 결과, page.tsx에서 meta 덧입힘)

### 결정된 식자 위계 (식자 작업 진행 패턴)

```
Tier 0  atom        폰트·색·굵기·자간·줄간격
Tier 1  마크업       강조·마커·글리프(①②③, ㉠, 한자)
Tier 2  인라인 컴포   번호박스·[점수]·라벨
Tier 3  한 줄        보기·발문·라벨
Tier 4  블록 ◀ 지금  1객관식·1주관식·1묶음·1자료·1그림
Tier 5  페이지 영역   단·헤더·푸터·세로선·여백
Tier 6  책 전체      종목별 단수
```

**원칙**: Tier 4(블록)부터 결정 → 안에서 atom·마크업·인라인 부산물로 정해짐 → 결정 누적되면 패턴 발견 → 그제서야 토큰화. premature abstraction 금지.

## 다음 한 발 (내일 이어서)

### 교재 — Tier 4 블록 결정 누적 (가장 우선)

이미 임시 결정:
- ✅ 객관식 = academy (번호 박스)
- ✅ 묶음 = sidebar-label
- ✅ 배열 = two-col-rule

다음 결정 순서:
1. **주관식 식자** — 수학 단답형 데이터 확보 + 답 표기 방식
2. **묶음 variant 추가** — boxed(박스 둘러침) / numbered(좌측 큰 숫자) 등
3. **자료 박스** — `<보기>` ㄱㄴㄷㄹ, 표, 그림 placeholder 식자
4. **인라인 그림 + 캡션** — `⟨IMG:path⟩` 마커가 자료에 들어갈 때 정렬·캡션·크기
5. **여러 문제 배치** — 단 안에서 결속(breakable: false), 묶음+첫 문항 결속, 단 균형
6. **메인 색상** — 위 5가지 결정 누적된 시각 보고 마지막에 확정

### 교재 — 인프라

- **웹 UI에 variant 선택기 추가** — `/edu` 좌측에 4개 드롭다운 (객관식/주관식/묶음/배열). 즉시 미리보기 갱신
- **다른 종목 데이터 web에 배치** — 영어/수학/사탐/과탐 JSON을 `web/public/dev/edu/`로 복사 + 종목 칩 활성화
- **종목별 자동 단 수 분기** — 수학 = `one-col`, 나머지 = `two-col-rule` 디폴트 매핑

### 단행본 — 동결 해제 시점

- 사용자가 단행본 4가지 변경(매터/챕터 쪽번호·헤더 여백) 직접 확인
- 한글(HWP) 임포트 트랙 검토 — 교재 파이프라인의 단행본 확장 (`memory/hwp-import-insight.md`)

## 운영 메모

- 새 variant 추가 패턴: `typst-templates/edu/blocks/{category}/{variant}.typ` + v0.3 template의 dict에 등록 + (선택) 웹 UI 드롭다운 항목 추가
- variant 파일은 `#import "/typst-templates/_core/sungjin-core.typ": *`로 시작, 같은 함수 signature 유지 (`render-question(q)` / `render-passage(p)` / layout은 `column-rule` + `wrap-columns(body)`)
- `node web/scripts/copy-typst-templates.mjs`로 web/public 미러 동기화 (typst 템플릿 수정 시 매번)
- 컴파일 검증: CLI(`experiments/edu-import/scripts/render-json-to-typst.py`)와 web 둘 다 동작해야 정상

## 교재 트랙 어디까지 (이 창 작업 영역)

- 평가원 5종목(국어/영어/수학/사탐/과탐) HWP → 동일 JSON 스키마(edu-import/v0) → Typst PDF
- 한컴 수식 매크로 코드 → Typst 수식 변환기 100% 컴파일 통과 (수학 522 + 과탐 444)
- ShapePicture(이미지) → BinData PNG 자동 매핑 + Typst image() 인라인
- 사탐 20/20, 과탐 20/20, 국어 55/56, 영어 44/45, 수학 33+단답형 13 보기 완전
- 시험지 템플릿 v0.3 첫 컷 박힘 (`typst-templates/edu/test-paper/v0.3/`)
- **다음 한 발**: v0.3 디자인 다듬기 → EBS/사설 HWP 검증 → 사이트 `/edu` 라우트 → 베타 출시

## 정찰 결과 (2026-05-19)

4팀 병렬 정찰 끝. 종합 보고서: `docs/research/2026-05-typst-recon-summary.md`

핵심 결정 5개(`decisions.md` D-016~D-020):
- D-016: 미리보기 엔진을 `typst.ts`로 통일. 트랙 A·B 단일 엔진.
- D-017: 한국어 룰은 본진 패치가 아니라 `sungjin-book-classic` 패키지로 분리.
- D-018: KLREQ MVP 7룰(G1/G2/J1/I1/S1/C1/P1) 채택.
- D-019: 첫 로딩 = SSR 사전 렌더 + Lazy 컴파일러 + Service Worker.
- D-020: 포지셔닝 = Vellum 신뢰 + Reedsy 가격 + 부크크 출구.

## 100일 작전 보드

> 매일 1%씩 인디자인에 가까워진다. 한국어 단행본 본문 조판 한정.

### Sprint 1 (D1~D20) — Typst 살리기 ✅ (D1~D7 7일 만에 완주)

- [x] S1-1. typst.ts 설치, 빈 페이지 SVG 렌더 PoC — `/dev/typst` 샌드박스
- [x] S1-2. Next.js 14 + WASM 통합 — public/wasm self-host + postinstall 자동 복사 (Vercel 호환)
- [x] S1-3. Noto Serif CJK KR 슬림 서브셋 빌드 스크립트(`web/scripts/build-fonts.mjs`). **결과 6.1MB** (목표 0.5MB는 woff2 미지원으로 달성 불가, SW 캐싱(D-019)으로 보완 예정). 산스 KR과 "표준" 2단계는 보류.
- [x] S1-4. `web/lib/typst/compiler.ts` — typst.ts 얇은 추상화. globalThis 캐시 + warmup으로 dev HMR/race condition 해결.
- [x] S1-5. 신국판 Classic 템플릿이 typst.ts에서 컴파일되는지 검증 — Playwright 캡처로 한국어 양끝정렬·들여쓰기·챕터 식자 정상 확인.

**완료 기준 충족**: 브라우저에서 "안녕하세요"가 노토 세리프로 SVG 렌더됨 (캐시 후 14~21ms). 신국판 Classic 1챕터 + 2단락도 OK. 서버 PDF vs SVG 일치는 Sprint 4에서 검증.

### Sprint 2 (D21~D45) — 한국어 패키지 v0.1

- [ ] S2-1. `lib/typst/buildSource.ts` — bookData → .typ 문자열 변환 (속표지/판권지/목차/챕터/뒷부분)
- [ ] S2-2. `typst-templates/packages/sungjin-book-classic/v0.1.0/` — Typst 패키지 골격
- [ ] S2-3. KLREQ **G1 줄 처음 금칙** — 닫는괄호·구두점·줄임표 11종 전처리
- [ ] S2-4. KLREQ **G2 줄 끝 금칙** — 여는괄호 9종 전처리
- [ ] S2-5. KLREQ **J1 양끝 정렬** — `par.justify` + `justification-limits` 적용·실측
- [ ] S2-6. KLREQ **I1 들여쓰기 정책 c** — 장 첫단락 0, 둘째부터 1em
- [ ] S2-7. KLREQ **S1 한영 자간 1/4각** — 정규식 전처리 또는 Typst CJK-Latin 자간
- [ ] S2-8. KLREQ **C1 장 시작 홀수 페이지** — 빈 페이지 삽입 + 시작 쪽 쪽번호 미표시
- [ ] S2-9. KLREQ **P1 쪽번호 하단 바깥쪽 9pt** — 홀짝 미러링

**완료 기준**: MVP 7룰이 신국판 Classic PDF에서 모두 동작. 한국어 출판인 1명에게 PDF 보여주고 "어색한 데 없음" 확인.

### Sprint 3 (D46~D70) — 미리보기 교체

- [ ] S3-1. `TypstPreview` 컴포넌트 — bookData → typst.ts 컴파일 → SVG 페이지 배열
- [ ] S3-2. SSR 사전 렌더 — 첫 진입 시 서버에서 미리 만든 SVG 즉시 표시
- [ ] S3-3. Lazy 컴파일러 — 사용자 첫 편집 시점에 WASM 로드
- [ ] S3-4. Service Worker — WASM + 폰트 캐시 (2회차부터 즉시 로드)
- [ ] S3-5. 디바운스 + 컴파일 상태 표시 (로딩/에러)
- [ ] S3-6. 환경변수 플래그 `NEXT_PUBLIC_PREVIEW_ENGINE` — 폴백용
- [ ] S3-7. 기존 React 미리보기(`PreviewPanel`, `useBookPagination`, `paginateParagraphs`, `usePreviewLayout`)는 폴백 보존

**완료 기준**: `/editor`에서 입력하면 1초 이내 SVG 갱신. 모바일 LTE 첫 로딩 8초 이내, 재방문 2초 이내. 컴파일 에러 시 폴백 자동 발동.

### Sprint 4 (D71~D90) — 서버 PDF + 부크크 출구

- [ ] S4-1. `/api/render` — 같은 buildSource로 .typ 만들고 Typst CLI(또는 typst.ts node) 실행 → PDF 응답
- [ ] S4-2. 다운로드 버튼 — 미리보기와 동일한 PDF 다운로드
- [ ] S4-3. 부크크 입고 프리셋 — 표지/내지 분리, 300dpi, PDF/X 호환 검증
- [ ] S4-4. 교보 POD 입고 프리셋
- [ ] S4-5. WYSIWYG 검증 자동화 — SVG와 PDF의 페이지 수·첫줄·끝줄 일치 테스트

**완료 기준**: 작가가 "다운로드 → 부크크 업로드 → 입고 통과"까지 한 번에 성공.

### Sprint 5 (D91~D100) — 정리 + 출시 준비

- [ ] S5-1. 트랙 B 폴백 코드 정리(폴백 발동 없음 확인 후 일괄 삭제)
- [ ] S5-2. `sungjin-book-classic` Universe publish 준비
- [ ] S5-3. `Lang::KOREAN` CJK 세그멘터 라우팅 issue 본진에 제안
- [ ] S5-4. 한국어 출판인 베타 테스터 3명 검수
- [ ] S5-5. 랜딩 페이지 카피 (D-020 포지셔닝 기반)
- [ ] S5-6. 첫 100명 모집 캠페인 (브런치/티스토리 자가출판 커뮤니티)

**완료 기준**: 베타 출시. "이거 인디자인으로 한 거 아니야?" 반응이 베타 사용자 절반 이상에서 나옴.

## D1~D14 회고 (2026-05-19~20, 12커밋)

### 통과한 큰 도달점
- **Sprint 1 ✅** — typst.ts 브라우저 컴파일 + 노토 세리프 + 신국판 Classic 컴파일 (D1~D5).
- **Sprint 2 ◐** — S2-1 buildSource·compileBookSvg 파이프라인 완성. KLREQ 룰 중 J1·I1·C1·P1·S1은 template.typ + Typst lang:"ko"로 자연 충족. G1·G2 (줄 처음/끝 금칙)는 Typst 기본 동작에 일임, 정밀화는 베타 후일.
- **Sprint 3 ◐** — `/editor`에 TypstPreviewPanel 박힘. 본문 수정 즉시 갱신(300ms 디바운스), 챕터 클릭 자동 스크롤, matter blocks(속표지·판권지·목차·저자소개) 처리, React 폴백 안전.
- **Sprint 4 ◐** — S4-1 'PDF 생성' 버튼 → 브라우저 직접 typst 컴파일 → Blob 다운로드. 9페이지 신국판 단행본 PDF 1클릭. Vercel/서버 API 의존 없음.
- **Sprint 5 일부** — D-021 액센트 색 = 쪽빛 #2a3a5a. Vellum 회색 3단계 배경 + 보더 제거 EditorLayout 적용.

### 검증된 시나리오 (Playwright)
- 챕터 클릭 → 미리보기 자동 스크롤 ✅
- 본문 수정 → typst 디바운스 9~25ms 재컴파일 ✅
- 속표지·판권지·목차 클릭 → 해당 페이지로 점프 ✅
- 한국어 chapterNum "제3장" → 숫자 추출 ✅
- env=react 토글 → 옛 미리보기 폴백 ✅
- PDF 다운로드 → 부크크 입고 가능한 형태 ✅

### 새 발견 (memory 가치)
- typst.ts 0.6 **woff2 미지원** → 폰트 6MB
- typst.ts `getCompiler()` 첫 호출 race → init promise에 warmup svg 박아 회피
- dev HMR 모듈 reset → init 캐시는 globalThis에
- typst SVG = 한 덩이 multi-page, `g.typst-page` 직접 자식이 페이지 단위
- **KLREQ G3 어절 단위 줄바꿈** = `box()` 트릭으로 해결됨. paragraph 처리 시 어절 단위 split + box() 묶기. trade-off: 양끝 정렬 공백 살짝 늘어남.
- 산스 KR Regular + Bold 추가됨 (챕터 식자 또렷)

## 다음 단계 (베타 출시 전)

### 빠른 (1~2일)
- 부크크 입고 표준 검증 — PDF/X·300dpi 호환 (다운로드 PDF를 부크크에 실제 업로드)
- 산스 KR 폰트 추가 (현재 세리프로 fallback)
- /editor 진입 시 default 활성 블록을 첫 챕터로 (현재 속표지 자동 선택)

### 중간 (3~5일)
- Service Worker — WASM 22MB + 폰트 6MB 캐싱 (두 번째 방문 즉시 로드)
- SSR 사전 렌더 — 빈 미리보기 SVG 즉시 표시
- 더 많은 Vellum 토큰 적용 (Header·StatusBar·ChapterForm)

### 베타 출시 준비
- 부크크 입고 표준 검증 (PDF/X·300dpi)
- 한국어 출판인 1명 PDF 검수
- 랜딩 페이지 카피 ("판형 하나만 고르세요. 나머지는 자동입니다.")

## 진행 지표 (매일 측정)

- WYSIWYG 일치도: 화면 SVG vs 서버 PDF 페이지 수·줄 일치 %
- 첫 로딩(모바일 LTE): 첫 SVG 표시까지 ms
- 컴파일 시간(중간): 텍스트 1자 입력 → SVG 갱신 ms
- KLREQ MVP 7룰 충족: N/7
- 폰트 크기(전송): 압축 후 KB

## 동결된 작업

100일 작전 중 보류:
- 6번 앞부분 로마 숫자 → Sprint 2에서 흡수
- 7번 판권지 필드 구조화 → Sprint 2에서 buildSource에 흡수
- 8번 실제 글자폭 줄바꿈 → Typst가 해결
- 9번 홀짝 쪽번호 → Sprint 2 P1으로 흡수
- 10번 PDF 출력 → Sprint 4로 흡수

## 운영 원칙

- 매일 1% 진전. 아주 작아도 좋음. 0보다 낫다.
- 정찰 보고서는 `docs/research/`에 보존, 재참조 가능하게.
- 결정은 `decisions.md`에 박아 다시 안 흔들리게.
- LLM은 조판 경로에 0회 호출(D-002).
- 폰트/자간/여백 사용자 노출 금지(D-004).

## 주의

- Typst 본진은 fork하지 않고 본진 + 우리 패키지 조합 (D-017).
- 큰 PR은 issue로 사전 합의(메인테이너 1인 게이트 학습).
- 모바일 첫 로딩이 가장 큰 위험 — SSR + Lazy + SW 셋 다 필요(D-019).
