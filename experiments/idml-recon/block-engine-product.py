#!/usr/bin/env python
"""Render the product-quality HWP sample through the Preset Block Engine.

This is the QA sample that answers the real question:
  "If the operator builds the book as preset blocks, does it still look like the
   product-quality HWP -> simply-classic render?"

Input:
  experiments/idml-recon/hwp-simply-classic-sample.json

Output:
  experiments/idml-recon/block-engine-product.pdf
  experiments/idml-recon/block-engine-product-p{n}.png
  experiments/idml-recon/block-engine-product-sample.json
"""
from __future__ import annotations

import json
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
SOURCE_JSON = WORK / "hwp-simply-classic-sample.json"
BASE = "block-engine-product"


def chapters_to_blocks(chapters):
    blocks = []
    part_no = 0
    passage_group_no = 0
    answer_no = 0

    for chapter in chapters:
        ctype = chapter.get("type")

        if ctype == "part-cover":
            part_no += 1
            blocks.append({
                "kind": "part-cover",
                "id": f"part-{part_no}",
                "label": chapter.get("label", f"PART {part_no}"),
                "subtitle": chapter.get("subtitle", ""),
            })

        elif ctype == "passages":
            for passage in chapter.get("passages", []):
                block = {
                    "kind": "passage",
                    "id": passage["id"],
                    "range": passage.get("range"),
                    "header": passage.get("header", ""),
                    "body": passage.get("body", ""),
                    "layout_mode": passage.get("layout_mode", "default"),
                }
                if "body_rich" in passage:
                    block["body_rich"] = passage["body_rich"]
                blocks.append(block)

                qs = [
                    q for q in chapter.get("questions", [])
                    if q.get("passage_id") == passage.get("id")
                ]
                if qs:
                    passage_group_no += 1
                    blocks.append({
                        "kind": "questions",
                        "id": f"qs-{passage_group_no}",
                        "passage_id": passage["id"],
                        "questions": qs,
                    })

            loose = [
                q for q in chapter.get("questions", [])
                if q.get("passage_id") is None
            ]
            if loose:
                passage_group_no += 1
                blocks.append({
                    "kind": "questions",
                    "id": f"qs-{passage_group_no}",
                    "passage_id": None,
                    "questions": loose,
                })

        elif ctype == "answer-key":
            answer_no += 1
            blocks.append({
                "kind": "quick-answer",
                "id": f"answer-{answer_no}",
                "answers": chapter.get("answers", {}),
            })

    return blocks


def blocks_to_chapters(blocks):
    chapters = []
    cur = None

    def flush():
        nonlocal cur
        if cur is not None:
            chapters.append(cur)
            cur = None

    for block in blocks:
        kind = block["kind"]

        if kind == "part-cover":
            flush()
            chapters.append({
                "type": "part-cover",
                "label": block["label"],
                "subtitle": block.get("subtitle", ""),
            })

        elif kind == "passage":
            if cur is None:
                cur = {"type": "passages", "passages": [], "questions": []}
            passage = {
                "id": block["id"],
                "range": block.get("range"),
                "header": block.get("header", ""),
                "body": block.get("body", ""),
                "layout_mode": block.get("layout_mode", "default"),
            }
            if "body_rich" in block:
                passage["body_rich"] = block["body_rich"]
            cur["passages"].append(passage)

        elif kind == "questions":
            if cur is None:
                cur = {"type": "passages", "passages": [], "questions": []}
            for question in block.get("questions", []):
                q = dict(question)
                q["passage_id"] = block.get("passage_id") or q.get("passage_id")
                cur["questions"].append(q)

        elif kind == "quick-answer":
            flush()
            chapters.append({
                "type": "answer-key",
                "answers": block.get("answers", {}),
            })

    flush()
    return chapters or [{"type": "passages", "passages": [], "questions": []}]


def render_pngs(pdf_path: Path):
    try:
        import fitz  # type: ignore
    except ImportError:
        print("[png] PyMuPDF not installed, skipping PNG render")
        return

    doc = fitz.open(str(pdf_path))
    print(f"[pdf] pages: {len(doc)}")
    for i in range(len(doc)):
        png_path = WORK / f"{BASE}-p{i + 1}.png"
        doc[i].get_pixmap(dpi=140).save(str(png_path))
        print(f"[png] p{i + 1} -> {png_path.relative_to(ROOT)}")
    doc.close()


def main() -> int:
    source = json.loads(SOURCE_JSON.read_text(encoding="utf-8"))
    blocks = chapters_to_blocks(source.get("chapters", []))
    edu_book = {
        **source,
        "blocks": blocks,
        "chapters": blocks_to_chapters(blocks),
    }

    sample_path = WORK / f"{BASE}-sample.json"
    sample_path.write_text(
        json.dumps(edu_book, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"[sample] -> {sample_path.relative_to(ROOT)}")

    data_path = ROOT / "data.json"
    data_path.write_text(
        json.dumps(edu_book, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    pdf_path = WORK / f"{BASE}.pdf"
    print(f"[typst] compile -> {pdf_path.relative_to(ROOT)}")
    proc = subprocess.run(
        ["typst", "compile", "--root", str(ROOT), str(MAIN_TYP), str(pdf_path)],
        capture_output=True,
    )
    try:
        data_path.unlink()
    except OSError:
        pass

    if proc.returncode != 0:
        print(proc.stderr.decode("utf-8", errors="replace")[:2000])
        return proc.returncode

    print(f"[pdf] -> {pdf_path.relative_to(ROOT)} ({pdf_path.stat().st_size // 1024} KB)")
    render_pngs(pdf_path)
    return 0


if __name__ == "__main__":
    sys.exit(main())
