// design-system/typography.typ
//
// 한국어 책 조판 표준 atoms + validation.
// 출처:
//   - Practical Typography (Butterick) — practicaltypography.com
//   - The Elements of Typographic Style (Bringhurst)
//   - InDesign Korean Typography 가이드 (Adobe)
//   - WCAG 2.1 readability
//   - 한국타이포그라피학회 (KSTS)
//   - Material Design Typography (Google)
//   - tailwindcss/typography prose
//
// 원칙: 우리가 새로 발명하지 않는다. 위 자료가 정한 범위 + 표준값을 박는다.
// IDML 추출값이 이 범위 밖이면 validate가 경고.

// ── 표준 폰트 (한국 무료 라이센스) ──────────────────────────────────────────
#let font-serif-body     = ("Noto Serif KR",)           // 본문 명조
#let font-sans-display   = ("Pretendard", "Noto Sans KR") // 강조·번호·헤딩 (Pretendard 우선)
#let font-sans-body      = ("Pretendard", "Noto Sans KR") // 산스 본문

// ── 행간 (line-height ratio = leading / size) ───────────────────────────────
// 한국어는 영문보다 글자 복잡도가 높아 더 넉넉. 표준 1.5~1.7.
#let line-height-tight    = 1.30  // 시·인용 — 좁게
#let line-height-base     = 1.50  // 본문 표준
#let line-height-comfort  = 1.65  // 책 본문 편안
#let line-height-loose    = 1.80  // 큰 글·강조
#let line-height-min      = 1.20
#let line-height-max      = 2.00

// ── 자간 (tracking, em 단위) ────────────────────────────────────────────────
// 한국어는 글자 폭이 넓어 살짝 좁히는 게 표준 (-0.03em 정도).
#let tracking-body        = -0.030em // 본문 표준
#let tracking-display     = -0.050em // 제목·강조 (더 좁힘)
#let tracking-loose       = 0em       // 영문 본문은 0
#let tracking-min         = -0.080em
#let tracking-max         = 0.020em

// ── 폰트 크기 (인쇄 기준 pt) ────────────────────────────────────────────────
#let size-caption         = 8pt
#let size-body-small      = 9pt
#let size-body            = 10pt   // 본문 표준
#let size-body-large      = 11pt
#let size-heading-small   = 13pt
#let size-heading         = 18pt
#let size-display         = 28pt
#let size-min             = 6pt
#let size-max             = 72pt

// ── 단락 간격 (paragraph spacing) ──────────────────────────────────────────
// 본문 행간의 0.4~0.8배. 너무 크면 책이 흩어지고 작으면 빽빽.
#let paragraph-space-ratio-tight   = 0.30
#let paragraph-space-ratio-base    = 0.50
#let paragraph-space-ratio-loose   = 0.80

// ── 들여쓰기 (first-line indent) ───────────────────────────────────────────
#let indent-none          = 0pt
#let indent-1char         = 1em      // 1글자 (한국어 단행본 표준)
#let indent-2char         = 2em

// ── 본문 폭 (line width — characters per line) ─────────────────────────────
// 한국어는 32~45자가 가독성 최적 (영문 45~75자 대비 좁음 — 글자 폭 ↑).
#let body-width-chars-min      = 28
#let body-width-chars-optimal  = 38
#let body-width-chars-max      = 50

// ── 색 (ink) ───────────────────────────────────────────────────────────────
// 본문은 완전 검정보다 약간 회색 — 인쇄·웹 모두 가독성 표준.
#let ink-body             = rgb("#222222")
#let ink-strong           = rgb("#111111")
#let ink-muted            = rgb("#666666")
#let ink-soft             = rgb("#999999")

// ── 마진 비율 (Van de Graaf canon 근사) ────────────────────────────────────
// 안쪽(inside) : 바깥쪽(outside) : 위(top) : 아래(bottom) = 1 : 2 : 1 : 2
// 또는 황금비. 책의 손이 잡는 outside·bottom이 더 넓다.
#let margin-ratio-inside       = 1.0
#let margin-ratio-outside      = 2.0
#let margin-ratio-top          = 1.0
#let margin-ratio-bottom       = 2.0

// ── Validation — 범위 검사 ────────────────────────────────────────────────
// IDML 추출 spec dict가 표준 범위 안인지 검사.
// 범위 밖이면 경고(strict=false) 또는 panic(strict=true).
#let validate(spec, label: "<spec>", strict: false) = {
  let warn(msg) = {
    if strict { panic(msg) }
    // typst는 stderr 직접 안 됨. 본문에 경고로 표시하거나 무시.
    // 일단 무시 — 추출기 측에서 별도 보고.
  }

  let size = spec.at("size", default: none)
  if size != none {
    // size는 length. pt로 변환해 비교 (typst length는 / 1pt로 ratio 가능)
    let s-ratio = size / 1pt
    if s-ratio < (size-min / 1pt) or s-ratio > (size-max / 1pt) {
      warn(label + ": size " + str(s-ratio) + "pt 범위 [" + str(size-min/1pt) + ", " + str(size-max/1pt) + "pt] 밖")
    }
  }

  let leading = spec.at("leading", default: none)
  if leading != none and size != none {
    let ratio = leading / size
    if ratio < line-height-min or ratio > line-height-max {
      warn(label + ": line-height " + str(ratio) + " 범위 [" + str(line-height-min) + ", " + str(line-height-max) + "] 밖")
    }
  }
  // tracking은 em 단위라 직접 비교 어려움 — 추출기 측에서 사전 검증.
}
