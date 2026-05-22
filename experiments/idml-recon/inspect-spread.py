#!/usr/bin/env python
"""한 spread의 모든 frame을 페이지-로컬 좌표 + 색 + 텍스트로 dump.

좌표계 누적 (중요):
  Document
  └─ Spread      ItemTransform (큰 y offset 가능)
     └─ Page    ItemTransform (spread 안 위치)
     └─ Group   ItemTransform (선택)
        └─ Rectangle/TextFrame/Polygon  ItemTransform
            └─ PathPointType Anchor  (frame-local 좌표)

요소의 document 좌표 = 모든 조상 ItemTransform translation 누적 + Anchor.
페이지 좌표 = document 좌표 - (spread_xform + page_xform).
"""
from __future__ import annotations
import argparse
import sys
from pathlib import Path
from xml.etree import ElementTree as ET

try:
    sys.stdout.reconfigure(encoding="utf-8")
except AttributeError:
    pass


def localtag(el):
    return el.tag.split("}")[-1] if "}" in el.tag else el.tag


def parse_xform(s: str) -> tuple[float, float, float, float, float, float]:
    if not s:
        return (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)
    try:
        parts = list(map(float, s.split()))
        return tuple(parts + [0.0] * (6 - len(parts)))[:6]
    except ValueError:
        return (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)


def get_pathpoints_direct(el) -> list[tuple[float, float]]:
    """el의 직접 자식 PathGeometry 안 PathPointType만 (nested Group 무시)."""
    pts = []
    for c in el:
        tag = localtag(c)
        if tag == "Properties":
            for cc in c:
                if localtag(cc) == "PathGeometry":
                    for ccc in cc.iter():
                        if localtag(ccc) == "PathPointType":
                            try:
                                x, y = map(float, ccc.get("Anchor", "").split())
                                pts.append((x, y))
                            except ValueError:
                                pass
    return pts


def get_story_text(stories_dir: Path, story_id: str, limit=60) -> str:
    if not story_id:
        return ""
    sp = stories_dir / f"Story_{story_id}.xml"
    if not sp.exists():
        return ""
    try:
        t = ET.parse(sp)
        text = ""
        for el in t.getroot().iter():
            if localtag(el) == "Content" and el.text:
                text += el.text
        return text[:limit] + ("..." if len(text) > limit else "")
    except ET.ParseError:
        return "<parse error>"


def inspect(spread_path: Path, stories_dir: Path):
    tree = ET.parse(spread_path)
    root = tree.getroot()

    # Spread element 찾기 — root는 idPkg:Spread wrapper, 진짜 Spread는 그 안.
    # wrapper도 localtag == "Spread"이므로 Self 속성 있는 놈 우선.
    spread_el = None
    for c in root.iter():
        if localtag(c) == "Spread" and c.get("Self"):
            spread_el = c
            break
    if spread_el is None:
        print("Spread element not found")
        return

    spread_xform = parse_xform(spread_el.get("ItemTransform", ""))
    print(f"Spread {spread_el.get('Self')}  IT={spread_xform}")

    pages = []
    for c in spread_el:
        if localtag(c) == "Page":
            pages.append({
                "self": c.get("Self"),
                "name": c.get("Name"),
                "bounds": c.get("GeometricBounds", ""),
                "xform": parse_xform(c.get("ItemTransform", "")),
            })

    for p in pages:
        print(f"  Page {p['name']}  Self={p['self']}  IT={p['xform']}  bounds={p['bounds']}")
        # 페이지 origin in document coords
        page_doc_x = spread_xform[4] + p["xform"][4]
        page_doc_y = spread_xform[5] + p["xform"][5]
        print(f"    page origin in doc = ({page_doc_x:.1f}, {page_doc_y:.1f})")
    print()

    items = []

    def walk(el, parent_tx=0.0, parent_ty=0.0, group_id=""):
        for c in el:
            tag = localtag(c)
            xf = parse_xform(c.get("ItemTransform", ""))
            tx = parent_tx + xf[4]
            ty = parent_ty + xf[5]
            if tag in ("Rectangle", "TextFrame", "Polygon", "GraphicLine", "Oval"):
                pts = get_pathpoints_direct(c)
                bbox = None
                if pts:
                    xs = [p[0] for p in pts]
                    ys = [p[1] for p in pts]
                    bbox = (min(xs), min(ys), max(xs), max(ys))
                story = c.get("ParentStory") or ""
                text = get_story_text(stories_dir, story, 50) if story else ""
                items.append({
                    "tag": tag,
                    "self": c.get("Self", ""),
                    "group": group_id,
                    "fill": c.get("FillColor", ""),
                    "stroke": c.get("StrokeColor", ""),
                    "stroke_w": c.get("StrokeWeight", ""),
                    "doc_tx": tx, "doc_ty": ty,
                    "bbox": bbox,
                    "story": story,
                    "text": text,
                })
            if tag == "Group":
                walk(c, tx, ty, c.get("Self", "")[:8])
            else:
                walk(c, tx, ty, group_id)

    # walk from spread_el (its own xform is the initial parent)
    walk(spread_el, spread_xform[4], spread_xform[5])

    # 각 frame → page-local (x, y, w, h)
    # 첫 페이지 origin 기준이 아닌, x 중심이 spread spine 어느 쪽인지로 좌/우 판별
    page_w = page_h = 0
    if pages:
        try:
            top, left, bottom, right = map(float, pages[0]["bounds"].split())
            page_w = right - left
            page_h = bottom - top
        except ValueError:
            pass

    # spine x in document coords = spread_xform[4] + 0 (right page는 x=0~page_w, left는 x=-page_w~0 in spread coords)
    # page_doc_x for each page = spread_xform[4] + page.xform[4]
    page_doc_origins = {}
    for p in pages:
        pdx = spread_xform[4] + p["xform"][4]
        pdy = spread_xform[5] + p["xform"][5]
        page_doc_origins[p["name"]] = (pdx, pdy)

    print(f"{'pg':3} {'tag':10} {'self':10} {'fill':30} {'stroke':18} {'w':>6} {'h':>6} {'x':>6} {'y':>6} {'grp':>8} text")
    print("-" * 130)
    for it in items:
        if not it["bbox"]:
            continue
        bx0, by0, bx1, by1 = it["bbox"]
        # document 좌상단
        doc_x0 = it["doc_tx"] + bx0
        doc_y0 = it["doc_ty"] + by0
        doc_x1 = it["doc_tx"] + bx1
        doc_y1 = it["doc_ty"] + by1
        w = doc_x1 - doc_x0
        h = doc_y1 - doc_y0
        # 중심
        cx = (doc_x0 + doc_x1) / 2
        cy = (doc_y0 + doc_y1) / 2
        # 어느 페이지인가 — center가 어느 페이지 박스 안인지
        assigned = None
        for p in pages:
            pdx, pdy = page_doc_origins[p["name"]]
            if pdx <= cx < pdx + page_w and pdy <= cy < pdy + page_h:
                assigned = p["name"]
                break
        if assigned is None:
            # 가장 가까운 페이지
            best = min(pages, key=lambda p: abs(page_doc_origins[p["name"]][0] + page_w/2 - cx))
            assigned = best["name"] + "?"

        pdx, pdy = page_doc_origins[assigned.rstrip("?")]
        px = doc_x0 - pdx
        py = doc_y0 - pdy

        fill_short = it["fill"].replace("Color/", "")[-28:]
        stroke_short = it["stroke"].replace("Color/", "")[-16:]
        text_short = (it["text"][:30] + "...") if len(it["text"]) > 30 else it["text"]
        print(f"{assigned:3} {it['tag']:10} {it['self']:10} {fill_short:30} {stroke_short:18} "
              f"{w:6.1f} {h:6.1f} {px:6.1f} {py:6.1f} {it['group']:>8} {text_short!r}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("spread", help="Spread XML 경로 또는 파일명")
    args = ap.parse_args()
    sp = Path(args.spread)
    if not sp.is_absolute() and not sp.exists():
        sp = Path("experiments/idml-recon/simply-classic/Spreads") / sp
    stories = Path("experiments/idml-recon/simply-classic/Stories")
    inspect(sp, stories)


if __name__ == "__main__":
    main()
