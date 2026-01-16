# Masaüstüne Steam CLI kısayolu oluştur

$DesktopPath = [Environment]::GetFolderPath("Desktop")
$TargetPath = Join-Path $PSScriptRoot "Steam-CLI.bat"
$ShortcutPath = Join-Path $DesktopPath "Steam CLI.lnk"

# WScript.Shell COM objesi oluştur
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)

# Kısayol özelliklerini ayarla
$Shortcut.TargetPath = $TargetPath
$Shortcut.WorkingDirectory = $PSScriptRoot
$Shortcut.Description = "Steam Ücretsiz Oyun Yöneticisi - Terminal CLI"
$Shortcut.IconLocation = "powershell.exe,0"  # PowerShell ikonu

# Kısayolu kaydet
$Shortcut.Save()

Write-Host ""
Write-Host "Basarili! Kisayol olusturuldu!" -ForegroundColor Green
Write-Host ""
Write-Host "Konum: $ShortcutPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Artik masaustundeki 'Steam CLI' kisayoluna cift tiklayarak" -ForegroundColor Yellow
Write-Host "uygulamayi baslatabilirsiniz!" -ForegroundColor Yellow
Write-Host ""
pause
