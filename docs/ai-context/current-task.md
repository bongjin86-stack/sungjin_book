# 현재 작업 상태

> 마지막 업데이트: 2026-05-18 KST
> 단계: **Vellum 심층 분석 완료. 트랙 B 구현 직전, 핵심 3개 확정 대기.**

---

## 다음 세션 시작 시 — 사용자에게 이렇게 가이드할 것

> 사용자가 "이어서 하자" / 그냥 다시 들어오면, 이 파일을 읽고 **아래 [재진입 보고]**를 한국어로 사용자에게 그대로 펼친다. "이어서 하자" 표현이 나오면 우선순위 최상.

### 재진입 보고 (한국어로 사용자에게 펼칠 내용)

#### 1. 지금 위치 (2026-05-18)
- 트랙 A 첫 컷 박혀있음(태평천하 1장 PDF, 195KB). 트랙 B 코드 0줄.
- **이번 세션 산출물**:
  - `docs/research/2026-05-vellum-deep-dive.md` — Vellum 시장 1위 12장짜리 심층 분석
  - `docs/research/screenshots/vellum/` — Playwright로 27 페이지 + 15 탭 슬라이드 = **42장 캡처** (17MB+)
  - `tools/playwright/` — 캡처 스크립트 (재실행 가능, node_modules는 gitignored)

#### 2. 메인 핵심 3개 (이번 세션이 결론으로 박힌 자리)

**① 데이터 모델 = JSON 스키마 v2** — 코드보다 먼저
- Element + Text Feature + Style 3축 (Vellum 모범)
- 1단계: Chapter / Copyright / Title Page 3종만
- 인라인 6 + 블록 6 자리 마련, **한자 루비 인라인 자리**(차별화)
- `_locked` 섹션에 폰트/자간/마진 가두기 (= 데이터·스타일 분리, CLAUDE.md 핵심 원칙)

**② 편집기 ↔ PDF 미리보기 라이브 파이프** — 제품 본체
- Tiptap → JSON → 서버 Typst CLI → PDF → 우측 패널 표시
- 이 파이프가 트랙 B의 MVP 정의 그 자체
- **감사 B1**(Typst CLI 어디 둘지: Vercel Function / typst-ts WASM / 별도 워커) 결정이 여기서 떨어져야 함

**③ 자동조판 6규칙** — 결과물이 "책"이 되는 이유
- 위도우/오펀, 좌우 baseline 균형, 챕터 끝 5줄, 하이픈 과다 방지, Subhead 페이지 하단 회피, 한국어 KLREQ 금칙
- Vellum Auto-Layout(`32-print-auto-layout.png` 참고)을 Typst로 1:1 구현
- 트랙 A 감사 P0/P1로 박혀 있음

#### 3. 구현 순서 (확정)

```
①  JSON 스키마 v2 작성 + decisions.md 박기
   ↓
②  Typst 서버 배치 결정 (B1)
   ↓
③  Next.js 골격 + Tiptap + PDF 미리보기 (트랙 B MVP)
   ↓
④  자동조판 6규칙 Typst 적용 (트랙 A P0/P1)
   ↓
   여기까지 = "1단계 완료" (성범님 PDF 보고 "이거 책이네")
```

#### 4. 1단계엔 손대지 않을 것 (확정)
- 로그인·결제·자동저장
- 표지 디자인
- 테마 2개 이상 (classic 하나만)
- 판형 2개 이상 (신국판 하나만)
- AI 추천·LLM 호출
- 모바일

#### 5. 다음 액션 후보 (사용자가 결정)

- **A. JSON 스키마 v2 박기** ← 1순위 추천 (코드보다 먼저)
- B. Typst 서버 배치 결정 (B1 비교 표 작성)
- C. Next.js 골격부터 시작 (스키마는 그 후)
- D. Atticus도 같은 깊이로 보조 조사

---

## 결정 박힌 것 (변동 없음)

- D-009 북극성: 전자책 + ISBN까지 무료, 인쇄(POD)만 유료
- D-010 UX: Vellum식 분할 화면 + 가입 게이트 X
- D-011 자유도: 판형 + 스타일 2개만 노출 (← 시장 조사 결과 "유지")
- D-012 판형: 신국판 → 국판 → 4·6판 → 크라운판
- D-013 트랙 모델: A 템플릿 / B 웹 / C 운영
- D-014 기술 스택: Next.js 15 + Tiptap + 서버 typst + Supabase + Vercel + shadcn/ui

---

## 이번 세션(2026-05-18)에서 한 일

- ✅ Vellum 27개 도움말 페이지 Playwright 캡처
- ✅ 메인 페이지 5탭 × 3슬라이드 = 15장 인터랙티브 캡처
- ✅ Vellum 12장 심층 분석 보고서 (`docs/research/2026-05-vellum-deep-dive.md`)
- ✅ 구현 핵심 3개 + 순서 확정 → 본 파일에 박음

(이전 세션까지 한 일은 `git log --oneline` 참조)

---

## 트랙 진척

| 트랙 | 진척 | 다음 |
|---|---|---|
| **A. 템플릿 라이브러리** | 신국판 클래식 1조합 (첫 컷) | 자동조판 6규칙(P0/P1) — 단, 트랙 B 안정화 후 |
| **B. 웹 시스템** | 0% — 핵심 3개·순서 확정 | ① JSON v2 → ② Typst 서버 → ③ Next.js MVP |
| **C. 운영 (ISBN/POD)** | 0% | 트랙 B 안정화 후. 출판사 책임(C1) 결정이 1순위 |

---

## 컨텍스트

- 사용자: 성범 (`bongjin86@gmail.com`)
- 사용자 컨텍스트: sungjinprint(인쇄 주문 시스템) 운영자. Printology와 트랙 C에서 연결.
- 사용자 톤: 짧게·쉽게·한국어 (CLAUDE.md "말투" 섹션).

---

## 다음 세션 시작 명령 (사용자용)

```bash
cd C:\projects\sungjin_book
git pull
cc.bat
```

Claude는 자동으로 이 파일을 읽고 위 [재진입 보고]를 한국어로 펼친 뒤 사용자 결정을 기다립니다.
사용자가 "이어서 하자"라고 하면 위 [재진입 보고] 섹션을 그대로 다시 보여주세요.
