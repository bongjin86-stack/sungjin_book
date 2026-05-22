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

export const ChoiceSchema = z.object({
  index: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  glyph: z.enum(["①", "②", "③", "④", "⑤"]),
  text: z.string(),
  has_placeholder: z.boolean().default(false),
});
export type Choice = z.infer<typeof ChoiceSchema>;

export const PassageGroupSchema = z.object({
  /** 등장 순서대로 부여한 ID. 예: "passage-01". 묶음 번호 충돌 회피용. */
  id: z.string(),
  range: z.tuple([z.number().int(), z.number().int()]).nullable(),
  header: z.string().default(""),
  body: z.string(),
});
export type PassageGroup = z.infer<typeof PassageGroupSchema>;

export const QuestionSchema = z.object({
  number: z.number().int(),
  /** 묶음 지문 ID. 독립 문항이면 null. */
  passage_id: z.string().nullable(),
  stem: z.string(),
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

// ── 책 한 권 ────────────────────────────────────────────────────────────
export const EduBookSchema = z.object({
  meta: MetaSchema,
  /** preset 디렉토리명. 예: "simply-classic", "gonggam-rates". */
  preset: z.string().min(1),
  options: OptionsSchema.default({ size: "A4" }),
  /** 단일 책도 chapters 1개로 표현. 빈 배열 금지. */
  chapters: z.array(ChapterSchema).min(1),
});
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
