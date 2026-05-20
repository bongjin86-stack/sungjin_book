#!/usr/bin/env python
# 한컴 → Typst 변환된 522개 수식을 개별 Typst 컴파일로 통과율 측정.
#
# 입력: out/수학_equations_typst.json — [{seqno, script, typst, ...}]
# 출력:
#   - 콘솔: 통과/실패 통계 + 실패 케이스 샘플 + 실패 원인 분포
#   - out/eq-accuracy-report.json — 모든 결과
#
# 병렬: ThreadPoolExecutor 8 worker

from __future__ import annotations

import argparse
import concurrent.futures
import json
import re
import subprocess
import tempfile
import sys
from pathlib import Path
from collections import Counter

ROOT = Path(__file__).resolve().parent.parent
WORK_DIR = ROOT / "out" / "eq-test"
TYPST = r"C:\Users\Owner\bin\typst\typst.exe"
FONTS = r"C:\projects\sungjin_book\fonts"


def make_typst_src(typst_math: str) -> str:
    return (
        '#set page(width: auto, height: auto, margin: 0.4cm)\n'
        '#set text(font: ("Noto Serif KR",), size: 11pt)\n'
        f'$ {typst_math} $\n'
    )


def test_one(idx_eq: tuple[int, dict]) -> dict:
    i, eq = idx_eq
    typst_math = (eq.get("typst") or "").strip()
    if not typst_math:
        return {
            "i": i,
            "seqno": eq["seqno"],
            "script": eq["script"],
            "typst": typst_math,
            "ok": True,  # 빈 수식은 skip 처리(통과로 분류)
            "skipped": True,
            "err": "",
        }
    src = make_typst_src(typst_math)
    src_path = WORK_DIR / f"{i:04d}.typ"
    pdf_path = WORK_DIR / f"{i:04d}.pdf"
    src_path.write_text(src, encoding="utf-8")
    res = subprocess.run(
        [TYPST, "compile", "--font-path", FONTS, str(src_path), str(pdf_path)],
        capture_output=True,
    )
    ok = res.returncode == 0
    err = ""
    if not ok:
        err_text = res.stderr.decode("utf-8", "replace")
        # 첫 error: 줄만
        m = re.search(r"error:\s*([^\n]+)", err_text)
        err = m.group(1).strip() if m else err_text[:200]
    # PDF 정리 (용량 절약)
    if pdf_path.exists():
        pdf_path.unlink()
    return {
        "i": i,
        "seqno": eq["seqno"],
        "script": eq["script"],
        "typst": typst_math,
        "ok": ok,
        "skipped": False,
        "err": err,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("subject", nargs="?", default="수학", help="국어/영어/수학/과탐/사탐")
    args = ap.parse_args()
    EQ_JSON = ROOT / "out" / f"{args.subject}_equations_typst.json"
    REPORT = ROOT / "out" / f"eq-accuracy-{args.subject}.json"
    eqs = json.loads(EQ_JSON.read_text(encoding="utf-8"))
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    print(f"수식 {len(eqs)}건 컴파일 시작 (8 worker)…")

    results: list[dict] = []
    done = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
        for r in ex.map(test_one, enumerate(eqs), chunksize=4):
            results.append(r)
            done += 1
            if done % 50 == 0:
                print(f"  {done}/{len(eqs)}")

    results.sort(key=lambda x: x["i"])

    total = len(results)
    skipped = sum(1 for r in results if r.get("skipped"))
    tested = total - skipped
    passed = sum(1 for r in results if r["ok"] and not r.get("skipped"))
    failed = tested - passed

    pct = passed / tested * 100 if tested else 0
    print("\n============================")
    print(f"총 수식: {total} (빈 수식 skip {skipped})")
    print(f"테스트:  {tested}")
    print(f"통과:    {passed} ({pct:.1f}%)")
    print(f"실패:    {failed}")
    print("============================\n")

    if failed:
        # 실패 원인별 분포 (에러 메시지의 처음 60자 기준)
        err_counter: Counter[str] = Counter()
        for r in results:
            if not r["ok"] and not r.get("skipped"):
                key = r["err"][:60]
                err_counter[key] += 1
        print("실패 원인 분포 (상위 10건):")
        for key, cnt in err_counter.most_common(10):
            print(f"  {cnt:>3} | {key}")

        print("\n실패 샘플 (5건):")
        shown = 0
        for r in results:
            if not r["ok"] and not r.get("skipped") and shown < 5:
                print(f"  seqno={r['seqno']}")
                print(f"    HWP : {r['script'][:120]}")
                print(f"    Typst: {r['typst'][:120]}")
                print(f"    err : {r['err']}")
                shown += 1

    REPORT.write_text(
        json.dumps(results, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"\n전체 결과 → {REPORT.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
