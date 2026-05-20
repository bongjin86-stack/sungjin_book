#!/usr/bin/env python
# 평가원 HWP의 hwp5html 출력을 평탄화 텍스트로 변환.
# 국어/영어는 번호와 묶음 헤더가 살아있어 split-questions.py를 그대로 적용 가능.
#
# 입력: out/{subject}_html/index.xhtml
# 출력: out/{subject}_html.txt
#
# 사탐과 동일한 평탄화 휴리스틱.

from __future__ import annotations

import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SUBJECT_FOR_IMG = ""  # main()에서 설정

# 페이지 헤더/푸터 등 노이즈 라인 제거
NOISE_PATTERNS = [
    re.compile(r"^\d{4}학년도\s*대학수학능력시험\s*문제지.*$"),
    re.compile(r"^(국어|영어|수학|사회\s*탐구|과학\s*탐구)\s*영역.*$"),
    re.compile(r"^제\s*\d+\s*교시.*$"),
    re.compile(r"^성명\s*수험\s*번호.*$"),
    re.compile(r"^\d+\s*$"),  # 페이지 번호만
    re.compile(r"^[―—\-]+$"),  # 구분선
    re.compile(r"^\s*$"),  # 빈 줄
]


def is_noise(s: str) -> bool:
    s = s.strip()
    if not s:
        return True
    for p in NOISE_PATTERNS:
        if p.match(s):
            return True
    return False


def html_to_text(html: str) -> str:
    html = re.sub(r"<style[^>]*>.*?</style>", " ", html, flags=re.S)
    html = re.sub(r"<script[^>]*>.*?</script>", " ", html, flags=re.S)
    # <img src="bindata/BIN_XXXX.ext"> → 이미지 마커 (확장자 .png로 통일)
    def img_to_marker(m: re.Match) -> str:
        src = m.group(1)
        m2 = re.search(r"BIN([0-9A-Fa-f]+)", src)
        if not m2:
            return " "
        bin_id = m2.group(1).upper()
        img_abs = f"/experiments/edu-import/out/{SUBJECT_FOR_IMG}_bindata/BIN{bin_id}.png"
        return f" ⟨IMG:{img_abs}⟩ "
    html = re.sub(r"<img[^>]*src=\"([^\"]+)\"[^>]*/?>", img_to_marker, html, flags=re.I)
    # 블록 태그는 줄바꿈으로 (보기 분리 보장)
    html = re.sub(r"</(p|div|td|tr|table|li|h\d|br)\s*>", "\n", html, flags=re.I)
    html = re.sub(r"<br\s*/?>", "\n", html, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", html)
    text = text.replace("&#13;", "\n")
    text = text.replace("&nbsp;", " ")
    text = text.replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&")
    lines = []
    for ln in text.split("\n"):
        ln = re.sub(r"\s+", " ", ln).strip()
        if ln and not is_noise(ln):
            lines.append(ln)
    return "\n".join(lines)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("subject", help="국어/영어/수학/사탐/과탐")
    args = ap.parse_args()
    s = args.subject
    global SUBJECT_FOR_IMG
    SUBJECT_FOR_IMG = s
    in_path = ROOT / "out" / f"{s}_html" / "index.xhtml"
    out_path = ROOT / "out" / f"{s}_html.txt"
    if not in_path.exists():
        print(f"[html] 없음: {in_path}")
        return 1
    raw = in_path.read_text(encoding="utf-8")
    text = html_to_text(raw)
    out_path.write_text(text, encoding="utf-8")
    lines = text.count("\n") + 1
    print(f"[html] {s}: {out_path.name} ({len(text):,} bytes / {lines}줄)")
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())
