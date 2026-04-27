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

- [x] 태평천하 1장 원문 다운 (`content/taepyeongcheonha.txt`)
- [x] 콘텐츠 JSON 스키마 v1 결정 + decisions.md 기록 (D-006)
- [x] 태평천하 1장 JSON 변환 (`content/taepyeongcheonha-ch01.json`, 81 블록)

## 템플릿

- [x] `typst-templates/sinkukpan/classic/template.typ` 골격
- [x] 판형/여백 적용 (152×225, 안20/밖18/위22/아25)
- [x] 본문 폰트/줄간/양끝 정렬
- [x] 챕터 제목 스타일 (산스 Bold, 14pt/18pt)
- [x] 챕터는 홀수 페이지 시작 + 시작 페이지 쪽번호 없음
- [x] 쪽번호 하단 바깥쪽
- [x] 들여쓰기 규칙 (첫 단락 없음, 둘째부터 1글자)
- [ ] 한국어 금칙처리 점검 (PDF 보고 검증)
- [ ] 한영 자간 점검 (PDF 보고 검증)

## 변환 스크립트

- [x] ~~`scripts/json-to-typst.ts`~~ → **변환 스크립트 없음**으로 결정 (D-008). Typst 네이티브 `json()` 사용.
- [x] 컴파일 진입점 `scripts/render-taepyeongcheonha-ch01.typ` 작성

## 검증

- [ ] `typst compile` 에러 없이 PDF 생성
- [ ] PDF 육안 점검 — "이거 책이네" 통과
- [ ] 쪽번호 짝/홀수 위치 검증
- [ ] 챕터 분기 검증
- [ ] 첫 단락 들여쓰기/이후 들여쓰기 검증
- [ ] 양끝 정렬 + 한영 자간 검증

## 1단계 통과 후 (= 2단계 시작 전)

- [ ] decisions.md에 1단계 결론 정리 (KLREQ 미세 조정 결과 등)
- [ ] CLAUDE.md "현재 단계" 표시 갱신
- [ ] 다음 단계 (웹/JSON 입력 UI) 계획 수립
