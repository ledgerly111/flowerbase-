import { useState } from 'react';
import Settings from './Settings';
import './FlowerGallery.css';

export default function FlowerGallery({ flowers, onNewFlower, onSelectFlower, onEditFlower, onDeleteFlower }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="gallery-container">
      {/* Pink Header */}
      <header className="app-header">
        <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <span></span>
          <span></span>
          <span></span>
        </button>
        <h1 className="header-title">Flower Base</h1>
      </header>

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Menu</h2>
          <button className="close-btn" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        <nav className="sidebar-nav">
          <a href="#" className="sidebar-link active" onClick={(e) => { e.preventDefault(); setSidebarOpen(false); }}>
            <span className="sidebar-icon">🏠</span>
            <span>Home</span>
          </a>
          <a href="#" className="sidebar-link" onClick={(e) => { e.preventDefault(); onNewFlower(); setSidebarOpen(false); }}>
            <span className="sidebar-icon">➕</span>
            <span>Create Space</span>
          </a>
          <a href="#" className="sidebar-link" onClick={(e) => { e.preventDefault(); setShowSettings(true); setSidebarOpen(false); }}>
            <span className="sidebar-icon">⚙️</span>
            <span>Settings</span>
          </a>
        </nav>
      </div>

      {/* Settings Modal */}
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}

      {/* Sidebar Overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

      {/* Main Content */}
      <main className="main-content">
        <p className="page-subtitle">Create and manage your flower collection spaces</p>

        {flowers.length === 0 ? (
          <div className="empty-state fade-in">
            <h2>Welcome to Flower Base</h2>
            <p>Create your first space to start cataloging beautiful flowers with QR codes for easy sharing</p>
            <button className="btn btn-primary create-btn" onClick={onNewFlower}>
              <span className="btn-icon">✨</span>
              <span>Create First Space</span>
            </button>
          </div>
        ) : (
          <>
            <div className="spaces-header">
              <h2 className="spaces-title">Your Spaces</h2>
              <span className="spaces-count">{flowers.length} {flowers.length === 1 ? 'space' : 'spaces'}</span>
            </div>

            <div className="flower-grid">
              {flowers.map((flower, index) => (
                <div
                  key={flower.id}
                  className="flower-card card scale-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                  onClick={() => onSelectFlower(flower)}
                >
                  <div className="flower-image-wrapper">
                    {(flower.images && flower.images.length > 0) ? (
                      <img src={flower.images[0]} alt={flower.name} className="flower-image" draggable="false" />
                    ) : flower.image ? (
                      <img src={flower.image} alt={flower.name} className="flower-image" draggable="false" />
                    ) : (
                      <div className="flower-placeholder">
                        <span>🌺</span>
                      </div>
                    )}
                    <div className="card-overlay">
                      <span className="view-text">View Details →</span>
                    </div>
                  </div>
                  <div className="flower-info">
                    <h3 className="flower-name">{flower.name}</h3>
                    {flower.type && <p className="flower-type">{flower.type}</p>}
                    {flower.color && (
                      <span className="flower-tag">{flower.color}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button className="fab" onClick={onNewFlower} title="Create New Space">
              <span className="fab-icon">+</span>
              <span className="fab-text">New Space</span>
            </button>
          </>
        )}
      </main>
    </div>
  );
}
