export type TrimSize = "신국판" | "46배판" | "문고판";
export type BookType = "chapter" | "continuous";

export const TRIM_SIZES: { name: TrimSize; size: string }[] = [
  { name: "신국판", size: "152 × 225mm" },
  { name: "46배판", size: "188 × 257mm" },
  { name: "문고판", size: "105 × 148mm" },
];

export interface BookOptions {
  showChapterNumber: boolean;
  showPreviewPanel: boolean;
  showSeriesName: boolean;
  showEnglishTitle: boolean;
  includeISBN: boolean;
  interludeStyle: "1p" | "2p";

  // 레이어 2 — 프리셋
  bodyFont: "serif" | "sans";
  bodyFontSize: "9pt" | "10pt" | "11pt";
  lineSpacing: "narrow" | "normal" | "wide";

  // 레이어 3 — 켜기/끄기
  showPageNumber: boolean;
  pageNumberPosition: "bottom-outside" | "bottom-center" | "top-outside";
  hideChapterStartPageNumber: boolean;
  paragraphIndent: boolean;
}

export interface BookMeta {
  title: string;
  subtitle?: string;
  author: string;
  publisher?: string;
  trim: TrimSize;
  bookType: BookType;
  options: BookOptions;
}

export type BlockType = "chapter" | "interlude";

export interface ChapterBlock {
  id: string;
  type: "chapter";
  chapterNum: string;
  title: string;
  body: string;
  charCount: number;
  createdAt: number;
}

export interface InterludeBlock {
  id: string;
  type: "interlude";
  partTitle?: string;
  partSubtitle?: string;
}

export type BookBlock = ChapterBlock | InterludeBlock;

export interface BookData {
  meta: BookMeta;
  blocks: BookBlock[];
  createdAt: number;
  updatedAt: number;
}

export const DEFAULT_OPTIONS: BookOptions = {
  showChapterNumber: true,
  showPreviewPanel: false,
  showSeriesName: false,
  showEnglishTitle: false,
  includeISBN: false,
  interludeStyle: "1p",

  bodyFont: "serif",
  bodyFontSize: "10pt",
  lineSpacing: "normal",

  showPageNumber: true,
  pageNumberPosition: "bottom-outside",
  hideChapterStartPageNumber: true,
  paragraphIndent: true,
};

export function createEmptyBook(meta: Omit<BookMeta, "options"> & { options?: Partial<BookOptions> }): BookData {
  const now = Date.now();
  return {
    meta: {
      ...meta,
      options: { ...DEFAULT_OPTIONS, ...(meta.options ?? {}) },
    },
    blocks: [],
    createdAt: now,
    updatedAt: now,
  };
}
