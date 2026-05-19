"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChapterForm, type ChapterFormMode } from "@/components/editor/ChapterForm";
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
    updateChapter,
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

  // activeBlockId가 가리키는 블록이 삭제됐다면 null로
  useEffect(() => {
    if (!bookData || !activeBlockId) return;
    const exists = bookData.blocks.some((b) => b.id === activeBlockId);
    if (!exists) setActiveBlockId(null);
  }, [bookData, activeBlockId]);

  if (!hydrated || !bookData) {
    return (
      <div className="h-screen flex items-center justify-center text-text-muted">
        불러오는 중...
      </div>
    );
  }

  const { meta, blocks } = bookData;
  const activeBlock = activeBlockId ? blocks.find((b) => b.id === activeBlockId) : null;
  const activeIsChapter = activeBlock?.type === "chapter";

  // 사이드바에서 블록 클릭 시 — 챕터면 편집 모드 진입, 미리보기에 내용 반영
  function handleSelectBlock(id: string) {
    setActiveBlockId(id);
    const block = blocks.find((b) => b.id === id);
    if (!block) return;
    const chapterNum = block.type === "chapter" ? (block.chapterNum ?? "") : "";
    const title = (block as { title?: string }).title ?? "";
    const body = (block as { body?: string }).body ?? "";
    setPreviewContent({ chapterNum, title, body });
  }

  // ChapterForm mode 결정 — 챕터 블록이 활성화돼 있으면 edit, 아니면 new
  const formMode: ChapterFormMode = activeIsChapter
    ? {
        kind: "edit",
        blockId: activeBlock!.id,
        initial: {
          chapterNum: activeBlock!.type === "chapter" ? activeBlock!.chapterNum : "",
          title: activeBlock!.type === "chapter" ? activeBlock!.title : "",
          body: activeBlock!.type === "chapter" ? activeBlock!.body : "",
        },
      }
    : { kind: "new", nextChapterNum };

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
          <div className="flex-1 min-w-0 overflow-y-auto flex flex-col items-center px-8 pt-8 pb-24 border-r border-border">
            {/* 활성 챕터가 있으면 "새 챕터로 돌아가기" 버튼 노출 */}
            {activeIsChapter && (
              <div className="w-full max-w-[680px] mb-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setActiveBlockId(null);
                    setPreviewContent({ chapterNum: nextChapterNum, title: "", body: "" });
                  }}
                  className="text-[12px] text-text-muted hover:text-accent transition-colors"
                >
                  + 새 챕터 쓰기
                </button>
              </div>
            )}

            <ChapterForm
              key={activeBlockId ?? `new-${chapterCount}`}
              mode={formMode}
              onSaveNew={(data) => {
                addChapter(data);
                setActiveBlockId(null);
                setPreviewContent({ chapterNum: nextChapterNum, title: "", body: "" });
              }}
              onSaveEdit={(blockId, patch) => {
                updateChapter(blockId, patch);
                setPreviewContent({
                  chapterNum: patch.chapterNum,
                  title: patch.title,
                  body: patch.body,
                });
              }}
              onChange={setPreviewContent}
            />
          </div>

          {/* 미리보기 영역 (50%) */}
          <div className="flex-1 min-w-0 overflow-hidden flex">
            <BookPreviewPanel
              options={meta.options}
              trim={meta.trim}
              previewContent={previewContent}
              resetPageKey={activeBlockId ?? "new"}
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
