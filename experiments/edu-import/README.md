# edu-import 실험

격리 폴더. 본앱(`web/`, `typst-templates/`, 루트 `package.json`)과 단절된 상태로 평가원 `.hwp` 추출 가능성만 평가한다.

## 목적

- hwp/ 폴더의 평가원 양식 5개에서 텍스트가 얼마나 살아 나오는지 확인
- 문항번호·보기 ①~⑤·지문 보존 여부 평가
- 표·이미지·수식 손실 정도 기록 (이번엔 복원 시도 안 함)
- 자동 문항 구조화 적합성 결론 + 다음 단계 제안

## 작업 규칙

- 의존성은 이 폴더 안 `package.json`에만. 루트 절대 건드리지 않음.
- 추출 결과·node_modules는 git 무시 (`.gitignore`).
- 본 결론은 `REPORT.md`에 1페이지.

## 시도 후보

1. `hwp.js` (Apache-2.0, https://github.com/hahnlee/hwp.js) — Node에서 텍스트만 뽑을 수 있는지
2. `pyhwp` (BSD, https://github.com/mete0r/pyhwp) — `hwp5txt` CLI, Python 환경 필요
3. 실패 시 — Pandoc, LibreOffice headless 등 외부 도구 후보
