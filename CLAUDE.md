# sungjin_book

한국어 단행본 자동조판 서비스. Typst 기반.

## 현재 단계

**1단계 — Typst 템플릿 R&D**

웹·DB·결제·인쇄 연동 전부 없음. 신국판 Classic 한 조합으로
"같은 콘텐츠 JSON이 깨끗한 PDF로 컴파일되는가" 만 검증.

자세한 배경은 `README.md` 참고.

## 핵심 원칙

1. **데이터 ↔ 스타일 분리** — 콘텐츠 JSON은 렌더러 중립.
   스타일은 (format_id, theme_id, separator_id) 세 축.
2. **AI는 핵심 경로에 없다** — 조판은 결정론적. LLM 호출 금지.
3. **스타일 먼저 → 콘텐츠 나중** — 빈 페이지부터 주지 않는다.
4. **자유도 = 품질 리스크** — 폰트/자간/여백 사용자 노출 금지.
   포맷팅은 단락·제목·강조·인용까지만.

## 작업 규칙

- 1단계는 신국판 Classic **한 조합만** 만든다.
  데이터 스키마는 미래 확장 가능하게, 코드는 한 조합만.
- 한국어 조판 미세 사항(금칙·한영 자간·양끝 정렬)은 KLREQ 기준.
- PDF로 검증한다. 콘솔 로그가 아니라 PDF.

## 하지 않을 것 (1단계)

- 회원가입/로그인/프로젝트 목록
- 자동저장/버전 히스토리
- 결제/인쇄 연동
- 표지 디자인
- 표/이미지
- WYSIWYG 에디터
- LLM API 호출
- IDML / InDesign

## 폴더 구조

```
typst-templates/{format_id}/{theme_id}/template.typ
typst-templates/{format_id}/{theme_id}/separators/{separator_id}.typ
content/*.json    # 콘텐츠 (렌더러 중립)
content/*.txt     # 원문 참고용
output/*.pdf      # 컴파일 결과 (gitignored)
scripts/*.ts      # JSON → Typst 변환기 등
```

## 기술 스택

- 컴파일러: Typst (Apache-2.0)
- 폰트: 노토 세리프 / 산스 CJK KR (SIL OFL)
- 데이터: JSON
- (2단계 이후) Astro/Next.js + Tiptap, Supabase, Vercel

## 1단계 더미 원고

채만식 「태평천하」 (1938, 저작권 만료) — 위키문헌.

## 신국판 Classic 사양 (출발점)

| 항목 | 값 |
|------|-----|
| 판형 | 152 × 225 mm |
| 여백 | 안쪽 20 / 바깥쪽 18 / 위 22 / 아래 25 mm |
| 본문 | 노토 세리프 CJK KR 10pt / 줄간 18pt / 양끝 정렬 |
| 제목 | 노토 산스 CJK KR Bold (챕터번호 14pt, 챕터제목 18pt) |
| 챕터 | 홀수 페이지 시작, 시작 페이지 쪽번호 없음 |
| 쪽번호 | 하단 바깥쪽, 노토 세리프 9pt |
| 들여쓰기 | 첫 단락 없음, 둘째 단락부터 1글자 |

## 검증 기준

성범님이 PDF를 열어보고 "이거 책이네" 싶으면 1단계 통과.
인쇄 출력은 1단계 범위 아님.

## 명령어

`.claude/commands/`:
- `/check` — 통합 점검
- `/work` — Planner→Generator→Evaluator 하네스
- `/notion_시니어팀` — 시니어 디자이너 디자인 팀
