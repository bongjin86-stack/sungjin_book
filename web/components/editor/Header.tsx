"use client";

import { Badge } from "@/components/ui/Badge";
import { showToast } from "@/components/ui/Toast";

interface HeaderProps {
  title: string;
  author: string;
  trim: string;
  isSaved: boolean;
  hasChapters: boolean;
  onOpenFullPreview: () => void;
}

export function Header({
  title,
  author,
  trim,
  isSaved,
  hasChapters,
  onOpenFullPreview,
}: HeaderProps) {
  return (
    <header className="h-[54px] bg-surface border-b border-border flex items-center px-[18px] gap-[10px] flex-shrink-0 z-20">
      <div className="text-[15px] font-extrabold tracking-[-0.4px] flex-shrink-0">
        성진<span className="text-accent">북스</span>
      </div>
      <Divider />

      <div className="flex items-baseline gap-[5px] flex-1 min-w-0">
        <span className="text-[14px] font-bold text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">
          {title}
        </span>
        <span className="text-[12px] text-text-muted whitespace-nowrap">{author}</span>
      </div>

      <Badge variant="trim">{trim}</Badge>
      <Divider />

      <div className="flex items-center gap-[6px] flex-shrink-0">
        <ProgStep label="✏️ 집필 중" active done={hasChapters} />
        <ProgArrow />
        <ProgStep label="검토" />
        <ProgArrow />
        <ProgStep label="완성" />
      </div>

      <div className="flex-1" />

      <button
        type="button"
        className="px-[13px] py-[7px] rounded text-[11px] font-medium text-text-secondary hover:bg-bg hover:text-text-primary"
      >
        {isSaved ? "✓ 자동저장됨" : "저장 중..."}
      </button>
      <button
        type="button"
        onClick={onOpenFullPreview}
        className="px-[13px] py-[7px] rounded bg-[#18181B] text-white text-[13px] font-medium hover:bg-[#27272A] inline-flex items-center gap-[5px]"
      >
        👁 전체 미리보기
      </button>
      <button
        type="button"
        onClick={() => showToast("PDF 생성 기능은 준비 중입니다.")}
        className="px-[13px] py-[7px] rounded bg-accent text-white text-[13px] font-semibold hover:bg-accent-hover inline-flex items-center gap-[5px]"
      >
        ⬇ PDF 생성
      </button>
    </header>
  );
}

function Divider() {
  return <div className="w-px h-[18px] bg-border flex-shrink-0" />;
}

function ProgStep({ label, active, done }: { label: string; active?: boolean; done?: boolean }) {
  const cls = done
    ? "text-green"
    : active
      ? "text-accent bg-accent-light font-semibold"
      : "text-text-muted";
  return (
    <div className={`flex items-center gap-[5px] text-[12px] px-[10px] py-1 rounded-[20px] ${cls}`}>
      {label}
    </div>
  );
}

function ProgArrow() {
  return <span className="text-[10px] text-text-muted">›</span>;
}
