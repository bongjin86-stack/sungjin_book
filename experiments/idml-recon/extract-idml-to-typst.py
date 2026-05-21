#!/usr/bin/env python
"""IDML → typst preset 자동 추출기 (첫 버전).

성진_2027_공감연구소_심플리_고전소설.idml 같은 IDML 파일을 받아서
typst-templates/edu/presets/{slug}/ 안의 paragraph-styles/colors/master-pages.typ를 자동 생성.

사용:
  python extract-idml-to-typst.py simply-classic ../../성진_2027_공감연구소_심플리_고전소설.idml

매핑 룰 (첫 버전, 누적):
  - CMYK → RGB
  - mm 단위 유지 (InDesign 기본 단위 따라가기)
  - 1/1000 em tracking → typst em
  - FontStyle(예: "08 Eb") → typst weight name
  - 폰트 미보유 → 한국형 매핑 (Noto Sans/Serif KR)
"""
from __future__ import annotations

import argparse
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parent.parent.parent  # sungjin_book

# ── 보정 룰 ─────────────────────────────────────────────────────────────────
FONT_MAP = {
    # 산스 — 한국 무료 라이센스 Pretendard 우선
    "Sandoll 고딕Neo1": '("Pretendard", "Noto Sans KR")',
    "Sandoll 고딕Neo2": '("Pretendard", "Noto Sans KR")',
    "AdobeGothicStd-Bold": '("Pretendard", "Noto Sans KR")',
    # 명조 — Noto Serif KR
    "Sandoll 명조Neo1": '("Noto Serif KR",)',
    "Sandoll 명조Neo2": '("Noto Serif KR",)',
    "윤명조140": '("Noto Serif KR",)',
    "윤명조150": '("Noto Serif KR",)',
    "AdobeMyungjoStd-Medium": '("Noto Serif KR",)',
}

# 자간 표준 범위 (em 단위) — typography.typ와 일치
TRACKING_RANGE = (-0.08, 0.02)
# line-height 비율 범위
LINE_HEIGHT_RANGE = (1.20, 2.00)
# 본문 폰트 크기 범위 (pt)
SIZE_RANGE = (6.0, 72.0)


def validate_spec(name: str, spec: dict) -> list[str]:
    """spec dict가 typography 표준 범위 안인지 검사. 위반 메시지 리스트 반환."""
    warnings = []

    # tracking (em 단위 문자열, 예: "-0.04em")
    t = spec.get("tracking", "")
    if isinstance(t, str) and t.endswith("em"):
        try:
            v = float(t[:-2])
            if v < TRACKING_RANGE[0] or v > TRACKING_RANGE[1]:
                warnings.append(f"  tracking {v}em 표준 범위 {TRACKING_RANGE} 밖")
        except ValueError:
            pass

    # size + leading (pt 단위 문자열)
    s = spec.get("size", "")
    l = spec.get("leading", "")
    s_pt = l_pt = None
    if isinstance(s, str) and s.endswith("pt"):
        try:
            s_pt = float(s[:-2])
            if s_pt < SIZE_RANGE[0] or s_pt > SIZE_RANGE[1]:
                warnings.append(f"  size {s_pt}pt 표준 범위 {SIZE_RANGE} 밖")
        except ValueError:
            pass
    if isinstance(l, str) and l.endswith("pt"):
        try:
            l_pt = float(l[:-2])
        except ValueError:
            pass

    if s_pt and l_pt:
        ratio = l_pt / s_pt
        if ratio < LINE_HEIGHT_RANGE[0] or ratio > LINE_HEIGHT_RANGE[1]:
            warnings.append(
                f"  line-height {ratio:.2f} (leading {l_pt}pt / size {s_pt}pt) "
                f"표준 범위 {LINE_HEIGHT_RANGE} 밖"
            )

    return warnings

# IDML FontStyle → typst weight
WEIGHT_MAP = {
    "01 Th": "thin",
    "02 UL": "extralight",
    "03 L":  "light",
    "04 RG": "regular",
    "04 R":  "regular",
    "05 M":  "medium",
    "06 SB": "semibold",
    "07 B":  "bold",
    "08 EB": "extrabold",
    "08 Eb": "extrabold",
    "09 H":  "black",
    "Regular": "regular",
    "Bold": "bold",
    "Medium": "medium",
    "Light": "light",
    "Semi Bold": "semibold",
    "Italic": "regular",  # style: italic 별도 처리
    "Bold Italic": "bold",
}

ALIGN_MAP = {
    "LeftAlign": "left",
    "RightAlign": "right",
    "CenterAlign": "center",
    "FullyJustified": "justify",
    "LeftJustified": "justify",
    "RightJustified": "justify",
    "CenterJustified": "justify",
}


# Japan Color 2001 Coated 프로파일 근사 LUT.
# 단순 수학 CMYK→RGB 변환은 인쇄 색공간과 차이 큼. 가장 빈도 높은 색만 보정.
# 그 외는 단순 수학 폴백.
_JAPAN_COLOR_LUT = {
    (100, 0,   0,   0):   "#0091db",  # 시안 100% (단순 변환 #00ffff)
    (0,   100, 0,   0):   "#e4007f",  # 마젠타 100%
    (0,   0,   100, 0):   "#fff100",  # 옐로 100%
    (100, 100, 0,   0):   "#1d2088",  # 청람 (블루)
    (0,   100, 100, 0):   "#e60012",  # 빨강
    (100, 0,   100, 0):   "#009944",  # 녹색
    (0,   0,   0,   100): "#1a1a1a",  # 흑색 (인쇄 K100은 완전 검정 아님)
}

def cmyk_to_rgb_hex(c: float, m: float, y: float, k: float) -> str:
    """CMYK 0~100% → #RRGGBB. Japan Color 2001 LUT 우선, 폴백은 단순 수학."""
    key = (round(c), round(m), round(y), round(k))
    if key in _JAPAN_COLOR_LUT:
        return _JAPAN_COLOR_LUT[key]
    r = (1 - c/100) * (1 - k/100)
    g = (1 - m/100) * (1 - k/100)
    b = (1 - y/100) * (1 - k/100)
    return "#{:02x}{:02x}{:02x}".format(round(r*255), round(g*255), round(b*255))


def parse_color(swatch_ref: str) -> str | None:
    """'Color/C=100 M=0 Y=0 K=0' → 'rgb("#0091e9")'"""
    if not swatch_ref:
        return None
    m = re.search(r'C=(\d+(?:\.\d+)?)\s+M=(\d+(?:\.\d+)?)\s+Y=(\d+(?:\.\d+)?)\s+K=(\d+(?:\.\d+)?)', swatch_ref)
    if m:
        hex_color = cmyk_to_rgb_hex(*map(float, m.groups()))
        return f'rgb("{hex_color}")'
    # 'Color/Black' 'Color/Paper' 등
    if swatch_ref.endswith("/Black"):
        return 'rgb("#000000")'
    if swatch_ref.endswith("/Paper"):
        return 'rgb("#ffffff")'
    return None


def get_child_value(el, name: str) -> str | None:
    for child in el.iter():
        tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
        if tag == name:
            return (child.text or '').strip() or None
    return None


def extract_paragraph_style(el) -> dict:
    """ParagraphStyle XML element → spec dict."""
    spec: dict[str, str] = {}

    # BasedOn (부모 스타일) — 후처리 시 상속 해결용. 일반 spec dict에 _based_on으로 저장
    based_on = get_child_value(el, "BasedOn")
    if based_on and not based_on.startswith("$ID"):
        # "ParagraphStyle/지문%3a지문" → "지문:지문"
        parent = based_on.replace("ParagraphStyle/", "").replace("%3a", ":")
        spec["_based_on"] = parent

    # font (자식 AppliedFont 또는 직접 attr)
    font = get_child_value(el, "AppliedFont")
    if font:
        spec["font"] = FONT_MAP.get(font, '("Noto Serif KR",)')

    # FontStyle → weight
    fstyle = el.get("FontStyle")
    if fstyle:
        w = WEIGHT_MAP.get(fstyle.strip(), "regular")
        spec["weight"] = f'"{w}"'
        if "Italic" in fstyle:
            spec["style"] = '"italic"'

    # size
    size = el.get("PointSize")
    if size:
        spec["size"] = f"{float(size)}pt"

    # color
    fill_ref = el.get("FillColor")
    fill = parse_color(fill_ref) if fill_ref else None
    if fill:
        spec["fill"] = fill

    # tracking (1/1000 em)
    tracking = el.get("Tracking")
    if tracking:
        v = float(tracking) / 1000
        if v != 0:
            spec["tracking"] = f"{v}em"

    # leading (자식 — Auto면 skip)
    leading = get_child_value(el, "Leading")
    if leading and leading != "Auto":
        try:
            spec["leading"] = f"{float(leading)}pt"
        except ValueError:
            pass

    # indents (InDesign 기본 단위는 mm — Preferences에서 결정. 일단 pt 가정)
    for attr, key in [
        ("LeftIndent", "left-indent"),
        ("RightIndent", "right-indent"),
        ("FirstLineIndent", "first-line-indent"),
    ]:
        v = el.get(attr)
        if v is not None:
            try:
                fv = float(v)
                if fv != 0:
                    spec[key] = f"{fv}pt"
            except ValueError:
                pass

    # space before/after
    for attr, key in [("SpaceBefore", "space-before"), ("SpaceAfter", "space-after")]:
        v = el.get(attr)
        if v is not None:
            try:
                fv = float(v)
                if fv != 0:
                    spec[key] = f"{fv}pt"
            except ValueError:
                pass

    # alignment (Justification)
    just = el.get("Justification")
    if just:
        spec["alignment"] = f'"{ALIGN_MAP.get(just, "left")}"'

    return spec


def resolve_inheritance(styles: dict[str, dict]) -> dict[str, dict]:
    """BasedOn 상속 처리. 부모 dict 위에 자식이 override하는 방식.
    부모 → 자식 토폴로지 따라 누적. 순환 참조 방어.
    """
    resolved: dict[str, dict] = {}

    def resolve(name: str, visiting: set) -> dict:
        if name in resolved:
            return resolved[name]
        if name in visiting:  # 순환 방어
            return {}
        if name not in styles:
            return {}
        visiting.add(name)
        own = {k: v for k, v in styles[name].items() if k != "_based_on"}
        parent_name = styles[name].get("_based_on")
        merged = {}
        if parent_name:
            merged.update(resolve(parent_name, visiting))
        merged.update(own)  # 자식 override 우선
        visiting.discard(name)
        resolved[name] = merged
        return merged

    for name in styles:
        resolve(name, set())
    return resolved


def extract_styles_xml(styles_xml: Path) -> tuple[dict[str, dict], dict[str, dict]]:
    tree = ET.parse(styles_xml)
    root = tree.getroot()
    paras: dict[str, dict] = {}
    chars: dict[str, dict] = {}
    for el in root.iter():
        tag = el.tag.split('}')[-1] if '}' in el.tag else el.tag
        if tag == "ParagraphStyle":
            name = el.get("Name", "")
            if not name or name.startswith("$ID"):
                continue
            paras[name] = extract_paragraph_style(el)
        elif tag == "CharacterStyle":
            name = el.get("Name", "")
            if not name or name.startswith("$ID"):
                continue
            # CharacterStyle도 같은 속성 (단락 옵션 제외)
            chars[name] = extract_paragraph_style(el)
    # BasedOn 상속 적용
    paras = resolve_inheritance(paras)
    chars = resolve_inheritance(chars)
    return paras, chars


def extract_colors(graphic_xml: Path) -> dict[str, str]:
    """Graphic.xml의 명명된 Color swatch → {name: rgb(...)}"""
    tree = ET.parse(graphic_xml)
    colors: dict[str, str] = {}
    for el in tree.getroot().iter():
        tag = el.tag.split('}')[-1] if '}' in el.tag else el.tag
        if tag == "Color":
            name = el.get("Name", "")
            if not name or name.startswith("$ID") or name in ("Black", "Paper", "Registration"):
                continue
            # ColorValue: "C M Y K" 또는 "R G B" 공백 구분
            color_value = el.get("ColorValue", "")
            space = el.get("Space", "")
            if space == "CMYK" and color_value:
                try:
                    c, m, y, k = map(float, color_value.split())
                    colors[name] = f'rgb("{cmyk_to_rgb_hex(c, m, y, k)}")'
                except (ValueError, IndexError):
                    pass
            elif space == "RGB" and color_value:
                try:
                    r, g, b = map(float, color_value.split())
                    colors[name] = f'rgb({int(r)}, {int(g)}, {int(b)})'
                except (ValueError, IndexError):
                    pass
    return colors


def render_paragraph_styles_typ(paras: dict[str, dict], chars: dict[str, dict], idml_name: str) -> str:
    lines = [
        f"// IDML 자동 추출 — {idml_name}",
        "// extract-idml-to-typst.py 결과. 직접 편집보다 추출기 보정 룰 추가 권장.",
        "",
        "// ── Paragraph Styles ────────────────────────────────────────────────────────",
        "#let paragraph-styles = (",
    ]
    for name, spec in paras.items():
        lines.append(f'  "{name}": (')
        for k, v in spec.items():
            lines.append(f'    {k}: {v},')
        lines.append('  ),')
    lines.append(")")
    lines.append("")
    lines.append("// ── Character Styles ───────────────────────────────────────────────────────")
    lines.append("#let character-styles = (")
    for name, spec in chars.items():
        lines.append(f'  "{name}": (')
        for k, v in spec.items():
            lines.append(f'    {k}: {v},')
        lines.append('  ),')
    lines.append(")")
    return "\n".join(lines)


def extract_page_geometry(idml_dir: Path) -> tuple[float, float]:
    """첫 MasterSpread의 Page GeometricBounds에서 페이지 너비/높이 추출.
    GeometricBounds: "top left bottom right" (pt 단위)
    """
    for ms_path in sorted((idml_dir / "MasterSpreads").glob("*.xml")):
        t = ET.parse(ms_path)
        for el in t.getroot().iter():
            tag = el.tag.split('}')[-1] if '}' in el.tag else el.tag
            if tag == "Page":
                bounds = el.get("GeometricBounds", "")
                try:
                    top, left, bottom, right = map(float, bounds.split())
                    return (right - left, bottom - top)
                except (ValueError, IndexError):
                    pass
    return (595.0, 842.0)  # A4 폴백


def classify_frame_position(frame, page_w: float, page_h: float) -> str:
    """frame의 spread 절대 좌표 → 페이지+위치 카테고리.
    spread spine을 x=0으로 가정 (인디자인 facing pages 표준).

    반환: "{page}-{vertical}-{horizontal}" 예: "left-bottom-outer"
      page: left | right
      vertical: top | middle | bottom
      horizontal: outer | inner | body
    """
    if not frame["local_bbox"]:
        return "unknown"
    bx0, by0, bx1, by1 = frame["local_bbox"]
    # spread 절대 좌상단
    sx = frame["tx"] + bx0
    sy = frame["ty"] + by0
    w = bx1 - bx0
    h = by1 - by0
    cx = sx + w / 2  # spread 중심 x
    cy = sy + h / 2  # spread 중심 y

    # 페이지 분류 (spread x=0이 spine — IDML facing pages)
    if cx < 0:
        page = "left"
        # 좌측 페이지 페이지-상대 x (0=outside, page_w=spine)
        page_x = cx + page_w
    else:
        page = "right"
        # 우측 페이지 페이지-상대 x (0=spine, page_w=outside)
        page_x = cx

    # 페이지-상대 y (spread y 중앙=0 → 페이지 top=0)
    page_y = cy + page_h / 2

    # 수직 카테고리
    if page_y < page_h * 0.18:
        vertical = "top"
    elif page_y > page_h * 0.82:
        vertical = "bottom"
    else:
        vertical = "middle"

    # 수평 카테고리 (마진 폭은 페이지 너비의 25%로 가정)
    edge = page_w * 0.25
    if page == "left":
        # outside = 좌측 가장자리 (page_x 작은 쪽)
        if page_x < edge:
            horizontal = "outer"
        elif page_x > page_w - edge:
            horizontal = "inner"
        else:
            horizontal = "body"
    else:
        # outside = 우측 가장자리 (page_x 큰 쪽)
        if page_x > page_w - edge:
            horizontal = "outer"
        elif page_x < edge:
            horizontal = "inner"
        else:
            horizontal = "body"

    return f"{page}-{vertical}-{horizontal}"


def extract_master_spreads(idml_dir: Path) -> dict:
    """MasterSpread XML 안 TextFrame + Story 텍스트 + 위치 추출."""
    masters = {}
    for ms_path in sorted((idml_dir / "MasterSpreads").glob("*.xml")):
        t = ET.parse(ms_path)
        root = t.getroot()
        ms_name = None
        # 주의: IDML XML의 root wrapper도 tag가 "MasterSpread"임 (idPkg:MasterSpread).
        # Name 속성이 빈 wrapper는 skip하고 진짜 MasterSpread 찾기.
        for el in root.iter():
            tag = el.tag.split('}')[-1] if '}' in el.tag else el.tag
            if tag == "MasterSpread":
                name = el.get("Name")
                if name:
                    ms_name = name
                    break
        if not ms_name:
            continue

        frames = []
        for el in root.iter():
            tag = el.tag.split('}')[-1] if '}' in el.tag else el.tag
            if tag != "TextFrame":
                continue
            parent_story = el.get("ParentStory")
            item_xform = el.get("ItemTransform", "1 0 0 1 0 0")
            # PathPoint anchors → 사각형 모서리
            points = []
            for c in el.iter():
                ctag = c.tag.split('}')[-1] if '}' in c.tag else c.tag
                if ctag == "PathPointType":
                    anchor = c.get("Anchor", "")
                    try:
                        x, y = map(float, anchor.split())
                        points.append((x, y))
                    except ValueError:
                        pass
            # frame의 frame 좌표계 bbox
            local_bbox = None
            if points:
                xs = [p[0] for p in points]
                ys = [p[1] for p in points]
                local_bbox = (min(xs), min(ys), max(xs), max(ys))

            # ItemTransform: matrix "a b c d tx ty"
            try:
                m_parts = [float(x) for x in item_xform.split()]
            except ValueError:
                m_parts = [1, 0, 0, 1, 0, 0]
            a, b, c, d, tx, ty = m_parts + [0] * (6 - len(m_parts))

            # ParentStory 안 텍스트
            story_text = ""
            applied_para_style = None
            if parent_story:
                story_path = idml_dir / "Stories" / f"Story_{parent_story}.xml"
                if story_path.exists():
                    st = ET.parse(story_path)
                    for sel in st.getroot().iter():
                        stag = sel.tag.split('}')[-1] if '}' in sel.tag else sel.tag
                        if stag == "ParagraphStyleRange" and applied_para_style is None:
                            ps = sel.get("AppliedParagraphStyle", "")
                            # "ParagraphStyle/지문%3a지문_내어쓰기" → "지문:지문_내어쓰기"
                            if ps.startswith("ParagraphStyle/"):
                                applied_para_style = ps.replace(
                                    "ParagraphStyle/", ""
                                ).replace("%3a", ":")
                        if stag == "Content" and sel.text:
                            story_text += sel.text

            frames.append({
                "story_id": parent_story,
                "tx": tx, "ty": ty,
                "rotation_a": a, "rotation_b": b,  # 회전 판별용
                "local_bbox": local_bbox,
                "text": story_text.strip(),
                "applied_para_style": applied_para_style,
            })
        masters[ms_name] = {"frames": frames}
    return masters


def render_master_spreads_dump(masters: dict, idml_name: str, page_w: float, page_h: float) -> str:
    """추출 결과를 사람이 읽기 좋게 dump + 위치 분류."""
    lines = [
        f"# IDML 자동 추출 — {idml_name}",
        f"# 페이지 크기: {page_w:.2f} × {page_h:.2f} pt ({page_w*25.4/72:.1f} × {page_h*25.4/72:.1f} mm)",
        "# Master Spread별 TextFrame + Story 콘텐츠 + 위치 + 분류.",
        "",
    ]
    for ms_name, ms_data in masters.items():
        lines.append(f"## master: {ms_name}")
        for i, f in enumerate(ms_data["frames"]):
            position = classify_frame_position(f, page_w, page_h)
            lines.append(f"  - frame {i+1}: [{position}]")
            lines.append(f"      text: {f['text']!r}")
            lines.append(f"      applied-style: {f['applied_para_style']}")
            lines.append(f"      tx: {f['tx']:.2f}  ty: {f['ty']:.2f}")
            if f["local_bbox"]:
                lines.append(
                    f"      local-bbox: "
                    f"({f['local_bbox'][0]:.2f}, {f['local_bbox'][1]:.2f}) "
                    f"→ ({f['local_bbox'][2]:.2f}, {f['local_bbox'][3]:.2f})"
                )
            a, b = f["rotation_a"], f["rotation_b"]
            if abs(a) < 0.01 and abs(b) > 0.9:
                rot = "vertical (90°)" if b > 0 else "vertical (-90°)"
            elif abs(a - 1) < 0.01:
                rot = "horizontal (0°)"
            else:
                import math
                rot = f"rotated ({math.degrees(math.atan2(b, a)):.1f}°)"
            lines.append(f"      rotation: {rot}")
        lines.append("")
    return "\n".join(lines)


def _slug(name: str) -> str:
    """master 이름 → typst 식별자 (한글 OK, 특수문자 변환)."""
    return name.replace("-", "_").replace("*", "star").replace(" ", "_").replace("(", "").replace(")", "")


def _typst_str(s: str) -> str:
    """파이썬 string → typst string literal (따옴표 + escape)."""
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'


def render_master_pages_typ(masters: dict, page_w: float, page_h: float, idml_name: str) -> str:
    """master spread → typst master-pages.typ 자동 생성.
    frame 분류 결과를 보고 footer / outer-label 자동 박음.
    """
    lines = [
        f"// IDML 자동 추출 — {idml_name}",
        "// MasterSpread별 master-spec 자동 생성. 직접 편집 대신 추출기 보정 룰 추가 권장.",
        "",
        '#import "/typst-templates/edu/design-system/master-page.typ": master-spec',
        '#import "/typst-templates/edu/presets/simply-classic/colors.typ": swatches',
        "",
        "// 메인 청 (CMYK 시안 100% — Japan Color 2001 근사)",
        '#let accent-strong = swatches.at("C=100 M=0 Y=0 K=0", default: rgb("#0091db"))',
        "",
    ]

    for ms_name, ms_data in masters.items():
        footers_left = []
        footers_right = []
        outer_labels_left = []
        outer_labels_right = []
        for f in ms_data["frames"]:
            pos = classify_frame_position(f, page_w, page_h)
            if "bottom" in pos:
                if pos.startswith("left"):
                    footers_left.append(f)
                else:
                    footers_right.append(f)
            elif "top-outer" in pos:
                if pos.startswith("left"):
                    outer_labels_left.append(f)
                else:
                    outer_labels_right.append(f)

        slug = _slug(ms_name)
        lines.append(f"// Master: {ms_name}")
        lines.append(f"#let master_{slug} = master-spec(")
        lines.append(f"  width: {page_w:.2f}pt,")
        lines.append(f"  height: {page_h:.2f}pt,")
        lines.append("  margin: (inside: 56.69pt, outside: 141.73pt, top: 56.69pt, bottom: 56.69pt),")
        lines.append("  header: none,")

        # 푸터 (좌/우 미러)
        if footers_left or footers_right:
            left_text = footers_left[0]["text"] if footers_left else ""
            right_text = footers_right[0]["text"] if footers_right else ""
            lines.append("  footer: context {")
            lines.append("    let pn = counter(page).get().at(0)")
            lines.append("    let is-even = calc.rem(pn, 2) == 0")
            lines.append("    let body = if is-even {")
            lines.append(f'      text(font: ("Noto Sans KR",), size: 9pt)[#pn#h(1.5em){left_text}]')
            lines.append("    } else {")
            lines.append(f'      text(font: ("Noto Sans KR",), size: 9pt)[{right_text}#h(1.5em)#pn]')
            lines.append("    }")
            lines.append("    align(if is-even { left } else { right })[#body]")
            lines.append("  },")
            lines.append("  footer-descent: 8mm,")

        # outer 라벨 (좌측 페이지에 박힘)
        if outer_labels_left:
            # ty 정렬: 위(작은 ty) → 아래
            outer_labels_left.sort(key=lambda f: f["ty"])
            top_text = outer_labels_left[0]["text"]  # 위 = PART
            sub_text = outer_labels_left[1]["text"] if len(outer_labels_left) > 1 else ""
            lines.append("  background: context {")
            lines.append("    let pn = counter(page).get().at(0)")
            lines.append("    let is-even = calc.rem(pn, 2) == 0")
            lines.append("    if is-even {")
            lines.append("      place(left + top, dx: 8mm, dy: 18mm)[")
            lines.append(f'        #text(font: ("Noto Sans KR",), size: 10pt, weight: "bold", fill: accent-strong)[{top_text}]')
            if sub_text:
                lines.append("        \\")
                lines.append(f'        #text(font: ("Noto Sans KR",), size: 9pt)[{sub_text}]')
            lines.append("      ]")
            lines.append("    }")
            lines.append("  },")

        lines.append(")")
        lines.append("")

    # 본문 페이지 master를 main으로 (첫 master 또는 이름 휴리스틱)
    main_candidate = None
    for ms_name in masters:
        if "파트" in ms_name or "에피소드" in ms_name or "본문" in ms_name:
            main_candidate = ms_name
            break
    if not main_candidate:
        main_candidate = next(iter(masters.keys()), None)
    if main_candidate:
        lines.append(f"// 기본 main master — 본문 페이지용 (이름 휴리스틱)")
        lines.append(f"#let main-master = master_{_slug(main_candidate)}")

    return "\n".join(lines)


def render_colors_typ(colors: dict[str, str], idml_name: str) -> str:
    lines = [
        f"// IDML 자동 추출 — {idml_name}",
        "// 인디자인 Color Swatches (CMYK → RGB 변환).",
        "",
        "#let swatches = (",
    ]
    for name, value in colors.items():
        lines.append(f'  "{name}": {value},')
    lines.append(")")
    return "\n".join(lines)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("preset_slug", help="presets/{이 이름}/ 디렉토리 안에 생성")
    ap.add_argument("idml_path", help=".idml 파일 경로 (project root 상대 또는 절대)")
    args = ap.parse_args()

    idml_path = Path(args.idml_path)
    if not idml_path.is_absolute():
        idml_path = (Path.cwd() / idml_path).resolve()
    if not idml_path.exists():
        print(f"[extract] not found: {idml_path}", file=sys.stderr)
        return 1

    # 임시 추출 디렉토리
    work_dir = ROOT / "experiments" / "idml-recon" / args.preset_slug
    work_dir.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(idml_path, "r") as z:
        z.extractall(work_dir)

    # 스타일 + 색 견본 추출
    paras, chars = extract_styles_xml(work_dir / "Resources" / "Styles.xml")
    colors = extract_colors(work_dir / "Resources" / "Graphic.xml")

    # 출력 디렉토리: typst-templates/edu/presets/{slug}/
    out_dir = ROOT / "typst-templates" / "edu" / "presets" / args.preset_slug
    out_dir.mkdir(parents=True, exist_ok=True)

    (out_dir / "paragraph-styles.typ").write_text(
        render_paragraph_styles_typ(paras, chars, idml_path.name),
        encoding="utf-8",
    )
    (out_dir / "colors.typ").write_text(
        render_colors_typ(colors, idml_path.name),
        encoding="utf-8",
    )

    # Master spread 추출 (TextFrame + Story 콘텐츠 + 위치) + 페이지 기하
    page_w, page_h = extract_page_geometry(work_dir)
    masters = extract_master_spreads(work_dir)
    (out_dir / "master-spreads-dump.txt").write_text(
        render_master_spreads_dump(masters, idml_path.name, page_w, page_h),
        encoding="utf-8",
    )
    (out_dir / "master-pages.typ").write_text(
        render_master_pages_typ(masters, page_w, page_h, idml_path.name),
        encoding="utf-8",
    )

    # 표준 범위 검증 — typography.typ의 atom 범위와 일치
    total_warnings = 0
    for name, spec in {**paras, **chars}.items():
        ws = validate_spec(name, spec)
        if ws:
            total_warnings += len(ws)
            print(f"[validate] {name}:")
            for w in ws:
                print(w)

    print(f"[extract] paragraph styles: {len(paras)}")
    print(f"[extract] character styles: {len(chars)}")
    print(f"[extract] color swatches:  {len(colors)}")
    print(f"[extract] master spreads:  {len(masters)}")
    n_frames = sum(len(m['frames']) for m in masters.values())
    print(f"[extract] master frames:   {n_frames}")
    print(f"[validate] 표준 범위 위반: {total_warnings}건 (위 참고)")
    print(f"[extract] → {out_dir}/paragraph-styles.typ")
    print(f"[extract] → {out_dir}/colors.typ")
    print(f"[extract] → {out_dir}/master-spreads-dump.txt")
    return 0


if __name__ == "__main__":
    sys.exit(main())
