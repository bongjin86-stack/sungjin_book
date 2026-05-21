"use client";

// 성진북스 첫 진입 화면 — 단행본 vs 교재 분기 카드.
// 정책 (project_track_pivot_2026_05): 교재 우선. 단행본은 동결 중.

import Link from "next/link";

export function HomeSelect() {
  return (
    <main className="min-h-screen flex flex-col bg-bg">
      {/* 상단 헤더 */}
      <header className="h-12 px-5 flex items-center border-b border-border bg-surface">
        <span className="text-[13px] font-semibold text-text-primary">
          성진북스
        </span>
        <span className="ml-3 text-[11px] text-text-muted">
          한국어 출판물 자동 조판
        </span>
      </header>

      {/* 중앙 분기 */}
      <section className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-[880px]">
          <div className="mb-10 text-center">
            <h1 className="text-[24px] font-semibold text-text-primary mb-2">
              어떤 책을 만드시나요?
            </h1>
            <p className="text-[13px] text-text-muted">
              한 번 고른 모드는 우측 상단 메뉴로 다시 바꿀 수 있습니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 교재 카드 (메인) */}
            <Link
              href="/edu"
              className="group block rounded-lg border border-accent bg-surface p-7 hover:shadow-md transition-shadow"
            >
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-[18px] font-semibold text-accent">
                  교재 / 문제집
                </h2>
                <span className="text-[10px] text-accent uppercase tracking-wide">
                  추천
                </span>
              </div>
              <p className="text-[13px] text-text-secondary leading-relaxed mb-5">
                평가원형 시험지·문제집·분석서를 자동으로 식자합니다.
                HWP를 넣으면 미리 박힌 인디자인 디자인 그대로 PDF로 떨어집니다.
              </p>
              <ul className="text-[12px] text-text-muted leading-loose space-y-0.5 mb-6">
                <li>· 국어 / 영어 / 수학 / 사회탐구 / 과학탐구</li>
                <li>· 인디자인 IDML 자동 흡수</li>
                <li>· 결정론적 식자 — AI 없음</li>
              </ul>
              <span className="inline-flex items-center text-[12px] font-semibold text-accent group-hover:translate-x-0.5 transition-transform">
                교재 모드로 시작 →
              </span>
            </Link>

            {/* 단행본 카드 (동결) */}
            <Link
              href="/book"
              className="group block rounded-lg border border-border bg-surface p-7 hover:shadow-md transition-shadow"
            >
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-[18px] font-semibold text-text-primary">
                  단행본 / 에세이
                </h2>
                <span className="text-[10px] text-text-muted uppercase tracking-wide">
                  베타
                </span>
              </div>
              <p className="text-[13px] text-text-secondary leading-relaxed mb-5">
                작가의 글을 한국 전통 단행본 스타일로 자동 식자합니다.
                신국판 클래식부터 시작. 부크크·교보 POD 입고 준비.
              </p>
              <ul className="text-[12px] text-text-muted leading-loose space-y-0.5 mb-6">
                <li>· 신국판 클래식 (명조체·들여쓰기)</li>
                <li>· 속표지·판권지·목차 자동</li>
                <li>· 일부 식자 동결 중 — 베타 단계</li>
              </ul>
              <span className="inline-flex items-center text-[12px] font-semibold text-text-secondary group-hover:translate-x-0.5 transition-transform">
                단행본 모드로 시작 →
              </span>
            </Link>
          </div>
        </div>
      </section>

      <footer className="h-10 px-5 flex items-center justify-end border-t border-border bg-surface">
        <span className="text-[10px] text-text-muted">
          성진북스 · 결정론적 한국어 조판
        </span>
      </footer>
    </main>
  );
}
