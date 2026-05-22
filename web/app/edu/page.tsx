"use client";

// /edu — Edu100: 내부 조판자용 Preset Block Engine v0.
//
// 흐름:
//   진입 (제목/저자) → 작업 화면
//   작업 = 좌측 책 구조 (블록 목록 + manifest 기반 추가 버튼)
//        + 가운데 미리보기 (Typst 컴파일 SVG)
//        + 하단 PDF 다운로드.
//
// 블록 단위 (preset-manifest.json에서 가져옴):
//   PART / 지문 / 문제 / 빠른 정답
//
// 데이터 권위는 blocks[]. 컴파일 직전에 chapters[]로 normalize → main.typ.
// 껍데기 UI 금지 — 추가 버튼 → JSON → 미리보기 PDF가 즉시 연결되어야 한다.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  compileTestPaperSvg,
  compileTestPaperPdf,
} from "@/lib/typst/compiler";
import { EduSetupScreen, type EduProjectSetup } from "@/components/onboarding/EduSetupScreen";
import { BlockEditModal } from "@/components/edu/BlockEditModal";
import {
  blocksToChapters,
  newBlockId,
} from "@/lib/adapters/blocks-to-chapters";
import type {
  Block,
  PartCoverBlock,
  PassageBlock,
  QuestionsBlock,
  QuickAnswerBlock,
} from "@/lib/schema/edu-book";
import manifestRaw from "../../../typst-templates/edu/presets/simply-classic/preset-manifest.json";

interface ManifestBlock {
  type: string;
  label: string;
  button: string;
  renderer: string;
  enabled: boolean;
  note?: string;
}

interface Manifest {
  id: string;
  label: string;
  purpose: string;
  blocks: ManifestBlock[];
}

const manifest = manifestRaw as Manifest;

/** preset 블록 정의 중 사이드바에 보일 종류. toc는 1차에선 disabled. */
const SIDEBAR_BLOCKS = manifest.blocks.filter(
  (b) => b.type !== "toc",
);

/** 사용자 setup + blocks → EduBook JSON. preset은 manifest.id 고정. */
function buildBookData(setup: EduProjectSetup, blocks: Block[]) {
  const chapters = blocksToChapters(blocks);
  return {
    meta: {
      title: setup.title,
      author: setup.author,
      subject: "",
      watermark: "",
    },
    preset: manifest.id,
    options: { size: setup.size },
    chapters,
    blocks,
  };
}

type State =
  | { kind: "idle" }
  | { kind: "loading"; phase: string }
  | { kind: "ok"; svg: string; elapsedMs: number }
  | { kind: "error"; message: string };

type ModalOpen =
  | { kind: "part-cover"; initial: PartCoverBlock | null }
  | { kind: "passage"; initial: PassageBlock | null }
  | { kind: "questions"; initial: QuestionsBlock | null; passages: PassageBlock[] }
  | { kind: "quick-answer"; initial: QuickAnswerBlock | null }
  | null;

export default function EduPage() {
  const [setup, setSetup] = useState<EduProjectSetup | null>(null);
  const [state, setState] = useState<State>({ kind: "idle" });
  const [pageIdx, setPageIdx] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [downloading, setDownloading] = useState(false);

  // 데이터 권위: blocks[]. 빈 배열이면 미리보기는 빈 페이지.
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [modal, setModal] = useState<ModalOpen>(null);

  // HWP 업로드 (UI 자리만 — 실제 변환은 별도)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const svgHostRef = useRef<HTMLDivElement>(null);

  // 현재 등록된 지문 블록만 — "문제" 모달에서 passage_id 선택지로.
  const passageBlocks = useMemo<PassageBlock[]>(
    () => blocks.filter((b): b is PassageBlock => b.kind === "passage"),
    [blocks],
  );

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    const ok = file.name.toLowerCase().endsWith(".hwp") ||
               file.name.toLowerCase().endsWith(".hwpx");
    if (!ok) {
      alert("HWP / HWPX 파일만 받습니다.");
      return;
    }
    setUploadedFile(file);
  }

  // 추가 버튼 클릭 → 모달 열기 (kind별).
  function openAddModal(kind: string) {
    if (kind === "part-cover") {
      const count = blocks.filter((b) => b.kind === "part-cover").length;
      setModal({
        kind: "part-cover",
        initial: {
          kind: "part-cover",
          id: newBlockId("part"),
          label: `PART ${count + 1}`,
          subtitle: "",
        },
      });
    } else if (kind === "passage") {
      setModal({ kind: "passage", initial: null });
    } else if (kind === "questions") {
      setModal({ kind: "questions", initial: null, passages: passageBlocks });
    } else if (kind === "quick-answer") {
      setModal({ kind: "quick-answer", initial: null });
    }
  }

  // 기존 블록 클릭 → 편집 모달.
  function openEditModal(b: Block) {
    if (b.kind === "part-cover") setModal({ kind: "part-cover", initial: b });
    else if (b.kind === "passage") setModal({ kind: "passage", initial: b });
    else if (b.kind === "questions")
      setModal({ kind: "questions", initial: b, passages: passageBlocks });
    else if (b.kind === "quick-answer") setModal({ kind: "quick-answer", initial: b });
  }

  function handleSaveBlock(block: Block) {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === block.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = block;
        return next;
      }
      return [...prev, block];
    });
    setModal(null);
  }

  function handleDeleteBlock(id: string) {
    if (!confirm("이 블록을 삭제할까요?")) return;
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }

  // setup 또는 blocks 갱신 → 컴파일.
  useEffect(() => {
    if (!setup) return;
    let cancelled = false;
    (async () => {
      const t0 = performance.now();
      setState({ kind: "loading", phase: "컴파일 중" });
      try {
        const data = buildBookData(setup, blocks);
        if (cancelled) return;
        const svg = await compileTestPaperSvg(data);
        if (cancelled) return;
        const elapsedMs = Math.round(performance.now() - t0);
        setState({ kind: "ok", svg, elapsedMs });
      } catch (e) {
        if (cancelled) return;
        const err = e instanceof Error ? e : new Error(String(e));
        setState({ kind: "error", message: err.message });
      }
    })();
    return () => { cancelled = true; };
  }, [setup, blocks]);

  // SVG → DOM 박기 + 페이지 수 측정
  useEffect(() => {
    if (state.kind !== "ok") return;
    const host = svgHostRef.current;
    if (!host) return;
    host.innerHTML = state.svg;
    const svg = host.querySelector("svg") as SVGSVGElement | null;
    if (!svg) return;
    const pages = svg.querySelectorAll<SVGGElement>("g.typst-page");
    setPageCount(pages.length);
    setPageIdx((prev) => (prev >= pages.length ? 0 : prev));
  }, [state]);

  // pageIdx → viewBox 좁힘
  useEffect(() => {
    const host = svgHostRef.current;
    if (!host) return;
    const svg = host.querySelector("svg") as SVGSVGElement | null;
    if (!svg) return;
    const pages = Array.from(svg.querySelectorAll<SVGGElement>("g.typst-page"));
    if (pages.length === 0) return;
    const clamped = Math.min(Math.max(pageIdx, 0), pages.length - 1);
    const orig = svg.getAttribute("data-orig-viewbox");
    let totalW = 0;
    let totalH = 0;
    if (orig) {
      const [, , w, h] = orig.split(" ").map(Number);
      totalW = w;
      totalH = h;
    } else {
      const w = Number(svg.getAttribute("width"));
      const h = Number(svg.getAttribute("height"));
      const vb = svg.getAttribute("viewBox") ?? `0 0 ${w} ${h}`;
      svg.setAttribute("data-orig-viewbox", vb);
      totalW = w;
      totalH = h;
    }
    const pageW = totalW;
    const pageH = totalH / pages.length;
    svg.setAttribute("viewBox", `0 ${clamped * pageH} ${pageW} ${pageH}`);
    svg.setAttribute("width", String(pageW));
    svg.setAttribute("height", String(pageH));
    pages.forEach((g, i) => {
      g.style.display = i === clamped ? "" : "none";
    });
  }, [pageIdx, state]);

  async function handleDownload() {
    if (!setup) return;
    setDownloading(true);
    try {
      const data = buildBookData(setup, blocks);
      const pdf = await compileTestPaperPdf(data);
      const blob = new Blob([pdf as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${setup.title || "성진북스-교재"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      alert(`PDF 다운로드 실패: ${err}`);
    } finally {
      setDownloading(false);
    }
  }

  const max = Math.max(0, pageCount - 1);
  const canPrev = pageIdx > 0;
  const canNext = pageIdx < max;

  if (!setup) {
    return <EduSetupScreen onStart={(s) => setSetup(s)} />;
  }

  return (
    <main className="min-h-screen flex flex-col bg-bg">
      <BlockEditModal
        open={modal}
        onClose={() => setModal(null)}
        onSave={handleSaveBlock}
      />

      {/* 헤더 */}
      <header className="h-12 px-5 flex items-center justify-between border-b border-border bg-surface">
        <div className="flex items-center gap-3">
          <a href="/" className="text-[13px] font-semibold text-text-primary hover:text-accent">
            성진북스
          </a>
          <span className="text-text-muted text-[11px]">·</span>
          <span className="text-[12px] text-text-secondary">Edu100</span>
          <span className="text-text-muted text-[11px]">·</span>
          <span className="text-[12px] text-text-primary font-semibold">{setup.title}</span>
          {setup.author && (
            <>
              <span className="text-text-muted text-[11px]">·</span>
              <span className="text-[11px] text-text-muted">{setup.author}</span>
            </>
          )}
          <span className="text-text-muted text-[11px]">·</span>
          <span className="text-[11px] text-text-muted">{manifest.label}</span>
        </div>
        <button
          onClick={() => setSetup(null)}
          className="text-[11px] text-text-muted hover:text-accent transition-colors"
        >
          ← 새 교재
        </button>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* 좌측: 책 구조 — 블록 목록 + manifest 기반 추가 버튼 */}
        <aside className="w-[260px] border-r border-border bg-surface flex flex-col">
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="text-[11px] text-text-muted font-medium mb-2 uppercase tracking-wide">
              책 구조
            </div>

            {/* HWP 업로드 (자동 초안용 자리) */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
              }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFiles(e.dataTransfer.files);
              }}
              className={`mb-4 px-3 py-2.5 rounded-[8px] cursor-pointer transition-colors border-[1.5px] ${
                dragOver
                  ? "border-accent border-solid bg-accent-light"
                  : uploadedFile
                    ? "border-accent border-solid bg-accent-light"
                    : "border-dashed border-border hover:border-accent hover:bg-bg-hover"
              }`}
            >
              {uploadedFile ? (
                <div>
                  <div className="text-[11px] font-semibold text-accent">📄 업로드됨</div>
                  <div className="text-[10px] text-text-secondary truncate mt-0.5">{uploadedFile.name}</div>
                  <div className="text-[10px] text-text-muted mt-1">자동 초안 변환 연결 전</div>
                </div>
              ) : (
                <div className="text-center py-1">
                  <div className="text-[11px] font-semibold text-text-primary">📥 HWP 자동 초안 (옵션)</div>
                  <div className="text-[10px] text-text-muted mt-0.5">
                    파일을 놓거나 클릭. 아래 블록 직접 복붙도 가능.
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".hwp,.hwpx"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>

            {/* 블록 목록 (권위 데이터) */}
            <div className="text-[10px] text-text-muted font-medium mb-1 uppercase tracking-wide">
              블록 ({blocks.length})
            </div>
            {blocks.length === 0 && (
              <div className="text-[10px] text-text-muted leading-relaxed mb-3 px-1">
                아래 버튼으로 블록을 쌓으세요. 추가 즉시 미리보기에 반영됩니다.
              </div>
            )}
            <div className="flex flex-col gap-1 mb-3">
              {blocks.map((b) => (
                <BlockCard
                  key={b.id}
                  block={b}
                  onClick={() => openEditModal(b)}
                  onDelete={() => handleDeleteBlock(b.id)}
                />
              ))}
            </div>

            {/* manifest 기반 추가 버튼 */}
            <div className="text-[10px] text-text-muted font-medium mb-1 uppercase tracking-wide mt-2">
              추가
            </div>
            <div className="flex flex-col gap-1.5">
              {SIDEBAR_BLOCKS.map((mb) => (
                <button
                  key={mb.type}
                  type="button"
                  disabled={!mb.enabled}
                  onClick={() => openAddModal(mb.type)}
                  className={`w-full px-3 py-2 rounded-[6px] text-[12px] text-left transition-colors border ${
                    mb.enabled
                      ? "border-dashed border-border text-text-secondary hover:border-accent hover:text-accent"
                      : "border-border text-text-muted/50 cursor-not-allowed"
                  }`}
                  title={mb.note ?? ""}
                >
                  {mb.button}
                  {!mb.enabled && (
                    <span className="ml-2 text-[10px] text-text-muted">(준비 중)</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* 가운데: 미리보기 + 네비 */}
        <section className="flex-1 flex flex-col min-w-0">
          <div className="px-5 py-2 text-[11px] flex items-center justify-between text-text-muted border-b border-border">
            <div className="flex items-center gap-2">
              <span>Typst 엔진</span>
              <span>·</span>
              {state.kind === "idle" && <span>대기</span>}
              {state.kind === "loading" && <span>{state.phase}…</span>}
              {state.kind === "ok" && <span>{state.elapsedMs}ms</span>}
              {state.kind === "error" && <span className="text-[#a00]">오류</span>}
            </div>
            <div>{setup.size} · {manifest.label}</div>
          </div>

          {state.kind === "error" && (
            <pre className="mx-5 my-2 p-3 text-xs whitespace-pre-wrap bg-[#fdebeb] border border-[#f5b8b8] rounded text-[#a00]">
              {state.message}
            </pre>
          )}

          <div className="flex-1 min-h-0 flex justify-center px-4 py-4 overflow-auto bg-bg">
            <div
              ref={svgHostRef}
              className="bg-white shadow-md w-full max-w-[760px] h-fit"
              style={{ aspectRatio: "210 / 297" }}
            />
          </div>

          <div className="h-14 px-5 flex items-center justify-between border-t border-border bg-surface">
            <div className="flex items-center gap-4 text-[12px] text-text-muted">
              <button
                onClick={() => setPageIdx((i) => Math.max(0, i - 1))}
                disabled={!canPrev}
                className="px-3 py-1 disabled:opacity-30 hover:text-accent transition-colors"
                aria-label="이전 페이지"
              >
                ◀ 이전
              </button>
              <span className="min-w-[80px] text-center">
                {pageCount === 0 ? "—" : `${pageIdx + 1} / ${pageCount}`}
              </span>
              <button
                onClick={() => setPageIdx((i) => Math.min(max, i + 1))}
                disabled={!canNext}
                className="px-3 py-1 disabled:opacity-30 hover:text-accent transition-colors"
                aria-label="다음 페이지"
              >
                다음 ▶
              </button>
            </div>
            <button
              onClick={handleDownload}
              disabled={downloading || state.kind !== "ok"}
              className="px-4 py-2 text-[12px] font-semibold rounded-[6px] bg-accent text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {downloading ? "PDF 생성 중…" : "PDF 다운로드"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

// ── 블록 카드 ─────────────────────────────────────────────────────────────
function BlockCard({
  block,
  onClick,
  onDelete,
}: {
  block: Block;
  onClick: () => void;
  onDelete: () => void;
}) {
  const meta = blockSummary(block);
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onClick}
        className="w-full px-3 py-2 rounded-[6px] bg-bg border border-border text-left hover:border-accent transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-accent uppercase tracking-wide flex-shrink-0">
            {meta.tag}
          </span>
          <span className="text-[12px] text-text-primary truncate">{meta.title}</span>
        </div>
        {meta.sub && (
          <div className="text-[10px] text-text-muted truncate mt-0.5">{meta.sub}</div>
        )}
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute top-1.5 right-1.5 text-[12px] text-text-muted opacity-0 group-hover:opacity-100 hover:text-[#a00] transition-opacity"
        aria-label="블록 삭제"
        title="삭제"
      >
        ✕
      </button>
    </div>
  );
}

function blockSummary(b: Block): { tag: string; title: string; sub?: string } {
  switch (b.kind) {
    case "part-cover":
      return { tag: "PART", title: b.label, sub: b.subtitle || undefined };
    case "passage": {
      const range = b.range ? `[${b.range[0]}~${b.range[1]}]` : "";
      const preview = b.header || b.body.slice(0, 30) || "(빈 지문)";
      return { tag: "지문", title: `${range} ${preview}`.trim() };
    }
    case "questions": {
      const n = b.questions.length;
      const linked = b.passage_id ? ` ↔ ${b.passage_id}` : "";
      const first = b.questions[0]?.stem.slice(0, 28) ?? "";
      return { tag: "문제", title: `${n}개${linked}`, sub: first };
    }
    case "quick-answer": {
      const n = Object.keys(b.answers).length;
      return { tag: "정답", title: `빠른 정답 ${n}개` };
    }
  }
}
