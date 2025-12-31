# Steam Free Games Uygulamasını EXE Olarak Paketleme

## Mevcut Durum
Uygulamanızda electron-builder yapılandırması mevcut ancak bazı bağımlılık sorunları var.

## Çözüm Adımları

### Yöntem 1: Basit Build (Önerilen)

1. **Tüm bağımlılıkları temiz yükle:**
```bash
# Ana dizinde
npm install electron@28.0.0 electron-builder@24.9.1 concurrently@8.2.2 wait-on@7.2.0 --save-dev

# Frontend dizininde
cd frontend
npm install
cd ..
```

2. **Frontend'i build et:**
```bash
npm run build
```

3. **Portable EXE oluştur:**
```bash
npx electron-builder --win portable --config package.json
```

4. **Veya Installer oluştur:**
```bash
npx electron-builder --win nsis --config package.json
```

### Yöntem 2: Manuel Paketleme

Eğer electron-builder sorun çıkarmaya devam ederse, manuel olarak paketleyebilirsiniz:

1. **electron-packager kullan:**
```bash
npm install electron-packager --save-dev
npx electron-packager . "Steam Free Games" --platform=win32 --arch=x64 --out=dist --overwrite --icon=electron/icon.png
```

Bu komut `dist/Steam Free Games-win32-x64/` klasöründe çalıştırılabilir dosyalar oluşturur.

2. **Çıktıyı test et:**
```bash
cd "dist/Steam Free Games-win32-x64"
"Steam Free Games.exe"
```

### Yöntem 3: Electron Forge (Alternatif)

```bash
npm install --save-dev @electron-forge/cli
npx electron-forge import
npx electron-forge make
```

## Önemli Notlar

1. **Frontend Build:** Her zaman önce `npm run build` ile frontend'i build edin
2. **İkon Dosyası:** `electron/icon.png` dosyanız mevcut
3. **Çıktı Klasörü:** Build edilen dosyalar `dist/` klasöründe olacak
4. **Boyut:** EXE dosyası ~150-200 MB olacak (Chromium dahil)

## Sorun Giderme

### "Cannot find module" hatası
```bash
rm -rf node_modules package-lock.json
npm install
```

### Build çok yavaş
- İlk build 5-10 dakika sürebilir
- Antivirus'ü geçici olarak kapatın
- SSD kullanın

### İkon gösterilmiyor
- PNG dosyasının 256x256 veya daha büyük olduğundan emin olun
- Veya .ico formatında bir dosya kullanın

## Hızlı Test

Uygulamayı build etmeden test etmek için:
```bash
npm start
```

## Dağıtım

Build tamamlandığında:
- `dist/Steam Free Games-1.0.0-Portable.exe` - Taşınabilir versiyon
- `dist/Steam Free Games-1.0.0-Setup.exe` - Kurulum dosyası

Bu dosyaları kullanıcılara dağıtabilirsiniz.
