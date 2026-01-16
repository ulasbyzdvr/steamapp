@echo off
echo.
echo ==========================================
echo   CLI AUTO-START REMOVAL
echo ==========================================
echo.
echo Bu script, Steam CLI otomatik baslatma
echo gorevini Windows Gorev Zamanlayici'dan
echo kaldiracak.
echo.
pause

echo.
echo Gorev kaldiriliyor...
echo.

schtasks /delete /tn "Steam CLI Auto Start" /f

if %errorlevel% equ 0 (
    echo.
    echo ==========================================
    echo   BASARILI!
    echo ==========================================
    echo.
    echo Steam CLI otomatik baslatma gorevi kaldirildi.
    echo.
) else (
    echo.
    echo ==========================================
    echo   UYARI
    echo ==========================================
    echo.
    echo Gorev bulunamadi veya zaten kaldirilmis.
    echo.
)

pause
