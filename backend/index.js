const puppeteer = require('puppeteer');
const fs = require('fs');
require('dotenv').config();

const COOKIES_PATH = './cookies.json';

(async () => {
    // Tarayıcıyı başlat (headless: false ile görebiliriz)
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized'] // Tam ekran başlat
    });

    const page = await browser.newPage();

    // Cookie kontrolü
    if (fs.existsSync(COOKIES_PATH)) {
        const cookiesString = fs.readFileSync(COOKIES_PATH);
        const cookies = JSON.parse(cookiesString);
        await page.setCookie(...cookies);
        console.log('Cookies yüklendi.');
    }

    try {
        console.log('Steam ana sayfasına gidiliyor...');
        await page.goto('https://store.steampowered.com/', { waitUntil: 'networkidle2' });

        // Giriş yapılmış mı kontrol et
        const isLoggedIn = await page.$('.global_action_link') === null; // "Giriş yap" butonu yoksa giriş yapılmıştır (kabaca)
        // Daha kesin kontrol: account pulldown var mı?
        const accountPullDown = await page.$('#account_pulldown');

        if (accountPullDown) {
            console.log('Zaten giriş yapılmış.');
        } else {
            console.log('Giriş yapılmamış. Lütfen giriş yapın.');
            await page.goto('https://store.steampowered.com/login/', { waitUntil: 'networkidle2' });

            // Kullanıcının giriş yapmasını bekle
            console.log('Kullanıcı girişi bekleniyor... (Maksimum 5 dakika)');
            await page.waitForSelector('#account_pulldown', { timeout: 300000 }); // 5 dakika bekle
            console.log('Giriş tespit edildi!');

            // Cookie'leri kaydet
            const cookies = await page.cookies();
            fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));
            console.log('Cookies kaydedildi.');
        }

        // Ücretsiz oyunları ara (API ile)
        console.log('Ücretsiz oyunlar aranıyor (IsThereAnyDeal API)...');
        const { getFreeSteamGames } = require('./itadService');
        const games = await getFreeSteamGames();

        if (games.length === 0) {
            console.log('Şu anda ücretsiz oyun bulunamadı veya API yapılandırması eksik.');
        } else {
            console.log(`Bulunan oyun sayısı: ${games.length}`);

            for (const game of games) {
                console.log(`İşleniyor: ${game.title}`);
                const newPage = await browser.newPage();

                try {
                    // ITAD linki muhtemelen yönlendirme içerir, Puppeteer bunu halleder.
                    await newPage.goto(game.url, { waitUntil: 'networkidle2' });

                    // Steam Store sayfası açıldığında "Add to Account" işlemlerini yap
                    // Doğru URL'de olduğumuzdan emin olalım (Steam domaini)
                    if (newPage.url().includes('store.steampowered.com')) {

                        // Önce oyunun zaten kütüphanede olup olmadığını kontrol et
                        const isOwned = await newPage.evaluate(() => {
                            // "In Library" ibaresi genellikle ds_owned sınıfına sahip elementlerde olur
                            const ownedFlag = document.querySelector('.ds_owned_flag');
                            return ownedFlag && window.getComputedStyle(ownedFlag).display !== 'none';
                        });

                        const alreadyInLibraryBtn = await newPage.$('.btn_green_steamui span');
                        const btnText = alreadyInLibraryBtn ? await newPage.evaluate(el => el.innerText, alreadyInLibraryBtn) : '';

                        if (isOwned || btnText.includes('Play Game') || btnText.includes('Oyna')) {
                            console.log(`✅ ${game.title} zaten kütüphanenizde mevcut.`);
                        } else {
                            const addBtn = await newPage.$('a.btn_addnocart');
                            // Ayrıca "Install" butonu veya "%100" indirimli satın alma butonu da olabilir.
                            // Genelde "Add to Account" yeşil butonu

                            if (addBtn) {
                                console.log(`${game.title} için 'Hesaba Ekle' butonuna basılıyor...`);
                                await addBtn.click();
                                await new Promise(r => setTimeout(r, 3000)); // İşlem için bekle
                                console.log(`${game.title} kütüphaneye eklendi (varsayılarak).`);
                            } else {
                                // Belki de normal satın alma butonudur (Price 0.00)
                                const purchaseBtn = await newPage.$('.btn_addtocart a');
                                if (purchaseBtn) {
                                    console.log('Sepete ekle türünde bir buton bulundu, işlem manuel kontrol gerektirebilir.');
                                } else {
                                    console.log('Otomatik tıklanabilir buton bulunamadı.');
                                }
                            }
                        } // Close else block for !isOwned
                    } else {
                        console.log('Steam sayfasına yönlendirilmedi, atlanıyor.');
                    }

                } catch (err) {
                    console.error(`Hata (${game.title}):`, err.message);
                }

                await newPage.close();
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        console.log('İşlem tamamlandı.');

    } catch (error) {
        console.error('Bir hata oluştu:', error);
    } finally {
        // browser.close(); 
        console.log('Tarayıcı açık bırakıldı.');
    }
})();
