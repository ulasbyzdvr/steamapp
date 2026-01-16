const { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// Backend dizinindeki modülleri yükle
const backendPath = path.join(__dirname, '../backend');
const express = require(path.join(backendPath, 'node_modules/express'));
const cors = require(path.join(backendPath, 'node_modules/cors'));
require(path.join(backendPath, 'node_modules/dotenv')).config({ path: path.join(backendPath, '.env') });

// Backend imports
const { SteamBot } = require(path.join(backendPath, 'steamBot'));
const { getFreeSteamGames } = require(path.join(backendPath, 'itadService'));

// Create bot instance
const steamBot = new SteamBot();

let mainWindow;
let tray;
let backendServer;
const isDev = process.env.NODE_ENV !== 'production';
const PORT = 3001;

// Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    console.log('[Electron] Another instance is already running. Quitting...');
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.
        console.log('[Electron] Second instance detected. Focusing main window...');
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            if (!mainWindow.isVisible()) mainWindow.show();
            mainWindow.focus();
        }
    });
}

// Global claim progress tracker
let claimProgress = {
    status: 'idle', // 'idle', 'running', 'complete'
    current: 0,
    total: 0,
    currentGame: null,
    results: []
};

// Express server setup
function startBackendServer() {
    const server = express();
    server.use(cors());
    server.use(express.json());

    // Steam Bot API Routes
    server.get('/api/status', async (req, res) => {
        try {
            // Use simple cookie check instead of full page load
            const isLoggedIn = steamBot.checkLoginSimple();
            const loginStatus = steamBot.getLoginStatus();

            // Update status based on cookie check
            if (isLoggedIn && loginStatus !== 'logged_in') {
                steamBot.loginStatus = 'logged_in';
            }

            // Get username and avatar if logged in
            let username = null;
            let avatarUrl = null;
            if (isLoggedIn) {
                try {
                    const userData = await steamBot.getSteamUsername();
                    username = userData.username;
                    avatarUrl = userData.avatarUrl;
                } catch (e) {
                    console.error('Username fetch error:', e);
                }
            }

            res.json({ isLoggedIn, loginStatus: steamBot.loginStatus, username, avatarUrl });
        } catch (err) {
            console.error('Status check error:', err);
            res.json({ isLoggedIn: false, loginStatus: 'unknown', username: null });
        }
    });

    server.post('/api/login', async (req, res) => {
        try {
            // CRITICAL: Set login status FIRST before opening window
            steamBot.loginStatus = 'waiting_for_user';
            console.log('[Login] Login initiated - status set to waiting_for_user');

            // CRITICAL: Ensure cookies.json is deleted before opening login window
            const fs = require('fs');
            const cookiesPath = path.join(__dirname, '../backend/cookies.json');

            if (fs.existsSync(cookiesPath)) {
                try {
                    fs.unlinkSync(cookiesPath);
                    console.log('[Login] Old cookies.json deleted before opening login window.');
                } catch (e) {
                    console.error('[Login] Error deleting old cookies:', e);
                }
            }

            // Create login modal window
            const loginWindow = new BrowserWindow({
                width: 800,
                height: 700,
                parent: mainWindow,
                modal: true,
                show: false,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true,
                    partition: 'login_partition' // Separate partition to ensure clean login
                },
                title: 'Steam Login',
                autoHideMenuBar: true
            });

            // Ensure complete clean slate - clear partition data
            await loginWindow.webContents.session.clearStorageData({
                storages: ['cookies', 'localstorage', 'indexdb', 'cachestorage', 'serviceworkers']
            });
            await loginWindow.webContents.session.clearCache();
            console.log('[Login] Login partition cleaned.');

            // Set normal browser user agent to bypass Cloudflare
            loginWindow.webContents.setUserAgent(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            );

            // Load Steam login page
            await loginWindow.loadURL('https://store.steampowered.com/login/');
            loginWindow.show();

            // Check for login success
            const checkLogin = setInterval(async () => {
                if (!loginWindow || loginWindow.isDestroyed()) {
                    clearInterval(checkLogin);
                    return;
                }

                try {
                    const cookies = await loginWindow.webContents.session.cookies.get({});
                    const steamLoginSecure = cookies.find(c => c.name === 'steamLoginSecure');

                    if (steamLoginSecure) {
                        clearInterval(checkLogin);

                        console.log('[Login Modal] Login detected! Cookies:', cookies.length);

                        // Extract username from login window IMMEDIATELY
                        try {
                            const username = await loginWindow.webContents.executeJavaScript(`
                                (() => {
                                    // Try account dropdown
                                    const accountDropdown = document.querySelector('#account_pulldown');
                                    if (accountDropdown) {
                                        const accountName = accountDropdown.textContent.trim();
                                        if (accountName) return accountName;
                                    }
                                    
                                    // Try account menu username
                                    const menuUsername = document.querySelector('.persona_name');
                                    if (menuUsername) return menuUsername.textContent.trim();
                                    
                                    // Try header username
                                    const headerUsername = document.querySelector('.username');
                                    if (headerUsername) return headerUsername.textContent.trim();
                                    
                                    return null;
                                })()
                            `);

                            if (username) {
                                console.log('[Login Modal] Username extracted from login window:', username);
                                steamBot.cachedUsername = username; // Cache immediately!
                            }
                        } catch (e) {
                            console.error('[Login Modal] Failed to extract username from window:', e);
                        }

                        // Save cookies to file for Puppeteer
                        const fs = require('fs');
                        const cookiesPath = path.join(__dirname, '../backend/cookies.json');

                        // Ensure directory exists
                        const dir = path.dirname(cookiesPath);
                        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

                        console.log('[Login Modal] Saving cookies to:', cookiesPath);
                        fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
                        console.log('[Login Modal] Cookies saved successfully!');

                        // Notify steamBot
                        steamBot.loginStatus = 'logged_in';

                        // Restart bot with new cookies AND fetch username
                        (async () => {
                            try {
                                await steamBot.restartBrowser(true);
                                console.log('[Login] Browser restarted, fetching user data...');
                                const { username, avatarUrl } = await steamBot.getSteamUsername();
                                console.log('[Login] ✅ User data fetched:', { username, avatar: !!avatarUrl });
                            } catch (e) {
                                console.error('[Login] Error during restart/fetch:', e.message);
                            }
                        })();

                        // Close login window
                        loginWindow.close();

                        console.log('[Login] Success! Cookies saved, username will be fetched...');
                    }
                } catch (e) {
                    console.error('Cookie check error:', e);
                }
            }, 1000);

            // Handle window close (user cancelled login)
            loginWindow.on('closed', () => {
                clearInterval(checkLogin);

                // If user closed window without logging in, mark as cancelled
                if (steamBot.loginStatus === 'waiting_for_user') {
                    console.log('[Login] Window closed by user - login cancelled');
                    steamBot.loginStatus = 'cancelled';
                }
            });

            res.json({ success: true, message: 'Login window opened' });
        } catch (err) {
            console.error('Login error:', err);
            steamBot.loginStatus = 'failed'; // Mark as failed if window couldn't open
            res.status(500).json({ success: false, error: err.message });
        }
    });

    server.post('/api/logout', async (req, res) => {
        try {
            console.log('[API] Logout requested. Clearing ALL session data...');

            // 1. Clear main window session (cookies, storage, etc.)
            const mainSession = mainWindow.webContents.session;
            await mainSession.clearStorageData({
                storages: ['cookies', 'localstorage', 'indexdb', 'cachestorage']
            });
            console.log('[API] Main session cleared.');

            // 2. CRITICAL: Clear login_partition session (fixes auto-login bug in production)
            const { session } = require('electron');
            const loginPartitionSession = session.fromPartition('login_partition');
            await loginPartitionSession.clearStorageData({
                storages: ['cookies', 'localstorage', 'indexdb', 'cachestorage']
            });
            await loginPartitionSession.clearCache();
            console.log('[API] Login partition session cleared.');

            // 3. Clear Puppeteer cookies file
            await steamBot.logout();

            console.log('[API] ✅ Complete logout successful - all sessions cleared!');
            res.json({ success: true, message: 'Logged out successfully' });
        } catch (err) {
            console.error('Logout error:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    server.get('/api/games', async (req, res) => {
        try {
            const games = await getFreeSteamGames();
            res.json(games);
        } catch (err) {
            console.error('Get games error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    server.get('/api/owned', async (req, res) => {
        try {
            console.log('[API] /owned endpoint called');
            const library = await steamBot.getOwnedGamesFull();
            console.log('[API] Library data:', {
                idsCount: library.ids.length,
                namesCount: library.names.length,
                sampleIds: library.ids.slice(0, 5),
                sampleNames: library.names.slice(0, 5)
            });
            res.json(library);
        } catch (err) {
            console.error('Get owned games error:', err);
            res.status(500).json({ ids: [], names: [] });
        }
    });

    server.post('/api/claim', async (req, res) => {
        try {
            const { games } = req.body;
            console.log(`[API] Claiming ${games.length} games...`);

            // Reset progress
            claimProgress = {
                status: 'running',
                current: 0,
                total: games.length,
                currentGame: null,
                results: []
            };

            // Start claiming process asynchronously
            steamBot.processGames(games, (progressData) => {
                if (progressData.type === 'progress') {
                    claimProgress.status = 'running';
                    claimProgress.current = progressData.current;
                    claimProgress.currentGame = progressData.game;
                } else if (progressData.type === 'result') {
                    claimProgress.results.push({
                        game: progressData.game,
                        status: progressData.status,
                        message: progressData.message
                    });
                } else if (progressData.type === 'complete') {
                    claimProgress.status = 'complete';
                }

                console.log('[Claim Progress]', progressData);
            }).catch(err => {
                console.error('Claim games error:', err);
                claimProgress.status = 'error';
                claimProgress.error = err.message;
            });

            res.json({ success: true, message: 'Claiming started', total: games.length });
        } catch (err) {
            console.error('Claim API error:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // Progress endpoint
    server.get('/api/claim/progress', (req, res) => {
        res.json(claimProgress);
    });

    backendServer = server.listen(PORT, () => {
        console.log(`[Backend] Server running on http://localhost:${PORT}`);
        // Initialize steam bot
        steamBot.init().then(() => {
            console.log('[Backend] Steam bot initialized');
        }).catch(err => {
            console.error('[Backend] Steam bot init error:', err);
        });
    });
}

// Create main window
function createWindow() {
    const config = loadConfig();
    const startMinimized = config.startMinimized || false;

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        icon: path.join(__dirname, 'icon.ico'),
        show: !startMinimized,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        autoHideMenuBar: true,
        backgroundColor: '#0f172a',
    });

    // Load app
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../frontend/dist/index.html'));
    }

    // Window event handlers
    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();

            // Show notification on first minimize
            if (!mainWindow.minimizeNotificationShown) {
                const notification = {
                    title: 'Steam Free Games',
                    body: 'Uygulama arka planda çalışmaya devam ediyor. Sistem tray\'den erişebilirsiniz.'
                };
                mainWindow.webContents.send('show-notification', notification);
                mainWindow.minimizeNotificationShown = true;
            }
        }
    });

    // Handle external links (Steam store pages)
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        // Steam store links'i yeni pencerede aç
        if (url.includes('steampowered.com') || url.includes('store.steam')) {
            return {
                action: 'allow',
                overrideBrowserWindowOptions: {
                    width: 1400,
                    height: 900,
                    webPreferences: {
                        nodeIntegration: false,
                        contextIsolation: true
                    },
                    autoHideMenuBar: true,
                    title: 'Steam Store'
                }
            };
        }
        // Diğer external link'leri sistem tarayıcısında aç
        shell.openExternal(url);
        return { action: 'deny' };
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // If started minimized, notify user
    if (startMinimized) {
        mainWindow.once('ready-to-show', () => {
            // Check if notification already shown (though here it's startup)
            const notification = {
                title: 'Steam Free Games',
                body: 'Uygulama arka planda başlatıldı.'
            };
            // Notification might need renderer to be ready, but window is hidden.
            // We can try sending it when dom-ready.
            mainWindow.webContents.once('dom-ready', () => {
                mainWindow.webContents.send('show-notification', notification);
            });
        });
    }
}

// Create system tray
// Create system tray
function createTray() {
    const iconPath = path.join(__dirname, 'tray-icon.ico');
    const trayIcon = nativeImage.createFromPath(iconPath);

    tray = new Tray(trayIcon.resize({ width: 16, height: 16 }));

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Göster',
            click: () => {
                mainWindow.show();
            }
        },
        {
            label: 'Gizle',
            click: () => {
                mainWindow.hide();
            }
        },
        { type: 'separator' },
        {
            label: 'Oyunları Güncelle',
            click: () => {
                mainWindow.webContents.send('refresh-games');
            }
        },
        { type: 'separator' },
        {
            label: 'Çıkış',
            click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip('Steam Free Games');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow.show();
        }
    });
}

// Application menu
function createMenu() {
    const template = [
        {
            label: 'Dosya',
            submenu: [
                {
                    label: 'Oyunları Güncelle',
                    accelerator: 'F5',
                    click: () => {
                        mainWindow.webContents.send('refresh-games');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Gizle',
                    accelerator: 'Ctrl+H',
                    click: () => {
                        mainWindow.hide();
                    }
                },
                { type: 'separator' },
                {
                    label: 'Çıkış',
                    accelerator: 'Alt+F4',
                    click: () => {
                        app.isQuitting = true;
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'Görünüm',
            submenu: [
                { role: 'reload', label: 'Yeniden Yükle' },
                { role: 'forceReload', label: 'Zorla Yeniden Yükle' },
                { type: 'separator' },
                { role: 'toggleDevTools', label: 'Geliştirici Araçları' },
                { type: 'separator' },
                { role: 'resetZoom', label: 'Yakınlaştırmayı Sıfırla' },
                { role: 'zoomIn', label: 'Yakınlaştır' },
                { role: 'zoomOut', label: 'Uzaklaştır' },
                { type: 'separator' },
                { role: 'togglefullscreen', label: 'Tam Ekran' }
            ]
        },
        {
            label: 'Yardım',
            submenu: [
                {
                    label: 'Hakkında',
                    click: () => {
                        const { dialog } = require('electron');
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'Hakkında',
                            message: 'Steam Free Games',
                            detail: 'Version: 1.0.0\n\nSteam\'deki ücretsiz oyunları takip edin ve otomatik olarak kütüphanenize ekleyin.',
                        });
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// App ready
app.whenReady().then(() => {
    if (!gotTheLock) return;
    startBackendServer();
    createWindow();
    createTray();
    createMenu();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        } else {
            mainWindow.show();
        }
    });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Cleanup before quit
app.on('before-quit', async () => {
    if (backendServer) {
        backendServer.close();
    }

    // Close Steam bot browser
    try {
        await steamBot.close();
    } catch (err) {
        console.error('Error closing Steam bot:', err);
    }
});

// --- Config & Auto-Claim Logic ---
const configPath = path.join(app.getPath('userData'), 'config.json');

function loadConfig() {
    try {
        if (fs.existsSync(configPath)) {
            return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        }
    } catch (e) {
        console.error('Error loading config:', e);
    }
    return { autoClaim: false, scheduledClaim: false, claimTime: "12:00", startMinimized: false, notifications: true, checkNewGames: false };
}

function saveConfig(config) {
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    } catch (e) {
        console.error('Error saving config:', e);
    }
}

let schedulerInterval;

function setupScheduler() {
    if (schedulerInterval) clearInterval(schedulerInterval);

    console.log('[Scheduler] Initialized.');

    schedulerInterval = setInterval(() => {
        const config = loadConfig();

        if (!config.scheduledClaim) return;

        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        if (currentTime === config.claimTime) {
            console.log(`[Scheduler] Time match (${currentTime})! Triggering auto-claim...`);
            runAutoClaimRoutine(true); // Force run regardless of startup setting

            // Wait a minute to avoid double trigger
            clearInterval(schedulerInterval);
            setTimeout(() => {
                setupScheduler();
            }, 61000);
        }
    }, 10000); // Check every 10 seconds
}

// Check for new free games (notification only, no auto-claim)
async function checkNewGamesRoutine() {
    console.log('[Check New Games] Checking for new games...');
    const config = loadConfig();

    if (!config.checkNewGames) {
        console.log('[Check New Games] Disabled.');
        return;
    }

    // Wait for backend/bot init
    await new Promise(r => setTimeout(r, 5000));

    if (!steamBot.checkLoginSimple()) {
        console.log('[Check New Games] Not logged in.');
        return;
    }

    try {
        const freeGames = await getFreeSteamGames();
        if (freeGames.length === 0) {
            console.log('[Check New Games] No free games found.');
            return;
        }

        const ownedLibrary = await steamBot.getOwnedGameTitles();
        const ownedIds = ownedLibrary.ids || [];
        const ownedNames = (ownedLibrary.names || []).map(n => n.toLowerCase().replace(/[^a-z0-9]/g, ''));

        const availableGames = freeGames.filter(game => {
            // First check isOwned flag from API
            if (game.isOwned) return false;

            const appId = (game.url.match(/\/app\/(\d+)/) || [])[1];
            const titleNorm = game.title.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (appId && ownedIds.includes(parseInt(appId))) return false;
            if (ownedNames.some(owned => owned === titleNorm)) return false;
            return true;
        });

        if (availableGames.length > 0) {
            console.log(`[Check New Games] Found ${availableGames.length} new games`);

            // Show notification with game names
            const gameNames = availableGames.slice(0, 3).map(g => g.title).join(', ');
            const moreGames = availableGames.length > 3 ? ` (+${availableGames.length - 3} daha)` : '';

            if (tray && config.notifications) {
                tray.displayBalloon({
                    title: `🎮 ${availableGames.length} Yeni Ücretsiz Oyun!`,
                    content: `${gameNames}${moreGames}\n\nUygulamayı açıp toplamak için tıklayın.`,
                    iconType: 'info'
                });
            }

            // Also send to renderer if window is open
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('new-games-found', {
                    count: availableGames.length,
                    games: availableGames
                });
            }
        } else {
            console.log('[Check New Games] No new games (all owned).');
            if (tray && config.notifications) {
                tray.displayBalloon({
                    title: 'Steam Free Games',
                    content: 'Yeni ücretsiz oyun yok. Tüm oyunlar zaten kütüphanenizde!',
                    iconType: 'info'
                });
            }
        }
    } catch (err) {
        console.error('[Check New Games] Error:', err);
    }
}

async function runAutoClaimRoutine(force = false) {
    console.log('[Auto-Claim] Checking settings...');
    const config = loadConfig();

    if (!config.autoClaim && !force) {
        console.log('[Auto-Claim] Disabled.');
        return;
    }

    // Wait for backend/bot init
    await new Promise(r => setTimeout(r, 5000));

    if (!steamBot.checkLoginSimple()) {
        console.log('[Auto-Claim] Not logged in.');
        return;
    }

    if (tray && config.notifications) tray.displayBalloon({ title: 'Steam Free Games', content: 'Otomatik oyun kontrolü yapılıyor...', iconType: 'info' });

    try {
        const freeGames = await getFreeSteamGames();
        if (freeGames.length === 0) return;

        const ownedLibrary = await steamBot.getOwnedGameTitles();
        const ownedIds = ownedLibrary.ids || [];
        const ownedNames = (ownedLibrary.names || []).map(n => n.toLowerCase().replace(/[^a-z0-9]/g, ''));

        const availableGames = freeGames.filter(game => {
            // First check isOwned flag from API
            if (game.isOwned) return false;

            const appId = (game.url.match(/\/app\/(\d+)/) || [])[1];
            const titleNorm = game.title.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (appId && ownedIds.includes(parseInt(appId))) return false;
            if (ownedNames.some(owned => owned === titleNorm)) return false;
            return true;
        });

        if (availableGames.length > 0) {
            if (tray && config.notifications) tray.displayBalloon({ title: 'Steam Free Games', content: `${availableGames.length} yeni oyun bulundu. Toplanıyor...`, iconType: 'info' });

            await steamBot.processGames(availableGames, (data) => {
                if (data.type === 'progress') {
                    claimProgress = { status: 'running', current: data.current, total: data.total, currentGame: data.game, results: claimProgress.results || [] };
                } else if (data.type === 'result') {
                    claimProgress.results.push({ game: data.game, status: data.status, message: data.message });
                } else if (data.type === 'complete') {
                    claimProgress.status = 'complete';
                }
            });

            if (tray && config.notifications) tray.displayBalloon({ title: 'Steam Free Games', content: 'Otomatik toplama tamamlandı!', iconType: 'info' });
        } else {
            console.log('[Auto-Claim] All games owned.');
        }
    } catch (err) {
        console.error('[Auto-Claim] Error:', err);
    }
}

// IPC Handlers
ipcMain.handle('minimize-to-tray', () => mainWindow.hide());
ipcMain.handle('get-app-version', () => app.getVersion());

// Auto-Launch (Windows Startup)
ipcMain.handle('get-auto-launch-status', () => app.getLoginItemSettings().openAtLogin);
ipcMain.handle('toggle-auto-launch', (event, enable) => {
    app.setLoginItemSettings({ openAtLogin: enable, path: app.getPath('exe') });
    return app.getLoginItemSettings().openAtLogin;
});

// Start Minimized
ipcMain.handle('get-start-minimized-status', () => loadConfig().startMinimized || false);
ipcMain.handle('toggle-start-minimized', (event, enable) => {
    const config = loadConfig();
    config.startMinimized = enable;
    saveConfig(config);
    return config.startMinimized;
});

// Auto-Claim (In-App Logic)
ipcMain.handle('get-auto-claim-status', () => loadConfig().autoClaim);
ipcMain.handle('toggle-auto-claim', (event, enable) => {
    const config = loadConfig();
    config.autoClaim = enable;
    saveConfig(config);
    return config.autoClaim;
});

// Scheduled Claim
ipcMain.handle('get-scheduled-claim-settings', () => {
    const config = loadConfig();
    return { enabled: config.scheduledClaim || false, time: config.claimTime || "12:00" };
});

ipcMain.handle('save-scheduled-claim-settings', (event, { enabled, time }) => {
    const config = loadConfig();
    config.scheduledClaim = enabled;
    config.claimTime = time;
    saveConfig(config);
    return { success: true };
});

// Notifications
ipcMain.handle('get-notifications-status', () => {
    const config = loadConfig();
    return config.notifications !== undefined ? config.notifications : true;
});

ipcMain.handle('toggle-notifications', (event, enable) => {
    const config = loadConfig();
    config.notifications = enable;
    saveConfig(config);
    return config.notifications;
});

// Check New Games on Startup
ipcMain.handle('get-check-new-games-status', () => loadConfig().checkNewGames || false);
ipcMain.handle('toggle-check-new-games', (event, enable) => {
    const config = loadConfig();
    config.checkNewGames = enable;
    saveConfig(config);
    return config.checkNewGames;
});

// Run routines on startup
app.whenReady().then(() => {
    if (!gotTheLock) return;
    // Run auto-claim if enabled
    setTimeout(runAutoClaimRoutine, 3000);
    // Run new games check if enabled (slightly delayed to avoid conflict)
    setTimeout(checkNewGamesRoutine, 8000);
    setupScheduler();
});

console.log('[Electron] App started');
