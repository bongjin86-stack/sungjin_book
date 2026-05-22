// HWP 변환 결과(평탄 passages + questions) → blocks[] 어댑터.
//
// 입력: experiments/edu-import/v0 스키마 (korean-questions.json 형태)
//   { schema: "edu-import/v0", passages: [...], questions: [...] }
//
// 출력 blocks[]:
//   1) part-cover (옵션)
//   2) 각 passage → passage block + 그 passage에 묶인 questions block
//   3) 독립 문항(passage_id null) → 끝에 한 묶음 questions block
//   4) quick-answer (옵션 — answers 있을 때만)
//
// 핵심 결정:
//   - passage block.id = HWP passage.id 그대로 (예: "passage-01"). deterministic.
//     blocks-to-chapters.ts가 b.id를 chapter 안 passage.id로 그대로 박는다.
//   - questions block.passage_id = 해당 passage.id. block 안 question.passage_id는
//     normalize 단계에서 block.passage_id로 덮어쓰기 됨 (의도).
//   - layout_mode / body_rich / stem_rich 같은 식자용 메타는 HWP에 없으므로 기본값.
//     사용자가 UI에서 덧입힌다.
//
// 검증: blocks → chapters normalize 결과가 기존 build-edu-book-sample.py 산물과
// 핵심 필드 (passages, questions 배열) 동일해야 한다.
//
// 참고: blocks-to-chapters.ts (역방향), direct-input.ts (다른 입력 어댑터).

import type {
  Block,
  PartCoverBlock,
  PassageBlock,
  QuestionsBlock,
  QuickAnswerBlock,
  Question,
  PassageGroup,
} from "@/lib/schema/edu-book";

/** HWP 추출기 v0 스키마 (passages + questions 평탄). */
export interface HwpExport {
  schema?: string;
  source?: string;
  passages: Array<{
    id: string;
    range: [number, number] | null;
    header: string;
    body: string;
    layout_mode?: PassageGroup["layout_mode"];
    body_rich?: PassageGroup["body_rich"];
  }>;
  questions: Array<{
    number: number;
    passage_id: string | null;
    stem: string;
    score?: number | null;
    choices?: Question["choices"];
    stem_has_placeholder?: boolean;
    any_choice_has_placeholder?: boolean;
    stem_rich?: Question["stem_rich"];
  }>;
}

export interface HwpToBlocksOptions {
  /** PART 라벨. 비어있으면 part-cover block 생략. */
  partLabel?: string;
  partSubtitle?: string;
  /** 빠른 정답 표. 키는 문항 번호(string), 값은 글리프. 없으면 quick-answer 생략. */
  answers?: Record<string, string>;
}

/** HWP 변환 결과 → blocks[] 초안. */
export function hwpToBlocks(hwp: HwpExport, options: HwpToBlocksOptions = {}): Block[] {
  const blocks: Block[] = [];

  // 1) part-cover
  const label = options.partLabel?.trim();
  if (label) {
    const pc: PartCoverBlock = {
      kind: "part-cover",
      id: "pc-1",
      label,
      subtitle: (options.partSubtitle ?? "").trim(),
    };
    blocks.push(pc);
  }

  // 2) passage_id → questions 묶음 인덱스
  const byPassage = new Map<string, Question[]>();
  const orphans: Question[] = [];
  for (const raw of hwp.questions) {
    const q: Question = {
      number: raw.number,
      passage_id: raw.passage_id,
      stem: raw.stem,
      stem_rich: raw.stem_rich,
      score: raw.score ?? null,
      choices: raw.choices ?? [],
      stem_has_placeholder: raw.stem_has_placeholder ?? false,
      any_choice_has_placeholder: raw.any_choice_has_placeholder ?? false,
    };
    if (q.passage_id) {
      const arr = byPassage.get(q.passage_id) ?? [];
      arr.push(q);
      byPassage.set(q.passage_id, arr);
    } else {
      orphans.push(q);
    }
  }

  // 3) 각 passage → passage block + 그에 묶인 questions block
  for (const p of hwp.passages) {
    const pb: PassageBlock = {
      kind: "passage",
      id: p.id,
      range: p.range,
      header: p.header ?? "",
      body: p.body ?? "",
      body_rich: p.body_rich,
      layout_mode: p.layout_mode ?? "default",
    };
    blocks.push(pb);

    const qs = byPassage.get(p.id);
    if (qs && qs.length > 0) {
      const qb: QuestionsBlock = {
        kind: "questions",
        id: `q-${p.id}`,
        passage_id: p.id,
        questions: qs,
      };
      blocks.push(qb);
      byPassage.delete(p.id);
    }
  }

  // 4) passage가 없는데 passage_id를 단 questions (예: HWP에서 passage 누락) — orphan으로 합침
  for (const [pid, qs] of byPassage) {
    orphans.push(...qs);
    void pid;
  }

  // 5) 독립 문항 묶음
  if (orphans.length > 0) {
    const qb: QuestionsBlock = {
      kind: "questions",
      id: "q-standalone",
      passage_id: null,
      questions: orphans,
    };
    blocks.push(qb);
  }

  // 6) quick-answer
  if (options.answers && Object.keys(options.answers).length > 0) {
    const qa: QuickAnswerBlock = {
      kind: "quick-answer",
      id: "qa-1",
      answers: options.answers,
    };
    blocks.push(qa);
  }

  return blocks;
}
