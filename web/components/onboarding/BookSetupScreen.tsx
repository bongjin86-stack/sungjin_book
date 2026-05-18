"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { showToast } from "@/components/ui/Toast";
import { BOOK_STORAGE_KEY } from "@/hooks/useBookStore";
import {
  TRIM_SIZES,
  createEmptyBook,
  type BookType,
  type TrimSize,
} from "@/types/book";

const BOOK_TYPES: { id: BookType; icon: string; name: string; desc: string; ready: boolean }[] = [
  { id: "chapter", icon: "📚", name: "챕터가 있는 책", desc: "소설, 에세이집 등", ready: true },
  { id: "continuous", icon: "📄", name: "통으로 된 책", desc: "강의자료, 단행본 등", ready: false },
];

export function BookSetupScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [author, setAuthor] = useState("");
  const [publisher, setPublisher] = useState("");
  const [trim, setTrim] = useState<TrimSize>("신국판");
  const [bookType] = useState<BookType>("chapter");

  function handleSubmit() {
    const book = createEmptyBook({
      title: title.trim() || "제목 없음",
      subtitle: subtitle.trim() || undefined,
      author: author.trim() || "저자 미상",
      publisher: publisher.trim() || undefined,
      trim,
      bookType,
    });
    window.localStorage.setItem(BOOK_STORAGE_KEY, JSON.stringify(book));
    router.push("/editor");
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-[linear-gradient(135deg,#0F172A_0%,#1E3A5F_50%,#0F172A_100%)]">
      <div className="flex gap-12 items-start max-w-[900px] w-full">
        {/* Left brand */}
        <div className="flex-[0_0_260px] pt-2">
          <div className="text-[28px] font-extrabold text-white tracking-[-0.5px] mb-[10px]">
            성진<span className="text-[#60A5FA]">북스</span>
          </div>
          <div className="text-[14px] text-[#94A3B8] leading-[1.7] mb-7">
            원고를 넣으면<br />인쇄 가능한 책이 됩니다.
          </div>
          <div className="flex flex-col gap-[10px]">
            {[
              { icon: "✦", strong: "자동 조판", desc: "한국어 출판 규격 자동 적용" },
              { icon: "👁", strong: "실시간 미리보기", desc: "쓰면서 바로 확인" },
              { icon: "⬇", strong: "즉시 PDF 생성", desc: "인쇄소 바로 전달 가능" },
            ].map((f) => (
              <div key={f.strong} className="flex items-center gap-[10px]">
                <div className="w-8 h-8 rounded-[8px] bg-white/10 flex items-center justify-center text-[15px] flex-shrink-0">
                  {f.icon}
                </div>
                <div className="text-[13px] text-[#CBD5E1] leading-[1.4]">
                  <strong className="text-[#E2E8F0] font-semibold">{f.strong}</strong>
                  <br />
                  {f.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right form */}
        <div className="flex-1 bg-white rounded-[20px] p-9 px-8 shadow-[0_24px_64px_rgba(0,0,0,0.3)]">
          <div className="text-[20px] font-bold text-text-primary mb-1">새 책 만들기</div>
          <div className="text-[13px] text-text-secondary mb-7">
            기본 정보를 입력하면 바로 시작할 수 있습니다.
          </div>

          <Field label="책 제목" required>
            <Input value={title} onChange={setTitle} placeholder="예: 태평천하" />
          </Field>
          <Field label="부제목" hint="(선택)">
            <Input value={subtitle} onChange={setSubtitle} placeholder="예: 채만식 장편소설" />
          </Field>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <Field label="저자" required>
              <Input value={author} onChange={setAuthor} placeholder="예: 채만식" />
            </Field>
            <Field label="출판사">
              <Input value={publisher} onChange={setPublisher} placeholder="예: 성진북스" />
            </Field>
          </div>

          <Field label="판형">
            <div className="grid grid-cols-3 gap-2">
              {TRIM_SIZES.map((t) => {
                const selected = trim === t.name;
                return (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => setTrim(t.name)}
                    className={`p-[10px_8px] rounded-[8px] border-[1.5px] text-center transition-all ${
                      selected
                        ? "border-accent bg-accent-light"
                        : "border-border bg-bg hover:border-accent"
                    }`}
                  >
                    <div
                      className={`text-[13px] font-semibold ${
                        selected ? "text-accent" : "text-text-primary"
                      }`}
                    >
                      {t.name}
                    </div>
                    <div className="text-[11px] text-text-muted mt-[2px]">{t.size}</div>
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="책 유형">
            <div className="grid grid-cols-2 gap-2">
              {BOOK_TYPES.map((bt) => {
                const selected = bookType === bt.id && bt.ready;
                return (
                  <button
                    key={bt.id}
                    type="button"
                    onClick={() => {
                      if (!bt.ready) {
                        showToast("준비 중입니다.");
                      }
                    }}
                    className={`p-[12px_14px] rounded-[8px] border-[1.5px] text-left transition-all flex items-center gap-[10px] ${
                      selected
                        ? "border-accent bg-accent-light"
                        : "border-border bg-bg hover:border-accent"
                    }`}
                  >
                    <div className="text-[20px]">{bt.icon}</div>
                    <div>
                      <div
                        className={`text-[13px] font-semibold ${
                          selected ? "text-accent" : "text-text-primary"
                        }`}
                      >
                        {bt.name}
                        {!bt.ready && (
                          <span className="text-[10px] bg-border text-text-muted px-[6px] py-[1px] rounded-[8px] ml-1">
                            준비 중
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-text-muted mt-[2px]">{bt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="h-px bg-border my-5" />
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full p-[13px] rounded bg-accent text-white text-[15px] font-bold tracking-[-0.2px] transition-all hover:bg-accent-hover hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(28,78,216,0.3)] active:translate-y-0"
          >
            시작하기 →
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-[0.6px] mb-[5px]">
        {label}
        {required && <span className="text-[#E53E3E] ml-1">*</span>}
        {hint && (
          <span className="text-text-muted font-normal normal-case tracking-normal ml-1">
            {hint}
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

function Input({
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
      className="w-full px-[13px] py-[10px] rounded-[8px] border-[1.5px] border-border bg-bg text-[14px] text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent focus:bg-white"
    />
  );
}
