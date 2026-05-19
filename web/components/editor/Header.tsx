"use client";

import { Badge } from "@/components/ui/Badge";
import { showToast } from "@/components/ui/Toast";

interface HeaderProps {
  title: string;
  author: string;
  trim: string;
  isSaved: boolean;
  hasChapters: boolean;
}

export function Header({
  title,
  author,
  trim,
  isSaved,
  hasChapters,
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

      {/* 집필 진행 단계 */}
      <div className="flex items-center gap-[6px] flex-shrink-0">
        <ProgStep label="✏️ 집필 중" active done={hasChapters} />
        <ProgArrow />
        <ProgStep label="검토" />
        <ProgArrow />
        <ProgStep label="완성" />
      </div>

      <div className="flex-1" />

      {/* 자동저장 상태 */}
      <span className="text-[11px] font-medium text-text-secondary">
        {isSaved ? "✓ 자동저장됨" : "저장 중..."}
      </span>

      {/* PDF 생성 — 준비 중 */}
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
