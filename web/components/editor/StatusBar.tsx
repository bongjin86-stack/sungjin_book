interface StatusBarProps {
  isSaved: boolean;
  chapterCount: number;
  totalChars: number;
  trim: string;
}

export function StatusBar({ isSaved, chapterCount, totalChars, trim }: StatusBarProps) {
  return (
    <div className="h-7 bg-surface border-t border-border flex items-center px-4 gap-[14px] flex-shrink-0">
      <div className="text-[11px] text-text-muted flex items-center gap-1">
        <span
          className={`w-[5px] h-[5px] rounded-full ${
            isSaved ? "bg-[#22C55E]" : "bg-text-muted"
          }`}
        />
        {isSaved ? "자동저장됨" : "저장 중..."}
      </div>
      <div className="text-[11px] text-text-muted">챕터 {chapterCount}개</div>
      <div className="text-[11px] text-text-muted">총 {totalChars.toLocaleString()}자</div>
      <div className="ml-auto text-[11px] text-text-secondary">{trim} · 챕터 모드</div>
    </div>
  );
}
