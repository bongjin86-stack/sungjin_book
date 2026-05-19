// 신국판 Classic — sungjin_book 1단계 템플릿
//
// 사양 (CLAUDE.md):
//   판형  : 152 × 225 mm
//   여백  : 안 20 / 밖 18 / 위 22 / 아래 25 mm
//   본문  : 노토 세리프 CJK KR 10pt / 줄간 18pt / 양끝 정렬
//   제목  : 노토 산스 CJK KR Bold (챕터번호 14pt, 챕터제목 18pt)
//   챕터  : 홀수 페이지 시작, 시작 페이지 쪽번호 없음
//   쪽번호: 하단 바깥쪽, 노토 세리프 9pt
//   들여쓰기: 첫 단락 없음, 둘째부터 1글자
//
// JSON 스키마: sungjin-book/v1 (decisions.md D-006)
// 변환: Typst 네이티브 json() 사용 (D-008). 별도 변환 스크립트 없음.
//
// 수정 이력:
//   2026-05-19 (Manus): 챕터 시작 쪽번호 억제 버그 수정 (state 방식으로 교체)
//                       단락 간격(spacing) 통일 → 기준선 그리드 정렬

// === 폰트 fallback 체인 ===
// 프로젝트 fonts/ 폴더에 OFL 노토 KR 4종 동봉 (D-009).
// 컴파일 시 --font-path fonts 옵션 필수.
#let serif-fonts = ("Noto Serif KR", "Noto Serif CJK KR")
#let sans-fonts = ("Noto Sans KR", "Noto Sans CJK KR")

// === 챕터 시작 상태 추적 ===
// query(<label>) 방식이 Typst 0.13.x에서 불안정하므로
// state를 사용하여 챕터 시작 페이지 번호를 직접 기록한다.
#let chapter-start-pages = state("chapter-start-pages", ())

// === 챕터 함수 ===
// 홀수 페이지에서 시작하고, 현재 페이지 번호를 state에 기록한다.
// footer 함수에서 state를 읽어 챕터 시작 페이지 여부를 판단한다.
#let chapter(number: 1, title: "") = [
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

  // 챕터 번호 — 산스 Bold 14pt, 가운데
  #align(center)[
    #text(font: sans-fonts, weight: "bold", size: 14pt)[제 #number 장]
  ]

  #v(0.6em)

  // 챕터 제목 — 산스 Bold 18pt, 가운데
  #align(center)[
    #text(font: sans-fonts, weight: "bold", size: 18pt)[#title]
  ]

  #v(2em)
]

// === 메인: 콘텐츠 JSON을 받아 책 1권을 렌더 ===
#let book(data) = {
  // --- 페이지 ---
  set page(
    width: 152mm,
    height: 225mm,
    margin: (inside: 20mm, outside: 18mm, top: 22mm, bottom: 25mm),
    footer: context {
      let n = counter(page).at(here()).first()
      // 이 페이지가 챕터 시작 페이지인지 확인
      let start-pages = chapter-start-pages.at(here())
      if start-pages.contains(n) {
        // 챕터 시작 페이지: 쪽번호 표시 안 함
      } else {
        // 홀수 페이지 = 오른쪽(밖), 짝수 페이지 = 왼쪽(밖)
        let outer = if calc.odd(n) { right } else { left }
        set align(outer)
        text(font: serif-fonts, size: 9pt)[#n]
      }
    },
  )

  // --- 본문 텍스트 ---
  // lang: "ko" → 한국어 줄바꿈/금칙 적용
  // cjk-latin-spacing: auto → 한영 자간 자동 조정 (KLREQ 대응)
  set text(
    font: serif-fonts,
    size: 10pt,
    lang: "ko",
    cjk-latin-spacing: auto,
  )

  // --- 단락 ---
  // leading 8pt = 폰트 10pt 기준 baseline-to-baseline 약 18pt
  // spacing 8pt = 단락 간격도 동일하게 설정 → 기준선 그리드 정렬
  // first-line-indent: all=false → 챕터/제목 직후 첫 단락은 들여쓰기 없음,
  //                                단락이 이어질 때만 1em 들여쓰기.
  set par(
    leading: 8pt,
    spacing: 8pt,
    justify: true,
    first-line-indent: (amount: 1em, all: false),
  )

  // --- 블록 디스패치 ---
  for blk in data.blocks {
    if blk.type == "chapter" {
      chapter(number: blk.number, title: blk.title)
    } else if blk.type == "paragraph" {
      blk.text
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
    }
  }
}
