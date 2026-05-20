#!/usr/bin/env python
# 5종목 전수 점검:
#   1. JSON 로드 가능 여부
#   2. 발문/보기 분포 (이전 보고된 통계 재확인)
#   3. 보기 갯수 이상치 (5도 0도 아닌 갯수 — 두 문항 합쳐졌을 가능성)
#   4. 보기 글리프 순서 깨짐
#   5. 발문에 잔여 placeholder/노이즈 (헤더, 직전 ⑤ 잔여)
#   6. choices.text에 의심 패턴 (전체 한국어/공백/숫자만)
#   7. limit=10 PDF 컴파일 통과 여부

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out"
TYPST = r"C:\Users\Owner\bin\typst\typst.exe"
FONTS = r"C:\projects\sungjin_book\fonts"
SRC = ROOT.parent.parent

NOISE_PATTERNS = [
    re.compile(r"^\d{4}학년도"),
    re.compile(r"^(사회|과학|국어|영어|수학)\s*탐구?\s*영역"),
    re.compile(r"^제\s*\d+\s*교시"),
    re.compile(r"^성명\s*수험"),
]


def is_noisy_stem_start(s: str) -> bool:
    s = s.strip()
    for p in NOISE_PATTERNS:
        if p.match(s):
            return True
    # 발문이 한국어 토막(이전 ⑤ 잔여)로 시작 — `ㄱ, ㄴ` 같은 패턴
    if re.match(r"^[ㄱ-ㅎ]\s*,", s):
        return True
    return False


def compile_check(subject: str, limit: int = 10) -> tuple[bool, str]:
    json_path = OUT / f"{subject}-questions.json"
    pdf_path = OUT / f"{subject}-{limit}.pdf"
    res = subprocess.run(
        [
            str(ROOT / ".venv/Scripts/python.exe"),
            str(ROOT / "scripts/render-json-to-typst.py"),
            "--input", str(json_path),
            "--subject", subject,
            "--limit", str(limit),
            "--out", f"out/{subject}-{limit}.pdf",
        ],
        capture_output=True,
        cwd=str(ROOT),
    )
    ok = res.returncode == 0
    err = res.stderr.decode("utf-8", "replace") if not ok else ""
    return ok, err[:400]


def audit(subject: str) -> dict:
    p = OUT / f"{subject}-questions.json"
    if not p.exists():
        return {"subject": subject, "error": "JSON 없음"}
    d = json.loads(p.read_text(encoding="utf-8"))
    qs = d["questions"]

    report = {
        "subject": subject,
        "total": len(qs),
        "empty_stem": [],
        "noisy_stem": [],
        "choice_count_anomaly": [],   # 5나 0이 아닌 갯수
        "choice_order_broken": [],
        "all_choices_empty": [],
        "partial_choices": [],
        "duplicate_numbers": [],
    }

    seen_nums = set()
    for q in qs:
        n = q["number"]
        if n in seen_nums:
            report["duplicate_numbers"].append(n)
        seen_nums.add(n)

        if not q["stem"].strip():
            report["empty_stem"].append(n)
        if is_noisy_stem_start(q["stem"]):
            report["noisy_stem"].append((n, q["stem"][:60]))

        c = q["choices"]
        non_empty = sum(1 for ch in c if ch["text"].strip())
        if len(c) not in (0, 5):
            report["choice_count_anomaly"].append((n, len(c)))
        glyphs = [ch["glyph"] for ch in c]
        if glyphs and glyphs != ["①", "②", "③", "④", "⑤"][: len(glyphs)]:
            report["choice_order_broken"].append((n, glyphs))
        if len(c) > 0 and non_empty == 0:
            report["all_choices_empty"].append(n)
        if len(c) > 0 and 0 < non_empty < len(c):
            report["partial_choices"].append((n, f"{non_empty}/{len(c)}"))

    ok, err = compile_check(subject, limit=10)
    report["compile_10"] = {"ok": ok, "err": err}
    return report


def print_report(r: dict) -> None:
    s = r["subject"]
    print(f"\n=== {s} (총 {r['total']}문항) ===")
    if r.get("error"):
        print(f"  ! {r['error']}")
        return
    issues = 0
    for key, label in [
        ("empty_stem", "발문 빈 문항"),
        ("noisy_stem", "발문에 헤더/잔여 노이즈"),
        ("choice_count_anomaly", "보기 갯수 비정상 (5/0 아님)"),
        ("choice_order_broken", "보기 글리프 순서 깨짐"),
        ("all_choices_empty", "보기 모두 빈 텍스트"),
        ("partial_choices", "보기 일부만 채워짐"),
        ("duplicate_numbers", "문항 번호 중복"),
    ]:
        val = r.get(key, [])
        if val:
            issues += len(val)
            print(f"  ⚠ {label}: {len(val)}건")
            for x in val[:5]:
                print(f"      - {x}")
            if len(val) > 5:
                print(f"      ... +{len(val) - 5}건")
    c = r.get("compile_10", {})
    if c.get("ok"):
        print(f"  ✓ limit=10 PDF 컴파일 통과")
    else:
        print(f"  ✗ PDF 컴파일 실패: {c.get('err', '')[:200]}")
        issues += 1
    if issues == 0:
        print("  ✅ 이상치 없음")


def main() -> int:
    print("="*60)
    print("5종목 전수 점검 시작")
    print("="*60)
    for s in ["국어", "영어", "수학", "사탐", "과탐"]:
        r = audit(s)
        print_report(r)
    print()
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())
