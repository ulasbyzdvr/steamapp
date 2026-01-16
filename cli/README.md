# Steam Ücretsiz Oyun Yöneticisi - CLI

Terminal üzerinden çalışan Steam ücretsiz oyun yönetim uygulaması.

## Özellikler

✅ **Steam Girişi**: Tarayıcı üzerinden güvenli Steam girişi  
✅ **Ücretsiz Oyunlar**: Güncel ücretsiz oyunları listele  
✅ **Kütüphane Görüntüleme**: Steam kütüphanenizi görüntüleyin  
✅ **Otomatik Talep**: Oyunları otomatik olarak kütüphaneye ekleyin  
✅ **Renkli Arayüz**: Terminal için optimize edilmiş renkli çıktılar  
✅ **İnteraktif Menü**: Kullanımı kolay menü sistemi  

## Kurulum

### 🖥️ Masaüstünden Çalıştırma (ÖNERİLEN)

**En Kolay Yol:**

1. `Masaüstüne-Kısayol-Oluştur.ps1` dosyasına **SAĞ TIKLAYIN**
2. **"PowerShell ile Çalıştır"** seçeneğini seçin
3. Masaüstünüze **"Steam CLI"** kısayolu oluşturulacak
4. Artık masaüstündeki kısayola **ÇİFT TIKLAYARAK** başlatabilirsiniz! 🎉

> 📖 Detaylı bilgi için: `MASAÜSTÜ-KULLANIM.md` dosyasına bakın

### 💻 Terminal'den Çalıştırma

```bash
# CLI klasörüne gidin
cd cli

# Yöntem 1: Node ile
node cli.js

# Yöntem 2: Batch dosyası ile (Windows)
Steam-CLI.bat
```

## Kullanım

### Hızlı Başlangıç

1. Uygulamayı başlatın: `node cli.js`
2. Menüden "1" seçerek Steam'e giriş yapın
3. Tarayıcıda açılan pencereden Steam hesabınıza giriş yapın
4. Menüye döndükten sonra ücretsiz oyunları listeleyebilir ve talep edebilirsiniz

### Menü Seçenekleri

- **1. Steam'e Giriş Yap**: Tarayıcı açılır ve Steam girişi yapılır
- **2. Giriş Durumunu Kontrol Et**: Mevcut giriş durumunu kontrol eder
- **3. Ücretsiz Oyunları Listele**: Güncel ücretsiz oyunları gösterir
- **4. Kütüphanemi Görüntüle**: Steam kütüphanenizdeki oyunları listeler
- **5. Oyun Talep Et**: Seçtiğiniz oyunları kütüphaneye ekler
- **6. Tüm Ücretsiz Oyunları Talep Et**: Sahip olmadığınız tüm ücretsiz oyunları ekler
- **7. Kullanıcı Bilgilerimi Göster**: Steam kullanıcı adınızı gösterir
- **8. Çıkış Yap**: Steam hesabından çıkış yapar
- **0. Programdan Çık**: Uygulamayı kapatır

## Özellikler Detayı

### Otomatik Giriş
Bir kez giriş yaptıktan sonra, cookie'ler kaydedilir ve bir sonraki açılışta otomatik giriş yapılır.

### Akıllı Filtreleme
Ücretsiz oyunları listelerken, zaten kütüphanenizde olan oyunlar `[SAHİP]` etiketi ile işaretlenir.

### Toplu İşlem
"Tüm Ücretsiz Oyunları Talep Et" seçeneği ile sahip olmadığınız tüm oyunları tek seferde kütüphaneye ekleyebilirsiniz.

### Güvenli Çıkış
Çıkış yaparken tüm cookie'ler silinir ve tarayıcı kapatılır.

## Teknik Detaylar

- **Backend**: Mevcut `backend/` klasöründeki modülleri kullanır
- **Steam Bot**: Puppeteer ile Steam web sitesinde otomatik işlemler yapar
- **ITAD Servisi**: IsThereAnyDeal API'sini kullanarak ücretsiz oyunları bulur
- **Renkli Çıktı**: ANSI renk kodları ile terminal çıktıları

## Sorun Giderme

### "Module not found" hatası
```bash
# Ana klasörde node_modules yüklü olduğundan emin olun
cd ..
npm install
cd cli
```

### Tarayıcı açılmıyor
- Puppeteer'ın doğru yüklendiğinden emin olun
- Firewall/Antivirus ayarlarını kontrol edin

### Giriş yapılamıyor
- Steam Guard kodunu doğru girdiğinizden emin olun
- İnternet bağlantınızı kontrol edin
- Cookie dosyasını silin: `backend/cookies.json`

## Lisans

MIT
