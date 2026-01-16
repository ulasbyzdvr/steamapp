@echo off
echo.
echo ==========================================
echo   CLI AUTO-START SETUP
echo ==========================================
echo.
echo Bu script, Steam CLI'yi bilgisayar baslangicindan
echo 30 saniye sonra otomatik baslatmak icin Windows
echo Gorev Zamanlayici'ya ekleyecek.
echo.
echo UYARI: Bu islem yonetici yetkisi gerektirir!
echo.
pause

echo.
echo Gorev olusturuluyor...
echo.

schtasks /create /tn "Steam CLI Auto Start" /tr "\"%~dp0Steam-CLI.bat\"" /sc onlogon /delay 0000:30 /rl highest /f

if %errorlevel% equ 0 (
    echo.
    echo ==========================================
    echo   BASARILI!
    echo ==========================================
    echo.
    echo Steam CLI artik bilgiasayar her acildiginda
    echo otomatik olarak baslayacak ^(30 saniye gecikme ile^).
    echo.
    echo Gorevi kaldirmak isterseniz:
    echo   schtasks /delete /tn "Steam CLI Auto Start" /f
    echo.
) else (
    echo.
    echo ==========================================
    echo   HATA!
    echo ==========================================
    echo.
    echo Gorev olusturulamadi. Lutfen bu .bat dosyasini
    echo "Yonetici Olarak Calistir" ile calistirin.
    echo.
)

pause
