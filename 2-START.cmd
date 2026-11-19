@echo off
cd /d "%~dp0"
echo Keep this window open. Visit the Local URL printed below.
call npm run dev -- --host 127.0.0.1
pause
