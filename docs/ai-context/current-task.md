# 현재 작업 상태

> 마지막 업데이트: 2026-04-27 KST
> 단계: **1단계 — Typst 신국판 Classic 템플릿 R&D**

## 지금 위치

**프로젝트 초기 세팅 완료. 첫 Typst 템플릿 작성 직전.**

- ✅ 폴더 스캐폴딩 (`typst-templates/`, `content/`, `output/`, `scripts/`)
- ✅ git init + GitHub private repo (`bongjin86-stack/sungjin_book`)
- ✅ `.claude/commands/` 복사 (`check`, `work`, `notion_시니어팀`)
- ✅ Windows 단축 (cc.bat, create-shortcut.ps1, setup-pc.bat 등)
- ⏳ Typst 설치 — `winget install Typst.Typst` (사용자가 새 PC 세션에서 실행)

## 다음에 할 일 (우선순위 순)

1. **Typst 설치 확인** — `typst --version` 안 되면 설치부터.
2. **태평천하 원문 1챕터 받기** — 위키문헌에서 1장만 텍스트로 `content/taepyeongcheonha.txt` 저장.
3. **콘텐츠 JSON 스키마 v1 정의** — `docs/ai-context/decisions.md`에 기록.
4. **태평천하 1장만 JSON 변환** — `content/taepyeongcheonha-ch01.json`.
5. **신국판 Classic 템플릿 작성** — `typst-templates/sinkukpan/classic/template.typ`.
6. **컴파일 테스트** — `typst compile ... output/test.pdf`.
7. **눈으로 확인** — "이거 책이네" 싶은가? 안 그러면 사양 조정 후 재컴파일.

## 결정 보류 중

- **format_id 명명**: `sinkukpan` vs `shinkukpan` vs `b6` — 사용자 확인 필요.
- **JSON 스키마**: 챕터 단위 / 단락 배열 / inline 마크업 표기법 — 첫 컷 작성하며 결정.
- **separator_id 1단계 기본값**: `none`으로 시작? 별 3개 패턴? — 작성하며 결정.

## 이번 세션에서 절대 하지 말 것

- 웹 프레임워크 설치 (Astro/Next 모두 2단계)
- Supabase/Vercel 연결 (2단계)
- 표/이미지 처리 (1단계 미지원)
- LLM API 호출 (영원히 금지)

## 컨텍스트

- 사용자: 성범 (`bongjin86@gmail.com`)
- 사용자 컨텍스트: sungjinprint(인쇄 주문 시스템) 운영자. 인쇄 도메인 깊은 지식 보유.
- 본 프로젝트는 Printology(인쇄 파이프라인)와 추후 연결 예정.
