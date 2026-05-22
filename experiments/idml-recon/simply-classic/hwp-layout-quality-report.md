# HWP × simply-classic 상품 완성도 보고서 (passage body box + QA 갤러리)

> **공식 실행 방법**:
> ```bash
> python experiments/edu-import/scripts/build-edu-book-sample.py
> python experiments/idml-recon/render-hwp-simply-classic.py
> cd web && npm.cmd run sync-qa-gallery && npm.cmd run build
> ```
> 갤러리 확인: `http://localhost:3000/dev/qa-gallery`
> 기준: **상품 완성도 검증** — IDML 원본 픽셀 복제가 아님.
> 질문: 학원선생이 돈 내고 받을 PDF인가?

## 1. 무엇을 고쳤는지

이번 1차 상품성 보정:

- **passage-body-box 토큰** 정식 ON (`design-tokens.passage-body-box`):
  - stroke 0.3pt + `rgb("#0091db")` (accent cyan)
  - fill: none
  - **inset-x: 12pt, inset-y: 10pt** (사용자 지시 범위 10~14pt / 8~12pt 내)
  - breakable: true (긴 지문은 column/page 넘김)
- `render-passage`: header strip 아래 body 전체를 단일 block(파란 박스)로 감쌈
- `column-border.enabled = false` 유지 — debug 전용 (`data.options.debugColumnBorder = true`로만 켜짐)
- 문제(번호+발문+선지) 블록은 박스 **밖**. boki-box(`<보기>`)는 기존 회색 박스 그대로

**구조 룰**:
> 지문은 파란 박스 안 / 문제·선지는 박스 밖 / 보기만 별도 회색 박스 / column 전체 박스 없음.

HWP 파서·passage-question inference는 이번 작업에서 손 안 댐. 코드 주석에 다음 원칙 메모:
> HWP 고객 파일은 지문-문제 연결이 명시적이지 않을 수 있다. 이후 "자동 추정 + 고객 확인/수정 UI"가 필요. 이번 작업은 출력 상품성에만 집중.

## 2. PDF / PNG 경로

- PDF: `experiments/idml-recon/hwp-simply-classic-debug.pdf` (5쪽, 206 KB)
- PNG:
  - `experiments/idml-recon/hwp-simply-classic-debug-p1.png` — PART 1 표지
  - `experiments/idml-recon/hwp-simply-classic-debug-p2.png` — 본문 첫 페이지
  - `experiments/idml-recon/hwp-simply-classic-debug-p3.png` — 본문 둘째 페이지

## 3. QA 갤러리 갱신 — ✅

- `npm run sync-qa-gallery` 실행 (`web` 폴더에서)
- `[qa-gallery] synced 7 groups`
- manifest: `web/public/dev/qa-gallery/manifest.json`
- `hwp-simply-classic-debug` 그룹이 mtime 최신 → LATEST 위치
- `npm.cmd run build` 통과 (Next.js 14.2.35, /dev/qa-gallery 138 B)

## 4. p2 / p3 눈검증 결과

| 기준 | 결과 |
|---|---|
| p2 `[1~3]` header 아래 지문 본문이 파란 박스 안 | ✅ 박힘. inset 12/10pt 호흡 자연 |
| p2 문제 01/02/03이 박스 밖 | ✅ 우단 흐름, 박스 없음 |
| p2 `[4~9]` 지문도 header + 본문 박스 구조 | ✅ 우단 하단에 새 strip + 새 박스 시작 |
| p3 박스가 column/page 넘어 자연 분할 | ✅ passage-02 박스 p2 우단 → p3 좌단까지 깔끔 |
| column 전체 박스 다시 생기지 않음 | ✅ column-border.enabled = false 작동 |
| 보기 회색 박스(`boki-box`) 깨지지 않음 | N/A — 이 9문제 샘플에 `<보기>` 마커 없음. 후속 검증 필요 |
| PART 표지 중앙 보정 유지 | ⚠️ PART 1 글자가 시각으로 약간 좌측 치우침 (a4-master inside/outside mirror 영향) |
| QA 갤러리 LATEST 최신 PNG로 바뀜 | ✅ mtime 정렬 — `hwp-simply-classic-debug` 최상단 |

## 5. 남은 어색함

1. **PART 1 표지 가로 정렬 미세 어긋남**. `a4-master`의 inside/outside 양면 mirror 룰에 단면 인쇄 가정한 part-cover가 잡힘. `set page(margin: (x: 18mm, y: 18mm))` 같은 단면 마진 override 필요.
2. **passage 박스 닫힘 → 첫 question 사이 v-space 부족**. 박스 below=0이라 다음 문제 번호와 거리 가까움. 박스 below ~12pt 또는 첫 question above ~12pt 추가 권장.
3. **block(breakable: false)이 강해 column balance 어색**. 큰 문제가 column 끝에 못 들어가면 통째로 다음 column으로 넘어가 직전 column 하단 빈 공간. 첫 N개 선지(예: 3개)까지만 keep-together로 약화 검토.

## 6. 다음 수정 후보 (3개 이하)

1. **PART 표지 가로 마진 균등화** — part-cover chapter의 set page에서 단면 마진 override
2. **passage 박스 ↔ 첫 question 사이 v-space ~12pt**
3. **block keep 약화** — 첫 3개 선지까지만 keep, 나머지 자유 분할로 column balance 개선

(픽셀 diff는 보조 지표. 현 상태는 1차 베타 사용 가능 단계.)
