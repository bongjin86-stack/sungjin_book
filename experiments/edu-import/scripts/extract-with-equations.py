#!/usr/bin/env python
# 종목 일반화 — hwp의 본문 텍스트 + EqEdit 인라인 매핑.
#
# 수학/과탐 등 EqEdit가 발문/보기에 박혀있는 종목용.
#
# 입력: hwp/평가원 {종목} 양식.hwp + out/{종목}_equations.json
# 출력: out/{종목}_with_eq.txt — 본문, 수식 자리에 ⟦typst⟧ 인라인
#
# 사용:
#   python extract-with-equations.py 수학
#   python extract-with-equations.py 과탐
#
# 종목별 차이:
#   수학: GShapeObjectControl(도형 안 페이지번호 등) skip
#   과탐: 표 안 화학식 자료 보존을 위해 도형/표 본문 흐름에 포함
#
# 호출 시 --include-shapes 플래그로 보존 모드 토글.

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path
from lxml import etree

sys.path.insert(0, str(Path(__file__).resolve().parent))
from importlib import import_module

eqn_module = import_module("hwp-eqn-to-typst")
hwp_to_typst = getattr(eqn_module, "hwp_to_typst")

EXP = Path(__file__).resolve().parent.parent
VENV_BIN = EXP / ".venv" / "Scripts"
HWP_DIR = Path(r"C:\projects\sungjin_book\hwp")


HEADER_PATTERNS = [
    re.compile(r"\d{4}학년도\s*대학수학능력시험\s*문제지"),
    re.compile(r"수학\s*영역"),
    re.compile(r"과학\s*탐구\s*영역"),
    re.compile(r"사회\s*탐구\s*영역"),
    re.compile(r"국어\s*영역"),
    re.compile(r"영어\s*영역"),
    re.compile(r"제\s*\d+\s*교시"),
    re.compile(r"5지선다형"),
    re.compile(r"단답형"),
    # 선택과목 헤더
    re.compile(r"\(\s*확률\s*과\s*통계\s*\)"),
    re.compile(r"\(\s*미적분\s*\)"),
    re.compile(r"\(\s*기하\s*\)"),
    re.compile(r"\(\s*공통\s*\)"),
    re.compile(r"\(\s*화학\s*[IⅠ]\s*\)"),
    re.compile(r"\(\s*물리학\s*[IⅠ]\s*\)"),
    re.compile(r"\(\s*생명\s*과학\s*[IⅠ]\s*\)"),
    re.compile(r"\(\s*지구\s*과학\s*[IⅠ]\s*\)"),
    re.compile(r"성명\s*수험\s*번호"),
]

NOISE_ONLY = re.compile(r"^\d{1,3}$")


def clean_line(line: str) -> str:
    out = line
    for p in HEADER_PATTERNS:
        out = p.sub("", out)
    out = re.sub(r"[\t ]+", " ", out).strip()
    if NOISE_ONLY.match(out):
        return ""
    return out


def get_xml(hwp: Path) -> bytes:
    proc = VENV_BIN / "hwp5proc.exe"
    if not proc.exists():
        proc = VENV_BIN / "hwp5proc"
    res = subprocess.run(
        [str(proc), "xml", str(hwp)],
        capture_output=True,
    )
    if res.returncode != 0:
        raise RuntimeError(f"hwp5proc xml 실패: {res.stderr.decode('utf-8', 'replace')}")
    return res.stdout


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("subject", help="국어/영어/수학/과탐/사탐")
    ap.add_argument(
        "--include-shapes",
        action="store_true",
        help="GShapeObjectControl(도형/텍스트박스) 안 텍스트도 본문에 포함",
    )
    args = ap.parse_args()
    subject = args.subject

    hwp = HWP_DIR / f"평가원 {subject} 양식.hwp"
    eq_json = EXP / "out" / f"{subject}_equations.json"
    out_path = EXP / "out" / f"{subject}_with_eq.txt"

    if not hwp.exists():
        print(f"[extract] HWP 없음: {hwp}")
        return 1

    # 수식 JSON이 없으면 EqEdit 매핑은 빈 ⟦⟧로
    sec_eqs: list[dict] = []
    if eq_json.exists():
        all_eqs = json.loads(eq_json.read_text(encoding="utf-8"))
        sec_eqs = [e for e in all_eqs if e["section"] == "BodyText/Section0"]
        print(f"[extract] {subject} EqEdit {len(sec_eqs)}개 로딩")
    else:
        print(f"[extract] {subject}: 수식 JSON 없음, EqEdit는 빈 자리만 표시")

    xml_bytes = get_xml(hwp)
    root = etree.fromstring(xml_bytes)

    eq_cursor = 0
    out_lines: list[str] = []

    def walk_para(node, out: list[str]) -> None:
        nonlocal eq_cursor
        tag = etree.QName(node.tag).localname
        if tag == "Text":
            if node.text:
                out.append(node.text)
            return
        if tag == "ControlChar":
            code = node.get("code")
            if code == "9":
                out.append("\t")
            return
        if tag == "Control" and node.get("chid") == "eqed":
            if eq_cursor < len(sec_eqs):
                eq = sec_eqs[eq_cursor]
                typst = hwp_to_typst(eq["script"]).strip()
                if typst:
                    out.append(f" ⟦{typst}⟧ ")
                else:
                    out.append(" ⟦⟧ ")
                eq_cursor += 1
            else:
                out.append(" ⟦⟧ ")
            return
        # ShapePicture → 이미지 마커 (BinData ID → PNG 경로)
        if tag == "ShapePicture":
            bd_id = None
            for pi in node.iter():
                if etree.QName(pi.tag).localname == "PictureInfo":
                    bd_id = pi.get("bindata-id")
                    break
            if bd_id:
                # hwp5html은 bindata-id를 16진수 4자리 대문자로 파일명에 박음
                # (예: id=17 → BIN0011, id=10 → BIN000A)
                img_path = f"/experiments/edu-import/out/{subject}_bindata/BIN{int(bd_id):04X}.png"
                out.append(f" ⟨IMG:{img_path}⟩ ")
            return
        # GShapeObjectControl: include_shapes 모드면 자식 따라가서 ShapePicture/텍스트 회수
        if tag == "GShapeObjectControl" and not args.include_shapes:
            return
        for child in node:
            walk_para(child, out)

    for para in root.iter("Paragraph"):
        # 최상위 본문 paragraph만 — 도형/텍스트박스 안 paragraph는 항상 nested로
        # 보고 본문에서 제외. walk_para가 부모 paragraph에서 descend할 때는 따라감.
        ancestor = para.getparent()
        nested = False
        while ancestor is not None:
            atag = etree.QName(ancestor.tag).localname
            if atag in ("GShapeObjectControl", "TextboxParagraphList", "Paragraph"):
                nested = True
                break
            ancestor = ancestor.getparent()
        if nested:
            continue
        para_text: list[str] = []
        for child in para:
            walk_para(child, para_text)
        line = clean_line("".join(para_text))
        if line:
            out_lines.append(line)

    out_path.write_text("\n".join(out_lines), encoding="utf-8")
    print(f"[extract] paragraph {len(out_lines)}개 → {out_path.name}")
    print(f"[extract] EqEdit 소비 {eq_cursor}/{len(sec_eqs)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
