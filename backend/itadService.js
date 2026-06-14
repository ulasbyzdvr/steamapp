const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const API_KEY = process.env.ITAD_API_KEY;
const COUNTRY = process.env.ITAD_COUNTRY || 'TR';
const BASE_URL = 'https://api.isthereanydeal.com';

async function getGameInfo(gameId) {
    try {
        const response = await axios.get(`${BASE_URL}/games/info/v2`, {
            params: {
                key: API_KEY,
                id: gameId
            }
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching info for ${gameId}:`, error.message);
        return null;
    }
}

async function getFreeSteamGames() {
    if (!API_KEY) {
        console.error('HATA: ITAD_API_KEY bulunamadı. Lütfen .env dosyasını yapılandırın.');
        console.log('API Key almak için: https://isthereanydeal.com/apps/my/');
        return [];
    }

    try {
        // IsThereAnyDeal API'den ücretsiz oyunlar getiriliyor

        // Deals v2 Endpoint
        const response = await axios.get(`${BASE_URL}/deals/v2`, {
            params: {
                key: API_KEY,
                shops: '61', // Steam
                sort: '-cut', // En yüksek indirim
                limit: 50,
                country: COUNTRY
            }
        });

        const deals = response.data.list;
        const freeGames = [];

        // Önce %100 indirimi olanları filtrele
        const freeDealIds = [];
        for (const item of deals) {
            const deal = item.deal;
            if (deal && deal.cut >= 100) {
                freeDealIds.push({
                    id: item.id,
                    title: item.title,
                    url: deal.url,
                    expiry: deal.expiry // Bitiş tarihi
                });
            }
        }

        // %100 indirimli oyunlar bulundu

        // Şimdi her oyun için detaylı bilgi al (batch olarak)
        const chunkSize = 10; // API rate limit için
        for (let i = 0; i < freeDealIds.length; i += chunkSize) {
            const chunk = freeDealIds.slice(i, i + chunkSize);

            const infoPromises = chunk.map(game => getGameInfo(game.id));
            const infos = await Promise.all(infoPromises);

            for (let j = 0; j < chunk.length; j++) {
                const info = infos[j];
                const deal = chunk[j];

                if (info) {
                    const gameData = {
                        id: info.id,
                        slug: info.slug,
                        title: info.title || deal.title,
                        // Steam URL'sini kullan (appId varsa)
                        url: info.appid
                            ? `https://store.steampowered.com/app/${info.appid}/`
                            : deal.url,
                        shop: 'Steam',
                        appId: info.appid || null,

                        // Images
                        image: info.assets?.banner600 ||
                            info.assets?.banner400 ||
                            info.assets?.banner300 ||
                            info.assets?.boxart ||
                            null,

                        // Additional info
                        tags: info.tags?.slice(0, 5) || [], // İlk 5 tag
                        releaseDate: info.releaseDate || null,

                        // Reviews (en yüksek score)
                        score: info.reviews?.length > 0
                            ? Math.max(...info.reviews.map(r => r.score))
                            : null,

                        // Meta info
                        earlyAccess: info.earlyAccess || false,
                        achievements: info.achievements || false,
                        tradingCards: info.tradingCards || false,
                        expiry: deal.expiry // Deal'dan gelen bitiş tarihi
                    };

                    freeGames.push(gameData);
                } else {
                    // Fallback: info alınamazsa basic bilgi
                    freeGames.push({
                        id: deal.id,
                        title: deal.title,
                        url: deal.url,
                        expiry: deal.expiry, // Bitiş tarihi
                        shop: 'Steam',
                        appId: null,
                        image: null,
                        tags: [],
                        score: null
                    });
                }
            }

            // Rate limiting için kısa bekleme
            if (i + chunkSize < freeDealIds.length) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        // Oyunlar hazır
        return freeGames;

    } catch (error) {
        console.error('ITAD API Hatası:', error.response ? error.response.data : error.message);
        return [];
    }
}

module.exports = { getFreeSteamGames };
