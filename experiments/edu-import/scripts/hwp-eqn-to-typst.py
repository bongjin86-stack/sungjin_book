#!/usr/bin/env python
# 한컴 수식 매크로 코드 → Typst math 문법 변환기 (PoC).
#
# 처리하는 한컴 문법 (관찰된 것 중심):
#   _{x}, ^{x}            : 첨자 — Typst의 _(x), ^(x)로 매핑.
#   {a} over {b}          : 분수 — Typst는 a/b를 자동으로 분수로 렌더.
#   sqrt{x}               : 제곱근.
#   sqrt{n} of {x}        : n제곱근 — Typst root(n, x).
#   LEFT ( ... RIGHT )    : 자동 크기 괄호 — Typst lr((...)).
#   LEFT | ... RIGHT |    : 절댓값 — Typst lr(|...|).
#   LEQ / GEQ / NEQ       : 부등호 — <=, >=, !=.
#   times, rarrow         : 기호 매핑.
#   lim _{x rarrow a}     : 극한.
#   cases{a # b}          : 분기식 — Typst cases(a, b).
#   eqalign{ ... }        : 정렬 — 정렬 정보는 PoC에서 버린다.
#   &&                    : eqalign/cases 안 열 구분 — 버린다.
#   #                     : 행 구분 — cases에서 쉼표로 변환.
#   ` (backtick), ~       : 가는 공백 — 공백 한 칸으로 치환.
#   rm                    : 로만/직립 — Typst upright(...) 또는 무시.
#
# 한계 (의도적):
#   - 한글 텍스트가 수식 안에 섞여있는 경우(예: "또는", "홀수") 그대로 박아둠.
#     Typst는 수식 안의 한글을 text 모드로 렌더하지 않을 수 있어 별도 처리 필요.

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

EXP = Path(__file__).resolve().parent.parent


def strip_spacing_marks(s: str) -> str:
    s = re.sub(r"`+", " ", s)
    s = s.replace("~", " ")
    return s


def convert_paired_delimiters(s: str) -> str:
    # 대소문자 모두 처리. left/right + ( ) | { } [ ]
    flags = re.IGNORECASE
    # 한쪽만 표시: `LEFT . ... RIGHT |` 또는 `LEFT | ... RIGHT .`
    # 점(.)은 한컴에서 invisible delimiter. Typst는 짝 필요하니 같은 기호로 양쪽 채움.
    s = re.sub(r"\bleft\s*\.\s*(.+?)\bright\s*\|", r"lr(|\1|)", s, flags=flags | re.DOTALL)
    s = re.sub(r"\bleft\s*\|\s*(.+?)\bright\s*\.", r"lr(|\1|)", s, flags=flags | re.DOTALL)
    s = re.sub(r"\bleft\s*\.\s*(.+?)\bright\s*\)", r"lr((\1))", s, flags=flags | re.DOTALL)
    s = re.sub(r"\bleft\s*\(\s*(.+?)\bright\s*\.", r"lr((\1))", s, flags=flags | re.DOTALL)

    s = re.sub(r"\bleft\s*\(", "lr((", s, flags=flags)
    s = re.sub(r"\bright\s*\)", "))", s, flags=flags)
    s = re.sub(r"\bleft\s*\|", "lr(|", s, flags=flags)
    s = re.sub(r"\bright\s*\|", "|)", s, flags=flags)
    # 중괄호: Typst math에서 `{`,`}`는 스코프라 backslash 이스케이프 필요
    s = re.sub(r"\bleft\s*\{", "lr(\\{", s, flags=flags)
    s = re.sub(r"\bright\s*\}", "\\})", s, flags=flags)
    # 대괄호
    s = re.sub(r"\bleft\s*\[", "lr([", s, flags=flags)
    s = re.sub(r"\bright\s*\]", "])", s, flags=flags)
    return s


def convert_roots(s: str) -> str:
    # sqrt {n} of {x} → root(n, x)  (반드시 sqrt{x}보다 먼저)
    s = re.sub(
        r"\bsqrt\s*\{([^{}]*)\}\s*of\s*\{([^{}]*)\}",
        r"root(\1, \2)",
        s,
    )
    s = re.sub(r"\bsqrt\s*\{([^{}]*)\}", r"sqrt(\1)", s)
    return s


def convert_over(s: str) -> str:
    # {a} over {b} → (a) / (b)
    # 단순 패턴만 처리 (중첩은 한 번 더 패스 적용).
    pattern = re.compile(r"\{([^{}]*)\}\s*over\s*\{([^{}]*)\}")
    while True:
        new = pattern.sub(r"((\1) / (\2))", s)
        if new == s:
            break
        s = new
    return s


def convert_subscript_superscript(s: str) -> str:
    s = re.sub(r"_\s*\{([^{}]*)\}", r"_(\1)", s)
    s = re.sub(r"\^\s*\{([^{}]*)\}", r"^(\1)", s)
    return s


def convert_cases(s: str) -> str:
    # cases{ row1 # row2 # ... } → cases(row1, row2, ...)
    # &&는 단순히 공백으로(정렬 손실 감수).
    pattern = re.compile(r"\bcases\s*\{([^{}]*)\}")

    def repl(m: re.Match) -> str:
        body = m.group(1)
        rows = body.split("#")
        rows = [r.replace("&&", " ").strip() for r in rows if r.strip()]
        return "cases(" + ", ".join(rows) + ")"

    # 중첩 가능성 있으면 한 번 더 패스. 본 PoC는 1패스.
    return pattern.sub(repl, s)


def convert_eqalign(s: str) -> str:
    # eqalign{...} → 그냥 내용물 (정렬 손실)
    pattern = re.compile(r"\beqalign\s*\{([^{}]*)\}")
    while True:
        new = pattern.sub(lambda m: m.group(1).replace("&&", " ").replace("#", " "), s)
        if new == s:
            break
        s = new
    return s


# 한컴 수식 키워드 → Typst math 키워드.
# 대소문자 모두 잡도록 IGNORECASE 적용 (한컴은 대문자 LEQ, 소문자 leq 혼용).
SYMBOLS = [
    (r"\bleq\b", "<="),
    (r"\bgeq\b", ">="),
    (r"\bneq\b", "!="),
    (r"\brarrow\b", "->"),
    (r"\blarrow\b", "<-"),
    (r"\bharrow\b", "<->"),
    (r"\btimes\b", "times"),
    (r"\bdiv\b", "div"),
    (r"\bcdot\b", "dot.op"),
    (r"\binfty\b", "infinity"),
    (r"\binf\b", "infinity"),
    (r"\bpm\b", "plus.minus"),
    (r"\bmp\b", "minus.plus"),
    # 집합 연산
    (r"\bcap\b", "inter"),
    (r"\bcup\b", "union"),
    (r"\bsubset\b", "subset"),
    (r"\bsupset\b", "supset"),
    # Typst math는 int/prod 대신 integral/product 사용
    (r"\bint\b", "integral"),
    (r"\bprod\b", "product"),
    (r"\boint\b", "integral.cont"),
    # 한컴 잔여 토큰
    (r"\bprime\b", "prime"),
    # 한컴 `sim` 키워드 → Typst tilde 심볼 (~). KEEP_AS_IS에서 빼고 여기서 매핑.
    (r"\bsim\b", "tilde.basic"),
    (r"\bcong\b", "tilde.equiv"),
    (r"\bpropto\b", "prop"),
]

# rm/it/bf는 case-sensitive로 별도 처리.
# 한컴은 `rmCH`처럼 다음 식별자와 공백 없이 붙여 쓰므로 word-boundary 만으로는
# 못 잡고, 뒤가 소문자 아닐 때만 매치하는 lookahead가 필요하다.
# 단 IGNORECASE 모드에서 `[a-z]`가 `[a-zA-Z]`로 확장되면 lookahead가 의도와 다르게
# 동작해 다음 식별자(대문자)까지 막아버린다 → 본 함수는 case-sensitive로 호출.
TYPESETTING_TOKENS = [
    re.compile(r"\brm(?![a-z])"),
    re.compile(r"\bit(?![a-z])"),
    re.compile(r"\bbf(?![a-z])"),
    re.compile(r"\bRM(?![A-Z])"),
    re.compile(r"\bIT(?![A-Z])"),
    re.compile(r"\bBF(?![A-Z])"),
]


def convert_symbols(s: str) -> str:
    # rm/it/bf 같은 식자 토큰은 case-sensitive로 먼저 (IGNORECASE에서 lookahead가 깨짐)
    for pat in TYPESETTING_TOKENS:
        s = pat.sub("", s)
    # SYMBOLS는 `\b` 대신 `(?<![A-Za-z])...(?![A-Za-z])`로: 숫자 옆에 붙어도 매치
    # (한컴 `1TIMES10`, `SIM3` 같은 패턴 처리)
    # 치환값 양옆에 공백 패딩 — Typst가 `1times10`을 `times10` 변수로 잘못 파싱하는 것 방지
    for pat, rep in SYMBOLS:
        new_pat = pat.replace(r"\b", "")
        new_pat = f"(?<![A-Za-z]){new_pat}(?![A-Za-z])"
        replacement = f" {rep} " if rep else ""
        s = re.sub(new_pat, replacement, s, flags=re.IGNORECASE)
    return s


def convert_rm(s: str) -> str:
    # rm followed by word → upright (Typst의 "upright")
    # 단순 처리: `rm -5`처럼 그냥 텍스트인 경우 그대로 둠.
    return s


# Typst math가 통째로 인식하는 다문자 식별자.
# 이 외의 [A-Za-z]+는 인접 변수 곱으로 간주해 공백으로 분리.
KEEP_AS_IS = {
    # 삼각/지수/로그
    "sin", "cos", "tan", "sec", "csc", "cot",
    "sinh", "cosh", "tanh",
    "arcsin", "arccos", "arctan",
    "log", "ln", "exp", "lg",
    # operator
    "lim", "max", "min", "sup", "inf", "det", "dim", "gcd", "lcm",
    "mod", "deg", "ker", "Pr",
    # 그리스(소문자)
    "alpha", "beta", "gamma", "delta", "epsilon", "varepsilon",
    "zeta", "eta", "theta", "vartheta", "iota", "kappa", "lambda",
    "mu", "nu", "xi", "omicron", "pi", "varpi", "rho", "varrho",
    "sigma", "varsigma", "tau", "upsilon", "phi", "varphi",
    "chi", "psi", "omega",
    # 그리스(대문자)
    "Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta",
    "Theta", "Iota", "Kappa", "Lambda", "Mu", "Nu", "Xi", "Omicron",
    "Pi", "Rho", "Sigma", "Tau", "Upsilon", "Phi", "Chi", "Psi", "Omega",
    # Typst 함수/심볼
    "integral", "product", "sum", "infinity",
    "prime", "dot", "hat", "bar", "tilde", "vec", "norm",
    "cases", "root", "sqrt", "lr", "op", "frac", "abs",
    "times", "div", "cdot", "plus", "minus",
    "and", "or", "not", "in", "notin", "subset", "supset", "cup", "cap",
    "arrow", "leftarrow", "rightarrow", "Rightarrow", "Leftarrow",
    "upright", "italic", "bold", "underline", "overline",
    "mat", "matrix",
    "to", "mapsto",
    "forall", "exists",
    "approx", "equiv",  # sim/simeq/propto는 SYMBOLS에서 매핑
    "ne", "neq", "le", "leq", "ge", "geq",
}


def split_identifiers(s: str) -> str:
    """Typst math에서 다문자 식별자는 공백으로 쪼개야 변수 곱으로 인식.
    KEEP_AS_IS 또는 `tilde.basic`처럼 dot으로 연결된 한 심볼은 보존."""
    def repl(m: re.Match) -> str:
        word = m.group(0)
        # dot로 연결된 토큰(`tilde.basic`, `dot.op`)은 Typst 심볼이므로 보존
        if "." in word:
            return word
        if word in KEEP_AS_IS or len(word) == 1:
            return word
        return " ".join(word)
    # `[A-Za-z]+(\.[A-Za-z]+)*` — dot 연결 보존
    return re.sub(r"[A-Za-z]+(?:\.[A-Za-z]+)*", repl, s)


# 수식 안에 들어간 한글 단어("또는", "홀수인", "짝수인" 등)는 Typst가 변수로 인식해 에러.
# upright() 안에 감싸 텍스트 라벨로 렌더.
def wrap_korean_words(s: str) -> str:
    return re.sub(r"[가-힣]+", lambda m: f'#"{m.group(0)}"', s)


def hwp_to_typst(script: str) -> str:
    s = script
    s = strip_spacing_marks(s)
    # 첨자/symbols/delimiter는 먼저: 이후 다회 패스의 regex가 `[^{}]*`를 쓰므로
    # 잔여 `{}`가 없어야 안쪽 구조 매치 성공.
    s = convert_subscript_superscript(s)
    s = convert_symbols(s)
    s = convert_paired_delimiters(s)
    # 분기/정렬/뿌리/분수는 중첩 가능 — 변화가 없을 때까지 반복.
    for _ in range(10):
        prev = s
        s = convert_roots(s)
        s = convert_eqalign(s)
        s = convert_cases(s)
        s = convert_over(s)
        if s == prev:
            break
    # 잔여 토큰 정리 (식자 토큰은 convert_symbols에서 처리됨)
    s = re.sub(r"\{\s*\}", "", s)  # 빈 {} 제거
    # 다문자 식별자 공백 분리 (마지막에 — 다른 변환의 토큰 보호)
    s = split_identifiers(s)
    # 수식 안 한글은 텍스트 라벨로 감싸기 (마지막에 — split 후라 안전)
    s = wrap_korean_words(s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("subject", nargs="?", default="수학")
    args = ap.parse_args()
    IN = EXP / "out" / f"{args.subject}_equations.json"
    OUT = EXP / "out" / f"{args.subject}_equations_typst.json"
    data = json.loads(IN.read_text(encoding="utf-8"))
    out = []
    for d in data:
        script = d["script"]
        if not script:
            continue
        typst = hwp_to_typst(script)
        out.append({**d, "typst": typst})
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"변환 {len(out)}건 → {OUT.name}")
    # 길이 버킷별 샘플 한 개씩
    buckets = [1, 4, 8, 16, 32, 64, 128, 200]
    seen = set()
    for lo, hi in zip([0] + buckets[:-1], buckets):
        for d in out:
            if lo < d["script_len"] <= hi and d["seqno"] not in seen:
                seen.add(d["seqno"])
                print(f"\n[{lo}<len<={hi}] seqno={d['seqno']}")
                print(f"  HWP   : {d['script']}")
                print(f"  Typst : {d['typst']}")
                break
    return 0


if __name__ == "__main__":
    sys.exit(main())
