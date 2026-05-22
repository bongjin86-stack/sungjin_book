// 교재 책 한 권 = 콘텐츠 JSON 스키마.
//
// 절대 원칙
//   1) preset 무관 — 같은 책 JSON을 어떤 preset(simply-classic, 학원형A, …)에 흘려도
//      식자 가능해야 한다. 디자인 결정은 preset이 한다.
//   2) chapters[] 필수 — 단일 책도 chapters 1개로 표현 (일관성).
//   3) 챕터 라벨/부제는 항상 폼 권위 — HWP 안에 있어도 무시한다.
//      (입력 형식 결정 2026-05-22: chapter type 정의는 사용자가 직접)
//
// chapter type 최소 3개 (확장은 type 추가만 하면 됨):
//   part-cover  — 간지(챕터 표지). preset의 챕터 master로 그려짐.
//   passages    — 지문 + 문제 묶음 본문.
//   answer-key  — 빠른 정답 페이지.
//
// 런타임 검증을 같은 정의에서 자동 — HWP 변환 결과 / 폼 입력 / typst 입력 전 검증.

import { z } from "zod";

// ── meta ───────────────────────────────────────────────────────────────
export const MetaSchema = z.object({
  title: z.string().min(1),
  author: z.string().default(""),
  subject: z.string().default(""),
  /** PDF 다운에 박을 워터마크 텍스트(학원명·이메일 등). */
  watermark: z.string().default(""),
});
export type Meta = z.infer<typeof MetaSchema>;

// ── options (preset이 지원하는 범위) ─────────────────────────────────────
export const OptionsSchema = z.object({
  /** preset이 지원해야 동작. 현재 simply-classic은 "A4" 지원. */
  size: z.enum(["A4", "신국판"]).default("A4"),
});
export type BookOptions = z.infer<typeof OptionsSchema>;

// ── 문제/지문 (기존 edu-import/v0 키 그대로) ─────────────────────────────
//   has_placeholder는 표/그림이 본문에 끼었음을 표시 (실제 placeholder kind는 텍스트 안 마커).

export const InlineMarkSchema = z.enum(["strong", "underline"]);
export const InlineRunSchema = z.object({
  text: z.string(),
  marks: z.array(InlineMarkSchema).default([]),
});
export const RichParagraphSchema = z.array(InlineRunSchema);
export const RichTextSchema = z.array(RichParagraphSchema);
export type InlineMark = z.infer<typeof InlineMarkSchema>;
export type InlineRun = z.infer<typeof InlineRunSchema>;
export type RichText = z.infer<typeof RichTextSchema>;

export const PassageLayoutModeSchema = z.enum([
  "default",
  "question-split",
  "memo",
  "wide",
]);
export type PassageLayoutMode = z.infer<typeof PassageLayoutModeSchema>;

export const ChoiceSchema = z.object({
  index: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  glyph: z.enum(["①", "②", "③", "④", "⑤"]),
  text: z.string(),
  text_rich: RichTextSchema.optional(),
  has_placeholder: z.boolean().default(false),
});
export type Choice = z.infer<typeof ChoiceSchema>;

export const PassageGroupSchema = z.object({
  /** 등장 순서대로 부여한 ID. 예: "passage-01". 묶음 번호 충돌 회피용. */
  id: z.string(),
  range: z.tuple([z.number().int(), z.number().int()]).nullable(),
  header: z.string().default(""),
  body: z.string(),
  body_rich: RichTextSchema.optional(),
  layout_mode: PassageLayoutModeSchema.default("default"),
});
export type PassageGroup = z.infer<typeof PassageGroupSchema>;

export const QuestionSchema = z.object({
  number: z.number().int(),
  /** 묶음 지문 ID. 독립 문항이면 null. */
  passage_id: z.string().nullable(),
  stem: z.string(),
  stem_rich: RichTextSchema.optional(),
  /** [3점] 표기에서 추출. 없으면 null (= 평가원 기본 2점). */
  score: z.number().int().nullable().default(null),
  choices: z.array(ChoiceSchema).default([]),
  stem_has_placeholder: z.boolean().default(false),
  any_choice_has_placeholder: z.boolean().default(false),
});
export type Question = z.infer<typeof QuestionSchema>;

// ── chapter (type별 polymorphic) ───────────────────────────────────────
export const PartCoverChapterSchema = z.object({
  type: z.literal("part-cover"),
  /** 챕터 라벨. 예: "PART 1" / "1회" / "단원 1". 항상 폼에서 직접 입력. */
  label: z.string().min(1),
  subtitle: z.string().default(""),
});

export const PassagesChapterSchema = z.object({
  type: z.literal("passages"),
  passages: z.array(PassageGroupSchema).default([]),
  questions: z.array(QuestionSchema).default([]),
});

export const AnswerKeyChapterSchema = z.object({
  type: z.literal("answer-key"),
  /** 문항 번호 → 정답 글리프 매핑. 예: { 1: "②", 2: "④" } */
  answers: z.record(z.string(), z.string()).default({}),
});

export const ChapterSchema = z.discriminatedUnion("type", [
  PartCoverChapterSchema,
  PassagesChapterSchema,
  AnswerKeyChapterSchema,
]);
export type Chapter = z.infer<typeof ChapterSchema>;

// ── 내부 조판자용 Block (preset manifest와 1:1) ─────────────────────────────
//
// chapters[]는 typst 렌더용 정규 표현. blocks[]는 내부 조판자가 UI에서 다루는
// 단위. UI는 blocks[]를 권위로, 렌더 직전에 blocks→chapters로 normalize.
//
// 4가지 kind (toc는 manifest에만 있고 1차 UI에선 disabled):
//   part-cover   — PART N + 부제 (간지)
//   passage      — 한 지문 (range, header, body)
//   questions    — 그에 딸린 문제 묶음 (passage_id로 연결)
//   quick-answer — 빠른 정답 표

export const PartCoverBlockSchema = z.object({
  kind: z.literal("part-cover"),
  id: z.string(),
  label: z.string().min(1),
  subtitle: z.string().default(""),
});

export const PassageBlockSchema = z.object({
  kind: z.literal("passage"),
  id: z.string(),
  range: z.tuple([z.number().int(), z.number().int()]).nullable().default(null),
  header: z.string().default(""),
  body: z.string().default(""),
});

export const QuestionsBlockSchema = z.object({
  kind: z.literal("questions"),
  id: z.string(),
  passage_id: z.string().nullable().default(null),
  questions: z.array(QuestionSchema).default([]),
});

export const QuickAnswerBlockSchema = z.object({
  kind: z.literal("quick-answer"),
  id: z.string(),
  /** "1": "②" 형식. */
  answers: z.record(z.string(), z.string()).default({}),
});

export const BlockSchema = z.discriminatedUnion("kind", [
  PartCoverBlockSchema,
  PassageBlockSchema,
  QuestionsBlockSchema,
  QuickAnswerBlockSchema,
]);
export type Block = z.infer<typeof BlockSchema>;
export type PartCoverBlock = z.infer<typeof PartCoverBlockSchema>;
export type PassageBlock = z.infer<typeof PassageBlockSchema>;
export type QuestionsBlock = z.infer<typeof QuestionsBlockSchema>;
export type QuickAnswerBlock = z.infer<typeof QuickAnswerBlockSchema>;

// ── 책 한 권 ────────────────────────────────────────────────────────────
//
// blocks[]가 있으면 UI/조판자용 권위. 없으면 chapters[]만 사용 (옛 데이터).
// 렌더 직전에 blocks → chapters로 normalize (lib/adapters/blocks-to-chapters.ts).
export const EduBookSchema = z.object({
  meta: MetaSchema,
  /** preset 디렉토리명. 예: "simply-classic", "gonggam-rates". */
  preset: z.string().min(1),
  options: OptionsSchema.default({ size: "A4" }),
  /** 내부 조판자가 UI에서 다루는 블록 단위. 우선순위 권위. */
  blocks: z.array(BlockSchema).optional(),
  /** typst 렌더용 정규 표현. blocks가 있으면 무시 가능 (normalize 결과로 대체). */
  chapters: z.array(ChapterSchema).optional(),
}).refine(
  (book) => (book.blocks?.length ?? 0) > 0 || (book.chapters?.length ?? 0) > 0,
  { message: "EduBook requires at least one block or chapter." },
);
export type EduBook = z.infer<typeof EduBookSchema>;

// ── 도우미 ─────────────────────────────────────────────────────────────
/** unknown JSON → 검증된 EduBook. 실패 시 throw. UI/API 경계에서 사용. */
export function parseEduBook(value: unknown): EduBook {
  return EduBookSchema.parse(value);
}

/** 단일 책 사용자가 chapters 안 만들었을 때 1개 wrapping 헬퍼. */
export function wrapSingleBook(args: {
  meta: Meta;
  preset: string;
  options?: BookOptions;
  passages?: PassageGroup[];
  questions?: Question[];
}): EduBook {
  return EduBookSchema.parse({
    meta: args.meta,
    preset: args.preset,
    options: args.options ?? { size: "A4" },
    chapters: [{
      type: "passages",
      passages: args.passages ?? [],
      questions: args.questions ?? [],
    }],
  });
}
