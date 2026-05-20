#!/usr/bin/env python
# 평가원 국어 양식.hwp의 pyhwp 추출본을 문항 단위 JSON으로 쪼갠다.
# 본앱 코드와 단절된 실험 — 본 단계의 산출물은 question.ts 스키마 설계의 입력 자료.
#
# 입력: out/국어_pyhwp.txt
# 출력: out/korean-questions.json + 콘솔 통계
#
# 알고리즘: 줄 단위 상태 머신
#   상태: INIT | PASSAGE_BODY | Q_STEM | Q_CHOICE
#   - 묶음 헤더(`[N~M] ...`) 진입 → PASSAGE_BODY (이전 문항 flush)
#   - 문항 헤더(`^N.`) 진입 → Q_STEM (이전 보기/문항 flush)
#   - 보기 헤더(`^①~⑤`) 진입 → Q_CHOICE
#   - 이외 텍스트는 현재 상태의 누적 버퍼에 합쳐 join

from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INPUT = ROOT / "out" / "국어_pyhwp.txt"
OUTPUT = ROOT / "out" / "korean-questions.json"

PASSAGE_HEAD = re.compile(r"^\[(\d+)\s*[~～]\s*(\d+)\]\s*(.*)$")
Q_HEAD = re.compile(r"^(\d{1,3})\.\s*(.*)$")
CHOICE_HEAD = re.compile(r"^([①-⑤])(.*)$")
SCORE_TAG = re.compile(r"\[(\d+)\s*점\]")
PLACEHOLDER = re.compile(r"<(그림|표)>")
CHOICE_INDEX = {"①": 1, "②": 2, "③": 3, "④": 4, "⑤": 5}


def main() -> int:
    text = INPUT.read_text(encoding="utf-8")
    lines = text.split("\n")

    passages: list[dict] = []
    questions: list[dict] = []
    notes: list[str] = []

    current_passage: dict | None = None
    current_q: dict | None = None
    current_choice: dict | None = None
    mode = "INIT"

    def flush_choice():
        nonlocal current_choice
        if current_choice and current_q is not None:
            current_choice["text"] = " ".join(current_choice["_buf"]).strip()
            del current_choice["_buf"]
            current_q["choices"].append(current_choice)
        current_choice = None

    def flush_question():
        nonlocal current_q
        flush_choice()
        if current_q is not None:
            current_q["stem"] = " ".join(current_q["_stem_buf"]).strip()
            del current_q["_stem_buf"]
            mscore = SCORE_TAG.search(current_q["stem"])
            if mscore:
                current_q["score"] = int(mscore.group(1))
                current_q["stem"] = SCORE_TAG.sub("", current_q["stem"]).strip()
            questions.append(current_q)
        current_q = None

    for raw in lines:
        line = raw.rstrip("\r")
        stripped = line.strip()
        if not stripped:
            # 빈 줄 — 보기/발문 토큰 경계로만 작동
            continue

        m_pass = PASSAGE_HEAD.match(stripped)
        if m_pass:
            flush_question()
            start, end = int(m_pass.group(1)), int(m_pass.group(2))
            current_passage = {
                "id": f"passage-{len(passages) + 1:02d}",
                "range": [start, end],
                "header": m_pass.group(3) or "다음 글을 읽고 물음에 답하시오.",
                "_body_buf": [],
            }
            passages.append(current_passage)
            mode = "PASSAGE_BODY"
            continue

        m_q = Q_HEAD.match(stripped)
        if m_q:
            flush_question()
            number = int(m_q.group(1))
            head_rest = m_q.group(2)
            current_q = {
                "number": number,
                "passage_id": current_passage["id"] if current_passage else None,
                "stem": "",
                "score": None,
                "choices": [],
                "stem_has_placeholder": False,
                "any_choice_has_placeholder": False,
                "_stem_buf": [],
            }
            if head_rest:
                current_q["_stem_buf"].append(head_rest)
                if PLACEHOLDER.search(head_rest):
                    current_q["stem_has_placeholder"] = True
            mode = "Q_STEM"
            continue

        m_choice = CHOICE_HEAD.match(stripped)
        if m_choice and current_q is not None:
            flush_choice()
            glyph = m_choice.group(1)
            body = m_choice.group(2)
            current_choice = {
                "index": CHOICE_INDEX[glyph],
                "glyph": glyph,
                "text": "",
                "has_placeholder": False,
                "_buf": [body] if body else [],
            }
            if body and PLACEHOLDER.search(body):
                current_choice["has_placeholder"] = True
                current_q["any_choice_has_placeholder"] = True
            mode = "Q_CHOICE"
            continue

        # 본문 누적
        if mode == "PASSAGE_BODY" and current_passage is not None:
            current_passage["_body_buf"].append(stripped)
        elif mode == "Q_STEM" and current_q is not None:
            current_q["_stem_buf"].append(stripped)
            if PLACEHOLDER.search(stripped):
                current_q["stem_has_placeholder"] = True
        elif mode == "Q_CHOICE" and current_choice is not None:
            current_choice["_buf"].append(stripped)
            if PLACEHOLDER.search(stripped):
                current_choice["has_placeholder"] = True
                if current_q is not None:
                    current_q["any_choice_has_placeholder"] = True
        else:
            # 어느 컨텍스트도 아닐 때(헤더 이전 잡줄) — 첫 묶음 전의 <그림>/<표> placeholder가 여기 떨어짐
            pass

    flush_question()

    # passage body 정리
    for p in passages:
        p["body"] = "\n".join(p["_body_buf"]).strip()
        del p["_body_buf"]

    # 검증 노트
    for q in questions:
        if len(q["choices"]) != 5:
            notes.append(
                f"문항 {q['number']} (passage={q['passage_id']}): 보기 {len(q['choices'])}개"
            )
        # 보기 글리프 순서 무결성
        glyphs_seq = [c["glyph"] for c in q["choices"]]
        if glyphs_seq and glyphs_seq != ["①", "②", "③", "④", "⑤"][: len(glyphs_seq)]:
            notes.append(f"문항 {q['number']}: 보기 글리프 순서 깨짐 {glyphs_seq}")
        if not q["stem"] and not q["choices"]:
            notes.append(f"문항 {q['number']}: 본문 비어있음")

    out = {
        "source": "experiments/edu-import/out/국어_pyhwp.txt (평가원 국어 양식.hwp via hwp5txt)",
        "extracted_at": datetime.now(timezone.utc).isoformat(),
        "schema": "edu-import/v0",
        "passages": passages,
        "questions": questions,
        "stats": {
            "passage_count": len(passages),
            "question_count": len(questions),
            "questions_with_5_choices": sum(1 for q in questions if len(q["choices"]) == 5),
            "questions_with_score": sum(1 for q in questions if q["score"] is not None),
            "questions_with_stem_placeholder": sum(1 for q in questions if q["stem_has_placeholder"]),
            "questions_with_choice_placeholder": sum(
                1 for q in questions if q["any_choice_has_placeholder"]
            ),
            "questions_without_passage": sum(1 for q in questions if not q["passage_id"]),
        },
        "warnings": notes,
    }
    OUTPUT.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")

    s = out["stats"]
    print(f"[split-korean] 입력: {INPUT.name} ({INPUT.stat().st_size} bytes)")
    print(f"[split-korean] 출력: {OUTPUT.relative_to(ROOT)}")
    print(f"[split-korean] 묶음 {s['passage_count']}개")
    print(f"[split-korean] 문항 {s['question_count']}개 (예상 56)")
    print(
        f"[split-korean] 보기 5개 완전: {s['questions_with_5_choices']}/{s['question_count']}"
    )
    print(f"[split-korean] 3점 문항: {s['questions_with_score']}")
    print(f"[split-korean] 발문에 <그림>/<표> 포함: {s['questions_with_stem_placeholder']}")
    print(f"[split-korean] 보기에 <그림>/<표> 포함: {s['questions_with_choice_placeholder']}")
    print(f"[split-korean] 묶음 미부착(passage_id=null): {s['questions_without_passage']}")

    if notes:
        print(f"[split-korean] 경고 {len(notes)}건:")
        for n in notes[:20]:
            print(f"  - {n}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
