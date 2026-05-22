# Edu Block Engine Handoff — 2026-05-22

## 한 줄 현재 위치

성진북스 교재 트랙은 이제 **고객 셀프 편집기**가 아니라, 먼저 **내부 조판자가 IDML preset 블록을 쌓아 상업용 PDF를 만드는 반자동 조판 엔진**으로 간다.

## 지금 건드린 범위

- 엔진/검증축을 주로 건드림.
- 웹 UI는 `/edu`에 블록 추가 모달과 미리보기 연결까지만 박힘.
- 웹 제품 UX, 오른쪽 블록 편집 패널, 드래그 이동, HWP 자동 초안 연결은 아직 본격 작업 전.

## 핵심 방향

1. IDML 1개 = preset 1개 = 허용 블록 묶음 1개.
2. preset은 스타일뿐 아니라 **추가 가능한 블록 종류**도 정의한다.
3. 현재 simply-classic 허용 블록:
   - `+ 목차` — manifest에만 있고 v0 disabled
   - `+ PART`
   - `+ 지문`
   - `+ 문제`
   - `+ 빠른 정답`
4. 내부 데이터 권위는 `blocks[]`.
5. 렌더 직전 `blocks[] -> chapters[] -> Typst -> PDF`.
6. 사용자는 글자 크기, 자간, 좌표, 박스 크기를 직접 만지지 않는다.
7. 조판자는 블록 순서, 블록 내용, 지문-문제 연결, 강조/밑줄, 페이지 흐름만 다룬다.

## 상업용 판단 기준

엔진 테스트도 최종 기준은 디자인 품질이다.

그래서 QA 샘플을 3종으로 나눈다.

| 구분 | 샘플 | 목적 |
|---|---|---|
| Product QA | `hwp-simply-classic-debug` | HWP 변환 결과가 팔 만한지 |
| Block Engine Product QA | `block-engine-product` | 같은 상품 샘플을 `blocks[]` 엔진으로 지나도 품질이 유지되는지 |
| Smoke | `block-engine-smoke` | 버튼 -> blocks -> chapters -> PDF 연결이 깨지지 않는지 |

중요: `block-engine-smoke`는 못생겨도 된다. 단, `block-engine-product`는 상품 기준으로 봐야 한다.

## 최근 커밋

- `9948d13 feat(edu): add preset block engine`
  - preset manifest
  - `blocks[]` schema
  - `BlockEditModal`
  - `blocks-to-chapters`
  - `/edu` 블록 추가 UI
  - smoke PDF

- `92982ae fix(edu): separate passage and question blocks`
  - 지문 박스와 첫 문제 사이 여백 추가
  - QA 갤러리 과거 기록에 모든 페이지 썸네일 표시

- `edb7f31 test(edu): add product-quality block engine sample`
  - 예쁜 HWP 상품 샘플을 `blocks[]`로 재구성한 `block-engine-product` 추가
  - `block-engine-product`와 `hwp-simply-classic-debug` p1~p3 픽셀 diff 0.0000
  - `blocks[]`가 `layout_mode`, `body_rich`를 잃지 않도록 보정

## 지금 확인된 것

- `block-engine-product` PDF 5쪽 생성됨.
- `npm run build` 통과.
- QA 갤러리: `/dev/qa-gallery`
- 갤러리 최신 기준은 `Block Engine Product QA`.
- 기존 예쁜 HWP 샘플과 block engine 상품 샘플은 p1~p3 완전 동일.

## 아직 남은 큰 문제

1. 빠른 정답 페이지는 아직 IDML 구조 복사 전이다.
   - 지금 임시 표는 상업 기준 아님.
   - 다음 방향: IDML의 `master_5_빠른정답` 구조를 먼저 고정 골격으로 복사하고, 답만 주입.

2. 웹은 아직 작업자용 도구 초안이다.
   - 블록 순서 이동 없음.
   - 오른쪽 블록 편집 패널 없음.
   - HWP 업로드가 blocks 자동 초안으로 연결되지 않음.
   - PDF 썸네일/페이지 검수 UX 미완.

3. preset manifest는 아직 손으로 박은 v0다.
   - 장기적으로 IDML 추출기가 preset manifest까지 뽑아야 한다.

## 다음 한 발 추천

1. `빠른 정답`을 IDML master 구조 기반으로 재구현.
2. QA 갤러리를 `Product QA / Engine Product QA / Smoke / Reference` 섹션으로 분리.
3. HWP 변환 결과를 `blocks[]` 초안으로 바꾸는 adapter 작성.
4. `/edu` 웹에서 블록 순서 이동과 블록 선택/편집 흐름을 다듬기.

## 팀장 판단

현재 엔진 방향은 맞다.  
다만 앞으로는 “기능 연결됨”만으로 통과시키면 안 된다.  
모든 엔진 변경은 `block-engine-product`가 상품 샘플 품질을 유지하는지까지 확인해야 한다.
