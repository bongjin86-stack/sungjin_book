@echo off
cd /d "%~dp0"
wt -d "%~dp0" cmd /k claude --dangerously-skip-permissions %*
