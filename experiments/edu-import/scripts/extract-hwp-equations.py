#!/usr/bin/env python
# 평가원 수학 양식.hwp → 한컴 수식 매크로 코드 추출.
#
# 입력: hwp5proc records --json BodyText/Section0 의 출력
# 출력: out/수학_equations.json — [{seqno, script}]
#
# HWPTAG_CTRL_EQEDIT 레코드 payload 구조 (HWPv5 spec):
#   DWORD property
#   WORD  script_len (in WCHARs)
#   WCHAR script[script_len]
#   INT32 font_size
#   INT32 font_color
#   INT32 baseline
#   WORD  version_len + WCHAR version[]
#   WORD  fontname_len + WCHAR fontname[]
#
# 본 스크립트는 script 필드만 뽑는다.

from __future__ import annotations

import argparse
import json
import struct
import subprocess
import sys
from pathlib import Path

EXP = Path(__file__).resolve().parent.parent
VENV_BIN = EXP / ".venv" / "Scripts"
HWP_DIR = Path(r"C:\projects\sungjin_book\hwp")


def parse_eqedit_payload(payload_bytes: bytes) -> str | None:
    """EqEdit payload에서 수식 스크립트 문자열만 뽑는다."""
    if len(payload_bytes) < 6:
        return None
    # property (4) + script_len (2)
    script_len_wchars = struct.unpack_from("<H", payload_bytes, 4)[0]
    script_start = 6
    script_end = script_start + script_len_wchars * 2
    if script_end > len(payload_bytes):
        return None
    raw = payload_bytes[script_start:script_end]
    try:
        return raw.decode("utf-16-le")
    except UnicodeDecodeError:
        return None


def hex_lines_to_bytes(hex_lines: list[str]) -> bytes:
    """`['00 00 ...', '...']` → bytes"""
    tokens: list[str] = []
    for line in hex_lines:
        tokens.extend(line.split())
    return bytes(int(t, 16) for t in tokens)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("subject", default="수학", nargs="?", help="국어/영어/수학/과탐/사탐")
    args = ap.parse_args()
    subject = args.subject
    HWP = HWP_DIR / f"평가원 {subject} 양식.hwp"
    OUT = EXP / "out" / f"{subject}_equations.json"

    hwp5proc = VENV_BIN / "hwp5proc.exe"
    if not hwp5proc.exists():
        hwp5proc = VENV_BIN / "hwp5proc"
    if not HWP.exists():
        print(f"[extract-eq] HWP 없음: {HWP}")
        return 1

    # Section0 + Section1 둘 다 훑는다.
    all_eqs: list[dict] = []
    for section in ("BodyText/Section0", "BodyText/Section1"):
        print(f"[extract-eq] {section}")
        res = subprocess.run(
            [str(hwp5proc), "records", "--json", str(HWP), section],
            capture_output=True,
        )
        if res.returncode != 0:
            print(f"[extract-eq] {section} fail rc={res.returncode}")
            continue
        records = json.loads(res.stdout.decode("utf-8"))
        for r in records:
            if r.get("tagname") != "HWPTAG_CTRL_EQEDIT":
                continue
            payload = hex_lines_to_bytes(r["payload"])
            script = parse_eqedit_payload(payload)
            if script is None:
                continue
            all_eqs.append(
                {
                    "section": section,
                    "seqno": r["seqno"],
                    "size": r["size"],
                    "script_len": len(script),
                    "script": script,
                }
            )

    OUT.write_text(
        json.dumps(all_eqs, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"[extract-eq] 총 {len(all_eqs)}개 수식 추출 → {OUT.relative_to(EXP)}")
    if all_eqs:
        biggest = max(all_eqs, key=lambda x: x["script_len"])
        print(
            f"[extract-eq] 가장 긴 수식: section={biggest['section']} "
            f"seqno={biggest['seqno']} {biggest['script_len']}자"
        )
        print(f"  └─ {biggest['script'][:200]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
