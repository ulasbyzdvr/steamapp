@echo off
chcp 65001 >nul
cls
echo.
echo ╔═══════════════════════════════════════════════════╗
echo ║                                                   ║
echo ║     🎮 STEAM ÜCRETSİZ OYUN YÖNETİCİSİ - CLI      ║
echo ║                                                   ║
echo ╚═══════════════════════════════════════════════════╝
echo.
echo Uygulama başlatılıyor...
echo.

cd /d "%~dp0"
node cli.js

pause
