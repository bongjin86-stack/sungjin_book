# Claude Code 작업 지시서: PreviewPanel 동적 레이아웃 구현

> **프로젝트 경로:** `C:\projects\sungjin_book`  
> **작업 대상:** `web/components/PreviewPanel.tsx` 및 관련 훅  
> **레퍼런스:** `docs\research\atticus\ATTICUS_REFERENCE.md` + `docs\research\atticus\screenshots\` 폴더

---

## 작업 전 필수 확인

1. `docs\research\atticus\ATTICUS_REFERENCE.md` 파일을 먼저 읽어라.
2. `docs\research\atticus\screenshots\` 폴더의 다음 이미지들을 반드시 확인하라:
   - `atticus-typography-ui.webp` — 타이포그래피 설정 + 미리보기 패널 전체 구조
   - `atticus-trim-sizes-ui.webp` — 판형 선택 UI + 미리보기 패널
   - `atticus-print-layout-ui.webp` — 인쇄 레이아웃 설정 + 미리보기 패널
   - `atticus-header-footer-ui.webp` — 헤더/푸터 설정 + 미리보기 패널
   - `atticus-chapter-heading-ui.webp` — 챕터 헤딩 설정 + 미리보기 패널

---

## 현재 문제

`web/components/PreviewPanel.tsx`의 현재 구현은 `w-[75%]` + `aspectRatio` 방식으로,
패널 높이가 낮을 때 책이 아래로 잘리고 폰트 크기가 실제 책과 맞지 않는 문제가 있다.

---

## 구현 목표

Atticus의 미리보기 패널과 동일한 방식으로 동작하도록 재구현한다.

---

## 구현 사양

### 1. 크기 계산 로직 (`usePreviewLayout` 훅 신규 생성)

```typescript
// web/hooks/usePreviewLayout.ts

// 입력: 판형 규격 (mm), 패널 컨테이너 ref
// 출력: bookWidth(px), bookHeight(px), scaledFontSize(px), effectiveLineHeight(px)

// 계산 방식:
// 1. ResizeObserver로 패널 컨테이너 높이(H) 실시간 측정
// 2. bookHeight = H * 0.82  (상하 패딩 18% 제외)
// 3. bookWidth = bookHeight * (trimWidth / trimHeight)
// 4. scaleFactor = bookWidth / trimWidth  (mm → px 변환 계수)
// 5. scaledFontSize = fontSizePt * (96/72) * scaleFactor
// 6. effectiveLineHeight = scaledFontSize * lineSpacing
// 7. topMarginPx = bookHeight * 0.132  (상단 여백 비율)
// 8. bottomMarginPx = bookHeight * 0.145  (하단 여백 비율)
// 9. effectiveBodyHeight = bookHeight - topMarginPx - bottomMarginPx
// 10. linesPerPage = Math.floor(effectiveBodyHeight / effectiveLineHeight)
```

### 2. 페이지 분할 로직 (`usePagination` 훅 신규 생성)

```typescript
// web/hooks/usePagination.ts

// 입력: 본문 단락 배열, linesPerPage, scaledFontSize, bookWidth
// 출력: pages(단락 배열의 배열), currentPage, goNext, goPrev, goToPage

// 분할 방식 (단락 단위):
// - 각 단락의 예상 줄 수 = Math.ceil(단락 글자수 / 한 줄 글자수)
// - 한 줄 글자수 = Math.floor((bookWidth * 0.8) / scaledFontSize)  (좌우 여백 20% 제외)
// - 현재 페이지 누적 줄 수 + 단락 줄 수 > linesPerPage → 새 페이지 시작
// - 챕터 시작은 항상 새 페이지
```

### 3. PreviewPanel.tsx 수정

```
변경 전: w-[75%] + aspectRatio로 크기 결정
변경 후: usePreviewLayout 훅의 bookWidth, bookHeight(px)로 고정 크기 지정

레이아웃 구조:
┌─────────────────────────────────────────────┐
│  상단 툴바                                   │
│  [Print ▼]                        [기기 ▼]  │
├─────────────────────────────────────────────┤
│  패널 컨테이너 (flex-1, overflow-hidden)     │
│  ┌───────────────────────────────────────┐  │
│  │  책 프레임                             │  │
│  │  width: bookWidth px                  │  │
│  │  height: bookHeight px                │  │
│  │  background: #FBF7F0 (크림색)         │  │
│  │  padding: 계산된 여백                  │  │
│  │  overflow: hidden                     │  │
│  │                                       │  │
│  │  [현재 페이지 내용 렌더링]              │  │
│  └───────────────────────────────────────┘  │
│  (N pages)                                  │
├─────────────────────────────────────────────┤
│  하단 네비게이션                             │
│  [◄ Page] [Page ►]                          │
│  [◄ Chapter] [Chapter ►]                    │
├─────────────────────────────────────────────┤
│  [Export PDF] [Export ePub]                 │
└─────────────────────────────────────────────┘
```

### 4. 기기 전환 드롭다운

```typescript
type DeviceType = 'print' | 'ipad' | 'iphone';

const deviceAspectRatios = {
  print: null,  // 판형 비율 그대로 사용
  ipad: 3/4,    // iPad 비율
  iphone: 9/19.5  // iPhone 비율
};
```

---

## 금지 규칙 (절대 변경 금지)

1. 기존 `formatSettings` 상태 구조 변경 금지
2. 크림색 배경(`#FBF7F0`) 변경 금지
3. 기존 `TrimSize` 타입 정의 변경 금지
4. `web/store/` 폴더의 Zustand 스토어 구조 변경 금지
5. 윈도우 경로 기준으로 작업 (`C:\projects\sungjin_book`)

---

## 작업 순서

1. `ATTICUS_REFERENCE.md` 읽기
2. 스크린샷 이미지 확인 (특히 `atticus-typography-ui.webp`)
3. 현재 `PreviewPanel.tsx` 전체 읽기
4. 현재 `formatSettings` 타입 및 스토어 확인
5. `usePreviewLayout.ts` 훅 신규 작성
6. `usePagination.ts` 훅 신규 작성
7. `PreviewPanel.tsx` 리팩터링
8. 동작 확인 (책이 패널 안에 완전히 들어오는지, 페이지 이동이 되는지)

---

## 완료 기준

- [ ] 패널 크기를 조절해도 책이 잘리지 않음
- [ ] 판형 변경 시 책 비율이 즉시 반영됨
- [ ] 폰트 크기 변경 시 페이지 수가 재계산됨
- [ ] 페이지 이동 버튼이 동작함
- [ ] 기기 전환 드롭다운이 동작함
- [ ] 총 페이지 수가 표시됨
