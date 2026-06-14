const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const COOKIES_PATH = path.join(__dirname, 'cookies.json');
const USER_DATA_PATH = path.join(__dirname, 'user-data.json');

class SteamBot {
    constructor(silent = false) {
        this.browser = null;
        this.page = null;
        this.loginStatus = 'idle'; // idle, waiting_for_user, logged_in, failed
        this.isAborted = false;
        this.cachedUsername = null; // Cache for username to avoid repeated fetches
        this.cachedAvatarUrl = null; // Cache for avatar URL
        this.silent = silent; // Sessiz mod - console.log'ları gizle

        // Kullanıcı bilgilerini yükle
        this.loadUserData();
    }

    // Log fonksiyonu - silent mode'da çalışmaz
    log(message) {
        if (!this.silent) {
            console.log(message);
        }
    }

    // Kullanıcı bilgilerini yükle
    loadUserData() {
        try {
            if (fs.existsSync(USER_DATA_PATH)) {
                const data = JSON.parse(fs.readFileSync(USER_DATA_PATH, 'utf-8'));
                this.cachedUsername = data.username || null;
                this.log('[loadUserData] User data loaded: ' + this.cachedUsername);
            }
        } catch (e) {
            this.log('[loadUserData] Error loading user data: ' + e.message);
        }
    }

    // Kullanıcı bilgilerini kaydet
    saveUserData() {
        try {
            const data = {
                username: this.cachedUsername,
                lastUpdated: new Date().toISOString()
            };
            fs.writeFileSync(USER_DATA_PATH, JSON.stringify(data, null, 2));
            this.log('[saveUserData] User data saved: ' + this.cachedUsername);
        } catch (e) {
            console.error('[saveUserData] Error saving user data: ' + e.message);
        }
    }

    getLoginStatus() {
        return this.loginStatus;
    }

    checkLoginSimple() {
        // Fast check: just verify cookies file exists
        if (!fs.existsSync(COOKIES_PATH)) {
            return false;
        }
        try {
            const cookiesJson = fs.readFileSync(COOKIES_PATH, 'utf-8');
            const cookies = JSON.parse(cookiesJson);

            const steamLoginCookie = cookies.find(c =>
                c.name === 'steamLoginSecure' || c.name === 'steamlogin'
            );

            if (steamLoginCookie) {
                // Check if cookie is expired
                if (steamLoginCookie.expires && steamLoginCookie.expires > 0) {
                    const expiryTime = steamLoginCookie.expires * 1000;
                    const now = Date.now();

                    if (expiryTime < now) {
                        console.log('❌ Steam oturumu süresi dolmuş. Lütfen tekrar giriş yapın.');
                        // Delete expired cookies
                        try {
                            fs.unlinkSync(COOKIES_PATH);
                            if (fs.existsSync(USER_DATA_PATH)) {
                                fs.unlinkSync(USER_DATA_PATH);
                            }
                        } catch (e) {
                            console.error('Cookie temizleme hatası:', e.message);
                        }
                        return false;
                    }
                }
                return true;
            } else {
                console.log('⚠️ Steam giriş bilgisi bulunamadı. Lütfen giriş yapın.');
                return false;
            }
        } catch (e) {
            console.error('Cookie okuma hatası:', e.message);
            return false;
        }
    }

    async init(headless = true) {
        // Eğer tarayıcı zaten açıksa ve istenen mod farklıysa, kapatıp yeniden aç
        if (this.browser) {
            const isHeadless = await this.browser.version().then(v => !v.includes('Headful')); // Basit kontrol, tam doğru olmayabilir ama
            // Daha güvenli: Puppeteer launch options saklanmadığı için, basitçe restart edelim eğer zorunlu mod değişimi varsa.
            // Şimdilik sadece browser kapalıysa açıyoruz.
        }

        if (!this.browser) {
            this.log(`Tarayıcı başlatılıyor...`);
            this.browser = await puppeteer.launch({
                headless: headless ? "new" : false,
                defaultViewport: null,
                args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox']
            });
            this.page = await this.browser.newPage();

            if (fs.existsSync(COOKIES_PATH)) {
                try {
                    const cookiesJson = fs.readFileSync(COOKIES_PATH, 'utf-8');
                    const cookies = JSON.parse(cookiesJson);

                    // Cookies are already in Puppeteer format (normalized when saved)
                    await this.page.setCookie(...cookies);

                    // Only warn if no login cookie found
                    const steamLoginCookie = cookies.find(c => c.name === 'steamLoginSecure' || c.name === 'steamlogin');
                    if (!steamLoginCookie) {
                        console.log('⚠️ Steam giriş bilgisi bulunamadı. Lütfen giriş yapın.');
                    }
                } catch (e) {
                    console.error('Cookie yükleme hatası:', e.message);
                }
            }
        }
    }

    async restartBrowser(headless = true) {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
        }
        await this.init(headless);
    }

    async checkLogin() {
        try {
            if (!this.browser || !this.page) {
                await this.init();
            } else {
                try {
                    await this.browser.version();
                } catch (e) {
                    await this.init();
                }
            }

            await this.page.goto('https://store.steampowered.com/account/', {
                waitUntil: 'domcontentloaded',
                timeout: 20000
            });
            const url = this.page.url();
            const isLoggedIn = !url.includes('login');

            // Auto-refresh cookies after every login check
            if (isLoggedIn) {
                await this.saveCookies();
                this.log('[checkLogin] ✅ Login verified, cookies refreshed');
            }

            return isLoggedIn;
        } catch (e) {
            console.error('CheckLogin error:', e.message);
            return false;
        }
    }

    async login() {
        this.loginStatus = 'waiting_for_user';
        this.log('Starting login flow...');

        // Giriş için arayüz şart (Headless: false)
        await this.restartBrowser(false);

        try {
            await this.page.goto('https://store.steampowered.com/login/', { waitUntil: 'networkidle2' });
            this.log('Login page opened. Waiting for user to login...');

            // Kullanıcının giriş yapmasını bekle (account_pulldown elementi görünene kadar)
            // 5 dakika süre tanıyalım
            await this.page.waitForSelector('#account_pulldown', { timeout: 300000 });
            this.log('User logged in successfully!');
            this.loginStatus = 'logged_in';

            // Cookie'leri kaydet
            await this.saveCookies();

            // Tarayıcıyı kapatıp hemen arka plan moduna (headless) geri dön
            // Tarayıcıyı kapatıp hemen arka plan moduna (headless) geri dön
            this.log('Switching back to background mode...');
            await this.restartBrowser(true);

        } catch (error) {
            console.error('Login timed out or failed:', error);
            this.loginStatus = 'failed';
            // Hata durumunda da arka plana dönmeye çalış
            await this.restartBrowser(true);
            throw error;
        }
    }

    async saveCookies() {
        if (this.page) {
            // CRITICAL FIX: Get cookies from ALL Steam domains
            // Steam uses multiple domains: store.steampowered.com, steamcommunity.com, help.steampowered.com
            const allCookies = await this.page.cookies(
                'https://store.steampowered.com',
                'https://steamcommunity.com',
                'https://help.steampowered.com',
                'https://login.steampowered.com'
            );

            // Normalize cookie format - ensure all cookies have proper expiry dates
            const normalizedCookies = allCookies.map(cookie => {
                // Puppeteer uses 'expires' (Unix timestamp in seconds)
                // Keep it consistent - always use 'expires' field
                const normalized = {
                    name: cookie.name,
                    value: cookie.value,
                    domain: cookie.domain,
                    path: cookie.path || '/',
                    expires: cookie.expires || -1, // -1 means session cookie
                    httpOnly: cookie.httpOnly || false,
                    secure: cookie.secure || false,
                    sameSite: cookie.sameSite || 'Lax'
                };

                return normalized;
            });

            fs.writeFileSync(COOKIES_PATH, JSON.stringify(normalizedCookies, null, 2));

            // Only warn if no login cookie found
            const steamLoginCookie = normalizedCookies.find(c => c.name === 'steamLoginSecure' || c.name === 'steamlogin');
            if (!steamLoginCookie) {
                console.log('⚠️ UYARI: Steam giriş cookie\'si bulunamadı!');
                console.log('⚠️ Oturum kalıcı olmayabilir. Lütfen giriş işlemini tamamlayın.');
            }
        }
    }

    async logout() {
        console.log('Logging out from Steam...');
        this.loginStatus = 'idle';
        this.isAborted = true; // Stop any running processes
        this.cachedUsername = null; // Clear cached username
        this.cachedAvatarUrl = null;

        // 1. Force Close Browser FIRST (to release file locks)
        if (this.browser) {
            try {
                await this.browser.close();
                console.log('Browser closed.');
            } catch (e) {
                console.error('Error closing browser:', e);
            }
            this.browser = null;
            this.page = null;
        }

        // 2. Wait for process to fully terminate
        await new Promise(r => setTimeout(r, 1500));

        // 3. Delete cookies file (with retry)
        for (let i = 0; i < 3; i++) {
            if (fs.existsSync(COOKIES_PATH)) {
                try {
                    fs.unlinkSync(COOKIES_PATH);
                    console.log('Cookies file deleted.');
                    break;
                } catch (error) {
                    console.error(`Error deleting cookies file (attempt ${i + 1}):`, error);
                    await new Promise(r => setTimeout(r, 500));
                }
            } else {
                console.log('Cookies file already deleted.');
                break;
            }
        }

        // 4. Verify deletion
        if (fs.existsSync(COOKIES_PATH)) {
            console.error('CRITICAL: Cookies file still exists after deletion attempts!');
        } else {
            console.log('Verified: Cookies file successfully deleted.');
        }

        // 5. Delete user data file
        if (fs.existsSync(USER_DATA_PATH)) {
            try {
                fs.unlinkSync(USER_DATA_PATH);
                console.log('User data file deleted.');
            } catch (error) {
                console.error('Error deleting user data file:', error);
            }
        }

        console.log('Logged out successfully. Browser will restart on next action.');
    }


    async getSteamUsername() {
        // Return cached data if available
        if (this.cachedUsername) {
            this.log('[getSteamUsername] Returning cached data: ' + this.cachedUsername);
            return { username: this.cachedUsername };
        }

        try {
            if (!this.browser || !this.page) {
                await this.init(true);
            }

            // Go to Steam account page
            await this.page.goto('https://store.steampowered.com/account/', {
                waitUntil: 'domcontentloaded',
                timeout: 10000
            });

            // Extract username only
            const data = await this.page.evaluate(() => {
                let username = null;

                // Try account page username
                const accountName = document.querySelector('.account_name');
                if (accountName) username = accountName.textContent.trim();

                // Fallback: try header username
                if (!username) {
                    const headerName = document.querySelector('.username');
                    if (headerName) username = headerName.textContent.trim();
                }

                return { username };
            });

            const finalUsername = data.username || 'Steam User';

            // Cache the username
            this.cachedUsername = finalUsername;

            // Kullanıcı bilgilerini kalıcı olarak kaydet
            this.saveUserData();

            // Auto-refresh cookies after fetching username
            await this.saveCookies();

            this.log('[getSteamUsername] Data fetched and cached: ' + finalUsername);

            return { username: finalUsername };
        } catch (e) {
            console.error('Get username error:', e.message);
            return { username: 'Steam User' };
        }
    }

    async getOwnedAppIds() {
        if (!this.page) await this.init(true);

        try {
            console.log('Fetching user library (Userdata)...');
            await this.page.goto('https://store.steampowered.com/dynamicstore/userdata/', { waitUntil: 'networkidle2' });

            // JSON yanıtı al
            const data = await this.page.evaluate(() => {
                try {
                    return JSON.parse(document.body.innerText);
                } catch (e) {
                    return null;
                }
            });

            if (!data || !data.rgOwnedApps) {
                console.log('Could not parse userdata or not logged in.');
                return [];
            }

            console.log(`Found ${data.rgOwnedApps.length} apps and ${data.rgOwnedPackages.length} packages.`);
            // Hem App ID'leri hem Package ID'leri döndürebiliriz ama oyun karşılaştırması genelde AppID üzerindendir.
            return data.rgOwnedApps;

        } catch (error) {
            console.error('Error fetching userdata:', error);
            return [];
        }
    }

    async handleAgeCheck() {
        if (this.page.url().includes('agecheck')) {
            console.log('🔞 Age gate detected. Bypassing...');
            try {
                // Select year
                await this.page.waitForSelector('#ageYear', { timeout: 5000 }).catch(() => null);
                const yearSelect = await this.page.$('#ageYear');
                if (yearSelect) {
                    await this.page.select('#ageYear', '1990');
                }

                // Click enter
                await this.page.evaluate(() => {
                    // Try to find the form submit or the specific link
                    const form = document.querySelector('#agecheck_form');
                    if (form) {
                        form.submit();
                        return;
                    }

                    // Fallback to clicking the button
                    const viewPageBtn = document.querySelector('.btn_medium > span') || document.querySelector('a.btn_medium');
                    if (viewPageBtn) viewPageBtn.click();
                });

                await this.page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 });
                console.log('✅ Age gate bypassed.');
                return true;
            } catch (e) {
                console.error('❌ Failed to bypass age gate:', e.message);
                // Return false but don't throw, let the main loop try anyway
                return false;
            }
        }
        return false;
    }

    async getOwnedGamesFull() {
        return this.getOwnedGameTitles();
    }

    async getOwnedGameTitles() {
        const library = { ids: [], names: [] };
        try {
            if (!this.browser || !this.page) {
                await this.init(true);
            } else {
                // Reload cookies from file
                this.log('[getOwnedGameTitles] Reloading cookies...');
                if (fs.existsSync(COOKIES_PATH)) {
                    try {
                        const cookiesJson = fs.readFileSync(COOKIES_PATH, 'utf-8');
                        const cookies = JSON.parse(cookiesJson);

                        // Cookies are already in Puppeteer format (normalized when saved)
                        // No need for format conversion
                        await this.page.setCookie(...cookies);
                        this.log(`[getOwnedGameTitles] ✅ Cookies loaded: ${cookies.length}`);
                    } catch (e) {
                        console.error('[getOwnedGameTitles] Cookie error:', e.message);
                    }
                }
            }

            this.log('Fetching user library (Userdata API)...');
            try {
                await this.page.goto('https://store.steampowered.com/dynamicstore/userdata/', {
                    waitUntil: 'domcontentloaded',
                    timeout: 20000
                });

                const userData = await this.page.evaluate(() => {
                    try {
                        return JSON.parse(document.body.innerText);
                    } catch (e) { return null; }
                });

                if (userData && userData.rgOwnedApps) {
                    library.ids = userData.rgOwnedApps;
                    this.log(`✅ Userdata API: ${library.ids.length} AppIDs found.`);
                }
            } catch (e) {
                this.log('⚠️ Userdata API failed or timed out: ' + e.message);
            }

            this.log('Fetching game names from Licenses page...');
            try {
                await this.page.goto('https://store.steampowered.com/account/licenses/', {
                    waitUntil: 'domcontentloaded',
                    timeout: 60000 // Increased to 60 seconds
                });

                const licenseData = await this.page.evaluate(() => {
                    const rows = document.querySelectorAll('.account_table tr');
                    const ids = [];
                    const names = [];

                    rows.forEach(row => {
                        const img = row.querySelector('img');
                        if (img && img.src) {
                            const match = img.src.match(/\/apps\/(\d+)\//);
                            if (match) ids.push(parseInt(match[1]));
                        }

                        const cols = row.querySelectorAll('td');
                        if (cols.length > 1) {
                            const name = cols[1].innerText.trim();
                            if (name && name.length > 1 && !name.includes('Remove')) {
                                names.push(name);
                            }
                        }
                    });
                    return { ids, names };
                });

                library.ids = [...new Set([...library.ids, ...licenseData.ids])];
                library.names = licenseData.names;
                this.log(`✅ Licenses page: ${licenseData.ids.length} AppIDs, ${licenseData.names.length} Titles found.`);
            } catch (e) {
                this.log('⚠️ Licenses page failed or timed out: ' + e.message);
                this.log('Continuing with Userdata API results only...');
            }

            this.log(`📚 Library summary: ${library.ids.length} AppIDs, ${library.names.length} Titles found.`);

            // Auto-refresh cookies after fetching library
            await this.saveCookies();
            this.log('[getOwnedGameTitles] ✅ Cookies refreshed');

            return library;

        } catch (error) {
            console.error('❌ Error in getOwnedGameTitles:', error.message);
            return library;
        }
    }

    async processGames(games, logCallback) {
        this.isAborted = false;

        // Restart browser in headless mode for processing
        await this.restartBrowser(true);

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

        const results = [];
        const total = games.length;

        for (let i = 0; i < games.length; i++) {
            if (this.isAborted) {
                console.log('Process aborted by user/logout.');
                break;
            }
            const game = games[i];
            const current = i + 1;

            // Send progress update
            logCallback({
                type: 'progress',
                current,
                total,
                game: game.title,
                url: game.url,
                status: 'processing'
            });

            try {
                // Navigate to game page
                await this.page.goto(game.url, { waitUntil: 'domcontentloaded', timeout: 30000 }); // Increased timeout

                // Check for Age Gate
                await this.handleAgeCheck();

                // Check ownership
                const isOwned = await this.page.evaluate(() => {
                    const ownedFlag = document.querySelector('.ds_owned_flag');
                    return ownedFlag && window.getComputedStyle(ownedFlag).display !== 'none';
                });

                const alreadyInLibraryBtn = await this.page.$('.btn_green_steamui span');
                const btnText = alreadyInLibraryBtn ? await this.page.evaluate(el => el.innerText, alreadyInLibraryBtn) : '';

                // Handle "Play Game" button as owned only if it doesn't have an add to library option separately
                // Some free games have both "Play Game" and "Add to Library" (rare, but possible for packages)
                // But generally if it says "Play Game", you have the license.
                if (isOwned || (btnText.includes('Play Game') || btnText.textContent === 'Oyna' || btnText.includes('Oyunu Oyna')) && !btnText.includes('Demo')) {
                    results.push({
                        game: game.title,
                        url: game.url,
                        status: 'owned',
                        message: 'Already owned'
                    });

                    logCallback({
                        type: 'result',
                        current,
                        total,
                        game: game.title,
                        url: game.url,
                        status: 'owned',
                        message: '✅ Already owned'
                    });
                } else {
                    // Try to claim

                    // JS Direct Execution disabled intentionally to force button click
                    const jsClaimSuccess = false;

                    // Define variables for error handling context
                    let clickedBtnText = '';

                    try {
                        // Find button - even if we used JS, we might need it for verification fallback or if JS failed silently
                        const addBtn = await this.page.evaluateHandle(() => {
                            // PRIORITY 1: Specific structure provided by user (Wrapper > Anchor)
                            const specificAnchor = document.querySelector('.btn_addtocart > a.btn_green_steamui');
                            if (specificAnchor && (
                                specificAnchor.innerText.toLowerCase().includes('add to account') ||
                                specificAnchor.innerText.toLowerCase().includes('hesaba ekle')
                            )) {
                                return specificAnchor;
                            }

                            // PRIORITY 1.5: Anchor with javascript href (common for Add to Cart)
                            const jsAnchor = document.querySelector('.btn_addtocart > a[href^="javascript:"]');
                            if (jsAnchor && (
                                jsAnchor.innerText.toLowerCase().includes('add to account') ||
                                jsAnchor.innerText.toLowerCase().includes('hesaba ekle')
                            )) {
                                return jsAnchor;
                            }

                            // PRIORITY 2: General "Add to Library" search
                            // We construct a list of potential candidates, but try to avoid wrappers if possible
                            const allButtons = Array.from(document.querySelectorAll('.btn_addtocart, .btn_addnocart, .btn_green_steamui, .btn_blue_steamui, .btn_medium'));

                            // Sort to prefer 'a' tags or 'span' over generic divs to ensure we click the interactive part
                            allButtons.sort((a, b) => {
                                const scoreA = (a.tagName === 'A' || a.tagName === 'SPAN') ? 1 : 0;
                                const scoreB = (b.tagName === 'A' || b.tagName === 'SPAN') ? 1 : 0;
                                return scoreB - scoreA;
                            });

                            const addToLibBtn = allButtons.find(b => {
                                // Check if this element is visible
                                if (b.offsetParent === null) return false;

                                const text = b.innerText.toLowerCase();
                                return text.includes('add to library') ||
                                    text.includes('add to account') ||
                                    text.includes('kütüphaneye ekle') ||
                                    text.includes('hesaba ekle');
                            });
                            if (addToLibBtn) return addToLibBtn;

                            // PRIORITY 3: Fallbacks
                            return document.querySelector('a.btn_addnocart') ||
                                document.querySelector('.btn_addtocart > a') || // Try to get the anchor inside
                                document.querySelector('.btn_addtocart') ||
                                document.querySelector('.btn_green_steamui');
                        });

                        // Click logic
                        if (!jsClaimSuccess) {
                            if (addBtn && await addBtn.asElement()) {
                                clickedBtnText = await this.page.evaluate(el => el.innerText, addBtn);
                                console.log(`[Claim] Clicking button: "${clickedBtnText}" for ${game.title}`);
                                await addBtn.hover();
                                await addBtn.click();
                            } else {
                                throw new Error('Claim button not found');
                            }
                        }

                        // Verification Logic
                        let verifyType = null;

                        // Wait for success or error indicators
                        await this.page.waitForFunction(() => {
                            // Positive indicators
                            const ownedFlag = document.querySelector('.ds_owned_flag');
                            const isOwnedVisible = ownedFlag && window.getComputedStyle(ownedFlag).display !== 'none';

                            const btns = Array.from(document.querySelectorAll('.btn_green_steamui span, a.btn_green_steamui, .btn_addtocart a span'));
                            const hasPlayButton = btns.some(b =>
                                b.innerText.includes('Play Game') ||
                                b.innerText.includes('Oyna') ||
                                b.innerText.includes('Oyunu Oyna') ||
                                b.innerText.includes('In Library') ||
                                b.innerText.includes('Kütüphanede') ||
                                b.innerText.includes('Use Now') ||
                                b.innerText.includes('Şimdi Kullan')
                            );

                            const bodyText = document.body.innerText;
                            const successText = bodyText.includes('Steam kütüphanenize eklendi') ||
                                bodyText.includes('Steam hesabınıza eklendi') ||
                                bodyText.includes('hesabınıza eklendi') ||
                                bodyText.includes('is now in your Steam Library') ||
                                bodyText.includes('has been added to your Steam account') ||
                                bodyText.includes('added to your Steam account') ||
                                bodyText.includes('TEBRİKLER!') ||
                                bodyText.includes('CONGRATULATIONS!');

                            const gotSteam = document.querySelector('#gotSteamModal') || document.querySelector('.got_steam_window');
                            const isGotSteamVisible = gotSteam && window.getComputedStyle(gotSteam).display !== 'none';

                            const isGotSteamPopupVisible = (
                                (bodyText.includes('Got Steam?') || bodyText.includes('Steam yüklü mü?')) &&
                                (bodyText.includes('Yes, Steam is installed') || bodyText.includes('Evet, Steam yüklü'))
                            );

                            // Negative indicators
                            const errorText = bodyText.includes('There was a problem adding this item') ||
                                bodyText.includes('There was a problem adding this product') ||
                                bodyText.includes('An error was encountered') ||
                                document.title.includes('Oops') ||
                                bodyText.includes('Oops, sorry!') ||
                                bodyText.includes('requires ownership of the base game');

                            return isOwnedVisible || hasPlayButton || successText || isGotSteamVisible || isGotSteamPopupVisible || errorText;
                        }, { timeout: 15000 });

                        // Check verification result
                        verifyType = await this.page.evaluate(() => {
                            const bodyText = document.body.innerText;

                            // Check for success text first to avoid treating inline "Steam yüklü mü?" as a popup
                            const successText = bodyText.includes('Steam kütüphanenize eklendi') ||
                                bodyText.includes('Steam hesabınıza eklendi') ||
                                bodyText.includes('hesabınıza eklendi') ||
                                bodyText.includes('is now in your Steam Library') ||
                                bodyText.includes('has been added to your Steam account') ||
                                bodyText.includes('added to your Steam account') ||
                                bodyText.includes('TEBRİKLER!') ||
                                bodyText.includes('CONGRATULATIONS!');

                            if (successText) return 'verified';

                            if (bodyText.includes('requires ownership of the base game')) return 'error_base_game';

                            // Check for standard error messages
                            if (bodyText.includes('There was a problem adding this item') ||
                                bodyText.includes('There was a problem adding this product') ||
                                bodyText.includes('An error was encountered')) {
                                return 'error_generic';
                            }

                            // Check for Oops page specific
                            if (document.title.includes('Oops') || bodyText.includes('Oops, sorry!')) return 'error_oops';

                            const ownedFlag = document.querySelector('.ds_owned_flag');
                            if (ownedFlag && window.getComputedStyle(ownedFlag).display !== 'none') return 'owned';

                            const gotSteam = document.querySelector('#gotSteamModal') || document.querySelector('.got_steam_window');
                            if (gotSteam && window.getComputedStyle(gotSteam).display !== 'none') return 'popup';

                            if ((bodyText.includes('Got Steam?') || bodyText.includes('Steam yüklü mü?')) &&
                                (bodyText.includes('Yes, Steam is installed') || bodyText.includes('Evet, Steam yüklü'))) return 'popup';

                            return 'verified';
                        });

                        if (verifyType === 'error_base_game') throw new Error('Requires base game ownership');
                        if (verifyType === 'error_generic') throw new Error('Steam returned a generic error (Problem adding item/product)');
                        if (verifyType === 'error_oops') throw new Error('Steam Oops Page: Error encountered processing request');


                        // Handle Popup
                        if (verifyType === 'popup') {
                            console.log('[Claim] Popup detected. Clicking "Yes, Steam is installed"...');
                            try {
                                const clicked = await this.page.evaluate(() => {
                                    const buttons = Array.from(document.querySelectorAll('a, button, div.btn_medium'));
                                    const yesBtn = buttons.find(b =>
                                        (b.innerText && (b.innerText.includes('Yes, Steam is installed') || b.innerText.includes('Evet, Steam yüklü')))
                                    );
                                    if (yesBtn) { yesBtn.click(); return true; }
                                    return false;
                                });
                                await new Promise(r => setTimeout(r, 2000));
                            } catch (e) {
                                console.error('[Claim] Error clicking popup button:', e.message);
                            }
                        }

                        // Success
                        const successMsg = verifyType === 'popup' ? 'Claimed (Triggered Installer)' : 'Claimed successfully & Verified';
                        results.push({ game: game.title, url: game.url, status: 'success', message: successMsg });
                        logCallback({ type: 'result', current, total, game: game.title, url: game.url, status: 'success', message: `✅ ${successMsg}` });

                    } catch (e) {
                        console.error(`Verification failed for ${game.title}:`, e.message);

                        // LAST RESORT: Reload page check
                        let recovered = false;
                        if (!e.message.includes('Requires base game')) {
                            console.log('🔄 Verification timed out. Reloading page...');
                            try {
                                await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
                                const isOwnedAfterReload = await this.page.evaluate(() => {
                                    const ownedFlag = document.querySelector('.ds_owned_flag');
                                    return ownedFlag && window.getComputedStyle(ownedFlag).display !== 'none';
                                });

                                if (isOwnedAfterReload) {
                                    console.log('✅ Found ownership after reload!');
                                    console.log('✅ Found ownership after reload!');
                                    results.push({ game: game.title, url: game.url, status: 'success', message: 'Claimed (Verified after reload)' });
                                    logCallback({ type: 'result', current, total, game: game.title, url: game.url, status: 'success', message: '✅ Claimed (Verified after reload)' });
                                    recovered = true;
                                }
                            } catch (reloadEx) { }
                        }

                        if (!recovered) {
                            // "Play Game" button Assumption check
                            if (clickedBtnText && (clickedBtnText.includes('Play Game') || clickedBtnText.includes('Oyna'))) {
                                console.log('[Claim] Warning: "Play Game" likely launched protocol. Assuming success.');
                                results.push({ game: game.title, url: game.url, status: 'success', message: 'Claimed (Launched Installer)' });
                                logCallback({ type: 'result', current, total, game: game.title, url: game.url, status: 'success', message: '✅ Claimed (Launched Installer)' });
                            } else {
                                // Real failure
                                // Take screenshot
                                try {
                                    const debugDir = path.join(__dirname, '../debug_screenshots');
                                    if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
                                    const cleanTitle = game.title.replace(/[^a-z0-9]/gi, '_');
                                    const screenshotPath = path.join(debugDir, `failed_${cleanTitle}_${Date.now()}.png`);
                                    await this.page.screenshot({ path: screenshotPath, fullPage: true });
                                    console.log(`📸 Debug screenshot: ${screenshotPath}`);
                                } catch (err) { }

                                // Check Cart
                                const inCart = await this.page.evaluate(() => document.body.innerText.includes('Sepetiniz') || document.body.innerText.includes('Your Shopping Cart'));

                                if (inCart) {
                                    results.push({ game: game.title, url: game.url, status: 'error', message: 'Added to cart, not claimed' });
                                    logCallback({ type: 'result', current, total, game: game.title, url: game.url, status: 'error', message: '⚠️ Added to cart (Manual checkout needed)' });
                                } else {
                                    results.push({ game: game.title, url: game.url, status: 'error', message: e.message });
                                    logCallback({ type: 'result', current, total, game: game.title, url: game.url, status: 'error', message: `❌ ${e.message}` });
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                results.push({
                    game: game.title,
                    url: game.url,
                    status: 'error',
                    message: error.message
                });

                logCallback({
                    type: 'result',
                    current,
                    total,
                    game: game.title,
                    url: game.url,
                    status: 'error',
                    message: `❌ ${error.message} `
                });

                try {
                    const debugDir = path.join(__dirname, '../debug_screenshots');
                    if (!fs.existsSync(debugDir)) {
                        fs.mkdirSync(debugDir, { recursive: true });
                    }
                    const cleanTitle = game.title.replace(/[^a-z0-9]/gi, '_');
                    const screenshotPath = path.join(debugDir, `error_${cleanTitle}_${Date.now()}.png`);
                    await this.page.screenshot({ path: screenshotPath, fullPage: true });
                } catch (err) { }
            }

            // Short delay between games
            await new Promise(r => setTimeout(r, 500));
        }

        // Save cookies after processing ONLY if not aborted
        if (!this.isAborted) {
            await this.saveCookies();
        }

        // Send completion
        logCallback({
            type: 'complete',
            total,
            results
        });

        return results;
    }
}

module.exports = { SteamBot };
