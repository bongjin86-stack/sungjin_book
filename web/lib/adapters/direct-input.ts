// 직접 입력 폼 어댑터 — v0.
//
// D-022 첫 어댑터. 학원선생이 폼에 직접 친 데이터를 EduBook 표준 JSON으로 변환.
// 파일 파서 의존성 0 — 어댑터 패턴 검증용 가장 싼 입력.
//
// v0 범위: 챕터 1개 = part-cover + passages(지문 1개 + 문제 1개) 2개 EduBook chapter.
// 라벨 없으면 part-cover 생략. 지문/발문 없으면 passages 비어있음.

import type { Chapter } from "@/lib/schema/edu-book";

export interface ChapterFormData {
  /** 챕터 라벨. 비어있으면 part-cover 생략. */
  label: string;
  subtitle: string;
  passageBody: string;
  questionStem: string;
  /** 5개. 비어있는 칸은 자동 제거. */
  choices: [string, string, string, string, string];
  /** 0~4. 정답 인덱스. v0에선 미사용 (answer-key 챕터 별도 박을 때 사용). */
  correctIndex: number;
}

const GLYPHS = ["①", "②", "③", "④", "⑤"] as const;

/** 폼 데이터 → EduBook chapters[] 일부 (part-cover + passages 묶음). */
export function formToChapters(form: ChapterFormData): Chapter[] {
  const chapters: Chapter[] = [];

  // part-cover (라벨 있을 때만)
  const label = form.label.trim();
  if (label) {
    chapters.push({
      type: "part-cover",
      label,
      subtitle: form.subtitle.trim(),
    });
  }

  // passages 챕터 (지문 또는 발문 있을 때만)
  const passageBody = form.passageBody.trim();
  const questionStem = form.questionStem.trim();
  if (passageBody || questionStem) {
    const passages = passageBody
      ? [{
          id: "p-direct-1",
          range: null,
          header: "",
          body: passageBody,
          layout_mode: "default" as const,
        }]
      : [];

    const questions = questionStem
      ? [{
          number: 1,
          passage_id: passageBody ? "p-direct-1" : null,
          stem: questionStem,
          score: null,
          choices: form.choices
            .map((text, i) => ({
              index: (i + 1) as 1 | 2 | 3 | 4 | 5,
              glyph: GLYPHS[i],
              text: text.trim(),
              has_placeholder: false,
            }))
            .filter((c) => c.text.length > 0),
          stem_has_placeholder: false,
          any_choice_has_placeholder: false,
        }]
      : [];

    chapters.push({
      type: "passages",
      passages,
      questions,
    });
  }

  return chapters;
}

export function makeEmptyForm(label = "PART 1"): ChapterFormData {
  return {
    label,
    subtitle: "",
    passageBody: "",
    questionStem: "",
    choices: ["", "", "", "", ""],
    correctIndex: 0,
  };
}
