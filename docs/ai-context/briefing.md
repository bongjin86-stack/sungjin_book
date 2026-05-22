# 성진북스 — 5분 브리핑

> 처음 들어온 사람(또는 AI)이 이 한 페이지만 읽고 현재 위치·결정 사항·다음 한 발을 파악할 수 있게 박은 문서.
> 마지막 갱신: 2026-05-22 KST 오전.

## 1. 한 줄 — 뭐 만드는 프로젝트인가

> **학원선생이 시험지 한 권 자동 식자해주는 SaaS.** 한국어 출판물용. 디자인은 디자이너가 만든 IDML에서 자동 흡수, 콘텐츠는 학원선생이 HWP 또는 폼으로 입력. AI 없음. 결정론적 식자.

## 2. 두 트랙

| 트랙 | 상태 | 비고 |
|---|---|---|
| **단행본** (작가용) | 🟡 동결 중 | Vellum/Reedsy 대체. 한글 복붙 대비 매리트 약함으로 후순위 |
| **교재** (학원선생용) | 🟢 선순위 | 시험지 자동 조판. 5종목 HWP → JSON 변환기 100% 동작 |

→ **지금 교재 트랙에 집중.** 단행본은 부품(typst.ts·typst-templates) 공유.

## 3. 핵심 컨셉 (절대 흔들리지 말 것)

### 3-1. preset = "한 묶음"

> **IDML 1개 = 1 preset = 학원선생 카드 1장.**

- 디자이너가 인디자인으로 만든 한 묶음(문제 식자 + 배경 + 간지 + 페이지 번호 + 목차)을 그대로 추출
- 학원선생은 카드 1번 클릭으로 통째 적용 (Vellum 패턴)
- 분리 안 함 — 분리하면 디자이너 의도 깨지고 사용자 헷갈림

### 3-2. 콘텐츠 ↔ 디자인 완전 분리

- 콘텐츠 JSON은 preset 무관 (어떤 preset에서도 같은 콘텐츠 식자 가능)
- 같은 콘텐츠를 다른 preset에 흘리면 다른 책 모양

### 3-3. AI 0회 호출

- 식자는 결정론적 룰만 사용 (typst + 자동 추출된 스타일)
- LLM API 안 씀 (D-002)
- 폰트·자간·여백 사용자 노출 금지 (D-004)

## 4. 5 Phase 로드맵

| Phase | 무엇 | 상태 |
|---|---|---|
| **Ⅰ** | MVP 흐름 (HWP 올려 PDF 받기 한 흐름) | 🟡 부품 박힘, 끝 연결 안 됨 |
| Ⅱ | preset 5개 (카드 골라 모양 바꿈) | 미시작 |
| Ⅲ | 베타 출시 (학원 커뮤니티 피드백) | 미시작 |
| **Ⅳ** | IDML 깊이 추출 (배경·간지·decoration) | 🟢 첫 한 발 박힘 (오늘) |
| Ⅴ | Vellum-like 부가 (회원·인쇄 연동) | 미시작 |

## 5. 박혀있는 부품 (Phase Ⅰ 가까이)

| 부품 | 위치 | 상태 |
|---|---|---|
| HWP → JSON 변환기 (5종목) | `experiments/edu-import/` (Python) | ✅ 완성, ❌ 웹 미연결 |
| 시험지 typst 템플릿 v0.3 | `typst-templates/edu/test-paper/v0.3/` | ✅ 박힘 |
| simply-classic preset (L1 문제 식자 v27) | `typst-templates/edu/presets/simply-classic/` | ✅ 박힘 |
| simply-classic preset (L2 배경 자동 추출) | 같은 디렉토리 `decorations.typ` | ✅ 오늘 박힘 |
| typst.ts 브라우저 컴파일러 | `web/lib/typst/` | ✅ Sprint 1 박힘 |
| Edu100 진입 화면 (제목/저자/과목/A4) | `web/app/edu/`, `web/components/onboarding/EduSetupScreen.tsx` | ✅ 박힘 |
| 챕터 입력 / HWP 업로드 / PDF 다운 | — | ❌ 없음 |
| 콘텐츠 JSON chapters 스키마 | — | ❌ **오늘 결정 박힘, 구현 X** |

→ **끝 연결**(학원선생 클릭 → PDF) 위해 4개 박아야:
1. **콘텐츠 JSON 스키마 chapters 필드** ◀ 지금 진행 중
2. EduSetupScreen 챕터 추가 UI
3. HWP→JSON 변환기 웹 연결
4. main.typ chapter type 분기 로직

## 6. 오늘 박힌 것 (2026-05-22 오전)

### Phase Ⅳ 첫 한 발 — IDML 배경 자동 추출

3개 추출기 박힘 (`experiments/idml-recon/`):
- `scout-spreads.py` — 59 spread 한눈 정찰 표
- `inspect-spread.py` — 한 spread의 모든 frame 좌표·색·텍스트 dump
- `extract-decorations.py` — Spread XML → typst `decorations.typ` 자동 생성

결과:
- 59 spreads → 115 페이지 → 3729 frames 추출
- `typst-templates/edu/presets/simply-classic/decorations.typ` 생성 (3964줄)
- main.typ에 `set page(background: page-decorations.at(str(pn)))` 통합
- **시각 diff**: standalone 95.8% / 통합(본문+배경) 95.2% ✅

기술 발견 (메모할 가치):
- Spread element 자체에 `ItemTransform`의 큰 y offset 존재 — 좌표 누적 시 반영 필요
- typst dict 값은 `[ ]` content block 사용 (코드블록 `{ }` 아님, join 안 됨)
- typst CMYK→RGB는 Japan Color 2001 LUT 근사 (#00ffff → #0091db 시안)

### 컨셉/공정 결정 박힘 (사용자 합의)

| 결정 | |
|---|---|
| preset = L1+L2+master 한 묶음. 분리 X | ✅ |
| 간지·목차도 preset 안에 고정 (사용자 옵션 아님) | ✅ |
| 학원선생 입력 = (B) 챕터별 HWP 업로드 + (C) 단일 책. (A) 자동 분리 ❌ | ✅ |
| 챕터 라벨·부제는 항상 폼이 권위 (HWP 안에 있어도 무시) | ✅ |
| 콘텐츠 JSON에 chapters 필드 도입 | ✅ 컨셉 박힘, 구현 진행 중 |

### 콘텐츠 JSON 스키마 (확정 — 구현은 진행 중)

```jsonc
{
  "meta":     { "title": "...", "author": "...", "subject": "...", "watermark": "..." },
  "preset":   "simply-classic",
  "options":  { "size": "A4" },
  "chapters": [
    { "type": "part-cover", "label": "PART 1", "subtitle": "프롤로그" },
    { "type": "passages",   "passages": [...], "questions": [...] },
    { "type": "answer-key", "answers": [...] }
  ]
}
```

규약:
- chapter type 최소 3개: `part-cover` / `passages` / `answer-key`
- 단일 책도 chapters 1개로 표현 (일관성)
- passages·questions는 flat + passage_id 연결 (기존 구조)
- meta 최소 4개: title / author / subject / watermark

### 갱신된 문서

- `typst-templates/edu/design-system/STS-SPEC.md` — 입력 형식 정책 + chapters 스키마 + preset chapter-type → master 매핑 컨셉
- `docs/ai-context/current-task.md` — Phase Ⅳ 결실 + 다음 한 발 4개 후보
- 메모리: `product_input_format.md` (입력 형식 결정) · `feedback_decision_review.md` (결정 전 대안 비교 원칙)

## 7. 지금 결정해야 할 것

### 결정 ①: 콘텐츠 JSON 스키마 정의 방법

**(가) TypeScript interface + JSON 샘플** — 단순, 빌드 추가 없음
**(나) JSON Schema (.json) + 컴파일러로 타입 생성** — 표준이지만 빌드 단계 추가
**(다) Zod 스키마** — 한 정의로 타입 + 런타임 검증 (HWP 변환 결과 / 폼 입력 / typst 입력 모두 검증 가능)

**추천: (다) Zod**
- 우리 흐름이 "HWP → JSON → typst"인데 중간 검증이 자주 필요
- Next.js + TypeScript 프로젝트에서 흔히 씀
- 한 번 박으면 폼 검증·API 검증·변환 검증 다 거기서 나옴

### 결정 ②: 박는 위치

- `web/lib/types/edu-book.ts` 또는 `web/lib/schema/edu-book.ts`
- 또는 `packages/edu-schema/` 분리 (Python 변환기도 참조 가능)

→ Python 변환기와 공유는 나중 결정. 일단 `web/lib/schema/edu-book.ts`.

## 8. 결정 박히면 박을 4가지 (Phase Ⅰ 끝 연결)

| 순서 | 박을 것 | 의존 |
|---|---|---|
| 1 | **콘텐츠 JSON Zod 스키마** + 샘플 JSON 2개 (단일 책 / 챕터 책) | 없음 |
| 2 | main.typ chapter type 분기 로직 (`chapter-type-to-master` dict + for문) | 1 |
| 3 | EduSetupScreen 챕터 추가 UI (동적 폼 + 단일 책 토글) | 1 |
| 4 | HWP → JSON 변환기 웹 연결 (Python 서버 vs Node 재구현 vs WASM — 별도 결정) | 1, 3 |

→ 1 박히면 2·3 병렬 가능. 4는 별도 큰 결정 1개 박혀야 (Python 변환기를 어떻게 웹에 가져올지).

## 9. 운영 원칙 (오늘 박힘)

> 매 결정 박기 전 대안 2~3개 펴서 비교. 단순 통보 X. 사용자 동의 받고 박는다.

이유: 한 번 박힌 결정은 되돌리기 비싸다. 결정 시점 30초 비교가 나중 30시간 리팩터링을 막는다.

## 10. 어디 보면 더 잡히나

- `docs/ai-context/current-task.md` — 진행 위치 자세히
- `typst-templates/edu/design-system/STS-SPEC.md` — STS 시스템 전체 컨셉 (4 Layer + preset + 입력 형식)
- `CLAUDE.md` — 세션 시작 가이드 (말투·핵심 원칙)
- `~/.claude/projects/.../memory/MEMORY.md` — 누적된 결정·사용자 선호
