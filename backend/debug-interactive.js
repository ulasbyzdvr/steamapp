const { SteamBot } = require('./steamBot');
const fs = require('fs');

(async () => {
    console.log("\n🚀 STEAM LOGIN DEBUGGER BAŞLATILIYOR...");
    console.log("ℹ️  Bu araç tarayıcıyı açacak ve giriş yapmanızı bekleyecek.");
    console.log("ℹ️  Giriş yaptığınızda cookie süresini analiz edip ekrana basacak.");

    const bot = new SteamBot();

    // Tarayıcıyı görünür modda başlat
    await bot.init(false);

    console.log("🌐 Steam hesap sayfasına yönlendiriliyor...");
    try {
        await bot.page.goto('https://store.steampowered.com/account/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    } catch (e) {
        console.log("⚠️ Sayfa yükleme zaman aşımı, devam ediliyor...");
    }

    console.log("\n⬇️  GİRİŞ BEKLENİYOR (Lütfen tarayıcıdan giriş yapın) ⬇️");

    let loggedIn = false;
    // 5 dakika bekle
    const maxRetries = 60;

    for (let i = 0; i < maxRetries; i++) {
        try {
            if (bot.page.isClosed()) {
                console.log("❌ Tarayıcı kapatıldı.");
                break;
            }

            const cookies = await bot.page.cookies();
            const loginCookie = cookies.find(c => c.name === 'steamLoginSecure');

            if (loginCookie) {
                loggedIn = true;
                console.clear();
                console.log("\n✅ GİRİŞ BAŞARILI! COOKIE ANALİZİ YAPILIYOR...\n");

                const expiresTimestamp = loginCookie.expires;
                const now = new Date();

                // Session cookie kontrolü
                if (expiresTimestamp === -1 || expiresTimestamp === 0) {
                    console.log(`⚠️  DİKKAT: Bu bir SESSION Cookie! (Expires: ${expiresTimestamp})`);
                    console.log("   Bu cookie tarayıcı kapandığında silinir.");
                    console.log("   'Beni Hatırla' (Remember Me) seçeneğini işaretlediniz mi?");
                } else {
                    const expiresDate = new Date(expiresTimestamp * 1000);
                    const diffDays = (expiresDate - now) / (1000 * 60 * 60 * 24);

                    console.log(`📛 Cookie Adı: steamLoginSecure`);
                    console.log(`📅 Bitiş Tarihi: ${expiresDate.toLocaleString()}`);
                    console.log(`⏳ Kalan Süre: ${Math.round(diffDays)} gün`);
                    console.log(`🔍 Timestamp: ${expiresTimestamp}`);

                    if (diffDays < 2) {
                        console.log("\n⚠️  UYARI: Cookie süresi çok kısa (yaklaşık 1 gün).");
                        console.log("   Bu normalde 'Remember Me' seçilmediğinde olur.");
                    } else if (diffDays > 365) {
                        console.log("\n✅ BAŞARILI: Cookie süresi uzun (2027+).");
                    }
                }

                // Kaydetmeyi dene
                await bot.saveCookies();
                console.log("\n💾 Cookie'ler 'cookies.json' dosyasına kaydedildi.");

                await bot.page.evaluate((msg) => {
                    alert(msg);
                }, "Giriş Başarılı!\nKonsoldaki analizi kontrol edebilirsiniz.");

                break;
            }

            process.stdout.write(".");
            await new Promise(r => setTimeout(r, 5000));

        } catch (e) {
            console.error("Hata:", e.message);
            break;
        }
    }

    if (!loggedIn) {
        console.log("\n❌ Giriş yapılmadı veya süre doldu.");
    } else {
        console.log("\n✨ İşlem tamamlandı. 10 saniye sonra kapanacak...");
        await new Promise(r => setTimeout(r, 10000));
    }

    process.exit(0);
})();
