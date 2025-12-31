# 🚀 Steam Free Games - TEK TIK İLE BAŞLAT!

## ✨ EN KOLAY YÖNTEM

### `START.bat` ← Bu dosyaya ÇİFT TIKLAYIN! 🖱️

Otomatik olarak:
1. ✅ Frontend dev server başlar (arka planda)
2. ✅ 5 saniye bekler (frontend hazır olsun)
3. ✅ Electron desktop app açılır
4. ✅ Backend otomatik entegre

**TEK TIK = TAM ÇÖZüM!** 🎉

---

## 📋 Ne Yapıyor?

```
START.bat çalıştırınca:
├── Frontend (Vite Dev Server)
│   └── http://localhost:5173 (arka planda)
├── Electron (Desktop App)
│   ├── Window açılır
│   ├── Backend başlar (port 3001)
│   ├── DevTools açılır
│   └── Sistem tray aktif olur
```

---

## 🎮 Kullanım

1. **`START.bat`** dosyasına çift tıklayın
2. Yeşil konsol penceresi açılır
3. 5 saniye bekler (frontend hazırlanıyor)
4. Electron penceresi otomatik açılır
5. **HAZIR!** 🎊

### Kapatmak İçin:
- Electron penceresinde: **Alt+F4** veya **X** tuşu
- Sistem tray'den: **Sağ tık → Çıkış**

---

## 🛠️ Alternatif Yöntemler

### Manuel Başlatma:
```powershell
# Terminal 1
cd frontend
npx vite

# Terminal 2
$env:NODE_ENV="development"
npx electron .
```

### Sadece Web Uygulaması:
```powershell
cd frontend
npx vite
# Tarayıcıda: http://localhost:5173
```

---

## 🎯 Özellikler

- ✅ **Sistem Tray**: Arka planda çalışır
- ✅ **Otomatik Backend**: Express + Puppeteer entegre
- ✅ **DevTools**: Geliştirme için hazır
- ✅ **F5**: Oyunları yenile
- ✅ **Ctrl+H**: Pencereyi gizle
- ✅ **Türkçe Menüler**: Native Windows menüsü

---

## 📝 Notlar

- İlk çalıştırmada paketler indirilir (biraz yavaş)
- Sonraki çalıştırmalarda çok hızlı açılır
- Frontend konsol penceresi arka planda kalır (kapatmayın!)
- Electron'u kapattığınızda frontend de kapatılabilir

---

## 🎊 Steam Free Games - Hazır!

Artık tek tıkla masaüstü uygulamanızı kullanabilirsiniz! 🚀🎮✨

**Keyifli oyunlar!**
