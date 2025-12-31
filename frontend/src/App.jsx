import React, { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import GameCard from './components/GameCard'
import ClaimProgressModal from './components/ClaimProgressModal'
import ConfirmDialog from './components/ConfirmDialog'
import SettingsModal from './components/SettingsModal'
import GameDetailModal from './components/GameDetailModal'
import { translations } from './translations'
import './App.css'

const API_BASE = 'http://localhost:3001/api'

function App() {
  // Core States
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [selectedGames, setSelectedGames] = useState([])
  const [statusMsg, setStatusMsg] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  // UI States
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all') // 'all', 'owned', 'available'
  const [sortBy, setSortBy] = useState('name') // 'name', 'shop'
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [steamUsername, setSteamUsername] = useState(null)
  const [steamAvatar, setSteamAvatar] = useState(null)
  const [language, setLanguage] = useState(localStorage.getItem('app_lang') || 'tr')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmDialogData, setConfirmDialogData] = useState({ title: '', message: '', onConfirm: null })
  const [selectedGameDetail, setSelectedGameDetail] = useState(null)

  // Translation helper
  const t = (key, params = {}) => {
    let text = translations[language][key] || key;
    Object.keys(params).forEach(p => {
      text = text.replace(`{${p}}`, params[p]);
    });
    return text;
  };

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('app_lang', lang);
  };

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    try {
      const res = await axios.get(`${API_BASE}/status`)
      const isLogged = res.data.isLoggedIn;
      const status = res.data.loginStatus;
      const username = res.data.username;
      const avatar = res.data.avatarUrl;

      console.log('[Initial Check]', { isLogged, status, username, avatar });

      setLoggedIn(isLogged)
      setSteamUsername(username)
      setSteamAvatar(avatar)

      if (isLogged) {
        fetchGames(true);
      } else {
        fetchGames(false);
      }
    } catch (err) {
      console.error('[Check Status Error]', err)
    }
  }

  const login = async () => {
    setLoading(true);
    setStatusMsg(t('login_opening'));

    try {
      await axios.post(`${API_BASE}/login`);

      let pollCount = 0;
      const MAX_POLLS = 150; // 5 minutes (150 * 2 seconds = 300s)

      const pollInterval = setInterval(async () => {
        try {
          pollCount++;

          // Timeout protection (5 minutes)
          if (pollCount > MAX_POLLS) {
            clearInterval(pollInterval);
            setStatusMsg(language === 'tr' ? '❌ Giriş zaman aşımına uğradı.' : '❌ Login timed out.');
            setLoading(false);
            return;
          }

          const res = await axios.get(`${API_BASE}/status`);
          const status = res.data.loginStatus;
          const isLoggedIn = res.data.isLoggedIn;

          console.log('[Login Poll]', { isLoggedIn, status, pollCount });

          if (isLoggedIn && status === 'logged_in') {
            clearInterval(pollInterval);
            setStatusMsg(t('login_success'));
            setLoading(false);
            setLoggedIn(true);
            setSteamUsername(res.data.username);
            setSteamAvatar(res.data.avatarUrl);
            fetchGames(true);

            // Clear message after 3 seconds
            setTimeout(() => {
              setStatusMsg('');
            }, 3000);
          } else if (status === 'failed') {
            clearInterval(pollInterval);
            setStatusMsg(t('login_failed'));
            setLoading(false);
          } else if (status === 'cancelled') {
            // User closed the login window
            clearInterval(pollInterval);
            setStatusMsg(language === 'tr' ? '❌ Giriş iptal edildi.' : '❌ Login cancelled.');
            setLoading(false);

            setTimeout(() => {
              setStatusMsg('');
            }, 3000);
          }
        } catch (e) {
          console.error('[Login Poll Error]', e);
        }
      }, 2000);

    } catch (err) {
      console.error(err)
      setStatusMsg(t('login_failed'))
      setLoading(false);
    }
  }

  const logout = async () => {
    try {
      setStatusMsg('🚪 Logging out...');
      await axios.post(`${API_BASE}/logout`);

      setLoggedIn(false);
      setGames([]);
      setSelectedGames([]);
      setStatusMsg('✅ Logged out successfully!');

      setTimeout(() => {
        setStatusMsg('');
        fetchGames(false); // Fetch games without login
      }, 2000);
    } catch (err) {
      console.error(err);
      setStatusMsg('❌ Logout failed.');
    }
  }

  const fetchGames = async (isLoggedOverride = null) => {
    setLoading(true)
    const isLogged = isLoggedOverride !== null ? isLoggedOverride : loggedIn;

    try {
      const [resGames, resOwned] = await Promise.all([
        axios.get(`${API_BASE}/games`),
        isLogged ? axios.get(`${API_BASE}/owned`) : Promise.resolve({ data: { ids: [], names: [] } })
      ]);

      const fetchedGames = resGames.data;
      const library = resOwned.data;

      console.log('[fetchGames] Owned library:', {
        idsCount: library.ids?.length || 0,
        namesCount: library.names?.length || 0,
        isLogged,
        sampleIds: library.ids?.slice(0, 3),
        sampleNames: library.names?.slice(0, 3)
      });

      const ownedIds = library.ids || [];
      const ownedNames = library.names || [];

      const ownedNamesNorm = ownedNames.map(t =>
        t.toLowerCase().replace(/[^a-z0-9]/g, '')
      );

      const getAppId = (url) => {
        const match = url.match(/\/app\/(\d+)/);
        if (match) return parseInt(match[1]);
        return null;
      };

      const processedGames = fetchedGames.map(game => {
        const gameTitleNorm = game.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        const appId = getAppId(game.url);

        let isOwned = false;

        if (appId && ownedIds.includes(appId)) {
          isOwned = true;
          console.log('[Owned by appId]', game.title, appId);
        } else if (ownedNamesNorm.length > 0) {
          const matchedIndex = ownedNamesNorm.findIndex(owned =>
            owned === gameTitleNorm ||
            (owned.length > 5 && gameTitleNorm.includes(owned)) ||
            (gameTitleNorm.length > 5 && owned.includes(gameTitleNorm))
          );

          if (matchedIndex !== -1) {
            isOwned = true;
            console.log('[Owned by name]', game.title, 'matched with', ownedNames[matchedIndex]);
          }
        }

        return { ...game, isOwned, appId };
      });

      const ownedCount = processedGames.filter(g => g.isOwned).length;
      console.log('[fetchGames] Total games:', processedGames.length, 'Owned:', ownedCount);

      setGames(processedGames);
    } catch (err) {
      console.error(err)
      setStatusMsg('❌ Failed to fetch games')
    } finally {
      setLoading(false)
    }
  }

  const toggleSelect = (game) => {
    if (game.isOwned) return;

    if (selectedGames.find(g => g.title === game.title)) {
      setSelectedGames(selectedGames.filter(g => g.title !== game.title))
    } else {
      setSelectedGames([...selectedGames, game])
    }
  }

  const claimGames = async () => {
    if (selectedGames.length === 0) return

    setShowProgressModal(true)

    try {
      await axios.post(`${API_BASE}/claim`, { games: selectedGames })
      // Modal will auto-update via polling
    } catch (err) {
      console.error(err)
      setStatusMsg('❌ Error starting claim process')
      setShowProgressModal(false)
    }
  }

  const claimAllAvailable = async () => {
    const availableGames = games.filter(g => !g.isOwned);

    if (availableGames.length === 0) {
      setStatusMsg('❌ No available games to claim!');
      return;
    }

    // Show custom confirm dialog
    setConfirmDialogData({
      title: language === 'tr' ? 'Tüm Oyunları Al' : 'Claim All Games',
      message: language === 'tr'
        ? `${availableGames.length} oyunu kütüphanenize eklemek istediğinizden emin misiniz?\n\nBu işlem birkaç dakika sürebilir.`
        : `Are you sure you want to claim ALL ${availableGames.length} available games?\n\nThis may take several minutes.`,
      onConfirm: () => {
        setShowProgressModal(true);
        axios.post(`${API_BASE}/claim`, { games: availableGames })
          .catch(err => {
            console.error(err);
            setStatusMsg('❌ Error starting claim process');
            setShowProgressModal(false);
          });
      }
    });
    setShowConfirmDialog(true);
  }

  // Computed Values with useMemo
  const filteredAndSortedGames = useMemo(() => {
    let result = [...games];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(game =>
        game.title.toLowerCase().includes(query) ||
        game.shop.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterStatus === 'owned') {
      result = result.filter(game => game.isOwned);
    } else if (filterStatus === 'available') {
      result = result.filter(game => !game.isOwned);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'name') {
        return a.title.localeCompare(b.title);
      } else if (sortBy === 'score') {
        return (b.score || 0) - (a.score || 0);
      }
      return 0;
    });

    return result;
  }, [games, searchQuery, filterStatus, sortBy]);

  // Stats
  const stats = useMemo(() => {
    const total = games.length;
    const owned = games.filter(g => g.isOwned).length;
    const available = total - owned;
    const selected = selectedGames.length;

    return { total, owned, available, selected };
  }, [games, selectedGames]);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-top">
          <h1 className="app-title">
            {t('app_title')}
          </h1>
          <div className="header-actions">

            {/* Settings Button */}
            <button
              onClick={() => setShowSettingsModal(true)}
              className="settings-button"
              title={t('settings')}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                marginRight: '8px',
                fontSize: '18px',
                color: '#94a3b8',
                transition: 'all 0.2s'
              }}
            >
              ⚙️
            </button>

            {/* Logged in actions moved to Settings */}

            <button
              onClick={() => {
                setRefreshing(true);
                fetchGames().finally(() => setRefreshing(false));
              }}
              className="refresh-button"
              disabled={loading || refreshing}
              title={t('refresh')}
            >
              {refreshing ? '...' : t('refresh')}
            </button>

            {loggedIn && stats.available > 0 && (
              <button
                onClick={claimAllAvailable}
                className="claim-all-button"
                disabled={loading}
                title={t('claim_all', { count: stats.available })}
              >
                {t('claim_all', { count: stats.available })}
              </button>
            )}

            {/* Logged in actions moved to Settings */}
            {!loggedIn && (
              <button onClick={login} className="connect-button">
                {t('connect_steam')}
              </button>
            )}
          </div>
        </div>



        {/* Controls */}
        <div className="controls-section">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder={t('search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <button
              className={`filter-button ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              {t('filter_all')}
            </button>
            <button
              className={`filter-button ${filterStatus === 'available' ? 'active' : ''}`}
              onClick={() => setFilterStatus('available')}
            >
              {t('filter_available')}
            </button>
            <button
              className={`filter-button ${filterStatus === 'owned' ? 'active' : ''}`}
              onClick={() => setFilterStatus('owned')}
            >
              {t('filter_owned')}
            </button>
          </div>

          <div className="filter-group">
            <button
              className={`filter-button ${sortBy === 'name' ? 'active' : ''}`}
              onClick={() => setSortBy('name')}
            >
              {t('sort_name')}
            </button>
            <button
              className={`filter-button ${sortBy === 'score' ? 'active' : ''}`}
              onClick={() => setSortBy('score')}
            >
              {t('sort_score')}
            </button>
          </div>
        </div>
      </header>

      {statusMsg && (
        <div className="status-message">
          {statusMsg}
        </div>
      )}

      {!loggedIn && games.length > 0 && (
        <div className="info-message">
          {t('auto_claim_info')}
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div>{t('loading_games')}</div>
        </div>
      ) : (
        <>
          <div className="games-grid">
            {filteredAndSortedGames.map((game, idx) => (
              <GameCard
                key={idx}
                game={game}
                selected={!!selectedGames.find(g => g.title === game.title)}
                onToggle={() => toggleSelect(game)}
                onDetailClick={() => setSelectedGameDetail(game)}
                loggedIn={loggedIn}
                language={language}
                t={t}
              />
            ))}
          </div>

          {!loggedIn && games.length === 0 && (
            <div className="empty-message">
              {t('empty_login_info')}
            </div>
          )}

          {filteredAndSortedGames.length === 0 && games.length > 0 && (
            <div className="empty-message">
              🔍 {language === 'tr' ? 'Aramanıza uygun oyun bulunamadı.' : 'No games found matching your filters.'}
            </div>
          )}

          {loggedIn && selectedGames.length > 0 && (
            <div className="claim-button-container">
              <button onClick={claimGames} className="claim-button claim-button-pulse">
                {t('claim_selected', { count: selectedGames.length })}
              </button>
            </div>
          )}
        </>
      )}


      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={confirmDialogData.onConfirm}
        title={confirmDialogData.title}
        message={confirmDialogData.message}
        confirmText={language === 'tr' ? 'Onayla' : 'Confirm'}
        cancelText={language === 'tr' ? 'İptal' : 'Cancel'}
      />

      {/* Progress Modal */}
      <ClaimProgressModal
        isOpen={showProgressModal}
        language={language}
        onClose={async () => {
          setShowProgressModal(false);
          setSelectedGames([]); // Clear selection first

          // Wait a bit before fetching (Puppeteer might still be busy)
          setTimeout(async () => {
            try {
              await fetchGames();
            } catch (err) {
              console.error('Fetch games after claim error:', err);
              setStatusMsg(language === 'tr'
                ? '⚠️ Oyunlar yüklenemedi. Yenile butonuna basın.'
                : '⚠️ Failed to load games. Click Refresh.'
              );
            }
          }, 1500); // 1.5 second delay
        }}
      />

      {/* Game Detail Modal */}
      <GameDetailModal
        isOpen={!!selectedGameDetail}
        onClose={() => setSelectedGameDetail(null)}
        game={selectedGameDetail}
        t={t}
        language={language}
        onClaim={(game) => {
          setSelectedGames([game]);
          claimGames();
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        t={t}
        steamUsername={steamUsername}
        steamAvatar={steamAvatar}
        logout={logout}
        loggedIn={loggedIn}
        language={language}
        changeLanguage={changeLanguage}
      />
    </div>
  )
}

export default App
