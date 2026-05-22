"use client";

// 챕터 직접 입력 폼 모달 — v0.
// 가장 가벼운 단순 모달. mantine/dialog 의존성 없이 fixed div + backdrop.

import { useEffect, useState } from "react";
import {
  type ChapterFormData,
  makeEmptyForm,
} from "@/lib/adapters/direct-input";

interface Props {
  /** null이면 닫힘. 값이면 열림 + 초기값. */
  initial: ChapterFormData | null;
  onSave: (form: ChapterFormData) => void;
  onClose: () => void;
}

export function ChapterFormModal({ initial, onSave, onClose }: Props) {
  const [form, setForm] = useState<ChapterFormData>(makeEmptyForm());

  useEffect(() => {
    if (initial) setForm(initial);
  }, [initial]);

  if (!initial) return null;

  function update<K extends keyof ChapterFormData>(key: K, value: ChapterFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateChoice(idx: number, value: string) {
    setForm((f) => {
      const choices = [...f.choices] as ChapterFormData["choices"];
      choices[idx] = value;
      return { ...f, choices };
    });
  }

  const canSave = form.label.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[14px] shadow-[0_24px_64px_rgba(0,0,0,0.3)] w-full max-w-[640px] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="text-[16px] font-bold text-text-primary">챕터 추가</div>
          <button
            type="button"
            onClick={onClose}
            className="text-[18px] text-text-muted hover:text-text-primary"
            aria-label="닫기"
          >
            ✕
          </button>
        </header>

        <div className="px-6 py-5 flex flex-col gap-4">
          {/* 라벨 + 부제 */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="챕터 라벨" required>
              <input
                type="text"
                value={form.label}
                onChange={(e) => update("label", e.target.value)}
                placeholder="PART 1"
                className="w-full px-3 py-2 rounded-[6px] border-[1.5px] border-border bg-bg text-[13px] outline-none focus:border-accent focus:bg-white"
              />
            </Field>
            <Field label="부제 (선택)">
              <input
                type="text"
                value={form.subtitle}
                onChange={(e) => update("subtitle", e.target.value)}
                placeholder="프롤로그"
                className="w-full px-3 py-2 rounded-[6px] border-[1.5px] border-border bg-bg text-[13px] outline-none focus:border-accent focus:bg-white"
              />
            </Field>
          </div>

          {/* 지문 */}
          <Field label="지문 본문 (선택)">
            <textarea
              value={form.passageBody}
              onChange={(e) => update("passageBody", e.target.value)}
              placeholder="다음 글을 읽고 물음에 답하시오..."
              rows={5}
              className="w-full px-3 py-2 rounded-[6px] border-[1.5px] border-border bg-bg text-[13px] outline-none focus:border-accent focus:bg-white font-serif resize-y"
            />
          </Field>

          {/* 발문 */}
          <Field label="문제 발문 (선택)">
            <textarea
              value={form.questionStem}
              onChange={(e) => update("questionStem", e.target.value)}
              placeholder="윗글에 대한 설명으로 가장 적절한 것은?"
              rows={2}
              className="w-full px-3 py-2 rounded-[6px] border-[1.5px] border-border bg-bg text-[13px] outline-none focus:border-accent focus:bg-white resize-y"
            />
          </Field>

          {/* 선지 5개 + 정답 */}
          <Field label="선지 (각 5개. 정답 라디오 선택)">
            <div className="flex flex-col gap-2">
              {form.choices.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="correct"
                      checked={form.correctIndex === i}
                      onChange={() => update("correctIndex", i)}
                      className="accent-accent"
                    />
                    <span className="text-[13px] font-semibold text-text-primary w-5 text-center">
                      {"①②③④⑤"[i]}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={c}
                    onChange={(e) => updateChoice(i, e.target.value)}
                    placeholder={`선지 ${i + 1}`}
                    className="flex-1 px-3 py-1.5 rounded-[6px] border-[1.5px] border-border bg-bg text-[13px] outline-none focus:border-accent focus:bg-white"
                  />
                </div>
              ))}
            </div>
          </Field>
        </div>

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
            onClick={() => {
              if (canSave) onSave(form);
            }}
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
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.5px] mb-1.5">
        {label}
        {required && <span className="text-[#E53E3E] ml-1">*</span>}
      </div>
      {children}
    </label>
  );
}
