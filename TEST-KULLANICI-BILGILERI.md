# Kullanıcı Bilgileri Kalıcılık Testi

## Sorun
Önceden giriş yapmışken bilgisayarı kapatıp açtığımda kullanıcı "steam user" dönüyor ve bilgilerimi okumuyor.

## Çözüm
Kullanıcı bilgilerini kalıcı olarak saklamak için `user-data.json` dosyası eklendi.

### Yapılan Değişiklikler

1. **Yeni Dosya Sistemi**
   - `backend/user-data.json` - Kullanıcı bilgilerini saklar
   - Format: `{ "username": "...", "lastUpdated": "..." }`

2. **Yeni Fonksiyonlar** (`backend/steamBot.js`)
   - `loadUserData()` - Uygulama başlatıldığında kullanıcı bilgilerini yükler
   - `saveUserData()` - Kullanıcı adı alındığında dosyaya kaydeder

3. **Güncellemeler**
   - Constructor'da otomatik `loadUserData()` çağrısı
   - `getSteamUsername()` fonksiyonunda `saveUserData()` çağrısı
   - `logout()` fonksiyonunda `user-data.json` silme işlemi

## Test Adımları

### 1. İlk Giriş
```bash
cd cli
node cli.js
```
- "1" seçerek Steam'e giriş yapın
- Giriş yaptıktan sonra kullanıcı adınız görünecek
- `backend/user-data.json` dosyası oluşturulacak

### 2. Uygulamayı Kapatın
- "0" seçerek uygulamadan çıkın
- Terminal'i kapatın

### 3. Yeniden Başlatın
```bash
cd cli
node cli.js
```
- **BEKLENEN**: Kullanıcı adınız otomatik olarak yüklenecek
- **ÖNCE**: "Steam User" olarak görünüyordu
- **ŞIMDI**: Gerçek kullanıcı adınız görünecek

### 4. Logout Testi
- "6" seçerek Steam'den çıkış yapın
- `backend/user-data.json` dosyası silinecek
- Yeniden başlattığınızda "Steam User" görünecek (normal)

## Dosya Konumları

- **Cookies**: `backend/cookies.json` (oturum bilgileri)
- **User Data**: `backend/user-data.json` (kullanıcı adı)

## Notlar

- Her iki dosya da logout'ta silinir
- Kullanıcı adı ilk kez `getSteamUsername()` çağrıldığında kaydedilir
- Constructor'da otomatik yükleme yapılır
- Bilgisayar yeniden başlatıldığında bilgiler korunur
