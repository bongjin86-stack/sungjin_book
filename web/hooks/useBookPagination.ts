"use client";

import { useMemo } from "react";
import {
  BLOCK_META,
  type BookBlock,
  type BookData,
  type ChapterBlock,
  type MatterBlock,
} from "@/types/book";
import { paginateParagraphs, type PageParagraph } from "./usePagination";

export interface BookPreviewPage {
  id: string;
  blockId: string;
  blockType: BookBlock["type"];
  title: string;
  subtitle?: string;
  chapterNum?: string;
  showChapterNumber: boolean;
  isFirstPageOfBlock: boolean;
  pageIndexInBlock: number;
  paragraphs: PageParagraph[];
}

export type ChapterPageMap = Record<string, number>;

interface Input {
  bookData: BookData;
  linesPerPage: number;
  charsPerLine: number;
  /** 옵션 기본값 — 챕터 블록에 showChapterNumber 없을 때 사용 */
  defaultShowChapterNumber: boolean;
}

interface BlockExtract {
  title: string;
  subtitle?: string;
  chapterNum?: string;
  showChapterNumber: boolean;
  headerLines: number;
  paragraphs: string[];
}

function splitBody(body: string | undefined): string[] {
  if (!body) return [];
  return body.split(/\n+/).filter((p) => p.trim().length > 0);
}

function defaultCopyrightLines(bookData: BookData): string[] {
  const { meta } = bookData;
  const lines: string[] = [meta.title];
  if (meta.subtitle) lines.push(meta.subtitle);
  lines.push(`저자  ${meta.author}`);
  if (meta.publisher) lines.push(`발행처  ${meta.publisher}`);
  lines.push(`판형  ${meta.trim}`);
  return lines;
}

function formatTocLine(chapterNum: string, title: string, pageNumber?: number): string {
  const left = `${chapterNum}  ${title}`;
  if (!pageNumber) return left;
  return `${left} ........ ${pageNumber}`;
}

function extractBlock(
  block: BookBlock,
  bookData: BookData,
  defaultShowChapterNumber: boolean,
  chapterPageMap?: ChapterPageMap,
): BlockExtract | null {
  if (block.type === "chapter") {
    const c = block as ChapterBlock;
    const showCN = c.showChapterNumber ?? defaultShowChapterNumber;
    return {
      title: c.title || "(제목 없음)",
      subtitle: c.subtitle,
      chapterNum: c.chapterNum,
      showChapterNumber: showCN,
      headerLines: showCN ? 4 : 3,
      paragraphs: splitBody(c.body),
    };
  }

  if (block.type === "interlude") {
    return null;
  }

  const matter = block as MatterBlock;

  if (block.type === "half-title") {
    const { meta } = bookData;
    return {
      title: meta.title || "(제목 없음)",
      subtitle: meta.subtitle || meta.author,
      showChapterNumber: false,
      headerLines: 4,
      paragraphs: meta.publisher ? [meta.publisher] : [],
    };
  }

  if (block.type === "copyright") {
    const body = (matter.body ?? "").trim();
    const paragraphs = body ? splitBody(body) : defaultCopyrightLines(bookData);
    return {
      title: matter.title || "판권지",
      showChapterNumber: false,
      headerLines: 2,
      paragraphs,
    };
  }

  if (block.type === "toc") {
    const chapters = bookData.blocks.filter(
      (b): b is ChapterBlock => b.type === "chapter" && b.includeInToc,
    );
    const paragraphs =
      chapters.length === 0
        ? ["챕터를 추가하면 자동으로 표시됩니다."]
        : chapters.map((c) => {
            const label = c.tocTitle?.trim() || c.title.trim() || "(제목 없음)";
            const pageNumber = chapterPageMap?.[c.id];
            return formatTocLine(c.chapterNum, label, pageNumber);
          });
    return {
      title: matter.title || "목차",
      showChapterNumber: false,
      headerLines: 2,
      paragraphs,
    };
  }

  return {
    title: matter.title || BLOCK_META[block.type].defaultTitle,
    showChapterNumber: false,
    headerLines: 2,
    paragraphs: splitBody(matter.body),
  };
}

function buildPages(
  bookData: BookData,
  linesPerPage: number,
  charsPerLine: number,
  defaultShowChapterNumber: boolean,
  tocChapterPageMap?: ChapterPageMap,
): { pages: BookPreviewPage[]; chapterPageMap: ChapterPageMap } {
  const pages: BookPreviewPage[] = [];
  const chapterPageMap: ChapterPageMap = {};

  for (const block of bookData.blocks) {
    const extract = extractBlock(
      block,
      bookData,
      defaultShowChapterNumber,
      tocChapterPageMap,
    );
    if (!extract) continue;

    const paragraphs = extract.paragraphs.length > 0 ? extract.paragraphs : [""];
    const blockPages = paginateParagraphs(
      paragraphs,
      linesPerPage,
      charsPerLine,
      extract.headerLines,
    );

    blockPages.forEach((para, idx) => {
      const visiblePageNumber = pages.length + 1;

      if (block.type === "chapter" && idx === 0) {
        chapterPageMap[block.id] = visiblePageNumber;
      }

      pages.push({
        id: `${block.id}-${idx}`,
        blockId: block.id,
        blockType: block.type,
        title: extract.title,
        subtitle: extract.subtitle,
        chapterNum: extract.chapterNum,
        showChapterNumber: extract.showChapterNumber,
        isFirstPageOfBlock: idx === 0,
        pageIndexInBlock: idx,
        paragraphs: para,
      });
    });
  }

  return { pages, chapterPageMap };
}

export function useBookPagination(input: Input): {
  pages: BookPreviewPage[];
  chapterPageMap: ChapterPageMap;
} {
  const { bookData, linesPerPage, charsPerLine, defaultShowChapterNumber } = input;

  return useMemo(() => {
    const first = buildPages(
      bookData,
      linesPerPage,
      charsPerLine,
      defaultShowChapterNumber,
    );

    const second = buildPages(
      bookData,
      linesPerPage,
      charsPerLine,
      defaultShowChapterNumber,
      first.chapterPageMap,
    );

    return second;
  }, [bookData, linesPerPage, charsPerLine, defaultShowChapterNumber]);
}
