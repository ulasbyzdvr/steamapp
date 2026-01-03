import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import './GameDetailModal.css';

const GameDetailModal = ({ isOpen, onClose, game, t, onClaim, language }) => {
    const [media, setMedia] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState(null); // For video/screenshot viewer
    const [mediaType, setMediaType] = useState('image'); // 'image' or 'video'

    useEffect(() => {
        if (isOpen && game && game.appId) {
            setLoading(true);
            axios.get(`http://localhost:3001/api/game-details/${game.appId}`)
                .then(response => {
                    setMedia(response.data);
                    // Set first media as selected
                    if (response.data.movies && response.data.movies.length > 0) {
                        setSelectedMedia(response.data.movies[0]);
                        setMediaType('video');
                    } else if (response.data.screenshots && response.data.screenshots.length > 0) {
                        setSelectedMedia(response.data.screenshots[0]);
                        setMediaType('image');
                    }
                })
                .catch(err => console.error('Failed to load media:', err))
                .finally(() => setLoading(false));
        }
    }, [isOpen, game]);

    if (!isOpen || !game) return null;

    const getScoreColor = (score) => {
        if (!score) return '#94a3b8';
        if (score >= 80) return '#fbbf24';
        if (score >= 60) return '#f59e0b';
        return '#94a3b8';
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
                {/* Media Section (Video or Screenshot) */}
                <div className="game-detail-media-section">
                    {selectedMedia && mediaType === 'video' ? (
                        <video
                            key={selectedMedia.id}
                            className="game-detail-video"
                            controls
                            autoPlay
                            muted
                            poster={selectedMedia.thumbnail}
                        >
                            <source src={selectedMedia.webm} type="video/webm" />
                            <source src={selectedMedia.mp4} type="video/mp4" />
                        </video>
                    ) : selectedMedia && mediaType === 'image' ? (
                        <img
                            src={selectedMedia.full}
                            alt="Screenshot"
                            className="game-detail-screenshot"
                        />
                    ) : (
                        <div className="game-detail-header">
                            {imageUrl ? (
                                <img src={imageUrl} alt={game.title} className="game-detail-banner" />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', background: '#334155' }}>
                                    🎮
                                </div>
                            )}
                        </div>
                    )}
                    <button className="game-detail-close-btn" onClick={onClose}>&times;</button>
                </div>

                {/* Media Thumbnails */}
                {media && (media.movies?.length > 0 || media.screenshots?.length > 0) && (
                    <div className="media-thumbnails">
                        {media.movies?.map(movie => (
                            <div
                                key={movie.id}
                                className={`media-thumb ${selectedMedia?.id === movie.id && mediaType === 'video' ? 'active' : ''}`}
                                onClick={() => {
                                    setSelectedMedia(movie);
                                    setMediaType('video');
                                }}
                            >
                                <img src={movie.thumbnail} alt={movie.name} />
                                <div className="play-icon">▶</div>
                            </div>
                        ))}
                        {media.screenshots?.map(screenshot => (
                            <div
                                key={screenshot.id}
                                className={`media-thumb ${selectedMedia?.id === screenshot.id && mediaType === 'image' ? 'active' : ''}`}
                                onClick={() => {
                                    setSelectedMedia(screenshot);
                                    setMediaType('image');
                                }}
                            >
                                <img src={screenshot.thumbnail} alt="Screenshot" />
                            </div>
                        ))}
                    </div>
                )}

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
