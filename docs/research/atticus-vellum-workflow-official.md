# Atticus/Vellum 공식 워크플로우 기준

> 작성일: 2026-05-19 KST  
> 목적: 다른 AI 요약이 아니라 공식 문서 기준으로 `sungjin_book` 제품 흐름을 고정한다.  
> 범위: 1단계 트랙 B 웹 에디터, 이후 PDF/ePub 출력 설계의 판단 기준.

---

## 1. 공식 출처

### Atticus

- How to Format Your Book With Atticus  
  https://www.atticus.io/how-to-format-your-book-with-atticus/
- Importing Existing Work  
  https://www.atticus.io/importing-existing-work/
- How to Prepare Your Word Document for Upload  
  https://www.atticus.io/how-to-prepare-your-word-document-for-upload/
- Front and Back Matter Checklist PDF  
  https://www.atticus.io/wp-content/uploads/2024/05/Front-and-Back-Matter-Checklist.pdf
- Import to Atticus Checklist PDF  
  https://www.atticus.io/wp-content/uploads/2024/05/Import-to-Atticus-Checklist.pdf
- Atticus Tutorials index  
  https://www.atticus.io/tutorials/

### Vellum

- Your Table of Contents  
  https://help.vellum.pub/elements/toc/
- Elements of your Book  
  https://help.vellum.pub/elements/

---

## 2. 공통 고객 흐름

Atticus/Vellum 모두 고객 흐름은 "글쓰기 앱"보다 "원고를 책 구조로 만들고 출력하는 앱"에 가깝다.

1. 새 책 생성 또는 원고 가져오기
2. 제목/저자 등 책 정보 입력
3. 기본 앞부분 자동 생성
4. 챕터 구조 인식 또는 직접 추가
5. 좌측 Navigator/목차에서 책 구조 정리
6. 현재 항목을 중앙에서 편집
7. 우측에서 책/기기 미리보기
8. 스타일/조판 설정 적용
9. PDF/ePub 생성

우리 제품의 1단계 흐름은 아래로 고정한다.

`시작 가이드 → 기본 책 구조 자동 생성 → 원고 입력/붙여넣기 → 챕터 정리 → 자동 목차 → 책처럼 미리보기 → PDF 출력`

---

## 3. 공식 기준에서 확인된 핵심 규칙

### 3.1 자동 생성 페이지

Atticus는 새 책에 Title Page, Copyright Page, Table of Contents를 자동 생성한다. Title Page는 Book Details에서 만들고, Copyright는 템플릿을 제공하며, TOC는 책 내용 변화에 따라 자동 갱신된다.

Vellum도 새 책에 Contents element를 자동으로 넣고, 보통 Title/Copyright/Dedication/Epigraph 뒤에 배치한다.

**우리 채택**

- 새 책 기본 구조: `속표지 / 판권지 / 목차 / 1장 / 저자 소개`
- 속표지는 책 메타데이터 기반
- 판권지는 템플릿 기반
- 목차는 직접 쓰는 글이 아니라 책 구조에서 계산

### 3.2 목차

Atticus TOC는 삭제할 수 없는 특수 페이지이며, ePub 기준의 내비게이션 TOC는 항상 유지된다. 화면용 TOC 페이지는 Include In > None으로 숨길 수 있다.

Vellum은 Navigator 구조로 TOC를 만들고, 챕터 순서 변경 시 즉시 갱신한다. 인쇄판 TOC에는 페이지 번호가 붙는다. Vellum은 Copyright, Dedication, Epigraph, Half Title, Title Page 등 일부 요소를 TOC에서 제외한다.

**우리 채택**

- 목차는 시스템 블록으로 취급한다.
- 목차는 `blocks` 순서와 챕터 정보에서 계산한다.
- 챕터 화면에 `목차에 표시`를 항상 노출하지 않는다.
- 목차 화면에서 포함/제외를 관리한다.
- 1단계는 챕터 목록만 표시하고, 페이지 번호는 페이지 계산 안정화 뒤 붙인다.

**보류**

- ePub Logical TOC는 ePub 단계에서 구현한다.
- TOC Include In(All/eBook/Print/None)은 ePub/Print 분기 단계에서 구현한다.

### 3.3 Front Matter/Back Matter

Atticus는 Front Matter를 Body와 분리한다. Front Matter 페이지는 각 타입마다 프리셋 포맷을 가진다. Atticus는 TOC 이전 페이지에는 페이지 번호를 표시하지 않고, TOC 뒤의 Front Matter에는 로마 숫자를 쓴다. Body 시작부터 일반 숫자 1로 시작한다.

Vellum은 element type이 포맷과 책 구조에 영향을 준다. 일부 Front Matter는 로마 숫자를 쓰고, 대부분 Front/Back Matter는 인쇄판에서 오른쪽 페이지에서 시작하도록 처리한다. Copyright는 예외적으로 바로 다음 페이지 시작을 기본으로 할 수 있다.

**우리 채택**

- 블록 타입별 편집 UI를 분리한다.
- 속표지/판권지/목차/저자 소개는 챕터 폼이 아니다.
- Front Matter/Body/Back Matter를 사이드바에서 명확히 묶는다.

**다음 채택**

- Front Matter 로마 숫자/번호 없음 규칙
- Body 첫 챕터부터 일반 숫자 1 시작
- 블록 타입별 기본 시작 위치 규칙

### 3.4 원고 가져오기/붙여넣기

Atticus는 `.docx` 가져오기를 중심으로 설계되어 있다. 기존 Title/Copyright/TOC는 지우라고 안내한다. Heading 1 또는 큰 글씨를 챕터 제목으로 인식하고, page break나 여러 문단 breaks를 새 챕터 후보로 인식한다. `***`는 scene break로 변환한다.

Atticus Import Checklist는 들여쓰기, 폰트 선택, 줄간격 같은 워드 서식은 가져오지 않는다고 정리한다. 가져올 수 있는 것은 주로 B/I/U, 취소선, 일부 구조 신호다.

**우리 채택**

- 붙여넣기는 원고 텍스트 중심으로 받는다.
- 기존 목차/속표지/판권지는 가져오기보다 우리 시스템 블록으로 만든다.
- 저장 후 다음 챕터 입력 흐름을 강화한다.
- 장기적으로 긴 원고 붙여넣기에서 챕터 제목 후보를 감지한다.

**보류**

- `.docx` 직접 업로드는 2단계 이후.
- Scene 자동 인식은 미리보기 안정화 이후.

### 3.5 Scene / Page Break / Split / Part

Atticus는 scene break를 챕터 내부 단위로 다룬다. scene title은 사용자 참고용이며 출력되지 않는다. Page Break는 챕터 내부에서 새 페이지를 강제한다. Split/Merge Chapter, Part, Volume도 제공한다.

**우리 보류**

- Scene, Page Break, Split/Merge, Part는 1단계 핵심이 아니다.
- 단, 데이터 구조에는 나중에 확장 가능한 여지를 남긴다.

---

## 4. 우리 제품에 반영할 결정

### 바로 반영할 것

1. 미리보기 페이지 분할은 문단 단위가 아니라 줄 단위로 바꾼다.
2. 현재 선택 블록 미리보기 다음에는 전체 책 미리보기를 만든다.
3. 목차는 목차 화면에서만 관리한다.
4. 챕터 화면은 원고 입력 중심으로 단순화한다.
5. 저장 후 다음 챕터 작성 흐름을 만든다.

### 1.5단계

1. 목차에 실제 페이지 번호 표시
2. Front Matter 로마 숫자/번호 없음 처리
3. 판권지 필드 구조화
4. 간지를 목차에 넣을 수 있는 옵션

### 2단계 이후

1. `.docx` 업로드/분석
2. Scene 구조
3. Page Break
4. Split/Merge Chapter
5. Part 계층
6. ePub Logical TOC / Include In

---

## 5. 기존 플랜에서 수정할 점

### 수정 전

- 챕터마다 `includeInToc`를 입력 UI에 노출한다.
- 미리보기 보정 다음에 목차 고도화를 한다.
- 붙여넣기 흐름은 후순위다.

### 수정 후

- 챕터는 기본으로 목차에 들어간다. 예외 관리는 목차 화면에서 한다.
- 줄 단위 미리보기와 전체 책 미리보기는 계속 1순위다.
- 저장 후 다음 챕터 작성 흐름은 고객 입력 흐름이므로 목차 페이지 번호보다 먼저 한다.
- `.docx` 업로드는 지금 하지 않되, 붙여넣기/챕터 반복 입력은 빠르게 개선한다.

---

## 6. 다음 실행 순서

1. 줄 단위 페이지 분할
2. 저장 후 다음 챕터 작성 흐름
3. 전체 책 미리보기
4. 목차에 페이지 번호 연결
5. Front Matter 페이지 번호 규칙
6. 판권지 구조화

---

## 7. 판단 원칙

- 사용자가 세밀한 위치/여백을 직접 조절하게 하지 않는다.
- 세밀 조절 대신 출판 품질이 보장된 프리셋만 제공한다.
- 책 구조는 자동으로 만들고, 사용자는 원고와 필수 정보만 채운다.
- 목차는 작성물이 아니라 결과물이다.
- 한국어 조판 규칙은 Atticus/Vellum보다 우선한다.
