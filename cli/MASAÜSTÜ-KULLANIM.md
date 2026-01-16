# 🖥️ Masaüstünden Nasıl Çalıştırılır?

## 🚀 Yöntem 1: Otomatik Kısayol Oluşturma (ÖNERİLEN)

### Adım 1: PowerShell Scriptini Çalıştır

1. `cli` klasörüne gidin
2. **`Masaüstüne-Kısayol-Oluştur.ps1`** dosyasına **SAĞ TIKLAYIN**
3. **"PowerShell ile Çalıştır"** seçeneğini seçin

   > ⚠️ **Not**: Eğer "PowerShell ile Çalıştır" seçeneği yoksa:
   > - Dosyaya **SAĞ TIKLAYIP** → **Birlikte Aç** → **PowerShell** seçin

4. Script çalışacak ve masaüstünüze **"Steam CLI"** kısayolu oluşturacak

### Adım 2: Kısayolu Kullan

Artık **masaüstündeki "Steam CLI" kısayoluna çift tıklayarak** uygulamayı başlatabilirsiniz! 🎉

---

## 🔧 Yöntem 2: Manuel Kısayol Oluşturma

### Adım 1: Batch Dosyasını Bulun

1. `c:\Users\ulasb\steamapp\cli\Steam-CLI.bat` dosyasını bulun

### Adım 2: Kısayol Oluşturun

1. **Steam-CLI.bat** dosyasına **SAĞ TIKLAYIN**
2. **"Kısayol oluştur"** seçeneğini seçin
3. Oluşan kısayolu **masaüstüne sürükleyin**

### Adım 3: Kısayolu Özelleştirin (İsteğe Bağlı)

1. Kısayola **SAĞ TIKLAYIP** → **Özellikler**
2. **"Başlangıç konumu"** kısmını şu şekilde ayarlayın:
   ```
   c:\Users\ulasb\steamapp\cli
   ```
3. İsterseniz kısayolun adını değiştirin: **"Steam CLI"**

---

## 📂 Yöntem 3: Doğrudan Dosyadan Çalıştırma

### Basit Yol:

1. Windows Gezgini'nde şu klasöre gidin:
   ```
   c:\Users\ulasb\steamapp\cli
   ```

2. **`Steam-CLI.bat`** dosyasına **ÇİFT TIKLAYIN**

3. Terminal penceresi açılacak ve uygulama başlayacak! ✅

---

## ⌨️ Yöntem 4: Başlat Menüsüne Ekleme

### Windows 10/11 için:

1. `Steam-CLI.bat` dosyasına **SAĞ TIKLAYIP** → **Kısayol oluştur**
2. Oluşan kısayolu **KOPYALAYIN** (Ctrl+C)
3. **Windows + R** tuşlarına basın
4. Şunu yazın ve Enter'a basın:
   ```
   shell:programs
   ```
5. Açılan klasöre kısayolu **YAPIŞTIRIN** (Ctrl+V)

Artık **Başlat Menüsü**'nde "Steam CLI" yazarak uygulamayı bulabilirsiniz! 🔍

---

## 🎯 Önerilen Yöntem

**En kolay ve hızlı yol:**

1. ✅ `Masaüstüne-Kısayol-Oluştur.ps1` dosyasına sağ tıklayın
2. ✅ "PowerShell ile Çalıştır" seçin
3. ✅ Masaüstündeki kısayola çift tıklayın
4. ✅ **HAZIR!** 🎊

---

## ❓ Sorun mu Yaşıyorsunuz?

### "PowerShell ile Çalıştır" seçeneği yok

**Çözüm:**
```powershell
# PowerShell'i yönetici olarak açın ve şunu çalıştırın:
cd c:\Users\ulasb\steamapp\cli
.\Masaüstüne-Kısayol-Oluştur.ps1
```

### "Node.js bulunamadı" hatası

**Çözüm:**
- Node.js'i yükleyin: https://nodejs.org
- Bilgisayarı yeniden başlatın
- Tekrar deneyin

### Kısayol çalışmıyor

**Çözüm:**
1. Kısayola sağ tıklayın → Özellikler
2. "Başlangıç konumu" kısmını kontrol edin:
   ```
   c:\Users\ulasb\steamapp\cli
   ```
3. "Hedef" kısmı şöyle olmalı:
   ```
   c:\Users\ulasb\steamapp\cli\Steam-CLI.bat
   ```

---

## 💡 Bonus İpuçları

### Görev Çubuğuna Sabitle

1. Masaüstündeki kısayola **SAĞ TIKLAYIP**
2. **"Görev çubuğuna sabitle"** seçin
3. Artık görev çubuğundan tek tıkla açabilirsiniz! 📌

### Klavye Kısayolu Atama

1. Kısayola **SAĞ TIKLAYIP** → **Özellikler**
2. **"Kısayol tuşu"** alanına tıklayın
3. İstediğiniz tuş kombinasyonunu basın (örn: **Ctrl+Alt+S**)
4. **Tamam**'a tıklayın

Artık **Ctrl+Alt+S** ile her yerden uygulamayı açabilirsiniz! ⌨️

---

## 📝 Özet

**En hızlı yol:**
```
cli klasörü → Masaüstüne-Kısayol-Oluştur.ps1 → Sağ tık → PowerShell ile Çalıştır
```

**Sonuç:**
```
Masaüstü → Steam CLI kısayolu → Çift tık → BAŞLAT! 🚀
```

Keyifli kullanımlar! 🎮✨
