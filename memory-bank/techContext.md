# Tech Context

## Teknoloji Yığını

### Desktop App
- **Framework**: Electron 28.x
- **Main Process**: Node.js (Backend entegrasyonu)
- **Renderer Process**: React 19 + Vite
- **Build Tool**: electron-builder

### Frontend
- **Framework**: React 19.2.x
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js
- **Framework**: Express 4.x
- **Web Automation**: Puppeteer
- **Environment**: dotenv

### Paketler
- **concurrently**: Dev ortamında paralel process çalıştırma
- **wait-on**: Frontend hazır olana kadar bekleme
- **electron-builder**: Windows/Mac/Linux installer oluşturma

## Electron Yapısı
```
electron/
  ├── main.js       # Ana süreç (backend + window yönetimi)
  ├── preload.js    # Güvenli IPC köprüsü
  ├── icon.png      # Uygulama ikonu
  └── tray-icon.png # Sistem tray ikonu

frontend/         # React uygulaması
backend/          # Express + Puppeteer servisi
```

## Build Süreçleri
- **Development**: `npm run dev` - Vite dev server + Electron
- **Production Build**: 
  - `npm run build:win` - Hem installer hem portable
  - `npm run build:installer` - Sadece NSIS installer
  - `npm run build:portable` - Sadece portable exe
- **Start App**: `npm start` - Sadece Electron başlat
- **Output**: `dist/` klasöründe exe dosyaları

## Build Özellikleri
- **Installer**: NSIS tabanlı, Türkçe dil desteği
- **Portable**: Kurulum gerektirmeyen, USB'den çalışır
- **Dosya Boyutu**: ~150-200 MB (Chromium runtime dahil)
- **İkon**: PNG formatından otomatik .ico dönüşümü

## Geliştirme Ortamı
- OS: Windows
- Node Version: Latest LTS
- Package Manager: npm
