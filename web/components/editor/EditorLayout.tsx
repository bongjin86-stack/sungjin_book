"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChapterForm } from "@/components/editor/ChapterForm";
import { Header } from "@/components/editor/Header";
import { BookPreviewPanel } from "@/components/editor/PreviewPanel";
import { Sidebar } from "@/components/editor/Sidebar";
import { StatusBar } from "@/components/editor/StatusBar";
import { useBookStore } from "@/hooks/useBookStore";

export function EditorLayout() {
  const router = useRouter();
  const {
    bookData,
    hydrated,
    isSaved,
    updateOptions,
    addChapter,
    addInterlude,
    reorderBlocks,
    totalChars,
    chapterCount,
  } = useBookStore();

  const [previewContent, setPreviewContent] = useState({
    chapterNum: "1장",
    title: "",
    body: "",
  });
  // 책 데이터 없으면 온보딩으로
  useEffect(() => {
    if (hydrated && !bookData) router.replace("/");
  }, [hydrated, bookData, router]);

  const nextChapterNum = useMemo(() => {
    if (!bookData) return "1장";
    const n = bookData.blocks.filter((b) => b.type === "chapter").length + 1;
    return `${n}장`;
  }, [bookData]);

  if (!hydrated || !bookData) {
    return <div className="h-screen flex items-center justify-center text-text-muted">불러오는 중...</div>;
  }

  const { meta, blocks } = bookData;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header
        title={meta.title}
        author={meta.author}
        trim={meta.trim}
        isSaved={isSaved}
        hasChapters={chapterCount > 0}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          options={meta.options}
          onChangeOptions={updateOptions}
          blocks={blocks}
          onReorder={reorderBlocks}
          onAddInterlude={addInterlude}
        />

        {/* 에디터 영역 — 좌측: ChapterForm (무한 스크롤) / 우측: 책 미리보기 패널 (고정) */}
        <div className="flex-1 overflow-y-auto flex flex-col items-center px-6 pt-6 pb-24 bg-bg">
          <ChapterForm
            key={chapterCount}
            initialChapterNum={nextChapterNum}
            onSave={(data) => {
              addChapter(data);
              setPreviewContent({ chapterNum: nextChapterNum, title: "", body: "" });
            }}
            onChange={setPreviewContent}
          />
        </div>

        <BookPreviewPanel
          options={meta.options}
          trim={meta.trim}
          previewContent={previewContent}
        />
      </div>

      <StatusBar
        isSaved={isSaved}
        chapterCount={chapterCount}
        totalChars={totalChars}
        trim={meta.trim}
      />

    </div>
  );
}
