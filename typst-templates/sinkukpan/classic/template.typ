// 신국판 Classic — sungjin_book 1단계 템플릿
//
// 사양 (CLAUDE.md):
//   판형  : 152 × 225 mm
//   여백  : 안 20 / 밖 18 / 위 22 / 아래 25 mm  ← "땅" (절대 변경 금지)
//   본문  : 노토 세리프 CJK KR 10pt / 줄간 18pt / 양끝 정렬 (옵션 기본값)
//   제목  : 노토 산스 CJK KR Bold (챕터번호 14pt, 챕터제목 18pt)
//   챕터  : 홀수 페이지 시작, 시작 페이지 쪽번호 없음
//   쪽번호: 하단 바깥쪽, 노토 세리프 9pt (옵션 기본값)
//   들여쓰기: 첫 단락 없음, 둘째부터 1글자
//
// JSON 스키마: sungjin-book/v1 (decisions.md D-006)
// 변환: Typst 네이티브 json() 사용 (D-008). 별도 변환 스크립트 없음.
//
// 수정 이력:
//   2026-05-19 (Manus): 챕터 시작 쪽번호 억제 버그 수정 (state 방식으로 교체)
//                       단락 간격(spacing) 통일 → 기준선 그리드 정렬
//   2026-05-19 (Claude): 설정 시스템 도입 — meta.options 동적 파싱.
//                        chapter를 book 내부 스코프로 이동(showChapterNumber 캡처).

// === 폰트 fallback 체인 ===
// 프로젝트 fonts/ 폴더에 OFL 노토 KR 4종 동봉 (D-009).
// 컴파일 시 --font-path fonts 옵션 필수.
#let serif-fonts = ("Noto Serif KR", "Noto Serif CJK KR")
// 산스 KR 미동봉 환경(브라우저 typst.ts PoC 등)에선 마지막에 세리프 fallback.
// 산스 KR이 있는 환경(서버 PDF 등)에선 첫 폰트가 잡혀 영향 없다.
#let sans-fonts = ("Noto Sans KR", "Noto Sans CJK KR", "Noto Serif KR", "Noto Serif CJK KR")

// === 챕터 시작 상태 추적 ===
// query(<label>) 방식이 Typst 0.13.x에서 불안정하므로
// state를 사용하여 챕터 시작 페이지 번호를 직접 기록한다.
#let chapter-start-pages = state("chapter-start-pages", ())

// === 메인: 콘텐츠 JSON을 받아 책 1권을 렌더 ===
#let book(data) = {
  // --- 옵션 파싱 (기본값 폴백 포함) ---
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

  // --- 챕터 함수 (book 내부 스코프 — show-chapter-num 캡처) ---
  let chapter(number: 1, title: "") = [
    #pagebreak(to: "odd", weak: true)

    // 현재 페이지 번호를 챕터 시작 목록에 추가
    #context {
      let n = counter(page).at(here()).first()
      chapter-start-pages.update(pages => {
        pages + (n,)
      })
    }

    // 위쪽 여유 (한국 단행본 챕터 첫 페이지 통례)
    #v(8em)

    // 챕터 번호 — 옵션이 켜져 있을 때만
    #if show-chapter-num [
      #align(center)[
        #text(font: sans-fonts, weight: "bold", size: 14pt)[제 #number 장]
      ]
      #v(0.6em)
    ]

    // 챕터 제목 — 산스 Bold 18pt, 가운데
    #align(center)[
      #text(font: sans-fonts, weight: "bold", size: 18pt)[#title]
    ]

    #v(2em)
  ]

  // --- 쪽번호 렌더링 함수 ---
  let render-pn(n, start-pages) = {
    if not show-pn { return none }
    if hide-chapter-pn and start-pages.contains(n) { return none }
    let pos = if pn-pos == "bottom-outside" or pn-pos == "top-outside" {
      if calc.odd(n) { right } else { left }
    } else { center }
    align(pos)[#text(font: serif-fonts, size: 9pt)[#n]]
  }

  // --- 페이지 ---
  // 판형/여백은 "땅" (절대 변경 금지)
  set page(
    width: 152mm,
    height: 225mm,
    margin: (inside: 20mm, outside: 18mm, top: 22mm, bottom: 25mm),
    header: context {
      let n = counter(page).at(here()).first()
      let sp = chapter-start-pages.at(here())
      if pn-pos == "top-outside" { render-pn(n, sp) }
    },
    footer: context {
      let n = counter(page).at(here()).first()
      let sp = chapter-start-pages.at(here())
      if pn-pos != "top-outside" { render-pn(n, sp) }
    },
  )

  // --- 본문 텍스트 ---
  // lang: "ko" → 한국어 줄바꿈/금칙 적용
  // cjk-latin-spacing: auto → 한영 자간 자동 조정 (KLREQ 대응)
  set text(font: body-font, size: body-size, lang: "ko", cjk-latin-spacing: auto)

  // --- 단락 ---
  // leading/spacing은 옵션값(spacing-val)으로 동적 결정
  // first-line-indent: all=false → 챕터/제목 직후 첫 단락은 들여쓰기 없음,
  //                                단락이 이어질 때만 1em 들여쓰기.
  set par(
    leading: spacing-val,
    spacing: spacing-val,
    justify: true,
    first-line-indent: if indent { (amount: 1em, all: false) } else { 0pt },
  )

  // --- 블록 디스패치 ---
  for blk in data.blocks {
    if blk.type == "chapter" {
      chapter(number: blk.number, title: blk.title)
    } else if blk.type == "paragraph" {
      // KLREQ G3 — 어절 단위 줄바꿈. 각 어절을 box로 묶어 단어 가운데
      // 글자 단위 잘림 방지. 한국어 어절(공백 기준)과 영문 단어 둘 다 적용.
      let words = blk.text.split(" ")
      for (i, w) in words.enumerate() {
        if i > 0 { " " }
        box(w)
      }
      parbreak()
    } else if blk.type == "heading" {
      let level = blk.at("level", default: 2)
      heading(level: level)[
        #text(font: sans-fonts, weight: "bold")[#blk.text]
      ]
    } else if blk.type == "quote" {
      block(inset: (left: 2em, right: 2em))[
        #emph(blk.text)
        #if "by" in blk [ — #blk.by]
      ]
      parbreak()
    } else if blk.type == "half-title" {
      // 속표지 — 홀수 페이지 시작, 책 제목·저자·출판사
      pagebreak(to: "odd", weak: true)
      context {
        let n = counter(page).at(here()).first()
        chapter-start-pages.update(pages => pages + (n,))
      }
      v(1fr)
      align(center)[
        #text(font: sans-fonts, weight: "bold", size: 26pt)[#blk.title]
      ]
      if "author" in blk and blk.author != none and blk.author != "" [
        #v(2em)
        #align(center)[
          #text(font: serif-fonts, size: 13pt)[#blk.author]
        ]
      ]
      v(1fr)
      if "publisher" in blk and blk.publisher != none and blk.publisher != "" [
        #align(center)[
          #text(font: sans-fonts, size: 10pt)[#blk.publisher]
        ]
        #v(2em)
      ]
    } else if blk.type == "copyright" {
      // 판권지 — 홀수 페이지 시작, 하단 영역에 작게
      pagebreak(to: "odd", weak: true)
      context {
        let n = counter(page).at(here()).first()
        chapter-start-pages.update(pages => pages + (n,))
      }
      v(1fr)
      align(center)[
        #text(font: serif-fonts, size: 9pt)[#blk.body]
      ]
      v(0.5fr)
    } else if blk.type == "toc" {
      // 목차 — 홀수 페이지 시작, 챕터 목록 박스
      pagebreak(to: "odd", weak: true)
      context {
        let n = counter(page).at(here()).first()
        chapter-start-pages.update(pages => pages + (n,))
      }
      v(6em)
      align(center)[
        #text(font: sans-fonts, weight: "bold", size: 18pt)[목차]
      ]
      v(2em)
      for entry in blk.entries [
        #grid(
          columns: (auto, 1fr, auto),
          align: (left, center, right),
          text(font: serif-fonts, size: 11pt)[#entry.chapterNum],
          [],
          text(font: serif-fonts, size: 11pt)[#entry.title],
        )
        #v(0.6em)
      ]
    } else if blk.type == "matter-page" {
      // 일반 matter — 서문/저자소개/에필로그 등. 홀수 페이지 시작, 제목 가운데, 본문.
      pagebreak(to: "odd", weak: true)
      context {
        let n = counter(page).at(here()).first()
        chapter-start-pages.update(pages => pages + (n,))
      }
      v(6em)
      align(center)[
        #text(font: sans-fonts, weight: "bold", size: 18pt)[#blk.title]
      ]
      v(2em)
      blk.body
    }
  }
}
