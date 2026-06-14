#!/usr/bin/env node

const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// .env dosyasını backend klasöründen yükle
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const { SteamBot } = require('../backend/steamBot');
const { getFreeSteamGames } = require('../backend/itadService');
const readline = require('readline');
const translations = require('./translations');

// ANSI renk kodları
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bgBlue: '\x1b[44m',
    bgGreen: '\x1b[42m',
    bgRed: '\x1b[41m'
};

// Dil ayarları dosyası
const LANG_FILE = path.join(__dirname, 'language.json');
const CONFIG_FILE = path.join(__dirname, 'config.json');

class SteamCLI {
    constructor() {
        this.bot = new SteamBot(true); // Silent mode aktif
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.isLoggedIn = false;
        this.freeGames = [];
        this.ownedGames = { ids: [], names: [] };
        this.lang = this.loadLanguage();
        this.t = translations[this.lang]; // Çeviri objesi
        this.config = this.loadConfig();
    }

    // Dil yükle
    loadLanguage() {
        try {
            if (fs.existsSync(LANG_FILE)) {
                const data = JSON.parse(fs.readFileSync(LANG_FILE, 'utf-8'));
                return data.language || 'tr';
            }
        } catch (e) {
            // Hata durumunda varsayılan dil
        }
        return 'tr'; // Varsayılan Türkçe
    }

    // Dil kaydet
    saveLanguage(lang) {
        try {
            fs.writeFileSync(LANG_FILE, JSON.stringify({ language: lang }, null, 2));
            this.lang = lang;
            this.t = translations[lang];
            console.log(`[DEBUG] Language saved to: ${LANG_FILE}`);
            console.log(`[DEBUG] New language: ${lang}`);
            return true;
        } catch (e) {
            console.error('[ERROR] Language save error:', e.message);
            console.error('[ERROR] File path:', LANG_FILE);
            return false;
        }
    }

    // Config yükle
    loadConfig() {
        try {
            if (fs.existsSync(CONFIG_FILE)) {
                const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
                // Varsayılan ayarlarla birleştir
                return {
                    checkNewGames: false,
                    autoClaim: false,
                    ...data
                };
            }
        } catch (e) {
            console.error('[ERROR] Config load error:', e.message);
        }
        return { checkNewGames: false, autoClaim: false }; // Varsayılan ayarlar
    }

    // Config kaydet
    saveConfig() {
        try {
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
            return true;
        } catch (e) {
            console.error('[ERROR] Config save error:', e.message);
            return false;
        }
    }

    // Renkli log fonksiyonları
    log(message, color = 'white') {
        console.log(`${colors[color]}${message}${colors.reset}`);
    }

    success(message) {
        console.log(`${colors.green}✓ ${message}${colors.reset}`);
    }

    error(message) {
        console.log(`${colors.red}✗ ${message}${colors.reset}`);
    }

    info(message) {
        console.log(`${colors.cyan}ℹ ${message}${colors.reset}`);
    }

    warning(message) {
        console.log(`${colors.yellow}⚠ ${message}${colors.reset}`);
    }

    header(message) {
        console.log(`\n${colors.bgBlue}${colors.bright} ${message} ${colors.reset}\n`);
    }

    // Kullanıcıdan input alma
    question(query) {
        return new Promise(resolve => this.rl.question(`${colors.cyan}${query}${colors.reset}`, resolve));
    }

    // Ana menü
    async showMainMenu() {
        // Terminal'i temizle
        console.clear();
        this.header(this.t.appTitle);

        // Kullanıcı bilgilerini göster
        if (this.isLoggedIn) {
            try {
                const userInfo = await this.bot.getSteamUsername();
                console.log(`${colors.bright}${this.t.user}:${colors.reset} ${colors.green}${userInfo.username}${colors.reset}`);
            } catch (error) {
                console.log(`${colors.bright}${this.t.status}:${colors.reset} ${colors.green}${this.t.loggedIn}${colors.reset}`);
            }
        } else {
            console.log(`${colors.bright}${this.t.status}:${colors.reset} ${colors.red}${this.t.notLoggedIn}${colors.reset}`);
        }

        console.log('\n' + colors.bright + '═'.repeat(50) + colors.reset);

        let menuNumber = 1;

        // Dinamik menü - sadece giriş yapılmadıysa giriş seçeneği göster
        if (!this.isLoggedIn) {
            console.log(`${colors.yellow}${menuNumber}.${colors.reset} ${this.t.menu.login}`);
            menuNumber++;
        }

        console.log(`${colors.yellow}${menuNumber}.${colors.reset} ${this.t.menu.listGames}`);
        const listGamesOption = menuNumber;
        menuNumber++;

        console.log(`${colors.yellow}${menuNumber}.${colors.reset} ${this.t.menu.viewLibrary}`);
        const viewLibraryOption = menuNumber;
        menuNumber++;

        console.log(`${colors.yellow}${menuNumber}.${colors.reset} ${this.t.menu.claimGames}`);
        const claimOption = menuNumber;
        menuNumber++;

        console.log(`${colors.yellow}${menuNumber}.${colors.reset} ${this.t.menu.claimAll}`);
        const claimAllOption = menuNumber;
        menuNumber++;

        // Ayarlar
        console.log(`${colors.yellow}${menuNumber}.${colors.reset} ${this.t.menu.settings}`);
        const settingsOption = menuNumber;
        menuNumber++;

        // Logout sadece giriş yapıldıysa göster - KIRMIZI
        if (this.isLoggedIn) {
            console.log(`${colors.red}${menuNumber}.${colors.reset} ${colors.red}${this.t.menu.logout}${colors.reset}`);
            var logoutOption = menuNumber;
            menuNumber++;
        }

        console.log(`${colors.yellow}0.${colors.reset} ${this.t.menu.exit}`);
        console.log(colors.bright + '═'.repeat(50) + colors.reset + '\n');

        const choice = await this.question(this.t.yourChoice + ': ');
        await this.handleMenuChoice(choice.trim(), {
            listGamesOption,
            viewLibraryOption,
            claimOption,
            claimAllOption,
            settingsOption,
            logoutOption: this.isLoggedIn ? logoutOption : null
        });
    }

    // Menü seçimlerini işle
    async handleMenuChoice(choice, options) {
        console.log(''); // Boş satır

        const choiceNum = parseInt(choice);

        // Giriş yapılmadıysa ve 1 seçildiyse -> Login
        if (!this.isLoggedIn && choiceNum === 1) {
            await this.loginToSteam();
        }
        // Ücretsiz oyunları listele
        else if (choiceNum === options.listGamesOption) {
            await this.listFreeGames();
        }
        // Kütüphaneyi görüntüle
        else if (choiceNum === options.viewLibraryOption) {
            await this.viewLibrary();
        }
        // Oyun talep et
        else if (choiceNum === options.claimOption) {
            await this.claimSpecificGames();
        }
        // Tüm oyunları talep et
        else if (choiceNum === options.claimAllOption) {
            await this.claimAllFreeGames();
        }
        // Ayarlar
        else if (choiceNum === options.settingsOption) {
            await this.showSettings();
        }
        // Logout
        else if (options.logoutOption && choiceNum === options.logoutOption) {
            await this.logout();
        }
        // Çıkış
        else if (choiceNum === 0) {
            await this.exit();
            return;
        }
        else {
            this.error(this.t.general.invalidChoice);
            await this.pause();
        }

        await this.showMainMenu();
    }

    // Steam'e giriş yap
    async loginToSteam() {
        console.clear();
        this.header(this.t.login.title);

        this.info(this.t.login.browserOpening);
        this.info(this.t.login.pleaseLogin);
        this.warning(this.t.login.mayTakeTime);

        try {
            await this.bot.login();
            this.success(this.t.login.success);
            this.isLoggedIn = true;
        } catch (error) {
            this.error(`${this.t.login.failed}: ${error.message}`);
        }

        await this.pause();
    }

    // Ücretsiz oyunları listele
    async listFreeGames() {
        console.clear();
        this.header(this.t.freeGames.title);

        this.info(this.t.freeGames.fetching);

        try {
            this.freeGames = await getFreeSteamGames();

            if (this.freeGames.length === 0) {
                this.warning(this.t.freeGames.notFound);
            } else {
                this.success(`${this.freeGames.length} ${this.t.freeGames.found}\n`);

                // Sahip olunan oyunları kontrol et
                if (this.isLoggedIn) {
                    this.info(this.t.freeGames.checkingLibrary + '\n');
                    this.ownedGames = await this.bot.getOwnedGamesFull();
                }

                this.freeGames.forEach((game, index) => {
                    const isOwned = this.ownedGames.ids.includes(game.appId) ||
                        this.ownedGames.names.some(name =>
                            name.toLowerCase().includes(game.title.toLowerCase())
                        );

                    const ownedTag = isOwned ?
                        `${colors.green}${this.t.freeGames.owned}${colors.reset}` :
                        `${colors.yellow}${this.t.freeGames.new}${colors.reset}`;

                    console.log(`${colors.bright}${index + 1}.${colors.reset} ${game.title} ${ownedTag}`);
                    console.log(`   ${colors.dim}URL: ${game.url}${colors.reset}`);

                    if (game.expiry) {
                        const locale = this.lang === 'tr' ? 'tr-TR' : 'en-US';
                        const expiryDate = new Date(game.expiry * 1000); // Unix timestamp to Date
                        // Check if date is valid
                        if (!isNaN(expiryDate.getTime())) {
                            console.log(`   ${colors.yellow}${this.t.freeGames.endDate}: ${expiryDate.toLocaleString(locale)}${colors.reset}`);
                        }
                    }
                    console.log('');
                });
            }
        } catch (error) {
            this.error(`${this.t.general.error}: ${error.message}`);
        }

        await this.pause();
    }

    // Kütüphaneyi görüntüle
    async viewLibrary() {
        console.clear();
        this.header(this.t.library.title);

        if (!this.isLoggedIn) {
            this.warning(this.t.general.loginRequired);
            await this.pause();
            return;
        }

        this.info(this.t.library.loading);

        try {
            this.ownedGames = await this.bot.getOwnedGamesFull();

            this.success(`${this.t.library.totalGames} ${this.ownedGames.ids.length} ${this.t.library.gamesFound}\n`);

            if (this.ownedGames.names.length > 0) {
                const pageSize = 20;
                let currentPage = 0;
                const totalPages = Math.ceil(this.ownedGames.names.length / pageSize);

                while (true) {
                    console.clear();
                    this.header(this.t.library.title);
                    this.success(`${this.t.library.totalGames} ${this.ownedGames.ids.length} ${this.t.library.gamesFound}\n`);

                    const start = currentPage * pageSize;
                    const end = Math.min(start + pageSize, this.ownedGames.names.length);

                    this.log(`${this.t.library.recentGames} (${start + 1}-${end} / ${this.ownedGames.names.length})`, 'bright');

                    // Oyunları göster
                    this.ownedGames.names.slice(start, end).forEach((name, index) => {
                        console.log(`${colors.cyan}${start + index + 1}.${colors.reset} ${name}`);
                    });

                    console.log('');
                    this.info(`${this.t.library.page} ${currentPage + 1}/${totalPages}`);

                    if (totalPages > 1) {
                        console.log(`\n${colors.yellow}n${colors.reset} = ${this.t.library.next} | ${colors.yellow}p${colors.reset} = ${this.t.library.previous} | ${colors.yellow}0${colors.reset} = ${this.t.library.goBack}`);
                        const choice = await this.question(this.t.yourChoice + ': ');

                        if (choice.trim() === '0') {
                            break;
                        } else if (choice.trim().toLowerCase() === 'n' && currentPage < totalPages - 1) {
                            currentPage++;
                        } else if (choice.trim().toLowerCase() === 'p' && currentPage > 0) {
                            currentPage--;
                        } else {
                            break;
                        }
                    } else {
                        await this.pause();
                        break;
                    }
                }
            }
        } catch (error) {
            this.error(`${this.t.general.error}: ${error.message}`);
        }
    }

    // Belirli oyunları talep et
    async claimSpecificGames() {
        console.clear();
        this.header(this.t.claim.title);

        if (!this.isLoggedIn) {
            this.warning(this.t.general.loginRequired);
            await this.pause();
            return;
        }

        // Otomatik olarak ücretsiz oyunları listele
        this.info(this.t.freeGames.fetching);
        this.freeGames = await getFreeSteamGames();

        if (this.freeGames.length === 0) {
            this.warning(this.t.freeGames.notFound);
            await this.pause();
            return;
        }

        // Sahip olunan oyunları kontrol et
        this.info(this.t.freeGames.checkingLibrary + '\n');
        this.ownedGames = await this.bot.getOwnedGamesFull();

        // Talep edilebilecek oyunları filtrele
        const availableGames = this.freeGames.filter(game => {
            const isOwned = this.ownedGames.ids.includes(game.appId) ||
                this.ownedGames.names.some(name =>
                    name.toLowerCase().includes(game.title.toLowerCase())
                );
            return !isOwned;
        });

        // Eğer talep edilecek oyun yoksa
        if (availableGames.length === 0) {
            this.success(this.t.claim.allOwned);
            await this.pause();
            return;
        }

        // Oyunları listele
        this.success(`${this.freeGames.length} ${this.t.freeGames.found}\n`);
        this.freeGames.forEach((game, index) => {
            const isOwned = this.ownedGames.ids.includes(game.appId) ||
                this.ownedGames.names.some(name =>
                    name.toLowerCase().includes(game.title.toLowerCase())
                );

            const ownedTag = isOwned ?
                `${colors.green}[SAHİP]${colors.reset}` :
                `${colors.yellow}[YENİ]${colors.reset}`;

            console.log(`${colors.bright}${index + 1}.${colors.reset} ${game.title} ${ownedTag}`);
        });
        console.log('');
        this.info(`${this.t.claim.available}: ${availableGames.length} ${this.t.claim.games}\n`);

        const indices = await this.question(this.t.claim.prompt + ': ');

        // 0 girilirse ana menüye dön
        if (indices.trim() === '0') {
            this.info(this.t.claim.cancelled);
            await this.pause();
            return;
        }

        const selectedIndices = indices.split(',').map(i => parseInt(i.trim()) - 1);

        const selectedGames = selectedIndices
            .filter(i => i >= 0 && i < this.freeGames.length)
            .map(i => this.freeGames[i]);

        if (selectedGames.length === 0) {
            this.error(this.t.claim.noValidSelection);
            await this.pause();
            return;
        }

        this.info(`${selectedGames.length} ${this.t.claim.claiming}\n`);

        await this.bot.processGames(selectedGames, (log) => {
            if (log.type === 'progress') {
                this.info(`[${log.current}/${log.total}] ${log.game} işleniyor...`);
            } else if (log.type === 'result') {
                if (log.status === 'success') {
                    this.success(`${log.game}: ${log.message}`);
                } else if (log.status === 'owned') {
                    this.warning(`${log.game}: ${log.message}`);
                } else {
                    this.error(`${log.game}: ${log.message}`);
                }
            } else if (log.type === 'complete') {
                console.log('');
                this.success(this.t.claim.completed);
            }
        });

        await this.pause();
    }

    // Tüm ücretsiz oyunları talep et
    async claimAllFreeGames(auto = false) {
        console.clear();
        this.header(this.t.claimAll.title);

        if (!this.isLoggedIn) {
            this.warning(this.t.general.loginRequired);
            await this.pause();
            return;
        }

        this.info(this.t.freeGames.fetching);
        this.freeGames = await getFreeSteamGames();

        if (this.freeGames.length === 0) {
            this.warning('Şu anda ücretsiz oyun bulunamadı.');
            await this.pause();
            return;
        }

        this.info(this.t.freeGames.checkingLibrary);
        this.ownedGames = await this.bot.getOwnedGamesFull();

        // Sahip olunmayan oyunları filtrele
        const gamesToClaim = this.freeGames.filter(game => {
            const isOwned = this.ownedGames.ids.includes(game.appId) ||
                this.ownedGames.names.some(name =>
                    name.toLowerCase().includes(game.title.toLowerCase())
                );
            return !isOwned;
        });

        if (gamesToClaim.length === 0) {
            this.success(this.t.claimAll.allOwned);
            await this.pause();
            return;
        }

        this.warning(`${gamesToClaim.length} ${this.t.claimAll.newGames}`);

        if (!auto) {
            const confirm = await this.question(this.t.claimAll.confirm + ' ');

            if (confirm.toLowerCase() !== 'e' && confirm.toLowerCase() !== 'y') {
                this.info(this.t.claim.cancelled);
                await this.pause();
                return;
            }
        } else {
            this.info('Otomatik toplama modu aktif. Onay beklenmiyor...');
        }

        console.log('');
        this.info('Oyunlar talep ediliyor...\n');

        await this.bot.processGames(gamesToClaim, (log) => {
            if (log.type === 'progress') {
                this.info(`[${log.current}/${log.total}] ${log.game} işleniyor...`);
            } else if (log.type === 'result') {
                if (log.status === 'success') {
                    this.success(`${log.game}: ${log.message}`);
                } else if (log.status === 'owned') {
                    this.warning(`${log.game}: ${log.message}`);
                } else {
                    this.error(`${log.game}: ${log.message}`);
                }
            } else if (log.type === 'complete') {
                console.log('');
                this.success(this.t.claimAll.allProcessed);
            }
        });

        if (!auto) {
            await this.pause();
        } else {
            console.log('');
            this.success('Otomatik toplama tamamlandı. Menüye dönülüyor...');
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    // Ayarlar
    async showSettings() {
        console.clear();
        this.header('⚙️ AYARLAR');

        const langNames = {
            'tr': 'Türkçe',
            'en': 'English'
        };

        const checkNewGamesStatus = this.config.checkNewGames ?
            `${colors.green}✓ Aktif${colors.reset}` :
            `${colors.red}✗ Kapalı${colors.reset}`;

        const autoClaimStatus = this.config.autoClaim ?
            `${colors.green}✓ Aktif${colors.reset}` :
            `${colors.red}✗ Kapalı${colors.reset}`;

        console.log(`${colors.bright}Dil / Language:${colors.reset} ${colors.green}${langNames[this.lang]}${colors.reset}`);
        console.log(`${colors.bright}Başlangıçta Yeni Oyun Kontrolü:${colors.reset} ${checkNewGamesStatus}`);
        console.log(`${colors.bright}Başlangıçta Otomatik Topla:${colors.reset} ${autoClaimStatus}\n`);

        console.log(colors.bright + '═'.repeat(50) + colors.reset);
        console.log(`${colors.yellow}1.${colors.reset} Türkçe`);
        console.log(`${colors.yellow}2.${colors.reset} English`);
        console.log(`${colors.yellow}3.${colors.reset} ${this.lang === 'tr' ? 'Başlangıçta Yeni Oyun Kontrolü' : 'Check New Games on Startup'} [${this.config.checkNewGames ? 'ON' : 'OFF'}]`);
        console.log(`${colors.yellow}4.${colors.reset} ${this.lang === 'tr' ? 'Başlangıçta Otomatik Topla' : 'Auto Claim on Startup'} [${this.config.autoClaim ? 'ON' : 'OFF'}]`);
        console.log(`${colors.yellow}0.${colors.reset} Geri Dön / Go Back`);
        console.log(colors.bright + '═'.repeat(50) + colors.reset + '\n');


        const choice = await this.question('Seçiminiz / Your choice: ');
        const trimmedChoice = choice.trim();

        if (trimmedChoice === '0') {
            return;
        }

        if (trimmedChoice === '3') {
            // Toggle check new games
            this.config.checkNewGames = !this.config.checkNewGames;
            // Auto claim check new games ile çakışmasın diye kapatılabilir veya bağımsız bırakılabilir
            // Şimdilik bağımsız
            if (this.saveConfig()) {
                const status = this.config.checkNewGames ?
                    (this.lang === 'tr' ? 'Açıldı' : 'Enabled') :
                    (this.lang === 'tr' ? 'Kapatıldı' : 'Disabled');
                this.success(`${this.lang === 'tr' ? 'Başlangıçta Yeni Oyun Kontrolü' : 'Check New Games on Startup'}: ${status}`);
            } else {
                this.error(this.lang === 'tr' ? 'Ayar kaydedilemedi!' : 'Setting could not be saved!');
            }
            await this.pause();
            return this.showSettings();
        }

        if (trimmedChoice === '4') {
            // Toggle auto claim
            this.config.autoClaim = !this.config.autoClaim;
            if (this.saveConfig()) {
                const status = this.config.autoClaim ?
                    (this.lang === 'tr' ? 'Açıldı' : 'Enabled') :
                    (this.lang === 'tr' ? 'Kapatıldı' : 'Disabled');
                this.success(`${this.lang === 'tr' ? 'Başlangıçta Otomatik Topla' : 'Auto Claim on Startup'}: ${status}`);
            } else {
                this.error(this.lang === 'tr' ? 'Ayar kaydedilemedi!' : 'Setting could not be saved!');
            }
            await this.pause();
            return this.showSettings();
        }

        let newLang = this.lang;
        if (trimmedChoice === '1') {
            newLang = 'tr';
        } else if (trimmedChoice === '2') {
            newLang = 'en';
        } else {
            this.error('Geçersiz seçim! / Invalid choice!');
            await this.pause();
            return this.showSettings();
        }

        if (newLang !== this.lang) {
            const saved = this.saveLanguage(newLang);

            if (saved) {
                this.success(`Dil değiştirildi! / Language changed! (${langNames[newLang]})`);
                this.info('Değişikliklerin uygulanması için uygulama yeniden başlatılacak...');
                this.info('Application will restart to apply changes...');
                await this.pause();

                // Uygulamayı yeniden başlat
                process.exit(0);
            } else {
                this.error('Dil kaydedilemedi! / Language could not be saved!');
                await this.pause();
            }
        } else {
            this.info('Zaten bu dil seçili. / This language is already selected.');
            await this.pause();
        }
    }

    // Çıkış yap
    async logout() {
        console.clear();
        this.header(this.t.logout.title);

        const confirm = await this.question(this.t.logout.confirm + ' ');

        if (confirm.toLowerCase() === 'e' || confirm.toLowerCase() === 'y') {
            try {
                await this.bot.logout();
                this.isLoggedIn = false;
                this.success(this.t.logout.success);
            } catch (error) {
                this.error(`${this.t.logout.error}: ${error.message}`);
            }
        } else {
            this.info(this.t.logout.cancelled);
        }

        await this.pause();
    }

    // Programdan çık
    async exit() {
        console.clear();
        this.header(this.t.goodbye.title);
        this.info(this.t.goodbye.closing);

        if (this.bot.browser) {
            await this.bot.browser.close();
        }

        this.rl.close();
        process.exit(0);
    }

    // Devam etmek için bekle
    async pause() {
        console.log('');
        await this.question(this.t.general.pressEnter);
    }

    // Yeni oyun kontrolü
    async checkNewGames() {
        if (!this.config.checkNewGames) {
            return;
        }

        if (!this.isLoggedIn) {
            return;
        }

        try {
            this.info(this.lang === 'tr' ? 'Yeni oyunlar kontrol ediliyor...' : 'Checking for new games...');

            this.freeGames = await getFreeSteamGames();
            if (this.freeGames.length === 0) {
                return;
            }

            this.ownedGames = await this.bot.getOwnedGamesFull();
            const availableGames = this.freeGames.filter(game => {
                const isOwned = this.ownedGames.ids.includes(game.appId) ||
                    this.ownedGames.names.some(name =>
                        name.toLowerCase().includes(game.title.toLowerCase())
                    );
                return !isOwned;
            });

            if (availableGames.length > 0) {
                console.log('');
                this.success(`🎮 ${availableGames.length} ${this.lang === 'tr' ? 'yeni ücretsiz oyun bulundu!' : 'new free games found!'}`);
                console.log('');
                availableGames.slice(0, 5).forEach((game, index) => {
                    console.log(`${colors.bright}${index + 1}.${colors.reset} ${game.title}`);
                });
                if (availableGames.length > 5) {
                    console.log(`${colors.dim}   ... ve ${availableGames.length - 5} tane daha${colors.reset}`);
                }
                console.log('');
                this.info(this.lang === 'tr' ? 'Listeyi görmek için menüden "Ücretsiz Oyunları Listele" seçin.' : 'Select "List Free Games" from menu to see the list.');
            } else {
                this.info(this.lang === 'tr' ? 'Yeni ücretsiz oyun yok.' : 'No new free games.');
            }

            // Kullanıcının sonucu görmesi için bekle
            await this.pause();
        } catch (error) {
            console.error('[Check New Games] Error:', error.message);
            await this.pause();
        }
    }

    // Uygulamayı başlat
    async start() {
        // Terminal başlığını ayarla
        process.stdout.write(`\x1b]0;${this.t.appTitle}\x07`);

        console.clear();

        // Banner - dil ayarına göre
        const title = this.t.appTitle;
        const padding = Math.floor((51 - title.length) / 2);
        const titleLine = '║' + ' '.repeat(padding) + title + ' '.repeat(51 - padding - title.length) + '║';

        console.log(colors.cyan + colors.bright);
        console.log('╔═══════════════════════════════════════════════════╗');
        console.log('║                                                   ║');
        console.log(titleLine);
        console.log('║                                                   ║');
        console.log('╚═══════════════════════════════════════════════════╝');
        console.log(colors.reset);

        this.info(this.t.general.botStarting);

        try {
            await this.bot.init(true);
            this.success(this.t.general.botReady + '\n');

            // Otomatik giriş kontrolü
            this.info(this.t.general.checkingLogin);
            this.isLoggedIn = this.bot.checkLoginSimple();

            if (this.isLoggedIn) {
                this.success(this.t.general.autoLoginSuccess + '\n');

                if (this.config.autoClaim) {
                    this.info(this.lang === 'tr' ? 'Otomatik toplama başlatılıyor...' : 'Starting auto-claim routine...');
                    await this.claimAllFreeGames(true);
                } else if (this.config.checkNewGames) {
                    // Yeni oyun kontrolü yap (sadece autoClaim kapalıysa)
                    await this.checkNewGames();
                }
            } else {
                this.warning(this.t.general.notLoggedIn + '\n');
            }

            // Direkt menüye geç
            await this.showMainMenu();
        } catch (error) {
            this.error(`${this.t.general.startupError}: ${error.message}`);
            await this.pause();
            process.exit(1);
        }
    }
}

// Programı başlat
const cli = new SteamCLI();
cli.start().catch(error => {
    console.error(`${colors.red}Kritik hata: ${error.message}${colors.reset}`);
    process.exit(1);
});
