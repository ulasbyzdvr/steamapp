# CLI Hızlı Başlangıç Kılavuzu

## 🚀 İlk Kullanım (3 Adım)

### 1️⃣ CLI'yı Başlat
```bash
cd cli
node cli.js
```
veya Windows'ta:
```bash
start-cli.bat
```

### 2️⃣ Steam'e Giriş Yap
- Menüden **1** seçin
- Açılan tarayıcı penceresinden Steam hesabınıza giriş yapın
- Giriş tamamlandıktan sonra tarayıcı otomatik kapanır

### 3️⃣ Ücretsiz Oyunları Talep Et
- Menüden **6** seçin (Tüm Ücretsiz Oyunları Talep Et)
- Onay için **e** yazın
- İşlem otomatik olarak tamamlanır

---

## 📋 Menü Rehberi

### 1. Steam'e Giriş Yap
- Tarayıcı penceresi açılır
- Steam hesabınızla giriş yapın
- Steam Guard kodunu girin (gerekirse)
- Giriş başarılı olunca otomatik devam eder

### 2. Giriş Durumunu Kontrol Et
- Şu anda giriş yapılıp yapılmadığını kontrol eder
- Cookie'ler geçerliyse otomatik giriş yapar

### 3. Ücretsiz Oyunları Listele
- IsThereAnyDeal API'sinden güncel ücretsiz oyunları getirir
- Sahip olduğunuz oyunlar **[SAHİP]** etiketi ile gösterilir
- Yeni oyunlar **[YENİ]** etiketi ile gösterilir
- Bitiş tarihleri varsa gösterilir

### 4. Kütüphanemi Görüntüle
- Steam kütüphanenizdeki tüm oyunları listeler
- Toplam oyun sayısını gösterir
- Son eklenen 20 oyunu detaylı gösterir

### 5. Oyun Talep Et
- Önce ücretsiz oyunları listelemelisiniz (Menü 3)
- Talep etmek istediğiniz oyunların numaralarını girin
- Örnek: `1,3,5` (virgülle ayırın)
- Seçili oyunlar kütüphaneye eklenir

### 6. Tüm Ücretsiz Oyunları Talep Et
- Otomatik olarak ücretsiz oyunları getirir
- Kütüphanenizi kontrol eder
- Sahip olmadığınız oyunları filtreler
- Onay istenir (e/h)
- Tüm oyunlar sırayla talep edilir

### 7. Kullanıcı Bilgilerimi Göster
- Steam kullanıcı adınızı gösterir
- Avatar URL'inizi gösterir

### 8. Çıkış Yap
- Steam hesabından çıkış yapar
- Cookie'leri siler
- Tarayıcıyı kapatır

### 0. Programdan Çık
- CLI uygulamasını kapatır
- Tarayıcıyı kapatır

---

## 💡 İpuçları

### Otomatik Giriş
Bir kez giriş yaptıktan sonra cookie'ler kaydedilir. Bir sonraki açılışta otomatik giriş yapılır.

### Renkli Çıktılar
- 🟢 Yeşil: Başarılı işlemler
- 🔴 Kırmızı: Hatalar
- 🟡 Sarı: Uyarılar
- 🔵 Mavi: Bilgilendirme

### Hızlı İşlem
"Tüm Ücretsiz Oyunları Talep Et" seçeneği ile tek seferde tüm oyunları alabilirsiniz.

### Güvenli Çıkış
Çıkış yapmadan programı kapatırsanız, cookie'ler korunur ve bir sonraki açılışta otomatik giriş yapılır.

---

## ⚠️ Sorun Giderme

### "Module not found" hatası
```bash
cd ..
npm install
cd cli
```

### Tarayıcı açılmıyor
- Puppeteer'ın yüklü olduğundan emin olun
- Firewall ayarlarını kontrol edin

### Giriş yapılamıyor
- Steam Guard kodunu doğru girdiğinizden emin olun
- Cookie dosyasını silin: `rm ../backend/cookies.json`
- Tekrar giriş yapmayı deneyin

### Oyunlar yüklenmiyor
- İnternet bağlantınızı kontrol edin
- ITAD API'sinin çalıştığından emin olun
- Birkaç saniye bekleyip tekrar deneyin

---

## 🎯 Örnek Kullanım Senaryosu

```
1. CLI'yı başlat: node cli.js
2. Menüden 1 seçin (Steam'e Giriş)
3. Tarayıcıda giriş yapın
4. Menüden 6 seçin (Tüm Oyunları Talep Et)
5. 'e' yazıp onaylayın
6. İşlem tamamlanana kadar bekleyin
7. Menüden 0 seçin (Çıkış)
```

---

## 🔄 Otomasyon Örneği

CLI'yı script'lerle kullanabilirsiniz:

```powershell
# auto-claim.ps1
cd cli
echo "6`ne`n0" | node cli.js
```

Bu script:
1. CLI'yı başlatır
2. Menüden 6'yı seçer (Tüm oyunları talep et)
3. 'e' ile onaylar
4. İşlem bitince çıkar

---

## 📚 Daha Fazla Bilgi

Detaylı dokümantasyon için:
- `cli/README.md` - Tam kullanım kılavuzu
- `../memory-bank/` - Teknik dokümantasyon
- `../README.md` - Ana proje dokümantasyonu
