@echo off
cd /d "%~dp0"
call npm ci --ignore-scripts
if errorlevel 1 goto failed
call npm run setup
if errorlevel 1 goto failed
pause
exit /b 0
:failed
echo Setup failed. Read the message above. Kurulum basarisiz.
pause
exit /b 1
