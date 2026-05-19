"use client";

import { useMemo } from "react";

/**
 * usePagination — 줄 단위 페이지 분할 (결정론적).
 *
 * 1단계 정책:
 *   - 단락을 화면용 줄 배열로 먼저 쪼갠 뒤, 페이지 남은 줄 수만큼 배치한다.
 *   - 긴 단락은 페이지 아래에서 잘리지 않고 다음 페이지로 이어진다.
 *   - 한 줄 폭은 한글 1칸 기준의 가중치 계산을 쓴다.
 *
 * 정확한 줄바꿈 측정은 다음 단계에서 canvas.measureText로 교체 가능.
 */

interface PaginationInput {
  paragraphs: string[];
  linesPerPage: number;
  charsPerLine: number;
  chapterHeaderLines: number; // 첫 페이지에서만 차감되는 줄 수
}

export interface PageParagraph {
  paragraphIndex: number;
  lines: string[];
  startsParagraph: boolean;
}

export interface PaginationResult {
  pages: PageParagraph[][];
  totalPages: number;
}

function charUnits(char: string): number {
  if (/\s/.test(char)) return 0.35;
  if (/[\uAC00-\uD7A3\u3131-\u318E\u1100-\u11FF]/.test(char)) return 1;
  if (/[\u4E00-\u9FFF]/.test(char)) return 1;
  if (/[A-Za-z0-9]/.test(char)) return 0.55;
  return 0.5;
}

function textUnits(text: string): number {
  return Array.from(text).reduce((sum, char) => sum + charUnits(char), 0);
}

function pushLine(lines: string[], line: string) {
  const clean = line.trimEnd();
  if (clean) lines.push(clean);
}

function appendLongToken(
  lines: string[],
  current: string,
  currentUnits: number,
  token: string,
  maxUnits: number,
) {
  let line = current;
  let units = currentUnits;

  for (const char of Array.from(token)) {
    const nextUnits = charUnits(char);
    if (units + nextUnits > maxUnits && line.trim()) {
      pushLine(lines, line);
      line = char.trimStart();
      units = textUnits(line);
    } else {
      line += char;
      units += nextUnits;
    }
  }

  return { line, units };
}

function wrapParagraph(paragraph: string, charsPerLine: number): string[] {
  const maxUnits = Math.max(4, charsPerLine);
  const normalized = paragraph.trim().replace(/[ \t]+/g, " ");
  if (!normalized) return [""];

  const tokens = normalized.match(/\S+\s*/g) ?? [normalized];
  const lines: string[] = [];
  let line = "";
  let units = 0;

  for (const token of tokens) {
    const tokenUnits = textUnits(token);

    if (tokenUnits > maxUnits) {
      const result = appendLongToken(lines, line, units, token, maxUnits);
      line = result.line;
      units = result.units;
      continue;
    }

    if (units + tokenUnits <= maxUnits) {
      line += token;
      units += tokenUnits;
      continue;
    }

    pushLine(lines, line);
    line = token.trimStart();
    units = textUnits(line);
  }

  pushLine(lines, line);
  return lines.length > 0 ? lines : [normalized];
}

export function paginateParagraphs(
  paragraphs: string[],
  linesPerPage: number,
  charsPerLine: number,
  firstPageHeaderLines: number,
): PageParagraph[][] {
  if (
    !paragraphs ||
    paragraphs.length === 0 ||
    !Number.isFinite(linesPerPage) ||
    linesPerPage < 1 ||
    !Number.isFinite(charsPerLine) ||
    charsPerLine < 1
  ) {
    return [[]];
  }

  const pages: PageParagraph[][] = [[]];
  let currentPage = 0;
  let usedLines = 0;

  const firstPageBudget = Math.max(1, linesPerPage - firstPageHeaderLines);
  const pageBudget = () => (currentPage === 0 ? firstPageBudget : linesPerPage);
  const nextPage = () => {
    pages.push([]);
    currentPage += 1;
    usedLines = 0;
  };

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const lines = wrapParagraph(paragraph, charsPerLine);
    let lineIndex = 0;

    while (lineIndex < lines.length) {
      const remaining = pageBudget() - usedLines;
      if (remaining <= 0) {
        nextPage();
        continue;
      }

      const take = Math.min(remaining, lines.length - lineIndex);
      pages[currentPage].push({
        paragraphIndex,
        lines: lines.slice(lineIndex, lineIndex + take),
        startsParagraph: lineIndex === 0,
      });

      usedLines += take;
      lineIndex += take;

      if (lineIndex < lines.length) nextPage();
    }
  });

  return pages;
}

export function usePagination(input: PaginationInput): PaginationResult {
  const { paragraphs, linesPerPage, charsPerLine, chapterHeaderLines } = input;

  return useMemo(() => {
    const pages = paginateParagraphs(paragraphs, linesPerPage, charsPerLine, chapterHeaderLines);
    return { pages, totalPages: pages.length };
  }, [paragraphs, linesPerPage, charsPerLine, chapterHeaderLines]);
}
