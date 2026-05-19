"use client";

import type { BookBlock, BookData, BookMeta, ChapterBlock, MatterBlock } from "@/types/book";

interface BlockEditorProps {
  block: BookBlock;
  bookData: BookData;
  onUpdateMeta: (patch: Partial<BookMeta>) => void;
  onUpdateBlock: (id: string, patch: Partial<BookBlock>) => void;
  onUpdateChapter: (
    id: string,
    patch: Partial<
      Pick<
        ChapterBlock,
        | "chapterNum"
        | "title"
        | "subtitle"
        | "body"
        | "includeInToc"
        | "tocTitle"
        | "showChapterNumber"
      >
    >,
  ) => void;
  onPreviewChange: (data: {
    chapterNum: string;
    title: string;
    subtitle?: string;
    body: string;
    showChapterNumber?: boolean;
  }) => void;
}

export function BlockEditor({
  block,
  bookData,
  onUpdateMeta,
  onUpdateBlock,
  onUpdateChapter,
  onPreviewChange,
}: BlockEditorProps) {
  if (block.type === "chapter") return null;

  if (block.type === "half-title") {
    return <HalfTitleEditor bookData={bookData} onUpdateMeta={onUpdateMeta} />;
  }

  if (block.type === "copyright") {
    return (
      <MatterTextEditor
        block={block}
        heading="판권지"
        description="저작권, 발행 정보, ISBN을 정리합니다."
        bodyPlaceholder={`Copyright © ${new Date().getFullYear()} ${bookData.meta.author}\n\n초판 발행: ${new Date().getFullYear()}년\n펴낸곳: ${bookData.meta.publisher ?? "출판사명"}\nISBN:`}
        onUpdateBlock={onUpdateBlock}
        onPreviewChange={onPreviewChange}
      />
    );
  }

  if (block.type === "toc") {
    return (
      <TocEditor
        bookData={bookData}
        onUpdateChapter={onUpdateChapter}
        onPreviewChange={onPreviewChange}
      />
    );
  }

  if (block.type === "interlude") {
    return (
      <div className="w-full max-w-[680px] bg-surface rounded-[16px] border border-border p-8">
        <p className="text-[18px] font-bold text-text-primary">간지</p>
        <p className="mt-2 text-[13px] leading-[1.7] text-text-secondary">
          간지는 본문 사이에 들어가는 쉬어가는 페이지입니다. 다음 단계에서 제목과 부제목을
          편집할 수 있게 연결합니다.
        </p>
      </div>
    );
  }

  return (
    <MatterTextEditor
      block={block}
      heading={block.title || "책 구성"}
      description="이 페이지에 들어갈 문구를 정리합니다."
      bodyPlaceholder="본문을 입력하세요."
      onUpdateBlock={onUpdateBlock}
      onPreviewChange={onPreviewChange}
    />
  );
}

function HalfTitleEditor({
  bookData,
  onUpdateMeta,
}: {
  bookData: BookData;
  onUpdateMeta: (patch: Partial<BookMeta>) => void;
}) {
  const { meta } = bookData;
  return (
    <div className="w-full max-w-[680px] bg-surface rounded-[16px] border border-border shadow-[0_1px_4px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]">
      <div className="px-[26px] py-[22px] border-b border-border">
        <p className="text-[10px] font-bold text-accent uppercase tracking-[0.7px]">속표지</p>
        <h2 className="mt-2 text-[22px] font-bold text-text-primary">책의 첫 인상</h2>
        <p className="mt-1 text-[13px] text-text-secondary">
          이 정보가 속표지와 PDF 기본 정보에 함께 쓰입니다.
        </p>
      </div>
      <div className="px-[26px] py-5 grid gap-4">
        <TextField
          label="책 제목"
          value={meta.title}
          onChange={(title) => onUpdateMeta({ title })}
        />
        <TextField
          label="부제목"
          value={meta.subtitle ?? ""}
          onChange={(subtitle) => onUpdateMeta({ subtitle })}
          placeholder="선택"
        />
        <TextField
          label="저자"
          value={meta.author}
          onChange={(author) => onUpdateMeta({ author })}
        />
        <TextField
          label="출판사"
          value={meta.publisher ?? ""}
          onChange={(publisher) => onUpdateMeta({ publisher })}
          placeholder="선택"
        />
      </div>
    </div>
  );
}

function TocEditor({
  bookData,
  onUpdateChapter,
  onPreviewChange,
}: {
  bookData: BookData;
  onUpdateChapter: BlockEditorProps["onUpdateChapter"];
  onPreviewChange: BlockEditorProps["onPreviewChange"];
}) {
  const chapters = bookData.blocks.filter((b): b is ChapterBlock => b.type === "chapter");
  const makeTocBody = (chapterList: ChapterBlock[]) =>
    chapterList
      .filter((chapter) => chapter.includeInToc)
      .map((chapter) => {
        const label = chapter.tocTitle?.trim() || chapter.title.trim() || "(제목 없음)";
        return `${chapter.chapterNum}  ${label}`;
      })
      .join("\n\n");
  return (
    <div className="w-full max-w-[680px] bg-surface rounded-[16px] border border-border shadow-[0_1px_4px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]">
      <div className="px-[26px] py-[22px] border-b border-border">
        <p className="text-[10px] font-bold text-accent uppercase tracking-[0.7px]">목차</p>
        <h2 className="mt-2 text-[22px] font-bold text-text-primary">챕터에서 자동 생성</h2>
        <p className="mt-1 text-[13px] text-text-secondary">
          챕터 제목과 순서를 바꾸면 목차도 같이 바뀝니다.
        </p>
      </div>
      <div className="px-[26px] py-5">
        {chapters.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-text-muted">
            챕터를 저장하면 목차가 자동으로 만들어집니다.
          </p>
        ) : (
          <div className="grid gap-2">
            {chapters.map((chapter) => (
              <div
                key={chapter.id}
                className="grid grid-cols-[auto_1fr] gap-3 rounded-[10px] border border-border bg-bg px-3 py-3"
              >
                <label className="mt-[7px] inline-flex items-center gap-2 text-[12px] text-text-secondary cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={chapter.includeInToc}
                    onChange={(e) => {
                      const includeInToc = e.target.checked;
                      onUpdateChapter(chapter.id, { includeInToc });
                      onPreviewChange({
                        chapterNum: "",
                        title: "목차",
                        body: makeTocBody(
                          chapters.map((item) =>
                            item.id === chapter.id ? { ...item, includeInToc } : item,
                          ),
                        ),
                      });
                    }}
                    className="w-4 h-4 accent-accent"
                  />
                  표시
                </label>
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold text-text-primary">
                    {chapter.chapterNum} {chapter.title || "(제목 없음)"}
                  </div>
                  <input
                    type="text"
                    value={chapter.tocTitle ?? ""}
                    onChange={(e) => {
                      const tocTitle = e.target.value;
                      onUpdateChapter(chapter.id, { tocTitle });
                      onPreviewChange({
                        chapterNum: "",
                        title: "목차",
                        body: makeTocBody(
                          chapters.map((item) =>
                            item.id === chapter.id ? { ...item, tocTitle } : item,
                          ),
                        ),
                      });
                    }}
                    placeholder="목차에 다르게 보일 이름 (선택)"
                    className="mt-2 w-full rounded-[7px] border border-border bg-white px-3 py-[7px] text-[12px] outline-none focus:border-accent"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MatterTextEditor({
  block,
  heading,
  description,
  bodyPlaceholder,
  onUpdateBlock,
  onPreviewChange,
}: {
  block: MatterBlock;
  heading: string;
  description: string;
  bodyPlaceholder: string;
  onUpdateBlock: BlockEditorProps["onUpdateBlock"];
  onPreviewChange: BlockEditorProps["onPreviewChange"];
}) {
  const body = block.body ?? "";
  return (
    <div className="w-full max-w-[680px] bg-surface rounded-[16px] border border-border shadow-[0_1px_4px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]">
      <div className="px-[26px] py-[22px] border-b border-border">
        <p className="text-[10px] font-bold text-accent uppercase tracking-[0.7px]">책 구성</p>
        <input
          type="text"
          value={heading}
          onChange={(e) => {
            onUpdateBlock(block.id, { title: e.target.value } as Partial<BookBlock>);
            onPreviewChange({ chapterNum: "", title: e.target.value, body });
          }}
          className="mt-2 w-full border-none bg-transparent text-[22px] font-bold text-text-primary outline-none"
        />
        <p className="mt-1 text-[13px] text-text-secondary">{description}</p>
      </div>
      <div className="px-[26px] py-5">
        <textarea
          value={body}
          onChange={(e) => {
            onUpdateBlock(block.id, { body: e.target.value } as Partial<BookBlock>);
            onPreviewChange({ chapterNum: "", title: heading, body: e.target.value });
          }}
          placeholder={bodyPlaceholder}
          className="min-h-[260px] w-full resize-none rounded-[10px] border border-border bg-bg px-4 py-3 text-[14px] leading-[1.8] text-text-primary outline-none placeholder:text-text-muted focus:border-accent focus:bg-white"
        />
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-[6px]">
      <span className="text-[11px] font-semibold uppercase tracking-[0.6px] text-text-muted">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-[8px] border-[1.5px] border-border bg-bg px-3 py-[10px] text-[14px] text-text-primary outline-none placeholder:text-text-muted focus:border-accent focus:bg-white"
      />
    </label>
  );
}
