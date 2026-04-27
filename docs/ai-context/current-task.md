# 현재 작업 상태

> 마지막 업데이트: 2026-04-27 KST
> 단계: **1단계 — Typst 신국판 Classic 템플릿 R&D**

## 지금 위치

**템플릿·콘텐츠·스키마 작성 완료. Typst 컴파일 검증 직전.**

- ✅ 폴더 스캐폴딩
- ✅ git init + GitHub private repo
- ✅ `.claude/commands/` (`check`, `work`, `notion_시니어팀`)
- ✅ Windows 단축 (cc.bat 등)
- ✅ **decisions.md** D-005~D-008 추가 (format_id, JSON 스키마 v1, separator_id, 변환 방식 결정)
- ✅ **content/taepyeongcheonha.txt** — 위키문헌 1장 원문
- ✅ **content/taepyeongcheonha-ch01.json** — 81 블록 (1 chapter + 80 paragraph), 스키마 v1
- ✅ **typst-templates/sinkukpan/classic/template.typ** — 신국판 Classic 사양 10개 모두 반영
- ✅ **typst-templates/sinkukpan/classic/separators/plain.typ** — 자리만 (1단계는 미사용)
- ✅ **scripts/render-taepyeongcheonha-ch01.typ** — 컴파일 진입점

## 다음에 할 일 (우선순위 순)

1. **Typst 설치** — 사용자가 새 PowerShell에서:
   ```
   winget install --id Typst.Typst -e --accept-source-agreements --accept-package-agreements
   ```
2. **노토 CJK KR 폰트 확인/설치** — Windows에 없으면 [noto-cjk releases](https://github.com/notofonts/noto-cjk/releases)에서 NotoSerifCJKkr / NotoSansCJKkr 받아 설치.
3. **첫 컴파일** — 프로젝트 루트에서:
   ```
   typst compile scripts/render-taepyeongcheonha-ch01.typ output/taepyeongcheonha-ch01.pdf
   ```
4. **PDF 육안 점검** — 성범님이 열어보고 "이거 책이네" 통과 여부:
   - 챕터 제목 산스 Bold가 가운데에 잘 자리잡았는가
   - 챕터가 홀수 페이지에서 시작하는가
   - 챕터 첫 페이지 쪽번호 없는가
   - 짝수 페이지 쪽번호 왼쪽, 홀수 페이지 쪽번호 오른쪽인가
   - 본문 첫 단락 들여쓰기 없음, 둘째부터 1자 들어가는가
   - 양끝 정렬이 깔끔한가 (한영 사이 자간이 어색하지 않은가)
   - 줄간 18pt가 답답하지 않은가
5. **사양 미세 조정** — 어색하면 template.typ에서 leading/v(8em)/들여쓰기 등 조정 후 재컴파일.

## 결정 보류 중

(없음 — 1단계 미정 사항 모두 D-005~D-008로 결정)

## 이번 세션에서 절대 하지 말 것

- 웹 프레임워크 설치 (Astro/Next 모두 2단계)
- Supabase/Vercel 연결 (2단계)
- 표/이미지 처리 (1단계 미지원)
- LLM API 호출 (영원히 금지)

## 잠재 이슈 (컴파일 시 점검)

- **Typst 버전**: `first-line-indent: (amount: 1em, all: false)` 객체 형식은 Typst 0.13+ 필요. winget 최신 버전이면 OK. 에러 시 `first-line-indent: 1em`으로 폴백.
- **폰트 미설치**: 노토 CJK KR이 없으면 Typst가 fallback 폰트 사용 → 한글 깨질 수 있음. `typst compile` 실행 시 stderr 경고 확인.
- **위키문헌 본문 길이**: 1장 본문이 자연스럽게 끝났지만, PDF 분량이 너무 짧다면 위키문헌 페이지를 다시 받아서 누락분 확인.

## 컨텍스트

- 사용자: 성범 (`bongjin86@gmail.com`)
- sungjinprint(인쇄 주문 시스템) 운영자. 인쇄 도메인 깊은 지식.
- 본 프로젝트는 Printology(인쇄 파이프라인)와 추후 연결 예정.
