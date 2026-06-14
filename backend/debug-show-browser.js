const { SteamBot } = require('./steamBot');

(async () => {
    console.log("🔵 Tarayıcı başlatılıyor (Pencere Görünür)...");
    const bot = new SteamBot();

    // Headless: false (Tarayıcıyı göster)
    await bot.init(false);

    console.log("🔵 Steam hesap sayfasına gidiliyor...");
    try {
        await bot.page.goto('https://store.steampowered.com/account/', { waitUntil: 'domcontentloaded', timeout: 30000 });

        const cookies = await bot.page.cookies();
        const loginCookie = cookies.find(c => c.name === 'steamLoginSecure');

        console.log("\n--- COOKIE ANALİZİ ---");
        if (loginCookie) {
            console.log("✅ 'steamLoginSecure' cookie bulundu.");

            const expiresTimestamp = loginCookie.expires;
            const expiresDate = new Date(expiresTimestamp * 1000);
            const now = new Date();

            console.log(`📅 Bitiş Tarihi (Timestamp): ${expiresTimestamp}`);
            console.log(`📅 Bitiş Tarihi (Okunabilir): ${expiresDate.toLocaleString()}`);
            console.log(`⏰ Şu An: ${now.toLocaleString()}`);

            const diffDays = (expiresDate - now) / (1000 * 60 * 60 * 24);
            console.log(`⏳ Kalan Süre: yaklaşık ${Math.round(diffDays)} gün`);

            if (expiresTimestamp === -1 || expiresTimestamp === 0) {
                console.log("ℹ️ Bu bir 'Session Cookie' (Oturum Çerezi). Tarayıcı kapanınca silinebilir ancak 'Remember Me' ile dosya olarak saklıyoruz.");
            }

            // Tarayıcı içinde kullanıcıya göster
            await bot.page.evaluate((dateStr, days) => {
                alert(`Steam Cookie Analizi:\n\nBitiş Tarihi: ${dateStr}\nKalan Gün: ${days}\n\nTarayıcı açık kalacak, inceleyebilirsiniz.`);
            }, expiresDate.toLocaleString(), Math.round(diffDays));

        } else {
            console.log("❌ 'steamLoginSecure' cookie BULUNAMADI.");
            console.log("Lütfen açılan pencereden giriş yapmayı deneyin.");
        }
        console.log("------------------------\n");

    } catch (e) {
        console.error("❌ Hata oluştu:", e.message);
    }

    console.log("🔵 Tarayıcı incelemeniz için 2 dakika açık kalacak...");
    await new Promise(r => setTimeout(r, 120000)); // 2 dakika bekle

    console.log("🔵 Kapatılıyor...");
    process.exit(0);
})();
