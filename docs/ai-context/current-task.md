# 현재 작업 상태

> 마지막 업데이트: 2026-05-19 KST
> 단계: **트랙 B MVP v1 완료 — Manus v5 HTML 초안을 Next.js로 1:1 이식.**

---

## 다음 세션 시작 시 — 사용자에게 이렇게 가이드할 것

> 사용자가 "이어서 하자"라고 하면, 이 파일을 읽고 **아래 [재진입 보고]**를 한국어로 펼친 뒤 결정을 기다린다.

### 재진입 보고

#### 1. 지금 위치 (2026-05-19)

- **트랙 B 첫 컷 박힘** — `web/` 폴더에 Next.js 14 + TS + Tailwind + BlockNote + dnd-kit 셋업 완료.
- 온보딩 → 에디터 → 챕터 저장 → 목차 드래그 → 미리보기 패널 → 전체 미리보기 → localStorage 자동저장 + 새로고침 유지까지 골든 패스 통과(Playwright 스모크 검증).
- 파일: `web/app/{page,editor/page,layout}.tsx`, `web/components/{onboarding,editor,ui}/`, `web/hooks/useBookStore.ts`, `web/types/book.ts`.
- 스모크 스크립트: `tools/playwright/smoke-editor.mjs`, 결과: `tools/playwright/shots-editor/*.png`.

#### 2. 이번 세션의 큰 결정 (D-015)

외부 설계자(Manus)의 `editor_v5.html` 초안을 권위로 채택. 이전 결정 갱신:
- **D-014 Tiptap → BlockNote** (paragraph만, 툴바·슬래시메뉴 비활성화)
- **D-012 판형** → UI 노출은 **신국판/46배판/문고판** 3종 (Typst 템플릿은 신국판만)
- **D-010** → 가입 게이트는 여전히 X, 다만 책 메타 입력 온보딩 화면 별도 분리

**아직 안 한 것 (Phase 2)**:
- 서버 Typst CLI → PDF 응답 (지금 미리보기는 HTML, "PDF 생성" 버튼은 토스트만)
- JSON 스키마 v2 (현재 web 쪽 BookData는 v5 HTML 초안 기준 임시 스키마, Typst 쪽 sungjin-book/v1과 별개)
- Supabase, 다중 탭, 모바일

#### 3. 다음 액션 후보 (사용자가 결정)

- **A. Manus(팀장)에게 보고 + 추가 지시 대기** — 지시서 마지막 항목. 일단 push해두고 사용자가 Manus에 URL 전달.
- B. PDF 파이프 붙이기 — `/api/render`로 Typst CLI 호출 → 우측 PreviewPanel을 PDF로 교체 (트랙 A·B 합류 지점)
- C. JSON 스키마 v2 박기 — web의 BookData와 Typst의 sungjin-book/v1을 통일
- D. UI 다듬기 — BlockNote 한국어 placeholder, 드래그 핸들 시각 강화 등

---

## 결정 박힌 것

- D-001~D-008: 1단계 Typst R&D 원칙 (변동 없음)
- D-009: 북극성 — 전자책 + ISBN까지 무료, 인쇄(POD)만 유료
- D-010: UX 분할화면 (온보딩만 분리)
- D-011: 사용자 결정 자유도 = 판형 + 스타일
- D-012: 한국 판형 4개 (현재 UI엔 3개 노출)
- D-013: 트랙 모델 (A 템플릿 / B 웹 / C 운영)
- D-014: 기술 스택 (※ 에디터만 BlockNote로 갱신)
- **D-015 (2026-05-19)**: Manus v5 HTML 초안 채택 → BlockNote + 신국판/46배판/문고판 3종 UI

---

## 이번 세션(2026-05-19)에서 한 일

- ✅ Manus 지시서 #02 검토 → 우리 박힌 결정과 충돌 보고
- ✅ 사용자 결정 "이대로 진행" 받고 D-015 박음
- ✅ `web/` 폴더에 Next.js 14 + TS + Tailwind 셋업
- ✅ BlockNote + dnd-kit 설치 (mantine 8 pin으로 React 18 호환)
- ✅ 14개 컴포넌트 + 훅 + 타입 구현 (지시서 디렉토리 구조 그대로)
- ✅ 빌드 통과, 스모크 골든 패스 통과, 콘솔 에러 0

---

## 트랙 진척

| 트랙 | 진척 | 다음 |
|---|---|---|
| **A. 템플릿 라이브러리** | 신국판 클래식 1조합 (첫 컷) | P0/P1 결함 정리, 자동조판 6규칙 — 트랙 B 안정화 후 |
| **B. 웹 시스템** | **MVP v1 — 에디터·미리보기 패널·전체 미리보기·localStorage·드래그 정렬** | A(Manus 보고) or B(PDF 파이프) or C(스키마 v2) or D(UI 다듬기) |
| **C. 운영 (ISBN/POD)** | 0% | 트랙 B 안정화 후 |

---

## 컨텍스트

- 사용자: 성범 (`bongjin86@gmail.com`)
- 외부 설계자: Manus (다른 AI). 우리는 팀원 역할.
- 사용자 톤: 짧게·쉽게·한국어
