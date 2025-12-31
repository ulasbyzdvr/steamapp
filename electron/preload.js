const { contextBridge, ipcRenderer } = require('electron');

// Güvenli API expose etme
contextBridge.exposeInMainWorld('electronAPI', {
    // Pencere kontrolleri
    minimizeToTray: () => ipcRenderer.invoke('minimize-to-tray'),

    // App bilgileri
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),

    // Settings
    getAutoLaunchStatus: () => ipcRenderer.invoke('get-auto-launch-status'),
    toggleAutoLaunch: (enable) => ipcRenderer.invoke('toggle-auto-launch', enable),
    getStartMinimizedStatus: () => ipcRenderer.invoke('get-start-minimized-status'),
    toggleStartMinimized: (enable) => ipcRenderer.invoke('toggle-start-minimized', enable),
    getAutoClaimStatus: () => ipcRenderer.invoke('get-auto-claim-status'),
    toggleAutoClaim: (enable) => ipcRenderer.invoke('toggle-auto-claim', enable),
    getScheduledClaimSettings: () => ipcRenderer.invoke('get-scheduled-claim-settings'),
    saveScheduledClaimSettings: (settings) => ipcRenderer.invoke('save-scheduled-claim-settings', settings),
    getNotificationsStatus: () => ipcRenderer.invoke('get-notifications-status'),
    toggleNotifications: (enable) => ipcRenderer.invoke('toggle-notifications', enable),

    // Event listeners
    onRefreshGames: (callback) => {
        ipcRenderer.on('refresh-games', callback);
    },

    onShowNotification: (callback) => {
        ipcRenderer.on('show-notification', (event, notification) => {
            callback(notification);
        });
    },

    // Cleanup
    removeAllListeners: (channel) => {
        ipcRenderer.removeAllListeners(channel);
    }
});

// Platform bilgisi
contextBridge.exposeInMainWorld('platform', {
    isElectron: true,
    os: process.platform
});

console.log('[Preload] Script loaded');
