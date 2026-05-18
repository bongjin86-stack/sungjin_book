"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  BookBlock,
  BookData,
  BookMeta,
  ChapterBlock,
  InterludeBlock,
} from "@/types/book";
import { DEFAULT_OPTIONS } from "@/types/book";

const STORAGE_KEY = "sungjin-book/v1";
const SAVE_DEBOUNCE_MS = 1000;

function newId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function readStorage(): BookData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BookData;
    if (!parsed.meta) return null;
    parsed.meta.options = { ...DEFAULT_OPTIONS, ...(parsed.meta.options ?? {}) };
    return parsed;
  } catch {
    return null;
  }
}

export function useBookStore() {
  const [bookData, setBookData] = useState<BookData | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setBookData(readStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !bookData) return;
    setIsSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookData));
        setIsSaved(true);
      } catch {
        setIsSaved(false);
      }
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [bookData, hydrated]);

  const initBook = useCallback((next: BookData) => {
    setBookData(next);
  }, []);

  const updateMeta = useCallback((meta: Partial<BookMeta>) => {
    setBookData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        meta: {
          ...prev.meta,
          ...meta,
          options: { ...prev.meta.options, ...(meta.options ?? {}) },
        },
        updatedAt: Date.now(),
      };
    });
  }, []);

  const updateOptions = useCallback(
    (options: Partial<BookMeta["options"]>) => {
      updateMeta({ options: { ...DEFAULT_OPTIONS, ...options } as BookMeta["options"] });
    },
    [updateMeta]
  );

  const addChapter = useCallback(
    (input: Omit<ChapterBlock, "id" | "createdAt" | "type">) => {
      setBookData((prev) => {
        if (!prev) return prev;
        const block: ChapterBlock = {
          id: newId(),
          type: "chapter",
          createdAt: Date.now(),
          ...input,
        };
        return {
          ...prev,
          blocks: [...prev.blocks, block],
          updatedAt: Date.now(),
        };
      });
    },
    []
  );

  const addInterlude = useCallback(() => {
    setBookData((prev) => {
      if (!prev) return prev;
      const block: InterludeBlock = { id: newId(), type: "interlude" };
      return {
        ...prev,
        blocks: [...prev.blocks, block],
        updatedAt: Date.now(),
      };
    });
  }, []);

  const updateBlock = useCallback(
    (id: string, updates: Partial<BookBlock>) => {
      setBookData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          blocks: prev.blocks.map((b) =>
            b.id === id ? ({ ...b, ...updates } as BookBlock) : b
          ),
          updatedAt: Date.now(),
        };
      });
    },
    []
  );

  const deleteBlock = useCallback((id: string) => {
    setBookData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        blocks: prev.blocks.filter((b) => b.id !== id),
        updatedAt: Date.now(),
      };
    });
  }, []);

  const reorderBlocks = useCallback((newOrder: BookBlock[]) => {
    setBookData((prev) => {
      if (!prev) return prev;
      return { ...prev, blocks: newOrder, updatedAt: Date.now() };
    });
  }, []);

  const totalChars = useMemo(() => {
    if (!bookData) return 0;
    return bookData.blocks.reduce(
      (sum, b) => (b.type === "chapter" ? sum + b.charCount : sum),
      0
    );
  }, [bookData]);

  const chapterCount = useMemo(() => {
    if (!bookData) return 0;
    return bookData.blocks.filter((b) => b.type === "chapter").length;
  }, [bookData]);

  return {
    bookData,
    hydrated,
    isSaved,
    initBook,
    updateMeta,
    updateOptions,
    addChapter,
    addInterlude,
    updateBlock,
    deleteBlock,
    reorderBlocks,
    totalChars,
    chapterCount,
  };
}

export const BOOK_STORAGE_KEY = STORAGE_KEY;
