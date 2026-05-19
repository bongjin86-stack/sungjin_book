# 성진북스 설정 시스템 구현 설계서 (Claude Code 지시서)

**작성일**: 2026-05-19  
**작성자**: Manus  
**대상**: Claude Code (실행 에이전트)

이 문서는 성진북스(sungjin_book) 프로젝트의 "설정 시스템(Settings System)"을 구현하기 위한 구체적인 아키텍처와 작업 지시서입니다. 현재 하드코딩된 Typst 템플릿을 JSON 기반의 동적 설정 시스템으로 전환하는 것이 목표입니다.

---

## 1. 시스템 아키텍처 개요

현재 시스템은 JSON 데이터를 받아 Typst가 PDF를 렌더링하는 구조입니다. 설정 시스템은 이 파이프라인의 양 끝단(JSON 스키마와 Typst 템플릿)을 확장하여 구현합니다.

**핵심 원칙**: "고객은 결과를 선택하고, 수치는 우리가 책임진다." (Vellum 모델 벤치마킹)

### 1.1. 설정 레이어 정의

설정은 자유도에 따라 3개의 레이어로 나뉩니다.

*   **레이어 1 (잠금)**: 판형 크기, 제본 여백 등 인쇄 사고와 직결되는 "땅" (템플릿에 하드코딩 유지)
*   **레이어 2 (프리셋)**: 폰트, 크기, 줄간격 등 검증된 값 안에서만 선택 가능한 항목
*   **레이어 3 (자유)**: 쪽번호 표시 여부, 위치 등 고객 취향 영역

---

## 2. JSON 스키마 확장 설계 (`BookOptions`)

`web/types/book.ts`의 `BookOptions` 인터페이스를 확장하여 설정값을 담습니다.

### 2.1. 신규 옵션 구조

```typescript
export interface BookOptions {
  // 기존 옵션
  showChapterNumber: boolean;
  showPreviewPanel: boolean;
  showSeriesName: boolean;
  showEnglishTitle: boolean;
  includeISBN: boolean;
  interludeStyle: "1p" | "2p";

  // 신규 추가: 레이어 2 (프리셋)
  bodyFont: "serif" | "sans";       // 기본값: "serif"
  bodyFontSize: "9pt" | "10pt" | "11pt"; // 기본값: "10pt"
  lineSpacing: "narrow" | "normal" | "wide"; // 기본값: "normal"

  // 신규 추가: 레이어 3 (자유)
  pageNumberPosition: "bottom-outside" | "bottom-center" | "top-outside"; // 기본값: "bottom-outside"
  showPageNumber: boolean;          // 기본값: true
  hideChapterStartPageNumber: boolean; // 기본값: true
  paragraphIndent: boolean;         // 기본값: true
}
```

### 2.2. 값 매핑 테이블 (Typst 내부 구현용)

JSON에서 전달된 문자열(예: "normal")은 Typst 내부에서 실제 수치로 매핑됩니다.

*   **`bodyFont`**: "serif" → `serif-fonts`, "sans" → `sans-fonts`
*   **`bodyFontSize`**: 그대로 pt 값으로 사용
*   **`lineSpacing`**:
    *   "narrow": `leading: 6pt, spacing: 6pt`
    *   "normal": `leading: 8pt, spacing: 8pt`
    *   "wide": `leading: 10pt, spacing: 10pt`
*   **`pageNumberPosition`**:
    *   "bottom-outside": 하단 바깥쪽 (홀수 오른쪽, 짝수 왼쪽)
    *   "bottom-center": 하단 가운데
    *   "top-outside": 상단 바깥쪽

---

## 3. Typst 템플릿 수정 지침 (`template.typ`)

`typst-templates/sinkukpan/classic/template.typ` 파일을 수정하여 JSON 옵션을 동적으로 반영합니다.

### 3.1. 옵션 파싱 및 기본값 설정

`book(data)` 함수 도입부에서 `data.meta.options`를 파싱하고 기본값을 할당합니다.

```typst
#let book(data) = {
  // 옵션 파싱 (기본값 폴백 포함)
  let opts = data.at("meta", default: (:)).at("options", default: (:))
  
  let body-font-choice = opts.at("bodyFont", default: "serif")
  let body-font = if body-font-choice == "sans" { sans-fonts } else { serif-fonts }
  
  let body-size-str = opts.at("bodyFontSize", default: "10pt")
  let body-size = if body-size-str == "9pt" { 9pt } else if body-size-str == "11pt" { 11pt } else { 10pt }
  
  let spacing-choice = opts.at("lineSpacing", default: "normal")
  let spacing-val = if spacing-choice == "narrow" { 6pt } else if spacing-choice == "wide" { 10pt } else { 8pt }
  
  let pn-pos = opts.at("pageNumberPosition", default: "bottom-outside")
  let show-pn = opts.at("showPageNumber", default: true)
  let hide-chapter-pn = opts.at("hideChapterStartPageNumber", default: true)
  let indent = opts.at("paragraphIndent", default: true)
  let show-chapter-num = opts.at("showChapterNumber", default: true)

  // ... (이하 로직)
}
```

### 3.2. 쪽번호 로직 동적화 (`set page`)

`footer` (또는 `header`) 로직을 `pageNumberPosition`과 `showPageNumber`에 따라 분기합니다.

```typst
  // 쪽번호 렌더링 함수
  let render-page-number(n) = {
    if not show-pn { return none }
    
    let start-pages = chapter-start-pages.at(here())
    if hide-chapter-pn and start-pages.contains(n) {
      return none // 챕터 시작 페이지 쪽번호 숨김
    }

    let align-pos = center
    if pn-pos == "bottom-outside" or pn-pos == "top-outside" {
      align-pos = if calc.odd(n) { right } else { left }
    }
    
    align(align-pos)[
      #text(font: serif-fonts, size: 9pt)[#n]
    ]
  }

  set page(
    width: 152mm,
    height: 225mm,
    margin: (inside: 20mm, outside: 18mm, top: 22mm, bottom: 25mm),
    header: context {
      let n = counter(page).at(here()).first()
      if pn-pos == "top-outside" { render-page-number(n) }
    },
    footer: context {
      let n = counter(page).at(here()).first()
      if pn-pos != "top-outside" { render-page-number(n) }
    },
  )
```

### 3.3. 본문 및 단락 설정 동적화 (`set text`, `set par`)

```typst
  set text(
    font: body-font,
    size: body-size,
    lang: "ko",
    cjk-latin-spacing: auto,
  )

  set par(
    leading: spacing-val,
    spacing: spacing-val,
    justify: true,
    first-line-indent: if indent { (amount: 1em, all: false) } else { 0pt },
  )
```

### 3.4. 챕터 번호 표시 동적화 (`chapter` 함수)

`chapter` 함수 내부에서 `showChapterNumber` 옵션에 따라 "제 N 장" 텍스트 렌더링을 제어해야 합니다. (이를 위해 `chapter` 함수가 `opts`를 인자로 받거나, `book` 함수 내부 스코프에서 정의되도록 구조 변경 필요)

---

## 4. Claude Code 작업 지시 (Task Execution)

Claude Code는 다음 순서로 작업을 수행하십시오.

1.  **`web/types/book.ts` 수정**: 2.1절의 신규 옵션을 `BookOptions` 인터페이스와 `DEFAULT_OPTIONS`에 추가합니다.
2.  **`content/taepyeongcheonha-ch01.json` 수정**: 테스트를 위해 `meta.options`에 신규 옵션들을 추가하고 값을 변경해 봅니다 (예: `bodyFont: "sans"`, `pageNumberPosition: "bottom-center"`).
3.  **`typst-templates/sinkukpan/classic/template.typ` 수정**: 3절의 지침에 따라 하드코딩된 값을 동적 변수로 교체합니다. `chapter` 함수가 `showChapterNumber` 옵션을 인식할 수 있도록 스코프를 조정하십시오.
4.  **컴파일 및 검증**: `~/typst compile main.typ output_test.pdf --font-path fonts` 명령을 실행하여 변경된 옵션이 PDF에 정상적으로 반영되는지 확인합니다.
5.  **GitHub Push**: 검증이 완료되면 변경 사항을 커밋하고 `main` 브랜치에 푸시합니다. 커밋 메시지는 `feat: 설정 시스템(옵션 동적화) 구현`으로 작성하십시오.

**주의사항**:
*   모든 실행(Execution)은 Claude Code가 담당합니다. Manus는 오케스트레이션 및 참조 역할만 수행합니다.
*   Typst 0.13.x의 `context` 문법을 정확히 준수하십시오.
*   수정 후 기존의 "땅" (판형, 제본 여백 등)이 훼손되지 않았는지 반드시 확인하십시오.
