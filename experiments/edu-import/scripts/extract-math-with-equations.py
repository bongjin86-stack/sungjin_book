#!/usr/bin/env python
# 수학 hwp의 본문 텍스트 흐름에 EqEdit를 인라인 박은 텍스트 생성.
#
# 입력: hwp5proc xml 출력 (수학_section0.xml 등) — 본 스크립트가 호출
# 출력: out/수학_with_eq.txt — 본문 텍스트, 수식 자리에 $<typst math>$ 인라인
#
# 알고리즘:
#   - hwp5proc xml로 전체 문서를 XML화
#   - Paragraph 단위 walk
#   - 자식 노드를 순서대로 읽으며 Text/ControlChar/Control(chid="eqed") 처리
#   - eqed 만나면 → eq-extract JSON의 같은 순서 항목을 꺼내 typst 변환 → "$math$"로 박음
#   - paragraph 끝에 줄바꿈

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path
from lxml import etree


HEADER_PATTERNS = [
    re.compile(r"\d{4}학년도\s*대학수학능력시험\s*문제지"),
    re.compile(r"수학\s*영역"),
    re.compile(r"제\s*\d+\s*교시"),
    re.compile(r"5지선다형"),
    re.compile(r"단답형"),
    # 선택과목 헤더 — 페이지 헤더에 들어가 본문 paragraph로 흘러들면 문항 번호 손상
    re.compile(r"\(\s*확률\s*과\s*통계\s*\)"),
    re.compile(r"\(\s*미적분\s*\)"),
    re.compile(r"\(\s*기하\s*\)"),
    re.compile(r"\(\s*공통\s*\)"),
]

# paragraph 결과가 페이지 번호만 또는 잡스러운 숫자 토막이면 skip
NOISE_ONLY = re.compile(r"^\d{1,3}$")


def clean_line(line: str) -> str:
    out = line
    for p in HEADER_PATTERNS:
        out = p.sub("", out)
    # 연속 공백/탭 정리
    out = re.sub(r"[\t ]+", " ", out).strip()
    # 숫자만 남으면 노이즈로 간주
    if NOISE_ONLY.match(out):
        return ""
    return out

# hwp-eqn-to-typst 모듈 사용
sys.path.insert(0, str(Path(__file__).resolve().parent))
from importlib import import_module

eqn_module = import_module("hwp-eqn-to-typst")
hwp_to_typst = getattr(eqn_module, "hwp_to_typst")

EXP = Path(__file__).resolve().parent.parent
VENV_BIN = EXP / ".venv" / "Scripts"
HWP = Path(r"C:\projects\sungjin_book\hwp\평가원 수학 양식.hwp")
EQ_JSON = EXP / "out" / "수학_equations.json"
OUT = EXP / "out" / "수학_with_eq.txt"


def get_xml(section: str) -> bytes:
    hwp5proc = VENV_BIN / "hwp5proc.exe"
    if not hwp5proc.exists():
        hwp5proc = VENV_BIN / "hwp5proc"
    # `xml` 명령은 전체 문서를 한 번에 XML화
    res = subprocess.run(
        [str(hwp5proc), "xml", str(HWP)],
        capture_output=True,
    )
    if res.returncode != 0:
        raise RuntimeError(f"hwp5proc xml 실패: {res.stderr.decode('utf-8', 'replace')}")
    return res.stdout


def main() -> int:
    eqs = json.loads(EQ_JSON.read_text(encoding="utf-8"))
    # Section0만 사용 — 평가원 수학은 Section0 한 개
    sec0_eqs = [e for e in eqs if e["section"] == "BodyText/Section0"]
    print(f"[math] Section0 수식 {len(sec0_eqs)}개 로딩")

    xml_bytes = get_xml("BodyText/Section0")
    root = etree.fromstring(xml_bytes)

    # 모든 Paragraph 순회 (계층 깊이 무관)
    out_lines: list[str] = []
    eq_cursor = 0

    # paragraph를 명시적 walk: GShapeObjectControl(도형/텍스트박스) 안 텍스트는 제외.
    # 평가원은 페이지 번호·장식을 도형 안 텍스트박스에 박는데, .iter()는 이걸 본문에
    # 섞어 `124.` 같은 가짜 번호를 만들어낸다.
    def walk_para(node: etree._Element, out: list[str]) -> None:
        nonlocal eq_cursor
        tag = etree.QName(node.tag).localname
        if tag == "GShapeObjectControl":
            return  # 도형(페이지번호 박스 등) 전부 skip
        if tag == "Text":
            if node.text:
                out.append(node.text)
        elif tag == "ControlChar":
            code = node.get("code")
            if code == "9":
                out.append("\t")
        elif tag == "Control" and node.get("chid") == "eqed":
            if eq_cursor < len(sec0_eqs):
                eq = sec0_eqs[eq_cursor]
                typst = hwp_to_typst(eq["script"]).strip()
                if typst:
                    out.append(f" ⟦{typst}⟧ ")
                else:
                    out.append(" ⟦⟧ ")
                eq_cursor += 1
            else:
                out.append(" ⟦⟧ ")
            return  # eqed 안 더 들어가지 않음
        for child in node:
            walk_para(child, out)

    for para in root.iter("Paragraph"):
        # 최상위 paragraph만 처리 (중첩 paragraph는 walk_para에서 skip)
        # paragraph가 GShapeObjectControl/TextboxParagraphList 안에 있으면 본문 아님
        skip = False
        ancestor = para.getparent()
        while ancestor is not None:
            atag = etree.QName(ancestor.tag).localname
            if atag in ("GShapeObjectControl", "TextboxParagraphList"):
                skip = True
                break
            ancestor = ancestor.getparent()
        if skip:
            continue
        para_text: list[str] = []
        for child in para:
            walk_para(child, para_text)
        line = clean_line("".join(para_text))
        if line:
            out_lines.append(line)

    OUT.write_text("\n".join(out_lines), encoding="utf-8")
    print(f"[math] paragraph {len(out_lines)}개 → {OUT.relative_to(EXP)}")
    print(f"[math] EqEdit 소비 {eq_cursor}/{len(sec0_eqs)}")

    # 미리보기
    print("--- 본문 미리보기 (처음 20줄) ---")
    for ln in out_lines[:20]:
        snippet = ln[:200]
        print(f"  {snippet}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
