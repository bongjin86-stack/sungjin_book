#!/usr/bin/env python
"""JSON → Typst → PDF.

experiments/edu-import/out/korean-questions.json 을 받아
typst-templates/edu/test-paper/v0.1/template.typ 로 PDF 생성.

본앱 코드 변경 0:
  - web/, web/lib/typst/buildSource.ts, typst-templates/sinkukpan/ 일절 무관.
  - 신규 typst-templates/edu/* 만 import.

사용:
  python scripts/render-json-to-typst.py             # 앞 10문항
  python scripts/render-json-to-typst.py --limit 0   # 전체 56문항
  python scripts/render-json-to-typst.py --limit 5 --out out/korean-mini.pdf
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

EXP = Path(__file__).resolve().parent.parent  # experiments/edu-import
ROOT = EXP.parent.parent  # sungjin_book
JSON_PATH = EXP / "out" / "korean-questions.json"
TEMPLATE_REL = "typst-templates/edu/test-paper/v0.1/template.typ"
FONTS = ROOT / "fonts"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=10, help="앞 N문항만 (0=전체)")
    ap.add_argument("--out", default="out/korean-test-paper.pdf")
    args = ap.parse_args()

    if not JSON_PATH.exists():
        print(f"[render] 입력 없음: {JSON_PATH}")
        return 1

    raw = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    questions = raw["questions"]
    if args.limit > 0:
        questions = questions[: args.limit]
    keep_pids = {q["passage_id"] for q in questions if q["passage_id"]}
    passages = [p for p in raw["passages"] if p["id"] in keep_pids]

    data = {
        "meta": {
            "source": raw["source"],
            "extracted_at": raw["extracted_at"],
            "schema": raw["schema"],
        },
        "passages": passages,
        "questions": questions,
    }

    work_dir = EXP / "out" / "typst-work"
    work_dir.mkdir(parents=True, exist_ok=True)

    (work_dir / "data.json").write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    main_typ = work_dir / "main.typ"
    main_typ.write_text(
        f'#import "/{TEMPLATE_REL}": test-paper\n'
        f'#let data = json("data.json")\n'
        f'#test-paper(data)\n',
        encoding="utf-8",
    )

    out_pdf = EXP / args.out
    out_pdf.parent.mkdir(parents=True, exist_ok=True)

    cmd = [
        "typst",
        "compile",
        "--root",
        str(ROOT),
        "--font-path",
        str(FONTS),
        str(main_typ),
        str(out_pdf),
    ]
    print(f"[render] questions={len(questions)} passages={len(passages)}")
    print(f"[render] $ {' '.join(cmd)}")
    res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
    if res.stdout:
        print(res.stdout)
    if res.stderr:
        print(res.stderr)
    if res.returncode != 0:
        print("[render] FAILED")
        return res.returncode

    size = out_pdf.stat().st_size
    print(f"[render] OK → {out_pdf} ({size:,} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
