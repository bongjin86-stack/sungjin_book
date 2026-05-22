"use client";

// 내부 조판자용 블록 편집 모달.
//
// 4가지 kind:
//   part-cover    — label, subtitle
//   passage       — range, header, body (textarea)
//   questions     — passage_id 선택 + N개 문제 (number/stem/choices)
//   quick-answer  — 번호/정답 쌍 textarea ("1 ②\n2 ⑤\n...")
//
// 직접 복붙이 빠른 게 1차 목표. 짧은 폼 + textarea 중심.

import { useState } from "react";
import type {
  Block,
  PassageBlock,
  PartCoverBlock,
  QuestionsBlock,
  QuickAnswerBlock,
  Choice,
  Question,
} from "@/lib/schema/edu-book";
import { newBlockId } from "@/lib/adapters/blocks-to-chapters";

interface Props {
  // 모달 닫혀있으면 null. open 상태 = block kind + 초기값(편집) 또는 "new" sentinel(추가).
  open:
    | { kind: "part-cover"; initial: PartCoverBlock | null }
    | { kind: "passage"; initial: PassageBlock | null }
    | { kind: "questions"; initial: QuestionsBlock | null; passages: PassageBlock[] }
    | { kind: "quick-answer"; initial: QuickAnswerBlock | null }
    | null;
  onSave: (block: Block) => void;
  onClose: () => void;
}

const GLYPHS = ["①", "②", "③", "④", "⑤"] as const;

export function BlockEditModal({ open, onSave, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[14px] shadow-[0_24px_64px_rgba(0,0,0,0.3)] w-full max-w-[720px] max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {open.kind === "part-cover" && (
          <PartCoverForm initial={open.initial} onSave={onSave} onClose={onClose} />
        )}
        {open.kind === "passage" && (
          <PassageForm initial={open.initial} onSave={onSave} onClose={onClose} />
        )}
        {open.kind === "questions" && (
          <QuestionsForm
            initial={open.initial}
            passages={open.passages}
            onSave={onSave}
            onClose={onClose}
          />
        )}
        {open.kind === "quick-answer" && (
          <QuickAnswerForm initial={open.initial} onSave={onSave} onClose={onClose} />
        )}
      </div>
    </div>
  );
}

// ── PART ───────────────────────────────────────────────────────────────
function PartCoverForm({
  initial,
  onSave,
  onClose,
}: {
  initial: PartCoverBlock | null;
  onSave: (b: Block) => void;
  onClose: () => void;
}) {
  const [label, setLabel] = useState(initial?.label ?? "PART 1");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const canSave = label.trim().length > 0;
  return (
    <FormShell
      title={initial ? "PART 편집" : "PART 추가"}
      onClose={onClose}
      onSave={() =>
        onSave({
          kind: "part-cover",
          id: initial?.id ?? newBlockId("part"),
          label: label.trim(),
          subtitle: subtitle.trim(),
        })
      }
      canSave={canSave}
    >
      <Field label="라벨" required>
        <Text value={label} onChange={setLabel} placeholder="PART 1" />
      </Field>
      <Field label="부제 (선택)">
        <Text value={subtitle} onChange={setSubtitle} placeholder="프롤로그" />
      </Field>
    </FormShell>
  );
}

// ── 지문 ───────────────────────────────────────────────────────────────
function PassageForm({
  initial,
  onSave,
  onClose,
}: {
  initial: PassageBlock | null;
  onSave: (b: Block) => void;
  onClose: () => void;
}) {
  const [start, setStart] = useState(initial?.range?.[0]?.toString() ?? "");
  const [end, setEnd] = useState(initial?.range?.[1]?.toString() ?? "");
  const [header, setHeader] = useState(initial?.header ?? "다음 글을 읽고 물음에 답하시오.");
  const [body, setBody] = useState(initial?.body ?? "");
  const canSave = body.trim().length > 0;

  function parsedRange(): [number, number] | null {
    const a = parseInt(start, 10);
    const b = parseInt(end, 10);
    if (Number.isInteger(a) && Number.isInteger(b)) return [a, b];
    return null;
  }

  return (
    <FormShell
      title={initial ? "지문 편집" : "지문 추가"}
      onClose={onClose}
      onSave={() =>
        onSave({
          kind: "passage",
          id: initial?.id ?? newBlockId("p"),
          range: parsedRange(),
          header: header.trim(),
          body: body.trim(),
          layout_mode: initial?.layout_mode ?? "default",
        })
      }
      canSave={canSave}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="문항 범위 시작 (선택)">
          <Text value={start} onChange={setStart} placeholder="1" />
        </Field>
        <Field label="문항 범위 끝 (선택)">
          <Text value={end} onChange={setEnd} placeholder="3" />
        </Field>
      </div>
      <Field label="지문 머리 (선택)">
        <Text value={header} onChange={setHeader} placeholder="다음 글을 읽고 물음에 답하시오." />
      </Field>
      <Field label="지문 본문" required>
        <Textarea value={body} onChange={setBody} rows={10} placeholder="여기에 HWP 본문을 복사·붙여넣기..." serif />
      </Field>
    </FormShell>
  );
}

// ── 문제 묶음 ───────────────────────────────────────────────────────────
function QuestionsForm({
  initial,
  passages,
  onSave,
  onClose,
}: {
  initial: QuestionsBlock | null;
  passages: PassageBlock[];
  onSave: (b: Block) => void;
  onClose: () => void;
}) {
  const [passageId, setPassageId] = useState<string>(
    initial?.passage_id ?? passages.at(-1)?.id ?? "",
  );
  const [questions, setQuestions] = useState<Question[]>(
    initial?.questions ?? [emptyQuestion(1)],
  );

  function updateQ(idx: number, patch: Partial<Question>) {
    setQuestions((qs) => qs.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  }
  function updateChoice(qIdx: number, cIdx: number, text: string) {
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qIdx
          ? { ...q, choices: q.choices.map((c, j) => (j === cIdx ? { ...c, text } : c)) }
          : q,
      ),
    );
  }
  function addQuestion() {
    setQuestions((qs) => [...qs, emptyQuestion((qs.at(-1)?.number ?? 0) + 1)]);
  }
  function removeQuestion(idx: number) {
    setQuestions((qs) => (qs.length > 1 ? qs.filter((_, i) => i !== idx) : qs));
  }

  const canSave = questions.every((q) => q.stem.trim().length > 0);

  return (
    <FormShell
      title={initial ? "문제 편집" : "문제 추가"}
      onClose={onClose}
      onSave={() =>
        onSave({
          kind: "questions",
          id: initial?.id ?? newBlockId("qs"),
          passage_id: passageId || null,
          questions: questions.map((q) => ({
            ...q,
            stem: q.stem.trim(),
            choices: q.choices.map((c) => ({ ...c, text: c.text.trim() })),
            passage_id: passageId || null,
          })),
        })
      }
      canSave={canSave}
      wide
    >
      <Field label="연결 지문 (선택)">
        <select
          value={passageId}
          onChange={(e) => setPassageId(e.target.value)}
          className="w-full px-3 py-2 rounded-[6px] border-[1.5px] border-border bg-bg text-[13px] outline-none focus:border-accent"
        >
          <option value="">(독립 문제)</option>
          {passages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.range ? `[${p.range[0]}~${p.range[1]}] ` : ""}
              {p.header || p.body.slice(0, 30) || p.id}
            </option>
          ))}
        </select>
      </Field>

      {questions.map((q, idx) => (
        <div
          key={idx}
          className="border border-border rounded-[8px] p-3 mb-3 bg-bg/30"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.5px]">
              문제 #{idx + 1}
            </div>
            {questions.length > 1 && (
              <button
                type="button"
                onClick={() => removeQuestion(idx)}
                className="text-[11px] text-[#a00] hover:underline"
              >
                삭제
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Field label="번호" inline>
              <Text
                value={String(q.number)}
                onChange={(v) => updateQ(idx, { number: parseInt(v, 10) || 1 })}
                placeholder="1"
              />
            </Field>
          </div>
          <Field label="발문" inline required>
            <Textarea
              value={q.stem}
              onChange={(v) => updateQ(idx, { stem: v })}
              rows={2}
              placeholder="윗글의 내용과 일치하지 않는 것은?"
            />
          </Field>
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.5px] mt-2 mb-1">
            선지
          </div>
          {q.choices.map((c, cIdx) => (
            <div key={cIdx} className="flex items-center gap-2 mb-1">
              <span className="text-[13px] w-5 text-center">{GLYPHS[cIdx]}</span>
              <input
                type="text"
                value={c.text}
                onChange={(e) => updateChoice(idx, cIdx, e.target.value)}
                placeholder={`선지 ${cIdx + 1}`}
                className="flex-1 px-3 py-1.5 rounded-[6px] border-[1.5px] border-border bg-bg text-[13px] outline-none focus:border-accent focus:bg-white"
              />
            </div>
          ))}
        </div>
      ))}

      <button
        type="button"
        onClick={addQuestion}
        className="w-full py-2 rounded-[6px] text-[12px] text-text-secondary border border-dashed border-border hover:border-accent hover:text-accent transition-colors"
      >
        + 문제 한 개 더 추가
      </button>
    </FormShell>
  );
}

function emptyQuestion(number: number): Question {
  const choices: Choice[] = GLYPHS.map((glyph, i) => ({
    index: (i + 1) as 1 | 2 | 3 | 4 | 5,
    glyph,
    text: "",
    has_placeholder: false,
  }));
  return {
    number,
    passage_id: null,
    stem: "",
    score: null,
    choices,
    stem_has_placeholder: false,
    any_choice_has_placeholder: false,
  };
}

// ── 빠른 정답 ──────────────────────────────────────────────────────────
function QuickAnswerForm({
  initial,
  onSave,
  onClose,
}: {
  initial: QuickAnswerBlock | null;
  onSave: (b: Block) => void;
  onClose: () => void;
}) {
  const initialText = initial
    ? Object.entries(initial.answers)
        .sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10))
        .map(([n, g]) => `${n} ${g}`)
        .join("\n")
    : "1 ②\n2 ⑤\n3 ①";
  const [raw, setRaw] = useState(initialText);

  function parseAnswers(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      // "1 ②" / "1: ②" / "1, ②" 형식 허용
      const m = trimmed.match(/^(\d+)[.\s:,]+(.+)$/);
      if (m) out[m[1]] = m[2].trim();
    }
    return out;
  }

  const parsed = parseAnswers();
  const canSave = Object.keys(parsed).length > 0;

  return (
    <FormShell
      title={initial ? "빠른 정답 편집" : "빠른 정답 추가"}
      onClose={onClose}
      onSave={() =>
        onSave({
          kind: "quick-answer",
          id: initial?.id ?? newBlockId("ak"),
          answers: parsed,
        })
      }
      canSave={canSave}
    >
      <Field label="번호 정답 (한 줄에 하나)">
        <Textarea
          value={raw}
          onChange={setRaw}
          rows={10}
          placeholder={"1 ②\n2 ⑤\n3 ①"}
        />
      </Field>
      <div className="text-[11px] text-text-muted mt-1">
        파싱 결과: {Object.keys(parsed).length}개 · 예: {" "}
        {Object.entries(parsed)
          .slice(0, 3)
          .map(([n, g]) => `${n}=${g}`)
          .join(", ")}
      </div>
    </FormShell>
  );
}

// ── 공통 ───────────────────────────────────────────────────────────────
function FormShell({
  title,
  onClose,
  onSave,
  canSave,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  onSave: () => void;
  canSave: boolean;
  children: React.ReactNode;
  wide?: boolean;
}) {
  // wide는 추후 modal 폭 조절용 hook (현재 max-w 720 고정).
  void wide;
  return (
    <>
      <header className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="text-[16px] font-bold text-text-primary">{title}</div>
        <button
          type="button"
          onClick={onClose}
          className="text-[18px] text-text-muted hover:text-text-primary"
          aria-label="닫기"
        >
          ✕
        </button>
      </header>
      <div className="px-6 py-5 flex flex-col gap-3">{children}</div>
      <footer className="px-6 py-4 border-t border-border flex items-center justify-end gap-2 bg-bg/30">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-[13px] text-text-secondary hover:text-text-primary"
        >
          취소
        </button>
        <button
          type="button"
          onClick={() => canSave && onSave()}
          disabled={!canSave}
          className={`px-5 py-2 rounded-[6px] text-[13px] font-semibold transition-all ${
            canSave
              ? "bg-accent text-white hover:opacity-90"
              : "bg-bg text-text-muted cursor-not-allowed"
          }`}
        >
          저장
        </button>
      </footer>
    </>
  );
}

function Field({
  label,
  required,
  inline,
  children,
}: {
  label: string;
  required?: boolean;
  inline?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={inline ? "block mb-2" : "block"}>
      <div className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.5px] mb-1.5">
        {label}
        {required && <span className="text-[#E53E3E] ml-1">*</span>}
      </div>
      {children}
    </label>
  );
}

function Text({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-[6px] border-[1.5px] border-border bg-bg text-[13px] outline-none focus:border-accent focus:bg-white"
    />
  );
}

function Textarea({
  value,
  onChange,
  rows,
  placeholder,
  serif,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  serif?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows ?? 4}
      className={`w-full px-3 py-2 rounded-[6px] border-[1.5px] border-border bg-bg text-[13px] outline-none focus:border-accent focus:bg-white resize-y ${
        serif ? "font-serif" : ""
      }`}
    />
  );
}
