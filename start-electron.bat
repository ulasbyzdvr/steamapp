@echo off
echo 🎮 Steam Free Games - Electron Desktop App
echo.
echo ✓ Frontend dev server should be running on http://localhost:5173
echo ✓ Starting Electron with backend integration...
echo.

cd /d "%~dp0"
set NODE_ENV=development
npx --yes electron .

pause
