# Atticus 레퍼런스 종합 문서
> Claude Code가 PreviewPanel 및 Formatting 탭 구현 시 참고할 Atticus 분석 자료 인덱스
> 수집일: 2026-05-19 | 경로: `C:\projects\sungjin_book\docs\research\atticus\`

---

## 1. Atticus란

Atticus는 소설/비소설 작가를 위한 **올인원 책 집필·포맷 소프트웨어**입니다.  
- 가격: $147 일회성 구매 (구독 없음)
- 플랫폼: 웹 앱 (Mac, PC, Chromebook, 모바일 동기화)
- 핵심 기능: Writing 탭 + Formatting 탭 + PDF/ePub 내보내기

---

## 2. Atticus UI 구조 (우리가 따라야 할 핵심)

### 2.1 전체 레이아웃

```
┌─────────────────────────────────────────────────────────┐
│  [🏠] [Book Title] [Edit Book Details]  Writing | Formatting │  ← 상단 네비게이션
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────────┐  ┌──────────────────┐  │
│  │  Formatting 사이드바         │  │  미리보기 패널    │  │
│  │  (설정 패널)                 │  │  (책 미리보기)    │  │
│  └─────────────────────────────┘  └──────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Formatting 탭 사이드바 메뉴 항목 (순서 중요)

```
Themes > Create new theme
├── Chapter Heading      ← 챕터 제목 스타일
├── Paragraph            ← 단락 설정 (들여쓰기, 첫 줄 등)
├── Subheading           ← 소제목 스타일
├── Scene Break          ← 장면 전환 구분자
├── Notes                ← 각주/미주
├── Print Layout         ← 여백, 정렬, 들여쓰기 (핵심!)
├── Typography           ← 폰트, 크기, 줄간격 (핵심!)
├── Header/Footer        ← 머리글/꼬리글
└── Trim Sizes           ← 판형 선택 (핵심!)
```

**스크린샷 참조:**
- `screenshots/atticus-chapter-heading-ui.webp` — Chapter Heading 탭 UI
- `screenshots/atticus-print-layout-ui.webp` — Print Layout 탭 UI
- `screenshots/atticus-typography-ui.webp` — Typography 탭 UI
- `screenshots/atticus-header-footer-ui.webp` — Header/Footer 탭 UI
- `screenshots/atticus-trim-sizes-ui.webp` — Trim Sizes 탭 UI

### 2.3 미리보기 패널 구조

```
┌──────────────────────────────────┐
│  [Print ▼]              [iPad ▼] │  ← 상단: 출력 타입 + 기기 전환
│                                  │
│  ┌────────────────────────────┐  │
│  │                            │  │
│  │     책 페이지 미리보기      │  │  ← 실제 책 비율로 렌더링
│  │     (크림색 배경)           │  │
│  │                            │  │
│  └────────────────────────────┘  │
│                                  │
│  (76 pages)                      │  ← 총 페이지 수 표시
│                                  │
│  [◄ Page] [Page ►]               │  ← 페이지 이동 버튼
│  [◄ Chapter] [Chapter ►]         │  ← 챕터 이동 버튼
│                                  │
│  [Export pdf] [Export ePub]      │  ← 내보내기 버튼
└──────────────────────────────────┘
```

**핵심 관찰:**
- 미리보기 패널은 **패널 높이 기준**으로 책 크기를 결정함
- 책 프레임은 선택된 판형의 가로:세로 비율을 유지
- Print / iPad / iPhone 등 기기 전환 드롭다운 존재
- 페이지 이동: Page 단위 + Chapter 단위 두 가지

---

## 3. 판형(Trim Sizes) 규격

**스크린샷:** `screenshots/atticus-trim-sizes-ui.webp`

### Popular Trim Sizes (인치)
| 규격 | 크기 | 지원 |
|------|------|------|
| 5 × 8 | 127 × 203mm | KDP + IngramSpark |
| 5.25 × 8 | 133 × 203mm | KDP + IngramSpark |
| 5.5 × 8.5 | 140 × 216mm | KDP + IngramSpark |
| 6 × 9 | 152 × 229mm | KDP + IngramSpark |

### Additional Trim Sizes
| 규격 | 크기 |
|------|------|
| 5.06 × 7.81 | 129 × 198mm |
| 5.5 × 6.25 | 140 × 159mm |
| 6.14 × 9.21 | 156 × 234mm |

### International Sizes
| 규격 | 크기 |
|------|------|
| 4.72 × 7.48 | A5 (120 × 190mm) |
| 4.92 × 7.48 | 125 × 190mm |
| 5.83 × 8.27 | A5 (148 × 210mm) |
| 5.31 × 8.46 | 135 × 215mm |

### Mass Market Paperbacks
| 규격 | 크기 |
|------|------|
| 4.12 × 6.75 | 105 × 171mm |
| 4.25 × 7 | 108 × 178mm |
| 4.37 × 7 | 111 × 178mm |

### Children's Book Trim Sizes
| 규격 | 크기 |
|------|------|
| 8.5 × 8.5 | 216 × 216mm |
| 8 × 10 | 203 × 254mm |
| 8.5 × 11 | 216 × 279mm |

> **한국 출판 추가 판형 (우리 프로젝트 전용):**
> - 신국판: 152 × 225mm (6 × 8.86in)
> - 46판: 127 × 188mm (5 × 7.4in)
> - A5: 148 × 210mm (5.83 × 8.27in)
> - B6: 128 × 182mm (5.04 × 7.17in)
> - 크라운판: 176 × 248mm (6.93 × 9.76in)

---

## 4. Typography(타이포그래피) 설정

**스크린샷:** `screenshots/atticus-typography-ui.webp`

### 설정 항목
| 항목 | Atticus 범위 | 우리 기본값 |
|------|-------------|------------|
| Body Font | 드롭다운 선택 (EB Garamond 등) | 나눔명조 |
| Font Size | 9pt ~ 18pt (슬라이더) | 10pt |
| Line Spacing | Single ~ Double (슬라이더) | 1.5 |
| Large Print | 체크박스 | false |

### 폰트 크기 슬라이더 눈금
`9pt — 10pt — 11pt — 12pt — 13pt — 14pt — 15pt — 16pt — 17pt — 18pt`

### 줄간격 슬라이더 눈금
`Single — 1.25 — 1.5 — 1.75 — Double`

---

## 5. Print Layout(인쇄 레이아웃) 설정

**스크린샷:** `screenshots/atticus-print-layout-ui.webp`

### 설정 항목
| 항목 | 설명 | 기본값 |
|------|------|--------|
| 단위 | inches / mm 라디오 버튼 | inches |
| Inside Margin | 안쪽 여백 | 0.875 in |
| Outside Margin | 바깥쪽 여백 | 0.5 in |
| Reset Margins | 버튼 | — |
| Indents | 들여쓰기 | 0.15 in |
| Reset (Indents) | 버튼 | — |
| Alignment | Justified 체크박스 | ✓ |
| Hyphens | 하이픈 체크박스 | ✓ |
| Ornamental Breaks | 장식 구분자 체크박스 | ✓ |
| Subheadings | 소제목 체크박스 | ✓ |
| Layout Priority | Widows and Orphans / Balanced Page Spread / Best of Both | Best of Both |

---

## 6. Header/Footer(머리글/꼬리글) 설정

**스크린샷:** `screenshots/atticus-header-footer-ui.webp`

### 레이아웃 옵션 (시각적 선택)
```
Chapter 3  |  Author  |  Title  |  2 Author  |  Title 3  |  Author  |  Title  |  Author  |  Title
   2                                                          2           3                    3
```
(총 9가지 레이아웃 프리셋 — 홀수/짝수 페이지 별도 설정 가능)

### 설정 항목
| 항목 | 설명 |
|------|------|
| Header Font | 드롭다운 (EB Garamond 등) |
| Header Size | 슬라이더 |
| Footer Font | 드롭다운 |
| Footer Size | 슬라이더 |

---

## 7. Chapter Heading(챕터 헤딩) 설정

**스크린샷:** `screenshots/atticus-chapter-heading-ui.webp`

### 설정 항목
- **Chapter Number**: 체크박스 → Font, Align, Style, Size, Width Percentage
  - Chapter Number View: `1` / `Chapter 1` / `One` / `Chapter One` (4가지)
- **Chapter Title**: 체크박스 → Font, Align, Style, Size, Width Percentage
- **Chapter Subtitle**: 체크박스
- **Chapter Image**: 체크박스 → 이미지 업로드, 위치 설정

### 기기 전환 드롭다운 (미리보기 우측 상단)
- `iPad` — 태블릿 미리보기
- `iPhone` — 모바일 미리보기
- `Print` — 인쇄 미리보기

---

## 8. 페이지 분할 로직 (Atticus 관찰 결과)

### 관찰된 동작
1. 본문 텍스트는 **Typography 설정(폰트 크기 + 줄간격)**에 따라 자동으로 페이지 분할됨
2. 페이지 수는 설정 변경 시 실시간으로 재계산됨 ("Calculating page count..." 표시)
3. 챕터 시작은 항상 새 페이지에서 시작
4. 장면 전환(Scene Break) 후에도 같은 페이지 내에서 계속됨 (챕터 시작과 다름)

### 미리보기 패널 크기 계산 방식 (추정)
```
패널 높이 H → 책 높이 = H × 0.82 (상하 여백 제외)
책 너비 = 책 높이 × (판형 가로 / 판형 세로)
스케일 팩터 = 책 너비 / 실제 판형 가로(mm)
폰트 크기(px) = 설정 pt × (96/72) × 스케일 팩터
줄 높이(px) = 폰트 크기(px) × 줄간격 배수
유효 본문 높이 = 책 높이 × (1 - 상단여백비율 - 하단여백비율)
페이지당 줄 수 = floor(유효 본문 높이 / 줄 높이)
```

---

## 9. 유튜브 영상 목록

**파일:** `youtube/video-list.json`  
**썸네일:** `youtube/thumb_*.jpg` (21개)

### 핵심 영상 (구현 참고용)

| 제목 | ID | 카테고리 | 조회수 |
|------|-----|---------|--------|
| How to Format Your Book [2024] | x0yGQkwaYZs | formatting | 55K |
| Learn How-To Format in Atticus | 1NgcyGc-We8 | formatting | 3.2K |
| How To Atticus: Getting Started | ZTkHWaJV4Mc | getting-started | 7.2K |
| Front and Back Matter | AP5RtfJI6_8 | formatting | 12K |
| Create Reusable Master Pages | mEF6W0nT0EA | formatting | 5.5K |
| Google Fonts in Atticus | AKAqBKguMrY | typography | 2.6K |
| Writing & Editing in Atticus | CcNHSYzSEOs | writing | 2.2K |

---

## 10. 공식 문서 텍스트

**파일:** `pages/` 폴더

| 파일명 | 내용 |
|--------|------|
| `how-to-format-book.md` | 전체 포맷 가이드 (Front Matter, Body, 페이지 번호 등) |
| `create-custom-theme.md` | 커스텀 테마 생성 가이드 |
| `text-paragraph-styling.md` | 텍스트/단락 스타일링 |
| `vellum-vs-atticus-2025.md` | Vellum 비교 분석 |
| `atticus-format-guide.md` | 포맷 가이드 (이전 버전) |

---

## 11. 우리 프로젝트와 Atticus의 차이점

| 항목 | Atticus | 우리 프로젝트 |
|------|---------|-------------|
| 판형 | 미국 표준 (인치) | 한국 표준 추가 필요 |
| 폰트 | 영문 폰트 위주 | 한글 폰트 필수 (나눔명조 등) |
| 언어 | 영어 | 한국어 |
| 들여쓰기 | 0.15 in | 1자 (한글 관행) |
| 줄간격 기본값 | 1.5 | 1.6~1.8 (한글 가독성) |
| 페이지 번호 위치 | 헤더/푸터 선택 | 동일 |

---

## 12. 구현 우선순위 (Claude Code 작업 지시)

### Phase 1: 미리보기 패널 (PreviewPanel.tsx)
1. 패널 높이 기준 동적 크기 계산 (`ResizeObserver`)
2. 판형 비율 유지 (가로:세로)
3. 페이지 분할 (단락 단위)
4. 페이지 이동 버튼 (Page ◄ ►, Chapter ◄ ►)
5. 기기 전환 드롭다운 (Print / iPad / iPhone)

### Phase 2: Formatting 탭 사이드바
1. 사이드바 메뉴 순서: Chapter Heading → Paragraph → Subheading → Scene Break → Notes → Print Layout → Typography → Header/Footer → Trim Sizes
2. Typography 패널: 폰트 드롭다운 + 크기 슬라이더(9~18pt) + 줄간격 슬라이더
3. Print Layout 패널: 여백(Inside/Outside) + 들여쓰기 + 정렬 옵션
4. Trim Sizes 패널: 판형 그리드 선택 UI (한국 판형 포함)
5. Header/Footer 패널: 레이아웃 프리셋 시각적 선택 UI

---

*이 문서는 Manus가 수집한 Atticus 분석 자료를 기반으로 자동 생성되었습니다.*
*Claude Code는 이 문서와 함께 `screenshots/` 폴더의 이미지들을 참고하여 구현하세요.*
