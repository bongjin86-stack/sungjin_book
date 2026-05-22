#!/usr/bin/env python
"""simply-classic IDML 역할/레이아웃 프로파일링.

목표: "IDML을 예쁘게 읽었다"가 아니라 "이 IDML로 다시 찍었을 때 원본과 겹쳐 보이는가" 검증.

산출물 (4개):
  1. experiments/idml-recon/simply-classic/role-profile-report.md  — 사람용 보고서
  2. typst-templates/edu/presets/simply-classic/preset-role-map.json — 역할 매핑
  3. typst-templates/edu/presets/simply-classic/layout-profile.json — 레이아웃 규칙
  4. 대표 페이지(원본 p13) PNG vs 우리 PNG vs diff PNG — 시각 검증

CLI:
  python profile-idml-layout.py
"""
from __future__ import annotations

import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path
from xml.etree import ElementTree as ET

try:
    sys.stdout.reconfigure(encoding="utf-8")
except AttributeError:
    pass


ROOT = Path(__file__).resolve().parent.parent.parent
PRESET = "simply-classic"
WORK_DIR = ROOT / "experiments" / "idml-recon" / PRESET
PRESET_DIR = ROOT / "typst-templates" / "edu" / "presets" / PRESET


# ── role 정의 ──────────────────────────────────────────────────────────────
#
# 각 role에 대해 (1) 정확 매칭 이름과 (2) 키워드 휴리스틱을 분리해 박는다.
# 정확 매칭은 IDML에서 가장 확실한 카논 이름. 휴리스틱은 변형 이름 흡수.
#
# role 분류는 leaf 토큰(":" 마지막 segment) 기준 — '문제와선지:문제'에 '선지'가
# 포함되니 마지막 단어만 본다 (extract-story-content.py와 동일 룰).

ROLE_DEFINITIONS = [
    {
        "role": "question.number",
        "exact": ["문제와선지:번호", "번호(NEW)", "번호"],
        "keyword_leaf": ["번호", "문제번호", "문제숫자"],
    },
    {
        "role": "question.stem",
        "exact": ["문제와선지:문제", "문제명조", "문제(NEW)", "문제 Copy"],
        "keyword_leaf_re": [r"^문제$", r"^문제명조$", r"^문제\(.*\)$", r"^문제 Copy$"],
    },
    {
        "role": "question.choice",
        "exact": ["문제와선지:선지", "선지(NEW)", "선지"],
        "keyword_leaf_re": [r"^선지(\([^)]*\))?$"],
    },
    {
        "role": "boki.body",
        "exact": [
            "문제와선지:보기",
            "문제와선지:보기 (가운데)",
            "문제와선지:보기 (들여쓰기X)",
            "문제와선지:보기(내)",
            "보기",
            "보기(NEW)",
            "보기명조",
            "보기내텍스트",
            "보기-고딕볼드",
            "문제:보기:보기",
        ],
        "keyword_leaf_re": [r"^보기"],
    },
    {
        "role": "passage.body",
        "exact": [
            "지문:지문",
            "지문 Copy",
            "지문:지문 내어쓰기",
            "지문:(가)",
            "지문:중략",
            "지문:앞부분의 줄거리",
            "지문:앞&중략부분의 줄거리",
            "지문-언내",
        ],
        "keyword_path_re": [r"^지문(:|$)"],
    },
    {
        "role": "passage.prompt",
        "exact": ["물음에답하시오", "지문:물음에답하시오"],
        "keyword_leaf_re": [r"^물음에답하시오$"],
    },
    {
        "role": "passage.source",
        "exact": ["STEP 1 & 공통:출처"],
        "keyword_leaf_re": [r"출처"],
    },
    {
        "role": "answer.key",
        "exact": ["빠른정답 그렙"],
        "keyword_path_re": [r"빠른정답"],
    },
]


def localtag(el):
    return el.tag.split("}")[-1] if "}" in el.tag else el.tag


def style_label(applied: str) -> str:
    """'ParagraphStyle/문제와선지%3a번호' → '문제와선지:번호'"""
    if applied.startswith("ParagraphStyle/"):
        applied = applied[len("ParagraphStyle/") :]
    return applied.replace("%3a", ":")


def leaf(name: str) -> str:
    """style 이름의 leaf 토큰 (':' 마지막 segment)."""
    return name.rsplit(":", 1)[-1] if ":" in name else name


def classify_role(name: str) -> tuple[str | None, str]:
    """ParagraphStyle 이름 → (role, 판단 근거).
    판단 근거: "exact: <이름>" / "leaf-keyword: <패턴>" / "path-keyword: <패턴>".
    role 없으면 (None, "unknown").
    """
    lf = leaf(name)
    for d in ROLE_DEFINITIONS:
        if name in d.get("exact", ()):
            return d["role"], f"exact: {name!r}"
    for d in ROLE_DEFINITIONS:
        for pat in d.get("keyword_leaf", ()):
            if pat == lf:
                return d["role"], f"leaf-keyword: {pat!r}"
        for pat in d.get("keyword_leaf_re", ()):
            if re.search(pat, lf):
                return d["role"], f"leaf-regex: {pat!r}"
        for pat in d.get("keyword_path_re", ()):
            if re.search(pat, name):
                return d["role"], f"path-regex: {pat!r}"
    return None, "unknown"


# ── ParagraphStyle 목록 수집 ───────────────────────────────────────────────
def collect_paragraph_styles() -> list[dict]:
    tree = ET.parse(WORK_DIR / "Resources" / "Styles.xml")
    styles: list[dict] = []
    for el in tree.getroot().iter():
        if localtag(el) != "ParagraphStyle":
            continue
        name = el.get("Name", "")
        if not name or name.startswith("$ID/[") or name.startswith("$ID/Default"):
            continue
        based_on = ""
        for child in el.iter():
            if localtag(child) == "BasedOn" and child.text:
                v = child.text.strip()
                if v and not v.startswith("$ID"):
                    based_on = style_label(v)
                break
        # 주요 속성
        size = el.get("PointSize") or ""
        font = ""
        for child in el.iter():
            if localtag(child) == "AppliedFont" and child.text:
                font = child.text.strip()
                break
        fill = el.get("FillColor", "")
        weight = el.get("FontStyle", "")
        # 이름은 그대로 보존 (Styles.xml의 Name 값 — '$ID/' 접두 가능)
        clean = name.replace("$ID/", "")
        role, reason = classify_role(clean)
        styles.append({
            "name": clean,
            "raw_name": name,
            "based_on": based_on,
            "font": font,
            "weight": weight,
            "size_pt": float(size) if size else None,
            "fill": fill,
            "role": role,
            "role_reason": reason,
        })
    return styles


# ── Story 콘텐츠 일부 추출 (역할 검증용) ────────────────────────────────────
def story_text_sample(story_id: str, limit: int = 60) -> str:
    sp = WORK_DIR / "Stories" / f"Story_{story_id}.xml"
    if not sp.exists():
        return ""
    try:
        tree = ET.parse(sp)
        text = ""
        for el in tree.getroot().iter():
            if localtag(el) == "Content" and el.text:
                text += el.text
                if len(text) > limit:
                    break
        return text[:limit]
    except ET.ParseError:
        return ""


# ── style 사용 빈도 수집 (Stories 전체) ─────────────────────────────────────
def collect_style_usage() -> Counter:
    """각 ParagraphStyle이 Stories에서 몇 번 등장하는지."""
    usage: Counter = Counter()
    for sp in (WORK_DIR / "Stories").glob("Story_*.xml"):
        try:
            tree = ET.parse(sp)
        except ET.ParseError:
            continue
        for el in tree.getroot().iter():
            if localtag(el) == "ParagraphStyleRange":
                applied = el.get("AppliedParagraphStyle", "")
                if applied:
                    name = style_label(applied).replace("$ID/", "")
                    usage[name] += 1
    return usage


# ── Spread 본문 프레임 분석 ─────────────────────────────────────────────────
def parse_xform(s: str) -> tuple[float, float, float, float, float, float]:
    if not s:
        return (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)
    try:
        parts = list(map(float, s.split()))
        return tuple(parts + [0.0] * (6 - len(parts)))[:6]
    except ValueError:
        return (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)


def get_path_bbox(el):
    pts = []
    for c in el.iter():
        if localtag(c) == "PathPointType":
            try:
                x, y = map(float, c.get("Anchor", "").split())
                pts.append((x, y))
            except ValueError:
                pass
    if not pts:
        return None
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    return (min(xs), min(ys), max(xs), max(ys))


def analyze_body_frames() -> dict:
    """Spreads/*.xml의 본문 TextFrame들 분석.
    리턴:
      {
        "page_size_pt": (W, H),
        "frames_per_page": Counter,
        "median_body_frame": {x, y, w, h, columns, gutter},
        "samples": [...]  # 첫 N개
      }
    """
    spreads_dir = WORK_DIR / "Spreads"
    page_w = page_h = None
    frames_per_page: Counter = Counter()
    frames_collected: list[dict] = []

    for sp in spreads_dir.glob("Spread_*.xml"):
        try:
            tree = ET.parse(sp)
        except ET.ParseError:
            continue
        root = tree.getroot()
        # 진짜 Spread element (Self 속성 있음)
        spread_el = None
        for c in root.iter():
            if localtag(c) == "Spread" and c.get("Self"):
                spread_el = c
                break
        if spread_el is None:
            continue
        spread_xf = parse_xform(spread_el.get("ItemTransform", ""))

        pages = []
        for c in spread_el:
            if localtag(c) == "Page":
                xf = parse_xform(c.get("ItemTransform", ""))
                bounds = c.get("GeometricBounds", "")
                try:
                    top, left, bottom, right = map(float, bounds.split())
                except ValueError:
                    continue
                pages.append({
                    "name": c.get("Name", "?"),
                    "doc_origin": (spread_xf[4] + xf[4], spread_xf[5] + xf[5]),
                    "width": right - left,
                    "height": bottom - top,
                    "applied_master": c.get("AppliedMaster", ""),
                })
                if page_w is None:
                    page_w = right - left
                    page_h = bottom - top

        # TextFrame들 (Group 내부도 포함)
        def walk(el, parent_tx, parent_ty):
            for c in el:
                tag = localtag(c)
                xf = parse_xform(c.get("ItemTransform", ""))
                tx = parent_tx + xf[4]
                ty = parent_ty + xf[5]
                if tag == "TextFrame":
                    bbox = get_path_bbox(c)
                    if bbox:
                        bx0, by0, bx1, by1 = bbox
                        cx = tx + (bx0 + bx1) / 2
                        cy = ty + (by0 + by1) / 2
                        # 페이지 할당
                        page = None
                        for p in pages:
                            ox, oy = p["doc_origin"]
                            if ox <= cx < ox + p["width"] and oy <= cy < oy + p["height"]:
                                page = p
                                break
                        if page:
                            # 페이지-로컬 좌표
                            ox, oy = page["doc_origin"]
                            px = tx + bx0 - ox
                            py = ty + by0 - oy
                            w = bx1 - bx0
                            h = by1 - by0

                            # TextFramePreference에서 컬럼 정보
                            cols = 1
                            gutter = 0.0
                            for tfp in c:
                                if localtag(tfp) == "TextFramePreference":
                                    cols = int(tfp.get("TextColumnCount", 1))
                                    gutter = float(tfp.get("TextColumnGutter", 0))
                                    break

                            frames_collected.append({
                                "spread": sp.name,
                                "page": page["name"],
                                "applied_master": page["applied_master"].replace("MasterSpread/", ""),
                                "self": c.get("Self", ""),
                                "story": c.get("ParentStory", ""),
                                "x": px, "y": py, "w": w, "h": h,
                                "columns": cols,
                                "gutter": gutter,
                            })
                if tag == "Group":
                    walk(c, tx, ty)
                else:
                    walk(c, tx, ty)

        walk(spread_el, spread_xf[4], spread_xf[5])
        frames_per_page[(sp.name, len(pages))] += 1

    # 본문 frame 후보 — "큰 frame" 휴리스틱:
    # 페이지 너비의 40% 이상 + 페이지 높이의 50% 이상.
    body_candidates = []
    if page_w and page_h:
        min_w = page_w * 0.30
        min_h = page_h * 0.45
        for f in frames_collected:
            if f["w"] >= min_w and f["h"] >= min_h:
                body_candidates.append(f)

    # 중간값 (대표 본문 frame)
    if body_candidates:
        xs = sorted(f["x"] for f in body_candidates)
        ys = sorted(f["y"] for f in body_candidates)
        ws = sorted(f["w"] for f in body_candidates)
        hs = sorted(f["h"] for f in body_candidates)
        gs = sorted(f["gutter"] for f in body_candidates)
        cs = Counter(f["columns"] for f in body_candidates)
        med = lambda L: L[len(L) // 2]
        median = {
            "x_pt": round(med(xs), 2),
            "y_pt": round(med(ys), 2),
            "w_pt": round(med(ws), 2),
            "h_pt": round(med(hs), 2),
            "columns_most_common": cs.most_common(1)[0][0],
            "gutter_pt_median": round(med(gs), 2),
        }
    else:
        median = None

    return {
        "page_size_pt": (round(page_w, 2) if page_w else None,
                         round(page_h, 2) if page_h else None),
        "page_size_mm": (round(page_w * 25.4 / 72, 2) if page_w else None,
                         round(page_h * 25.4 / 72, 2) if page_h else None),
        "total_text_frames": len(frames_collected),
        "body_candidates": len(body_candidates),
        "median_body_frame": median,
        "samples": body_candidates[:5],
        "applied_masters_used": dict(
            Counter(f["applied_master"] for f in body_candidates).most_common(10)
        ),
    }


# ── master ↔ chapter-type 매핑 휴리스틱 ─────────────────────────────────────
def classify_masters(layout: dict) -> dict:
    """마스터 이름 휴리스틱:
    - "파트", "1-파트", "3-에필로그" 등 → part-cover 후보
    - "같이하기", "혼자하기" → passages 본문
    - "빠른정답" → answer-key
    - "창고" → 부록 (현재 무시)
    """
    work_masters = (WORK_DIR / "MasterSpreads").glob("*.xml")
    master_names = []
    for ms in work_masters:
        try:
            tree = ET.parse(ms)
        except ET.ParseError:
            continue
        for el in tree.getroot().iter():
            if localtag(el) == "MasterSpread":
                name = el.get("Name", "")
                if name:
                    master_names.append(name)
                    break

    part_cover, passages, answer_key, other = [], [], [], []
    for m in master_names:
        if "빠른정답" in m or m.startswith("5-"):
            answer_key.append(m)
        elif "같이하기" in m or "혼자하기" in m or "본문" in m:
            passages.append(m)
        elif "파트1" in m or "에필로그" in m or m.startswith(("1-", "3-")) or m.startswith("파트"):
            part_cover.append(m)
        else:
            other.append(m)
    return {
        "part-cover": part_cover,
        "passages": passages,
        "answer-key": answer_key,
        "other": other,
    }


# ── 산출물 1: preset-role-map.json ───────────────────────────────────────
def build_role_map(styles: list[dict], masters: dict, usage: Counter) -> dict:
    roles: dict[str, list[str]] = defaultdict(list)
    role_evidence: dict[str, list[dict]] = defaultdict(list)
    for s in styles:
        if not s["role"]:
            continue
        roles[s["role"]].append(s["name"])
        role_evidence[s["role"]].append({
            "name": s["name"],
            "reason": s["role_reason"],
            "usage": usage.get(s["name"], 0),
            "size_pt": s["size_pt"],
            "font": s["font"],
            "weight": s["weight"],
        })
    # usage 많은 순으로 정렬 — 첫 후보가 가장 권위
    for r in role_evidence:
        role_evidence[r].sort(key=lambda x: -(x["usage"] or 0))
        roles[r] = [e["name"] for e in role_evidence[r]]
    return {
        "preset": PRESET,
        "version": 1,
        "masters": masters,
        "roles": dict(roles),
        "role_evidence": dict(role_evidence),
    }


# ── 산출물 2: layout-profile.json ────────────────────────────────────────
def build_layout_profile(body: dict) -> dict:
    return {
        "preset": PRESET,
        "version": 1,
        "page": {
            "width_pt": body["page_size_pt"][0],
            "height_pt": body["page_size_pt"][1],
            "width_mm": body["page_size_mm"][0],
            "height_mm": body["page_size_mm"][1],
        },
        "body_frame": body["median_body_frame"],
        "stats": {
            "total_text_frames": body["total_text_frames"],
            "body_candidate_frames": body["body_candidates"],
            "applied_masters_used_top10": body["applied_masters_used"],
        },
        "samples": body["samples"],
    }


# ── 산출물 3: role-profile-report.md ─────────────────────────────────────
def build_report(styles: list[dict], usage: Counter, body: dict,
                 masters: dict, role_map: dict, debug_diff: dict | None) -> str:
    lines: list[str] = []
    lines.append("# simply-classic IDML 역할/레이아웃 프로파일")
    lines.append("")
    lines.append("> 자동 생성 — `experiments/idml-recon/profile-idml-layout.py` 결과.")
    lines.append("> 목표: 원본 IDML 페이지와 Typst 재식자 페이지가 시각으로 겹치는지 검증.")
    lines.append("")

    lines.append("## 1. 페이지·본문 frame")
    lines.append("")
    w_pt, h_pt = body["page_size_pt"]
    w_mm, h_mm = body["page_size_mm"]
    lines.append(f"- 페이지 크기: **{w_pt} × {h_pt} pt** ({w_mm} × {h_mm} mm)")
    lines.append(f"- Spread 전체에서 추출한 TextFrame: {body['total_text_frames']}개")
    lines.append(f"- 본문 후보 frame (페이지 30%×45% 이상): {body['body_candidates']}개")
    if body["median_body_frame"]:
        m = body["median_body_frame"]
        lines.append("")
        lines.append("**대표 본문 frame (중간값)**:")
        lines.append(f"- 위치 (페이지-로컬): x={m['x_pt']}pt, y={m['y_pt']}pt")
        lines.append(f"- 크기: {m['w_pt']}pt × {m['h_pt']}pt")
        lines.append(f"- 단 수 (최빈): {m['columns_most_common']}")
        lines.append(f"- 단 간격 (중간값): {m['gutter_pt_median']}pt")
    if body["applied_masters_used"]:
        lines.append("")
        lines.append("**본문 frame이 적용된 master spread top 10**:")
        for name, n in body["applied_masters_used"].items():
            lines.append(f"- {name or '(none)'}: {n}회")
    lines.append("")

    lines.append("## 2. master spread → chapter type 매핑")
    lines.append("")
    for tp in ("part-cover", "passages", "answer-key", "other"):
        ms = masters.get(tp, [])
        if not ms:
            lines.append(f"- **{tp}**: (없음)")
        else:
            lines.append(f"- **{tp}**: {', '.join(ms)}")
    lines.append("")

    lines.append("## 3. 역할별 ParagraphStyle 후보")
    lines.append("")
    lines.append("usage = Stories에서 해당 스타일을 사용하는 ParagraphStyleRange 개수.")
    lines.append("첫 후보가 가장 권위 (사용 빈도 ↑).")
    lines.append("")
    for role in ["question.number", "question.stem", "question.choice",
                 "boki.body", "passage.body", "passage.prompt",
                 "passage.source", "answer.key"]:
        ev_list = role_map["role_evidence"].get(role, [])
        lines.append(f"### {role}")
        if not ev_list:
            lines.append("- (매칭된 스타일 없음 — 추가 휴리스틱 필요)")
        for ev in ev_list:
            lines.append(f"- `{ev['name']}` "
                         f"(usage **{ev['usage']}**, {ev['size_pt']}pt, {ev['weight']}, "
                         f"font={ev['font']!r}) — {ev['reason']}")
        lines.append("")

    lines.append("## 4. 분류 안 된 ParagraphStyle (참고)")
    lines.append("")
    unclassified = [s for s in styles if s["role"] is None]
    # usage 높은 순
    unclassified.sort(key=lambda s: -(usage.get(s["name"], 0)))
    for s in unclassified[:20]:
        u = usage.get(s["name"], 0)
        if u == 0:
            continue
        lines.append(f"- `{s['name']}` (usage {u}, {s['size_pt']}pt)")
    lines.append("")
    lines.append(f"...총 {len(unclassified)}개 미분류. (대부분 usage 0이거나 헤더/푸터/장식용)")
    lines.append("")

    lines.append("## 5. 대표 페이지 시각 검증")
    lines.append("")
    if debug_diff is None:
        lines.append("- (시각 diff 미생성)")
    else:
        lines.append(f"- 원본 PNG: `{debug_diff['ref']}`")
        lines.append(f"- 우리 PNG: `{debug_diff['ours']}`")
        lines.append(f"- diff PNG: `{debug_diff['diff']}`")
        lines.append(f"- **similarity: {debug_diff['similarity']*100:.1f}%**")
        lines.append(f"- mean pixel diff: {debug_diff['mean']:.2f}")
        lines.append(f"- changed pixel ratio: {debug_diff['changed_ratio']*100:.1f}%")
    lines.append("")

    lines.append("## 6. 아직 안 맞는 점 / 다음 한 발 후보")
    lines.append("")
    # 휴리스틱 위주: 정해진 우선순위 박음
    lines.append("아래는 자동 판정한 'main.typ에서 다음에 박을 1순위' 후보:")
    lines.append("")
    todos = []
    # body frame 좌표가 typst의 set page margin과 일치하는지 — 사용자가 비교해야
    if body["median_body_frame"]:
        m = body["median_body_frame"]
        todos.append(
            f"main.typ의 set page margin이 본문 frame 좌상단 (x={m['x_pt']}pt, y={m['y_pt']}pt)과 일치하도록 보정."
        )
        todos.append(
            f"set page columns/gutter를 IDML 값 ({m['columns_most_common']}단 / {m['gutter_pt_median']}pt)로 맞춤."
        )
    # 가장 많이 쓰이는 미분류 스타일 → role 정의 보강 후보
    todos.append("미분류 중 usage > 5인 스타일 → ROLE_DEFINITIONS에 추가 박기.")
    for i, t in enumerate(todos, 1):
        lines.append(f"{i}. {t}")
    lines.append("")
    return "\n".join(lines)


# ── 산출물 4: 대표 페이지 디버그 렌더 + diff ─────────────────────────────
def build_debug_page_typst(role_map: dict, layout: dict) -> str:
    """원본 p13에 해당하는 페이지를 typst로 재식자. content.json의 첫 passage + Q1."""
    return r'''// 대표 페이지 디버그 렌더 — profile-idml-layout.py가 자동 생성.
//
// 원본 p13(Spread_u93569 좌측 Page Name="12")과 비교용.
// content.json의 passages[0] + questions[0]만 박음 (같은 콘텐츠).

#import "/typst-templates/edu/design-system/paragraph-style.typ": apply-para-style
#import "/typst-templates/edu/presets/simply-classic/paragraph-styles.typ": paragraph-styles
#import "/typst-templates/edu/presets/simply-classic/master-pages.typ" as mp
#import "/typst-templates/edu/presets/simply-classic/design-tokens.typ" as t

#let data = json("/experiments/idml-recon/simply-classic/content.json")
#let pick(name) = paragraph-styles.at(name, default: (:))
#let p = data.passages.at(0)
#let q = data.questions.at(0)

#set page(..mp.main-master, columns: 2)
#set text(font: t.font.serif, size: 10pt, lang: "ko", cjk-latin-spacing: auto)
#set par(leading: 0.7em, justify: true)

// passage
#if p.header != "" {
  apply-para-style(pick("물음에답하시오"), [
    #if p.range != none {
      text(fill: t.color.accent, weight: "bold")[\[#p.range.at(0)~#p.range.at(1)\]]
      h(0.5em)
    }
    #p.header
  ])
}
#for para in p.body.split("\n") {
  if para.trim() != "" {
    apply-para-style(pick("지문:지문"), para)
  }
}

// question (윗단 + 아랫단)
#let _pad2(n) = if n < 10 { "0" + str(n) } else { str(n) }
#apply-para-style(pick("번호(NEW)") + t.typography.question-number,
                  [#_pad2(q.number)])
#v(t.space.number-to-stem, weak: true)
#apply-para-style(pick("문제명조") + t.typography.question-stem, q.stem)
#v(t.space.stem-to-choices, weak: true)
#for c in q.choices {
  block(above: 0pt, below: 0pt, width: 100%,
        inset: (left: t.align-rule.choice-text-indent))[
    #place(left + top, dx: t.align-rule.choice-glyph-dx, dy: 0pt)[
      #set text(font: t.font.serif-fallback-glyph, size: 10pt)
      #c.glyph
    ]
    #set text(font: t.font.serif-fallback-glyph, size: 10pt, tracking: -0.04em)
    #set par(leading: t.space.choice-wrap-leading, justify: true)
    #c.text
  ]
  v(t.space.between-choices, weak: true)
}
'''


def render_debug_and_diff(debug_typ_path: Path) -> dict | None:
    """typst compile + PNG 렌더 + visual-diff."""
    import subprocess

    pdf_path = debug_typ_path.with_suffix(".pdf")
    proc = subprocess.run(
        ["typst", "compile", "--root", str(ROOT),
         str(debug_typ_path), str(pdf_path)],
        capture_output=True, text=True,
    )
    if proc.returncode != 0:
        print(f"[debug] typst compile failed:\n{proc.stderr[:500]}")
        return None
    if not pdf_path.exists():
        return None

    try:
        import fitz  # type: ignore
    except ImportError:
        print("[debug] PyMuPDF 없음 — PNG 생성 skip")
        return None

    ours_png = ROOT / "experiments" / "idml-recon" / "profile-debug-p13-ours.png"
    ref_png = ROOT / "experiments" / "idml-recon" / "ref-orig-p13.png"
    diff_png = ROOT / "experiments" / "idml-recon" / "profile-debug-p13-diff.png"

    doc = fitz.open(str(pdf_path))
    doc[0].get_pixmap(dpi=150).save(str(ours_png))
    doc.close()

    if not ref_png.exists():
        print(f"[debug] ref 없음: {ref_png}")
        return {
            "ours": str(ours_png.relative_to(ROOT)),
            "ref": None,
            "diff": None,
            "similarity": None,
            "mean": None,
            "changed_ratio": None,
        }

    # visual-diff 호출
    sys.path.insert(0, str(ROOT / "experiments" / "idml-recon"))
    from importlib import import_module
    vd = import_module("visual-diff".replace("-", "_")) if False else None
    # 직접 함수 import
    spec_path = ROOT / "experiments" / "idml-recon" / "visual-diff.py"
    import importlib.util
    spec = importlib.util.spec_from_file_location("vd", str(spec_path))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    r = mod.diff(ref_png, ours_png, diff_png)
    return {
        "ref": str(ref_png.relative_to(ROOT)),
        "ours": str(ours_png.relative_to(ROOT)),
        "diff": str(diff_png.relative_to(ROOT)),
        "similarity": r["similarity_score"],
        "mean": r["mean_pixel_diff"],
        "changed_ratio": r["changed_pixel_ratio"],
    }


# ── main ────────────────────────────────────────────────────────────────
def main():
    print("[profile] 1/4 — ParagraphStyles 분석")
    styles = collect_paragraph_styles()
    print(f"  → {len(styles)}개 스타일 (Default/[None] 제외)")

    print("[profile] 2/4 — 스타일 사용 빈도 수집")
    usage = collect_style_usage()
    print(f"  → 총 {sum(usage.values())} 사용 in {len(usage)} unique styles")

    print("[profile] 3/4 — Spread 본문 frame 분석")
    body = analyze_body_frames()
    print(f"  → 페이지 크기 {body['page_size_mm']}mm, "
          f"본문 후보 {body['body_candidates']}개")

    print("[profile] 4/4 — master 분류")
    masters = classify_masters(body)

    # role-map / layout-profile 박음
    role_map = build_role_map(styles, masters, usage)
    layout = build_layout_profile(body)

    role_map_path = PRESET_DIR / "preset-role-map.json"
    layout_path = PRESET_DIR / "layout-profile.json"
    role_map_path.write_text(json.dumps(role_map, ensure_ascii=False, indent=2),
                              encoding="utf-8")
    layout_path.write_text(json.dumps(layout, ensure_ascii=False, indent=2),
                            encoding="utf-8")
    print(f"  → {role_map_path}")
    print(f"  → {layout_path}")

    # 디버그 페이지 렌더 + diff
    print("[profile] 디버그 페이지 typst 컴파일 + diff")
    debug_typ = ROOT / "experiments" / "idml-recon" / "profile-debug-p13.typ"
    debug_typ.write_text(build_debug_page_typst(role_map, layout), encoding="utf-8")
    debug = render_debug_and_diff(debug_typ)
    if debug:
        s = debug["similarity"]
        s_str = f"{s*100:.1f}%" if s is not None else "N/A"
        print(f"  → similarity: {s_str}")

    # 보고서
    report = build_report(styles, usage, body, masters, role_map, debug)
    report_path = WORK_DIR / "role-profile-report.md"
    report_path.write_text(report, encoding="utf-8")
    print(f"  → {report_path}")

    print()
    print("=== 산출물 4개 ===")
    print(f"  1. {report_path.relative_to(ROOT)}")
    print(f"  2. {role_map_path.relative_to(ROOT)}")
    print(f"  3. {layout_path.relative_to(ROOT)}")
    if debug:
        print(f"  4. (PNG 3장)")
        print(f"     ref:  {debug['ref']}")
        print(f"     ours: {debug['ours']}")
        print(f"     diff: {debug['diff']}")


if __name__ == "__main__":
    main()
