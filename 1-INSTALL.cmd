@echo off
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (echo Install Node.js 22.13 or newer first. & pause & exit /b 1)
call npm install
if errorlevel 1 (pause & exit /b 1)
set CI=1
call npx wrangler d1 migrations apply DB --local --config wrangler.local.jsonc
if errorlevel 1 (pause & exit /b 1)
echo Installation completed. Open 2-START.cmd
pause
