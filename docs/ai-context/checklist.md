# 1단계 체크리스트

> 단계 정의: 신국판 Classic 한 조합으로 깨끗한 PDF 1개 생성.
> 통과 조건: 성범님이 PDF 열어보고 "이거 책이네" 싶음.

## 환경

- [x] git 레포 (`bongjin86-stack/sungjin_book` private)
- [x] 폴더 스캐폴딩
- [x] `.claude/commands/` (check, work, notion_시니어팀)
- [x] 시작메뉴 단축키 스크립트 (`setup-pc.bat`)
- [ ] Typst 설치 (`winget install Typst.Typst`)
- [ ] 노토 세리프/산스 CJK KR 폰트 (시스템에 있는지 확인)

## 데이터

- [ ] 태평천하 1장 원문 다운 (`content/taepyeongcheonha.txt`)
- [ ] 콘텐츠 JSON 스키마 v1 결정 + decisions.md 기록
- [ ] 태평천하 1장 JSON 변환 (`content/taepyeongcheonha-ch01.json`)

## 템플릿

- [ ] `typst-templates/sinkukpan/classic/template.typ` 골격
- [ ] 판형/여백 적용 (152×225, 안20/밖18/위22/아25)
- [ ] 본문 폰트/줄간/양끝 정렬
- [ ] 챕터 제목 스타일 (산스 Bold, 14pt/18pt)
- [ ] 챕터는 홀수 페이지 시작 + 시작 페이지 쪽번호 없음
- [ ] 쪽번호 하단 바깥쪽
- [ ] 들여쓰기 규칙 (첫 단락 없음, 둘째부터 1글자)
- [ ] 한국어 금칙처리 점검
- [ ] 한영 자간 점검

## 변환 스크립트

- [ ] `scripts/json-to-typst.ts` (또는 .ts/.js — 결정 필요)
- [ ] JSON → Typst 마크업 변환 동작 확인

## 검증

- [ ] `typst compile` 에러 없이 PDF 생성
- [ ] PDF 육안 점검 — "이거 책이네" 통과
- [ ] 쪽번호 짝/홀수 위치 검증
- [ ] 챕터 분기 검증

## 1단계 통과 후 (= 2단계 시작 전)

- [ ] decisions.md에 1단계 결론 정리
- [ ] CLAUDE.md "현재 단계" 표시 갱신
- [ ] 다음 단계 (웹/JSON 입력 UI) 계획 수립
