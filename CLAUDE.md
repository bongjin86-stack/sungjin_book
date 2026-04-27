# sungjin_book — Claude 세션 시작 가이드

> 이 파일은 매 세션마다 Claude가 자동으로 읽는다.
> **세션 시작 시 반드시 `docs/ai-context/current-task.md`를 먼저 읽어 현재 위치를 파악할 것.**

## 1줄 요약

한국어 단행본 자동조판 서비스. **현재 1단계 — Typst 신국판 Classic 템플릿 R&D**.
웹 없음. 같은 콘텐츠 JSON이 깨끗한 PDF로 컴파일되는지만 검증한다.

## 세션 시작 프로토콜 (필수)

```
1. docs/ai-context/current-task.md  → 지금 어디에 있나
2. docs/ai-context/checklist.md     → 다음 할 일
3. 사용자 지시 받기 → 작업 시작
4. 작업 끝나면 위 두 파일 갱신 + 커밋
```

배경/사양 전체는 `README.md`. 핵심 원칙만 아래에.

## 핵심 원칙 (절대 어기지 말 것)

1. **데이터 ↔ 스타일 분리** — 콘텐츠 JSON은 렌더러 중립.
   스타일은 `(format_id, theme_id, separator_id)` 세 축.
2. **AI는 핵심 경로에 없다** — 조판은 결정론적. **LLM API 호출 금지**.
3. **스타일 먼저 → 콘텐츠 나중** — 빈 페이지부터 주지 않는다.
4. **자유도 = 품질 리스크** — 폰트/자간/여백을 사용자에게 노출 금지.
   포맷팅은 단락·제목·강조·인용까지만.

## 1단계 작업 규칙

- **신국판 Classic 한 조합만** 만든다.
  데이터 스키마는 미래 확장 가능하게, 코드는 한 조합만.
- **PDF로 검증한다.** 콘솔 로그 아님.
- 한국어 조판 미세사항(금칙·한영 자간·양끝 정렬)은 KLREQ 기준.

## 1단계 신국판 Classic 사양

| 항목 | 값 |
|------|-----|
| 판형 | 152 × 225 mm |
| 여백 | 안쪽 20 / 바깥쪽 18 / 위 22 / 아래 25 mm |
| 본문 | 노토 세리프 CJK KR 10pt / 줄간 18pt / 양끝 정렬 |
| 제목 | 노토 산스 CJK KR Bold (챕터번호 14pt, 챕터제목 18pt) |
| 챕터 | 홀수 페이지 시작, 시작 페이지 쪽번호 없음 |
| 쪽번호 | 하단 바깥쪽, 노토 세리프 9pt |
| 들여쓰기 | 첫 단락 없음, 둘째 단락부터 1글자 |

## 폴더 구조

```
typst-templates/{format_id}/{theme_id}/template.typ
typst-templates/{format_id}/{theme_id}/separators/{separator_id}.typ
content/*.json           # 콘텐츠 (렌더러 중립)
content/*.txt            # 원문 참고용
output/*.pdf             # 컴파일 결과 (gitignored)
scripts/*.ts             # JSON → Typst 변환기 등
docs/ai-context/         # 세션 연속성 (current-task, checklist, decisions)
```

## 1단계에 하지 않을 것

회원가입/로그인 · 자동저장 · 결제/인쇄 연동 · 표지 디자인 ·
표/이미지 · WYSIWYG 에디터 · LLM API 호출 · IDML/InDesign

## 주요 명령어

`.claude/commands/`:
- `/check` — 통합 점검
- `/work {작업명}` — Planner→Generator→Evaluator 하네스
- `/notion_시니어팀` — 시니어 디자이너 디자인 팀

## 검증 기준

성범님(`bongjin86@gmail.com`)이 PDF를 열어보고 "이거 책이네" 싶으면 1단계 통과.

## 말투 (필수)

- **짧게, 쉽게, 한국어.** 영어·기술 용어 최대한 빼고, 어쩔 수 없이 쓰면 한 줄 풀이를 붙인다.
- **보고는 1~3줄.** 사용자가 자세히 물어보기 전엔 펼치지 않는다.
- **큰 변경(여러 파일·장시간) 끝에만** "뭐 했고 / 왜 / 다음 뭐" 각 한 줄씩 따로 적는다.
- 결정이 필요할 땐 선택지 2~3개를 한 줄씩으로 보여주고 추천 하나 표시한다.
