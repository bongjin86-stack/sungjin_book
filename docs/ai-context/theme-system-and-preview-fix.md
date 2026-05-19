# 성진북스 테마 시스템 설계 및 미리보기 버그 수정 지시서

## 1. 미리보기 패널(PreviewPanel.tsx) 버그 수정

현재 미리보기 패널에서 텍스트가 종이 끝에 붙어 나오는 문제와 챕터 번호 렌더링 오류를 수정합니다.

### 1.1. 여백(Padding) 수정
`PreviewPanel.tsx`의 본문 영역 `padding`을 `%` 단위에서 명확한 `px` 단위로 변경합니다. 신국판(152x225) 비율에 맞춰 시각적으로 안정적인 여백을 제공해야 합니다.

**수정 전:**
```tsx
paddingTop: "10%",
paddingBottom: "12%",
paddingLeft: "13%",
paddingRight: "11%",
```

**수정 후:**
```tsx
paddingTop: "32px",
paddingBottom: "36px",
paddingLeft: "38px",
paddingRight: "32px",
```

### 1.2. 챕터 번호 렌더링 수정
챕터 번호가 `1111111`처럼 비정상적으로 렌더링되는 문제를 수정합니다. `chapterNum` 변수의 값을 올바르게 파싱하여 표시해야 합니다.

**수정 전:**
```tsx
{options.showChapterNumber && (
  <div
    className="text-center font-bold mb-[6px]"
    style={{ fontFamily: "sans-serif", fontSize: "11px", color: "#111" }}
  >
    제 {chapterNum.replace(/장$/, "")} 장
  </div>
)}
```

**수정 후:**
```tsx
{options.showChapterNumber && (
  <div
    className="text-center font-bold mb-[6px]"
    style={{ fontFamily: "sans-serif", fontSize: "11px", color: "#111" }}
  >
    {chapterNum}
  </div>
)}
```

---

## 2. 테마 시스템(Theme System) 도입

Vellum과 Atticus의 성공적인 UX를 벤치마킹하여, 개별 옵션을 하나씩 설정하는 대신 "테마"를 선택하면 관련 옵션들이 한 번에 적용되는 시스템을 도입합니다.

### 2.1. `book.ts` 타입 확장
`BookOptions`에 `theme` 속성을 추가하고, 테마별 기본값을 정의합니다.

```typescript
// web/types/book.ts

export type BookTheme = "classic" | "modern" | "minimal";

export interface BookOptions {
  theme: BookTheme; // 테마 속성 추가
  // ... 기존 옵션들 ...
}

export const THEME_PRESETS: Record<BookTheme, Partial<BookOptions>> = {
  classic: {
    bodyFont: "serif",
    bodyFontSize: "10pt",
    lineSpacing: "normal",
    showPageNumber: true,
    pageNumberPosition: "bottom-outside",
    showChapterNumber: true,
    paragraphIndent: true,
  },
  modern: {
    bodyFont: "sans",
    bodyFontSize: "10pt",
    lineSpacing: "wide",
    showPageNumber: true,
    pageNumberPosition: "bottom-center",
    showChapterNumber: true,
    paragraphIndent: false,
  },
  minimal: {
    bodyFont: "serif",
    bodyFontSize: "9pt",
    lineSpacing: "normal",
    showPageNumber: false,
    pageNumberPosition: "bottom-center",
    showChapterNumber: false,
    paragraphIndent: true,
  },
};

export const DEFAULT_OPTIONS: BookOptions = {
  theme: "classic",
  ...THEME_PRESETS.classic,
  // ... 나머지 기본값 ...
};
```

### 2.2. `Sidebar.tsx` UI 수정
사이드바 최상단에 "테마 선택" UI를 추가합니다. 테마를 선택하면 `THEME_PRESETS`에 정의된 값들로 하위 세부 옵션들이 자동으로 업데이트되어야 합니다.

- **테마 선택 UI:** `PillGroup` 컴포넌트를 사용하여 "클래식", "모던", "미니멀" 테마를 선택할 수 있게 합니다.
- **상호작용:** 테마를 변경하면 `updateOptions`를 호출하여 해당 테마의 프리셋 값들로 전체 옵션을 덮어씁니다.
- **세부 조정:** 고객은 테마 선택 후에도 하단의 세부 옵션(폰트, 줄간격 등)을 개별적으로 변경할 수 있어야 합니다. (이 경우 테마는 '사용자 정의' 상태가 되거나, 선택된 테마 UI를 유지하되 값만 변경되도록 처리)

---

## 3. 작업 지시 요약 (Claude Code용)

1. `PreviewPanel.tsx`의 여백(padding)을 px 단위로 수정하고, 챕터 번호 렌더링 버그를 수정하세요.
2. `book.ts`에 `BookTheme` 타입과 `THEME_PRESETS`를 추가하여 테마 시스템의 기반을 마련하세요.
3. `Sidebar.tsx`에 테마 선택 UI를 추가하고, 테마 변경 시 세부 옵션들이 자동으로 연동되도록 구현하세요.
4. 로컬에서 `pnpm dev`로 테스트하여 테마 변경 시 미리보기 패널이 즉각적으로 반응하는지, 여백과 챕터 번호가 정상적으로 표시되는지 확인하세요.
5. 검증 완료 후 GitHub `main` 브랜치에 Push 하세요. (커밋 메시지: `feat: 테마 시스템 도입 및 미리보기 패널 버그 수정`)
