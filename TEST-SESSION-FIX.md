# 🔧 Session Expire Sorunu - Test Talimatları

## Sorun Çözüldü! ✅

**Kök Neden**: `steamLoginSecure` cookie'si hiç kaydedilmiyordu çünkü sadece `store.steampowered.com` domain'inden cookie toplanıyordu. Ama bu cookie `.steamcommunity.com` domain'inde saklanıyor.

**Çözüm**: Artık tüm Steam domain'lerinden (store, community, help, login) cookie toplanıyor.

## Test Adımları - LÜTFEN TAKİP EDİN! 🎯

### Adım 1: Eski Cookie'leri Temizle
```bash
cd c:\Users\ulasb\steamapp
del backend\cookies.json
del backend\user-data.json
```

### Adım 2: CLI Uygulamasını Başlat
```bash
npm run cli
```

### Adım 3: Steam'e Giriş Yap
1. Menüden "1" seçerek Login yapın
2. Tarayıcı açılacak, Steam'e giriş yapın
3. **ÖNEMLİ**: Terminal'de şu mesajları görmeli siniz:

```
[saveCookies] 📂 Collecting cookies from all Steam domains...
[saveCookies] 📊 Total cookies found: 15-20 (sayı değişebilir)
[saveCookies] 📋 Cookie names: steamLoginSecure, sessionid, browserid, ...
[saveCookies] 🔑 Found login cookie: steamLoginSecure  ← BU ÇOK ÖNEMLİ!
[saveCookies] 🌐 Domain: .steamcommunity.com
[saveCookies] ⏰ Expires: 30.01.2027 17:56:24
[saveCookies] ✅ Saved 15 cookies successfully!
```

### Adım 4: Uygulamayı Kapat ve Yeniden Başlat
```bash
# CLI'dan çıkış yapın (0 tuşu)
# Sonra tekrar başlatın:
npm run cli
```

### Adım 5: Otomatik Giriş Kontrolü
Uygulama başladığında şu mesajları görmeli siniz:

```
[checkLoginSimple] 📂 Cookies loaded, count: 15
[checkLoginSimple] 📋 Available cookies: steamLoginSecure, sessionid, ...
[checkLoginSimple] 🔑 Found login cookie: steamLoginSecure  ← BU ÇOK ÖNEMLİ!
[checkLoginSimple] 🌐 Cookie domain: .steamcommunity.com
[checkLoginSimple] ⏰ Cookie expires: 30.01.2027 17:56:24
[checkLoginSimple] 🕐 Current time: 30.01.2026 17:56:24
[checkLoginSimple] ✅ Steam login cookie FOUND and VALID!
```

### Adım 6: Oyun Claim Testi
1. Menüden "5" seçerek "Tüm Oyunları Talep Et" yapın
2. **ÖNEMLİ**: Şu mesajı görmeli siniz:

```
🔍 Verifying Steam login before claiming...
✅ Steam login verified successfully.  ← BU ÇOK ÖNEMLİ!
```

3. Eğer "❌ Steam login verification FAILED" mesajı görürseniz, sorun devam ediyor demektir.

## Başarı Kriterleri ✅

- [ ] `steamLoginSecure` cookie'si kaydedildi
- [ ] Uygulama yeniden başlatıldığında otomatik giriş yapıldı
- [ ] Oyun claim öncesi "✅ Steam login verified successfully" mesajı görüldü
- [ ] Oyunlar başarıyla claim edildi

## Sorun Devam Ederse 🆘

Eğer hala "steamLoginSecure cookie NOT FOUND" mesajı görüyorsanız:

1. Terminal çıktısını tam olarak kaydedin
2. `backend/cookies.json` dosyasının içeriğini gönderin
3. Hangi adımda hata aldığınızı belirtin

## Bilgisayar Yeniden Başlatma Testi 🔄

Yukarıdaki adımlar başarılıysa:

1. Bilgisayarı kapatın
2. Bilgisayarı açın
3. CLI uygulamasını başlatın
4. Otomatik giriş yapmalı (logout/login gerekmemeli)
5. Oyun claim etmeyi deneyin - başarılı olmalı

---

**Son Güncelleme**: 30 Ocak 2026
**Düzeltilen Dosya**: `backend/steamBot.js`
**Değişiklik**: `saveCookies()`, `init()`, `checkLoginSimple()` fonksiyonları
