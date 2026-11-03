@echo off
cd /d "%~dp0"
"%~dp0runtime\node.exe" "%~dp0rcon.mjs" cw_td start
pause
