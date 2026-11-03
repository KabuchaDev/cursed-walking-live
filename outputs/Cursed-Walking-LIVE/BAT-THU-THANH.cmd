@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0manage.ps1" start-server
if errorlevel 1 goto end
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0manage.ps1" start-bridge
echo Minecraft: 127.0.0.1:25567
echo Vao game, go /cw_td join, roi /cw_td start.
:end
pause
