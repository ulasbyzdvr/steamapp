import React from 'react';
import ReactDOM from 'react-dom';
import './GameDetailModal.css';

const GameDetailModal = ({ isOpen, onClose, game, t, onClaim, language }) => {
    if (!isOpen || !game) return null;

    const getScoreColor = (score) => {
        if (!score) return '#94a3b8';
        if (score >= 80) return '#fbbf24'; // Gold
        if (score >= 60) return '#f59e0b'; // Orange
        return '#94a3b8'; // Grey
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString(language || 'tr', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatExpiry = (expiryDate) => {
        if (!expiryDate) return null;
        try {
            const date = new Date(expiryDate);
            const now = new Date();
            const diffTime = date - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 0) return t('ends_ended');
            if (diffDays === 0) return t('ends_today');
            if (diffDays === 1) return t('ends_tomorrow');
            if (diffDays < 7) return t('ends_in_days', { days: diffDays });

            return t('ends_on', { date: date.toLocaleDateString(language || 'tr') });
        } catch (e) {
            return null;
        }
    };

    const imageUrl = game.image || (game.appId ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appId}/header.jpg` : null);

    return ReactDOM.createPortal(
        <div className="game-detail-modal-overlay" onClick={onClose}>
            <div className="game-detail-modal-content" onClick={e => e.stopPropagation()}>
                {/* Header Image */}
                <div className="game-detail-header">
                    {imageUrl ? (
                        <img src={imageUrl} alt={game.title} className="game-detail-banner" />
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', background: '#334155' }}>
                            🎮
                        </div>
                    )}
                    <button className="game-detail-close-btn" onClick={onClose}>&times;</button>
                </div>

                {/* Body */}
                <div className="game-detail-body">
                    {/* Title & Status */}
                    <div className="game-detail-title-section">
                        <div>
                            <h2 className="game-detail-title">{game.title}</h2>
                            <div className="game-detail-badges">
                                {game.earlyAccess && <span className="detail-badge early-access">{t('early_access')}</span>}
                                {game.achievements && <span className="detail-badge">{t('achievements')}</span>}
                                {game.tradingCards && <span className="detail-badge">{t('trading_cards')}</span>}
                            </div>
                        </div>
                        {game.isOwned && (
                            <div className="owned-status-flag">
                                <span>✓</span>
                                <span>{t('in_library')}</span>
                            </div>
                        )}
                    </div>

                    {/* Meta Grid */}
                    <div className="game-detail-meta-grid">
                        <div className="meta-item">
                            <div className="meta-label">{t('release_date')}</div>
                            <div className="meta-value">{formatDate(game.releaseDate)}</div>
                        </div>
                        <div className="meta-item">
                            <div className="meta-label">{t('review_score')}</div>
                            <div className="meta-value" style={{ color: getScoreColor(game.score) }}>
                                {game.score ? `${game.score}%` : 'N/A'}
                            </div>
                        </div>
                        <div className="meta-item">
                            <div className="meta-label">{t('offer_ends')}</div>
                            <div className="meta-value expiry">
                                {formatExpiry(game.expiry) || 'N/A'}
                            </div>
                        </div>
                    </div>

                    {/* Tags */}
                    {game.tags && game.tags.length > 0 && (
                        <div className="detail-tags">
                            <div className="meta-label">{t('user_tags')}</div>
                            <div className="tag-list">
                                {game.tags.map((tag, i) => (
                                    <span key={i} className="tag-pill">{tag}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="game-detail-actions">
                        <a
                            href={game.url}
                            target="_blank"
                            rel="noreferrer"
                            className="action-btn store-btn"
                        >
                            {t('visit_store')}
                        </a>

                        {!game.isOwned && (
                            <button
                                className="action-btn claim-btn"
                                onClick={() => {
                                    onClaim(game);
                                    onClose();
                                }}
                            >
                                {t('add_to_account')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default GameDetailModal;
