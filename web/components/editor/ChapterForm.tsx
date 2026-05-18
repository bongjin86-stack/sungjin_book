"use client";

import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import type { Block } from "@blocknote/core";
import { useEffect, useRef, useState } from "react";
import { showToast } from "@/components/ui/Toast";

interface ChapterFormProps {
  initialChapterNum: string;
  onSave: (data: { chapterNum: string; title: string; body: string; charCount: number }) => void;
  onChange?: (data: { chapterNum: string; title: string; body: string }) => void;
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
  // collapse trailing empties
  while (parts.length && parts[parts.length - 1] === "") parts.pop();
  return parts.join("\n\n");
}

export function ChapterForm({ initialChapterNum, onSave, onChange }: ChapterFormProps) {
  const [chapterNum, setChapterNum] = useState(initialChapterNum);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [showSaved, setShowSaved] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  const editor = useCreateBlockNote();

  // initialChapterNum 변경 시 동기화 (저장 후 다음 번호)
  useEffect(() => {
    setChapterNum(initialChapterNum);
  }, [initialChapterNum]);

  // 본문 텍스트만 허용 — 붙여넣기 서식 제거는 BlockNote 기본 동작에서 비교적 깔끔하지만,
  // paste 이벤트를 가로채 plaintext만 삽입한다.
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
    onChange?.({ chapterNum, title, body: plain });
  }

  function handleSave() {
    if (!title.trim() && !body.trim()) return;
    onSave({
      chapterNum: chapterNum.trim() || "1장",
      title: title.trim() || "(제목 없음)",
      body: body.trim(),
      charCount,
    });
    // 폼 초기화
    setTitle("");
    setBody("");
    setCharCount(0);
    editor.replaceBlocks(editor.document, [{ type: "paragraph", content: "" }]);
    // 저장 피드백
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 1800);
    // 제목 포커스
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
  }, [title, body, charCount, chapterNum]);

  return (
    <div className="w-full max-w-[620px] bg-surface rounded-[16px] border border-border shadow-[0_1px_4px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]">
      <div className="px-[26px] pt-[22px]">
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-accent-light text-accent text-[10px] font-bold uppercase tracking-[0.5px] px-[9px] py-[3px] rounded-[20px]">
            챕터
          </span>
          <input
            type="text"
            value={chapterNum}
            onChange={(e) => setChapterNum(e.target.value)}
            className="border-none bg-transparent text-[13px] font-semibold text-text-secondary outline-none w-20 focus:text-accent"
          />
          <span className="text-[11px] text-text-muted">직접 수정 가능 (프롤로그, 에필로그 등)</span>
        </div>
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            onChange?.({ chapterNum, title: e.target.value, body });
          }}
          placeholder="챕터 제목을 입력하세요"
          className="w-full border-none outline-none text-[24px] font-bold text-text-primary bg-transparent leading-[1.3] placeholder:text-[#D4D0C8] placeholder:font-normal"
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
          저장
        </button>
      </div>
    </div>
  );
}
