import { useState, useEffect } from 'react';
import { getStorageStats } from '../firebaseService';
import './Settings.css';

export default function Settings({ onClose, darkMode, onToggleDarkMode }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            setLoading(true);
            const storageStats = await getStorageStats();
            setStats(storageStats);
        } catch (err) {
            setError('Failed to load storage statistics');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="settings-overlay" onClick={onClose}>
            <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
                <div className="settings-header">
                    <h2>Settings</h2>
                    <button className="close-settings-btn" onClick={onClose}>✕</button>
                </div>

                <div className="settings-content">
                    {/* Appearance Section */}
                    <section className="settings-section">
                        <h3 className="section-heading">
                            <span className="section-icon">🎨</span>
                            Appearance
                        </h3>
                        <div className="setting-item">
                            <div className="setting-info">
                                <span className="setting-label">Dark Mode</span>
                                <span className="setting-description">Switch between light and dark theme</span>
                            </div>
                            <button
                                className={`theme-toggle ${darkMode ? 'dark' : 'light'}`}
                                onClick={onToggleDarkMode}
                            >
                                <span className="toggle-icon">{darkMode ? '🌙' : '☀️'}</span>
                                <span className="toggle-slider"></span>
                            </button>
                        </div>
                    </section>

                    {/* Storage Section */}
                    <section className="settings-section">
                        <h3 className="section-heading">
                            <span className="section-icon">💾</span>
                            Storage Usage
                        </h3>

                        {loading ? (
                            <div className="loading-stats">
                                <div className="spinner"></div>
                                <p>Loading statistics...</p>
                            </div>
                        ) : error ? (
                            <div className="error-stats">
                                <p>⚠️ {error}</p>
                                <button onClick={loadStats}>Retry</button>
                            </div>
                        ) : stats && (
                            <>
                                {/* Overview Cards */}
                                <div className="stats-grid">
                                    <div className="stat-card">
                                        <span className="stat-icon">🌸</span>
                                        <span className="stat-value">{stats.totalFlowers}</span>
                                        <span className="stat-label">Total Spaces</span>
                                    </div>
                                    <div className="stat-card">
                                        <span className="stat-icon">🖼️</span>
                                        <span className="stat-value">{stats.totalImages}</span>
                                        <span className="stat-label">Total Images</span>
                                    </div>
                                    <div className="stat-card">
                                        <span className="stat-icon">📊</span>
                                        <span className="stat-value">{stats.totalStorageMB} MB</span>
                                        <span className="stat-label">Estimated Usage</span>
                                    </div>
                                </div>

                                {/* Image Storage Bar */}
                                <div className="storage-bar-container">
                                    <div className="storage-bar-header">
                                        <span>Image Storage</span>
                                        <span>{stats.estimatedImageStorageMB} MB / 5 GB</span>
                                    </div>
                                    <div className="storage-bar">
                                        <div
                                            className="storage-bar-fill"
                                            style={{ width: `${Math.min(stats.storageUsagePercent, 100)}%` }}
                                        ></div>
                                    </div>
                                    <span className="storage-percent">{stats.storageUsagePercent}% used</span>
                                </div>

                                {/* Data Storage Bar */}
                                <div className="storage-bar-container">
                                    <div className="storage-bar-header">
                                        <span>Data Storage</span>
                                        <span>{stats.estimatedDataStorageMB} MB / 1 GB</span>
                                    </div>
                                    <div className="storage-bar data-bar">
                                        <div
                                            className="storage-bar-fill data-fill"
                                            style={{ width: `${Math.min(stats.dataUsagePercent, 100)}%` }}
                                        ></div>
                                    </div>
                                    <span className="storage-percent">{stats.dataUsagePercent}% used</span>
                                </div>
                            </>
                        )}
                    </section>

                    {/* Compression Settings */}
                    <section className="settings-section">
                        <h3 className="section-heading">
                            <span className="section-icon">🗜️</span>
                            Image Compression
                        </h3>
                        <div className="info-box">
                            <p>Images are automatically compressed to save storage:</p>
                            <ul>
                                <li>Max width: <strong>600px</strong></li>
                                <li>Quality: <strong>50%</strong></li>
                                <li>Format: <strong>JPEG</strong></li>
                            </ul>
                            <p className="info-note">This reduces each image from ~2-5MB to ~80-150KB</p>
                        </div>
                    </section>

                    {/* About Section */}
                    <section className="settings-section">
                        <h3 className="section-heading">
                            <span className="section-icon">ℹ️</span>
                            About
                        </h3>
                        <div className="about-info">
                            <p><strong>Flower Base</strong> v1.0</p>
                            <p>A beautiful way to catalog and share your flower collection with QR codes.</p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
