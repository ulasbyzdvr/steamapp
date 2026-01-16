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

---

## 🔄 Son Güncellemeler (2026-01-07)

### ✅ Düzeltilen Sorunlar:
- **"Invalid Date" hatası düzeltildi**: Geçersiz bitiş tarihleri artık ekrana yazdırılmıyor
- **Cookie geçerlilik kontrolü eklendi**: Bilgisayar yeniden başlatıldığında expire olmuş cookie'ler otomatik tespit ediliyor
- **Oturum persistance iyileştirildi**: Steam oturumu artık daha güvenilir şekilde korunuyor

### 🆕 Yeni Özellikler:
- **🎮 Başlangıçta Yeni Oyun Kontrolü**: Bilgisayar açıldığında yeni ücretsiz oyunları kontrol eder ve bildirim gösterir
  - Ayarlardan açılıp kapatılabilir
  - Otomatik toplamaz, sadece bildirim gösterir
  - Steam'e giriş yapılmışsa çalışır

Detaylı bilgi için: [`memory-bank/recent-fixes.md`](memory-bank/recent-fixes.md)

---

## 💻 Terminal CLI Uygulaması (YENİ!)

### Arayüzsüz Terminal Uygulaması

Grafik arayüzü olmadan, sadece terminal üzerinden çalışan hafif bir alternatif!

#### Başlatma:
```powershell
cd cli
node cli.js
```

veya Windows için:
```powershell
cd cli
start-cli.bat
```

#### Özellikler:
- 🎯 **İnteraktif Menü**: 8 farklı seçenek
- 🎨 **Renkli Çıktılar**: ANSI renk kodları ile kullanıcı dostu arayüz
- ⚡ **Hafif ve Hızlı**: GUI olmadan çalışır
- 🔄 **Tam Özellik**: Electron uygulamasının tüm özellikleri
- 🤖 **Otomasyon Dostu**: Script'lerle entegre edilebilir

#### Menü Seçenekleri:
1. Steam'e Giriş Yap
2. Giriş Durumunu Kontrol Et
3. Ücretsiz Oyunları Listele
4. Kütüphanemi Görüntüle
5. Oyun Talep Et (Seçili)
6. Tüm Ücretsiz Oyunları Talep Et
7. Kullanıcı Bilgilerimi Göster
8. Çıkış Yap
0. Programdan Çık

#### Kullanım Senaryoları:
- 🖥️ Uzaktan sunucularda çalıştırma
- 📜 Batch script'lerle otomasyon
- 💾 Düşük kaynak kullanımı gereken durumlar
- ⚙️ CI/CD pipeline entegrasyonu

Detaylı kullanım için: `cli/README.md`

