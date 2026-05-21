// presets/simply-classic/master-pages.typ
// IDML 자동 추출 보조 — MasterSpread XML에서 추출한 페이지 크기·마진을 master-spec으로.

#import "/typst-templates/edu/design-system/master-page.typ": master-spec

// 페이지 크기: 624 × 850pt (≈ 220 × 300mm) — IDML Page.GeometricBounds에서 추출
// 마진: inside 56.7pt(20mm), outside 141.7pt(50mm), top·bottom 56.7pt(20mm)
//   → 우측 외측 마진이 큼: 분석서 메모 공간 + 세로 라벨용
#let main-master = master-spec(
  width: 624pt,
  height: 850pt,
  margin: (
    inside: 56.69291338582678pt,
    outside: 141.73228346456693pt,
    top: 56.69291338582678pt,
    bottom: 56.69291338582678pt,
  ),
  header: none,
  footer: none,
)
