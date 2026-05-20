#!/usr/bin/env python
# 평가원 hwp5txt 텍스트를 문항 JSON으로 쪼개는 일반화된 분할기.
#
# 종목 차이 흡수:
#   - 국어: 묶음 헤더 `[N~M]` + 문항 `^N.` + 보기 줄 시작 `^[①-⑤]`
#   - 영어: 묶음 없음, 문항 `^N.`, 보기 ①~⑤가 한 줄 안에 여러 개 있을 수 있음
#   - 과탐: 문항 `^N.`, 발문은 텍스트, 보기는 표 안 (텍스트엔 없음)
#   - 수학: 문항 `^N.`, 발문 + EqEdit placeholder (별도 처리)
#   - 사탐: 텍스트엔 발문만, 번호 없음 (별도 처리 필요)
#
# 사용:
#   python split-questions.py 국어 [--input PATH] [--output PATH]

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "out"

PASSAGE_HEAD = re.compile(r"^\[\s*(\d+)\s*[~～]\s*(\d+)\s*\]\s*(.*)$")
Q_HEAD = re.compile(r"^(\d{1,3})\.\s*(.*)$")
CHOICE_HEAD_LINE = re.compile(r"^([①-⑤])(.*)$")
CHOICE_INLINE = re.compile(r"([①-⑤])([^①-⑤]*)")
SCORE_TAG = re.compile(r"\[\s*(\d+)\s*점\s*\]")
PLACEHOLDER = re.compile(r"<(그림|표)>")
CHOICE_INDEX = {"①": 1, "②": 2, "③": 3, "④": 4, "⑤": 5}


def split_text(text: str, subject: str) -> dict:
    # 한 paragraph에 ShapePicture + 다음 문항 발문이 합쳐진 케이스 분리.
    # `⟨IMG:...⟩ N.[한국어/영어]` 패턴이 한 줄에 있으면 IMG 마커 뒤에서 줄 분리.
    text = re.sub(
        r"(⟨IMG:[^⟩]+⟩)\s+(\d{1,3}\.)(\s*[가-힣A-Za-z])",
        r"\1\n\2\3",
        text,
    )
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

    def push_inline_choices(line: str):
        """라인 안에 ①~⑤가 여러 개 있으면 모두 분리해 보기로 추가."""
        nonlocal current_choice
        flush_choice()
        for m in CHOICE_INLINE.finditer(line):
            glyph = m.group(1)
            body = m.group(2).strip()
            ch = {
                "index": CHOICE_INDEX[glyph],
                "glyph": glyph,
                "text": body,
                "has_placeholder": bool(PLACEHOLDER.search(body)),
                "_buf": [body],
            }
            current_choice = ch
            flush_choice()

    for raw in lines:
        line = raw.rstrip("\r")
        stripped = line.strip()
        if not stripped:
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
                # 발문 첫 줄에 ①이 함께 붙어있는 경우 (영어형)
                idx_first = head_rest.find("①")
                if idx_first >= 0:
                    pre = head_rest[:idx_first]
                    rest = head_rest[idx_first:]
                    if pre.strip():
                        current_q["_stem_buf"].append(pre.strip())
                    push_inline_choices(rest)
                    mode = "Q_CHOICE"
                else:
                    current_q["_stem_buf"].append(head_rest)
                    if PLACEHOLDER.search(head_rest):
                        current_q["stem_has_placeholder"] = True
                    mode = "Q_STEM"
            else:
                mode = "Q_STEM"
            continue

        # 줄 시작이 ①인 경우 — 줄 안에 추가 글리프가 더 있을 수 있음
        if stripped.startswith(tuple("①②③④⑤")) and current_q is not None:
            glyphs_in_line = re.findall(r"[①-⑤]", stripped)
            if len(glyphs_in_line) > 1:
                # 같은 줄에 여러 글리프 — 인라인 분리 (영어형)
                push_inline_choices(stripped)
            else:
                # 글리프 하나만 — 표 형태일 수 있어 본문 누적 모드 유지
                flush_choice()
                glyph = stripped[0]
                body = stripped[1:].strip()
                current_choice = {
                    "index": CHOICE_INDEX[glyph],
                    "glyph": glyph,
                    "text": "",
                    "has_placeholder": bool(PLACEHOLDER.search(body)),
                    "_buf": [body] if body else [],
                }
                if current_q is not None:
                    pass  # 보기 추가는 flush 시점에
            mode = "Q_CHOICE"
            continue

        # 라인 중간에 ①가 있는 경우 (영어형 — 발문 끝나고 보기 시작)
        if "①" in stripped and current_q is not None and mode in ("Q_STEM",):
            idx_first = stripped.find("①")
            pre = stripped[:idx_first]
            rest = stripped[idx_first:]
            if pre.strip():
                current_q["_stem_buf"].append(pre.strip())
            push_inline_choices(rest)
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

    flush_question()

    for p in passages:
        p["body"] = "\n".join(p["_body_buf"]).strip()
        del p["_body_buf"]

    for q in questions:
        if len(q["choices"]) != 5:
            notes.append(f"문항 {q['number']}: 보기 {len(q['choices'])}개")
        glyphs_seq = [c["glyph"] for c in q["choices"]]
        if glyphs_seq and glyphs_seq != ["①", "②", "③", "④", "⑤"][: len(glyphs_seq)]:
            notes.append(f"문항 {q['number']}: 보기 글리프 순서 깨짐 {glyphs_seq}")

    return {
        "source": f"{subject} (hwp5txt)",
        "extracted_at": datetime.now(timezone.utc).isoformat(),
        "schema": "edu-import/v0",
        "subject": subject,
        "passages": passages,
        "questions": questions,
        "stats": {
            "passage_count": len(passages),
            "question_count": len(questions),
            "questions_with_5_choices": sum(1 for q in questions if len(q["choices"]) == 5),
            "questions_with_score": sum(1 for q in questions if q["score"] is not None),
            "questions_without_passage": sum(1 for q in questions if not q["passage_id"]),
        },
        "warnings": notes,
    }


SUBJECT_FILES = {
    "국어": "국어_pyhwp.txt",
    "영어": "영어_pyhwp.txt",
    "수학": "수학_pyhwp.txt",
    "과탐": "과탐_pyhwp.txt",
    "사탐": "사탐_pyhwp.txt",
}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("subject", choices=list(SUBJECT_FILES.keys()))
    ap.add_argument("--input", default=None)
    ap.add_argument("--output", default=None)
    args = ap.parse_args()

    in_path = Path(args.input) if args.input else OUT_DIR / SUBJECT_FILES[args.subject]
    out_path = Path(args.output) if args.output else OUT_DIR / f"{args.subject}-questions.json"

    text = in_path.read_text(encoding="utf-8")
    result = split_text(text, args.subject)
    out_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")

    s = result["stats"]
    print(f"[split] {args.subject}: 묶음 {s['passage_count']} / 문항 {s['question_count']}")
    print(f"  보기 5개 완전: {s['questions_with_5_choices']}/{s['question_count']}")
    print(f"  3점 문항: {s['questions_with_score']}")
    if result["warnings"]:
        print(f"  경고 {len(result['warnings'])}건:")
        for n in result["warnings"][:10]:
            print(f"    - {n}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
