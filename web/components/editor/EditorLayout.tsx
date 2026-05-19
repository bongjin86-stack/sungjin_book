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

  // 현재 편집 중인 블록 ID (null = 새 챕터 작성 모드)
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

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
    return (
      <div className="h-screen flex items-center justify-center text-text-muted">
        불러오는 중...
      </div>
    );
  }

  const { meta, blocks } = bookData;

  // 사이드바에서 블록 클릭 시 해당 블록 활성화
  function handleSelectBlock(id: string) {
    setActiveBlockId(id);
    // 해당 블록의 현재 내용을 미리보기에 반영
    const block = blocks.find((b) => b.id === id);
    if (block) {
      const chapterNum = block.type === "chapter" ? (block.chapterNum ?? "") : "";
      const title = (block as { title?: string }).title ?? "";
      const body = (block as { body?: string }).body ?? "";
      setPreviewContent({ chapterNum, title, body });
    }
  }

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
          activeBlockId={activeBlockId}
          onSelectBlock={handleSelectBlock}
        />

        {/* 가운데 영역 — 에디터(flex-1) + 미리보기(flex-1) 5:5 분할 */}
        <div className="flex-1 flex overflow-hidden bg-bg">
          {/* 에디터 영역 (50%) */}
          <div className="flex-1 overflow-y-auto flex flex-col items-center px-6 pt-6 pb-24 border-r border-border">
            <ChapterForm
              key={activeBlockId ?? `new-${chapterCount}`}
              initialChapterNum={nextChapterNum}
              onSave={(data) => {
                addChapter(data);
                setActiveBlockId(null);
                setPreviewContent({ chapterNum: nextChapterNum, title: "", body: "" });
              }}
              onChange={setPreviewContent}
            />
          </div>

          {/* 미리보기 영역 (50%) — BookPreviewPanel이 내부에서 aside w-[220px] 를 갖고 있으므로
              여기서는 flex-1 wrapper 로 감싸 5:5 비율을 강제한다 */}
          <div className="flex-1 overflow-hidden flex">
            <BookPreviewPanel
              options={meta.options}
              trim={meta.trim}
              previewContent={previewContent}
            />
          </div>
        </div>
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
