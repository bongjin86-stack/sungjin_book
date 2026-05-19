"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { showToast } from "@/components/ui/Toast";
import type { BookData } from "@/types/book";

interface HeaderProps {
  title: string;
  author: string;
  trim: string;
  isSaved: boolean;
  hasChapters: boolean;
  bookData: BookData | null;
}

export function Header({
  title,
  author,
  trim,
  isSaved,
  hasChapters,
  bookData,
}: HeaderProps) {
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    if (!bookData) {
      showToast("책 데이터가 없습니다.");
      return;
    }
    if (!hasChapters) {
      showToast("챕터를 한 개 이상 작성하세요.");
      return;
    }
    setGenerating(true);
    try {
      const { compilePdf } = await import("@/lib/typst/compiler");
      const { trackBToTypst } = await import("@/lib/typst/buildSource");
      const { buildMainSource, buildDataJson } = await import("@/lib/typst/buildSource");
      const { addSource } = await import("@/lib/typst/compiler");

      const typstBook = trackBToTypst(
        {
          title: bookData.meta.title,
          author: bookData.meta.author,
          subtitle: bookData.meta.subtitle,
          publisher: bookData.meta.publisher,
          options: serializeOpts(bookData.meta.options),
        },
        bookData.blocks,
      );

      const tplUrl = "/typst-templates/sinkukpan/classic/template.typ";
      const tpl = await fetch(tplUrl).then((r) => r.text());
      await addSource("/template.typ", tpl);
      await addSource("/data.json", buildDataJson(typstBook));
      const pdfBytes = await compilePdf(buildMainSource());

      // pdfBytes는 Uint8Array<ArrayBufferLike>. Blob은 ArrayBuffer 기반만 받음.
      const buf = pdfBytes.buffer.slice(
        pdfBytes.byteOffset,
        pdfBytes.byteOffset + pdfBytes.byteLength,
      ) as ArrayBuffer;
      const blob = new Blob([buf], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${bookData.meta.title || "untitled"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("PDF 다운로드를 시작합니다.");
    } catch (e) {
      showToast(`PDF 생성 실패: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setGenerating(false);
    }
  }

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

      <button
        type="button"
        onClick={handleGenerate}
        disabled={generating}
        className="px-[13px] py-[7px] rounded bg-accent text-white text-[13px] font-semibold hover:bg-accent-hover inline-flex items-center gap-[5px] disabled:opacity-60"
      >
        {generating ? "⏳ 생성 중…" : "⬇ PDF 생성"}
      </button>
    </header>
  );
}

function serializeOpts(o: BookData["meta"]["options"]): Record<string, unknown> {
  return {
    showChapterNumber: o.showChapterNumber,
    bodyFont: o.bodyFont,
    bodyFontSize: o.bodyFontSize,
    lineSpacing: o.lineSpacing,
    showPageNumber: o.showPageNumber,
    pageNumberPosition: o.pageNumberPosition,
    hideChapterStartPageNumber: o.hideChapterStartPageNumber,
    paragraphIndent: o.paragraphIndent,
  };
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
