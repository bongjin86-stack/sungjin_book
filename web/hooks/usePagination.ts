"use client";

import { useMemo } from "react";

/**
 * usePagination — 단락 단위로 페이지 분할 (결정론적).
 *
 * 1단계 정책:
 *   - 단락이 한 페이지보다 길어도 쪼개지 않음. 다음 페이지로 넘김.
 *   - 챕터 시작 페이지(첫 페이지)는 헤더(번호+제목)가 차지하는 줄 수만큼 본문 예산을 차감.
 *   - 한 줄 글자수는 한글 정사각 가정 (charsPerLine 입력으로 외부에서 계산해 전달).
 *
 * 정확한 줄바꿈 측정은 2단계 canvas.measureText로 교체 예정.
 */

interface PaginationInput {
  paragraphs: string[];
  linesPerPage: number;
  charsPerLine: number;
  chapterHeaderLines: number; // 첫 페이지에서만 차감되는 줄 수
}

export interface PaginationResult {
  pages: number[][]; // 각 페이지가 담는 paragraph 인덱스 배열
  totalPages: number;
}

export function usePagination(input: PaginationInput): PaginationResult {
  const { paragraphs, linesPerPage, charsPerLine, chapterHeaderLines } = input;

  return useMemo(() => {
    // 가드: 입력이 비정상이면 단일 빈 페이지
    if (
      !paragraphs ||
      paragraphs.length === 0 ||
      !Number.isFinite(linesPerPage) ||
      linesPerPage < 1 ||
      !Number.isFinite(charsPerLine) ||
      charsPerLine < 1
    ) {
      return { pages: [[]], totalPages: 1 };
    }

    const linesOf = (p: string) => {
      const len = p.length || 1;
      return Math.max(1, Math.ceil(len / charsPerLine));
    };

    const pages: number[][] = [[]];
    let cur = 0;
    let used = 0;

    const headerBudget = Math.max(1, linesPerPage - chapterHeaderLines);

    for (let i = 0; i < paragraphs.length; i++) {
      const lines = linesOf(paragraphs[i]);
      const budget = cur === 0 ? headerBudget : linesPerPage;

      if (used + lines > budget && pages[cur].length > 0) {
        pages.push([]);
        cur += 1;
        used = 0;
      }
      pages[cur].push(i);
      used += lines;
    }

    return { pages, totalPages: pages.length };
  }, [paragraphs, linesPerPage, charsPerLine, chapterHeaderLines]);
}
