# Steam Free Games - Hızlı Başlangıç

## 🚀 İlk Çalıştırma (3 Adım)

### Adım 1: Frontend Dev Server'ı Başlat
```bash
cd frontend
npx vite
```
Terminal açık kalacak, **yeni bir terminal açın**.

### Adım 2: Electron Uygulamasını Başlat
Yeni terminalde:
```bash
cd c:\Users\ulasb\steamapp
$env:NODE_ENV="development"
npx electron .
```

✅ **İŞTE BU KADAR!** Electron penceresi açılacak ve uygulamanız çalışacak.

---

## 🎮 Uygulama Özellikleri

- **Sistem Tray**: Pencereyi kapatınca tray'de çalışır
- **Menüler**: Türkçe native menüler
- **Kısayollar**:
  - F5: Oyunları yenile
  - Ctrl+H: Gizle
  - Alt+F4: Çık

## 📦 Production Build (İleride)

Windows için .exe oluşturmak için önce frontend build'i yapın:

```bash
cd frontend
npm run build
```

Sonra ana dizinde:
```bash
npm run build:win
```

Çıktı: `dist/Steam Free Games Setup 1.0.0.exe`

---

## ℹ️ Notlar

- **Backend**: Otomatik olarak Electron içinde başlar (port 3001)
- **Frontend Development** : http://localhost:5173
- **Electron Dev Tools**: Otomatik açılır
- **Tray İcon**: Sağ tık yapınca menü görünür

## 🐛 Sorun mu var?

1. Port 5173'ün boş olduğundan emin olun
2. Port 3001'in boş olduğundan emin olun  
3. `backend/.env` dosyasında Steam bilgileriniz olsun

Keyifli kodlamalar! 🎉
