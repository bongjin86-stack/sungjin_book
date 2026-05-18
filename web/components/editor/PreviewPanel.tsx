"use client";

// 이 컴포넌트는 의도적으로 독립적이다.
// 부모는 previewContent prop만 전달하고, 렌더링 방식(HTML/Typst PDF/iframe 등)은 이 안에서만 결정한다.
// Phase 2에서 Typst PDF 응답으로 교체될 예정.

interface PreviewPanelProps {
  open: boolean;
  onClose: () => void;
  previewContent: {
    chapterNum: string;
    title: string;
    body: string;
  };
}

export function PreviewPanel({ open, onClose, previewContent }: PreviewPanelProps) {
  const { chapterNum, title, body } = previewContent;
  const isEmpty = !title.trim() && !body.trim();

  return (
    <div
      className={`bg-[#1A1A1A] transition-[width,border-width] duration-300 flex flex-col overflow-hidden ${
        open ? "w-[380px] border-l border-border" : "w-0 border-l-0"
      }`}
    >
      <div className="px-4 py-3 border-b border-[#2A2A2A] flex items-center flex-shrink-0">
        <span className="text-[12px] text-[#888] flex-1">📖 실시간 미리보기</span>
        <button
          type="button"
          onClick={onClose}
          className="bg-transparent border-none text-[#666] text-[14px] px-[6px] py-[2px] hover:text-white"
        >
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-6 flex justify-center">
        <div className="w-full max-w-[300px] bg-white rounded-[4px] px-8 py-10 font-serif shadow-[0_4px_24px_rgba(0,0,0,0.4)] min-h-[420px]">
          {isEmpty ? (
            <div className="text-[12px] text-[#999] text-center py-10 leading-[1.7]">
              챕터를 입력하면
              <br />
              여기에 미리보기가 표시됩니다.
            </div>
          ) : (
            <>
              <div className="text-[10px] text-[#999] uppercase tracking-[1px] mb-2">
                {chapterNum}
              </div>
              <div className="text-[17px] font-bold text-[#111] mb-[18px] leading-[1.3]">
                {title || "(제목 없음)"}
              </div>
              <div className="text-[12.5px] leading-[1.95] text-[#2A2A2A] whitespace-pre-wrap">
                {body}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
