// S2-1: bookData(JSON) → typst.ts 컴파일용 .typ 문자열 변환.
//
// 단일 source of truth = root `typst-templates/sinkukpan/classic/template.typ`.
// postinstall 스크립트(copy-typst-templates)가 public/typst-templates/ 로 동일 사본을 만들고,
// 브라우저는 fetch로 받아 typst.ts addSource로 가상 파일시스템에 박는다.

/** 콘텐츠 JSON 스키마 sungjin-book/v1. content/*.json과 동일. */
export interface BookData {
  schema: "sungjin-book/v1";
  meta: {
    title: string;
    author?: string;
    options?: Record<string, unknown>;
  };
  blocks: Block[];
}

export type Block =
  | { type: "chapter"; number: number; title: string }
  | { type: "paragraph"; text: string }
  | { type: "heading"; level?: number; text: string }
  | { type: "quote"; text: string; by?: string };

/** main.typ 본체. data는 dict literal로 인라인. template은 import. */
export function buildMainSource(): string {
  return `#import "/template.typ": book
#let data = json("/data.json")
#book(data)
`;
}

/** book 데이터를 .json 문자열로 직렬화 (typst json() 함수가 읽음). */
export function buildDataJson(book: BookData): string {
  return JSON.stringify(book, null, 2);
}
