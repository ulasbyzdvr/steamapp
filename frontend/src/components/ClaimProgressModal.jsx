import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { translations } from '../translations'
import './ClaimProgressModal.css'

const API_BASE = 'http://localhost:3001/api'

function ClaimProgressModal({ isOpen, onClose, totalGames, language }) {
    const [progress, setProgress] = useState(null)
    const [polling, setPolling] = useState(false)

    // Translation helper inside component
    const t = (key, params = {}) => {
        let text = translations[language][key] || key;
        Object.keys(params).forEach(p => {
            text = text.replace(`{${p}}`, params[p]);
        });
        return text;
    };

    useEffect(() => {
        if (!isOpen) {
            setProgress(null)
            setPolling(false)
            return
        }

        // Start polling
        setPolling(true)

        const pollProgress = async () => {
            try {
                const res = await axios.get(`${API_BASE}/claim/progress`)
                setProgress(res.data)

                if (res.data.status === 'complete' || res.data.status === 'error') {
                    setPolling(false)
                }
            } catch (err) {
                console.error('Progress poll error:', err)
            }
        }

        // Poll immediately
        pollProgress()

        // Then poll every second
        const interval = setInterval(pollProgress, 1000)

        return () => clearInterval(interval)
    }, [isOpen, polling])

    if (!isOpen) return null

    const handleClose = () => {
        if (progress?.status === 'running') {
            const confirmed = window.confirm(language === 'tr' ? 'İşlem hala devam ediyor. Kapatmak istediğinizden emin misiniz?' : 'Claiming is still in progress. Are you sure you want to close?')
            if (!confirmed) return
        }
        onClose()
    }

    const getProgressPercentage = () => {
        if (!progress || !progress.total) return 0
        return (progress.current / progress.total) * 100
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'success': return '✅'
            case 'owned': return '✓'
            case 'error': return '❌'
            default: return '⏳'
        }
    }

    const getStatusClass = (status) => {
        switch (status) {
            case 'success': return 'result-success'
            case 'owned': return 'result-owned'
            case 'error': return 'result-error'
            default: return 'result-processing'
        }
    }

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="claim-progress-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{t('progress_title')}</h3>
                    <button onClick={handleClose} className="close-button">×</button>
                </div>

                <div className="modal-body">
                    {progress && (
                        <>
                            {/* Progress Bar */}
                            <div className="progress-section">
                                <div className="progress-bar-container">
                                    <div
                                        className="progress-bar-fill"
                                        style={{ width: `${getProgressPercentage()}%` }}
                                    />
                                </div>
                                <div className="progress-text">
                                    {progress.current} / {progress.total}
                                </div>
                            </div>

                            {/* Current Game */}
                            {progress.status === 'running' && progress.currentGame && (
                                <div className="current-game">
                                    <div className="spinner"></div>
                                    <span>{t('progress_status_processing', { game: progress.currentGame })}</span>
                                </div>
                            )}

                            {/* Status Message */}
                            {progress.status === 'complete' && (
                                <div className="status-complete">
                                    {t('progress_status_completed')}
                                </div>
                            )}

                            {progress.status === 'error' && (
                                <div className="status-error">
                                    {t('progress_status_error', { error: progress.error })}
                                </div>
                            )}

                            {/* Results List */}
                            {progress.results && progress.results.length > 0 && (
                                <div className="results-section">
                                    <h4>{language === 'tr' ? 'Sonuçlar:' : 'Results:'}</h4>
                                    <div className="results-list">
                                        {progress.results.map((result, idx) => (
                                            <div key={idx} className={`result-item ${getStatusClass(result.status)}`}>
                                                <span className="result-icon">{getStatusIcon(result.status)}</span>
                                                <span className="result-game">{result.game}</span>
                                                <span className="result-message">{result.message}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {!progress && (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>{language === 'tr' ? 'İşlem başlatılıyor...' : 'Starting claim process...'}</p>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button
                        onClick={onClose}
                        className="close-modal-button"
                        disabled={progress?.status === 'running'}
                    >
                        {progress?.status === 'running' ? (language === 'tr' ? 'İşleniyor...' : 'Processing...') : t('close')}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ClaimProgressModal
