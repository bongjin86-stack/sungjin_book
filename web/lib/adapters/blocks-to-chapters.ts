// 내부 조판자 UI의 blocks[] → typst 렌더용 chapters[] normalize.
//
// 규칙:
//   - part-cover  → part-cover chapter
//   - passage     → 직전 passages chapter에 passages 추가 (없으면 새로 시작)
//   - questions   → 직전 passages chapter에 questions 추가 (없으면 새로 시작)
//   - quick-answer → 직전 passages chapter 닫고 answer-key chapter 시작
//
// passages chapter는 연속된 passage/questions block을 한 chapter로 묶는다.
// 그래서 동일 chapter 안에 여러 지문 묶음과 여러 문제 묶음이 자연 흐름.

import type {
  Block,
  Chapter,
  PassageGroup,
  Question,
} from "@/lib/schema/edu-book";

type PassagesChapter = {
  type: "passages";
  passages: PassageGroup[];
  questions: Question[];
};

export function blocksToChapters(blocks: Block[]): Chapter[] {
  const chapters: Chapter[] = [];
  let cur: PassagesChapter | null = null;

  const flush = () => {
    if (cur) {
      chapters.push(cur);
      cur = null;
    }
  };

  for (const b of blocks) {
    switch (b.kind) {
      case "part-cover":
        flush();
        chapters.push({
          type: "part-cover",
          label: b.label,
          subtitle: b.subtitle,
        });
        break;

      case "passage":
        if (!cur) cur = { type: "passages", passages: [], questions: [] };
        cur.passages.push({
          id: b.id,
          range: b.range,
          header: b.header,
          body: b.body,
          layout_mode: "default",
        });
        break;

      case "questions":
        if (!cur) cur = { type: "passages", passages: [], questions: [] };
        for (const q of b.questions) {
          cur.questions.push({
            ...q,
            // block의 passage_id가 있으면 우선 (없으면 q 자체의 passage_id 유지)
            passage_id: b.passage_id ?? q.passage_id ?? null,
          });
        }
        break;

      case "quick-answer":
        flush();
        chapters.push({
          type: "answer-key",
          answers: b.answers,
        });
        break;
    }
  }
  flush();

  // chapters가 비면 안 됨 — 최소 빈 passages 박음 (typst가 안전하게 빈 페이지)
  if (chapters.length === 0) {
    chapters.push({ type: "passages", passages: [], questions: [] });
  }
  return chapters;
}

/** unique block id 생성 — Date.now() + 짧은 random. */
export function newBlockId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}
