# 현재 작업 상태

> 마지막 업데이트: 2026-04-27 KST
> 단계: **트랙 A 첫 컷 박음 / 트랙 B(웹) 진입 직전**

---

## 다음 세션 시작 시 — 사용자에게 이렇게 가이드할 것

> 사용자가 `git pull` 받고 다시 오면, **이 파일을 먼저 읽고 아래 요약을 한국어로 사용자에게 보고한다.**

### 요약 (사용자에게 전달할 내용)

1. **지금 위치**: 트랙 A(PDF 템플릿) 첫 컷 박음. 트랙 B(웹 시스템) 코드 0줄.
2. **결정 박힌 것 (decisions.md D-001~D-014)**:
   - **D-009 북극성**: 전자책 + ISBN까지 무료, 인쇄(POD)만 유료
   - **D-010 UX**: Vellum식 분할 화면 (좌:글, 우:미리보기) + 가입 게이트 X
   - **D-011 사용자 자유도**: 판형 + 스타일 2개만 노출, 분리자는 스타일이 흡수
   - **D-012 판형**: 신국판(있음) → 국판 → 4·6판 → 크라운판 (4종 단계적)
   - **D-013 트랙 모델**: A 템플릿 / B 웹 / C 운영 (단계 아닌 트랙)
   - **D-014 기술 스택**: Next.js 15 + Tiptap + 서버 typst 컴파일 + Supabase + Vercel + shadcn/ui
3. **미해결**:
   - 새 PDF(`output/taepyeongcheonha-ch01-noto.pdf`) 사용자 육안 평가 안 받음
   - 콘텐츠 import 휴리스틱 v1 (빈 줄=단락, HTML 클립보드 우선) — 합의 후 D-015로 박을 후보
   - 메타 정보 스키마(저자/ISBN/부제/헌사) — JSON v2에 추가 필요
4. **다음 액션 후보 (사용자 결정)**:
   - A. PDF 평가만 마치고 트랙 B 시작 (Next.js 프로젝트 생성)
   - B. import 휴리스틱 결정 + D-015로 박기 → 트랙 B 시작
   - C. 다른 우선순위 (사용자가 지정)

---

## 이번 세션에서 한 일 (요약)

- ✅ Typst 0.14.2 설치 (`C:\Users\Owner\bin\typst\typst.exe`, PATH 등록)
- ✅ 첫 PDF 컴파일 성공 (`output/taepyeongcheonha-ch01-noto.pdf`, 195KB)
- ✅ 폰트 5쌍 동봉 (`fonts/`, 38.8MB, 모두 OFL):
  - 노토 세리프 KR Regular/Bold (트랙 A 클래식 본문)
  - 노토 산스 KR Regular/Bold (트랙 A 클래식 제목)
  - 나눔명조 Regular/Bold
  - 나눔고딕 Regular/Bold
  - Pretendard Regular/Bold
- ✅ 컴파일 명령 확정: `typst compile --root . --font-path fonts scripts/render-*.typ output/*.pdf`
- ✅ template.typ fallback 체인 단순화 (Noto KR + CJK KR만)
- ✅ decisions.md D-009 ~ D-014 박음
- ✅ CLAUDE.md "말투" 섹션 추가 (짧게·쉽게·한국어)
- ✅ 메모리 저장 (`memory/communication_style.md`)

---

## 트랙 진척

| 트랙 | 진척 | 다음 |
|---|---|---|
| **A. 템플릿 라이브러리** | 신국판 클래식 1조합 (첫 컷) | 국판/4·6판/크라운판은 트랙 B 만든 후 추가 |
| **B. 웹 시스템** | 0% (IA·기술 스택만 합의) | Next.js 프로젝트 생성, 분할 화면 골격, 서버 typst 컴파일 API |
| **C. 운영 (ISBN/POD)** | 0% | 트랙 B 안정화 후 |

---

## 트랙 B 시작 시 즉시 할 일 (체크리스트)

1. `apps/web/` 또는 루트에 Next.js 15 프로젝트 생성 (App Router, TypeScript, Tailwind)
2. shadcn/ui 초기화
3. 분할 화면 레이아웃 (좌: Tiptap 에디터, 우: PDF 미리보기 iframe)
4. `/api/render` Vercel Function — 요청 JSON 받아 typst 컴파일 → PDF 응답
5. `fonts/` 폴더를 Function 환경에 함께 배포 (Vercel function bundle에 포함)
6. typst CLI 바이너리를 Vercel Function에 어떻게 두느냐 결정 (이게 잠재 함정. node_modules에 prebuilt? Lambda Layer? Docker runtime?)
7. 자동저장 = localStorage (가입 전), Supabase (가입 후)
8. 랜딩 페이지 한 줄 카피: "진짜 무료 책 만들기, 지금 해보세요"

---

## 잠재 함정 (트랙 B 시작 전 알아둘 것)

- **typst CLI를 Vercel Function에 두기**: Vercel은 Lambda 기반이라 큰 바이너리(20MB+) 부담. typst-rs npm 래퍼 또는 Docker Runtime 검토 필요. 안 되면 별도 워커 (Cloudflare Workers + WASM, Fly.io 등).
- **폰트 38.8MB**: Function bundle에 포함 시 cold start 느려짐. R2/S3에 두고 fetch가 나을 수도.
- **Typst.ts(브라우저 WASM) R&D 트랙**: 트래픽 늘 때 점진 이전. 지금은 안 씀.

---

## 컨텍스트

- 사용자: 성범 (`bongjin86@gmail.com`)
- 사용자 컨텍스트: sungjinprint(인쇄 주문 시스템) 운영자.
- Printology(인쇄 파이프라인)와 추후 트랙 C에서 연결.
- 사용자 톤: 짧게·쉽게·한국어 (CLAUDE.md "말투" + memory/communication_style.md).

---

## 다음 세션 시작 명령 (사용자용)

```bash
cd C:\projects\sungjin_book
git pull
cc.bat                     # 또는 시작메뉴 → claude
```

Claude는 자동으로 이 파일을 읽고 위 "요약"을 한국어로 보고한 뒤 사용자 결정을 기다립니다.
