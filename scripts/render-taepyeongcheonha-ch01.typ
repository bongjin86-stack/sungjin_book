// 「태평천하」 1장 렌더 진입점
//
// 컴파일:
//   typst compile scripts/render-taepyeongcheonha-ch01.typ output/taepyeongcheonha-ch01.pdf
//
// 다른 책/챕터 추가 시 이 파일 복사 → JSON 경로만 바꾸면 됨.

#import "../typst-templates/sinkukpan/classic/template.typ": book

#let data = json("../content/taepyeongcheonha-ch01.json")
#book(data)
