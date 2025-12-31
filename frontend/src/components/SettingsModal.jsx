import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import './SettingsModal.css';

const SettingsModal = ({ isOpen, onClose, t, steamUsername, steamAvatar, logout, loggedIn, language, changeLanguage }) => {
    const [autoLaunch, setAutoLaunch] = useState(false);
    const [startMinimized, setStartMinimized] = useState(false);
    const [autoClaim, setAutoClaim] = useState(false);
    const [scheduledClaimEnabled, setScheduledClaimEnabled] = useState(false);
    const [claimTime, setClaimTime] = useState("12:00");
    const [notifications, setNotifications] = useState(true);
    const [isElectron, setIsElectron] = useState(false);

    useEffect(() => {
        // Check if running in Electron
        if (window.electronAPI) {
            setIsElectron(true);
            // Get initial state
            window.electronAPI.getAutoLaunchStatus().then(status => setAutoLaunch(status));
            window.electronAPI.getStartMinimizedStatus().then(status => setStartMinimized(status));
            window.electronAPI.getAutoClaimStatus().then(status => setAutoClaim(status));
            window.electronAPI.getScheduledClaimSettings().then(settings => {
                setScheduledClaimEnabled(settings.enabled);
                setClaimTime(settings.time);
            });
            window.electronAPI.getNotificationsStatus().then(status => setNotifications(status));
        }
    }, [isOpen]);

    const handleAutoLaunchChange = async (e) => {
        const newValue = e.target.checked;
        setAutoLaunch(newValue);
        if (window.electronAPI) {
            try {
                await window.electronAPI.toggleAutoLaunch(newValue);
            } catch (err) {
                console.error('Failed to update auto launch:', err);
                setAutoLaunch(!newValue);
            }
        }
    };

    const handleStartMinimizedChange = async (e) => {
        const newValue = e.target.checked;
        setStartMinimized(newValue);
        if (window.electronAPI) {
            try {
                await window.electronAPI.toggleStartMinimized(newValue);
            } catch (err) {
                console.error('Failed to update start minimized:', err);
                setStartMinimized(!newValue);
            }
        }
    };

    const handleAutoClaimChange = async (e) => {
        const newValue = e.target.checked;
        setAutoClaim(newValue);
        if (window.electronAPI) {
            try {
                await window.electronAPI.toggleAutoClaim(newValue);
            } catch (err) {
                console.error('Failed to update auto claim:', err);
                setAutoClaim(!newValue);
            }
        }
    };

    const handleScheduledClaimToggle = async (e) => {
        const newValue = e.target.checked;
        setScheduledClaimEnabled(newValue);
        if (window.electronAPI) {
            try {
                await window.electronAPI.saveScheduledClaimSettings({ enabled: newValue, time: claimTime });
            } catch (err) {
                console.error('Failed to update scheduled claim:', err);
                setScheduledClaimEnabled(!newValue);
            }
        }
    };

    const handleTimeChange = async (e) => {
        const newTime = e.target.value;
        setClaimTime(newTime);
        if (window.electronAPI && scheduledClaimEnabled) {
            try {
                await window.electronAPI.saveScheduledClaimSettings({ enabled: scheduledClaimEnabled, time: newTime });
            } catch (err) {
                console.error('Failed to update claim time:', err);
            }
        }
    };

    const handleNotificationsChange = async (e) => {
        const newValue = e.target.checked;
        setNotifications(newValue);
        if (window.electronAPI) {
            try {
                await window.electronAPI.toggleNotifications(newValue);
            } catch (err) {
                console.error('Failed to update notifications:', err);
                setNotifications(!newValue);
            }
        }
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="settings-modal-overlay" onClick={onClose}>
            <div className="settings-modal-content" onClick={e => e.stopPropagation()}>
                <div className="settings-modal-header">
                    <h3 className="settings-modal-title">{t('settings')}</h3>
                    <button className="settings-close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="settings-body">
                    {/* User Profile Section */}
                    {loggedIn && (
                        <div className="settings-section">
                            <div className="user-profile-widget">
                                <div className="user-info">
                                    <div className="user-avatar">
                                        {steamAvatar ? (
                                            <img
                                                src={steamAvatar}
                                                alt="Avatar"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                onError={(e) => { e.target.style.display = 'none' }}
                                            />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                                        )}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: '#8f98a0' }}>Steam Account</div>
                                        <div style={{ fontSize: '1rem', fontWeight: '500', color: '#c7d5e0' }}>
                                            {steamUsername || 'Connected'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    logout();
                                    onClose();
                                }}
                                className="logout-btn"
                            >
                                {t('logout')}
                            </button>
                        </div>
                    )}

                    {/* Language Settings */}
                    <div className="settings-section">
                        <div className="settings-label" style={{ marginBottom: '10px' }}>{t('language_settings')}</div>
                        <div className="lang-grid">
                            {['tr', 'en', 'de', 'fr', 'es', 'it'].map(lang => (
                                <button
                                    key={lang}
                                    onClick={() => changeLanguage(lang)}
                                    className={`lang-btn ${language === lang ? 'active' : ''}`}
                                >
                                    {lang}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Startup Settings */}
                    <div className="settings-section">
                        {/* Launch at Windows Startup */}
                        <div className="settings-item" style={{ marginBottom: '16px' }}>
                            <div>
                                <div className="settings-label">{t('launch_at_startup')}</div>
                                <div className="settings-description">
                                    {t('launch_at_startup_desc')}
                                </div>
                            </div>

                            {isElectron ? (
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={autoLaunch}
                                        onChange={handleAutoLaunchChange}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            ) : (
                                <span className="text-sm text-gray-500">Not Available (Web)</span>
                            )}
                        </div>

                        {/* Start Minimized */}
                        <div className="settings-item" style={{ marginBottom: '16px' }}>
                            <div>
                                <div className="settings-label">{t('start_minimized')}</div>
                                <div className="settings-description">
                                    {t('start_minimized_desc')}
                                </div>
                            </div>

                            {isElectron ? (
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={startMinimized}
                                        onChange={handleStartMinimizedChange}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            ) : (
                                <span className="text-sm text-gray-500">Not Available (Web)</span>
                            )}
                        </div>

                        {/* Auto-Claim on Startup */}
                        <div className="settings-item" style={{ marginBottom: '16px' }}>
                            <div>
                                <div className="settings-label">{t('auto_claim_startup')}</div>
                                <div className="settings-description">
                                    {t('auto_claim_startup_desc')}
                                </div>
                            </div>

                            {isElectron ? (
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={autoClaim}
                                        onChange={handleAutoClaimChange}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            ) : (
                                <span className="text-sm text-gray-500">Not Available (Web)</span>
                            )}
                        </div>

                        {/* Scheduled Claim */}
                        <div className="settings-item">
                            <div>
                                <div className="settings-label">{t('scheduled_claim')}</div>
                                <div className="settings-description">
                                    {t('scheduled_claim_desc')}
                                </div>
                            </div>

                            {isElectron ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {scheduledClaimEnabled && (
                                        <input
                                            type="time"
                                            value={claimTime}
                                            onChange={handleTimeChange}
                                            style={{
                                                background: 'rgba(255, 255, 255, 0.1)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                color: 'white',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                outline: 'none',
                                                cursor: 'pointer'
                                            }}
                                        />
                                    )}
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={scheduledClaimEnabled}
                                            onChange={handleScheduledClaimToggle}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                            ) : (
                                <span className="text-sm text-gray-500">Not Available (Web)</span>
                            )}
                        </div>

                        {/* Notifications */}
                        <div className="settings-item">
                            <div>
                                <div className="settings-label">{t('notifications')}</div>
                                <div className="settings-description">
                                    {t('notifications_desc')}
                                </div>
                            </div>

                            {isElectron ? (
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={notifications}
                                        onChange={handleNotificationsChange}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            ) : (
                                <span className="text-sm text-gray-500">Not Available (Web)</span>
                            )}
                        </div>
                    </div>

                    {/* Version Info */}
                    <div className="settings-section" style={{ marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
                        <div className="settings-description" style={{ textAlign: 'center' }}>
                            Steam Free Games v1.0.0
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default SettingsModal;
