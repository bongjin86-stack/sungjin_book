# 성진북스 온보딩 마법사 및 요소 시스템 설계서

## 1. 개요
현재 성진북스는 챕터와 간지 타입만 존재하며, 책의 앞부분(Front Matter)과 뒷부분(Back Matter) 요소가 부족합니다. 또한, 사용자가 처음 책을 생성할 때 어떤 요소들을 포함할지 가이드해주는 온보딩 과정이 필요합니다.
이 설계서는 사용자가 책을 처음 만들 때 필요한 요소를 선택하게 하는 **온보딩 마법사**와, 선택된 요소를 관리하는 **요소 시스템(Front/Back Matter)**의 구조를 정의합니다.

## 2. 요소 시스템 (Elements System) 확장

`web/types/book.ts`의 `BlockType`을 확장하여 한국 단행본에 필수적인 요소들을 추가합니다.

### 2.1. 신규 BlockType 정의
```typescript
export type BlockType =
  // 기존
  | "chapter"
  | "interlude"
  // 신규: Front Matter (앞부분)
  | "half-title" // 속표지
  | "toc"        // 목차
  | "preface"    // 서문/머리말
  | "dedication" // 헌정사
  | "prologue"   // 프롤로그
  | "blurb"      // 추천사
  // 신규: Back Matter (뒷부분)
  | "author-bio" // 저자 소개
  | "epilogue"   // 에필로그
  | "acknowledgments" // 감사의 글
  | "bibliography";   // 참고문헌
```

### 2.2. 기본 포함 요소 (Default Elements)
새 책을 생성할 때 기본적으로 포함될 요소들입니다.
- Front Matter: `half-title` (속표지), `toc` (목차)
- Body: `chapter` (제1장)
- Back Matter: `author-bio` (저자 소개)

## 3. 온보딩 마법사 (Onboarding Wizard) UI 흐름

`web/components/onboarding/BookSetupScreen.tsx`를 다단계 마법사 형태로 개편합니다.

### Step 1: 책 기본 정보 (기존 화면 유지)
- 제목, 부제목, 저자, 출판사, 판형 선택

### Step 2: 책 구성 선택 (신규 화면)
사용자가 책에 포함할 요소를 체크박스로 선택합니다.

**UI 구조:**
- **앞부분 (Front Matter)**
  - [x] 속표지 (필수/기본)
  - [x] 목차 (필수/기본)
  - [ ] 서문 / 머리말
  - [ ] 헌정사
  - [ ] 프롤로그
  - [ ] 추천사
- **뒷부분 (Back Matter)**
  - [x] 저자 소개 (기본)
  - [ ] 에필로그
  - [ ] 감사의 글
  - [ ] 참고문헌

### Step 3: 테마 선택 (신규 화면)
- 클래식 / 모던 / 미니멀 중 선택
- 선택 시 우측에 해당 테마의 미리보기 이미지 제공

### Step 4: 완료 및 에디터 진입
- 선택된 요소들을 기반으로 `useBookStore`의 `initBook`을 호출하여 초기 데이터를 구성하고 에디터 화면으로 이동합니다.

## 4. 데이터 초기화 로직 (`useBookStore.ts`)

온보딩 마법사에서 선택된 요소들을 기반으로 초기 `blocks` 배열을 생성하는 로직을 추가해야 합니다.

```typescript
// 예시: 온보딩 완료 시 호출될 초기화 함수 내부 로직
const initialBlocks: BookBlock[] = [];

// 1. Front Matter 추가 (선택된 순서대로)
if (selectedElements.includes('half-title')) initialBlocks.push(createBlock('half-title'));
if (selectedElements.includes('toc')) initialBlocks.push(createBlock('toc'));
if (selectedElements.includes('prologue')) initialBlocks.push(createBlock('prologue'));
// ... 기타 선택된 Front Matter

// 2. 기본 챕터 추가
initialBlocks.push(createBlock('chapter', { title: '제1장' }));

// 3. Back Matter 추가
if (selectedElements.includes('epilogue')) initialBlocks.push(createBlock('epilogue'));
if (selectedElements.includes('author-bio')) initialBlocks.push(createBlock('author-bio'));
// ... 기타 선택된 Back Matter
```

## 5. 작업 지시 (Claude Code용)
1. `web/types/book.ts`에 신규 `BlockType`들을 추가하세요.
2. `web/components/onboarding/BookSetupScreen.tsx`를 위 설계에 맞게 다단계(Step 1~3) 마법사로 리팩토링하세요.
3. `web/hooks/useBookStore.ts`에 온보딩 결과를 받아 초기 `blocks`를 구성하는 로직을 구현하세요.
4. `web/components/editor/Sidebar.tsx`의 네비게이터 영역이 신규 블록 타입들을 표시할 수 있도록 업데이트하세요 (아이콘 및 라벨 매핑).
