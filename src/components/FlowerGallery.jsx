import { useState } from 'react';
import './FlowerGallery.css';

export default function FlowerGallery({ flowers, onNewFlower, onSelectFlower, onEditFlower, onDeleteFlower }) {
  return (
    <div className="gallery-container">
      <header className="gallery-header">
        <h1 className="gallery-title">Hybrid Flower Collection</h1>
        <p className="gallery-subtitle">Celebrate the beauty of our hybrid blooms</p>
      </header>

      {flowers.length === 0 ? (
        <div className="empty-state fade-in">
          <div className="empty-icon">🌸</div>
          <h2>No Flowers Yet</h2>
          <p>Start your collection by creating your first hybrid flower space</p>
          <button className="btn btn-primary" onClick={onNewFlower}>
            <span>✨</span> Create First Space
          </button>
        </div>
      ) : (
        <>
          <div className="flower-grid">
            {flowers.map((flower, index) => (
              <div
                key={flower.id}
                className="flower-card card scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flower-image-wrapper" onClick={() => onSelectFlower(flower)}>
                  {(flower.images && flower.images.length > 0) ? (
                    <img src={flower.images[0]} alt={flower.name} className="flower-image" onClick={(e) => e.stopPropagation()} draggable="false" />
                  ) : flower.image ? (
                    <img src={flower.image} alt={flower.name} className="flower-image" onClick={(e) => e.stopPropagation()} draggable="false" />
                  ) : (
                    <div className="flower-placeholder">🌺</div>
                  )}
                </div>
                <div className="flower-info" onClick={() => onSelectFlower(flower)}>
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
    </div>
  );
}
