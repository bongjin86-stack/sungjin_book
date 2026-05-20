#!/usr/bin/env python
# 종목별 hwp5html이 떨군 bindata/ 안 BMP/EMF/JPG 등을 모두 PNG로 통일.
# Typst가 PNG/JPG/SVG만 지원하므로 EMF는 placeholder 처리.
#
# 입력: out/{종목}_html/bindata/BIN_NNNN.{bmp,emf,jpg,png,gif}
# 출력: out/{종목}_bindata/BIN_NNNN.png (또는 .placeholder.png)

from __future__ import annotations

import argparse
import shutil
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent


def emf_placeholder(out_path: Path, label: str) -> None:
    """EMF 벡터 메타파일은 직접 변환 어려움 — 회색 placeholder PNG로."""
    img = Image.new("RGB", (400, 200), color=(245, 245, 245))
    draw = ImageDraw.Draw(img)
    draw.rectangle([(2, 2), (397, 197)], outline=(180, 180, 180), width=1)
    draw.text((10, 90), f"[EMF: {label}]", fill=(120, 120, 120))
    img.save(out_path, "PNG")


def convert_one(src: Path, dst: Path) -> str:
    ext = src.suffix.lower()
    if ext in (".png",):
        shutil.copy(src, dst)
        return "copy"
    if ext in (".bmp", ".jpg", ".jpeg", ".gif", ".tiff", ".webp"):
        try:
            with Image.open(src) as img:
                img.save(dst, "PNG")
            return f"convert {ext}→png"
        except Exception as e:
            emf_placeholder(dst, f"{src.stem} (err: {e})")
            return f"failed ({e})"
    if ext == ".emf":
        emf_placeholder(dst, src.stem)
        return "emf placeholder"
    return f"skip ({ext})"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("subject", help="국어/영어/수학/사탐/과탐")
    args = ap.parse_args()
    s = args.subject

    src_dir = ROOT / "out" / f"{s}_html" / "bindata"
    dst_dir = ROOT / "out" / f"{s}_bindata"
    if not src_dir.exists():
        print(f"[bindata] 소스 없음: {src_dir}")
        return 1
    dst_dir.mkdir(parents=True, exist_ok=True)

    counts = {"copy": 0, "convert": 0, "placeholder": 0, "skip": 0}
    for src in sorted(src_dir.iterdir()):
        if not src.is_file():
            continue
        dst = dst_dir / f"{src.stem}.png"
        result = convert_one(src, dst)
        if "copy" in result:
            counts["copy"] += 1
        elif "convert" in result:
            counts["convert"] += 1
        elif "placeholder" in result:
            counts["placeholder"] += 1
        else:
            counts["skip"] += 1
    print(f"[bindata] {s}: copy={counts['copy']} convert={counts['convert']} "
          f"placeholder={counts['placeholder']} skip={counts['skip']}")
    print(f"           → {dst_dir.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())
