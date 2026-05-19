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
  | { type: "quote"; text: string; by?: string }
  // Front/Back matter — 트랙 B에서 변환된 결과
  | { type: "half-title"; title: string; author?: string; publisher?: string }
  | { type: "copyright"; body: string }
  | { type: "toc"; entries: Array<{ chapterNum: string; title: string }> }
  | { type: "matter-page"; title: string; body: string };

/** chapterNum 문자열에서 첫 등장하는 숫자만 추출 ("제3장" → 3). */
function parseChapterNumber(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const m = raw.match(/\d+/);
  if (!m) return fallback;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * 트랙 B 에디터의 BookData (web/types/book.ts) → typst-templates 호환 JSON.
 * chapter는 본문으로, matter(half-title·copyright·toc·author-bio 등)는
 * 각각의 typst 페이지로 변환. interlude는 1단계에선 스킵.
 */
export function trackBToTypst(
  meta: {
    title: string;
    author?: string;
    subtitle?: string;
    publisher?: string;
    options?: Record<string, unknown>;
  },
  blocks: Array<{
    type: string;
    chapterNum?: string;
    title?: string;
    subtitle?: string;
    body?: string;
    showChapterNumber?: boolean;
    includeInToc?: boolean;
    tocTitle?: string;
  }>,
): TypstBookData {
  const out: Block[] = [];
  let autoNum = 1;

  // toc용 챕터 목록 사전 계산
  const tocEntries: Array<{ chapterNum: string; title: string }> = [];
  let tocAuto = 1;
  for (const b of blocks) {
    if (b.type !== "chapter") continue;
    if (b.includeInToc === false) continue;
    const n = parseChapterNumber(b.chapterNum, tocAuto);
    tocAuto = n + 1;
    const label = b.tocTitle?.trim() || b.title?.trim() || `제 ${n} 장`;
    tocEntries.push({ chapterNum: `제 ${n} 장`, title: label });
  }

  for (const b of blocks) {
    switch (b.type) {
      case "half-title":
        out.push({
          type: "half-title",
          title: meta.title,
          author: meta.author,
          publisher: meta.publisher,
        });
        break;
      case "copyright":
        out.push({
          type: "copyright",
          body:
            b.body?.trim() ||
            `Copyright © ${new Date().getFullYear()} ${meta.author ?? ""}`.trim(),
        });
        break;
      case "toc":
        out.push({ type: "toc", entries: tocEntries });
        break;
      case "preface":
      case "dedication":
      case "prologue":
      case "blurb":
      case "author-bio":
      case "epilogue":
      case "acknowledgments":
      case "bibliography":
        out.push({
          type: "matter-page",
          title: b.title?.trim() || sectionDefaultTitle(b.type),
          body: b.body?.trim() || "",
        });
        break;
      case "chapter": {
        const number = parseChapterNumber(b.chapterNum, autoNum);
        autoNum = number + 1;
        out.push({ type: "chapter", number, title: b.title || "" });
        const paragraphs = (b.body || "")
          .split(/\n+/)
          .map((p) => p.trim())
          .filter((p) => p.length > 0);
        for (const text of paragraphs) {
          out.push({ type: "paragraph", text });
        }
        break;
      }
      // interlude는 1단계에서 스킵
      default:
        break;
    }
  }

  return {
    schema: "sungjin-book/v1",
    meta: { title: meta.title, author: meta.author, options: meta.options },
    blocks: out,
  };
}

function sectionDefaultTitle(type: string): string {
  switch (type) {
    case "preface": return "서문";
    case "dedication": return "헌정";
    case "prologue": return "프롤로그";
    case "blurb": return "추천사";
    case "author-bio": return "저자 소개";
    case "epilogue": return "에필로그";
    case "acknowledgments": return "감사의 글";
    case "bibliography": return "참고문헌";
    default: return "";
  }
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
