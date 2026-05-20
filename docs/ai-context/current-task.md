# 현재 작업 상태

> 마지막 업데이트: 2026-05-20 KST (단행본 Sprint 1·2·3·4 핵심 통과 + 교재 파이프라인 합류)
> 단계: **단행본/교재 두 트랙 main에서 통합 운영 시작**
> 작업 브랜치: `main` 단일 (refactor/typst-ts-preview, experiment/edu-vellum-mvp 모두 ff-merge 후 삭제)

## 한 줄 정체성

**한국어 출판물 자동 조판 도구 = 성진북스.** 한 사이트, 단행본 + 교재 두 모드.
단행본은 작가 입력 → PDF (Vellum 신뢰 + Reedsy 가격 + 부크크 출구).
교재는 평가원형 HWP → JSON → 시험지 PDF.

## 통합 상태 (2026-05-20 합류)

- **main = 단일 통합 브랜치.** refactor/typst-ts-preview와 experiment/edu-vellum-mvp 모두 흡수.
- **단행본 트랙**(옆 창): `web/`, `typst-templates/sinkukpan/`. Sprint 1~5 일부 진행.
- **교재 트랙**(이 창): `experiments/edu-import/`, `typst-templates/edu/`. 5종목 HWP → JSON → PDF 자동 변환 100% 동작.
- **공통 코어**: `typst-templates/_core/sungjin-core.typ` 박힘. 폰트·색 토큰(쪽빛 #2a3a5a)·박스 헬퍼·한국어 설정·인라인 마커 처리.
- **두 창 운영 룰**: 이 창 = 교재 폴더만, 옆 창 = 단행본 폴더만. 공통 코어 만질 땐 알림.

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
