# 📦 Uygulama Build Rehberi

## Genel Bakış
Bu belge, Steam Free Games uygulamasını Windows için exe dosyası olarak paketleme sürecini açıklar.

## Gereksinimler
- Node.js (v16 veya üzeri)
- npm
- electron-builder (devDependencies içinde yüklü)

## Build Tipleri

### 1. Installer (Kurulum Dosyası)
Kullanıcıların bilgisayarlarına kurabileceği tam özellikli bir kurulum programı.

**Özellikler:**
- Program Files'a kurulum
- Başlat menüsüne kısayol
- Masaüstü kısayolu
- Kaldırma programı
- Otomatik güncellemeler için altyapı

**Komut:**
```bash
npm run build:installer
```

**Çıktı:**
- `dist/Steam Free Games-1.0.0-Setup.exe` (Kurulum dosyası)

### 2. Portable (Taşınabilir Versiyon)
Kurulum gerektirmeyen, USB'den çalıştırılabilen versiyon.

**Özellikler:**
- Kurulum gerektirmez
- USB veya herhangi bir klasörden çalışır
- Sistem değişikliği yapmaz
- Hızlı test için ideal

**Komut:**
```bash
npm run build:portable
```

**Çıktı:**
- `dist/Steam Free Games-1.0.0-Portable.exe`

### 3. Her İkisi Birden
Hem installer hem portable versiyonları oluşturur.

**Komut:**
```bash
npm run build:win
```

**Çıktı:**
- `dist/Steam Free Games-1.0.0-Setup.exe`
- `dist/Steam Free Games-1.0.0-Portable.exe`

## Adım Adım Build Süreci

### 1. Ön Hazırlık
```bash
# Tüm bağımlılıkları yükle
npm install

# Frontend bağımlılıklarını yükle
cd frontend
npm install
cd ..
```

### 2. Frontend Build
```bash
npm run build
```
Bu komut frontend/dist klasörünü oluşturur.

### 3. Electron Build
```bash
# Sadece installer için
npm run build:installer

# Sadece portable için
npm run build:portable

# Her ikisi için
npm run build:win
```

### 4. Çıktıyı Kontrol Et
Build tamamlandığında `dist` klasöründe şu dosyaları bulacaksınız:
- `Steam Free Games-1.0.0-Setup.exe` - Kurulum dosyası (~150-200 MB)
- `Steam Free Games-1.0.0-Portable.exe` - Taşınabilir versiyon (~150-200 MB)
- `win-unpacked/` - Paketlenmemiş dosyalar (test için)

## Build Yapılandırması

### İkon Dosyası
- Konum: `electron/icon.png`
- Format: PNG (electron-builder otomatik olarak .ico'ya çevirir)
- Önerilen boyut: 512x512 veya 256x256

### NSIS Kurulum Ayarları
- **Dil:** Türkçe (language: 1055)
- **Kurulum Tipi:** Kullanıcı seçimli (oneClick: false)
- **Kurulum Klasörü:** Değiştirilebilir
- **Kısayollar:** Masaüstü ve Başlat Menüsü
- **Kurulum Sonrası:** Uygulama otomatik başlar

### Dosya Boyutu Optimizasyonu
package.json'daki `files` bölümünde gereksiz dosyalar hariç tutulmuştur:
- Test dosyaları
- README ve CHANGELOG dosyaları
- Source map dosyaları
- Geliştirme araçları

## Sorun Giderme

### Build Hatası: "Cannot find module"
```bash
# node_modules'u temizle ve yeniden yükle
rm -rf node_modules
npm install
```

### Build Hatası: "Frontend dist not found"
```bash
# Frontend'i önce build et
cd frontend
npm run build
cd ..
```

### İkon Gösterilmiyor
- `electron/icon.png` dosyasının var olduğundan emin olun
- PNG formatında ve en az 256x256 boyutunda olmalı
- Build'i temizleyip yeniden deneyin: `rm -rf dist && npm run build:win`

### Build Çok Yavaş
- İlk build uzun sürebilir (5-10 dakika)
- Sonraki build'ler daha hızlı olacaktır
- SSD kullanımı build süresini kısaltır

## Dağıtım

### Kullanıcılara Dağıtım
1. **Installer Versiyonu (Önerilen):**
   - `Steam Free Games-1.0.0-Setup.exe` dosyasını paylaşın
   - Kullanıcılar çift tıklayarak kurabilir
   - Otomatik güncelleme desteği var

2. **Portable Versiyon:**
   - `Steam Free Games-1.0.0-Portable.exe` dosyasını paylaşın
   - Kurulum gerektirmez
   - USB'den çalıştırılabilir

### Dosya Paylaşımı
- Google Drive
- Dropbox
- GitHub Releases
- OneDrive
- WeTransfer

### Boyut Uyarısı
- Her exe dosyası ~150-200 MB olabilir
- Chromium ve Node.js runtime'ı içerir
- Bu Electron uygulamaları için normaldir

## Versiyon Güncelleme

Yeni versiyon çıkarmak için:

1. `package.json` içindeki version numarasını artır:
```json
{
  "version": "1.0.1"
}
```

2. Build'i yeniden çalıştır:
```bash
npm run build:win
```

3. Yeni exe dosyaları `dist` klasöründe oluşacaktır.

## Otomatik Güncelleme (Gelecek)

Şu anda otomatik güncelleme yapılandırılmamış. Eklemek için:
- electron-updater paketi gerekli
- GitHub Releases veya kendi sunucunuz gerekli
- main.js'de güncelleme mantığı eklenmeli

## Notlar

- Build işlemi internet bağlantısı gerektirir (ilk seferde)
- Antivirus yazılımları build'i yavaşlatabilir
- Windows Defender bazen exe'yi tarayabilir
- İlk build 5-10 dakika sürebilir
- Sonraki build'ler daha hızlıdır (cache sayesinde)

## Hızlı Referans

```bash
# Geliştirme modunda çalıştır
npm run dev

# Frontend build
npm run build

# Sadece installer
npm run build:installer

# Sadece portable
npm run build:portable

# Her ikisi
npm run build:win

# Electron'u doğrudan çalıştır (development mode)
npm start

# Production modunda çalıştır (installer olmadan test için)
npm run start:prod
```

## Production vs Development Mode

### Development Mode
- `npm run dev` komutuyla çalışır
- Frontend development server'a (`http://localhost:5173`) bağlanır
- Hot reload özelliği vardır
- DevTools otomatik açılır
- **Uyarı:** Bilgisayar başlangıcında development server çalışmadığı için boş ekran açılır

### Production Mode
- `npm run start:prod` komutuyla çalışır
- Build edilmiş frontend dosyalarını (`frontend/dist`) kullanır
- DevTools kapalıdır
- Daha hızlı başlar
- **Önerilen:** Installer kullanarak kurulum yapın, otomatik olarak production modunda çalışır

