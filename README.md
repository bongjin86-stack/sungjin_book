# sungjin_book

> 한국어 단행본 자동조판 서비스. Typst 기반.

콘텐츠를 입력하면 Typst가 신국판 등 한국 표준 판형으로 자동 조판해 PDF를 생성한다.
**현재 1단계 — Typst 템플릿 R&D.** 웹·결제·인쇄 연동 없음.

## 빠른 시작

```bash
# 1) Typst 설치 (Windows)
winget install Typst.Typst

# 2) Claude Code 시작 (시작메뉴 단축키 등록)
setup-pc.bat

# 3) 그 후 윈도우키 → "claude" 검색 → 실행
#    또는 cc.bat 더블클릭
```

Claude는 세션 시작 시 `CLAUDE.md` → `docs/ai-context/current-task.md` 순으로 읽고
바로 다음 작업으로 들어간다.

## 핵심 설계 원칙

1. **데이터와 스타일 분리** — 콘텐츠 JSON은 렌더러 중립, 스타일은 `(format, theme, separator)` 세 축.
2. **AI는 핵심 경로에 없다** — 조판은 결정론적. LLM API 호출 0회.
3. **스타일 먼저 → 콘텐츠 나중** — 빈 페이지 공포증 회피.
4. **자유도 = 품질 리스크** — 폰트/자간/여백 사용자 노출 금지.

## 폴더 구조

```
typst-templates/{format_id}/{theme_id}/template.typ   # 조판 템플릿
typst-templates/{format_id}/{theme_id}/separators/    # 챕터 분리자
content/                                              # 콘텐츠 JSON / 원문
output/                                               # 컴파일된 PDF (gitignored)
scripts/                                              # JSON → Typst 변환기 등
docs/ai-context/                                      # Claude 세션 연속성
.claude/commands/                                     # 자가진화형 명령어
```

## 기술 스택

- **컴파일러**: Typst (Apache-2.0)
- **폰트**: 노토 세리프 / 산스 CJK KR (SIL OFL)
- **데이터**: JSON
- (2단계 이후) Astro 또는 Next.js + Tiptap, Supabase, Vercel

## 1단계 사양 (신국판 Classic)

| 항목 | 값 |
|------|-----|
| 판형 | 152 × 225 mm |
| 여백 | 안 20 / 밖 18 / 위 22 / 아래 25 mm |
| 본문 | 노토 세리프 CJK KR 10pt / 줄간 18pt / 양끝 정렬 |
| 제목 | 노토 산스 CJK KR Bold (챕터번호 14pt, 챕터제목 18pt) |
| 챕터 | 홀수 페이지 시작, 시작 페이지 쪽번호 없음 |
| 쪽번호 | 하단 바깥쪽, 노토 세리프 9pt |
| 들여쓰기 | 첫 단락 없음, 둘째 단락부터 1글자 |

## 1단계 더미 원고

채만식 「태평천하」 (1938, 저작권 만료) — 위키문헌.
선택 이유: 신국판 한 권 분량, 15장 구조, 대화문 풍부.

## 1단계에 하지 않을 것

회원가입/로그인 · 자동저장/버전 히스토리 · 결제/인쇄 연동 ·
표지 디자인 · 표/이미지 · WYSIWYG 에디터 · LLM API 호출 · IDML/InDesign

## 검증 기준

성범님이 PDF를 열어보고 "이거 책이네" 싶을 때 1단계 통과.

## 문서 가이드

| 파일 | 용도 |
|------|------|
| `CLAUDE.md` | Claude 세션 시작 가이드 (매 세션 자동 로드) |
| `docs/ai-context/current-task.md` | 현재 어디까지 했고 다음 뭘 할지 |
| `docs/ai-context/checklist.md` | 1단계 체크리스트 |
| `docs/ai-context/decisions.md` | 왜 그렇게 결정했는지 |

## 명령어

`.claude/commands/`:
- `/check` — 통합 점검 (자가진화형)
- `/work {작업명}` — Planner→Generator→Evaluator 하네스
- `/notion_시니어팀` — 시니어 디자이너 디자인 팀
