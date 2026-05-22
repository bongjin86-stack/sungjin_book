#!/usr/bin/env python
"""Preset Block Engine v0 smoke test.

UI에서 + PART / + 지문 / + 문제 / + 빠른 정답 버튼 차례로 누른 시나리오를
동등한 EduBook JSON으로 만들어 simply-classic main.typ 렌더 → PDF + PNG.

QA gallery sync용 산출물:
  experiments/idml-recon/block-engine-smoke.pdf
  experiments/idml-recon/block-engine-smoke-p{1,2,3}.png

확인 항목:
  - + PART → 표지 페이지로 나타남
  - + 지문 → 지문 박스 안에 들어감
  - + 문제 → 문제 스타일로 출력
  - + 빠른 정답 → 빠른 정답 페이지로 출력
"""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
except AttributeError:
    pass

ROOT = Path(__file__).resolve().parent.parent.parent
WORK = ROOT / "experiments" / "idml-recon"
MAIN_TYP = ROOT / "typst-templates" / "edu" / "presets" / "simply-classic" / "main.typ"


def blocks_to_chapters(blocks):
    """web/lib/adapters/blocks-to-chapters.ts와 동등한 normalize."""
    chapters = []
    cur = None

    def flush():
        nonlocal cur
        if cur is not None:
            chapters.append(cur)
            cur = None

    for b in blocks:
        kind = b["kind"]
        if kind == "part-cover":
            flush()
            chapters.append({
                "type": "part-cover",
                "label": b["label"],
                "subtitle": b.get("subtitle", ""),
            })
        elif kind == "passage":
            if cur is None:
                cur = {"type": "passages", "passages": [], "questions": []}
            cur["passages"].append({
                "id": b["id"],
                "range": b.get("range"),
                "header": b.get("header", ""),
                "body": b.get("body", ""),
                "layout_mode": "default",
            })
        elif kind == "questions":
            if cur is None:
                cur = {"type": "passages", "passages": [], "questions": []}
            for q in b.get("questions", []):
                cur["questions"].append({
                    **q,
                    "passage_id": b.get("passage_id") or q.get("passage_id"),
                })
        elif kind == "quick-answer":
            flush()
            chapters.append({
                "type": "answer-key",
                "answers": b.get("answers", {}),
            })

    flush()
    if not chapters:
        chapters.append({"type": "passages", "passages": [], "questions": []})
    return chapters


def make_choice(idx, glyph, text):
    return {
        "index": idx,
        "glyph": glyph,
        "text": text,
        "has_placeholder": False,
    }


def make_question(number, passage_id, stem, choices):
    return {
        "number": number,
        "passage_id": passage_id,
        "stem": stem,
        "score": None,
        "choices": [make_choice(i + 1, g, t) for i, (g, t) in enumerate(choices)],
        "stem_has_placeholder": False,
        "any_choice_has_placeholder": False,
    }


def main():
    # 시나리오: PART 1 → 지문 1 → 문제 3개 → 빠른 정답
    blocks = [
        {
            "kind": "part-cover",
            "id": "part-1",
            "label": "PART 1",
            "subtitle": "고전소설 진단평가",
        },
        {
            "kind": "passage",
            "id": "p-1",
            "range": [1, 3],
            "header": "다음 글을 읽고 물음에 답하시오.",
            "body": (
                "심청이 인당수에 몸을 던지매 검은 물결이 잠깐 갈라지고 황금빛 광채가 "
                "둘러쌌으니, 이는 천상의 도움이라. 용궁 시녀들이 심청을 받들어 옥교에 "
                "태우니, 옥교는 사방이 영롱하여 인간 세계의 것이 아니었다.\n"
                "심청이 정신을 차려 좌우를 살펴보니, 산호 기둥에 진주 발이 드리워져 있고 "
                "수정 문이 빛났다. 시녀가 아뢰되, '낭자께서는 효성이 지극하시므로 옥황상제께서 "
                "특별히 명하시어 이곳에 모셨나이다.'"
            ),
        },
        {
            "kind": "questions",
            "id": "qs-1",
            "passage_id": "p-1",
            "questions": [
                make_question(
                    1, "p-1",
                    "윗글에 대한 설명으로 가장 적절한 것은?",
                    [
                        ("①", "사건이 시간 순서대로 전개된다."),
                        ("②", "공간 이동을 통해 사건이 진행된다."),
                        ("③", "회상을 통해 과거 사건을 재구성한다."),
                        ("④", "외양 묘사로 인물의 성격을 부각한다."),
                        ("⑤", "대화를 통해 인물의 가치관을 드러낸다."),
                    ],
                ),
                make_question(
                    2, "p-1",
                    "윗글의 인물에 대한 설명으로 적절하지 않은 것은?",
                    [
                        ("①", "심청은 자기 희생을 통해 부모를 구하려 한다."),
                        ("②", "용궁 시녀들은 심청을 정중히 대한다."),
                        ("③", "옥황상제는 심청의 효성을 인정한다."),
                        ("④", "심청은 인당수에서 천상의 도움을 받는다."),
                        ("⑤", "심청은 자신의 운명을 원망하고 있다."),
                    ],
                ),
                make_question(
                    3, "p-1",
                    "윗글의 서술상 특징으로 가장 적절한 것은?",
                    [
                        ("①", "전지적 작가 시점이 사용되었다."),
                        ("②", "1인칭 주인공 시점이 사용되었다."),
                        ("③", "독백을 통해 내면이 드러난다."),
                        ("④", "역사적 사건이 배경으로 활용된다."),
                        ("⑤", "비유적 표현 없이 사실 위주로 서술한다."),
                    ],
                ),
            ],
        },
        {
            "kind": "quick-answer",
            "id": "ak-1",
            "answers": {"1": "②", "2": "⑤", "3": "①"},
        },
    ]

    edu_book = {
        "meta": {
            "title": "Block Engine v0 smoke test",
            "author": "성진북스",
            "subject": "국어",
            "watermark": "성진북스 내부 조판",
        },
        "preset": "simply-classic",
        "options": {"size": "A4"},
        "chapters": blocks_to_chapters(blocks),
        "blocks": blocks,
    }

    # data.json 박고 컴파일
    data_path = ROOT / "data.json"
    data_path.write_text(json.dumps(edu_book, ensure_ascii=False, indent=2),
                          encoding="utf-8")

    pdf_path = WORK / "block-engine-smoke.pdf"
    print(f"[typst] compile → {pdf_path.relative_to(ROOT)}")
    proc = subprocess.run(
        ["typst", "compile", "--root", str(ROOT),
         str(MAIN_TYP), str(pdf_path)],
        capture_output=True,
    )
    try:
        data_path.unlink()
    except OSError:
        pass

    if proc.returncode != 0:
        print("[typst] compile failed:")
        print(proc.stderr.decode("utf-8", errors="replace")[:1500])
        return 2

    print(f"[pdf] → {pdf_path.relative_to(ROOT)} ({pdf_path.stat().st_size // 1024} KB)")

    try:
        import fitz  # type: ignore
    except ImportError:
        print("[png] PyMuPDF 없음 — PNG skip")
        return 0

    doc = fitz.open(str(pdf_path))
    n = len(doc)
    print(f"[pdf] pages: {n}")
    for i in range(min(3, n)):
        png_path = WORK / f"block-engine-smoke-p{i+1}.png"
        doc[i].get_pixmap(dpi=140).save(str(png_path))
        print(f"[png] p{i+1} → {png_path.relative_to(ROOT)}")
    doc.close()

    # 샘플 JSON도 따로 저장
    sample_path = WORK / "block-engine-smoke-sample.json"
    sample_path.write_text(json.dumps(edu_book, ensure_ascii=False, indent=2),
                           encoding="utf-8")
    print(f"[sample] → {sample_path.relative_to(ROOT)}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
