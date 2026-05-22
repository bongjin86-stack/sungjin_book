# 체크리스트

> 마지막 업데이트: 2026-05-22 KST 오전 (Phase Ⅳ 첫 한 발 + 연결부 봉합)

## 교재 트랙 — Phase Ⅰ 끝 연결 (지금 진행 중)

### 2026-05-22 오전 박힘
- [x] IDML 배경 자동 추출기 3종 (`scout-spreads.py` / `inspect-spread.py` / `extract-decorations.py`)
- [x] simply-classic `decorations.typ` 자동 생성 (59 spreads → 3729 frames)
- [x] main.typ background 통합 검증 95.2% 시각 일치
- [x] 입력 형식 결정 박음 (B 챕터별 + C 단일 책, A 자동 분리 ❌)
- [x] preset 컨셉 + chapter-type→master 매핑 컨셉 박음 (STS-SPEC.md 갱신)
- [x] 웹 typst 미러 동기화 (decorations·design-tokens·master-pages-a4 포함)
- [x] `compiler.ts` loadTestPaperSources에 simply-classic 새 의존 4개 추가
- [x] Zod 콘텐츠 스키마 박음 (`web/lib/schema/edu-book.ts`)
- [x] 샘플 JSON 2개 (`sample-single-book.json` / `sample-chapter-book.json`)
- [x] npm.cmd run build 통과 확인

### 남은 (Phase Ⅰ 끝 연결)
- [ ] main.typ을 chapters[] for문 + chapter-type-to-master 매핑으로 분기 (2순위)
- [ ] EduSetupScreen에 챕터 추가 UI (3순위)
- [ ] HWP 변환기 웹 연결 방식 결정 → 구현 (4순위, 별도 결정 필요)
- [ ] PDF 다운로드에 워터마크 박기

## 단행본 트랙 (동결 중)

### 트랙 B MVP v1

- [x] Next.js 14 + TypeScript + Tailwind 에디터 구성
- [x] 시작 가이드: 기본 정보 / 책 구성 / 테마 선택
- [x] 새 책 기본 구조: 속표지 / 판권지 / 목차 / 제1장 / 저자 소개
- [x] 사이드바 그룹: 앞부분 / 본문 / 뒷부분
- [x] 챕터 작성/수정/저장
- [x] 챕터 메타데이터: 부제목, 목차 표시, 목차용 이름, 챕터 번호 표시
- [x] 블록별 편집 화면 1차: 속표지, 판권지, 목차, 일반 구성 블록
- [x] 목차 자동 생성 1차: 챕터 목록 기반 표시
- [x] 챕터 화면 단순화: 목차/번호/설정 UI를 고객 첫 화면에서 숨김
- [x] 새 챕터 저장 후 다음 챕터 작성 흐름
- [x] 사이드바 `간지 추가` 버튼 임시 제거
- [x] 미리보기 하단 문구 한국어화
- [x] 미리보기 조판 보정: 긴 문단 줄 단위 분할
- [x] 미리보기 조판 보정: 신국판 실제 mm 여백 적용
- [x] Atticus/Vellum 공식 기준 문서 작성: `docs/research/atticus-vellum-workflow-official.md`
- [x] 기존 localStorage 데이터 기본값 보정
- [x] 빌드 통과: `npm.cmd run build`

## 남은 핵심 작업

- [x] 집필/포맷팅 탭 위치 재설계
- [x] 전체 책 미리보기: 모든 블록을 책 흐름으로 넘겨보기
- [x] 목차에 실제 페이지 번호 연결
- [ ] 앞부분 페이지 번호 규칙: TOC 전 번호 없음, 이후 로마 숫자 검토
- [ ] 판권지 입력 구조화: 저작권, 발행일, ISBN, 출판사
- [ ] 미리보기 조판 보정: 실제 글자폭 기반 줄바꿈
- [ ] 미리보기 조판 보정: 홀짝 쪽번호와 바깥쪽 위치
- [ ] 속표지/판권지/목차의 PDF 출력 규칙 확정
- [ ] `/api/render` 또는 대체 PDF 생성 경로 결정

## 트랙 A Typst/PDF

- [x] 신국판 Classic 템플릿 초안
- [x] Typst PDF 컴파일 성공
- [ ] KLREQ 기준 금칙/한영 자간/양끝 정렬 PDF 검증
- [ ] 웹 데이터 구조와 Typst JSON 스키마 통합

## 후순위

- [ ] Scene 단위 편집
- [ ] Part 계층
- [ ] Split/Merge Chapter
- [ ] ePub Include 옵션
- [ ] Supabase 저장
