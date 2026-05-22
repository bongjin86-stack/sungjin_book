#!/usr/bin/env python
"""HWP 변환 결과(korean-questions.json) → EduBook 표준 JSON 샘플.

EduBook 스키마는 web/lib/schema/edu-book.ts와 1:1.
체인: HWP → 이 스크립트 → EduBook JSON → render-hwp-simply-classic.py → PDF.

샘플 선택 이유 (보고서에 박힘):
  - korean-questions.json
  - 14 passages / 56 questions
  - 보기 단어 포함 문제 12개, [3점] 표시 12개, 그림/표 placeholder 26개
  - 풍부한 케이스로 상품 완성도 검증에 적합

출력:
  experiments/idml-recon/hwp-simply-classic-sample.json
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
except AttributeError:
    pass

ROOT = Path(__file__).resolve().parent.parent.parent.parent
HWP_JSON = ROOT / "experiments" / "edu-import" / "out" / "korean-questions.json"
OUT_PATH = ROOT / "experiments" / "idml-recon" / "hwp-simply-classic-sample.json"

# 첫 N문제만 (3페이지 검증에 충분). 너무 많으면 PDF가 길어짐.
SAMPLE_QUESTION_COUNT = 9


def select_sample(hwp: dict, n_questions: int) -> tuple[list, list]:
    """첫 n_questions 문제 + 그에 연결된 passages만."""
    questions = hwp["questions"][:n_questions]
    used_pids = {q["passage_id"] for q in questions if q.get("passage_id")}
    passages = [p for p in hwp["passages"] if p["id"] in used_pids]
    return passages, questions


def _rich_paragraph(text: str) -> list[dict]:
    """데모용: 첫 구절은 굵게+밑줄, 나머지는 일반 run."""
    head = text[:18]
    tail = text[18:]
    runs = []
    if head:
        runs.append({"text": head, "marks": ["strong", "underline"]})
    if tail:
        runs.append({"text": tail, "marks": []})
    return runs


def add_demo_semantic_overrides(passages: list, questions: list) -> None:
    """블록 출력 모드 + 의미 강조가 Typst까지 관통하는지 보는 최소 샘플."""
    if passages:
        first = passages[0]
        body = first.get("body", "")
        first["layout_mode"] = "question-split"
        first["body_rich"] = [
            _rich_paragraph(para)
            for para in body.splitlines()
            if para.strip()
        ]

    if questions:
        q = questions[0]
        stem = q.get("stem", "")
        q["stem_rich"] = [[
            {"text": stem[:8], "marks": ["strong"]},
            {"text": stem[8:], "marks": []},
        ]]
        if q.get("choices"):
            choice = q["choices"][0]
            text = choice.get("text", "")
            choice["text_rich"] = [[
                {"text": text[:12], "marks": ["underline"]},
                {"text": text[12:], "marks": []},
            ]]


def main() -> int:
    if not HWP_JSON.exists():
        print(f"[err] HWP JSON 없음: {HWP_JSON}", file=sys.stderr)
        return 1

    hwp = json.loads(HWP_JSON.read_text(encoding="utf-8"))
    passages, questions = select_sample(hwp, SAMPLE_QUESTION_COUNT)
    add_demo_semantic_overrides(passages, questions)

    edu_book = {
        "meta": {
            "title": "HWP 샘플 교재",
            "author": "성진북스",
            "subject": "국어",
            "watermark": "성진북스",
        },
        "preset": "simply-classic",
        "options": {
            "size": "A4",
        },
        "chapters": [
            {
                "type": "part-cover",
                "label": "PART 1",
                "subtitle": "HWP 변환 샘플",
            },
            {
                "type": "passages",
                "passages": passages,
                "questions": questions,
            },
        ],
    }

    # answer-key는 HWP 추출 결과에 정답 정보가 없어 생략.
    # 추후 정답 추출되면 다음 chapter로 추가.

    OUT_PATH.write_text(
        json.dumps(edu_book, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"[hwp] source: {hwp.get('source')}")
    print(f"[hwp] 전체 passages: {len(hwp['passages'])}, questions: {len(hwp['questions'])}")
    print(f"[sample] passages: {len(passages)}, questions: {len(questions)}")
    print(f"[out] → {OUT_PATH.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
