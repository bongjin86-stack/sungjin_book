# 에디터 레이아웃 개선: 에디터와 미리보기 나란히 배치 및 기기 전환 기능

현재 에디터 레이아웃의 문제를 해결하고, Atticus/Vellum 스타일의 직관적인 UI로 개편합니다.

## 1. 목표
- 에디터 카드와 미리보기 패널을 가운데 영역(`flex-1`)에 나란히 배치합니다.
- 미리보기 패널 하단에 인쇄본/전자책 기기 전환 드롭다운을 추가합니다.
- 기기 선택에 따라 미리보기 프레임의 모양과 비율이 변경되도록 구현합니다.

## 2. 상세 구현 지시

### 2.1. `types/book.ts` 수정
미리보기 기기 타입을 추가합니다. (이 상태는 에디터 UI 상태이므로 `BookOptions`에 저장하지 않고 로컬 상태로 관리해도 되지만, 타입 정의는 필요합니다.)

```typescript
export type PreviewDevice = "print" | "kindle" | "ipad" | "smartphone";
```

### 2.2. `components/editor/EditorLayout.tsx` 수정
가운데 영역을 두 컬럼으로 나눕니다.

- **기존 구조:**
  ```tsx
  <div className="flex flex-1 overflow-hidden">
    <Sidebar />
    <div className="flex-1 overflow-y-auto ...">
      <ChapterForm />
    </div>
    <BookPreviewPanel />
  </div>
  ```
- **변경 구조:**
  ```tsx
  <div className="flex flex-1 overflow-hidden">
    <Sidebar />
    {/* 가운데 영역: 에디터 + 미리보기 나란히 */}
    <div className="flex-1 flex overflow-hidden bg-bg">
      {/* 에디터 영역 (스크롤) */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center px-6 pt-6 pb-24">
        <ChapterForm />
      </div>
      {/* 미리보기 패널 (고정) */}
      <BookPreviewPanel />
    </div>
  </div>
  ```

### 2.3. `components/editor/PreviewPanel.tsx` 전면 수정
미리보기 패널을 고정 너비(`w-[280px]`)로 설정하고, 하단에 기기 전환 드롭다운을 추가합니다.

- **상태 관리:**
  ```tsx
  const [device, setDevice] = useState<PreviewDevice>("print");
  ```

- **기기별 프레임 렌더링 로직:**
  - `device === "print"`: 기존 인쇄본 로직 유지 (선택된 `trim` 비율 적용, 제본선 음영 표시).
  - `device === "kindle"`: 비율 약 3:4, 회색 베젤, 둥근 모서리, 내부 배경 흰색/밝은 회색.
  - `device === "ipad"`: 비율 약 3:4, 검은 베젤, 둥근 모서리.
  - `device === "smartphone"`: 비율 약 9:19.5, 검은 베젤, 세로로 긴 형태.

- **프레임 크기 고정:**
  책/기기 프레임의 너비를 `160px`로 고정하고, 높이는 비율에 따라 자동 계산되도록 합니다. (패널 안에서 중앙 정렬)

- **하단 드롭다운 UI:**
  패널 하단(또는 상단 툴바)에 `<select>` 태그를 사용하여 기기를 전환할 수 있도록 합니다.

  ```tsx
  <select
    value={device}
    onChange={(e) => setDevice(e.target.value as PreviewDevice)}
    className="bg-transparent text-[11px] text-[#BBB] outline-none cursor-pointer"
  >
    <optgroup label="인쇄본">
      <option value="print">{trim} ({TRIM_SIZE_LABEL[trim]})</option>
    </optgroup>
    <optgroup label="전자책">
      <option value="kindle">Kindle Paperwhite</option>
      <option value="ipad">iPad</option>
      <option value="smartphone">스마트폰</option>
    </optgroup>
  </select>
  ```

### 2.4. `components/editor/ChapterForm.tsx` 수정 (선택 사항)
에디터 카드가 화면을 더 잘 채우도록 `min-h`를 조정하거나, 필요하다면 `flex-1`을 주어 카드가 세로로 꽉 차게 만들 수 있습니다. (현재는 `min-h-[260px]` 유지해도 무방)

## 3. 주의 사항 (금지 규칙)
- 기존의 한국 단행본 출판 규격 여백(신국판, 46배판, 문고판) 수치는 **절대 임의로 변경하거나 삭제하지 마세요.**
- `BookOptions`의 기존 필드들을 임의로 삭제하지 마세요.
- Tailwind CSS 클래스 사용 시, `tailwind.config.ts`에 정의되지 않은 임의의 색상(예: `bg-accent-light/30`)을 사용하지 마세요.

## 4. 작업 완료 후
- `npx next build`를 실행하여 타입 오류나 빌드 오류가 없는지 반드시 확인하세요.
- 오류가 없다면 `git push origin main`으로 변경 사항을 푸시하세요.
