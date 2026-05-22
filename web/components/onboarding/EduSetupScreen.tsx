"use client";
import { useState } from "react";

// Edu100 진입 화면 — 단행본 BookSetupScreen 패턴 차용 (좌 브랜드 + 우 패널, 1단계).
// 입력: 교재 제목, 저자. 사이즈는 A4 고정.
//
// 2026-05-22: 종목 칩 제거 (사용자 결정 — 종목은 표시 필요 X).

export interface EduProjectSetup {
  title: string;
  author: string;
  size: "A4";
}

const BENEFITS = [
  { icon: "📄", label: "한글 → PDF 자동 식자", sub: "STS 룰 기반" },
  { icon: "🎨", label: "디자인 한 번 박으면", sub: "어떤 콘텐츠든 적용" },
  { icon: "📚", label: "챕터별 누적 가능", sub: "학기 단위 모음" },
  { icon: "🖨", label: "A4 PDF 다운로드", sub: "바로 인쇄·배포" },
];

export function EduSetupScreen({ onStart }: { onStart: (setup: EduProjectSetup) => void }) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");

  function handleStart() {
    if (!title.trim()) return;
    onStart({
      title: title.trim(),
      author: author.trim(),
      size: "A4",
    });
  }

  const canStart = title.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-[linear-gradient(135deg,#0F172A_0%,#1E3A5F_50%,#0F172A_100%)]">
      <div className="flex gap-12 items-start max-w-[900px] w-full">
        {/* 좌측 브랜드 */}
        <div className="flex-[0_0_260px] pt-2">
          <div className="text-[28px] font-extrabold text-white tracking-[-0.5px] mb-[10px]">
            성진<span className="text-[#60A5FA]">북스</span>{" "}
            <span className="text-[#94A3B8] text-[20px] font-bold">Edu100</span>
          </div>
          <div className="text-[14px] text-[#94A3B8] leading-[1.7] mb-5">
            한글 파일을 넣으면<br />학원 교재 PDF가 됩니다.
          </div>

          <div className="flex flex-col gap-[6px] mb-6">
            {BENEFITS.map((b) => (
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
          <div className="text-[10px] font-bold text-[#475569] uppercase tracking-[0.7px] mb-3">진행</div>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-[#60A5FA] text-white flex items-center justify-center text-[12px] font-bold">1</div>
            <span className="text-[13px] text-white font-semibold">교재 정보 입력</span>
          </div>
        </div>

        {/* 우측 패널 */}
        <div className="flex-1 bg-white rounded-[20px] p-9 px-8 shadow-[0_24px_64px_rgba(0,0,0,0.3)]">
          <div className="text-[20px] font-bold text-text-primary mb-1">새 교재 만들기</div>
          <div className="text-[13px] text-text-secondary mb-7">
            제목을 입력하면 바로 작업할 수 있습니다.
          </div>

          {/* 제목 */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-[0.6px] mb-[5px]">
              교재 제목 <span className="text-[#E53E3E] ml-1">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 2027 공감연구소 모의평가 국어"
              className="w-full px-[13px] py-[10px] rounded-[8px] border-[1.5px] border-border bg-bg text-[14px] text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent focus:bg-white"
            />
          </div>

          {/* 저자 */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-[0.6px] mb-[5px]">
              저자 / 출판사 <span className="text-text-muted font-normal normal-case tracking-normal ml-1">(선택)</span>
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="예: 성진북스"
              className="w-full px-[13px] py-[10px] rounded-[8px] border-[1.5px] border-border bg-bg text-[14px] text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent focus:bg-white"
            />
          </div>

          {/* 사이즈 (고정) */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-[0.6px] mb-[5px]">
              사이즈
            </label>
            <div className="inline-flex items-center gap-2 px-[13px] py-[10px] rounded-[8px] border-[1.5px] border-border bg-bg">
              <span className="text-[14px] font-semibold text-text-primary">A4</span>
              <span className="text-[12px] text-text-muted">210 × 297 mm</span>
            </div>
          </div>

          <div className="h-px bg-border my-5" />
          <button
            type="button"
            onClick={handleStart}
            disabled={!canStart}
            className={`w-full p-[13px] rounded text-[15px] font-bold tracking-[-0.2px] transition-all ${
              canStart
                ? "bg-accent text-white hover:bg-accent-hover hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(28,78,216,0.3)] active:translate-y-0"
                : "bg-bg text-text-muted cursor-not-allowed"
            }`}
          >
            시작하기 →
          </button>
        </div>
      </div>
    </div>
  );
}
