# 🔧 Sorun Giderme Rehberi

## Oyun Claim Ediyor Ama Steam Hesabına Eklenmiyor

### Sorun
Bilgisayarı kapatıp açtığınızda Steam hesabına giriş yapmış görünüyor ve oyun claim ederken "başarılı" mesajı gösteriyor, ancak **oyunlar gerçekten Steam hesabınıza eklenmiyor**.

### Neden Oluyor?
- Steam oturumunuz geçersiz hale gelmiş olabilir
- Cookie'ler dosyada mevcut ama Steam tarafından artık kabul edilmiyor
- Browser yeniden başlatıldığında oturum düzgün restore edilmemiş
- Steam cookie'leri süre aşımına uğramış

### Çözüm
Bu sorun **2026-01-16** tarihinde düzeltildi. Artık her claim işlemi öncesinde Steam oturumu doğrulanıyor.

**Eğer hala sorun yaşıyorsanız:**

1. **Steam'den çıkış yapıp tekrar giriş yapın:**
   - Uygulamada "Logout" / "Çıkış Yap" butonuna basın
   - Tekrar "Login" / "Giriş Yap" yapın
   - Oturum yenilendiğinde oyun claim işlemi düzgün çalışacak

2. **Cookie dosyalarını manuel temizleyin:**
   ```bash
   # Backend klasöründeki cookie dosyalarını silin
   del backend\cookies.json
   del backend\user-data.json
   ```
   - Uygulamayı yeniden başlatın
   - Tekrar giriş yapın

3. **Claim işlemi sırasında hata mesajı kontrol edin:**
   - Eğer "Steam oturumu geçersiz" mesajı görüyorsanız, çıkış yapıp tekrar giriş yapmanız gerekiyor
   - Bu mesaj artık işlem başlamadan önce sizi uyaracak

4. **Steam hesabınızı manuel kontrol edin:**
   - Steam istemcisini veya web tarayıcısını açın
   - Kütüphane → Oyunlar bölümünden claim ettiğiniz oyunları kontrol edin
   - Bazı durumlarda oyun eklenmiş olabilir ama listelenmesi zaman alabilir

### Önleme
- Düzenli olarak giriş yapın (özellikle bilgisayar yeniden başlatıldığında)
- "Otomatik giriş" özelliğini kullanın
- Uzun süre bekledikten sonra claim yapmadan önce logout/login yapın

---

## Bilgisayar Açıldığında Electron Ekranı Açılıyor

### Sorun
Bilgisayar açıldığında uygulama şu ekranı gösteriyor:
- Electron logosu
- "To run a local app, execute the following on the command line:" mesajı
- Boş/beyaz ekran

### Neden Oluyor?
Uygulama **development modunda** çalışıyor ve `http://localhost:5173` adresine bağlanmaya çalışıyor. Ancak frontend development server çalışmadığı için Electron'un varsayılan ekranı açılıyor.

### Çözüm

#### ✅ Kalıcı Çözüm (Önerilen)
1. Installer kullanarak uygulamayı kurun:
   ```bash
   npm run build:installer
   ```

2. Oluşan installer'ı çalıştırın:
   ```
   dist\Steam Free Games-1.0.0-Setup.exe
   ```

3. Kurulum sonrası uygulama otomatik olarak production modunda çalışacak

4. Ayarlardan "Bilgisayar açılışında başlat" seçeneğini aktif edin

#### 🔄 Geçici Çözüm
Eğer installer kullanmadan test etmek istiyorsanız:

1. Frontend'i build edin:
   ```bash
   npm run build
   ```

2. Production modunda çalıştırın:
   ```bash
   npm run start:prod
   ```

### Önleme
- **Development mode** sadece geliştirme sırasında kullanılmalı (`npm run dev`)
- **Production mode** normal kullanım için (`npm run start:prod` veya installer)
- Windows başlangıcında çalışması için mutlaka installer kullanın

---

## Auto-Claim Sahip Olunan Oyunları Toplamaya Çalışıyor

### Sorun
Otomatik toplama özelliği zaten kütüphanede olan oyunları toplamaya çalışıyor.

### Çözüm
`electron/main.js` dosyasındaki `runAutoClaimRoutine` fonksiyonunda `isOwned` flag'i kontrol ediliyor (satır 689):

```javascript
const availableGames = freeGames.filter(game => {
    // First check isOwned flag from API
    if (game.isOwned) return false;
    
    // Then check local library
    const appId = (game.url.match(/\/app\/(\d+)/) || [])[1];
    const titleNorm = game.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (appId && ownedIds.includes(parseInt(appId))) return false;
    if (ownedNames.some(owned => owned === titleNorm)) return false;
    return true;
});
```

Bu filtreleme zaten uygulanmış durumda. Eğer hala sorun yaşıyorsanız:
1. Steam'den çıkış yapıp tekrar giriş yapın
2. Oyun listesini yenileyin (F5)
3. Kütüphane verilerinin güncel olduğundan emin olun

---

## Giriş Sonrası Oyunlar Yüklenmiyor (Sonsuz Loading)

### Sorun
Steam'e giriş yaptıktan sonra "Ücretsiz oyunlar yükleniyor..." mesajı görünüyor ve uygulama bu durumda takılı kalıyor.

### Neden?
- Backend'de `getOwnedGameTitles()` fonksiyonu Steam'in licenses sayfasına giderken timeout oluyor
- Ağ bağlantısı yavaş veya Steam sunucuları yavaş yanıt veriyor
- Puppeteer browser'ı çökebilir

### Çözüm
Bu sorun **2026-01-02** tarihinde düzeltildi:
- Timeout süresi 30 saniyeden 60 saniyeye çıkarıldı
- Licenses sayfası yüklenmezse sadece Userdata API sonuçları kullanılıyor
- Hata yönetimi iyileştirildi

**Eğer hala sorun yaşıyorsanız:**

1. **Uygulamayı yeniden başlatın:**
   - Uygulamadan çıkış yapın (Tray icon → Çıkış)
   - Uygulamayı tekrar açın

2. **İnternet bağlantınızı kontrol edin:**
   - Steam'e tarayıcıdan erişebildiğinizden emin olun
   - VPN kullanıyorsanız kapatmayı deneyin

3. **Logları kontrol edin:**
   ```bash
   npm run dev
   ```
   Console'da şu mesajları arayın:
   - `✅ Userdata API: X AppIDs found`
   - `✅ Licenses page: X Titles found`
   - `⚠️ Licenses page failed or timed out`

4. **Manuel olarak yenileyin:**
   - "Yenile" butonuna basın
   - Eğer hala yüklenmiyorsa, çıkış yapıp tekrar giriş yapın

---

## Bildirimler Çalışmıyor

### Sorun
Otomatik toplama bildirimleri görünmüyor.

### Çözüm
1. Ayarlar menüsünden "Bildirimler" seçeneğinin aktif olduğundan emin olun
2. Windows bildirim ayarlarını kontrol edin:
   - Ayarlar → Sistem → Bildirimler
   - "Steam Free Games" için bildirimlerin açık olduğundan emin olun

---

## Uygulama Sistem Tray'de Görünmüyor

### Sorun
Uygulama kapatıldığında sistem tray'de (saat yanında) ikon görünmüyor.

### Neden?
- `electron/tray-icon.ico` dosyası eksik veya bozuk
- Windows sistem tray'i gizli ikonları otomatik gizliyor

### Çözüm
1. `electron/tray-icon.ico` dosyasının var olduğundan emin olun
2. Windows sistem tray ayarlarını kontrol edin:
   - Görev çubuğuna sağ tıklayın
   - "Görev çubuğu ayarları"
   - "Sistem tepsisinde hangi simgelerin görüneceğini seçin"
   - "Steam Free Games" için "Açık" seçin

---

## Build Hataları

### "Cannot find module" Hatası
```bash
# node_modules'u temizle ve yeniden yükle
rm -rf node_modules
npm install

# Backend ve frontend için de
cd backend && rm -rf node_modules && npm install && cd ..
cd frontend && rm -rf node_modules && npm install && cd ..
```

### "Frontend dist not found" Hatası
```bash
# Frontend'i önce build et
cd frontend
npm run build
cd ..
```

### "winCodeSign" Hatası
Bu hata genellikle Windows Defender veya antivirus yazılımlarından kaynaklanır:
1. Build klasörünü antivirus'ten hariç tutun
2. Build'i yönetici olarak çalıştırın
3. Geçici olarak antivirus'ü kapatın (dikkatli olun!)

---

## Steam Login Sorunları

### Otomatik Login Oluyor (Logout Çalışmıyor)
`electron/main.js` dosyasında logout işlemi hem main session hem de login_partition session'ı temizliyor (satır 243-272). Eğer hala sorun yaşıyorsanız:

1. Uygulamadan çıkış yapın
2. `backend/cookies.json` dosyasını manuel olarak silin
3. Uygulamayı yeniden başlatın

### Login Penceresi Açılmıyor
1. Firewall ayarlarını kontrol edin
2. Steam'in erişilebilir olduğundan emin olun
3. İnternet bağlantınızı kontrol edin

### Bilgisayar Yeniden Başlattıktan Sonra Oturum Kapanıyor
**Sorun:** Steam hesabına giriş yaptıktan sonra bilgisayarı yeniden başlattığınızda oturum kapanıyor ve tekrar giriş yapmanız gerekiyor.

**Neden?**
- Steam cookie'leri expire olmuş olabilir (süresi dolmuş)
- Cookie dosyası bozulmuş olabilir
- Steam güvenlik ayarları cookie'leri geçersiz kılmış olabilir

**Çözüm:**
Bu sorun **2026-01-07** tarihinde düzeltildi:
- `checkLoginSimple()` fonksiyonu artık cookie'lerin sadece varlığını değil, aynı zamanda geçerliliğini de kontrol ediyor
- Expire olmuş cookie'ler otomatik olarak siliniyor
- "Invalid Date" hataları düzeltildi

**Eğer hala sorun yaşıyorsanız:**
1. **Cookie dosyalarını manuel olarak temizleyin:**
   - `backend/cookies.json` dosyasını silin
   - `backend/user-data.json` dosyasını silin
   - Uygulamayı yeniden başlatın ve tekrar giriş yapın

2. **Steam Guard ayarlarını kontrol edin:**
   - Steam mobil auth kullanıyorsanız, her defasında onay vermeniz gerekebilir
   - "Bu cihazı hatırla" seçeneğini işaretlediğinizden emin olun

3. **Antivirus/Firewall kontrolü:**
   - Bazı güvenlik yazılımları cookie dosyalarını otomatik olarak temizleyebilir
   - `backend/` klasörünü taramadan hariç tutun

---

## Performans Sorunları

### Uygulama Yavaş Başlıyor
Normal davranış:
- İlk başlatma 5-10 saniye sürebilir
- Puppeteer browser başlatılıyor
- Steam login kontrolü yapılıyor

Hızlandırma:
- SSD kullanın
- Antivirus'ten hariç tutun
- "Küçültülmüş başlat" seçeneğini aktif edin

### Yüksek RAM Kullanımı
Electron uygulamaları Chromium tabanlıdır ve 200-400 MB RAM kullanabilir. Bu normaldir.

---

## Genel Tavsiyeler

### Logları Kontrol Etme
1. Uygulamayı development modunda çalıştırın:
   ```bash
   npm run dev
   ```

2. DevTools'u açın (Ctrl+Shift+I)

3. Console sekmesinde hata mesajlarını kontrol edin

### Temiz Kurulum
Tüm sorunları çözmek için:
```bash
# Tüm build dosyalarını sil
rm -rf dist
rm -rf frontend/dist
rm -rf node_modules
rm -rf backend/node_modules
rm -rf frontend/node_modules

# Yeniden yükle
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Build et
npm run build:installer
```

### Destek
Sorun devam ediyorsa:
1. Hata mesajını tam olarak not alın
2. Console loglarını kaydedin
3. Hangi adımda hata oluştuğunu belirleyin
4. GitHub Issues'da rapor edin (eğer varsa)
