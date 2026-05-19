"use client";

// D1 PoC — typst.ts 브라우저 컴파일 동작 검증.
// "안녕하세요" 한 줄을 Typst로 컴파일 → SVG 출력.

import { useEffect, useRef, useState } from "react";

type State =
  | { kind: "idle" }
  | { kind: "loading"; phase: string }
  | { kind: "ok"; svg: string; elapsedMs: number }
  | { kind: "error"; message: string };

const DEFAULT_SOURCE = `#set page(width: 80mm, height: 30mm, margin: 6mm)
#set text(font: "Linux Libertine", size: 12pt)

안녕하세요
`;

export default function TypstSandboxPage() {
  const [source, setSource] = useState<string>(DEFAULT_SOURCE);
  const [state, setState] = useState<State>({ kind: "idle" });
  const svgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const t0 = performance.now();
      setState({ kind: "loading", phase: "typst.ts 로딩 중" });

      try {
        const { $typst } = await import("@myriaddreamin/typst.ts");
        if (cancelled) return;

        setState({ kind: "loading", phase: "컴파일 중" });
        const svg = await $typst.svg({ mainContent: source });
        if (cancelled) return;

        const elapsedMs = Math.round(performance.now() - t0);
        setState({ kind: "ok", svg, elapsedMs });
      } catch (e) {
        if (cancelled) return;
        setState({
          kind: "error",
          message: e instanceof Error ? e.message : String(e),
        });
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [source]);

  useEffect(() => {
    if (state.kind === "ok" && svgRef.current) {
      svgRef.current.innerHTML = state.svg;
    }
  }, [state]);

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 900 }}>
      <h1 style={{ fontSize: 20, fontWeight: 600 }}>typst.ts D1 PoC</h1>
      <p style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
        브라우저에서 Typst를 직접 컴파일해 SVG로 렌더한다. 첫 로딩은 WASM 다운로드 때문에 길다.
      </p>

      <section style={{ marginTop: 20 }}>
        <label style={{ fontSize: 12, color: "#666" }}>입력 (.typ)</label>
        <textarea
          value={source}
          onChange={(e) => setSource(e.target.value)}
          rows={8}
          style={{
            width: "100%",
            fontFamily: "monospace",
            fontSize: 13,
            padding: 10,
            border: "1px solid #ddd",
            borderRadius: 4,
            marginTop: 4,
          }}
        />
      </section>

      <section style={{ marginTop: 20 }}>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
          상태:{" "}
          {state.kind === "idle" && "대기"}
          {state.kind === "loading" && `${state.phase}…`}
          {state.kind === "ok" && `완료 (${state.elapsedMs}ms)`}
          {state.kind === "error" && `오류`}
        </div>

        {state.kind === "error" && (
          <pre
            style={{
              background: "#fee",
              border: "1px solid #fbb",
              borderRadius: 4,
              padding: 10,
              fontSize: 12,
              whiteSpace: "pre-wrap",
            }}
          >
            {state.message}
          </pre>
        )}

        <div
          ref={svgRef}
          style={{
            border: "1px solid #ddd",
            borderRadius: 4,
            padding: 16,
            background: "#fff",
            minHeight: 80,
          }}
        />
      </section>
    </main>
  );
}
