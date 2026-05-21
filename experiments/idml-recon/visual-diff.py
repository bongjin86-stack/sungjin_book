#!/usr/bin/env python
"""두 PNG 페이지를 픽셀 단위로 비교해 시각 유사도 점수 산출.

사용:
  python visual-diff.py reference.png ours.png [--out diff.png]

출력 점수:
  - mean_pixel_diff      평균 픽셀 RGB 차이 (0~255, 낮을수록 비슷)
  - changed_pixel_ratio  의미 있는 차이(threshold 30) 픽셀 비율 (0~1)
  - similarity_score     유사도 (1 - mean_diff/255, 1.0 = 동일)

검증 기준:
  - similarity_score ≥ 0.97  → 시각 거의 동일 (사람 눈 분간 X)
  - similarity_score ≥ 0.90  → 시각 유사 (개선 여지 있음)
  - similarity_score <  0.90 → 시각 차이 큼

선택: scikit-image 설치 시 SSIM (구조적 유사도) 추가 — 더 정확.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image
    import numpy as np
except ImportError:
    print("[visual-diff] pip install pillow numpy", file=sys.stderr)
    sys.exit(1)

# 선택: SSIM
try:
    from skimage.metrics import structural_similarity as ssim
    HAS_SSIM = True
except ImportError:
    HAS_SSIM = False


def diff(ref_path: Path, ours_path: Path, out_path: Path | None = None) -> dict:
    a = Image.open(ref_path).convert("RGB")
    b = Image.open(ours_path).convert("RGB")
    # 크기 일치
    if a.size != b.size:
        b = b.resize(a.size, Image.LANCZOS)
    arr_a = np.array(a, dtype=np.int32)
    arr_b = np.array(b, dtype=np.int32)
    diff_arr = np.abs(arr_a - arr_b)
    mean_diff = diff_arr.mean()
    max_diff = int(diff_arr.max())
    # 의미 있는 차이 (threshold 30 = 인지 가능한 톤 차이)
    pixel_total_diff = diff_arr.sum(axis=2)
    changed_ratio = float((pixel_total_diff > 30).mean())
    similarity = 1.0 - mean_diff / 255.0

    result = {
        "ref": str(ref_path),
        "ours": str(ours_path),
        "size": a.size,
        "mean_pixel_diff": float(mean_diff),
        "max_pixel_diff": max_diff,
        "changed_pixel_ratio": changed_ratio,
        "similarity_score": float(similarity),
    }

    if HAS_SSIM:
        gray_a = np.array(a.convert("L"))
        gray_b = np.array(b.convert("L"))
        result["ssim"] = float(ssim(gray_a, gray_b))

    # diff 이미지 — 차이를 빨강으로
    if out_path:
        mask = pixel_total_diff > 30
        diff_img = arr_a.copy().astype(np.uint8)
        diff_img[mask] = [255, 0, 0]
        # 차이 없는 부분은 페이드
        no_mask = ~mask
        diff_img[no_mask] = (arr_a[no_mask] * 0.3 + 255 * 0.7).astype(np.uint8)
        Image.fromarray(diff_img).save(out_path)

    return result


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("reference", help="정답지 PNG (인디자인 원본)")
    ap.add_argument("ours", help="우리 PNG (typst 컴파일 결과)")
    ap.add_argument("--out", help="차이 시각화 이미지 출력 경로 (옵션)")
    args = ap.parse_args()

    ref = Path(args.reference)
    ours = Path(args.ours)
    out = Path(args.out) if args.out else None

    r = diff(ref, ours, out)
    print(f"reference: {r['ref']}")
    print(f"ours:      {r['ours']}")
    print(f"size:      {r['size']}")
    print(f"mean_pixel_diff:     {r['mean_pixel_diff']:.2f} / 255")
    print(f"changed_pixel_ratio: {r['changed_pixel_ratio']*100:.1f}%")
    print(f"similarity_score:    {r['similarity_score']*100:.1f}% (1.0=동일)")
    if "ssim" in r:
        print(f"SSIM:                {r['ssim']*100:.1f}% (구조적 유사도)")
    if out:
        print(f"diff image: {out}")

    # 판정
    sim = r["similarity_score"]
    if sim >= 0.97:
        print("[verdict] 시각 거의 동일 ✅")
    elif sim >= 0.90:
        print("[verdict] 시각 유사 — 개선 여지 있음")
    else:
        print("[verdict] 시각 차이 큼 — 추출기/매핑 보정 필요")


if __name__ == "__main__":
    main()
