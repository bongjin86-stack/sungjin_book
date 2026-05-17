# Vellum 심층 분석 — sungjin_book 트랙 B 설계의 1순위 벤치마크

> 조사일: 2026-05-18
> 방법: vellum.pub + help.vellum.pub 27개 페이지 Playwright 캡처 + WebFetch 본문 분석
> 스크린샷 저장: `docs/research/screenshots/vellum/` (27장, 17MB)
> 사전 조사: `docs/research/2026-05-typesetting-survey.md` 3.1절

---

## 1. 한 줄 요약

Vellum은 **"콘텐츠는 안 만들고 자동조판만 해주는 Mac 데스크탑 앱"**이다.
"Word/Scrivener에서 쓴 .docx를 가져와서 → 스타일 하나 골라서 → ebook + 인쇄 PDF 만든다"가 전부.
사용자에게 노출하는 옵션이 적은 게 단점이 아니라 **세일즈 포인트**다 ("Choose your trim size, and Vellum does the rest").

우리 `sungjin_book`의 자동조판 철학(스타일 먼저·노출 최소)은 **Vellum과 같은 학파**다. 한국어/웹/POD 통합이 차별화.

---

## 2. 무엇이 아닌가 — 자주 오해되는 3가지

| 오해 | 사실 |
|---|---|
| "온라인 편집기" | ❌ Mac 데스크탑 앱. 웹 아님. 클라우드 저장 없음. |
| "글쓰기 도구" | ❌ 글은 Word/Scrivener/Pages에서 쓰고 .docx로 가져옴. Vellum은 가져온 글을 **편집**할 수는 있지만, 글쓰기 환경은 부차. |
| "출판 플랫폼" | ❌ ISBN·POD·유통 안 해줌. 사용자가 결과 PDF를 KDP/IngramSpark에 직접 업로드. |

**진짜 정의**: ".docx → 예쁜 .epub + 예쁜 PDF" 변환기. 변환 사이에 미리보기와 스타일 고르기가 있는 GUI.

---

## 3. 사용자 워크플로우 (9단계)

1. **다운로드 + 설치** (Mac, 무료, 결과물 내보낼 때 라이선스 구매)
2. **Word 가져오기** — Heading 1로 챕터를 표시한 .docx 1개 import
3. **챕터 정리** — 가져오기 결과 검토, 필요하면 Merge / Split
4. **스타일 적용** — Popular/Serif/Sans/Script/Accessible 카테고리에서 1개 클릭 → 책 전체에 즉시 반영
5. **앞/뒷부분 추가** — Copyright, Dedication, About the Author 등 Element를 메뉴에서 추가
6. **표지 이미지 업로드** — Book 레벨의 Cover 탭
7. **저장** (`.vellum` 바이너리 파일)
8. **미리보기** — 우측 패널, 디바이스 선택(Kindle/iPad/iPhone/Print 등)
9. **Generate** — 플랫폼별(Kindle, Apple, Kobo …) 또는 Generic EPUB + Print PDF 폴더 생성 → 사용자가 각 스토어에 업로드

**핵심 통찰**: 1~9단계 **어디에도 폰트 선택·자간·여백 4방향 같은 결정이 없다**. 사용자가 만지는 건 *Style 카드 1개*와 *Trim Size 드롭다운 1개*가 거의 전부다.

---

## 4. 메인 화면 3분할 구조 (Mac 앱)

```
┌─────────────┬───────────────────────┬─────────────┐
│ Navigator   │  Text Editor          │  Preview    │
│ (좌측)      │  (중앙)               │  (우측)     │
│             │                       │             │
│ 챕터/Element│  현재 챕터 본문 편집   │ 디바이스별  │
│ 목록        │  + 도구모음           │ 실시간 미리 │
│             │                       │ 보기        │
└─────────────┴───────────────────────┴─────────────┘
```

- **Navigator (좌)**: Front matter / Body / Back matter 트리. 드래그로 순서 변경.
- **Text Editor (중)**: 본문 입력 + 인라인 마크업(B/I/U, smallcaps, 이모지). 글자 폰트는 *에디터 표시용*이지 결과물 폰트가 아님.
- **Preview (우)**: 디바이스 드롭다운으로 Kindle/iPad/iPhone/Kobo/Print 전환. Draft / Proof 모드. Print에서는 Show Bleed 토글.

→ **우리 트랙 B(Tiptap + PDF 미리보기 분할 화면)의 직접 모범**. 다만 우린 Element 트리(좌측)를 1단계엔 안 만들고 단순화해도 됨.

---

## 5. 데이터 모델 — Element / Text Feature / Style 3축

### 5.1 Element (책의 큰 단위, 18종)

| 그룹 | Element |
|---|---|
| Front matter | Half Title, Title Page, Copyright, Dedication, Epigraph, Table of Contents, Foreword, Introduction, Preface, Prologue |
| Body | Chapter, Part (여러 챕터 묶음), Volume (박스셋 1권) |
| Back matter | Epilogue, Afterword, Endnotes, Bibliography, Acknowledgments, About the Author, Also By |
| 기타 | Uncategorized, Full Page Image |

**Element는 우리 JSON 스키마 v2의 `front_matter` / `body` / `back_matter` 배열 항목과 1:1 대응**. 우리 1단계에선 Chapter / Copyright / Title Page 3개만 만들어도 무방.

### 5.2 Text Feature (Element 내부에서 쓰는 블록·인라인 단위)

| 카테고리 | 항목 |
|---|---|
| 블록 구조 | Subhead, Ornamental Break, Alignment Block, List, Block Quotation, Verse |
| 특수 | Text Conversation(메신저 대화), Written Note(손글씨 노트) |
| 이미지 | Inline Image |
| 링크 | Web Link, Store Link, Internal Link |
| 주석 | Footnote, Endnote |
| 페이지 | Scene Break, Page Break |
| 인라인 마크업 | Bold, Italic, Underline, Smallcaps, Monospace, Strikethrough |

**관찰**: 인라인은 **6종**으로 좁혀져 있다. 색상·하이라이트·폰트변경 같은 워드 잔재는 **없다.**
→ 우리 JSON 인라인 spec("subset_markdown_v1")도 6종 이하로 묶으면 충분.

### 5.3 Style (테마, 카테고리 6종)

| 카테고리 | 의도 |
|---|---|
| Popular | 시즌 추천 (사실상 "스타터") |
| Serif | 본문 세리프 기본 스타일 |
| Sans Serif | 본문 산세리프 기본 스타일 |
| Script | 헤딩 손글씨 류 (장르 소설용) |
| Accessible | 큰 글씨·고대비·디스렉시아 친화 (Large Print) |
| Saved Styles | 사용자가 커스터마이즈해 저장한 것 |

기본 스타일 24~26종, 변형 포함 **82종** (Skinner Books 카탈로그 기준; Cloudflare 봇체크로 캡처 실패).

**Style은 "한 번 클릭하면 책 전체 변경"이 핵심 UX.** 부분 조정은 *Configure 패널*에서.

---

## 6. 사용자에게 노출하는 옵션 vs 숨기는 옵션

### 6.1 Style Configure 패널 (책마다 만지는 곳)

스타일 카드 우상단 Configure 버튼 → 우측 패널에 항목별 옵션:

| 항목 | 만질 수 있는 것 | 만질 수 없는 것 |
|---|---|---|
| Heading | 헤딩 이미지, Numbered 토글 | 헤딩 폰트 직접 선택 (스타일 안에서 정해짐) |
| Subhead | 표시/숨김 | 디자인 |
| First Paragraph | 들여쓰기 on/off | 들여쓰기 길이 |
| Paragraph After Break | 들여쓰기 on/off | 깊이 |
| Header / Footer | 위치·내용(verso/recto) | 폰트 |
| Background / Border | on/off | 색상 |
| **Body** | **(아래 6.2)** | |
| Ornamental Break | 그림 선택 | 직접 그림 업로드(?) |
| Block Quotation | 들여쓰기 토글 | 인용부호 종류 |
| Verse | 정렬 | 폰트 |
| Text Conversation | (특수) | |

### 6.2 Body Style 패널 — 본문에서 사용자가 만지는 거의 전부

스크린샷(`50-styles-body.png`) 기준 노출 항목:

1. **Font Size 슬라이더** (포인트 비공개)
2. **Line Spacing 슬라이더** (값 비공개)
3. **Hyphenation 토글**
4. **Capitalize Words** (도시명·이름 대문자화 자동)
5. **Quoting** (스마트 따옴표 종류)
6. **Fonts in Print** — Body / Drop Cap / Number **3개 폰트군**을 *Vellum이 제공한 26종 리스트* 안에서만 선택
7. **Drop Cap** 사용 여부 + 이모지/심볼
8. **Clarifying Scene Breaks** (씬 브레이크 스타일)

**Body에서도 만질 수 없는 것**: 자간, 폰트 직접 추가, 헤딩 폰트, 줄간 정확한 pt, 마진, 정렬(좌/양끝).

### 6.3 Print Settings (한 번 정하고 끝나는 인쇄 옵션)

스크린샷(`31-print-settings.png`) 기준:

| 옵션 | 노출 형태 |
|---|---|
| Trim Size | 드롭다운 + More Options (US/UK · International 탭) |
| Margins | **Inside / Outside 2축만**. Top/Bottom은 자동. |
| Text Size · Line Spacing | 슬라이더 |
| Headings | 카테고리 (장식 정도 선택) |
| Drop Caps | on/off |
| Chapter Begin | 첫장만 우측 / 매장 우측 |
| Page Numbering | 첫 챕터부터 / 처음부터 |
| Page Footer | 위치 |
| Bleed | 안 함 / 필요할 때만 / 항상 |
| Images | BW / Color |
| Page Count | 자동 표시 (입력 아님) |
| Units | inch / mm 전환 |

**모두 합쳐도 옵션이 12개 정도다.** 한 화면에 들어간다.

### 6.4 우리(sungjin_book)와의 노출 비교

| 항목 | Vellum 노출 | sungjin_book D-011 노출 | 격차 |
|---|---|---|---|
| 판형 | ✅ | ✅ | 동일 |
| 테마 카드 | ✅ (24~26종) | ✅ (1단계: classic 1종, 2단계: 2종) | 적음 — 의도적 |
| Font size 슬라이더 | ✅ | 🚫 | **시장 표준에 미달** |
| Line spacing 슬라이더 | ✅ | 🚫 | **시장 표준에 미달** |
| Hyphenation 토글 | ✅ | 🚫 | 한국어엔 무의미(OK) |
| Drop Cap | ✅ | 🚫 | 한국어엔 적합 X(OK) |
| Bleed 자동/필요시 | ✅ | 🚫 (감사 P0 A1) | **차이** — 트랙 A 마무리에서 박을 것 |
| Chapter Begin (우측/매장) | ✅ | 🔧 자동 우측 | 호환 |
| 자간 노출 | 🚫 | 🚫 | 동일 |
| 마진 4방향 | 🚫 (Inside/Outside만) | 🚫 (자동) | 더 자동 |

**결정 후보**: 2단계에 *Font Size 슬라이더(-1/0/+1)*와 *Bleed 자동*은 들어가는 게 맞다. **시장 1위가 둘 다 노출한다.**

---

## 7. 자동조판 알고리즘 — Vellum이 자랑하는 부분

`32-print-auto-layout.png` 본문 정리:

| 기능 | 동작 |
|---|---|
| **위도우/오펀 방지** | 단락 마지막 줄이 다음 페이지 첫 줄만 가는 위도우, 새 섹션 첫 줄만 이전 페이지 끝에 남는 오펀을 자동 조정 |
| **면 배치 균형** | verso와 recto의 본문 끝 줄을 같은 baseline에 맞춤 (Balancing Spreads). 우선순위 높음. |
| **단락 끝 단어 1개 방지** | 마지막 단어 1개가 줄을 차지하지 않도록 reflow |
| **하이픈 과다 방지** | 연속 하이픈 분리 제한 |
| **챕터 마지막 페이지 최소 줄 수 5** | 5줄 미만으로 끝나면 자동 길이 조정 |
| **Subhead 페이지 하단 회피** | 페이지 하단 소제목을 다음 페이지 상단으로 |

→ **우리 트랙 A에서 P0/P1로 박힌 위도우/오펀(A8), 챕터 마지막 페이지 처리는 Vellum이 이미 답을 모범으로 보여주고 있다**. Typst에서 `widow-orphan` 패키지 + 사용자 정의 면 배치 후처리 필요.

---

## 8. 가격·플랫폼

- **Vellum Press** $249.99 — ebook + print 양쪽 출력
- **Vellum Ebooks** $199.99 — ebook만
- 다운로드·미리보기·편집은 **무료**. *Generate(파일 내보내기)* 단계에서 라이선스 검증.
- Mac 전용 (macOS 정식 지원). Windows 사용자는 *Parallels/가상화* 가이드(`/guides/using-on-windows/`) 별도.

**비즈니스 모델 시사점**:
- 일회성. 구독 아님. (Atticus와 동일)
- *내보내기*가 페이월. *편집*은 풀 무료. → 사용자가 충분히 만져보고 결과물이 마음에 들 때 결제.
- 우리에게 적용: 트랙 B의 *내보내기/POD 주문*이 결제 지점이지 *편집/미리보기*는 풀 무료여야 한다(D-009와 일관). ✅

---

## 9. created.vellum.pub — 사용자 작품 갤러리

스크린샷 `04-gallery.png`:
- Vellum으로 출판된 책들을 표지 + 1줄 추천사 + 저자 카드 형태로 노출
- 마케팅 SEO 자산이자 신규 사용자 **"이런 책 만들 수 있다"** 증거
- 일부는 표지 비어 있음(아직 표지 안 만든 작가의 데모용으로 보임)

**우리에게 적용**: 트랙 B 안정화 후 `book.sungjin.kr/created` 같은 도메인으로 작가가 자기 책을 공개 옵션. ISBN·POD까지 우리가 해주면 갤러리가 곧 *서점*이 됨(차별화).

---

## 10. 우리에게 주는 6가지 결론

| # | 결론 | 어디에 반영 |
|---|---|---|
| 1 | **3분할 UI**(Navigator / Editor / Preview)는 자동조판 시장 표준. 그대로 베껴도 됨. | 트랙 B 레이아웃 |
| 2 | **Style 카테고리 6종**은 1단계엔 과해. 우린 "스타일 2개"로 시작해도 카테고리 구조는 미래(2단계 modern/3단계 manuscript)를 위해 준비. | JSON v2 `format.theme_id` |
| 3 | **Element 18종 중 1단계엔 Chapter / Copyright / Title Page 3종**이면 충분. 1단계 책 1권은 박힘. | JSON v2 `front_matter` / `body` |
| 4 | **Text Feature 6종 인라인**(B/I/U/Smallcaps/Monospace/Strikethrough) + 6종 블록(Subhead/OrnBreak/Quote/Verse/List/Image)이 시장 합집합. 우린 1단계 4종으로 시작했지만 v2 스키마엔 자리만 만들 것. | JSON v2 `blocks` |
| 5 | **Auto-Layout 6규칙**은 Typst로 1:1 구현 가능. 트랙 A 마무리(P0/P1)에 박을 것. | 트랙 A P0/P1 |
| 6 | **Font Size 슬라이더 -1/0/+1**과 **Bleed 자동/필요시**는 시장 1위가 노출한다. 우리 D-011 "노출 최소" 원칙은 유지하되 이 2개만 2단계 후보로 격상. | D-011 보완 |

---

## 11. Vellum이 못 하는 것 = 우리 차별화

| 영역 | Vellum | sungjin_book 차별화 |
|---|---|---|
| 한국어 조판 | 못 함 (영어 위주) | KLREQ, 노토 CJK, 한영 자간 자동 |
| **한자 루비** | ❌ | ✅ JSON 인라인 `[漢字]{ruby:한자}` |
| 한국 판형 | 없음 (신국판/국판/4·6판/크라운 모두 없음) | ✅ 1단계 신국판부터 박힘 |
| 협업/클라우드 | 없음 (.vellum 로컬 파일) | ✅ Supabase 클라우드, 다기기 |
| ISBN·POD 통합 | 없음 (KDP 따로) | ✅ 트랙 C에서 sungjinprint·교보 연동 (북극성) |
| 결제 모델 | $249 일회성 | 무료 + 인쇄/유통 마진 (D-009) |
| 웹 접근성 | Mac만 | ✅ 웹 (윈도/맥/태블릿 어디서나) |

**한 줄로**: 우리는 **"Vellum의 자동조판 철학 + Atticus의 웹 접근성 + 부크크의 ISBN/POD + 한국어 조판 표준 + 한자 루비"** 다섯의 합집합.

---

## 12. 스크린샷 인덱스 (27장)

| 파일 | 페이지 | 키 인사이트 |
|---|---|---|
| 01-home.png | vellum.pub | 4섹션 마케팅 + 가격 |
| 02-store.png | store | $249.99 Press / $199.99 Ebooks |
| 03-blog.png | blog | Graph Word Count 등 신기능 발표 채널 |
| 04-gallery.png | created.vellum.pub | 사용자 작품 마케팅 |
| 10-help-home.png | help 허브 | 7개 메뉴 그룹 |
| 11-tutorial.png | tutorial | 9단계 워크플로우의 원본 |
| 12-importing.png | importing | .docx만 지원, Heading 1 = 챕터 |
| 13-purchasing.png | purchasing FAQ | 라이선스 정책 |
| 20-title-info.png | 책 메타데이터 | 저자/제목/시리즈 입력 |
| 21-elements.png | Element 18종 | 5.1절 표 원본 |
| 22-headings.png | 챕터 헤딩 | 부제·헤딩이미지·번호 토글 |
| 23-text-features.png | Text Feature 17종 | 5.2절 표 원본 |
| 24-text-editor.png | 에디터 UI | 도구모음 + Find |
| 25-styles.png | Style 카드 그리드 | 6 카테고리 |
| 26-preview.png | Preview UI | 디바이스 드롭다운, Draft/Proof |
| 30-print.png | Print 개요 | — |
| **31-print-settings.png** | **Print Settings 12옵션** | **6.3절 표의 원본** |
| **32-print-auto-layout.png** | **Auto-Layout 6규칙** | **7절 표의 원본** |
| 40-generating.png | Generate | 플랫폼별 폴더 출력 |
| 41-proofing.png | Proofing | 인쇄 전 검증 |
| 42-uploading.png | Uploading | KDP/Apple/Kobo 업로드 가이드 |
| **50-styles-body.png** | **Body Style 패널** | **6.2절 표의 원본** |
| 60-guide-box-set.png | 박스셋 | Part/Volume Element 활용 |
| 61-guide-anthology.png | 앤솔로지 | — |
| 62-guide-large-print.png | Large Print | Accessible 카테고리와 연결 |
| 63-guide-windows.png | Windows에서 쓰기 | Parallels 안내 |
| 70-flipbook-skinner.png | (외부 카탈로그) | ❌ Cloudflare 봇체크에 막힘 |

---

## 13. 다음 액션 후보

1. **Atticus도 같은 깊이로 조사** — 웹앱 UI 직접 참고. *추천*
2. **Reedsy 조사** — 무료·최소 노출 정책의 모범
3. **JSON 스키마 v2 작성** — 본 보고서 5절 (Element/TextFeature/Style 3축)을 그대로 v2 골격으로
4. **트랙 B Next.js 골격** — 3분할 UI(4절)부터 박기

---

*조사 종료: 2026-05-18. 27장 캡처 + 9개 help 페이지 본문 분석. 누락: 82-style flipbook(봇체크), 실제 Mac 앱 화면(앱 미설치).*
