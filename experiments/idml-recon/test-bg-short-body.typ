// 디버그 — short body + background
#import "/typst-templates/edu/presets/simply-classic/decorations.typ": page-decorations

#set page(
  width: 623.62pt, height: 850.39pt,
  margin: 56.69pt,
  background: page-decorations.at("12", default: [DECO-EMPTY]),
)

#columns(2, gutter: 21.95pt, [
  짧은 본문 좌측 첫 줄.
  다음 줄.
])
