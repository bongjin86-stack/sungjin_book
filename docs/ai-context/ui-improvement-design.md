# 성진북스 웹 UI 개선 지시서 (Claude Code)

**작성일**: 2026-05-19  
**작성자**: Manus  
**대상**: Claude Code (실행 에이전트)

이 문서는 성진북스 웹 에디터의 "미리보기 패널(PreviewPanel)"을 실제 책(신국판) 비율에 맞게 개선하고, "사이드바(Sidebar)"에 설정 시스템 옵션들을 연결하는 작업 지시서입니다.

---

## 1. 미리보기 패널 (PreviewPanel.tsx) 개선

현재의 단순 텍스트 나열 방식에서, 실제 신국판(152x225mm) 비율의 종이 느낌이 나도록 CSS를 조정합니다. (정확도 90~95% 목표)

### 1.1. 종이 컨테이너 스타일링
*   **비율 고정**: `aspect-ratio: 152/225` 적용
*   **여백 (Margin)**: Typst 설정과 유사하게 상하좌우 패딩 적용 (예: `pt-[10%] pb-[12%] px-[12%]`)
*   **그림자 및 배경**: 실제 종이처럼 보이도록 `bg-white shadow-md` 유지

### 1.2. 타이포그래피 및 줄간격
*   **본문 폰트**: `font-serif` (Noto Serif KR 적용)
*   **본문 크기**: `text-[13px]` (10pt와 유사한 크기)
*   **줄간격**: `leading-[1.8]` (18pt와 유사한 비율)
*   **들여쓰기**: `paragraphIndent` 옵션이 켜져 있을 경우, 첫 단락 제외하고 `text-indent: 1em` 적용 (CSS `p + p { text-indent: 1em; }` 활용)
*   **양끝 정렬**: `text-justify` 적용

### 1.3. 쪽번호 및 챕터 헤더
*   **챕터 헤더**: `showChapterNumber` 옵션에 따라 "제 N 장" 표시
*   **쪽번호**: 하단에 절대 위치(`absolute bottom-[5%]`)로 배치. `pageNumberPosition` 옵션에 따라 좌/우/가운데 정렬.

---

## 2. 사이드바 (Sidebar.tsx) 옵션 패널 확장

`BookOptions`에 추가된 7가지 옵션을 사용자가 직접 제어할 수 있도록 UI를 추가합니다.

### 2.1. 추가할 UI 컨트롤
기존 `ToggleRow` 컴포넌트를 활용하거나 새로운 Select/Radio 버튼 그룹을 만듭니다.

*   **본문 폰트 (`bodyFont`)**: 바탕체(serif) / 돋움체(sans) 선택 (버튼 그룹)
*   **본문 크기 (`bodyFontSize`)**: 9pt / 10pt / 11pt 선택 (버튼 그룹)
*   **줄간격 (`lineSpacing`)**: 좁게(narrow) / 보통(normal) / 넓게(wide) 선택 (버튼 그룹)
*   **쪽번호 표시 (`showPageNumber`)**: 토글 스위치
*   **쪽번호 위치 (`pageNumberPosition`)**: 바깥쪽 하단 / 가운데 하단 / 바깥쪽 상단 선택 (Select 또는 버튼 그룹)
*   **챕터 시작 쪽번호 숨김 (`hideChapterStartPageNumber`)**: 토글 스위치
*   **단락 들여쓰기 (`paragraphIndent`)**: 토글 스위치

### 2.2. 상태 연결
`useBookStore`의 `updateOptions` 함수를 사용하여 UI 변경 사항이 전역 상태(`bookData.meta.options`)에 즉시 반영되도록 연결합니다.

---

## 3. Claude Code 작업 지시 (Task Execution)

Claude Code는 다음 순서로 작업을 수행하십시오.

1.  **`web/components/editor/Sidebar.tsx` 수정**: 2절의 지침에 따라 옵션 제어 UI를 추가하고 `updateOptions`와 연결합니다. 공간이 부족할 경우 "고급 설정" 아코디언(접기/펴기)으로 묶어도 좋습니다.
2.  **`web/components/editor/PreviewPanel.tsx` 수정**: 1절의 지침에 따라 신국판 비율의 종이 스타일을 적용합니다. `useBookStore`에서 `options`를 가져와 폰트, 줄간격, 쪽번호 위치 등을 동적으로 렌더링에 반영합니다.
3.  **로컬 테스트**: `npm run dev` (또는 `pnpm dev`)를 실행하여 브라우저에서 사이드바 옵션을 변경할 때 미리보기 패널이 실시간으로 반응하는지 확인합니다.
4.  **GitHub Push**: 검증이 완료되면 변경 사항을 커밋하고 `main` 브랜치에 푸시합니다. 커밋 메시지는 `feat: 웹 에디터 미리보기 패널 및 옵션 UI 개선`으로 작성하십시오.

**주의사항**:
*   미리보기 패널은 완벽한 PDF 렌더링이 아닌 "95% 정확도의 HTML 근사치"를 목표로 합니다. 너무 복잡한 CSS 연산(예: 완벽한 페이지 분할)보다는 1페이지 분량의 느낌을 내는 데 집중하십시오.
*   모든 실행(Execution)은 Claude Code가 담당합니다. Manus는 오케스트레이션 및 참조 역할만 수행합니다.
