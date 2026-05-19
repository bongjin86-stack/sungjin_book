# 작업 지시서: Writing/Formatting 탭 분리 + 미리보기 패널 사이즈 수정

> 기준 커밋: 현재 main HEAD  
> 담당: Claude Code  
> 우선순위: High

---

## 작업 1 — 오른쪽 미리보기 패널 책 프레임 사이즈 수정

### 문제

`PreviewPanel.tsx`의 `BookPreviewPanel` 안에서 책 프레임이 `max-w-[220px]`로 고정되어 있어 패널(300px) 안에서 너무 작게 보인다. 세로 중앙 정렬은 되어 있지만 책 프레임이 패널 높이를 충분히 활용하지 못하고 있다.

### 수정 방법

`PreviewPanel.tsx` 파일에서 책 프레임 wrapper div를 찾아 수정:

**현재:**
```tsx
<div className="flex-1 flex items-center justify-center px-4 py-6 overflow-hidden">
  <div className="relative w-full max-w-[220px]" style={{ aspectRatio: `${ratio}` }}>
```

**변경 후:**
```tsx
<div className="flex-1 flex items-center justify-center px-5 py-5 overflow-hidden">
  {/*
    높이 기준으로 책 크기를 결정한다.
    패널 높이(flex-1)에서 상하 padding(py-5 = 40px)과 상하 툴바(h-10 × 2 = 80px)를 빼면
    실제 사용 가능 높이 ≈ 전체 화면 높이 - 헤더(54px) - 상태바(32px) - 툴바(80px) - 패딩(40px).
    책 프레임은 이 높이의 90%를 사용하고, 너비는 aspect-ratio로 자동 계산.
    max-w는 패널 너비(300px) - 좌우 패딩(40px) = 260px로 제한.
  */}
  <div
    className="relative"
    style={{
      aspectRatio: `${ratio}`,
      height: "min(90%, calc(90vh - 220px))",
      maxWidth: "260px",
      width: "auto",
    }}
  >
```

---

## 작업 2 — Writing / Formatting 탭 분리 구조 도입

### 목표

Atticus처럼 에디터 상단(또는 왼쪽 사이드바 상단)에 **Writing / Formatting 탭**을 추가한다.

- **Writing 탭 (기본):** 현재와 동일 — 왼쪽 사이드바에 목차(TOC)만 표시, 중앙에 에디터
- **Formatting 탭:** 왼쪽 사이드바에 포맷 옵션 전체 표시, 중앙에는 "포맷 설정 중" 안내 텍스트 (에디터 숨김)

### 탭 위치

`Sidebar.tsx` 상단에 탭 두 개를 추가한다. 탭은 사이드바 내부 최상단에 위치.

```
┌─────────────────────────┐
│  ✏️ 집필    🎨 포맷팅    │  ← 탭 (사이드바 상단)
├─────────────────────────┤
│  [집필 탭 선택 시]       │
│  목차 네비게이션만 표시   │
│                         │
│  [포맷팅 탭 선택 시]     │
│  기존 옵션 패널 전체 표시 │
│  (테마/폰트/여백 등)     │
└─────────────────────────┘
```

### 수정 파일: `web/components/editor/Sidebar.tsx`

#### 변경 내용

1. `Sidebar` 컴포넌트 내부에 `activeTab: "writing" | "formatting"` 상태 추가 (기본값: `"writing"`)

2. 사이드바 최상단에 탭 UI 추가:
```tsx
{/* 탭 */}
<div className="flex border-b border-border flex-shrink-0">
  <button
    type="button"
    onClick={() => setActiveTab("writing")}
    className={`flex-1 py-[10px] text-[12px] font-semibold transition-colors ${
      activeTab === "writing"
        ? "text-accent border-b-2 border-accent bg-accent-light/30"
        : "text-text-muted hover:text-text-secondary"
    }`}
  >
    ✏️ 집필
  </button>
  <button
    type="button"
    onClick={() => setActiveTab("formatting")}
    className={`flex-1 py-[10px] text-[12px] font-semibold transition-colors ${
      activeTab === "formatting"
        ? "text-accent border-b-2 border-accent bg-accent-light/30"
        : "text-text-muted hover:text-text-secondary"
    }`}
  >
    🎨 포맷팅
  </button>
</div>
```

3. 탭에 따라 내용 조건부 렌더링:
   - `activeTab === "writing"` → **목차(TOC) 섹션만** 표시 (현재 하단 TOC 부분)
   - `activeTab === "formatting"` → **옵션 패널만** 표시 (현재 상단 Options 부분)

4. 기존 코드에서 Options 섹션과 TOC 섹션을 분리하여 각 탭에 배치

---

## 작업 3 — Formatting 탭에 새 옵션 추가

### `web/types/book.ts` 수정

`BookOptions` 인터페이스에 다음 필드 추가:

```ts
// 챕터 스타일 옵션 (호불호 → 토글)
dropCaps: boolean;          // 첫 글자 드롭 캡 (기본: false)
sceneBreakStyle: "asterisk" | "line" | "none";  // 장면 전환 구분자 (기본: "asterisk")
```

`DEFAULT_OPTIONS`에도 추가:
```ts
dropCaps: false,
sceneBreakStyle: "asterisk",
```

`THEME_PRESETS`에는 추가하지 않아도 됨 (테마와 무관한 개인 취향 옵션).

---

### `web/components/editor/Sidebar.tsx` — Formatting 탭 옵션 패널에 추가

기존 "조판 · 고급" 아코디언 안에 다음 항목 추가:

```tsx
{/* 챕터 스타일 */}
<div className="text-[10px] font-bold text-text-muted uppercase tracking-[0.7px] mt-3 mb-2">
  챕터 스타일
</div>
<ToggleRow
  label="드롭 캡 (첫 글자 장식)"
  checked={options.dropCaps}
  onChange={(v) => onChangeOptions({ dropCaps: v })}
/>
<PillGroup
  label="장면 전환 구분자"
  value={options.sceneBreakStyle}
  options={[
    { value: "asterisk", label: "* * *" },
    { value: "line", label: "───" },
    { value: "none", label: "없음" },
  ]}
  onChange={(v) => onChangeOptions({ sceneBreakStyle: v })}
/>
```

---

### `web/components/editor/PreviewPanel.tsx` — Drop Caps 미리보기 반영

`BookPreviewPanel` 내부 본문 렌더링 부분에서 Drop Caps 적용:

```tsx
{paragraphs.map((p, i) => (
  <p
    key={i}
    style={{
      textIndent: options.paragraphIndent && i > 0 ? "1em" : "0",
      margin: 0,
      // Drop Caps: 첫 번째 단락 첫 글자에만 적용
      // CSS ::first-letter는 inline style로 못 씀 → className으로 처리
    }}
    className={options.dropCaps && i === 0 ? "drop-caps-para" : ""}
  >
    {p}
  </p>
))}
```

그리고 `web/app/globals.css` (또는 해당 CSS 파일)에 추가:
```css
.drop-caps-para::first-letter {
  float: left;
  font-size: 3.2em;
  line-height: 0.82;
  margin-right: 0.06em;
  margin-top: 0.04em;
  font-family: serif;
  font-weight: bold;
  color: #1F1B16;
}
```

---

## 체크리스트

- [ ] `PreviewPanel.tsx` — 책 프레임 높이 기준 크기 조정 (`max-w-[220px]` → 높이 기준)
- [ ] `book.ts` — `dropCaps`, `sceneBreakStyle` 필드 추가
- [ ] `Sidebar.tsx` — Writing/Formatting 탭 UI 추가 및 조건부 렌더링
- [ ] `Sidebar.tsx` — Formatting 탭에 드롭 캡, 장면 전환 구분자 옵션 추가
- [ ] `PreviewPanel.tsx` — Drop Caps CSS 클래스 적용
- [ ] `globals.css` — `.drop-caps-para::first-letter` 스타일 추가
- [ ] `npx next build` 오류 없음 확인
- [ ] `git commit -m "feat: Writing/Formatting 탭 분리 + Drop Caps + 미리보기 패널 수정"` 후 `git push origin main`

---

## 주의사항

- `sceneBreakStyle`은 이번에 타입과 옵션 UI만 추가. 실제 에디터에서 Scene Break 블록 삽입 기능은 다음 작업에서 구현.
- Drop Caps는 미리보기 패널에서만 시각적으로 반영. 에디터(BlockNote) 내부에는 적용하지 않음.
- 기존 옵션(`showChapterNumber`, `paragraphIndent` 등)은 그대로 유지.
