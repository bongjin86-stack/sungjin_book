// 디버그 — page-decorations["12"]만 background에 박아 확인
#import "/typst-templates/edu/presets/simply-classic/decorations.typ": page-decorations

#set page(
  width: 623.62pt, height: 850.39pt, margin: 0pt,
  background: page-decorations.at("12", default: [DECO-EMPTY]),
)

= 빈 본문 (배경만 보고 싶음)
