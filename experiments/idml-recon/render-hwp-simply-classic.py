#!/usr/bin/env python
"""hwp-simply-classic-sample.json → simply-classic preset Typst 컴파일 → PDF + PNG.

체인의 두 번째 단계 — build-edu-book-sample.py가 만든 EduBook JSON을
simply-classic preset로 식자해 학원선생 PDF 형태 산출.

산출물:
  experiments/idml-recon/hwp-simply-classic-debug.pdf
  experiments/idml-recon/hwp-simply-classic-debug-p1.png  (가능하면 p2, p3도)
"""
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
except AttributeError:
    pass

ROOT = Path(__file__).resolve().parent.parent.parent
SAMPLE = ROOT / "experiments" / "idml-recon" / "hwp-simply-classic-sample.json"
PDF_OUT = ROOT / "experiments" / "idml-recon" / "hwp-simply-classic-debug.pdf"
PNG_BASE = ROOT / "experiments" / "idml-recon" / "hwp-simply-classic-debug"
MAIN_TYP = ROOT / "typst-templates" / "edu" / "presets" / "simply-classic" / "main.typ"


def main() -> int:
    if not SAMPLE.exists():
        print(f"[err] sample 없음: {SAMPLE}", file=sys.stderr)
        print("  먼저 experiments/edu-import/scripts/build-edu-book-sample.py를 실행하세요.")
        return 1

    # main.typ는 /data.json을 읽는다 (typst CLI --root=project root 기준).
    # sample을 project root의 data.json으로 복사 후 컴파일, 끝나면 정리.
    data_json = ROOT / "data.json"
    shutil.copy(SAMPLE, data_json)

    print(f"[typst] compile {MAIN_TYP.relative_to(ROOT)} → {PDF_OUT.relative_to(ROOT)}")
    proc = subprocess.run(
        ["typst", "compile", "--root", str(ROOT),
         str(MAIN_TYP), str(PDF_OUT)],
        capture_output=True,
    )
    # 정리
    try:
        data_json.unlink()
    except OSError:
        pass

    if proc.returncode != 0:
        print("[typst] compile failed:")
        print(proc.stderr.decode("utf-8", errors="replace")[:1500])
        return 2

    print(f"[pdf] → {PDF_OUT.relative_to(ROOT)} ({PDF_OUT.stat().st_size // 1024} KB)")

    # PNG 렌더 (첫 3페이지)
    try:
        import fitz  # type: ignore
    except ImportError:
        print("[png] PyMuPDF 없음 — PNG skip")
        return 0

    doc = fitz.open(str(PDF_OUT))
    n_pages = len(doc)
    pngs = []
    for i in range(min(3, n_pages)):
        png_path = PNG_BASE.parent / f"{PNG_BASE.name}-p{i+1}.png"
        doc[i].get_pixmap(dpi=140).save(str(png_path))
        pngs.append(png_path)
        print(f"[png] p{i+1} → {png_path.relative_to(ROOT)}")
    doc.close()
    print(f"[done] PDF {n_pages}쪽, PNG {len(pngs)}장")
    return 0


if __name__ == "__main__":
    sys.exit(main())
