# sungjin_book

한국어 단행본 자동조판 서비스. 고객이 웹에서 콘텐츠를 입력하면
Typst가 신국판 등 한국 표준 판형으로 자동 조판해 PDF를 생성한다.
Printology 인쇄 파이프라인과 연결될 예정.

## 현재 단계: 1단계 — Typst 템플릿 R&D

웹 없음. 회원가입·결제·인쇄 연동 모두 없음.
"같은 콘텐츠 JSON이 신국판 Classic 템플릿으로 깨끗하게 컴파일되는가"
이 한 가지 가설을 검증한다.

## 핵심 설계 원칙

### 1. 데이터와 스타일 분리
콘텐츠는 렌더러 중립 JSON으로 보관한다.
스타일은 (format_id, theme_id, separator_id) 세 축으로 분리한다.
같은 콘텐츠 JSON에 다른 스타일 ID 조합을 적용하면
다른 PDF가 나오되 데이터 재입력 없이.

### 2. AI는 핵심 경로에 없다
조판은 결정론적 시스템이다. 같은 입력 = 같은 출력.
LLM API 호출 없음. 외부 서버에 원고 안 보냄.
이게 비용·속도·프라이버시·예측가능성의 동시 해결.

### 3. 스타일 선택 → 콘텐츠 입력 순서
사용자 동기는 "예쁜 디자인을 보고 거기 내 글을 넣고 싶다"에서 시작.
빈 페이지부터 주면 막힌다. 스타일 먼저, 콘텐츠 나중.

### 4. 자유도 = 품질 리스크
사용자에게 폰트·자간·여백 설정 권한을 주지 않는다.
포맷팅은 단락·제목·강조·인용 정도로 의도적 제한.

## 기술 스택

- 컴파일러: Typst (오픈소스, Apache-2.0, 무료)
- 폰트: 노토 세리프 CJK KR / 노토 산스 CJK KR (SIL OFL, 무료)
- 데이터: JSON
- (나중에) 웹 프론트: Astro 또는 Next.js + Tiptap 블록 에디터
- (나중에) DB: Supabase
- (나중에) 호스팅: Vercel

## 폴더 구조

```
typst-templates/
  {format_id}/
    {theme_id}/
      template.typ
      separators/
        {separator_id}.typ

content/
  *.json     # 우리 스키마로 변환된 콘텐츠
  *.txt      # 원문 참고용

output/
  *.pdf      # 컴파일 결과

scripts/
  *.ts       # JSON → Typst 마크업 변환 등
```

## 작업 원칙

1. 한 번에 하나씩. 1단계는 신국판 Classic 미니멀 한 조합만.
2. 데이터 구조는 처음부터 미래 확장에 열려있게. 코드는 한 조합만.
3. PDF가 나올 때까지 작업이고, PDF가 만족스러울 때까지 R&D.
4. 한국어 조판 미세 사항(금칙·한영 자간·양끝 정렬)은 KLREQ 기준으로.

## 1단계 더미 원고

채만식 「태평천하」 (1938, 저작권 만료, 위키문헌)
선택 이유: 신국판 한 권 분량, 15장 구조, 대화문 풍부.

## 1단계 신국판 Classic 사양 (출발점, 조정 가능)

- 판형: 152 × 225 mm
- 여백: 안쪽 20 / 바깥쪽 18 / 위 22 / 아래 25 mm
- 본문: 노토 세리프 CJK KR 10pt / 줄간 18pt / 양끝 정렬
- 제목: 노토 산스 CJK KR Bold (챕터번호 14pt, 챕터제목 18pt)
- 챕터: 홀수 페이지 시작, 시작 페이지 쪽번호 없음
- 쪽번호: 하단 바깥쪽, 노토 세리프 9pt
- 들여쓰기: 첫 단락 없음, 둘째 단락부터 1글자

## 검증 기준

PDF를 열어보고 "이거 책이네" 싶을 때 1단계 통과.
PDF만 OK면 인쇄 출력은 1단계에서 안 한다.

## 하지 않을 것

- 회원가입·로그인·프로젝트 목록
- 자동저장·버전 히스토리
- 결제·인쇄 연동
- 표지 디자인 (별도 단계)
- 표·이미지 (1단계 미지원)
- WYSIWYG 에디터 (1단계 웹 없음)
- LLM API 호출
- IDML / InDesign

## 시작하기

```bash
# 1) Typst 설치 (Windows)
winget install Typst.Typst

# 2) 컴파일 (예시)
typst compile typst-templates/sinkukpan/classic/template.typ output/test.pdf
```

## Claude Code 명령어

`.claude/commands/` 에 자가진화형 명령어 포함:
- `/check` — 통합 사이트 점검
- `/work` — Planner → Generator → Evaluator 하네스
- `/notion_시니어팀` — 시니어 디자이너 리드 디자인 팀
