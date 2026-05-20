export type TrimSize = "신국판" | "46배판" | "문고판";
export type BookType = "chapter" | "continuous";
export type BookTheme = "classic" | "modern" | "minimal";
export type PreviewDevice = "print" | "kindle" | "ipad" | "smartphone";

export const TRIM_SIZES: { name: TrimSize; size: string }[] = [
  { name: "신국판", size: "152 × 225mm" },
  { name: "46배판", size: "188 × 257mm" },
  { name: "문고판", size: "105 × 148mm" },
];

export interface BookOptions {
  theme: BookTheme;

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
  marginPreset: "narrow" | "normal" | "wide";

  // 레이어 3 — 켜기/끄기
  showPageNumber: boolean;
  pageNumberPosition: "bottom-outside" | "bottom-center" | "top-outside";
  /** 본문 쪽번호 형식. 아라비아 1·2·3 또는 로마자 i·ii (드물게 사용). */
  pageNumberFormat: "arabic" | "roman";
  /** 앞부분(속표지~서문 등 매터) 쪽번호. Vellum/Atticus 표준:
   *  - none: 표시 안 함 (한국 단행본 통례)
   *  - roman: 로마자 i·ii·iii (영문 단행본 통례)
   *  본문은 항상 1부터 새로 시작. */
  frontMatterNumbering: "none" | "roman";
  hideChapterStartPageNumber: boolean;
  paragraphIndent: boolean;

  // 챕터 스타일 (개인 취향 — 테마와 무관)
  dropCaps: boolean;
  sceneBreakStyle: "asterisk" | "line" | "none";
  // 러닝 헤더 — 짝수: 책 제목, 홀수: 챕터 제목 (Reedsy/Cambric 베이스라인)
  runningHeader: boolean;
  /** Vellum 스타일 여백 가이드 — 미리보기에 점선 박스로 본문 영역 표시 */
  showMarginGuide: boolean;
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

// ─── BlockType ────────────────────────────────────────────────────────────────
export type BlockType =
  // 본문
  | "chapter"
  | "interlude"
  // Front Matter (앞부분)
  | "half-title"    // 속표지
  | "copyright"     // 판권지
  | "toc"           // 목차
  | "preface"       // 서문/머리말
  | "dedication"    // 헌정사
  | "prologue"      // 프롤로그
  | "blurb"         // 추천사
  // Back Matter (뒷부분)
  | "author-bio"    // 저자 소개
  | "epilogue"      // 에필로그
  | "acknowledgments" // 감사의 글
  | "bibliography"; // 참고문헌

export interface ChapterBlock {
  id: string;
  type: "chapter";
  chapterNum: string;
  title: string;
  subtitle?: string;
  body: string;
  charCount: number;
  includeInToc: boolean;
  tocTitle?: string;
  showChapterNumber?: boolean;
  createdAt: number;
}

export interface InterludeBlock {
  id: string;
  type: "interlude";
  partTitle?: string;
  partSubtitle?: string;
}

/** Front/Back Matter 공통 블록 — 제목과 본문 텍스트를 가짐 */
export interface MatterBlock {
  id: string;
  type: Exclude<BlockType, "chapter" | "interlude">;
  title?: string;
  body?: string;
  isSystem?: boolean;
}

export type BookBlock = ChapterBlock | InterludeBlock | MatterBlock;

// ─── 블록 타입 메타데이터 ──────────────────────────────────────────────────────
export const BLOCK_META: Record<
  BlockType,
  { label: string; section: "front" | "body" | "back"; defaultTitle: string }
> = {
  "chapter":        { label: "챕터",     section: "body",  defaultTitle: "제1장" },
  "interlude":      { label: "간지",     section: "body",  defaultTitle: "간지" },
  "half-title":     { label: "속표지",   section: "front", defaultTitle: "속표지" },
  "copyright":      { label: "판권지",   section: "front", defaultTitle: "판권지" },
  "toc":            { label: "목차",     section: "front", defaultTitle: "목차" },
  "preface":        { label: "서문",     section: "front", defaultTitle: "서문" },
  "dedication":     { label: "헌정사",   section: "front", defaultTitle: "헌정사" },
  "prologue":       { label: "프롤로그", section: "front", defaultTitle: "프롤로그" },
  "blurb":          { label: "추천사",   section: "front", defaultTitle: "추천사" },
  "author-bio":     { label: "저자 소개", section: "back", defaultTitle: "저자 소개" },
  "epilogue":       { label: "에필로그", section: "back",  defaultTitle: "에필로그" },
  "acknowledgments":{ label: "감사의 글", section: "back", defaultTitle: "감사의 글" },
  "bibliography":   { label: "참고문헌", section: "back",  defaultTitle: "참고문헌" },
};

export interface BookData {
  meta: BookMeta;
  blocks: BookBlock[];
  createdAt: number;
  updatedAt: number;
}

// 테마 프리셋 — 테마 선택 시 적용되는 부분 옵션 묶음.
// (theme 자체는 별도로 set, 여기에 포함하지 않는다.)
export const THEME_PRESETS: Record<BookTheme, Partial<BookOptions>> = {
  classic: {
    bodyFont: "serif",
    bodyFontSize: "10pt",
    lineSpacing: "normal",
    showPageNumber: true,
    pageNumberPosition: "bottom-outside",
    showChapterNumber: true,
    paragraphIndent: true,
  },
  modern: {
    bodyFont: "sans",
    bodyFontSize: "10pt",
    lineSpacing: "wide",
    showPageNumber: true,
    pageNumberPosition: "bottom-center",
    showChapterNumber: true,
    paragraphIndent: false,
  },
  minimal: {
    bodyFont: "serif",
    bodyFontSize: "9pt",
    lineSpacing: "normal",
    showPageNumber: false,
    pageNumberPosition: "bottom-center",
    showChapterNumber: false,
    paragraphIndent: true,
  },
};

export const DEFAULT_OPTIONS: BookOptions = {
  theme: "classic",

  showChapterNumber: true,
  showPreviewPanel: false,
  showSeriesName: false,
  showEnglishTitle: false,
  includeISBN: false,
  interludeStyle: "1p",

  bodyFont: "serif",
  bodyFontSize: "10pt",
  lineSpacing: "normal",
  marginPreset: "normal",

  showPageNumber: true,
  pageNumberPosition: "bottom-outside",
  pageNumberFormat: "arabic",
  frontMatterNumbering: "none",
  hideChapterStartPageNumber: false,
  paragraphIndent: true,

  dropCaps: false,
  sceneBreakStyle: "asterisk",
  runningHeader: false,
  showMarginGuide: false,
};

export function createEmptyBook(
  meta: Omit<BookMeta, "options"> & { options?: Partial<BookOptions> },
  initialBlocks?: BookBlock[]
): BookData {
  const now = Date.now();
  return {
    meta: {
      ...meta,
      options: { ...DEFAULT_OPTIONS, ...(meta.options ?? {}) },
    },
    blocks: initialBlocks ?? [],
    createdAt: now,
    updatedAt: now,
  };
}
