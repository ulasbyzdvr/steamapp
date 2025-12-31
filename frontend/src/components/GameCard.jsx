import React, { useState } from 'react'
import './GameCard.css'

function GameCard({ game, selected, onToggle, onDetailClick, loggedIn, t, language }) {
    const [imageError, setImageError] = useState(false);

    const getCardClass = () => {
        let base = 'game-card-horizontal';
        if (game.isOwned) return base + ' game-card-owned';
        if (selected) return base + ' game-card-selected';
        return base;
    }

    const getCheckboxClass = () => {
        if (game.isOwned) return 'checkbox checkbox-owned'
        if (selected) return 'checkbox checkbox-selected'
        return 'checkbox'
    }

    const getImageUrl = () => {
        if (game.image) return game.image;
        if (game.appId) {
            return `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appId}/header.jpg`;
        }
        return null;
    }

    // Get expiry info with color coding based on urgency
    const getExpiryInfo = (expiryDate) => {
        if (!expiryDate) return { text: 'Süresiz', color: '#666' };

        try {
            const date = new Date(expiryDate);
            const now = new Date();
            const diffTime = date - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let text, color;

            if (diffDays < 0) {
                text = t('ends_ended');
                color = '#666'; // Gray - ended
            } else if (diffDays === 0) {
                text = t('ends_today');
                color = '#ff4444'; // Red - urgent!
            } else if (diffDays === 1) {
                text = t('ends_tomorrow');
                color = '#ff6b35'; // Orange-red - very soon
            } else if (diffDays <= 3) {
                text = date.toLocaleDateString(language || 'tr', { month: 'short', day: 'numeric' });
                color = '#ffa500'; // Orange - soon
            } else if (diffDays <= 7) {
                text = date.toLocaleDateString(language || 'tr', { month: 'short', day: 'numeric' });
                color = '#f4c430'; // Yellow - moderate
            } else {
                text = date.toLocaleDateString(language || 'tr', { month: 'short', day: 'numeric' });
                color = '#a4d007'; // Green - plenty of time
            }

            return { text, color };
        } catch (e) {
            return { text: 'Süresiz', color: '#666' };
        }
    };

    const imageUrl = getImageUrl();
    const expiryInfo = getExpiryInfo(game.expiry);

    return (
        <div
            className={getCardClass()}
            onClick={onDetailClick}
            title={game.title}
        >
            {/* 1. Image Section */}
            <div className="card-image-section">
                {imageUrl && !imageError ? (
                    <img
                        src={imageUrl}
                        alt={game.title}
                        className="game-image-horizontal"
                        loading="lazy"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="game-image-placeholder-horizontal">
                        <span>🎮</span>
                    </div>
                )}
            </div>

            {/* 2. Info Section */}
            <div className="card-info-section">
                <div className="game-title-horizontal">
                    {game.title}
                </div>

                <div className="game-details-row">
                    {/* Expiry Date with dynamic color */}
                    <span
                        className="info-expiry-badge"
                        title={game.expiry ? new Date(game.expiry).toLocaleString() : 'No expiry date'}
                        style={{
                            display: 'inline-flex',
                            background: expiryInfo.color,
                            color: '#fff',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontWeight: '600',
                            fontSize: '0.85rem',
                            boxShadow: `0 2px 6px ${expiryInfo.color}40`
                        }}
                    >
                        ⏳ {expiryInfo.text}
                    </span>

                    {/* Tags */}
                    {game.tags && game.tags.length > 0 && (
                        <div className="game-tags-horizontal">
                            {game.tags.slice(0, 3).map((tag, idx) => (
                                <span key={idx} className="tag-small">{tag}</span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 3. Actions Section */}
            <div className="card-actions-section">
                <div className="action-buttons">
                    <a
                        href={game.url}
                        target="_blank"
                        rel="noreferrer"
                        className="store-link-small"
                        onClick={(e) => e.stopPropagation()}
                        title="View on Store"
                    >
                        ➚
                    </a>

                    <div
                        className={getCheckboxClass()}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!game.isOwned && loggedIn) onToggle();
                        }}
                    >
                        {selected && <span className="check-mark">✓</span>}
                        {game.isOwned && <span className="owned-mark">✓</span>}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default GameCard
