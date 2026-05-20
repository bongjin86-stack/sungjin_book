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
//   2026-05-20 (Claude): Reedsy/Cambric 베이스라인 적용 —
//                        챕터 첫 페이지 위 여백 8em → 5em (한국 단행본 통례 근접).
//                        드롭캡(dropCaps)·러닝헤더(runningHeader) 옵션 처리.
//                        속표지 subtitle, matter-page 가운데 정렬 옵션.

// === 폰트 fallback 체인 ===
// 프로젝트 fonts/ 폴더에 OFL 노토 KR 4종 동봉 (D-009).
// 컴파일 시 --font-path fonts 옵션 필수.
#let serif-fonts = ("Noto Serif KR", "Noto Serif CJK KR")
// 산스 KR 미동봉 환경(브라우저 typst.ts PoC 등)에선 마지막에 세리프 fallback.
// 산스 KR이 있는 환경(서버 PDF 등)에선 첫 폰트가 잡혀 영향 없다.
#let sans-fonts = ("Noto Sans KR", "Noto Sans CJK KR", "Noto Serif KR", "Noto Serif CJK KR")

// === 페이지 추적 상태 ===
// query(<label>) 방식이 Typst 0.13.x에서 불안정하므로 state로 직접 기록한다.
//
// chapter-start-pages: 챕터 시작 페이지 번호들. hide-chapter-pn 옵션 대상.
// matter-pages       : 매터(속표지/판권지/목차/서문 등) 페이지 번호들. 항상 쪽번호 숨김.
// pagebreak(to: "odd")이 끼워 넣는 빈 짝수 페이지는 chapter-start나 matter의 "n+1"로 추론.
#let chapter-start-pages = state("chapter-start-pages", ())
#let matter-pages = state("matter-pages", ())

// 본문 시작 = 첫 챕터 페이지. 그 이전(매터)과 이후(본문)을 구분해서
// 쪽번호 형식(로마자 vs 아라비아)을 자동 분리한다.
#let first-chapter-page = state("first-chapter-page", none)

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
  let pn-format = opts.at("pageNumberFormat", default: "arabic")
  let front-matter-numbering = opts.at("frontMatterNumbering", default: "none")
  let show-pn = opts.at("showPageNumber", default: true)
  // 챕터 시작 페이지 쪽번호 숨김 — 영문 단행본 통례. 한국 단행본은 기본 표시.
  let hide-chapter-pn = opts.at("hideChapterStartPageNumber", default: false)
  let indent = opts.at("paragraphIndent", default: true)
  let show-chapter-num = opts.at("showChapterNumber", default: true)
  let drop-caps = opts.at("dropCaps", default: false)
  let running-header = opts.at("runningHeader", default: false)
  let show-margin-guide = opts.at("showMarginGuide", default: false)
  let book-title = data.at("meta", default: (:)).at("title", default: "")

  // --- 챕터 시작 페이지의 현재 챕터 제목 추적 (러닝 헤더용) ---
  let current-chapter-title = state("current-chapter-title", "")

  // --- 챕터 함수 (book 내부 스코프 — show-chapter-num 캡처) ---
  let chapter(number: 1, title: "", subtitle: "") = [
    #pagebreak(to: "odd", weak: true)

    // 현재 페이지 번호를 챕터 시작 목록에 추가
    // + 첫 챕터라면 first-chapter-page 기록 (매터/본문 분리 기준)
    #context {
      let n = counter(page).at(here()).first()
      chapter-start-pages.update(pages => pages + (n,))
      first-chapter-page.update(prev => if prev == none { n } else { prev })
    }

    // 러닝 헤더용 현재 챕터 제목 갱신
    #current-chapter-title.update(_ => title)

    // 위쪽 여유 (한국 단행본 챕터 첫 페이지 통례 — 5em 정도가 표준)
    #v(5em)

    // 챕터 번호 — 옵션이 켜져 있을 때만
    #if show-chapter-num [
      #align(center)[
        #text(font: sans-fonts, weight: "bold", size: 14pt)[제 #number 장]
      ]
      #v(1.2em)
    ]

    // 챕터 제목 — 산스 Bold 18pt, 가운데. 비어있으면 줄/공간을 차지하지 않음.
    #if title != none and title != "" [
      #align(center)[
        #text(font: sans-fonts, weight: "bold", size: 18pt)[#title]
      ]
    ]

    // 챕터 부제 — 제목 아래 작게 이탤릭 (Vellum 표준)
    #if subtitle != none and subtitle != "" [
      #v(0.8em)
      #align(center)[
        #text(font: serif-fonts, style: "italic", size: 12pt)[#subtitle]
      ]
    ]

    #v(2.6em)
  ]

  // --- 빈 페이지 판단 ---
  // pagebreak(to: "odd")가 끼워 넣은 짝수 빈 페이지 = 다음 페이지가 챕터/매터 시작.
  // 단행본 표준: 빈 페이지는 쪽번호도 헤더도 표시하지 않는다.
  let is-blank-spacer(n, start-pages, mp) = {
    calc.even(n) and (start-pages.contains(n + 1) or mp.contains(n + 1))
  }

  // --- 쪽번호 형식 변환 ---
  // body: 1·2·3 또는 i·ii / matter: 로마자(roman) 또는 없음(none).
  // matter는 본문 시작 시점 기준으로 매겨 i, ii … 식으로 정방향 정렬.
  // matter-pages(속표지/판권지/목차/서문 등)는 **항상** 쪽번호 숨김.
  let render-pn(n, start-pages, fcp, mp) = {
    if not show-pn { return none }
    if is-blank-spacer(n, start-pages, mp) { return none }

    // 매터 페이지 자체는 무조건 숨김 (속표지/판권지/목차/서문 등)
    if mp.contains(n) { return none }

    // matter / body 분리 — 본문 시작 전(=첫 챕터 이전)은 매터로 간주
    let in-matter = fcp == none or n < fcp
    if in-matter {
      // 매터 영역(본문 첫 챕터 이전). matter-pages는 위에서 이미 거름.
      // 그 사이 일반 페이지(거의 없지만)는 frontMatterNumbering 정책 따름.
      if front-matter-numbering == "none" { return none }
      let num = numbering("i", n)
      let pos = if pn-pos == "bottom-outside" or pn-pos == "top-outside" {
        if calc.odd(n) { right } else { left }
      } else { center }
      return align(pos)[#text(font: serif-fonts, size: 9pt)[#num]]
    }

    // 본문 페이지 — 첫 챕터부터 1, 2, 3...
    // 챕터 시작 페이지 쪽번호 숨김 옵션 (기본 off)
    if hide-chapter-pn and start-pages.contains(n) { return none }
    let body-n = n - fcp + 1
    let num = if pn-format == "roman" { numbering("i", body-n) } else { str(body-n) }
    let pos = if pn-pos == "bottom-outside" or pn-pos == "top-outside" {
      if calc.odd(n) { right } else { left }
    } else { center }
    align(pos)[#text(font: serif-fonts, size: 9pt)[#num]]
  }

  // --- 러닝 헤더 렌더링 (옵션 토글) ---
  // 짝수 페이지: 책 제목 (왼쪽 = 안쪽). 홀수 페이지: 챕터 제목 (오른쪽 = 안쪽).
  // 한국 단행본 통례: 챕터 시작 페이지·매터 페이지·빈 페이지에는 헤더 없음.
  let render-header(n, start-pages, mp) = {
    if not running-header { return none }
    if start-pages.contains(n) { return none }
    if mp.contains(n) { return none }
    if is-blank-spacer(n, start-pages, mp) { return none }
    let label = if calc.odd(n) {
      current-chapter-title.at(here())
    } else { book-title }
    if label == none or label == "" { return none }
    let pos = if calc.odd(n) { right } else { left }
    align(pos)[#text(font: serif-fonts, size: 9pt, style: "italic")[#label]]
  }

  // --- 여백 가이드 (Vellum 스타일) ---
  // 본문 영역(여백 안쪽)을 점선 사각형으로 표시. 미리보기 전용. 인쇄 시엔 자동 무시.
  // 미리보기는 단면이라 안/밖을 좌/우 대신 일관되게 안=왼쪽으로 그린다.
  let margin-guide = if show-margin-guide {
    place(
      top + left,
      dx: 20mm, dy: 22mm,
      rect(
        width: 152mm - 20mm - 18mm,
        height: 225mm - 22mm - 25mm,
        stroke: (paint: rgb("#3b82f6"), thickness: 0.3pt, dash: "dashed"),
      ),
    )
  } else { none }

  // --- 페이지 ---
  // 판형/여백은 "땅" (절대 변경 금지)
  // state.at(here())는 시점값이라 아직 안 지난 챕터를 못 본다 → final()로 전체 목록 사용.
  set page(
    width: 152mm,
    height: 225mm,
    margin: (inside: 20mm, outside: 18mm, top: 22mm, bottom: 25mm),
    background: margin-guide,
    header: context {
      let n = counter(page).at(here()).first()
      let sp = chapter-start-pages.final()
      let mp = matter-pages.final()
      let fcp = first-chapter-page.final()
      if pn-pos == "top-outside" {
        render-pn(n, sp, fcp, mp)
      } else {
        render-header(n, sp, mp)
      }
    },
    footer: context {
      let n = counter(page).at(here()).first()
      let sp = chapter-start-pages.final()
      let mp = matter-pages.final()
      let fcp = first-chapter-page.final()
      if pn-pos != "top-outside" { render-pn(n, sp, fcp, mp) }
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
  // after-chapter: 챕터 직후 첫 단락 추적. drop-caps 옵션에서 사용.
  let after-chapter = false
  for blk in data.blocks {
    if blk.type == "chapter" {
      chapter(
        number: blk.number,
        title: blk.title,
        subtitle: blk.at("subtitle", default: ""),
      )
      after-chapter = true
    } else if blk.type == "paragraph" {
      // KLREQ G3 — 어절 단위 줄바꿈. 각 어절을 box로 묶어 단어 가운데
      // 글자 단위 잘림 방지. 한국어 어절(공백 기준)과 영문 단어 둘 다 적용.
      let words = blk.text.split(" ")
      let apply-dropcap = drop-caps and after-chapter and blk.text.len() > 0
      if apply-dropcap and words.len() > 0 {
        // 첫 어절의 첫 글자만 드롭캡 (3em 산스 Bold).
        // 진짜 float wrap이 아니라 인라인 강조 — 한국어 본문 첫인상을 의도적으로 키움.
        // 한글/이모지는 멀티바이트라 .at(byte) 대신 .clusters()로 그래핌 단위 분해.
        let first-word = words.at(0)
        let cls = first-word.clusters()
        let first-char = if cls.len() > 0 { cls.at(0) } else { "" }
        let first-rest = if cls.len() > 1 { cls.slice(1).join("") } else { "" }
        text(font: sans-fonts, size: 3em, weight: "bold", baseline: 0.4em)[#first-char]
        box(first-rest)
        for (i, w) in words.enumerate() {
          if i == 0 { continue }
          " "
          box(w)
        }
      } else {
        for (i, w) in words.enumerate() {
          if i > 0 { " " }
          box(w)
        }
      }
      after-chapter = false
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
      after-chapter = false
    } else if blk.type == "half-title" {
      // 속표지 — 홀수 페이지 시작, 책 제목·부제·저자, 하단에 출판사.
      // 비율: 위 1fr · 제목 · 부제 · 저자 · 1.4fr · 출판사 · 1fr
      // (단행본 표준: 제목 그룹은 페이지 위쪽 1/3 지점, 출판사는 하단 1/5 지점)
      pagebreak(to: "odd", weak: true)
      context {
        let n = counter(page).at(here()).first()
        matter-pages.update(pages => pages + (n,))
      }
      v(1fr)
      align(center)[
        #text(font: sans-fonts, weight: "bold", size: 26pt)[#blk.title]
      ]
      if "subtitle" in blk and blk.subtitle != none and blk.subtitle != "" [
        #v(1em)
        #align(center)[
          #text(font: serif-fonts, size: 13pt, style: "italic")[#blk.subtitle]
        ]
      ]
      if "author" in blk and blk.author != none and blk.author != "" [
        #v(2em)
        #align(center)[
          #text(font: serif-fonts, size: 13pt)[#blk.author]
        ]
      ]
      v(1.4fr)
      if "publisher" in blk and blk.publisher != none and blk.publisher != "" [
        #align(center)[
          #text(font: sans-fonts, size: 10pt)[#blk.publisher]
        ]
      ]
      v(1fr)
      after-chapter = false
    } else if blk.type == "copyright" {
      // 판권지 — 홀수 페이지 시작, 하단 영역에 작게
      pagebreak(to: "odd", weak: true)
      context {
        let n = counter(page).at(here()).first()
        matter-pages.update(pages => pages + (n,))
      }
      v(1fr)
      align(center)[
        #text(font: serif-fonts, size: 9pt)[#blk.body]
      ]
      v(0.5fr)
      after-chapter = false
    } else if blk.type == "toc" {
      // 목차 — 홀수 페이지 시작, 챕터 목록 박스
      pagebreak(to: "odd", weak: true)
      context {
        let n = counter(page).at(here()).first()
        matter-pages.update(pages => pages + (n,))
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
      after-chapter = false
    } else if blk.type == "matter-page" {
      // 일반 matter — 서문/저자소개/에필로그 등. 홀수 페이지 시작, 제목, 본문.
      // 본문이 짧을 때 페이지 위쪽에 덜렁하지 않도록 위·아래 fr 여백으로 가운데 정렬.
      // (긴 본문은 자연스럽게 페이지를 채움)
      pagebreak(to: "odd", weak: true)
      context {
        let n = counter(page).at(here()).first()
        matter-pages.update(pages => pages + (n,))
      }
      let body-text = blk.at("body", default: "")
      let is-short = body-text.len() < 400
      if is-short { v(1fr) } else { v(5em) }
      if blk.title != none and blk.title != "" [
        #align(center)[
          #text(font: sans-fonts, weight: "bold", size: 18pt)[#blk.title]
        ]
        #v(2em)
      ]
      // 본문 — 짧은 글은 가운데, 긴 글은 좌측 정렬
      if is-short [
        #align(center)[#body-text]
        #v(1fr)
      ] else [
        #body-text
      ]
      after-chapter = false
    }
  }
}
