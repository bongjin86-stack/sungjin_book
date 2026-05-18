"use client";

import { useEffect } from "react";
import { showToast } from "@/components/ui/Toast";
import type { BookBlock, BookMeta } from "@/types/book";

interface FullPreviewOverlayProps {
  open: boolean;
  onClose: () => void;
  meta: BookMeta;
  blocks: BookBlock[];
}

export function FullPreviewOverlay({ open, onClose, meta, blocks }: FullPreviewOverlayProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const chapters = blocks.filter((b) => b.type === "chapter");

  return (
    <div className="fixed inset-0 bg-[#111] z-[100] flex flex-col">
      <div className="h-[52px] bg-[#1C1C1C] border-b border-[#2A2A2A] flex items-center px-5 gap-[10px] flex-shrink-0">
        <div className="flex-1">
          <div className="text-[14px] text-[#E0E0E0] font-semibold">{meta.title}</div>
          <div className="text-[11px] text-[#666] mt-px">{meta.trim}</div>
        </div>
        <button
          type="button"
          onClick={() => showToast("PDF 생성 기능은 준비 중입니다.")}
          className="bg-accent text-white border-none px-4 py-[7px] rounded-[7px] text-[13px] font-semibold"
        >
          ⬇ PDF 생성
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-[14px] py-[6px] rounded-[7px] border border-[#3A3A3A] bg-transparent text-[#999] text-[13px] hover:bg-[#2A2A2A] hover:text-white"
        >
          ✕ 닫기
        </button>
      </div>
      <div className="flex-1 overflow-y-auto flex justify-center p-10 gap-5 flex-wrap content-start">
        {chapters.length === 0 ? (
          <div className="text-center py-[60px] text-[#666] text-[13px] w-full">
            저장된 챕터가 없습니다.
            <br />
            챕터를 저장하면 여기에 미리보기가 표시됩니다.
          </div>
        ) : (
          <>
            {chapters.map((ch) => (
              <div
                key={ch.id}
                className="w-[360px] bg-white rounded-[4px] shadow-[0_8px_40px_rgba(0,0,0,0.5)] px-11 py-[52px] font-serif min-h-[510px]"
              >
                <div className="text-[10px] text-[#999] uppercase tracking-[1px] mb-2">
                  {ch.chapterNum}
                </div>
                <div className="text-[20px] font-bold text-[#111] mb-5 leading-[1.3]">
                  {ch.title}
                </div>
                <div className="text-[13px] leading-[1.95] text-[#2A2A2A] whitespace-pre-wrap">
                  {ch.body}
                </div>
              </div>
            ))}
            <div className="text-[11px] text-[#666] text-center mt-4 w-full">
              실제 PDF는 Typst 엔진으로 생성됩니다. 폰트·여백·줄간격이 최종 결과물에 적용됩니다.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
