#!/usr/bin/env python
# 사탐 HTML에서 문항 추출.
# hwp5txt에는 번호·보기가 죄다 표 안에 있어 안 나오니 hwp5html 결과를 사용.
#
# 휴리스틱:
#   - HTML을 평탄화한 텍스트에서 ①~⑤가 정확히 5개 연속 등장하면 1문항.
#   - 문항 번호는 본 텍스트에 없으므로 자동 채번 (1, 2, 3, ...).
#   - 발문 = 직전 텍스트 블록(이전 ⑤ 보기와 다음 ①사이).
#
# 한계:
#   - 표 안 자료(<표>)는 텍스트화는 되지만 구조 손실 큼 — 발문에 흡수.
#   - <보기> 박스(ㄱ·ㄴ·ㄷ·ㄹ)도 발문에 흡수.

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


CHOICE_INDEX = {"①": 1, "②": 2, "③": 3, "④": 4, "⑤": 5}

# 평가원 페이지 헤더/푸터/회차 표제 — 발문에 흡수되면 노이즈가 됨
HEADER_PATTERNS = [
    re.compile(r"^\d{4}학년도\s*대학수학능력시험\s*문제지.*$"),
    re.compile(r"^(사회|과학|국어|영어|수학)\s*탐구?\s*영역.*$"),
    re.compile(r"^제\s*\d+\s*교시.*$"),
    re.compile(r"^성명\s*수험\s*번호.*$"),
    re.compile(r"^제\s*\[\s*\]\s*선택.*$"),
    re.compile(r"^\(\s*\d+\s*\)\s*$"),  # 단순 페이지번호
]


def is_header_noise(ln: str) -> bool:
    for p in HEADER_PATTERNS:
        if p.match(ln):
            return True
    return False


def html_to_text(html: str) -> str:
    # <style>...</style> 제거
    html = re.sub(r"<style[^>]*>.*?</style>", " ", html, flags=re.S)
    # <script>...</script> 제거
    html = re.sub(r"<script[^>]*>.*?</script>", " ", html, flags=re.S)
    # 태그 모두 공백으로
    text = re.sub(r"<[^>]+>", " ", html)
    # HTML 엔티티
    text = text.replace("&#13;", "\n")
    text = text.replace("&nbsp;", " ")
    text = text.replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&")
    # 공백 정리: 연속 줄바꿈은 줄바꿈 1번, 줄 안 공백은 1칸
    lines = []
    for ln in text.split("\n"):
        ln = re.sub(r"\s+", " ", ln).strip()
        if ln:
            lines.append(ln)
    return "\n".join(lines)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("subject", choices=["사탐", "과탐"], help="종목")
    args = ap.parse_args()
    subject = args.subject

    html_path = ROOT / "out" / f"{subject}_html" / "index.xhtml"
    out_path = ROOT / "out" / f"{subject}-questions.json"

    raw = html_path.read_text(encoding="utf-8")
    text = html_to_text(raw)

    lines = text.split("\n")

    # 토큰 단위로 모아 ①~⑤ 그룹을 찾는다.
    questions: list[dict] = []
    pending: list[str] = []  # 다음 문항 발문 후보
    current_choices: list[dict] | None = None
    waiting_glyph = "①"  # 다음 기대 글리프
    last_glyph_idx = -1
    choice_buf: list[str] = []

    def flush_choice():
        nonlocal current_choices, choice_buf
        if current_choices and choice_buf and len(current_choices) > 0:
            current_choices[-1]["text"] = " ".join(choice_buf).strip()
        choice_buf = []

    def start_question(stem_lines: list[str]):
        nonlocal current_choices, waiting_glyph
        stem = " ".join(stem_lines).strip()
        current_choices = []
        waiting_glyph = "①"

    for ln in lines:
        # 보기 글리프 처리: 한 줄에 ①만 있거나, "① text..." 형태
        m = re.match(r"^([①-⑤])\s*(.*)$", ln)
        if m:
            glyph = m.group(1)
            body = m.group(2).strip()
            # 새 글리프 시작 — 직전 보기 flush
            flush_choice()
            if glyph == "①":
                # 새 문항 시작 — pending이 발문 후보
                if current_choices is not None and questions:
                    # 이전 문항 종료
                    pass
                stem = " ".join(pending).strip()
                pending = []
                q = {
                    "number": len(questions) + 1,
                    "passage_id": None,
                    "stem": stem,
                    "score": None,
                    "choices": [],
                    "stem_has_placeholder": False,
                    "any_choice_has_placeholder": False,
                }
                questions.append(q)
                current_choices = q["choices"]
                waiting_glyph = "①"
            ch = {
                "index": CHOICE_INDEX[glyph],
                "glyph": glyph,
                "text": body,
                "has_placeholder": False,
            }
            if current_choices is None:
                continue
            current_choices.append(ch)
            choice_buf = [body] if body else []
            # 3점 태그 처리
            continue

        # 페이지 헤더 노이즈는 무시
        if is_header_noise(ln):
            continue

        # 일반 텍스트
        if current_choices is not None and len(current_choices) > 0:
            if len(current_choices) < 5:
                # ①~④: 다음 글리프 전까지 본문 누적
                choice_buf.append(ln)
                continue
            elif len(current_choices) == 5 and not choice_buf:
                # ⑤가 글리프만 있는 줄로 들어와 본문이 다음 줄에 올 때 한 줄만 받는다.
                choice_buf.append(ln)
                continue
            # ⑤ 본문이 이미 채워졌으면 다음 문항 발문 후보로
        # 다음 문항 발문 후보 누적
        pending.append(ln)
        # 너무 길어지면 자르기 (안전장치 — 한 발문이 20줄 넘으면 앞 줄 버림)
        if len(pending) > 20:
            pending = pending[-20:]

    flush_choice()

    # stem 청소: `N.` 패턴 앞에 붙은 노이즈(헤더 잔여·직전 ⑤ 본문) 제거
    for q in questions:
        s = q["stem"]
        # `숫자.` 가 발견되면 그 시작점부터 잘라낸다 — 발문 시작은 항상 번호로 시작해야.
        m_num = re.search(r"\b\d{1,3}\.\s*", s)
        if m_num and m_num.start() > 0:
            s = s[m_num.start():]
        # `숫자.` 뒤가 자기 자신 번호여야 함 — 아니면 첫 번호 매치 사용
        s = re.sub(r"^\d{1,3}\.\s*", "", s).strip()
        q["stem"] = s

    # 3점 태그 추출
    for q in questions:
        m = re.search(r"\[(\d+)\s*점\s*\]", q["stem"])
        if m:
            q["score"] = int(m.group(1))
            q["stem"] = re.sub(r"\[(\d+)\s*점\s*\]", "", q["stem"]).strip()

    # 발문이 비어있거나 보기가 5개 미만인 문항 필터
    cleaned = []
    notes: list[str] = []
    for q in questions:
        if len(q["choices"]) < 5 and not q["stem"]:
            continue
        if len(q["choices"]) != 5:
            notes.append(f"문항 {q['number']}: 보기 {len(q['choices'])}개")
        cleaned.append(q)

    # 번호 재부여
    for i, q in enumerate(cleaned, 1):
        q["number"] = i

    result = {
        "source": f"{subject} (hwp5html → 평탄화)",
        "extracted_at": datetime.now(timezone.utc).isoformat(),
        "schema": "edu-import/v0",
        "subject": subject,
        "passages": [],
        "questions": cleaned,
        "stats": {
            "passage_count": 0,
            "question_count": len(cleaned),
            "questions_with_5_choices": sum(1 for q in cleaned if len(q["choices"]) == 5),
            "questions_with_score": sum(1 for q in cleaned if q["score"] is not None),
            "questions_without_passage": len(cleaned),
        },
        "warnings": notes,
    }
    out_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")

    s = result["stats"]
    print(f"[{subject}] 문항 {s['question_count']} / 보기 5개 완전: {s['questions_with_5_choices']}")
    print(f"  3점 문항: {s['questions_with_score']}")
    if notes:
        print(f"  경고 {len(notes)}건:")
        for n in notes[:10]:
            print(f"    - {n}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
