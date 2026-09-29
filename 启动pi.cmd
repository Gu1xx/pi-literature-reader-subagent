@echo off
cd /d "%~dp0pi-workspace"
if errorlevel 1 exit /b 1
call pi.cmd
pause
