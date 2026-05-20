"use client";

import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import type { Block, PartialBlock } from "@blocknote/core";
import { useEffect, useRef, useState } from "react";

export type ChapterFormMode =
  | { kind: "new"; nextChapterNum: string }
  | {
      kind: "edit";
      blockId: string;
      initial: {
        chapterNum: string;
        title: string;
        subtitle?: string;
        body: string;
        includeInToc?: boolean;
        tocTitle?: string;
        showChapterNumber?: boolean;
      };
    };

interface ChapterFormProps {
  mode: ChapterFormMode;
  onSaveNew: (data: {
    chapterNum: string;
    title: string;
    subtitle: string;
    body: string;
    charCount: number;
    includeInToc: boolean;
    tocTitle: string;
    showChapterNumber: boolean;
  }) => void;
  onSaveEdit: (
    blockId: string,
    patch: {
      chapterNum: string;
      title: string;
      subtitle: string;
      body: string;
      charCount: number;
      includeInToc: boolean;
      tocTitle: string;
      showChapterNumber: boolean;
    },
  ) => void;
  onChange?: (data: {
    chapterNum: string;
    title: string;
    subtitle?: string;
    body: string;
    includeInToc?: boolean;
    tocTitle?: string;
    showChapterNumber?: boolean;
  }) => void;
}

function blocksToPlainText(blocks: Block[]): string {
  const parts: string[] = [];
  for (const b of blocks) {
    if (b.type === "paragraph") {
      const text = (b.content as { type: string; text?: string }[] | undefined)
        ?.map((c) => (c.type === "text" ? c.text ?? "" : ""))
        .join("")
        .trimEnd();
      if (text) parts.push(text);
      else parts.push("");
    }
  }
  while (parts.length && parts[parts.length - 1] === "") parts.pop();
  return parts.join("\n\n");
}

function plainToBlocks(text: string): PartialBlock[] {
  if (!text || !text.trim()) return [{ type: "paragraph", content: "" }];
  return text
    .split(/\n{2,}/)
    .map((p): PartialBlock => ({ type: "paragraph", content: p }));
}

export function ChapterForm({ mode, onSaveNew, onSaveEdit, onChange }: ChapterFormProps) {
  const initialChapterNum = mode.kind === "new" ? mode.nextChapterNum : mode.initial.chapterNum;
  const initialTitle = mode.kind === "edit" ? mode.initial.title : "";
  const initialSubtitle = mode.kind === "edit" ? mode.initial.subtitle ?? "" : "";
  const initialBody = mode.kind === "edit" ? mode.initial.body : "";
  const initialIncludeInToc = mode.kind === "edit" ? mode.initial.includeInToc ?? true : true;
  const initialTocTitle = mode.kind === "edit" ? mode.initial.tocTitle ?? "" : "";
  const initialShowChapterNumber =
    mode.kind === "edit" ? mode.initial.showChapterNumber ?? true : true;

  const [chapterNum, setChapterNum] = useState(initialChapterNum);
  const [title, setTitle] = useState(initialTitle);
  const [subtitle, setSubtitle] = useState(initialSubtitle);
  const [body, setBody] = useState(initialBody);
  const [charCount, setCharCount] = useState(initialBody.length);
  const [includeInToc, setIncludeInToc] = useState(initialIncludeInToc);
  const [tocTitle, setTocTitle] = useState(initialTocTitle);
  const [showChapterNumber, setShowChapterNumber] = useState(initialShowChapterNumber);
  const [showSaved, setShowSaved] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  // BlockNote는 마운트 시점의 initialContent 만 본다. 모드 전환 시 부모가 key를 바꿔
  // ChapterForm을 재마운트하므로 여기서는 첫 마운트만 책임진다.
  const editor = useCreateBlockNote({
    initialContent: plainToBlocks(initialBody),
  });

  // 모드/initial 변경 시 폼 state 동기화 (key가 안 바뀌어 재마운트 안 될 가능성 대비)
  useEffect(() => {
    setChapterNum(initialChapterNum);
    setTitle(initialTitle);
    setSubtitle(initialSubtitle);
    setBody(initialBody);
    setCharCount(initialBody.length);
    setIncludeInToc(initialIncludeInToc);
    setTocTitle(initialTocTitle);
    setShowChapterNumber(initialShowChapterNumber);
  }, [
    initialChapterNum,
    initialTitle,
    initialSubtitle,
    initialBody,
    initialIncludeInToc,
    initialTocTitle,
    initialShowChapterNumber,
  ]);

  // 붙여넣기 plaintext만 허용
  useEffect(() => {
    const dom = editor.domElement;
    if (!dom) return;
    const handler = (e: ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData?.getData("text/plain") ?? "";
      if (!text) return;
      const paragraphs = text.split(/\r?\n\r?\n+/).map((p) => p.replace(/\r?\n/g, " "));
      const blocks = paragraphs.map((p) => ({
        type: "paragraph" as const,
        content: p,
      }));
      const cursor = editor.getTextCursorPosition();
      editor.insertBlocks(blocks, cursor.block, "after");
    };
    dom.addEventListener("paste", handler);
    return () => dom.removeEventListener("paste", handler);
  }, [editor]);

  function syncFromEditor() {
    const plain = blocksToPlainText(editor.document);
    setBody(plain);
    setCharCount(plain.length);
    onChange?.({
      chapterNum,
      title,
      subtitle,
      body: plain,
      includeInToc,
      tocTitle,
      showChapterNumber,
    });
  }

  function handleSave() {
    if (!title.trim() && !body.trim()) return;
    const payload = {
      chapterNum: chapterNum.trim() || "1장",
      // 빈 제목은 빈 문자열로 보관. UI 표시는 placeholder("(제목 없음)")로 별도 처리.
      // 데이터에 placeholder 문자열을 박으면 Typst 미리보기에 그대로 출력되어 어색해진다.
      title: title.trim(),
      subtitle: subtitle.trim(),
      body: body.trim(),
      charCount,
      includeInToc,
      tocTitle: tocTitle.trim(),
      showChapterNumber,
    };

    if (mode.kind === "new") {
      onSaveNew(payload);
      // 폼 초기화
      setTitle("");
      setBody("");
      setCharCount(0);
      editor.replaceBlocks(editor.document, [{ type: "paragraph", content: "" }]);
    } else {
      onSaveEdit(mode.blockId, payload);
      // 편집 모드는 폼 유지
    }

    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 1800);
    setTimeout(() => titleRef.current?.focus(), 0);
  }

  // Ctrl+Enter 저장
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, subtitle, body, charCount, chapterNum, includeInToc, tocTitle, showChapterNumber, mode]);

  const isEdit = mode.kind === "edit";

  return (
    <div className="w-full min-w-0 max-w-[680px] bg-surface rounded-[16px] border border-border shadow-[0_1px_4px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]">
      <div className="px-[26px] pt-[22px]">
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`text-[10px] font-bold uppercase tracking-[0.5px] px-[9px] py-[3px] rounded-[20px] ${
              isEdit ? "bg-purple-light text-purple" : "bg-accent-light text-accent"
            }`}
          >
            {isEdit ? "편집" : "챕터"}
          </span>
          {/* 챕터 번호 — 인라인 편집 가능. hover 시 살짝 강조해 클릭 가능함을 알림. */}
          <input
            type="text"
            value={chapterNum}
            onChange={(e) => {
              setChapterNum(e.target.value);
              onChange?.({
                chapterNum: e.target.value,
                title,
                subtitle,
                body,
                includeInToc,
                tocTitle,
                showChapterNumber,
              });
            }}
            aria-label="챕터 번호"
            className="text-[13px] font-semibold text-text-secondary bg-transparent border border-transparent rounded px-1 py-[1px] outline-none hover:border-border focus:border-accent focus:bg-white max-w-[110px]"
            style={{ width: `${Math.max(4, chapterNum.length + 1)}ch` }}
          />
          <span className="text-[11px] text-text-muted">
            {isEdit ? "기존 챕터 편집 중" : "저장하면 다음 챕터로 이어서 씁니다"}
          </span>
        </div>
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            onChange?.({
              chapterNum,
              title: e.target.value,
              subtitle,
              body,
              includeInToc,
              tocTitle,
              showChapterNumber,
            });
          }}
          placeholder="챕터 제목 (없어도 됨)"
          className="w-full border-none outline-none text-[24px] font-bold text-text-primary bg-transparent leading-[1.3] placeholder:text-[#D4D0C8] placeholder:font-normal"
        />
        {/* 부제 입력 — 제목 아래 작게. 비워두면 PDF에도 안 박힘. */}
        <input
          type="text"
          value={subtitle}
          onChange={(e) => {
            setSubtitle(e.target.value);
            onChange?.({
              chapterNum,
              title,
              subtitle: e.target.value,
              body,
              includeInToc,
              tocTitle,
              showChapterNumber,
            });
          }}
          placeholder="부제 (선택)"
          className="w-full mt-1 border-none outline-none text-[14px] italic text-text-muted bg-transparent leading-[1.4] placeholder:text-[#D4D0C8] placeholder:not-italic"
        />
        <div className="h-px bg-border mt-4" />
      </div>

      <div className="px-[26px] py-4 min-h-[260px]">
        <div className="ch-blocknote text-[15px] leading-[1.9] text-text-primary">
          <BlockNoteView
            editor={editor}
            theme="light"
            formattingToolbar={false}
            slashMenu={false}
            sideMenu={false}
            filePanel={false}
            tableHandles={false}
            onChange={syncFromEditor}
          />
        </div>
      </div>

      <div className="px-[26px] py-3 pb-5 border-t border-border flex items-center gap-2">
        <span className="text-[12px] text-text-muted flex-1">{charCount.toLocaleString()}자</span>
        {showSaved && (
          <div className="flex items-center gap-[5px] text-[12px] text-green font-medium">
            ✓ 저장됨
          </div>
        )}
        <button
          type="button"
          onClick={handleSave}
          className="px-[22px] py-[9px] rounded-[8px] bg-accent text-white text-[13px] font-bold transition-all hover:bg-accent-hover active:scale-[0.97]"
        >
          {isEdit ? "수정 저장" : "저장하고 다음 챕터"}
        </button>
      </div>
    </div>
  );
}
