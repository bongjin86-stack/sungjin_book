# Typst 한국어 단행본 조판 정찰 종합

> 정찰일: 2026-05-19
> 정찰 4팀(Typst 본진 / typst.ts / KLREQ / 경쟁자) 병렬 가동 결과 종합

## 한 줄 결론

**"Vellum 신뢰 + Reedsy 가격 + 부크크 출구. 한국어 단행본 조판에만 집중한다."**

- 엔진 베이스: Typst 본진(Apache-2.0) + typst.ts(브라우저 WASM)
- 우리 자산: 한국어 조판 패키지 `sungjin-book-classic` + 부크크 입고 PDF 프리셋
- 시장 빈자리: 한국어 단행본 자동 조판은 글로벌·국내 도구 모두 비어 있음

---

## 1. Typst 본진 정찰 결론

### 즉시 활용 가능
- **버전**: 0.14.2 (2025-12). 라이선스 **Apache-2.0** — 포크·임베드 자유.
- **양끝 정렬 + 글자 자간 조정**: 0.14.0 `par.justification-limits` (PR #6161) — KLREQ J1 즉시 충족.
- **줄바꿈 알고리즘**: Knuth-Plass 동적계획(`optimized` 모드) + greedy 모두 지원. `crates/typst-layout/src/inline/linebreak.rs`.

### 우리한테 빈 자리
- **한국어가 CJK 세그멘터에서 빠짐**: `Lang::CHINESE | Lang::JAPANESE`만 라우팅, `Lang::KOREAN`은 일반 UAX#14 경로. → **우리 첫 PR 후보**.
- **금칙 처리는 일본어 위주 일부만**: 한국어 금칙은 우리가 패키지/전처리로 처리.
- **Universe에 한국어 단행본 템플릿 없음**: 현재 모든 책 패키지(`songting-book`, `jaconf`, `ori`, `tntt`)가 중일 위주. → **`sungjin-book-classic` 올리면 한국어 거점 선점**.

### 정치 리스크
- 메인테이너 Laurenz Mädje 1인 게이트. PR #7642 반려 사례에서 "language-specific property 또 추가하지 말자"는 입장.
- 큰 변경은 issue 단계 사전 합의 필수. 작은 패치는 빠르게 머지됨.

### 우리 액션
- A. 0.14.2로 1단계 PDF + `justification-limits` 실측
- B. `Lang::KOREAN` CJK 세그멘터 라우팅 패치 — issue로 사전 제안
- C. `sungjin-book-classic` Universe publish

---

## 2. typst.ts 정찰 결론

### 안정성
- **v0.6.0** 안정 (2025-04). v0.7.0-rc2 (2025-12-27).
- 라이선스 Apache-2.0. 스타 1,106 / 포크 72. 메인테이너 Myriad-Dreamin 1인 — **버스 팩터 위험**.
- 알려진 한계: 동기 폰트 fetch 제약. 폰트 사전 메모리 로드 필수.

### 번들 크기 실측
| 자산 | 원본 | gzip | Brotli 추정 |
|---|---|---|---|
| 컴파일러 WASM | 27 MB | 10.3 MB | **~8.5 MB** |
| 렌더러 WASM | 0.93 MB | ~0.4 MB | ~0.3 MB |

### 모바일 LTE 첫 로딩 계산
- 컴파일러 ~8.5 + 렌더러 ~0.3 + 폰트 서브셋 ~2 + JS shell ~0.5 = **~11 MB**
- LTE 5 Mbps: ~18초 / 4G 20 Mbps: ~4.5초
- **모바일 8초 목표는 조건부 가능**: SSR로 첫 화면 SVG 사전 렌더 → 사용자 첫 편집 시점 컴파일러 lazy load + Service Worker 캐시

### 대안 검토
- 본진 typst/typst 직접 WASM 빌드 → 가이드 없음, 사실상 typst.ts 재구현 비용
- 다른 커뮤니티 WASM 변종 → 모두 내부적으로 typst.ts 사용
- **선택지: typst.ts 외에 없음**

### 가장 큰 위험 3가지
1. 컴파일러 WASM 8.5 MB Brotli → 캐시 미스 모바일 LTE 10초+. SSR + Lazy + SW 조합 필수.
2. 1인 메인테이너 → 컴파일러 호출 얇게 추상화해 락인 최소화.
3. 동기 폰트 fetch → 사용자 폰트 업로드 기능 v1 보류.

### Next.js 14 함정
- `"use client"` 경계 필수. WASM 초기화 클라이언트 컴포넌트만.
- Vercel `public/` 정적 자산 OK (Edge CDN + Brotli 자동).
- 참고 사례: [Mapaor/typst-online-editor](https://github.com/Mapaor/typst-online-editor) — Next.js + typst.ts 브라우저 컴파일 실제 동작.

---

## 3. KLREQ 한국어 조판 룰셋

### 문서 상태
- W3C **Group Note Draft** (DNOTE), 권고안 아님. 2026-03-21 최신 갱신.
- URL: https://www.w3.org/TR/klreq/
- 한국어판 존재(상단 토글). GitHub: w3c/klreq

### MVP 7룰 (첫 3개월 내 구현)

| 코드 | 룰 | KLREQ § | 우리 구현 |
|---|---|---|---|
| **G1** | 줄 처음 금칙(닫는괄호·구두점·줄임표 11종) | 7.1.2 | 사전 + 전처리 또는 Typst 패키지 |
| **G2** | 줄 끝 금칙(여는괄호 9종) | 7.1.3 | 사전 + 전처리 |
| **J1** | 양끝 정렬(어절 공백 우선 분배) | 7.2.1 | Typst `par.justify` + `justification-limits` |
| **I1** | 단락 들여쓰기(장 첫단락 0, 둘째부터 1em) | 7.2.3.1 | Typst `par.first-line-indent` 정책 |
| **S1** | 한영 자간 1/4각 자동 | 7.3.2 | Typst CJK-Latin 자간 또는 전처리 |
| **C1** | 장 시작 홀수 페이지 + 시작 쪽번호 미표시 | — | Typst `page` 룰 + 빈 페이지 삽입 |
| **P1** | 쪽번호 하단 바깥쪽 9pt 미러링 | 8.4.2 | Typst `set page(numbering)` |

### 2단계 보류
G3 단어 분할 금지, S2 기호 자간, N1 각주, J1 자간 분배 단계, 위젯/고아줄.

### 한국 출판 관행 통상값 (KLREQ 보완)
- 신국판 152~153 × 224~225 mm
- 본문 9.5~10.5pt
- 줄간 본문의 1.7~1.9배
- 본문 폰트: 노토 세리프 / 리디바탕 / SM신신명조
- 쪽번호: 하단 바깥, 본문보다 1pt 작게

→ **우리 1단계 신국판 Classic 사양과 완전 일치**.

---

## 4. 경쟁자 정찰 결론

### 시장 지도
- **Vellum** ($249, Mac only): WYSIWYG 신뢰의 원조. 한국어 사실상 무지원.
- **Atticus** ($147, 웹): 인기 ↑, 그러나 PDF 어긋남 불만 다수. 한국어 검증 안 됨.
- **Reedsy** (무료): 단순. 자유도 0. 한글 미세조정 불가.
- **Sigil** (무료 GPL): EPUB만. 인쇄 PDF 불가.
- **Scribus** (무료 GPL): CJK "거의 작업 안 됨" 공식 명시.
- **InDesign** (월 ₩28,000): 한글 최고 품질. 학습 곡선 가파름. 비쌈.

### 한국 시장 실측
- **부크크**: 4만 종 / 2.9만 저자 (2024-02 기준). 국내 POD 1위.
- **교보 바로출판, 북퍼브** 등 POD 다수.
- 작가 도구 1위 **아래아한글 → PDF**. 2위 MS Word.
- **부크크 입고 요건**: PDF 필수, 신국판/A5, 본문 10-12pt, 표지 300dpi.
- **빈 자리**: 한국어 자동 조판 + 부크크 입고 표준 프리셋. 글로벌 도구가 절대 안 해줄 영역.

### UX 표준 (Vellum이 원조)
- 좌: 챕터 트리 (Front/Body/Back 세 묶음)
- 중: 에디터
- 우: 실시간 책 미리보기
- 다운로드: "Generate" 한 번 → 모든 플랫폼 파일 동시 생성

### 우리 차별화 5
1. **한국어 단행본 단일 초점** (KLREQ 기준)
2. **WYSIWYG = Typst 단일 컴파일** (Vellum 신뢰 + 더 엄격)
3. **부크크 입고 PDF 프리셋 버튼** (한국 시장 직격)
4. **3분할 UX + 자동 레이아웃 블록** (Vellum 패턴 채택)
5. **자유도·표지·LLM 안 함** (Scribus/InDesign이 망한 지점 회피)

---

## 5. 교차 정합성

| 차원 | Typst 본진 | typst.ts | KLREQ | 경쟁자 |
|---|---|---|---|---|
| 한국어 단행본 자동 조판 | 본진 60% | 가능 | 룰 정의됨 | **시장 비어있음** |
| 무료 제공 가능 | Apache-2.0 | Apache-2.0 | — | Reedsy 무료, 차별화 필요 |
| WYSIWYG 보장 | 단일 컴파일 | SVG=PDF 일치 | — | Vellum이 신뢰 원조 |
| 부크크 입고 표준 | PDF/X 호환 | — | — | **누구도 안 함** |
| 첫 로딩 부담 | — | 11MB | — | Vellum/Atticus 데스크탑 앱 |

**결론**: 가능. 빈 자리 있음. 모바일 첫 로딩만 SSR + Lazy + SW로 조절하면 됨.

---

## 6. 출처 (전체)

### Typst 본진
- https://github.com/typst/typst
- https://typst.app/blog/2025/typst-0.14/
- https://github.com/typst/typst/blob/main/crates/typst-layout/src/inline/linebreak.rs
- Issues: #276, #792, #1009, #4011, #4404, #6539, #7335, #7642, #7643
- https://typst.app/open-source/
- https://github.com/typst/packages

### typst.ts
- https://github.com/Myriad-Dreamin/typst.ts
- https://www.npmjs.com/package/@myriaddreamin/typst-ts-web-compiler
- https://github.com/Mapaor/typst-online-editor (Next.js 참고 사례)
- https://github.com/Myriad-Dreamin/typst.ts/issues/834 (동기 폰트 fetch)
- https://github.com/typst/typst/issues/909 (본진 브라우저 라이브러리 거부)
- https://autognosi.medium.com/typst-studio-in-pure-rust-webassembly-and-rust-for-modern-web-applications-4e2e52be14a2
- https://www.figma.com/blog/webassembly-cut-figmas-load-time-by-3x/
- https://vercel.com/docs/limits

### KLREQ
- https://www.w3.org/TR/klreq/
- https://github.com/w3c/klreq
- https://w3c.github.io/klreq/gap-analysis/
- 북토리 판형 가이드, 창조와지식, csprint, 브런치 편집디자인, 한국타이포그라피학회

### 경쟁자
- https://kindlepreneur.com/vellum-software-review/
- https://kindlepreneur.com/atticus-review/
- https://help.vellum.pub/preview/
- https://reedsy.com/studio/resources/book-writing-software-faq
- https://bookkclass.co.kr/52/ (부크크 입고)
- https://namu.wiki/w/부크크
- https://product.kyobobook.co.kr/pod/introduce
