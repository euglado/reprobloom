@echo off
cd /d "%~dp0"
call npm start
if errorlevel 1 goto failed
exit /b 0
:failed
echo Bot stopped with an error. Read above. Bot hata ile durdu.
pause
exit /b 1
