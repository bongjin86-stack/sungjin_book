"use client";

// /edu — Edu100: 교재 제작 홈페이지.
// 진입: EduSetupScreen (제목/저자 입력) → 시작하기 누르면 작업 화면.
// 작업: 좌측 책 구조 패널 + 가운데 미리보기 + 하단 PDF 다운로드.
//
// 2026-05-22: 종목 사이드바 → 책 구조 사이드바로 변경 (사용자 결정).
//   - 단일 책 디폴트 (본문 카드 1개)
//   - "챕터 추가" 버튼은 placeholder (다음 결정 후 박음)

import { useEffect, useRef, useState } from "react";
import {
  compileTestPaperSvg,
  compileTestPaperPdf,
} from "@/lib/typst/compiler";
import { EduSetupScreen, type EduProjectSetup } from "@/components/onboarding/EduSetupScreen";

// 샘플 데이터 — HWP 업로드 박히기 전 까지는 단일 책 샘플로 미리보기.
const SAMPLE_DATA_SRC = "/dev/edu/sample-single-book.json";

/** 사용자 setup(제목/저자)을 sample JSON의 meta에 박는다. preset은 simply-classic 고정. */
function withSetup(raw: unknown, setup: EduProjectSetup) {
  const data = raw as Record<string, unknown>;
  const existingMeta = (data.meta as Record<string, unknown> | undefined) ?? {};
  return {
    ...data,
    meta: {
      ...existingMeta,
      title: setup.title,
      author: setup.author,
    },
    preset: "simply-classic",
    options: { size: setup.size },
  };
}

type State =
  | { kind: "idle" }
  | { kind: "loading"; phase: string }
  | { kind: "ok"; svg: string; elapsedMs: number }
  | { kind: "error"; message: string };

export default function EduPage() {
  // setup이 null이면 진입 화면, 값 있으면 작업 화면
  const [setup, setSetup] = useState<EduProjectSetup | null>(null);
  const [state, setState] = useState<State>({ kind: "idle" });
  const [pageIdx, setPageIdx] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [downloading, setDownloading] = useState(false);
  // HWP 업로드 (UI 자리만 — 실제 변환은 4순위에서 박음)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const svgHostRef = useRef<HTMLDivElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    // 확장자 확인 (실제 파싱은 4순위)
    const ok = file.name.toLowerCase().endsWith(".hwp") ||
               file.name.toLowerCase().endsWith(".hwpx");
    if (!ok) {
      alert("HWP / HWPX 파일만 받습니다.");
      return;
    }
    setUploadedFile(file);
  }

  // 진입 화면에서 setup 박히면 → 샘플 JSON 로드 → setup 메타 박아 컴파일.
  useEffect(() => {
    if (!setup) return;
    let cancelled = false;
    (async () => {
      const t0 = performance.now();
      setState({ kind: "loading", phase: "데이터 로드 중" });
      try {
        const res = await fetch(SAMPLE_DATA_SRC);
        if (!res.ok) throw new Error(`데이터 로드 실패 (${res.status})`);
        const raw = await res.json();
        const data = withSetup(raw, setup);
        if (cancelled) return;
        setState({ kind: "loading", phase: "컴파일 중" });
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
    return () => {
      cancelled = true;
    };
  }, [setup]);

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

  // pageIdx → viewBox 좁힘 (단행본 TypstPreviewPanel과 동일 패턴)
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
      const res = await fetch(SAMPLE_DATA_SRC);
      if (!res.ok) throw new Error(`데이터 로드 실패 (${res.status})`);
      const raw = await res.json();
      const data = withSetup(raw, setup);
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

  // setup 안 됐으면 진입 화면
  if (!setup) {
    return <EduSetupScreen onStart={(s) => setSetup(s)} />;
  }

  return (
    <main className="min-h-screen flex flex-col bg-bg">
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
        </div>
        <button
          onClick={() => setSetup(null)}
          className="text-[11px] text-text-muted hover:text-accent transition-colors"
        >
          ← 새 교재
        </button>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* 좌측: 책 구조 — 지금은 단일 책 모드 (본문 1개). 챕터 추가는 다음 결정 후 박음. */}
        <aside className="w-[220px] border-r border-border bg-surface flex flex-col">
          <div className="p-4 flex-1">
            <div className="text-[11px] text-text-muted font-medium mb-2 uppercase tracking-wide">
              책 구조
            </div>

            {/* 본문 카드 = 업로드 영역 (단일 책 모드 디폴트) */}
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
              className={`mb-3 px-3 py-3 rounded-[8px] cursor-pointer transition-colors border-[1.5px] ${
                dragOver
                  ? "border-accent border-solid bg-accent-light"
                  : uploadedFile
                    ? "border-accent border-solid bg-accent-light"
                    : "border-dashed border-border hover:border-accent hover:bg-bg-hover"
              }`}
            >
              {uploadedFile ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px]">📄</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold text-accent">업로드됨</div>
                      <div className="text-[10px] text-text-secondary truncate">{uploadedFile.name}</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-text-muted mt-2">변환 연결 전</div>
                </>
              ) : (
                <div className="text-center py-2">
                  <div className="text-[18px] mb-1">📥</div>
                  <div className="text-[12px] font-semibold text-text-primary">HWP 올리기</div>
                  <div className="text-[10px] text-text-muted mt-1 leading-snug">
                    본문 파일을 여기에<br />놓거나 클릭
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

            {/* 챕터 추가 (다음 결정 후 박음 — 지금은 안내) */}
            <button
              type="button"
              onClick={() => alert("챕터 추가 UI는 다음 결정 후 박힙니다.")}
              className="w-full px-3 py-2 rounded-[6px] text-[11px] text-text-muted border border-dashed border-border hover:border-accent hover:text-accent transition-colors"
            >
              + 챕터 추가 (준비 중)
            </button>
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
            <div>A4 · 시험지 v0.3</div>
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
              style={{ aspectRatio: "220 / 300" }}
            />
          </div>

          {/* 하단: 페이지 네비 + 다운로드 */}
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
