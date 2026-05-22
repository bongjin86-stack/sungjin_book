#!/usr/bin/env python
"""IDML Spreads/*.xml → typst decorations 파일 자동 생성.

목적: 한 spread(여기선 12/13)의 모든 자유 frame을 typst place(rect/box/...)로
재구성 → main.typ background에 부착 → 원본과 시각 diff.

좌표계 누적 (중요):
  Document
  └─ Spread (ItemTransform: 큰 y offset 가능 — 페이지 시퀀스에 따라)
     ├─ Page (ItemTransform: spread 내 위치, facing-pages: 좌측 페이지는 -page_w)
     └─ frames (Rectangle / TextFrame / Polygon / GraphicLine / Group)
        └─ ItemTransform (frame-local 기준점)
           └─ PathPointType Anchor (frame-local 좌표, 보통 음수 가능)

page-local x = (spread_xform.tx + frame_xform.tx + path_anchor.x) - page_origin.x
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

ROOT = Path(__file__).resolve().parent.parent.parent

# ── 색 보정 룰 (extract-idml-to-typst.py와 동일) ────────────────────────────
_JAPAN_COLOR_LUT = {
    (100, 0,   0,   0):   "#0091db",  # 시안 100%
    (0,   100, 0,   0):   "#e4007f",
    (0,   0,   100, 0):   "#fff100",
    (100, 100, 0,   0):   "#1d2088",
    (0,   100, 100, 0):   "#e60012",
    (100, 0,   100, 0):   "#009944",
    (0,   0,   0,   100): "#1a1a1a",
}

def cmyk_to_hex(c, m, y, k):
    key = (round(c), round(m), round(y), round(k))
    if key in _JAPAN_COLOR_LUT:
        return _JAPAN_COLOR_LUT[key]
    r = (1 - c/100) * (1 - k/100)
    g = (1 - m/100) * (1 - k/100)
    b = (1 - y/100) * (1 - k/100)
    return "#{:02x}{:02x}{:02x}".format(round(r*255), round(g*255), round(b*255))


def parse_color_ref(ref: str, swatches: dict[str, str]) -> str | None:
    """'Color/Black' 'Color/Paper' 'Color/C=100 M=0 Y=0 K=0' 'Swatch/None' 등 →
    typst color literal 'rgb(\"#...\")' 또는 'none'.
    """
    if not ref:
        return None
    if ref in ("Swatch/None", "n", "None"):
        return "none"
    if ref.endswith("/Black"):
        return 'rgb("#000000")'
    if ref.endswith("/Paper"):
        return 'rgb("#ffffff")'
    if ref.endswith("/Registration"):
        return 'rgb("#000000")'
    # CMYK 직접
    import re
    m = re.search(r"C=(\d+(?:\.\d+)?)\s+M=(\d+(?:\.\d+)?)\s+Y=(\d+(?:\.\d+)?)\s+K=(\d+(?:\.\d+)?)", ref)
    if m:
        return f'rgb("{cmyk_to_hex(*map(float, m.groups()))}")'
    # swatches 사전에서 검색 (이름이 들어있을 수도)
    name = ref.replace("Color/", "")
    if name in swatches:
        return swatches[name]
    return None


def load_swatches(graphic_xml: Path) -> dict[str, str]:
    """Resources/Graphic.xml의 Color 견본 → {name: 'rgb(\"#...\")'}"""
    swatches: dict[str, str] = {}
    if not graphic_xml.exists():
        return swatches
    t = ET.parse(graphic_xml)
    for el in t.getroot().iter():
        tag = el.tag.split("}")[-1] if "}" in el.tag else el.tag
        if tag != "Color":
            continue
        name = el.get("Name", "")
        space = el.get("Space", "")
        val = el.get("ColorValue", "")
        if not name or not val:
            continue
        try:
            if space == "CMYK":
                c, m, y, k = map(float, val.split())
                swatches[name] = f'rgb("{cmyk_to_hex(c, m, y, k)}")'
            elif space == "RGB":
                r, g, b = map(float, val.split())
                swatches[name] = f"rgb({int(r)}, {int(g)}, {int(b)})"
        except (ValueError, IndexError):
            pass
    return swatches


# ── XML 도구 ─────────────────────────────────────────────────────────────
def localtag(el):
    return el.tag.split("}")[-1] if "}" in el.tag else el.tag


def parse_xform(s: str):
    if not s:
        return (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)
    try:
        parts = list(map(float, s.split()))
        return tuple(parts + [0.0] * (6 - len(parts)))[:6]
    except ValueError:
        return (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)


def get_pathpoints_direct(el) -> list[tuple[float, float]]:
    pts = []
    for c in el:
        if localtag(c) == "Properties":
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


def get_story_text(stories_dir: Path, story_id: str) -> str:
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
            elif localtag(el) == "Br":
                text += "\n"
        return text.strip()
    except ET.ParseError:
        return ""


# ── Spread 분석 ──────────────────────────────────────────────────────────
def extract_spread(spread_path: Path, stories_dir: Path, swatches: dict[str, str]) -> dict:
    tree = ET.parse(spread_path)
    root = tree.getroot()

    spread_el = None
    for c in root.iter():
        if localtag(c) == "Spread" and c.get("Self"):
            spread_el = c
            break
    if spread_el is None:
        return {"pages": [], "items": []}

    spread_xf = parse_xform(spread_el.get("ItemTransform", ""))

    pages = []
    for c in spread_el:
        if localtag(c) == "Page":
            xf = parse_xform(c.get("ItemTransform", ""))
            bounds = c.get("GeometricBounds", "0 0 850 624")
            try:
                top, left, bottom, right = map(float, bounds.split())
            except ValueError:
                top, left, bottom, right = 0, 0, 850, 624
            pages.append({
                "name": c.get("Name", "?"),
                "self": c.get("Self"),
                "doc_origin": (spread_xf[4] + xf[4], spread_xf[5] + xf[5]),
                "width": right - left,
                "height": bottom - top,
            })

    items = []

    def walk(el, parent_tx, parent_ty, group_id=""):
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
                items.append({
                    "tag": tag,
                    "self": c.get("Self", ""),
                    "group": group_id,
                    "fill_ref": c.get("FillColor", ""),
                    "stroke_ref": c.get("StrokeColor", ""),
                    "stroke_w": c.get("StrokeWeight", ""),
                    "fill_tint": c.get("FillTint", ""),
                    "doc_tx": tx, "doc_ty": ty,
                    "bbox": bbox,
                    "story": story,
                    "text": get_story_text(stories_dir, story) if story else "",
                })
            if tag == "Group":
                walk(c, tx, ty, c.get("Self", "")[:8])
            else:
                walk(c, tx, ty, group_id)

    walk(spread_el, spread_xf[4], spread_xf[5])

    # 각 item에 페이지 할당 + page-local 좌표
    for it in items:
        if not it["bbox"]:
            it["page"] = None
            continue
        bx0, by0, bx1, by1 = it["bbox"]
        cx = it["doc_tx"] + (bx0 + bx1) / 2
        cy = it["doc_ty"] + (by0 + by1) / 2
        assigned = None
        for p in pages:
            ox, oy = p["doc_origin"]
            if ox <= cx < ox + p["width"] and oy <= cy < oy + p["height"]:
                assigned = p
                break
        if assigned is None:
            # 가장 가까운 페이지
            assigned = min(pages,
                           key=lambda p: abs(p["doc_origin"][0] + p["width"]/2 - cx))
        ox, oy = assigned["doc_origin"]
        it["page"] = assigned["name"]
        it["page_x"] = it["doc_tx"] + bx0 - ox  # 좌상단 x (pt)
        it["page_y"] = it["doc_ty"] + by0 - oy
        it["w"] = bx1 - bx0
        it["h"] = by1 - by0

    return {"pages": pages, "items": items, "spread_xf": spread_xf}


# ── typst 생성 ───────────────────────────────────────────────────────────
def render_frame_place(it: dict, swatches: dict[str, str], label_text_threshold: int = 50) -> str:
    """frame 1개 → typst #place(rect(...)) 한 줄."""
    fill = parse_color_ref(it["fill_ref"], swatches)
    stroke_c = parse_color_ref(it["stroke_ref"], swatches)
    sw = it["stroke_w"]
    try:
        sw_pt = float(sw) if sw else 0
    except ValueError:
        sw_pt = 0
    x, y, w, h = it["page_x"], it["page_y"], it["w"], it["h"]

    stroke_arg = f"stroke: {sw_pt}pt + {stroke_c}" if (stroke_c and stroke_c != "none" and sw_pt > 0) else "stroke: none"
    fill_arg = f"fill: {fill}" if (fill and fill != "none") else "fill: none"

    text = it.get("text", "")
    is_label = it["tag"] == "TextFrame" and text and len(text) < label_text_threshold
    if is_label:
        body = (f", inset: 0pt, align(center + horizon, "
                f'text(size: 8pt, fill: rgb("#222"))[{_escape_typst(text)}])')
    else:
        body = ""
    return (f"  #place(top + left, dx: {x:.2f}pt, dy: {y:.2f}pt, "
            f"rect(width: {w:.2f}pt, height: {h:.2f}pt, "
            f"{fill_arg}, {stroke_arg}{body}))")


def render_decorations_typ(spread_data: dict, swatches: dict[str, str], page_name: str) -> str:
    """단일 page standalone 검증용 (이전 동작 유지)."""
    pages = {p["name"]: p for p in spread_data["pages"]}
    if page_name not in pages:
        raise ValueError(f"page {page_name} not found")
    page = pages[page_name]
    pw, ph = page["width"], page["height"]
    lines = [
        "// IDML decorations 자동 추출 — 검증용 standalone 페이지",
        f"// Spread page Name={page_name}",
        f"#set page(width: {pw:.2f}pt, height: {ph:.2f}pt, margin: 0pt)",
        "",
    ]
    items = sorted([it for it in spread_data["items"]
                    if it.get("page") == page_name and it["bbox"]],
                   key=lambda it: (it["page_y"], it["page_x"]))
    for it in items:
        lines.append(f"// {it['self']} {it['tag']} {it.get('group','')} text_len={len(it.get('text',''))}")
        lines.append("#" + render_frame_place(it, swatches).lstrip())
    return "\n".join(lines)


def render_all_decorations(all_pages: dict, swatches: dict[str, str]) -> str:
    """전체 spread의 page → typst 컨텐트 dict.

    출력:
      #let page-decorations = (
        "12": { place(...) place(...) },
        "13": { place(...) },
        ...
      )
    main.typ에서 `page-decorations.at(str(pn), default: none)` 식으로 lookup.
    """
    lines = [
        "// IDML decorations — 모든 spread 자동 추출",
        "// 키: page name (str). 값: typst content (place() 호출 모음).",
        "// main.typ background에서 lookup하여 본문 식자와 합성.",
        "",
        "#let page-decorations = (",
    ]
    for page_name in sorted(all_pages.keys(), key=lambda s: (len(s), s)):
        items = all_pages[page_name]
        if not items:
            continue
        lines.append(f'  "{page_name}": [')
        items_sorted = sorted(items, key=lambda it: (it["page_y"], it["page_x"]))
        for it in items_sorted:
            lines.append(render_frame_place(it, swatches))
        lines.append("  ],")
    lines.append(")")
    return "\n".join(lines)


def _escape_typst(s: str) -> str:
    """Typst content escape — 대괄호/백슬래시 등."""
    out = []
    for ch in s:
        if ch in "[]#*_`<>@":
            out.append("\\" + ch)
        elif ch == "\n":
            out.append(" ")
        else:
            out.append(ch)
    return "".join(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("spread", nargs="?", default=None,
                    help="단일 spread 파일명 (또는 --all)")
    ap.add_argument("--all", action="store_true",
                    help="전체 spread 처리해서 decorations.typ 생성")
    ap.add_argument("--page", default=None, help="페이지 Name (단일 spread 모드)")
    ap.add_argument("--out", default=None, help="출력 .typ 경로")
    ap.add_argument("--preset", default="simply-classic")
    args = ap.parse_args()

    work_dir = ROOT / "experiments" / "idml-recon" / args.preset
    stories = work_dir / "Stories"
    graphic = work_dir / "Resources" / "Graphic.xml"
    spreads_dir = work_dir / "Spreads"

    swatches = load_swatches(graphic)
    print(f"[decor] swatches: {len(swatches)}")

    if args.all:
        all_pages: dict[str, list] = {}
        n_spreads = 0
        for sp in sorted(spreads_dir.glob("Spread_*.xml")):
            try:
                data = extract_spread(sp, stories, swatches)
            except ET.ParseError as e:
                print(f"  parse err {sp.name}: {e}")
                continue
            n_spreads += 1
            for it in data["items"]:
                page = it.get("page")
                if not page or not it["bbox"]:
                    continue
                all_pages.setdefault(page, []).append(it)
        code = render_all_decorations(all_pages, swatches)
        out_path = ROOT / "typst-templates" / "edu" / "presets" / args.preset / "decorations.typ"
        out_path.write_text(code, encoding="utf-8")
        n_items = sum(len(v) for v in all_pages.values())
        print(f"[decor] spreads scanned: {n_spreads}")
        print(f"[decor] pages with deco: {len(all_pages)}")
        print(f"[decor] total frames:    {n_items}")
        print(f"[decor] → {out_path}")
        return

    if not args.spread:
        print("usage: extract-decorations.py [spread.xml] [--page N] | --all", file=sys.stderr)
        sys.exit(2)

    sp = Path(args.spread)
    if not sp.is_absolute() and not sp.exists():
        sp = spreads_dir / args.spread
    data = extract_spread(sp, stories, swatches)
    print(f"[decor] pages in spread: {[p['name'] for p in data['pages']]}")
    print(f"[decor] items extracted: {len(data['items'])}")
    page = args.page or data["pages"][0]["name"]
    code = render_decorations_typ(data, swatches, page)
    out = Path(args.out) if args.out else (work_dir / f"decor-page-{page}.typ")
    out.write_text(code, encoding="utf-8")
    print(f"[decor] → {out}")


if __name__ == "__main__":
    main()
