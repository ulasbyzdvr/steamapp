const express = require('express');
const cors = require('cors');
const { SteamBot } = require('./steamBot');
const { getFreeSteamGames } = require('./itadService');
require('dotenv').config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const bot = new SteamBot();

// Sunucu başladığında botu hazırla (tarayıcıyı aç)
bot.init().then(() => {
    console.log('Bot initialized.');
});

app.get('/api/status', async (req, res) => {
    try {
        // Eğer bot şu an login oluyorsa 'isLoggingIn' true dönsün
        const isLoggingIn = bot.loginStatus === 'waiting_for_user';

        // Eğer giriş sürecindeyse checkLogin yapma (sayfa meşgul)
        if (isLoggingIn) {
            return res.json({ isLoggedIn: false, loginStatus: bot.loginStatus });
        }

        const isLoggedIn = await bot.checkLogin();
        // Eğer bot successful dediyse statusu güncelle
        if (isLoggedIn) bot.loginStatus = 'logged_in';

        res.json({ isLoggedIn, loginStatus: bot.loginStatus });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    // Asenkron başlat, bekleme
    bot.login();
    res.json({ message: 'Login flow started', status: 'waiting_for_user' });
});

app.get('/api/games', async (req, res) => {
    try {
        const games = await getFreeSteamGames();
        res.json(games);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/owned', async (req, res) => {
    try {
        const data = await bot.getOwnedGamesFull();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/claim', async (req, res) => {
    const { games } = req.body; // Array of game objects
    if (!games || !Array.isArray(games)) {
        return res.status(400).json({ error: 'Games array is required' });
    }

    try {
        // Asenkron olarak başlat, istemciye hemen cevap dön (uzun sürebilir)
        // Gerçek uygulamada socket.io ile progress bildirilmeli.
        // Şimdilik basitçe işlemi sıraya alıyoruz.

        bot.processGames(games, (log) => {
            console.log('[Claim Log]', log);
        });

        res.json({ message: 'Claim process started', count: games.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
