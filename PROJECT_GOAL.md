# Sungjin Book — 프로젝트 목표 및 현재 구현 상태

> **어떤 AI에게 넘겨도 이 문서 하나로 프로젝트를 판단할 수 있도록 작성된 기준 문서.**  
> 경로: `C:\projects\sungjin_book\PROJECT_GOAL.md`  
> 최종 수정: 2026-05-19

---

## 1. 한 줄 목표

> **한국 작가가 원고를 쓰고, 즉시 출판 가능한 PDF/ePub을 만들 수 있는 웹 기반 책 편집 소프트웨어.**

---

## 2. 레퍼런스 제품

| 제품 | 특징 | 우리와의 관계 |
|------|------|-------------|
| **Atticus** | 웹 앱, $147 일회성, 영문 출판 표준 | 핵심 레퍼런스. UI 구조와 기능 범위를 따름 |
| **Vellum** | Mac 전용, 고품질 ePub | 비교 대상. 우리는 웹 기반으로 접근성 우위 |

Atticus 분석 자료: `docs\research\atticus\ATTICUS_REFERENCE.md`

---

## 3. 우리 제품이 Atticus와 다른 점

| 항목 | Atticus | 우리 제품 |
|------|---------|----------|
| 대상 언어 | 영어 | **한국어** |
| 판형 기준 | 미국 인치 표준 | **한국 출판 표준** (신국판, 46판 등) |
| 폰트 | 영문 폰트 | **한글 폰트** (나눔명조, 나눔고딕 등) |
| 들여쓰기 | 0.15 in | **1자 들여쓰기** (한국 관행) |
| 줄간격 기본값 | 1.5 | **1.8** (한글 가독성 기준) |
| 플랫폼 | 웹 앱 | **웹 앱** (동일) |

---

## 4. 전체 기능 범위 (완성 목표)

### 4.1 Writing 탭 (원고 작성)
- 블록 기반 에디터 (BlockNote 사용)
- 챕터 추가 / 순서 변경 (드래그 앤 드롭)
- Front Matter: 속표지, 목차, 서문, 헌정사, 프롤로그, 추천사
- Back Matter: 저자 소개, 에필로그, 감사의 글, 참고문헌
- 간지(Interlude) 삽입
- 자동 저장 (localStorage)

### 4.2 Formatting 탭 (조판 설정)
Atticus의 사이드바 메뉴 구조를 따름:

```
Chapter Heading   — 챕터 번호 표시 방식, 챕터 제목 폰트/크기/정렬
Paragraph         — 들여쓰기, 첫 단락 들여쓰기 예외
Subheading        — 소제목 스타일
Scene Break       — 장면 전환 구분자 (*, ─, 없음)
Notes             — 각주/미주
Print Layout      — 여백 (안쪽/바깥쪽), 정렬(양끝), 하이픈
Typography        — 폰트, 크기(9~18pt), 줄간격
Header/Footer     — 머리글/꼬리글 레이아웃 프리셋, 폰트
Trim Sizes        — 판형 선택 (한국 표준 + 국제 표준)
```

### 4.3 미리보기 패널 (Preview Panel)
- 에디터 우측에 항상 표시
- 선택된 판형의 실제 비율로 책 프레임 렌더링
- 폰트 크기/줄간격 설정이 실시간 반영
- 페이지 분할: 내용이 한 페이지를 넘으면 다음 페이지로 분할
- 페이지 이동: `◄ Page` / `Page ►` / `◄ Chapter` / `Chapter ►`
- 기기 전환: Print / Kindle / iPad / 스마트폰
- 총 페이지 수 표시 (예: "76 pages")

### 4.4 내보내기
- PDF 내보내기 (인쇄 품질, 판형 기준)
- ePub 내보내기 (전자책)

---

## 5. 현재 구현 상태 (2026-05-19 기준)

### 완료된 것

| 기능 | 상태 | 파일 |
|------|------|------|
| 온보딩 화면 (책 제목/저자/판형 입력) | ✅ 완료 | `components/onboarding/BookSetupScreen.tsx` |
| 에디터 레이아웃 (좌우 분할) | ✅ 완료 | `components/editor/EditorLayout.tsx` |
| 사이드바 Writing/Formatting 탭 | ✅ 완료 | `components/editor/Sidebar.tsx` |
| 챕터 추가/편집 (BlockNote 에디터) | ✅ 완료 | `components/editor/ChapterForm.tsx` |
| 챕터 목록 + 드래그 순서 변경 | ✅ 완료 | `components/editor/Sidebar.tsx` |
| 자동 저장 (localStorage) | ✅ 완료 | `hooks/useBookStore.ts` |
| 미리보기 패널 기본 구조 | ✅ 완료 | `components/editor/PreviewPanel.tsx` |
| 기기 전환 드롭다운 (Print/Kindle/iPad/스마트폰) | ✅ 완료 | `components/editor/PreviewPanel.tsx` |
| 판형 비율 유지 (신국판/46배판/문고판) | ✅ 완료 | `components/editor/PreviewPanel.tsx` |
| 여백 상수 (판형별 top/bottom/inner/outer) | ✅ 완료 | `components/editor/PreviewPanel.tsx` |
| 드롭 캡 (첫 글자 장식) | ✅ 완료 | `components/editor/Sidebar.tsx` |
| 장면 전환 구분자 옵션 | ✅ 완료 | `components/editor/Sidebar.tsx` |

### 미완료 / 버그 있는 것

| 기능 | 문제 | 우선순위 |
|------|------|---------|
| **미리보기 크기 계산** | 현재 `w-[75%] + aspectRatio` 방식 → 패널 높이가 낮으면 책이 아래로 잘림 | 🔴 높음 |
| **미리보기 여백** | 하단 여백이 제대로 적용되지 않음 (padding % 계산 오류) | 🔴 높음 |
| **페이지 분할** | 미구현 — 내용이 길어도 한 페이지에 모두 표시됨 | 🔴 높음 |
| **페이지 이동 버튼** | 미구현 | 🟡 중간 |
| **총 페이지 수 표시** | 미구현 | 🟡 중간 |
| Formatting 탭 세분화 | 현재 단순 토글/필 그룹 나열. Atticus처럼 섹션별 패널로 분리 필요 | 🟡 중간 |
| 폰트 슬라이더 | 현재 3단계 필 그룹. Atticus처럼 연속 슬라이더로 변경 필요 | 🟡 중간 |
| Header/Footer 레이아웃 프리셋 | 미구현 | 🟢 낮음 |
| PDF 내보내기 | 미구현 | 🟢 낮음 |
| ePub 내보내기 | 미구현 | 🟢 낮음 |

---

## 6. 미리보기 패널 — 올바른 구현 방식 (현재 작업 중)

### 문제의 원인

현재 코드:
```tsx
<div className="w-[75%] min-w-[140px]">
  <PrintFrame ratio={ratio} ... />  {/* aspectRatio로 높이 결정 */}
</div>
```

이 방식은 **너비 기준**으로 높이를 결정한다.  
패널 높이가 낮으면 계산된 높이가 패널을 초과하여 책이 아래로 잘린다.

### 올바른 구현 방식 (목표)

**높이 기준**으로 너비를 결정해야 한다:

```
1. ResizeObserver로 패널 컨테이너 높이(H) 측정
2. bookHeight = H × 0.82  (상하 패딩 18% 제외)
3. bookWidth = bookHeight × (판형 가로mm / 판형 세로mm)
4. scaledFontSize = fontSizePt × (96/72) × (bookWidth / 판형가로mm)
5. linesPerPage = floor(유효본문높이 / (scaledFontSize × lineSpacing))
6. 단락 단위로 페이지 배열 분할
```

### 올바른 여백 적용 방식

현재 여백은 `padding %` (부모 너비 기준)로 적용되어 있어 오류가 있다.  
올바른 방식: 계산된 `bookWidth`, `bookHeight` (px)를 기준으로 절대값(px)으로 적용.

```
판형 여백 기준 (절대 변경 금지):
  신국판 (152×225mm): top 20mm / bottom 22mm / inner 20mm / outer 16mm
  46배판 (188×257mm): top 22mm / bottom 25mm / inner 22mm / outer 18mm
  문고판 (105×148mm): top 14mm / bottom 16mm / inner 14mm / outer 12mm

px 변환: marginPx = marginMm × (bookHeightPx / 판형세로mm)
```

---

## 7. 데이터 구조 (타입 정의)

**파일:** `web/types/book.ts`

### TrimSize (판형)
```typescript
type TrimSize = "신국판" | "46배판" | "문고판";
// 신국판: 152 × 225mm
// 46배판: 188 × 257mm  
// 문고판: 105 × 148mm
```

### BookOptions (조판 설정)
```typescript
interface BookOptions {
  theme: "classic" | "modern" | "minimal";
  bodyFont: "serif" | "sans";
  bodyFontSize: "9pt" | "10pt" | "11pt";
  lineSpacing: "narrow" | "normal" | "wide";
  showPageNumber: boolean;
  pageNumberPosition: "bottom-outside" | "bottom-center" | "top-outside";
  hideChapterStartPageNumber: boolean;
  paragraphIndent: boolean;
  dropCaps: boolean;
  sceneBreakStyle: "asterisk" | "line" | "none";
  showChapterNumber: boolean;
  // ... (기타 메타 옵션)
}
```

### BlockType (블록 종류)
```typescript
type BlockType =
  | "chapter" | "interlude"          // 본문
  | "half-title" | "toc" | "preface" | "dedication" | "prologue" | "blurb"  // Front Matter
  | "author-bio" | "epilogue" | "acknowledgments" | "bibliography";          // Back Matter
```

---

## 8. 기술 스택

| 항목 | 기술 |
|------|------|
| 프레임워크 | Next.js 14 (App Router) |
| UI | React + TypeScript + TailwindCSS |
| 에디터 | BlockNote |
| 상태 관리 | React useState + localStorage (useBookStore 커스텀 훅) |
| 드래그 앤 드롭 | @dnd-kit |
| 배포 | Vercel |

---

## 9. 코드 규칙 (절대 변경 금지)

1. **여백 상수** (`TRIM_PADDING`)는 출판 표준 기반 — 임의 변경 금지
2. **크림색 배경** `#FAFAFA` (인쇄본 종이색) — 변경 금지
3. **`BookOptions` 타입 구조** — 하위 호환성 유지 필요
4. **`DEFAULT_OPTIONS`** — 변경 시 기존 저장 데이터 깨짐
5. **윈도우 경로 기준**: `C:\projects\sungjin_book`

---

## 10. AI에게 판단 기준 제공

이 프로젝트의 코드나 UI를 평가할 때 다음 기준으로 판단하라:

### 미리보기 패널이 올바른지 확인하는 방법
- [ ] 패널 높이를 줄여도 책 하단이 잘리지 않는가?
- [ ] 책의 가로:세로 비율이 선택된 판형과 일치하는가?
- [ ] 상단/하단/안쪽/바깥쪽 여백이 모두 보이는가?
- [ ] 내용이 길면 페이지가 분할되는가?
- [ ] 페이지 이동 버튼이 동작하는가?

### Formatting 탭이 올바른지 확인하는 방법
- [ ] Atticus의 사이드바 메뉴 구조(8개 섹션)를 따르는가?
- [ ] 폰트 크기가 슬라이더로 세밀하게 조정 가능한가?
- [ ] 설정 변경이 미리보기에 즉시 반영되는가?

### 전체 품질 기준
- [ ] 한국어 폰트(나눔명조 등)가 올바르게 렌더링되는가?
- [ ] 한국 판형(신국판 152×225mm)이 기본값인가?
- [ ] 1자 들여쓰기가 기본으로 적용되는가?

---

*이 문서는 Manus가 관리하며, 주요 구현 변경 시 업데이트됩니다.*
