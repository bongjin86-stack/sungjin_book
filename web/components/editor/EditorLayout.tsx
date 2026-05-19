"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BlockEditor } from "@/components/editor/BlockEditor";
import { ChapterForm, type ChapterFormMode } from "@/components/editor/ChapterForm";
import { Header } from "@/components/editor/Header";
import { BookPreviewPanel } from "@/components/editor/PreviewPanel";
import { TypstPreviewPanel } from "@/components/editor/TypstPreviewPanel";
import { Sidebar } from "@/components/editor/Sidebar";
import { StatusBar } from "@/components/editor/StatusBar";
import { useBookStore } from "@/hooks/useBookStore";
import type { BookBlock, BookData, ChapterBlock } from "@/types/book";

export function EditorLayout() {
  const router = useRouter();
  const {
    bookData,
    hydrated,
    isSaved,
    updateMeta,
    updateOptions,
    addChapter,
    updateBlock,
    updateChapter,
    reorderBlocks,
    totalChars,
    chapterCount,
  } = useBookStore();

  // 현재 편집 중인 블록 ID (null = 새 챕터 작성 모드)
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const didSelectInitialBlock = useRef(false);

  const [previewContent, setPreviewContent] = useState({
    chapterNum: "제1장",
    title: "",
    subtitle: "",
    body: "",
    showChapterNumber: true,
  });

  // 책 데이터 없으면 온보딩으로
  useEffect(() => {
    if (hydrated && !bookData) router.replace("/");
  }, [hydrated, bookData, router]);

  const nextChapterNum = useMemo(() => {
    if (!bookData) return "제1장";
    const n = bookData.blocks.filter((b) => b.type === "chapter").length + 1;
    return formatChapterNum(n);
  }, [bookData]);

  // activeBlockId가 가리키는 블록이 삭제됐다면 null로
  useEffect(() => {
    if (!bookData || !activeBlockId) return;
    const exists = bookData.blocks.some((b) => b.id === activeBlockId);
    if (!exists) setActiveBlockId(null);
  }, [bookData, activeBlockId]);

  useEffect(() => {
    if (!bookData || didSelectInitialBlock.current || bookData.blocks.length === 0) return;
    didSelectInitialBlock.current = true;
    setActiveBlockId(bookData.blocks[0].id);
    setPreviewContent(getPreviewContent(bookData.blocks[0], bookData));
  }, [bookData]);

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
    if (!bookData) return;
    setActiveBlockId(id);
    const block = blocks.find((b) => b.id === id);
    if (!block) return;
    setPreviewContent(getPreviewContent(block, bookData));
  }

  function handlePreviewChange(data: {
    chapterNum: string;
    title: string;
    subtitle?: string;
    body: string;
    showChapterNumber?: boolean;
  }) {
    setPreviewContent({
      chapterNum: data.chapterNum,
      title: data.title,
      subtitle: data.subtitle ?? "",
      body: data.body,
      showChapterNumber: data.showChapterNumber ?? true,
    });
    // 활성 챕터가 있으면 bookData도 즉시 갱신 — typst 미리보기가 본문 변경을
    // 실시간으로 받아 보기 위해. localStorage 저장은 useBookStore가 1초 디바운스.
    if (activeBlockId && activeIsChapter) {
      updateChapter(activeBlockId, {
        chapterNum: data.chapterNum,
        title: data.title,
        subtitle: data.subtitle,
        body: data.body,
        showChapterNumber: data.showChapterNumber,
      });
    }
  }

  // ChapterForm mode 결정 — 챕터 블록이 활성화돼 있으면 edit, 아니면 new
  const formMode: ChapterFormMode = activeIsChapter
    ? {
        kind: "edit",
        blockId: activeBlock!.id,
        initial: {
          chapterNum: activeBlock!.type === "chapter" ? activeBlock!.chapterNum : "",
          title: activeBlock!.type === "chapter" ? activeBlock!.title : "",
          subtitle: activeBlock!.type === "chapter" ? activeBlock!.subtitle : "",
          body: activeBlock!.type === "chapter" ? activeBlock!.body : "",
          includeInToc: activeBlock!.type === "chapter" ? activeBlock!.includeInToc : true,
          tocTitle: activeBlock!.type === "chapter" ? activeBlock!.tocTitle : "",
          showChapterNumber:
            activeBlock!.type === "chapter" ? activeBlock!.showChapterNumber : true,
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
        bookData={bookData}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          options={meta.options}
          onChangeOptions={updateOptions}
          blocks={blocks}
          onReorder={reorderBlocks}
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
                    setPreviewContent({
                      chapterNum: nextChapterNum,
                      title: "",
                      subtitle: "",
                      body: "",
                      showChapterNumber: true,
                    });
                  }}
                  className="text-[12px] text-text-muted hover:text-accent transition-colors"
                >
                  + 다음 챕터 쓰기
                </button>
              </div>
            )}

            {activeIsChapter || !activeBlock ? (
              <ChapterForm
                key={activeBlockId ?? `new-${chapterCount}`}
                mode={formMode}
                onSaveNew={(data) => {
                  addChapter(data);
                  setActiveBlockId(null);
                  setPreviewContent({
                    chapterNum: formatChapterNum(chapterCount + 2),
                    title: "",
                    subtitle: "",
                    body: "",
                    showChapterNumber: true,
                  });
                }}
                onSaveEdit={(blockId, patch) => {
                  updateChapter(blockId, patch);
                  setPreviewContent({
                    chapterNum: patch.chapterNum,
                    title: patch.title,
                    subtitle: patch.subtitle,
                    body: patch.body,
                    showChapterNumber: patch.showChapterNumber,
                  });
                }}
                onChange={handlePreviewChange}
              />
            ) : (
              <BlockEditor
                block={activeBlock}
                bookData={bookData}
                onUpdateMeta={updateMeta}
                onUpdateBlock={updateBlock}
                onUpdateChapter={updateChapter}
                onPreviewChange={handlePreviewChange}
              />
            )}
          </div>

          {/* 미리보기 영역 (50%) — typst 엔진 실패 시 자동 폴백 */}
          <div className="flex-1 min-w-0 overflow-hidden flex">
            <PreviewSwitcher
              bookData={bookData}
              options={meta.options}
              trim={meta.trim}
              previewContent={previewContent}
              activeBlockId={activeBlockId}
              onTypstFallback={() => undefined}
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

function getPreviewContent(block: BookBlock, bookData: BookData) {
  if (block.type === "chapter") {
    return {
      chapterNum: block.chapterNum,
      title: block.title,
      subtitle: block.subtitle ?? "",
      body: block.body,
      showChapterNumber: block.showChapterNumber ?? true,
    };
  }

  if (block.type === "half-title") {
    return {
      chapterNum: "",
      title: bookData.meta.title,
      subtitle: bookData.meta.subtitle ?? bookData.meta.author,
      body: bookData.meta.publisher ?? "",
      showChapterNumber: false,
    };
  }

  if (block.type === "toc") {
    const body = bookData.blocks
      .filter((b): b is ChapterBlock => b.type === "chapter")
      .filter((chapter) => chapter.includeInToc)
      .map((chapter) => {
        const label = chapter.tocTitle?.trim() || chapter.title.trim() || "(제목 없음)";
        return `${chapter.chapterNum}  ${label}`;
      })
      .join("\n\n");
    return { chapterNum: "", title: "목차", subtitle: "", body, showChapterNumber: false };
  }

  return {
    chapterNum: "",
    title: (block as { title?: string }).title ?? "책 구성",
    subtitle: "",
    body: (block as { body?: string }).body ?? "",
    showChapterNumber: false,
  };
}

function formatChapterNum(n: number) {
  return `제${n}장`;
}

/**
 * S3-6: 미리보기 엔진 스위처.
 * NEXT_PUBLIC_PREVIEW_ENGINE=typst 이면 Typst 엔진 시도, 실패 시 react 폴백.
 * 기본값은 react (안전한 옛 미리보기).
 */
function PreviewSwitcher({
  bookData,
  options,
  trim,
  previewContent,
  activeBlockId,
  onTypstFallback,
}: {
  bookData: BookData;
  options: BookData["meta"]["options"];
  trim: BookData["meta"]["trim"];
  previewContent: {
    chapterNum: string;
    title: string;
    subtitle?: string;
    body: string;
    showChapterNumber?: boolean;
  };
  activeBlockId: string | null;
  onTypstFallback: () => void;
}) {
  const engine = process.env.NEXT_PUBLIC_PREVIEW_ENGINE === "typst" ? "typst" : "react";
  const [fellBack, setFellBack] = useState(false);

  const useTypst = engine === "typst" && !fellBack;

  if (useTypst) {
    return (
      <TypstPreviewPanel
        bookData={bookData}
        activeBlockId={activeBlockId}
        onFallback={(err) => {
          console.warn("[preview] typst 실패 → react 폴백", err);
          setFellBack(true);
          onTypstFallback();
        }}
      />
    );
  }

  return (
    <BookPreviewPanel
      options={options}
      trim={trim}
      bookData={bookData}
      previewContent={previewContent}
      resetPageKey={activeBlockId ?? "new"}
    />
  );
}
