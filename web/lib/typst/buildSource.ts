// S2-1: bookData(JSON) → typst.ts 컴파일용 .typ 문자열 변환.
//
// 단일 source of truth = root `typst-templates/sinkukpan/classic/template.typ`.
// postinstall 스크립트(copy-typst-templates)가 public/typst-templates/ 로 동일 사본을 만들고,
// 브라우저는 fetch로 받아 typst.ts addSource로 가상 파일시스템에 박는다.

/** 콘텐츠 JSON 스키마 sungjin-book/v1. content/*.json과 동일. */
export interface TypstBookData {
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

/**
 * 트랙 B 에디터의 BookData (web/types/book.ts) → typst-templates 호환 JSON.
 * 트랙 B는 chapter/interlude/matter 등 풍부한 블록을 갖지만, 1단계는 chapter만
 * 본문으로 옮긴다. matter(반제목·판권지·목차·저자소개)는 추후 Sprint에서.
 */
export function trackBToTypst(
  meta: { title: string; author?: string; options?: Record<string, unknown> },
  blocks: Array<
    | {
        type: "chapter";
        chapterNum?: string;
        title: string;
        subtitle?: string;
        body: string;
        showChapterNumber?: boolean;
      }
    | { type: string }
  >,
): TypstBookData {
  const out: Block[] = [];
  let autoNum = 1;

  for (const b of blocks) {
    if (b.type !== "chapter") continue;
    const ch = b as Extract<typeof b, { type: "chapter" }>;
    const parsedNum = ch.chapterNum ? Number(ch.chapterNum) : NaN;
    const number = Number.isFinite(parsedNum) ? parsedNum : autoNum;
    autoNum = number + 1;

    out.push({ type: "chapter", number, title: ch.title || "" });

    const paragraphs = (ch.body || "")
      .split(/\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    for (const text of paragraphs) {
      out.push({ type: "paragraph", text });
    }
  }

  return {
    schema: "sungjin-book/v1",
    meta: { title: meta.title, author: meta.author, options: meta.options },
    blocks: out,
  };
}

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
