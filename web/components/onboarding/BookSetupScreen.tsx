"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { showToast } from "@/components/ui/Toast";
import { BOOK_STORAGE_KEY } from "@/hooks/useBookStore";
import {
  BLOCK_META,
  THEME_PRESETS,
  TRIM_SIZES,
  createEmptyBook,
  type BlockType,
  type BookBlock,
  type BookTheme,
  type MatterBlock,
  type TrimSize,
  type BookType,
} from "@/types/book";

// ─── 온보딩 구성 요소 정의 ────────────────────────────────────────────────────
const FRONT_MATTER_OPTIONS: { type: BlockType; label: string; desc: string; defaultChecked: boolean }[] = [
  { type: "half-title",  label: "속표지",       desc: "본문 앞 제목 페이지",  defaultChecked: true  },
  { type: "copyright",   label: "판권지",       desc: "저작권·발행 정보",     defaultChecked: true  },
  { type: "toc",         label: "목차",         desc: "챕터 목록 자동 생성",  defaultChecked: true  },
  { type: "preface",     label: "서문 / 머리말", desc: "저자의 글",           defaultChecked: false },
  { type: "dedication",  label: "헌정사",       desc: "누군가에게 바치는 글", defaultChecked: false },
  { type: "prologue",    label: "프롤로그",     desc: "본문 시작 전 이야기",  defaultChecked: false },
  { type: "blurb",       label: "추천사",       desc: "추천인의 글",          defaultChecked: false },
];
const BACK_MATTER_OPTIONS: { type: BlockType; label: string; desc: string; defaultChecked: boolean }[] = [
  { type: "author-bio",      label: "저자 소개", desc: "저자 프로필",       defaultChecked: true  },
  { type: "epilogue",        label: "에필로그",  desc: "본문 이후 이야기",  defaultChecked: false },
  { type: "acknowledgments", label: "감사의 글", desc: "도움을 준 분들께",  defaultChecked: false },
  { type: "bibliography",    label: "참고문헌",  desc: "인용 및 참고 자료", defaultChecked: false },
];
const THEMES: { id: BookTheme; name: string; desc: string }[] = [
  { id: "classic", name: "클래식",  desc: "명조체 · 들여쓰기 · 전통적인 한국 단행본 스타일" },
  { id: "modern",  name: "모던",    desc: "고딕체 · 넓은 줄간격 · 현대적인 느낌"            },
  { id: "minimal", name: "미니멀", desc: "명조체 · 쪽번호 없음 · 간결하고 절제된 디자인"    },
];

function newId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────
export function BookSetupScreen() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 상태
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [author, setAuthor] = useState("");
  const [publisher, setPublisher] = useState("");
  const [trim, setTrim] = useState<TrimSize>("신국판");
  const bookType: BookType = "chapter";

  // Step 2 상태
  const [selectedFront, setSelectedFront] = useState<BlockType[]>(
    FRONT_MATTER_OPTIONS.filter((o) => o.defaultChecked).map((o) => o.type)
  );
  const [selectedBack, setSelectedBack] = useState<BlockType[]>(
    BACK_MATTER_OPTIONS.filter((o) => o.defaultChecked).map((o) => o.type)
  );

  // Step 3 상태
  const [theme, setTheme] = useState<BookTheme>("classic");

  function toggleFront(type: BlockType) {
    setSelectedFront((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }
  function toggleBack(type: BlockType) {
    setSelectedBack((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  function handleStep1Next() {
    if (!title.trim()) { showToast("책 제목을 입력해주세요."); return; }
    if (!author.trim()) { showToast("저자명을 입력해주세요."); return; }
    setStep(2);
  }

  function handleFinish() {
    const blocks: BookBlock[] = [];
    const frontOrder: BlockType[] = ["half-title", "copyright", "toc", "preface", "dedication", "prologue", "blurb"];
    for (const type of frontOrder) {
      if (selectedFront.includes(type)) {
        blocks.push({
          id: newId(),
          type: type as MatterBlock["type"],
          title: BLOCK_META[type].defaultTitle,
          isSystem: type === "half-title" || type === "copyright" || type === "toc",
        });
      }
    }
    blocks.push({
      id: newId(),
      type: "chapter",
      chapterNum: "제1장",
      title: "",
      subtitle: "",
      body: "",
      charCount: 0,
      includeInToc: true,
      tocTitle: "",
      showChapterNumber: true,
      createdAt: Date.now(),
    });
    const backOrder: BlockType[] = ["epilogue", "acknowledgments", "author-bio", "bibliography"];
    for (const type of backOrder) {
      if (selectedBack.includes(type)) {
        blocks.push({ id: newId(), type: type as MatterBlock["type"], title: BLOCK_META[type].defaultTitle });
      }
    }
    const themePreset = THEME_PRESETS[theme];
    const book = createEmptyBook(
      { title: title.trim() || "제목 없음", subtitle: subtitle.trim() || undefined, author: author.trim() || "저자 미상", publisher: publisher.trim() || undefined, trim, bookType, options: { theme, ...themePreset } },
      blocks
    );
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
          <div className="text-[14px] text-[#94A3B8] leading-[1.7] mb-5">
            원고를 넣으면<br />인쇄 가능한 책이 됩니다.
          </div>

          {/* 서비스 혜택 배지 */}
          <div className="flex flex-col gap-[6px] mb-6">
            {[
              { icon: "✦", label: "무료로 책 만들기",     sub: "조판·편집 비용 없음" },
              { icon: "📋", label: "ISBN 무료 등록",       sub: "국립중앙도서관 신청 지원" },
              { icon: "📱", label: "전자책 무료 전송",     sub: "교보·리디·밀리 유통 연동" },
              { icon: "🖨", label: "인쇄소 직접 연결",     sub: "파일 → 인쇄 원스톱" },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-[10px] bg-white/5 rounded-[10px] px-3 py-[8px]">
                <div className="w-7 h-7 rounded-[7px] bg-white/10 flex items-center justify-center text-[13px] flex-shrink-0">{b.icon}</div>
                <div>
                  <div className="text-[12px] font-semibold text-[#E2E8F0]">{b.label}</div>
                  <div className="text-[10px] text-[#64748B] mt-[1px]">{b.sub}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="h-px bg-white/10 mb-5" />
          <div className="text-[10px] font-bold text-[#475569] uppercase tracking-[0.7px] mb-3">진행 단계</div>
          <div className="flex flex-col gap-3">
            {([{ n: 1, label: "기본 정보" }, { n: 2, label: "책 구성" }, { n: 3, label: "테마 선택" }] as const).map(({ n, label }) => (
              <div key={n} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 transition-all ${step === n ? "bg-[#60A5FA] text-white" : step > n ? "bg-[#22C55E] text-white" : "bg-white/10 text-[#64748B]"}`}>
                  {step > n ? "✓" : n}
                </div>
                <span className={`text-[13px] ${step === n ? "text-white font-semibold" : step > n ? "text-[#22C55E]" : "text-[#64748B]"}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 bg-white rounded-[20px] p-9 px-8 shadow-[0_24px_64px_rgba(0,0,0,0.3)]">
          {step === 1 && (
            <>
              <div className="text-[20px] font-bold text-text-primary mb-1">새 책 만들기</div>
              <div className="text-[13px] text-text-secondary mb-7">기본 정보를 입력하면 바로 시작할 수 있습니다.</div>
              <Field label="책 제목" required><Input value={title} onChange={setTitle} placeholder="예: 태평천하" /></Field>
              <Field label="부제목" hint="(선택)"><Input value={subtitle} onChange={setSubtitle} placeholder="예: 채만식 장편소설" /></Field>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Field label="저자" required><Input value={author} onChange={setAuthor} placeholder="예: 채만식" /></Field>
                <Field label="출판사"><Input value={publisher} onChange={setPublisher} placeholder="예: 성진북스" /></Field>
              </div>
              <Field label="판형">
                <div className="grid grid-cols-3 gap-2">
                  {TRIM_SIZES.map((t) => {
                    const selected = trim === t.name;
                    return (
                      <button key={t.name} type="button" onClick={() => setTrim(t.name)} className={`p-[10px_8px] rounded-[8px] border-[1.5px] text-center transition-all ${selected ? "border-accent bg-accent-light" : "border-border bg-bg hover:border-accent"}`}>
                        <div className={`text-[13px] font-semibold ${selected ? "text-accent" : "text-text-primary"}`}>{t.name}</div>
                        <div className="text-[11px] text-text-muted mt-[2px]">{t.size}</div>
                      </button>
                    );
                  })}
                </div>
              </Field>
              <div className="h-px bg-border my-5" />
              <button type="button" onClick={handleStep1Next} className="w-full p-[13px] rounded bg-accent text-white text-[15px] font-bold tracking-[-0.2px] transition-all hover:bg-accent-hover hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(28,78,216,0.3)] active:translate-y-0">다음 →</button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="text-[20px] font-bold text-text-primary mb-1">책 구성 선택</div>
              <div className="text-[13px] text-text-secondary mb-6">책에 포함할 요소를 선택하세요. 나중에 에디터에서도 추가·삭제할 수 있습니다.</div>
              <div className="mb-5">
                <div className="text-[11px] font-bold text-text-muted uppercase tracking-[0.7px] mb-3">앞부분 (Front Matter)</div>
                <div className="flex flex-col gap-[6px]">
                  {FRONT_MATTER_OPTIONS.map((opt) => (
                    <CheckItem key={String(opt.type)} label={opt.label} desc={opt.desc} checked={selectedFront.includes(opt.type)} onChange={() => toggleFront(opt.type)} />
                  ))}
                </div>
              </div>
              <div className="mb-6">
                <div className="text-[11px] font-bold text-text-muted uppercase tracking-[0.7px] mb-3">뒷부분 (Back Matter)</div>
                <div className="flex flex-col gap-[6px]">
                  {BACK_MATTER_OPTIONS.map((opt) => (
                    <CheckItem key={String(opt.type)} label={opt.label} desc={opt.desc} checked={selectedBack.includes(opt.type)} onChange={() => toggleBack(opt.type)} />
                  ))}
                </div>
              </div>
              <div className="h-px bg-border mb-5" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="flex-[0_0_auto] px-5 py-[13px] rounded border-[1.5px] border-border bg-bg text-[14px] text-text-secondary font-semibold transition-all hover:border-accent hover:text-accent">← 이전</button>
                <button type="button" onClick={() => setStep(3)} className="flex-1 p-[13px] rounded bg-accent text-white text-[15px] font-bold tracking-[-0.2px] transition-all hover:bg-accent-hover hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(28,78,216,0.3)] active:translate-y-0">다음 →</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="text-[20px] font-bold text-text-primary mb-1">테마 선택</div>
              <div className="text-[13px] text-text-secondary mb-6">책의 전체 분위기를 결정합니다. 에디터에서 언제든지 바꿀 수 있습니다.</div>
              <div className="flex flex-col gap-3 mb-6">
                {THEMES.map((t) => {
                  const selected = theme === t.id;
                  return (
                    <button key={t.id} type="button" onClick={() => setTheme(t.id)} className={`flex items-center gap-4 p-4 rounded-[10px] border-[1.5px] text-left transition-all ${selected ? "border-accent bg-accent-light" : "border-border bg-bg hover:border-accent"}`}>
                      <div className="flex-shrink-0 w-[52px] h-[68px] rounded-[4px] border border-border bg-white flex flex-col items-center justify-center gap-[4px] shadow-sm">
                        <div className="w-[36px] h-[3px] bg-gray-800 rounded-full" />
                        <div className="w-[28px] h-[2px] bg-gray-400 rounded-full" />
                        <div className="w-[36px] h-[1.5px] bg-gray-200 rounded-full mt-1" />
                        <div className="w-[36px] h-[1.5px] bg-gray-200 rounded-full" />
                        <div className="w-[30px] h-[1.5px] bg-gray-200 rounded-full" />
                      </div>
                      <div className="flex-1">
                        <div className={`text-[15px] font-bold mb-[3px] ${selected ? "text-accent" : "text-text-primary"}`}>{t.name}</div>
                        <div className="text-[12px] text-text-muted leading-[1.5]">{t.desc}</div>
                      </div>
                      {selected && <div className="flex-shrink-0 w-5 h-5 rounded-full bg-accent flex items-center justify-center text-white text-[11px] font-bold">✓</div>}
                    </button>
                  );
                })}
              </div>
              <div className="h-px bg-border mb-5" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)} className="flex-[0_0_auto] px-5 py-[13px] rounded border-[1.5px] border-border bg-bg text-[14px] text-text-secondary font-semibold transition-all hover:border-accent hover:text-accent">← 이전</button>
                <button type="button" onClick={handleFinish} className="flex-1 p-[13px] rounded bg-accent text-white text-[15px] font-bold tracking-[-0.2px] transition-all hover:bg-accent-hover hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(28,78,216,0.3)] active:translate-y-0">시작하기 →</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 공통 UI 컴포넌트 ─────────────────────────────────────────────────────────
function CheckItem({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-3 p-[10px_12px] rounded-[8px] border-[1.5px] cursor-pointer transition-all border-border bg-bg hover:border-accent">
      <input type="checkbox" checked={checked} onChange={onChange} className="w-4 h-4 rounded accent-accent flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-[13px] font-semibold text-text-primary">{label}</span>
        <span className="text-[11px] text-text-muted ml-2">{desc}</span>
      </div>
    </label>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-[0.6px] mb-[5px]">
        {label}
        {required && <span className="text-[#E53E3E] ml-1">*</span>}
        {hint && <span className="text-text-muted font-normal normal-case tracking-normal ml-1">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full px-[13px] py-[10px] rounded-[8px] border-[1.5px] border-border bg-bg text-[14px] text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent focus:bg-white" />
  );
}
