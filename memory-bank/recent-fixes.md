# 🔄 Son Yapılan Düzeltmeler

## 2026-01-19: Cookie Persistence (Kalıcılık) Sorunu Çözüldü

### Sorun
**Kritik Bug**: Bilgisayar kapatılıp açıldığında cookie'ler sürekli bozuluyordu. Kullanıcı her seferinde logout/login yapmak zorunda kalıyordu.

**Kullanıcı Geri Bildirimi**: "ama bilgisayar kapatılıp açıldığında cookie hep bozuluyor"

**Ne Oluyordu?**
1. Steam'e giriş yapılıyordu, cookie'ler kaydediliyordu ✅
2. Bilgisayar kapatılıp açılıyordu 🔄
3. Uygulama başlatılıyordu - cookie'ler yüklenmeye çalışılıyordu
4. Steam oturum doğrulaması BAŞARISIZ oluyordu ❌
5. Kullanıcı tekrar login yapmak zorunda kalıyordu 😞

### Kök Neden Analizi

**Format Uyumsuzluğu**:
- `saveCookies()` fonksiyonu: Puppeteer'ın native formatında cookie'leri kaydediyordu
- `getOwnedGameTitles()` fonksiyonu: Electron cookie formatından Puppeteer formatına dönüştürmeye çalışıyordu
- `init()` fonksiyonu: Direkt Puppeteer formatında bekliyordu

**Spesifik Sorunlar**:
1. **expires vs expirationDate**: Bazı yerlerde `expires`, bazı yerlerde `expirationDate` kullanılıyordu
2. **Domain Kayıpları**: `getOwnedGameTitles()` içinde tüm cookie'ler varsayılan olarak `.steampowered.com` domain'ine atanıyordu (bazı cookie'ler `steamcommunity.com` için olabilir)
3. **Gereksiz Dönüşümler**: Her cookie yüklemede format dönüşümü yapılıyordu ve bu sırada veri kaybı olabiliyordu

### Çözüm

**1. Cookie Normalizasyonu** (`saveCookies()` fonksiyonu)
```javascript
// Puppeteer formatında normalize et ve kaydet
const normalizedCookies = cookies.map(cookie => ({
    name: cookie.name,
    value: cookie.value,
    domain: cookie.domain,        // Orijinal domain korunuyor
    path: cookie.path || '/',
    expires: cookie.expires || -1, // Tutarlı field name
    httpOnly: cookie.httpOnly || false,
    secure: cookie.secure || false,
    sameSite: cookie.sameSite || 'Lax'
}));
```

**2. Basitleştirilmiş Yükleme**
- Artık format dönüşümü YOK
- Cookie'ler kaydedildiği formatta yükleniyor
- Domain bilgileri korunuyor

**3. Detaylı Loglama**
```
[saveCookies] ✅ Saved 15 cookies. steamLoginSecure expires: 19.01.2026 12:30:45
[init] ✅ Loaded 15 cookies. steamLoginSecure expires: 19.01.2026 12:30:45
```

**4. Expire Kontrolü Standardizasyonu**
- `checkLoginSimple()`: Artık sadece `expires` field'ını kontrol ediyor
- `expirationDate` kullanımı kaldırıldı

### Değişen Dosyalar

**`backend/steamBot.js`**:
1. `saveCookies()` (satır 199-233): Cookie normalizasyon ve detaylı loglama
2. `init()` (satır 124-143): Basitleştirilmiş cookie yükleme ve loglama
3. `getOwnedGameTitles()` (satır 398-413): Format dönüşümü kaldırıldı
4. `checkLoginSimple()` (satır 75-96): Sadece `expires` field'ı kontrolü

### Kullanıcı Aksiyonu Gerekli

⚠️ **ÖNEMLİ**: Mevcut cookie'ler eski formatta olabilir!

**İlk Defa Test Edecekseniz**:
1. CLI veya Electron uygulamasından **Logout** yapın
2. Tekrar **Login** yapın (yeni formatta cookie'ler oluşacak)
3. Bilgisayarı kapatıp açın
4. Uygulamayı başlatın - artık otomatik giriş yapmalı! ✅

**Alternatif**: Cookie dosyalarını manuel silin:
```bash
del backend\cookies.json
del backend\user-data.json
```

### Test Senaryosu

1. ✅ Login yap
2. ✅ Terminal'de cookie expire tarihini gör: `steamLoginSecure expires: 19.01.2026 12:30:45`
3. ✅ Bilgisayarı kapat
4. ✅ Bilgisayarı aç
5. ✅ CLI/Electron uygulamasını başlat
6. ✅ Otomatik giriş yapmalı (logout/login gerekmemeli)
7. ✅ Oyun claim etmeyi dene - başarılı olmalı

### Beklenen Sonuçlar

- ✅ Cookie'ler bilgisayar yeniden başlatıldığında bozulmuyor
- ✅ Steam oturumu kalıcı
- ✅ Kullanıcı her seferinde login yapmak zorunda değil
- ✅ Detaylı loglar sayesinde sorunlar daha kolay tespit edilebilir
- ✅ Cookie expire tarihleri doğru gösteriliyor

---

## 2026-01-16: Claim İşlemi Öncesi Steam Oturum Doğrulaması


### Sorun
**Kritik Bug**: Bilgisayar kapatılıp açıldığında Steam hesabına giriş yapmış görünüyordu, oyun claim ederken "başarılı" mesajı gösteriliyordu ama **oyunlar gerçekten Steam hesabına eklenmiyordu**.

**Neden Oluyordu?**
1. Cookie'ler dosya sisteminde saklandığı için bilgisayar yeniden başlatıldığında hala geçerli görünüyordu
2. `processGames` fonksiyonu browser'ı restart ettikten sonra Steam oturumunun gerçekten aktif olup olmadığını kontrol etmiyordu
3. Cookie'ler set edilse bile Steam bazen bu oturumu kabul etmiyordu
4. Kullanıcı arayüzde "giriş yapılmış" olarak görünüyordu ama arka planda oturum geçersizdi
5. Claim butonuna basıldığında işlem başarılı gibi gösteriliyordu ama Steam API'si isteği reddettiği için oyun eklenmiyordu

### Çözüm

**Dosya**: `backend/steamBot.js` (Satır 458-475)

**Eklenen Özellik**: processGames fonksiyonuna kritik oturum doğrulaması eklendi:

```javascript
// CRITICAL: Verify Steam login after browser restart
console.log('🔍 Verifying Steam login before claiming...');
const isLoggedIn = await this.checkLogin();

if (!isLoggedIn) {
    console.error('❌ Steam login verification FAILED. Session might be expired.');
    logCallback({
        type: 'error',
        message: 'Steam oturumu geçersiz. Lütfen çıkış yapıp tekrar giriş yapın.'
    });
    return [{
        game: 'System Error',
        status: 'error',
        message: 'Steam session expired. Please logout and login again.'
    }];
}

console.log('✅ Steam login verified successfully.');
```

**Ne Değişti?**
1. **Browser Restart Sonrası Doğrulama**: Browser headless modda yeniden başlatıldıktan SONRA Steam'e gerçekten giriş yapılıp yapılmadığı kontrol ediliyor
2. **Gerçek Oturum Kontrolü**: `checkLogin()` fonksiyonu Steam account sayfasına giderek gerçek oturum durumunu test ediyor
3. **Erken Hata Yakalama**: Eğer oturum geçersizse claim işlemi başlamadan ÖNCE kullanıcı uyarılıyor
4. **Net Hata Mesajı**: Kullanıcıya "Lütfen çıkış yapıp tekrar giriş yapın" şeklinde net talimat veriliyor

### Etkilenen Kullanıcı Senaryoları

**Senaryo 1: Bilgisayar Yeniden Başlatma**
- ✅ Artık claim işlemi öncesinde oturum doğrulanıyor
- ✅ Oturum geçersizse kullanıcı hemen bilgilendiriliyor
- ✅ Oyunun "claim edildi" ama hesaba eklenmedi durumu önleniyor

**Senaryo 2: Uzun Süre Açık Kalma**
- ✅ Steam cookie'leri zaman aşımına uğrarsa tespit ediliyor
- ✅ İşlem yapmadan önce oturum yenilenmesi gerektiği bildiriliyor

**Senaryo 3: Manuel Claim**
- ✅ Her claim işlemi öncesi oturum kontrolü yapılıyor
- ✅ Başarısız claim işlemleri önleniyor

### Test Adımları
1. Steam'e giriş yapın
2. Bilgisayarı yeniden başlatın (veya uzun süre bekleyin)
3. Uygulamayı açın
4. Oyun claim etmeyi deneyin
5. Eğer oturum geçersizse hata mesajı görmelisiniz
6. Çıkış yapıp tekrar giriş yapın
7. Artık claim işlemi düzgün çalışacak

### Dosya Değişiklikleri
- ✏️ `backend/steamBot.js`: `processGames` fonksiyonuna oturum doğrulama eklendi (Satır 458-475)
- 📝 `memory-bank/recent-fixes.md`: Bu bölüm eklendi
- 📝 `memory-bank/troubleshooting.md`: İleriki güncellemede bu sorun eklenecek

---

## 2026-01-07: Cookie Geçerlilik Kontrolü ve Invalid Date Hatası

### Sorunlar
1. **"Invalid Date" Hatası**: Ücretsiz oyunların bitiş tarihi "Invalid Date" olarak gösteriliyordu
2. **Bilgisayar Yeniden Başlatıldığında Oturum Kapanıyor**: Steam hesabına giriş yapıldıktan sonra bilgisayar yeniden başlatıldığında oturum geçersiz hale geliyordu

### Çözümler

#### 1. Invalid Date Hatası Düzeltildi
**Dosya:** `cli/cli.js` (Satır 279-286)

**Ne Değişti:**
```javascript
// Önceki kod:
if (game.expiry) {
    const expiryDate = new Date(game.expiry * 1000);
    console.log(`Bitiş Tarihi: ${expiryDate.toLocaleString(locale)}`);
}

// Yeni kod:
if (game.expiry) {
    const expiryDate = new Date(game.expiry * 1000);
    // Check if date is valid
    if (!isNaN(expiryDate.getTime())) {
        console.log(`Bitiş Tarihi: ${expiryDate.toLocaleString(locale)}`);
    }
}
```

**Açıklama:**
- `game.expiry` değeri `null` veya geçersiz olduğunda `isNaN(expiryDate.getTime())` kontrolü ile kontrol ediliyor
- Geçersiz tarihler artık gösterilmiyor, sadece geçerli tarihler ekrana yazdırılıyor

#### 2. Cookie Geçerlilik Kontrolü Eklendi
**Dosya:** `backend/steamBot.js` (Satır 60-105)

**Ne Değişti:**
```javascript
// Önceki kod:
if (steamLoginCookie) {
    this.log('Steam login cookie FOUND!');
    return true;
}

// Yeni kod:
if (steamLoginCookie) {
    // Check if cookie is expired
    if (steamLoginCookie.expires || steamLoginCookie.expirationDate) {
        const expiryTime = (steamLoginCookie.expires || steamLoginCookie.expirationDate) * 1000;
        const now = Date.now();
        
        if (expiryTime < now) {
            console.log('Steam login cookie EXPIRED. Expiry:', new Date(expiryTime));
            // Delete expired cookies
            try {
                fs.unlinkSync(COOKIES_PATH);
                this.log('Expired cookies deleted.');
            } catch (e) {
                console.error('Error deleting expired cookies:', e.message);
            }
            return false;
        }
    }
    
    this.log('Steam login cookie FOUND and VALID!');
    return true;
}
```

**Açıklama:**
- `checkLoginSimple()` fonksiyonu artık cookie'lerin sadece varlığını değil, geçerliliğini de kontrol ediyor
- Cookie'nin `expires` veya `expirationDate` alanları mevcut ise, bunlar şu anki zaman ile karşılaştırılıyor
- Süresi dolmuş cookie'ler otomatik olarak siliniyor ve kullanıcı yeniden giriş yapmaya yönlendiriliyor
- Bu sayede bilgisayar yeniden başlatıldığında geçersiz cookie'ler tespit edilip temizleniyor

### Etkilenen Kullanıcı Senaryoları

**Senaryo 1: Ücretsiz Oyunları Listeleme**
- ✅ Artık "Invalid Date" hatası görünmüyor
- ✅ Sadece geçerli bitiş tarihleri gösteriliyor

**Senaryo 2: Bilgisayar Yeniden Başlatma**
- ✅ Expire olmuş cookie'ler otomatik tespit ediliyor
- ✅ Geçersiz oturum durumunda kullanıcı bilgilendiriliyor
- ✅ Kullanıcı yeniden giriş yapmaya yönlendiriliyor

### Test Önerileri
1. Uygulamayı kapatın ve yeniden açın
2. Ücretsiz oyunları listeleyin ve bitiş tarihlerini kontrol edin
3. Steam'e giriş yapın
4. Bilgisayarı yeniden başlatın
5. Uygulamayı açın ve oturum durumunu kontrol edin

### Dosya Değişiklikleri
- ✏️ `cli/cli.js`: Tarih validasyonu eklendi
- ✏️ `backend/steamBot.js`: Cookie geçerlilik kontrolü eklendi
- 📝 `memory-bank/troubleshooting.md`: Yeni sorun ve çözüm eklendi
- 📝 `memory-bank/recent-fixes.md`: Bu dosya oluşturuldu

---

## 2026-01-07 (İkinci Güncelleme): Startup'ta Yeni Oyun Kontrolü

### Yeni Özellik
**"Başlangıçta Yeni Oyunları Kontrol Et"** özelliği eklendi!

Bu özellik sayesinde:
- Bilgisayar açıldığında (veya uygulama başladığında) otomatik olarak yeni ücretsiz oyunlar kontrol edilir
- Yeni oyun varsa bildirim gösterilir (Windows 10/11 bildirimleri)
- **Oyunlar otomatik olarak toplanmaz** - sadece bildirim gösterir
- Ayarlardan açılıp kapatılabilir

### Yapılan Değişiklikler

#### 1. Backend - Yeni Oyun Kontrol Fonksiyonu
**Dosya:** `electron/main.js`

**Eklenenler:**
- `checkNewGamesRoutine()`: Yeni fonksiyon eklendi
  - Steam'e giriş yapmışsa kontrol eder
  - Yeni ücretsiz oyunları tespit eder
  - Kütüphanedeki oyunları filtreler
  - En fazla 3 oyun ismini bildirimde gösterir
  - Tray balloon notification gösterir

**Config Değişiklikleri:**
```javascript
// Yeni config değişkeni
{ checkNewGames: false } // Varsayılan olarak kapalı
```

**Startup Sırası:**
1. `runAutoClaimRoutine()` - 3 saniye sonra (Auto-claim özelliği açıksa)
2. `checkNewGamesRoutine()` - 8 saniye sonra (Check new games özelliği açıksa)
3. Her iki özellik bağımsız çalışır

#### 2. Frontend - Ayarlar Paneli
**Dosya:** `frontend/src/components/SettingsModal.jsx`

**Eklenenler:**
- Yeni state: `checkNewGames`
- Yeni handler: `handleCheckNewGamesChange()`
- Yeni toggle switch bileşeni
- Electron API entegrasyonu

#### 3. IPC Communication
**Dosya:** `electron/preload.js`

**Yeni API'ler:**
- `getCheckNewGamesStatus()`: Mevcut durumu getir
- `toggleCheckNewGames(enable)`: Özelliği aç/kapat

#### 4. Çeviriler
**Dosya:** `frontend/src/translations.js`

**Türkçe:**
- `check_new_games`: "Başlangıçta Yeni Oyunları Kontrol Et"
- `check_new_games_desc`: "Uygulama başladığında yeni ücretsiz oyunları kontrol et ve bildirim göster (otomatik toplamaz)."

**İngilizce:**
- `check_new_games`: "Check for New Games on Startup"
- `check_new_games_desc`: "Check for new free games when the app starts and show a notification (does not auto-claim)."

### Kullanım

1. **Ayarları Açın**: Uygulama → Ayarlar (⚙️ ikonu)
2. **Özelliği Aktifleştirin**: "Başlangıçta Yeni Oyunları Kontrol Et" toggle'ını açın
3. **Uygulamayı Kapatıp Açın**: Yeni oyun olup olmadığı kontrol edilecek
4. **Bildirim Alın**: Yeni oyun varsa Windows bildirimi göreceksiniz

### Bildirim Örnekleri

**Yeni oyun varsa:**
```
🎮 3 Yeni Ücretsiz Oyun!
Billie's Wheelie, Game Name 2, Game Name 3 (+2 daha)

Uygulamayı açıp toplamak için tıklayın.
```

**Yeni oyun yoksa:**
```
Steam Free Games
Yeni ücretsiz oyun yok. Tüm oyunlar zaten kütüphanenizde!
```

### Auto-Claim ile Farkı

| Özellik | Auto-Claim | Check New Games |
|---------|------------|-----------------|
| **Ne Yapar** | Oyunları otomatik toplar | Sadece kontrol eder, bildirim gösterir |
| **Bildirim** | "Toplanıyor..." | "X yeni oyun var!" |
| **Kullanıcı Aksiyonu** | Gerekmiyor | Kullanıcı manuel toplamalı |
| **Gecikme** | 3 saniye | 8 saniye |
| **Ayarlar** | "Oyunları Otomatik Topla" | "Başlangıçta Yeni Oyunları Kontrol Et" |

### Dosya Değişiklikleri
- ✏️ `electron/main.js`: `checkNewGamesRoutine()` fonksiyonu eklendi
- ✏️ `electron/preload.js`: Yeni IPC handler'ları eklendi
- ✏️ `frontend/src/components/SettingsModal.jsx`: Yeni toggle switch eklendi
- ✏️ `frontend/src/translations.js`: Türkçe/İngilizce çeviriler eklendi
- ✏️ `cli/cli.js`: CLI uygulamasına da aynı özellik eklendi
- 📝 `memory-bank/recent-fixes.md`: Bu bölüm eklendi

### CLI Uygulamasında Kullanım

CLI uygulamasında yeni oyun kontrolü şu şekilde çalışır:

1. **Ayarları Açın**: CLI menüsünden "Ayarlar" seçin
2. **Özelliği Aktifleştirin**: 
   ```
   3. Başlangıçta Yeni Oyun Kontrolü [OFF]
   ```
   Bu seçeneği seçerek açın/kapatın
3. **CLI'yı Yeniden Başlatın**: Ayar aktifse, başlangıçta yeni oyunlar kontrol edilir
4. **Terminal'de Görün**: Yeni oyunlar varsa terminal'de liste görünür

**CLI Çıktı Örneği:**
```
✓ Otomatik giriş başarılı!

ℹ Yeni oyunlar kontrol ediliyor...

✓ 🎮 3 yeni ücretsiz oyun bulundu!

1. Billie's Wheelie
2. Game Name 2
3. Game Name 3

ℹ Listeyi görmek için menüden "Ücretsiz Oyunları Listele" seçin.
```


