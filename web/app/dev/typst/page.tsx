"use client";

// D1~D4 PoC — typst.ts 브라우저 컴파일 + 노토 세리프 CJK KR + 신국판 Classic 검증.
// S1-4부터 lib/typst/compiler 추상화를 통해 호출 (typst.ts 직접 import 금지).

import { useEffect, useRef, useState } from "react";
import { compileSvg } from "@/lib/typst/compiler";

type State =
  | { kind: "idle" }
  | { kind: "loading"; phase: string }
  | { kind: "ok"; svg: string; elapsedMs: number }
  | { kind: "error"; message: string };

const SAMPLES = {
  hello: `#set page(width: 80mm, height: 30mm, margin: 6mm)
#set text(font: ("Noto Serif CJK KR", "Noto Serif KR"), size: 12pt, lang: "ko")

안녕하세요
`,
  classic: `// 신국판 Classic 미니 샘플 — 1 챕터, 한 단락
#set page(
  width: 152mm,
  height: 225mm,
  margin: (inside: 20mm, outside: 18mm, top: 22mm, bottom: 25mm),
)
#set text(
  font: ("Noto Serif CJK KR", "Noto Serif KR"),
  size: 10pt,
  lang: "ko",
  cjk-latin-spacing: auto,
)
#set par(
  leading: 8pt,
  spacing: 8pt,
  justify: true,
  first-line-indent: (amount: 1em, all: false),
)

#v(8em)
#align(center)[
  #text(weight: "bold", size: 14pt)[제 1 장]
]
#v(0.6em)
#align(center)[
  #text(weight: "bold", size: 18pt)[고양이가 사는 집]
]
#v(2em)

오래된 한옥 마당에는 늘 햇살이 비스듬히 들어왔다. 마루 끝에 앉아 있던 검은 고양이는 햇살을 따라 천천히 자리를 옮겼다. 마치 하루치의 빛을 따로따로 쪼개어 받아내려는 듯, 한 번에 다 받지 않고 조금씩 나누어 받았다.

처마 끝에서 떨어지는 빗방울 소리가 그쳤다. 비가 멎은 뒤에도 마당은 한참을 젖어 있었다. 흙냄새가 올라왔고, 그 냄새 속에서 고양이는 익숙한 자세로 잠이 들었다. 누구도 깨우지 않았다. 깨울 일도 없었다.
`,
};

type SampleKey = keyof typeof SAMPLES;

export default function TypstSandboxPage() {
  const [sampleKey, setSampleKey] = useState<SampleKey>("hello");
  const [source, setSource] = useState<string>(SAMPLES.hello);
  const [state, setState] = useState<State>({ kind: "idle" });
  const svgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const t0 = performance.now();
      setState({ kind: "loading", phase: "컴파일 중" });

      try {
        const svg = await compileSvg(source);
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

  const pickSample = (key: SampleKey) => {
    setSampleKey(key);
    setSource(SAMPLES[key]);
  };

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 900 }}>
      <h1 style={{ fontSize: 20, fontWeight: 600 }}>typst.ts PoC (D1~D4)</h1>
      <p style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
        브라우저 Typst 컴파일 + 노토 세리프 CJK KR 슬림 폰트 + 신국판 Classic 검증.
      </p>

      <section style={{ marginTop: 16 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {(Object.keys(SAMPLES) as SampleKey[]).map((k) => (
            <button
              key={k}
              onClick={() => pickSample(k)}
              style={{
                padding: "6px 12px",
                fontSize: 13,
                border: "1px solid",
                borderColor: sampleKey === k ? "#222" : "#ccc",
                background: sampleKey === k ? "#222" : "#fff",
                color: sampleKey === k ? "#fff" : "#222",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              {k === "hello" ? "안녕 (소형)" : "신국판 Classic 미니"}
            </button>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 16 }}>
        <label style={{ fontSize: 12, color: "#666" }}>입력 (.typ)</label>
        <textarea
          value={source}
          onChange={(e) => setSource(e.target.value)}
          rows={14}
          style={{
            width: "100%",
            fontFamily: "monospace",
            fontSize: 12,
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
            background: "#f4f4f3",
            minHeight: 120,
          }}
        />
      </section>
    </main>
  );
}
