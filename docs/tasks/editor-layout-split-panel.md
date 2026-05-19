# 작업 지시서: 에디터 레이아웃 → 좌우 분할 패널 구조로 변경

> 기준 커밋: `66a9139`  
> 담당: Claude Code  
> 우선순위: High

---

## 배경 및 목적

현재 에디터는 **에디터 카드 아래에 인라인 미리보기**가 붙어 있는 구조다.  
Vellum, Atticus 등 업계 표준 도구는 모두 **왼쪽 에디터 + 오른쪽 고정 미리보기 패널** 분할 구조를 사용한다.  
이 방식이 글을 쓰면서 실시간으로 책 모양을 확인하는 데 훨씬 자연스럽다.

---

## 변경 목표

```
[왼쪽 사이드바 240px] | [에디터 영역 flex-1, 무한 스크롤] | [오른쪽 미리보기 패널 300px, 고정]
```

- 에디터 영역: 글 길이에 따라 **자연스럽게 늘어나는 무한 스크롤** (h-[420px] 고정 제거)
- 오른쪽 패널: **판형 비율 책 프레임** 고정 표시, 에디터 타이핑 시 실시간 반영
- 오른쪽 패널은 **항상 표시** (토글 없음)

---

## 수정 파일 목록

### 1. `web/components/editor/ChapterForm.tsx`

**변경 내용:**
- 본문 영역 `h-[420px] overflow-y-auto` → **`min-h-[260px]`** 으로 되돌림
- BlockNote 에디터가 글 길이에 따라 자연스럽게 늘어나도록 허용
- 나머지 코드는 그대로 유지

---

### 2. `web/components/editor/EditorLayout.tsx`

**변경 내용:**

현재 구조:
```tsx
<div className="flex-1 overflow-y-auto flex flex-col items-center px-6 pt-11 pb-32 bg-bg">
  <ChapterForm ... />
  <InlinePreview ... />   {/* ← 이걸 제거 */}
</div>
```

변경 후 구조:
```tsx
{/* 에디터 + 오른쪽 미리보기 패널을 나란히 배치 */}
<div className="flex flex-1 overflow-hidden">
  {/* 왼쪽: 에디터 영역 */}
  <div className="flex-1 overflow-y-auto flex flex-col items-center px-6 pt-11 pb-32 bg-bg">
    <ChapterForm ... />
  </div>

  {/* 오른쪽: 책 미리보기 패널 */}
  <BookPreviewPanel
    options={meta.options}
    trim={meta.trim}
    previewContent={previewContent}
  />
</div>
```

- `InlinePreview` import 및 사용 제거
- `BookPreviewPanel` import 추가 (아래에서 신규 생성)

---

### 3. `web/components/editor/PreviewPanel.tsx`

**변경 내용:**

기존 `InlinePreview` 컴포넌트를 **`BookPreviewPanel`** 로 교체.  
`PreviewPanel` no-op 함수는 삭제해도 됨 (더 이상 import하는 곳 없음).

**새 컴포넌트 스펙:**

```tsx
// BookPreviewPanel — 오른쪽 고정 패널
// 너비: w-[300px], flex-shrink-0
// 배경: bg-[#1C1C1E] (다크, Vellum/Atticus 스타일)
// 내부: 세로 중앙 정렬, 책 프레임 표시
```

**패널 구조 (위→아래):**
1. 상단 툴바 (높이 40px)
   - 왼쪽: 판형 이름 텍스트 (예: "신국판 152×225")
   - 오른쪽: 기기 선택 드롭다운 (현재는 "인쇄본" 고정 텍스트만, 기능 미구현)
2. 책 프레임 영역
   - 세로 중앙 정렬
   - 판형 비율(aspect-ratio)로 책 프레임 렌더링
   - 판형별 여백은 아래 수치 사용 (기존 `TRIM_PADDING` 그대로)
   - 책 프레임 최대 너비: `w-[220px]` (패널 300px 안에서 좌우 여백 확보)
3. 하단: 페이지 번호 네비게이션 (현재는 "1 / 1" 텍스트만, 기능 미구현)

**판형별 여백 수치 (기존 코드에서 그대로 가져올 것):**
```ts
const TRIM_PADDING = {
  "신국판": { top: "13.2%", bottom: "14.5%", inner: "13.2%", outer: "10.5%" },
  "46배판": { top: "11.7%", bottom: "13.3%", inner: "11.7%", outer: "9.6%"  },
  "문고판": { top: "13.3%", bottom: "15.2%", inner: "13.3%", outer: "11.4%" },
};
```

**책 프레임 내부 렌더링:**
- 기존 `InlinePreview`의 책 프레임 내부 렌더링 코드를 그대로 재사용
- 빈 상태 안내 문구, 챕터 번호, 제목, 본문, 쪽번호 모두 동일하게 유지

**export 구조:**
```ts
export { BookPreviewPanel };
// InlinePreview는 삭제 또는 BookPreviewPanel의 alias로 유지
```

---

### 4. `web/components/editor/Sidebar.tsx`

변경 없음.

---

### 5. `web/components/editor/Header.tsx`

변경 없음.

---

## 체크리스트

- [ ] `ChapterForm` 본문 영역 고정 높이 제거 → 무한 스크롤
- [ ] `EditorLayout` 에서 `InlinePreview` 제거, `BookPreviewPanel` 오른쪽에 배치
- [ ] `BookPreviewPanel` 다크 배경 패널 + 판형 비율 책 프레임 구현
- [ ] 타이핑 시 오른쪽 패널 실시간 반영 확인 (기존 `onChange` 콜백 그대로)
- [ ] `npx next build` 오류 없음 확인
- [ ] `git commit -m "feat: 에디터 좌우 분할 레이아웃 적용"` 후 `git push origin main`

---

## 참고 이미지

- Vellum: 왼쪽 에디터(흰 배경) + 오른쪽 다크 배경 패널 안에 기기 프레임
- Atticus: 왼쪽 에디터(흰 카드) + 오른쪽 다크 배경 패널 안에 iPad 프레임

우리는 기기 프레임 대신 **실제 책 판형 프레임(종이 질감)**을 사용한다.
