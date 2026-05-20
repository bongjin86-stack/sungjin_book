"use client";

// /edu — 교재(시험지) 트랙 MVP.
// 평가원형 추출 JSON을 v0.3 템플릿으로 컴파일해 미리보기 + PDF 다운로드.
// 단행본 /editor와 같은 typst.ts 인프라를 공유. 풀 에디터 없음 — 좁은 흐름.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  compileTestPaperSvg,
  compileTestPaperPdf,
} from "@/lib/typst/compiler";

interface Subject {
  id: string;
  label: string;
  src?: string;
  available: boolean;
}

const SUBJECTS: Subject[] = [
  { id: "korean", label: "국어", src: "/dev/edu/korean.json", available: true },
  { id: "english", label: "영어", available: false },
  { id: "math", label: "수학", available: false },
  { id: "social", label: "사회탐구", available: false },
  { id: "science", label: "과학탐구", available: false },
];

interface RawTestPaper {
  source?: string;
  extracted_at?: string;
  schema?: string;
  passages: unknown[];
  questions: unknown[];
}

/**
 * 추출 raw JSON에 meta를 덧입힌다.
 * raw: { source, extracted_at, schema, passages, questions }
 * v0.3 template는 data.meta.subject를 읽음.
 */
function withMeta(raw: RawTestPaper, subject: Subject) {
  return {
    meta: {
      source: raw.source,
      extracted_at: raw.extracted_at,
      schema: raw.schema,
      subject: subject.label,
    },
    passages: raw.passages,
    questions: raw.questions,
  };
}

type State =
  | { kind: "idle" }
  | { kind: "loading"; phase: string }
  | { kind: "ok"; svg: string; elapsedMs: number }
  | { kind: "error"; message: string };

export default function EduPage() {
  const [subjectId, setSubjectId] = useState<string>("korean");
  const [state, setState] = useState<State>({ kind: "idle" });
  const [pageIdx, setPageIdx] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const svgHostRef = useRef<HTMLDivElement>(null);

  const subject = useMemo(
    () => SUBJECTS.find((s) => s.id === subjectId) ?? SUBJECTS[0],
    [subjectId],
  );

  // 종목 변경 → JSON 로드 → 컴파일
  useEffect(() => {
    if (!subject.available || !subject.src) {
      setState({ kind: "error", message: `${subject.label}은 아직 준비 중입니다.` });
      return;
    }
    let cancelled = false;
    (async () => {
      const t0 = performance.now();
      setState({ kind: "loading", phase: "데이터 로드 중" });
      try {
        const res = await fetch(subject.src!);
        if (!res.ok) throw new Error(`데이터 로드 실패 (${res.status})`);
        const raw = await res.json();
        const data = withMeta(raw, subject);
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
  }, [subject]);

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
    if (!subject.available || !subject.src) return;
    setDownloading(true);
    try {
      const res = await fetch(subject.src);
      if (!res.ok) throw new Error(`데이터 로드 실패 (${res.status})`);
      const raw = await res.json();
      const data = withMeta(raw, subject);
      const pdf = await compileTestPaperPdf(data);
      const blob = new Blob([pdf as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `성진북스-${subject.label}-시험지.pdf`;
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

  return (
    <main className="min-h-screen flex flex-col bg-bg">
      {/* 헤더 */}
      <header className="h-12 px-5 flex items-center justify-between border-b border-border bg-surface">
        <div className="flex items-center gap-3">
          <a href="/" className="text-[13px] font-semibold text-text-primary hover:text-accent">
            성진북스
          </a>
          <span className="text-text-muted text-[11px]">·</span>
          <span className="text-[12px] text-text-secondary">교재</span>
        </div>
        <a
          href="/editor"
          className="text-[11px] text-text-muted hover:text-accent transition-colors"
        >
          단행본 모드 →
        </a>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* 좌측: 종목 선택 */}
        <aside className="w-[200px] border-r border-border bg-surface flex flex-col">
          <div className="p-4">
            <div className="text-[11px] text-text-muted font-medium mb-2 uppercase tracking-wide">
              종목
            </div>
            <div className="flex flex-col gap-1">
              {SUBJECTS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => s.available && setSubjectId(s.id)}
                  disabled={!s.available}
                  className={`text-left px-3 py-2 rounded-[6px] text-[12px] transition-colors ${
                    subjectId === s.id
                      ? "bg-accent text-white"
                      : s.available
                        ? "text-text-secondary hover:bg-bg-hover hover:text-accent"
                        : "text-text-muted/50 cursor-not-allowed"
                  }`}
                >
                  {s.label}
                  {!s.available && <span className="ml-2 text-[10px]">준비 중</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-auto p-4 text-[10px] text-text-muted leading-relaxed">
            평가원형 HWP에서 자동 추출된 시험지를
            <br />
            v0.3 템플릿으로 컴파일합니다.
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

          <div className="flex-1 min-h-0 flex items-center justify-center px-5 py-5 overflow-auto">
            <div
              ref={svgHostRef}
              className="bg-white shadow-md max-w-full max-h-full"
              style={{ aspectRatio: "210 / 297" }}
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
