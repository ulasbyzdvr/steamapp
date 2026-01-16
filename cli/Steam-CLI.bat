@echo off
chcp 65001 >nul
title Steam CLI - Ücretsiz Oyun Yöneticisi

REM CLI klasörüne git
cd /d "%~dp0"

REM Node.js kurulu mu kontrol et
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ HATA: Node.js bulunamadı!
    echo.
    echo Lütfen Node.js'i yükleyin: https://nodejs.org
    echo.
    pause
    exit /b 1
)

REM CLI'yı başlat
cls
node cli.js

REM Hata durumunda pencereyi açık tut
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Bir hata oluştu!
    echo.
    pause
)
