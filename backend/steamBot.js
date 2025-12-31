const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const COOKIES_PATH = path.join(__dirname, 'cookies.json');

class SteamBot {
    constructor() {
        this.browser = null;
        this.page = null;
        this.loginStatus = 'idle'; // idle, waiting_for_user, logged_in, failed
        this.isAborted = false;
        this.cachedUsername = null; // Cache for username to avoid repeated fetches
        this.cachedAvatarUrl = null; // Cache for avatar URL
    }

    getLoginStatus() {
        return this.loginStatus;
    }

    checkLoginSimple() {
        // Fast check: just verify cookies file exists
        if (!fs.existsSync(COOKIES_PATH)) {
            console.log('[checkLoginSimple] Cookies file NOT found:', COOKIES_PATH);
            return false;
        }
        try {
            const cookiesJson = fs.readFileSync(COOKIES_PATH, 'utf-8');
            const cookies = JSON.parse(cookiesJson);
            console.log('[checkLoginSimple] Cookies loaded, count:', cookies.length);

            const steamLoginCookie = cookies.find(c =>
                c.name === 'steamLoginSecure' || c.name === 'steamlogin'
            );

            if (steamLoginCookie) {
                console.log('[checkLoginSimple] Steam login cookie FOUND!');
                return true;
            } else {
                console.log('[checkLoginSimple] Steam login cookie NOT FOUND. Available cookies:',
                    cookies.map(c => c.name).join(', '));
                return false;
            }
        } catch (e) {
            console.error('[checkLoginSimple] Error:', e.message);
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
            console.log(`Launching browser(Headless: ${headless})...`);
            this.browser = await puppeteer.launch({
                headless: headless ? "new" : false,
                defaultViewport: null,
                args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox']
            });
            this.page = await this.browser.newPage();

            if (fs.existsSync(COOKIES_PATH)) {
                try {
                    const cookies = JSON.parse(fs.readFileSync(COOKIES_PATH));
                    await this.page.setCookie(...cookies);
                } catch (e) { console.error('Cookie load error:', e); }
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
            return !url.includes('login');
        } catch (e) {
            console.error('CheckLogin error:', e.message);
            return false;
        }
    }

    async login() {
        this.loginStatus = 'waiting_for_user';
        console.log('Starting login flow...');

        // Giriş için arayüz şart (Headless: false)
        await this.restartBrowser(false);

        try {
            await this.page.goto('https://store.steampowered.com/login/', { waitUntil: 'networkidle2' });
            console.log('Login page opened. Waiting for user to login...');

            // Kullanıcının giriş yapmasını bekle (account_pulldown elementi görünene kadar)
            // 5 dakika süre tanıyalım
            await this.page.waitForSelector('#account_pulldown', { timeout: 300000 });
            console.log('User logged in successfully!');
            this.loginStatus = 'logged_in';

            // Cookie'leri kaydet
            await this.saveCookies();

            // Tarayıcıyı kapatıp hemen arka plan moduna (headless) geri dön
            console.log('Switching back to background mode...');
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
            const cookies = await this.page.cookies();
            fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));
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

        console.log('Logged out successfully. Browser will restart on next action.');
    }

    async getSteamUsername() {
        // Return cached data if available
        if (this.cachedUsername && this.cachedAvatarUrl) {
            console.log('[getSteamUsername] Returning cached data:', { username: this.cachedUsername });
            return { username: this.cachedUsername, avatarUrl: this.cachedAvatarUrl };
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

            // Extract username and avatar
            const data = await this.page.evaluate(() => {
                let username = null;
                let avatarUrl = null;

                // Try account page username
                const accountName = document.querySelector('.account_name');
                if (accountName) username = accountName.textContent.trim();

                // Fallback: try header username
                if (!username) {
                    const headerName = document.querySelector('.username');
                    if (headerName) username = headerName.textContent.trim();
                }

                // Avatar extraction (multiple potential selectors)
                const avatarImg = document.querySelector('.playerAvatar img') ||
                    document.querySelector('.user_avatar') ||
                    document.querySelector('.avatarIcon');

                if (avatarImg) {
                    avatarUrl = avatarImg.src;
                }

                return { username, avatarUrl };
            });

            const finalUsername = data.username || 'Steam User';
            const finalAvatarUrl = data.avatarUrl || null;

            // Cache the data
            this.cachedUsername = finalUsername;
            this.cachedAvatarUrl = finalAvatarUrl;

            console.log('[getSteamUsername] Data fetched and cached:', { username: finalUsername, avatar: !!finalAvatarUrl });

            return { username: finalUsername, avatarUrl: finalAvatarUrl };
        } catch (e) {
            console.error('Get username error:', e.message);
            return { username: 'Steam User', avatarUrl: null };
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

    async getOwnedGamesFull() {
        return this.getOwnedGameTitles();
    }

    async getOwnedGameTitles() {
        const library = { ids: [], names: [] };
        try {
            if (!this.browser || !this.page) {
                await this.init(true);
            } else {
                // Reload cookies from Electron
                console.log('[getOwnedGameTitles] Reloading cookies...');
                if (fs.existsSync(COOKIES_PATH)) {
                    try {
                        const cookiesJson = fs.readFileSync(COOKIES_PATH, 'utf-8');
                        const cookies = JSON.parse(cookiesJson);

                        const puppeteerCookies = cookies.map(c => ({
                            name: c.name,
                            value: c.value,
                            domain: c.domain || '.steampowered.com',
                            path: c.path || '/',
                            expires: c.expirationDate || -1,
                            httpOnly: c.httpOnly !== undefined ? c.httpOnly : false,
                            secure: c.secure !== undefined ? c.secure : false
                        }));

                        await this.page.setCookie(...puppeteerCookies);
                        console.log('[getOwnedGameTitles] Cookies loaded:', cookies.length);
                    } catch (e) {
                        console.error('[getOwnedGameTitles] Cookie error:', e.message);
                    }
                }
            }

            console.log('Fetching user library (Userdata API)...');
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
                }
            } catch (e) { console.log('Userdata API failed or timed out, continuing...'); }

            console.log('Fetching game names from Licenses page...');
            await this.page.goto('https://store.steampowered.com/account/licenses/', {
                waitUntil: 'domcontentloaded',
                timeout: 30000
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

            console.log(`Library summary: ${library.ids.length} AppIDs, ${library.names.length} Titles found.`);
            return library;

        } catch (error) {
            console.error('Error in getOwnedGameTitles:', error.message);
            return library;
        }
    }

    async processGames(games, logCallback) {
        this.isAborted = false;

        // Restart browser in headless mode for processing
        await this.restartBrowser(true);

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
                status: 'processing'
            });

            try {
                // Navigate to game page
                await this.page.goto(game.url, { waitUntil: 'domcontentloaded', timeout: 15000 });

                // Check ownership
                const isOwned = await this.page.evaluate(() => {
                    const ownedFlag = document.querySelector('.ds_owned_flag');
                    return ownedFlag && window.getComputedStyle(ownedFlag).display !== 'none';
                });

                const alreadyInLibraryBtn = await this.page.$('.btn_green_steamui span');
                const btnText = alreadyInLibraryBtn ? await this.page.evaluate(el => el.innerText, alreadyInLibraryBtn) : '';

                if (isOwned || btnText.includes('Play Game') || btnText.includes('Oyna')) {
                    results.push({
                        game: game.title,
                        status: 'owned',
                        message: 'Already owned'
                    });

                    logCallback({
                        type: 'result',
                        current,
                        total,
                        game: game.title,
                        status: 'owned',
                        message: '✅ Already owned'
                    });
                } else {
                    // Try to claim
                    const addBtn = await this.page.$('a.btn_addnocart, .btn_addtocart');

                    if (addBtn) {
                        await addBtn.click();
                        await new Promise(r => setTimeout(r, 2000));

                        results.push({
                            game: game.title,
                            status: 'success',
                            message: 'Claimed successfully'
                        });

                        logCallback({
                            type: 'result',
                            current,
                            total,
                            game: game.title,
                            status: 'success',
                            message: '✅ Claimed successfully'
                        });
                    } else {
                        results.push({
                            game: game.title,
                            status: 'error',
                            message: 'Claim button not found'
                        });

                        logCallback({
                            type: 'result',
                            current,
                            total,
                            game: game.title,
                            status: 'error',
                            message: '⚠️ Claim button not found'
                        });
                    }
                }
            } catch (error) {
                results.push({
                    game: game.title,
                    status: 'error',
                    message: error.message
                });

                logCallback({
                    type: 'result',
                    current,
                    total,
                    game: game.title,
                    status: 'error',
                    message: `❌ ${error.message} `
                });
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
