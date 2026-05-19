# 현재 작업 상태

> 마지막 업데이트: 2026-05-20 KST (Sprint 1 완료, Sprint 2 진입)
> 단계: **Typst 단일 엔진 전환** — 인디자인 대비 한국어 단행본 조판 정밀화
> 작업 브랜치: `refactor/typst-ts-preview`

## 한 줄 정체성

**Vellum 신뢰 + Reedsy 가격 + 부크크 출구.** 한국어 단행본 자동 조판에만 집중.

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

## D1~D7 회고 (2026-05-19~20 완료)

- **D1~D5 통과**. D6(컴파일 시간 측정)은 자연 측정됨: 첫 로딩 ~1s(폰트+WASM 받는 시간 제외), 캐시 후 14~21ms. **디바운스 기준 = 100ms로 충분.**
- D5(SVG ↔ 서버 PDF 비교)는 서버 PDF 자체가 Sprint 4 작업이라 후일로 미룸.
- 새 발견:
  - typst.ts 0.6은 **woff2 미지원** → 폰트 6MB. SW 캐싱 의존도 ↑.
  - typst.ts의 `getCompiler()`는 첫 호출에 race 있음 → warmup 컴파일을 init promise 안에 박아 회피.
  - dev HMR이 모듈 변수 reset → init 캐시는 `globalThis`에 저장.

## 다음 7일 (D8~D14) — Sprint 2 진입

1. **D8**: Vellum 디자인 보고서 → D-021 액센트 색 결정 (먹색 vs 쪽빛). decisions.md에 박기. 토큰 파일 박기.
2. **D9**: S2-1 `lib/typst/buildSource.ts` — bookData JSON → .typ 문자열 변환 골격.
3. **D10~D11**: S2-3 G1·S2-4 G2 — 줄 처음/끝 금칙 전처리.
4. **D12**: S2-5 J1 — `par.justify` + `justification-limits` 실측.
5. **D13**: S2-6 I1 — 들여쓰기 정책 c (이미 template.typ에 일부 구현).
6. **D14**: S2-7 S1 — 한영 자간 1/4각.

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
