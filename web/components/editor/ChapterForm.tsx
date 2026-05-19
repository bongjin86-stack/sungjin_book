"use client";

import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import type { Block, PartialBlock } from "@blocknote/core";
import { useEffect, useRef, useState } from "react";
import { showToast } from "@/components/ui/Toast";

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
      title: title.trim() || "(제목 없음)",
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
            className="border-none bg-transparent text-[13px] font-semibold text-text-secondary outline-none w-20 focus:text-accent"
          />
          <span className="text-[11px] text-text-muted">
            {isEdit ? "기존 챕터 편집 중" : "직접 수정 가능 (프롤로그, 에필로그 등)"}
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
          placeholder="챕터 제목을 입력하세요"
          className="w-full border-none outline-none text-[24px] font-bold text-text-primary bg-transparent leading-[1.3] placeholder:text-[#D4D0C8] placeholder:font-normal"
        />
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
          placeholder="부제목 또는 소제목 (선택)"
          className="mt-2 w-full border-none outline-none text-[14px] font-medium text-text-secondary bg-transparent leading-[1.5] placeholder:text-[#D4D0C8] placeholder:font-normal"
        />
        <div className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[12px] text-text-secondary">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeInToc}
              onChange={(e) => {
                setIncludeInToc(e.target.checked);
                onChange?.({
                  chapterNum,
                  title,
                  subtitle,
                  body,
                  includeInToc: e.target.checked,
                  tocTitle,
                  showChapterNumber,
                });
              }}
              className="w-4 h-4 accent-accent"
            />
            목차에 표시
          </label>
          <input
            type="text"
            value={tocTitle}
            onChange={(e) => {
              setTocTitle(e.target.value);
              onChange?.({
                chapterNum,
                title,
                subtitle,
                body,
                includeInToc,
                tocTitle: e.target.value,
                showChapterNumber,
              });
            }}
            placeholder="목차에 다르게 보일 이름 (선택)"
            className="min-w-0 rounded-[7px] border border-border bg-bg px-3 py-[6px] outline-none focus:border-accent focus:bg-white"
          />
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showChapterNumber}
              onChange={(e) => {
                setShowChapterNumber(e.target.checked);
                onChange?.({
                  chapterNum,
                  title,
                  subtitle,
                  body,
                  includeInToc,
                  tocTitle,
                  showChapterNumber: e.target.checked,
                });
              }}
              className="w-4 h-4 accent-accent"
            />
            챕터 번호 표시
          </label>
        </div>
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
          onClick={() => showToast("맞춤법 검사 기능은 준비 중입니다.")}
          className="px-3 py-[7px] rounded-[7px] border border-border bg-transparent text-[12px] text-text-secondary transition-all hover:border-green hover:text-green hover:bg-green-light"
        >
          ✦ 맞춤법 검사 <span className="text-[10px] text-text-muted">(준비 중)</span>
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-[22px] py-[9px] rounded-[8px] bg-accent text-white text-[13px] font-bold transition-all hover:bg-accent-hover active:scale-[0.97]"
        >
          {isEdit ? "수정 저장" : "저장"}
        </button>
      </div>
    </div>
  );
}
