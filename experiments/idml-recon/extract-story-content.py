#!/usr/bin/env python
"""IDML Stories/*.xml → 우리 시험지 JSON 스키마.

목적: 같은 콘텐츠로 시각 diff. IDML 원본의 본문 텍스트를 우리 simply-classic
preset에 흘려 typst PDF로 식자한 뒤, 원본 PDF와 같은 페이지를 비교.

매핑 (paragraph style 이름 키워드 → 의미):
  "번호"       → 새 question 시작. Content = 문제 번호.
  "문제"       → 직전 question의 stem (발문)
  "선지"       → 직전 question의 choices (다중)
  "지문"       → 지문 본문 (passage body 누적)
  "물음에답"   → 지문 헤더 라벨 ("[1~3] 다음 글을 읽고 ...")

JSON 출력 스키마 (simply-classic main.typ가 기대하는 것과 일치):
  {
    "passages": [{"id": "p1", "header": "...", "body": "...", "range": [n, m]}],
    "questions": [{"number": 48, "passage_id": "p1", "stem": "...",
                   "choices": [{"glyph": "①", "text": "..."}, ...]}]
  }

사용:
  python extract-story-content.py [--limit 5]
  → experiments/idml-recon/simply-classic/content.json 생성

"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parent.parent.parent
WORK_DIR = ROOT / "experiments" / "idml-recon" / "simply-classic"
STORIES_DIR = WORK_DIR / "Stories"

CHOICE_GLYPHS = "①②③④⑤⑥⑦⑧⑨⑩"


def style_name(applied: str) -> str:
    """'ParagraphStyle/문제와선지%3a번호' → '문제와선지:번호'"""
    return applied.replace("ParagraphStyle/", "").replace("%3a", ":")


def classify(name: str) -> str:
    """paragraph style 이름 → 카테고리.

    주의: '문제와선지:문제'에 '선지'가 포함 — endswith로 마지막 키워드만 본다.
    구분자(:)가 있으면 마지막 segment, 없으면 전체.
    """
    leaf = name.rsplit(":", 1)[-1].strip() if ":" in name else name
    if "번호" in leaf:
        return "number"
    if leaf.endswith("선지") or leaf == "선지" or "선지(" in leaf:
        return "choice"
    if leaf.endswith("문제") or leaf == "문제" or "문제명조" in leaf or "문제(" in leaf:
        return "stem"
    if "지문" in leaf:
        return "passage"
    if "물음" in leaf:
        return "passage_header"
    if "보기" in leaf:
        return "boki"
    if "출처" in leaf:
        return "source"
    return "other"


def extract_runs(story_path: Path) -> list[dict]:
    """Story 1개의 ParagraphStyleRange 시퀀스를 (style_name, text) 시퀀스로.

    nested Table/TextFrame 안의 ParagraphStyleRange는 별도 컨테이너로 표시.
    Br 단위로 단락 split.
    """
    tree = ET.parse(story_path)
    root = tree.getroot()

    runs: list[dict] = []

    def walk(el, depth: int = 0):
        for child in list(el):
            tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
            if tag == "ParagraphStyleRange":
                applied = child.get("AppliedParagraphStyle", "")
                sname = style_name(applied)
                # PSR 안의 Content + Br 시퀀스 (CharacterStyleRange 평탄화)
                segments: list[str] = [""]
                for csr in list(child):
                    csr_tag = csr.tag.split('}')[-1] if '}' in csr.tag else csr.tag
                    if csr_tag != "CharacterStyleRange":
                        continue
                    for leaf in list(csr):
                        ltag = leaf.tag.split('}')[-1] if '}' in leaf.tag else leaf.tag
                        if ltag == "Content" and leaf.text:
                            segments[-1] += leaf.text
                        elif ltag == "Br":
                            segments.append("")
                        elif ltag == "TextFrame" or ltag == "Table":
                            # nested 콘텐츠 — 재귀 (별도 entry로 들어감)
                            walk(leaf, depth + 1)
                for s in segments:
                    if s.strip():
                        runs.append({
                            "style": sname,
                            "category": classify(sname),
                            "text": s.strip(),
                            "depth": depth,
                        })
            elif tag in ("TextFrame", "Table", "Cell", "Row"):
                walk(child, depth + 1)
            else:
                walk(child, depth)

    walk(root)
    return runs


def normalize_to_schema(all_runs: list[dict]) -> dict:
    """모든 Story의 run 시퀀스 → {passages, questions} 정규화.

    상태 기계:
      - 'number' 만나면 새 question 푸시
      - 'stem' 만나면 직전 question의 stem에 누적
      - 'choice' 만나면 직전 question의 choices에 ① 등 prefix로 split
      - 'passage_header' → 새 passage 시작
      - 'passage' → 직전 passage body 누적
    """
    passages: list[dict] = []
    questions: list[dict] = []
    cur_passage: dict | None = None
    cur_q: dict | None = None

    range_re = re.compile(r"\[(\d+)\s*[~∼\-]\s*(\d+)\]")

    for run in all_runs:
        cat = run["category"]
        text = run["text"]

        if cat == "passage_header":
            pid = f"p{len(passages) + 1}"
            m = range_re.search(text)
            rng = [int(m.group(1)), int(m.group(2))] if m else None
            # range 마커 빼고 헤더 본문만
            header_clean = range_re.sub("", text).strip()
            cur_passage = {
                "id": pid,
                "header": header_clean,
                "range": rng,
                "body": "",
            }
            passages.append(cur_passage)

        elif cat == "passage":
            if cur_passage is None:
                cur_passage = {"id": f"p{len(passages) + 1}", "header": "",
                               "range": None, "body": ""}
                passages.append(cur_passage)
            cur_passage["body"] = (cur_passage["body"] + "\n" + text).strip()

        elif cat == "number":
            # 텍스트가 숫자가 아니면 skip (잡음)
            t = text.strip()
            if not t.isdigit():
                continue
            cur_q = {
                "number": int(t),
                "passage_id": cur_passage["id"] if cur_passage else None,
                "stem": "",
                "choices": [],
            }
            questions.append(cur_q)

        elif cat == "stem":
            if cur_q is None:
                continue
            cur_q["stem"] = (cur_q["stem"] + " " + text).strip()

        elif cat == "choice":
            if cur_q is None:
                continue
            # 한 run 안에 ①②③④⑤가 한꺼번에 있을 수 있음.
            # ① 등 glyph 기준으로 split
            chunks = re.split(f"(?=[{CHOICE_GLYPHS}])", text)
            for chunk in chunks:
                chunk = chunk.strip()
                if not chunk:
                    continue
                if chunk[0] in CHOICE_GLYPHS:
                    cur_q["choices"].append({
                        "glyph": chunk[0],
                        "text": chunk[1:].strip(),
                    })
                else:
                    # glyph 없는 chunk = 이전 choice 이어쓰기
                    if cur_q["choices"]:
                        cur_q["choices"][-1]["text"] += " " + chunk

    return {"passages": passages, "questions": questions}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0,
                    help="처리할 Story 개수 제한 (큰 것 우선, 0=전체)")
    ap.add_argument("--dump-runs", action="store_true",
                    help="raw run 시퀀스도 dump (디버깅)")
    args = ap.parse_args()

    if not STORIES_DIR.exists():
        print(f"[content] {STORIES_DIR} 없음. 먼저 extract-idml-to-typst.py 실행하세요.",
              file=sys.stderr)
        return 1

    # 큰 Story 우선 (본문 콘텐츠는 큰 파일에 모임)
    story_files = sorted(STORIES_DIR.glob("Story_*.xml"),
                         key=lambda p: p.stat().st_size,
                         reverse=True)
    if args.limit > 0:
        story_files = story_files[:args.limit]

    all_runs: list[dict] = []
    per_story_counts: dict[str, int] = {}
    for sp in story_files:
        try:
            runs = extract_runs(sp)
            if runs:
                per_story_counts[sp.name] = len(runs)
                # story 정렬 hint — 첫 번호 발견하면 그 숫자
                all_runs.extend(runs)
        except ET.ParseError:
            continue

    # 정규화 전, 번호가 등장하는 순서대로 Story 순회하면 문제 순서가 맞음.
    # 하지만 Story 간 순서는 IDML zip 내에서 임의. 첫 번호 기준 정렬.
    # 다시 처리: 각 Story 첫 number를 키로 정렬.
    def first_number(sp: Path) -> int:
        try:
            for r in extract_runs(sp):
                if r["category"] == "number" and r["text"].isdigit():
                    return int(r["text"])
        except ET.ParseError:
            pass
        return 9999

    story_files_sorted = sorted(story_files, key=first_number)
    all_runs = []
    for sp in story_files_sorted:
        try:
            all_runs.extend(extract_runs(sp))
        except ET.ParseError:
            continue

    schema = normalize_to_schema(all_runs)

    # 저장
    out_json = WORK_DIR / "content.json"
    out_json.write_text(
        json.dumps(schema, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    if args.dump_runs:
        runs_path = WORK_DIR / "runs-dump.txt"
        lines = []
        for r in all_runs:
            t = r["text"][:80] + ("..." if len(r["text"]) > 80 else "")
            lines.append(f"[{r['category']:18s}] {r['style']:30s} | {t}")
        runs_path.write_text("\n".join(lines), encoding="utf-8")
        print(f"[content] runs-dump.txt: {runs_path}")

    # 통계
    cat_counts: dict[str, int] = {}
    for r in all_runs:
        cat_counts[r["category"]] = cat_counts.get(r["category"], 0) + 1
    print(f"[content] stories scanned: {len(story_files)}")
    print(f"[content] total runs:      {len(all_runs)}")
    for cat, n in sorted(cat_counts.items(), key=lambda x: -x[1]):
        print(f"  {cat:18s} {n}")
    print(f"[content] passages: {len(schema['passages'])}")
    print(f"[content] questions: {len(schema['questions'])}")
    if schema["questions"]:
        q0 = schema["questions"][0]
        q_last = schema["questions"][-1]
        print(f"[content] question range: {q0['number']} ~ {q_last['number']}")
    print(f"[content] → {out_json}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
