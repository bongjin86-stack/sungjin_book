# 1단계 체크리스트

> 단계 정의: 신국판 Classic 한 조합으로 깨끗한 PDF 1개 생성.
> 통과 조건: 성범님이 PDF 열어보고 "이거 책이네" 싶음.

## 환경

- [x] git 레포 (`bongjin86-stack/sungjin_book` private)
- [x] 폴더 스캐폴딩
- [x] `.claude/commands/` (check, work, notion_시니어팀)
- [x] 시작메뉴 단축키 스크립트 (`setup-pc.bat`)
- [x] Typst 0.14.2 설치 (`~/bin/typst/typst.exe`, PATH 등록)
- [x] 폰트 5쌍 동봉 (`fonts/`, 38.8MB, OFL)

## 데이터

- [x] 태평천하 1장 원문 다운 (`content/taepyeongcheonha.txt`)
- [x] 콘텐츠 JSON 스키마 v1 결정 + decisions.md 기록 (D-006)
- [x] 태평천하 1장 JSON 변환 (`content/taepyeongcheonha-ch01.json`, 81 블록)

## 템플릿

- [x] `typst-templates/sinkukpan/classic/template.typ` 골격
- [x] 판형/여백 적용 (152×225, 안20/밖18/위22/아25)
- [x] 본문 폰트/줄간/양끝 정렬
- [x] 챕터 제목 스타일 (산스 Bold, 14pt/18pt)
- [x] 챕터는 홀수 페이지 시작 + 시작 페이지 쪽번호 없음
- [x] 쪽번호 하단 바깥쪽
- [x] 들여쓰기 규칙 (첫 단락 없음, 둘째부터 1글자)
- [ ] 한국어 금칙처리 점검 (PDF 보고 검증)
- [ ] 한영 자간 점검 (PDF 보고 검증)

## 변환 스크립트

- [x] ~~`scripts/json-to-typst.ts`~~ → **변환 스크립트 없음**으로 결정 (D-008). Typst 네이티브 `json()` 사용.
- [x] 컴파일 진입점 `scripts/render-taepyeongcheonha-ch01.typ` 작성

## 검증

- [x] `typst compile` 에러 없이 PDF 생성 (195KB, 노토 적용)
- [ ] PDF 육안 점검 — "이거 책이네" 통과 (사용자 평가 대기)
- [ ] 쪽번호 짝/홀수 위치 검증
- [ ] 챕터 분기 검증
- [ ] 첫 단락 들여쓰기/이후 들여쓰기 검증
- [ ] 양끝 정렬 + 한영 자간 검증

## 메인 핵심 3개 (2026-05-18 확정 — Vellum 심층 분석 결과 반영)

### ① JSON 스키마 v2 — 코드보다 먼저
- [ ] Element 3종 정의 (Chapter / Copyright / Title Page)
- [ ] Text Feature 인라인 6 (B/I/U/Smallcaps/Monospace/Strikethrough)
- [ ] Text Feature 블록 6 자리 (Subhead/OrnBreak/Quote/Verse/List/Image)
- [ ] 한자 루비 인라인 spec (`[漢字]{ruby:한자}`) — 차별화
- [ ] `_locked` 섹션에 폰트/자간/마진 가두기
- [ ] decisions.md 에 D-015로 박기
- [ ] 태평천하 ch01.json 을 v2로 마이그레이션

### ② 편집기 ↔ PDF 미리보기 라이브 파이프 (트랙 B MVP)
- [ ] Typst CLI 배치 결정 (감사 B1) — Vercel Function / typst-ts WASM / 별도 워커 비교
- [ ] Next.js 15 프로젝트 생성 (App Router, TypeScript, Tailwind)
- [ ] shadcn/ui 초기화
- [ ] 3분할 레이아웃 (좌: 챕터 트리, 중: Tiptap, 우: PDF 미리보기) — Vellum 모범
- [ ] `/api/render` — 서버 typst 호출 → PDF 응답
- [ ] 컴파일 진입점 동적화 (감사 B2: `--input` 또는 stdin)
- [ ] 콘텐츠 validator (감사 B4)
- [ ] PDF 캐싱 (감사 B5)
- [ ] 랜딩 카피: "진짜 무료 책 만들기, 지금 해보세요"

### ③ 자동조판 6규칙 (트랙 A 마무리)
- [ ] 위도우/오펀 방지 (감사 A8)
- [ ] 좌우 페이지 baseline 균형 (Vellum Auto-Layout 모범)
- [ ] 챕터 끝 페이지 최소 5줄 보장
- [ ] 하이픈 과다 방지
- [ ] Subhead 페이지 하단 회피
- [ ] KLREQ 금칙 적용 (감사 K1)

---

## 트랙 B (웹 시스템) — 위 ② 외 부수 항목

- [x] localStorage 자동저장 (debounce 1초, `web/hooks/useBookStore.ts`) — IndexedDB 전환은 Phase 2
- [ ] Supabase 연결 (가입 후 클라우드 저장)
- [ ] 다중 탭 잠금 (감사 B7: BroadcastChannel)
- [ ] 모바일 PDF 미리보기 (감사 B8)
- [ ] API 타임아웃 대응 (감사 B9)
- [ ] template_version 필드 (감사 B10)

## 트랙 B MVP v1 (2026-05-19 — Manus v5 HTML 초안 1:1 이식)

- [x] `web/` Next.js 14 + TS strict + Tailwind 셋업
- [x] v5 HTML CSS 변수 → Tailwind config
- [x] BlockNote + dnd-kit 설치 (mantine 8 pin, React 18 호환)
- [x] `types/book.ts` — BookMeta/BookOptions/ChapterBlock/InterludeBlock/BookData
- [x] `hooks/useBookStore.ts` — localStorage 자동저장 + CRUD + 순서변경
- [x] 공통 UI: Toggle (switch role), Badge, Toast
- [x] BookSetupScreen (온보딩) — 브랜드 + 폼 + 판형 3종 + 책 유형 카드
- [x] Header — 책 메타 + 진행 단계 + 자동저장 표시 + 전체 미리보기/PDF 버튼
- [x] Sidebar — 옵션 토글 6 + 간지 스타일 핀 + 목차(dnd-kit 정렬) + 간지 추가
- [x] ChapterForm — BlockNote(paragraph만, 툴바/슬래시메뉴 비활성), Ctrl+Enter 저장, 폼 초기화, 번호 자동증가, 텍스트-only 붙여넣기
- [x] PreviewPanel — `previewContent` prop만 받는 독립 컴포넌트 (추후 Typst PDF 교체)
- [x] FullPreviewOverlay — 모든 챕터 카드 나열, Escape 닫기
- [x] StatusBar — 자동저장/챕터수/총자수/판형
- [x] EditorLayout + `/editor` 라우트 — 컴포넌트 조립, 책 없으면 `/`로 리다이렉트
- [x] 빌드 통과 (Next.js 14.2.35, type check pass)
- [x] 스모크 골든 패스 (Playwright, 콘솔 에러 0)

### TODO — 팀장(Manus) 확인 필요
- BlockNote placeholder가 영어 ("Enter text or type '/' for commands") — 한국어로 바꿀지 결정
- Phase 2: PDF 생성 버튼, "통으로 된 책" 모드, 챕터 클릭 시 에디터 포커스 이동, Supabase 연동

## 트랙 C (ISBN/POD) — 미래

- [ ] 출판사 등록 (sungjinprint 또는 별도 법인)
- [ ] KOLIS-NET 워크플로우
- [ ] 납본 자동화
- [ ] sungjinprint POD 연동

---

## 감사 발견 — `docs/audits/2026-05-tech-audit.md` 후속 (사용자 검토 후 PR 분배)

### P0 — 트랙 A 결함 (책 같지 않은 부분)
- [ ] A1. 블리드 0mm — 페이지 158×231로 확장 + 안쪽 여백 +3mm 보정
- [ ] A2. 프론트매터·백매터 (표제지/판권/차례/헌사) 추가
- [ ] A3. 인용문 `emph()` 제거 (합성 italic, KLREQ 어긋남)
- [ ] A4. quote block 위/아래 여백 추가
- [ ] A5. 첫 챕터 `pagebreak(to: "odd")` — A2와 함께 해결
- [ ] A6. 프론트매터 로마자 쪽번호, 본문은 아라비아 1로 리셋
- [ ] A7. 러닝 헤드 (좌: 책 제목, 우: 챕터 제목)
- [ ] A8. widow/orphan 제어
- [ ] A9. CMYK·PDF/X-1a 후처리 (Ghostscript/pdfcpu)
- [ ] A10. 면수 4의 배수 자동 패딩
- [ ] A11. PDF 육안 검증 (사용자) — 위 "검증" 섹션과 동일

### P1 — 트랙 B 시작 전 결정
- [ ] B1. typst CLI 배치 (Vercel Function / typst-ts WASM / 별도 워커)
- [ ] B2. 컴파일 진입점 동적화 (`--input` 플래그 또는 stdin)
- [ ] B3. JSON 스키마 v2 설계 + v1 마이그레이션
- [ ] B4. 콘텐츠 validator (사람 말 에러 메시지)
- [ ] B5. PDF 캐싱 전략 (콘텐츠 해시 + 챕터 단위)
- [ ] B6. localStorage → IndexedDB 전환 검토
- [ ] B7. 자동저장 다중 탭 잠금 (BroadcastChannel)
- [ ] B8. 모바일 PDF 미리보기 (PDF.js 또는 PNG 썸네일)
- [ ] B9. API 타임아웃 대응 (잡 큐 또는 챕터 분할)
- [ ] B10. 템플릿 버전닝 필드 (`template_version`)

### P1 — 한국어 조판 미세사항 (트랙 A 다음 컷)
- [ ] K1~K3. 금칙·자간·양끝 정렬 PDF 검증 (A11과 동일)
- [ ] K4. 한자 병기 함수 (`#hanja[유민][流民]`)
- [ ] K5. 드러냄 (방점)
- [ ] K6. 시(verse) 블록
- [ ] K7. 각주 (Typst `footnote` + JSON 스키마)
- [ ] K8. 이미지·도판 블록 + 캡션

### P2 — 트랙 C / P3 — 거버넌스
- 보고서 그대로 참조. 시점이 오면 박는다.
