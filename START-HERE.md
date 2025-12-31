# 🎮 Steam Free Games - ÇALIŞAN SÜRÜM!

## ✅ TEK TIK İLE BAŞLAT

### Yöntem 1: Frontend + Backend (Web)
1. **`frontend\start.bat`** dosyasına çift tıklayın
2. Tarayıcınızda http://localhost:5173 açın
3. Backend otomatik başlar

### Yöntem 2: Electron Desktop App  
1. **`start-electron.bat`** dosyasına çift tıklayın  
2. Electron penceresi otomatik açılır!

---

## 🛠️ Manuel Başlatma (Detaylı Kontrol)

### Frontend:
```powershell
cd frontend
npx --yes -p vite@5.0.8 -p @vitejs/plugin-react -p tailwindcss -p autoprefixer -p postcss vite
```

### Backend:
```powershell
cd backend
node server.js
```

### Electron (Frontend çalışırken):
```powershell
$env:NODE_ENV="development"
npx electron .
```

---

## 📝 Notlar

- **npm sorunu**: Sisteminizdeki npm cache sorunu var, `npx` bu sorunu bypass ediyor
- **Paketler**: Her çalıştırmada gerekli paketler otomatik indirilir (ilk seferde biraz yavaş)
- **Çözüm**: `npm cache clean --force` ve Node.js yeniden kurulumu düzeltebilir

---

## 🎯 Önerilen Kullanım

**En kolay**: `start-electron.bat` → Çift tık → Hazır! 🚀

Electron olmadan sadece web uygulaması: `frontend\start.bat`

İyi eğlenceler! 🎮✨
