// Çeviri sistemi
const translations = {
    tr: {
        // Ana Menü
        appTitle: '🎮 STEAM ÜCRETSİZ OYUN YÖNETİCİSİ - CLI',
        user: 'Kullanıcı',
        status: 'Durum',
        loggedIn: 'Giriş Yapıldı ✓',
        notLoggedIn: 'Giriş Yapılmadı ✗',
        yourChoice: 'Seçiminiz',

        // Menü Seçenekleri
        menu: {
            login: 'Steam\'e Giriş Yap',
            listGames: 'Ücretsiz Oyunları Listele',
            viewLibrary: 'Kütüphanemi Görüntüle',
            claimGames: 'Oyun Talep Et',
            claimAll: 'Tüm Ücretsiz Oyunları Talep Et',
            settings: '⚙️ Ayarlar',
            logout: 'Steam\'den Çıkış Yap',
            exit: 'Programdan Çık'
        },

        // Giriş
        login: {
            title: '🔐 STEAM GİRİŞİ',
            browserOpening: 'Tarayıcı penceresi açılacak...',
            pleaseLogin: 'Lütfen Steam hesabınızla giriş yapın.',
            mayTakeTime: 'Bu işlem birkaç dakika sürebilir.',
            success: 'Giriş başarılı!',
            failed: 'Giriş başarısız'
        },

        // Ücretsiz Oyunlar
        freeGames: {
            title: '🎁 ÜCRETSİZ OYUNLAR',
            fetching: 'Ücretsiz oyunlar getiriliyor...',
            found: 'ücretsiz oyun bulundu',
            notFound: 'Şu anda ücretsiz oyun bulunamadı.',
            checkingLibrary: 'Kütüphaneniz kontrol ediliyor...',
            owned: '[SAHİP]',
            new: '[YENİ]',
            endDate: 'Bitiş'
        },

        // Kütüphane
        library: {
            title: '📚 KÜTÜPHANEM',
            loading: 'Kütüphaneniz yükleniyor...',
            totalGames: 'Toplam',
            gamesFound: 'oyun bulundu.',
            recentGames: 'Son eklenen oyunlar:',
            andMore: '... ve',
            moreGames: 'oyun daha.',
            page: 'Sayfa',
            next: 'Sonraki',
            previous: 'Önceki',
            goBack: 'Geri Dön'
        },

        // Oyun Talep Et
        claim: {
            title: '🎯 OYUN TALEP ET',
            allOwned: 'Tüm ücretsiz oyunlar zaten kütüphanenizde!',
            available: 'Talep edilebilir',
            games: 'oyun',
            prompt: 'Talep etmek istediğiniz oyunların numaralarını girin (virgülle ayırın, 0=İptal)',
            cancelled: 'İşlem iptal edildi.',
            noValidSelection: 'Geçerli oyun seçilmedi!',
            claiming: 'oyun talep ediliyor...',
            processing: 'işleniyor...',
            claimedSuccessfully: 'Claimed successfully',
            alreadyOwned: 'Already owned',
            claimButtonNotFound: 'Claim button not found',
            completed: 'İşlem tamamlandı!'
        },

        // Tüm Oyunları Talep Et
        claimAll: {
            title: '🚀 TÜM OYUNLARI TALEP ET',
            newGames: 'yeni oyun talep edilecek.',
            confirm: 'Devam etmek istiyor musunuz? (e/h)',
            allOwned: 'Tüm ücretsiz oyunlar zaten kütüphanenizde!',
            claiming: 'Oyunlar talep ediliyor...',
            allProcessed: 'Tüm oyunlar işlendi!'
        },

        // Ayarlar
        settings: {
            title: '⚙️ AYARLAR',
            language: 'Dil / Language',
            currentLanguage: 'Mevcut Dil',
            selectLanguage: 'Dil seçin (1=Türkçe, 2=English, 0=İptal)',
            languageChanged: 'Dil değiştirildi',
            cancelled: 'İşlem iptal edildi.'
        },

        // Çıkış
        logout: {
            title: '🚪 ÇIKIŞ YAP',
            confirm: 'Steam hesabından çıkış yapmak istediğinize emin misiniz? (e/h)',
            success: 'Çıkış yapıldı.',
            error: 'Çıkış hatası',
            cancelled: 'İşlem iptal edildi.'
        },

        // Çıkış (Program)
        goodbye: {
            title: '👋 GÜLE GÜLE!',
            closing: 'Program kapatılıyor...'
        },

        // Genel
        general: {
            loginRequired: 'Önce Steam hesabınıza giriş yapmalısınız!',
            pressEnter: 'Devam etmek için Enter tuşuna basın...',
            invalidChoice: 'Geçersiz seçim!',
            error: 'Hata',
            botStarting: 'Bot başlatılıyor...',
            botReady: 'Bot hazır!',
            checkingLogin: 'Giriş durumu kontrol ediliyor...',
            autoLoginSuccess: 'Otomatik giriş başarılı!',
            notLoggedIn: 'Giriş yapılmamış. Menüden giriş yapabilirsiniz.',
            startupError: 'Başlatma hatası',
            criticalError: 'Kritik hata'
        }
    },

    en: {
        // Main Menu
        appTitle: '🎮 STEAM FREE GAMES MANAGER - CLI',
        user: 'User',
        status: 'Status',
        loggedIn: 'Logged In ✓',
        notLoggedIn: 'Not Logged In ✗',
        yourChoice: 'Your choice',

        // Menu Options
        menu: {
            login: 'Login to Steam',
            listGames: 'List Free Games',
            viewLibrary: 'View My Library',
            claimGames: 'Claim Games',
            claimAll: 'Claim All Free Games',
            settings: '⚙️ Settings',
            logout: 'Logout',
            exit: 'Exit Program'
        },

        // Login
        login: {
            title: '🔐 STEAM LOGIN',
            browserOpening: 'Browser window will open...',
            pleaseLogin: 'Please login with your Steam account.',
            mayTakeTime: 'This may take a few minutes.',
            success: 'Login successful!',
            failed: 'Login failed'
        },

        // Free Games
        freeGames: {
            title: '🎁 FREE GAMES',
            fetching: 'Fetching free games...',
            found: 'free games found',
            notFound: 'No free games found at the moment.',
            checkingLibrary: 'Checking your library...',
            owned: '[OWNED]',
            new: '[NEW]',
            endDate: 'Ends'
        },

        // Library
        library: {
            title: '📚 MY LIBRARY',
            loading: 'Loading your library...',
            totalGames: 'Total',
            gamesFound: 'games found.',
            recentGames: 'Recently added games:',
            andMore: '... and',
            moreGames: 'more games.',
            page: 'Page',
            next: 'Next',
            previous: 'Previous',
            goBack: 'Go Back'
        },

        // Claim Games
        claim: {
            title: '🎯 CLAIM GAMES',
            allOwned: 'All free games are already in your library!',
            available: 'Available to claim',
            games: 'games',
            prompt: 'Enter game numbers to claim (comma separated, 0=Cancel)',
            cancelled: 'Operation cancelled.',
            noValidSelection: 'No valid games selected!',
            claiming: 'games claiming...',
            processing: 'processing...',
            claimedSuccessfully: 'Claimed successfully',
            alreadyOwned: 'Already owned',
            claimButtonNotFound: 'Claim button not found',
            completed: 'Operation completed!'
        },

        // Claim All
        claimAll: {
            title: '🚀 CLAIM ALL GAMES',
            newGames: 'new games will be claimed.',
            confirm: 'Do you want to continue? (y/n)',
            allOwned: 'All free games are already in your library!',
            claiming: 'Claiming games...',
            allProcessed: 'All games processed!'
        },

        // Settings
        settings: {
            title: '⚙️ SETTINGS',
            language: 'Language / Dil',
            currentLanguage: 'Current Language',
            selectLanguage: 'Select language (1=Türkçe, 2=English, 0=Cancel)',
            languageChanged: 'Language changed',
            cancelled: 'Operation cancelled.'
        },

        // Logout
        logout: {
            title: '🚪 LOGOUT',
            confirm: 'Are you sure you want to logout from Steam? (y/n)',
            success: 'Logged out.',
            error: 'Logout error',
            cancelled: 'Operation cancelled.'
        },

        // Goodbye
        goodbye: {
            title: '👋 GOODBYE!',
            closing: 'Closing program...'
        },

        // General
        general: {
            loginRequired: 'You must login to your Steam account first!',
            pressEnter: 'Press Enter to continue...',
            invalidChoice: 'Invalid choice!',
            error: 'Error',
            botStarting: 'Starting bot...',
            botReady: 'Bot ready!',
            checkingLogin: 'Checking login status...',
            autoLoginSuccess: 'Auto-login successful!',
            notLoggedIn: 'Not logged in. You can login from the menu.',
            startupError: 'Startup error',
            criticalError: 'Critical error'
        }
    }
};

module.exports = translations;
