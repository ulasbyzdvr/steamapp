# System Patterns

## Mimari
Uygulama Node.js tabanlı bir otomasyon aracı olarak çalışacaktır.

### Bileşenler
1. **Frontend (React)**:
   - Kullanıcı Arayüzü (Game List, Login Button, Status).
   - Backend ile HTTP/REST üzerinden haberleşir.
2. **Backend (Express)**:
   - API Endpoints (`/api/games`, `/api/claim`, `/api/login`).
   - Puppeteer kontrolü.
3. **Bot Engine (Puppeteer)**:
   - Tarayıcıyı yönetir, Steam işlemlerini yapar.
4. **Data Source (ITAD API)**:
   - Oyun listesini çeker.

## Tasarım Kararları
- **Puppeteer**: Steam'in login süreçleri ve bot korumaları (captcha vs.) ile başa çıkmak gerekirse "headful" modda çalıştırıp kullanıcının müdahale etmesine izin vermek için.
- **Node.js**: Hızlı geliştirme ve geniş kütüphane desteği.
