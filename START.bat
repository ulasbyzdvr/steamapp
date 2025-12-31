@echo off
title Steam Free Games - Starting...
color 0A

echo.
echo  ==========================================
echo    STEAM FREE GAMES - DESKTOP APP
echo  ==========================================
echo.
echo  [1/3] Starting Frontend Dev Server...
echo.

cd /d "%~dp0frontend"
start "Steam Frontend - Vite" cmd /k "npx --yes vite"

echo  ✓ Frontend starting in new window...
echo.
echo  [2/3] Waiting for frontend to be ready...
timeout /t 8 /nobreak >nul

echo  ✓ Frontend should be ready on http://localhost:5173
echo.
echo  [3/3] Starting Electron Desktop App...
echo.

cd /d "%~dp0"
set NODE_ENV=development
npx --yes electron .

echo.
echo  ==========================================
echo    Application Closed
echo  ==========================================
echo.
echo  Press any key to close all windows...
pause >nul

taskkill /FI "WINDOWTITLE eq Steam Frontend - Vite" /T /F >nul 2>&1
