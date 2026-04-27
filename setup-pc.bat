@echo off
REM 새 PC(집/회사 이동) 셋업 스크립트
REM 사용법: 이 파일을 더블클릭
cd /d "%~dp0"
echo [1/1] 시작메뉴에 "Claude (sungjin_book)" 바로가기 등록...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0create-shortcut.ps1"
echo.
echo 완료. 윈도우키 누르고 "claude" 검색해서 실행하세요.
pause
