#!/usr/bin/env python
"""Spread XML 정찰 — 각 spread의 Page Name + element 종류·개수 dump.

목적: 어느 spread가 어느 페이지에 해당하는지, Rectangle/TextFrame/Line 등이
얼마나 박혀있는지 한눈에 본 뒤 표적 페이지(원본 p13 = 1번 문제)를 잡는다.
"""
from __future__ import annotations
import sys
from collections import Counter
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent.parent
SPREADS = ROOT / "experiments" / "idml-recon" / "simply-classic" / "Spreads"

try:
    sys.stdout.reconfigure(encoding="utf-8")
except AttributeError:
    pass


def localtag(el):
    return el.tag.split("}")[-1] if "}" in el.tag else el.tag


def scout(sp: Path) -> dict:
    tree = ET.parse(sp)
    root = tree.getroot()
    pages: list[str] = []
    counts: Counter = Counter()
    # 페이지 GeometricBounds도 모음
    page_bounds: list[str] = []
    for el in root.iter():
        tag = localtag(el)
        if tag == "Page":
            name = el.get("Name", "?")
            pages.append(name)
            page_bounds.append(el.get("GeometricBounds", ""))
        elif tag in ("Rectangle", "TextFrame", "Polygon", "Oval", "GraphicLine", "Group"):
            counts[tag] += 1
    return {
        "file": sp.name,
        "pages": pages,
        "page_bounds": page_bounds,
        "counts": dict(counts),
        "size_kb": sp.stat().st_size // 1024,
    }


def main():
    spreads = sorted(SPREADS.glob("Spread_*.xml"))
    rows = []
    for sp in spreads:
        try:
            rows.append(scout(sp))
        except ET.ParseError as e:
            print(f"ERR {sp.name}: {e}", file=sys.stderr)
    # 페이지 번호 기준 정렬 (Name이 숫자가 아니면 999)
    def page_key(r):
        try:
            return int(r["pages"][0]) if r["pages"] else 999
        except ValueError:
            return 999
    rows.sort(key=page_key)

    print(f"{'page(s)':12} {'kb':>4} {'file':25} {'Rect':>4} {'TF':>4} {'GL':>3} {'Poly':>4} {'Oval':>4} {'Group':>5}")
    print("-" * 90)
    for r in rows:
        c = r["counts"]
        pages = "/".join(r["pages"])
        print(f"{pages:12} {r['size_kb']:>4} {r['file']:25} "
              f"{c.get('Rectangle',0):>4} {c.get('TextFrame',0):>4} "
              f"{c.get('GraphicLine',0):>3} {c.get('Polygon',0):>4} "
              f"{c.get('Oval',0):>4} {c.get('Group',0):>5}")

    # 통계
    total = Counter()
    for r in rows:
        for k, v in r["counts"].items():
            total[k] += v
    print("-" * 90)
    print(f"총 Rectangle {total['Rectangle']}, TextFrame {total['TextFrame']}, "
          f"GraphicLine {total['GraphicLine']}, Polygon {total['Polygon']}, "
          f"Oval {total['Oval']}, Group {total['Group']}")


if __name__ == "__main__":
    main()
