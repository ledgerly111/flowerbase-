import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './FlowerDetail.css';

export default function FlowerDetail({ flower, onBack, onEdit, onDelete }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showMenu, setShowMenu] = useState(false);
    const [showQRCode, setShowQRCode] = useState(false);
    const menuRef = useRef(null);

    if (!flower) return null;

    // Ensure images is an array (backward compatibility)
    const images = flower.images || (flower.image ? [flower.image] : []);
    const hasMultipleImages = images.length > 1;

    // Image slideshow effect - change image every 5 seconds
    useEffect(() => {
        if (hasMultipleImages) {
            const interval = setInterval(() => {
                setCurrentImageIndex((prevIndex) =>
                    (prevIndex + 1) % images.length
                );
            }, 5000); // 5 seconds

            return () => clearInterval(interval);
        }
    }, [hasMultipleImages, images.length]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu]);

    // Create the URL that the QR code points to
    const flowerURL = `${window.location.origin}${window.location.pathname}?flower=${flower.id}`;

    const handleMenuToggle = () => {
        setShowMenu(!showMenu);
    };

    const handleEdit = () => {
        setShowMenu(false);
        onEdit();
    };

    const handleDelete = () => {
        setShowMenu(false);
        if (window.confirm('Are you sure you want to delete this flower?')) {
            onDelete();
        }
    };

    const handleToggleQR = () => {
        setShowQRCode(!showQRCode);
        setShowMenu(false);
    };

    return (
        <div className="detail-container fade-in">
            <div className="detail-header">
                <button className="back-btn" onClick={onBack} title="Back to Gallery">
                    ← Back
                </button>
                <div className="menu-container" ref={menuRef}>
                    <button className="edit-pen-btn" onClick={handleMenuToggle} title="Options">
                        ✏️
                    </button>
                    {showMenu && (
                        <div className="action-menu">
                            <button className="menu-item" onClick={handleEdit}>
                                <span className="menu-icon">✏️</span> Edit Flower
                            </button>
                            <button className="menu-item" onClick={handleToggleQR}>
                                <span className="menu-icon">📱</span> {showQRCode ? 'Hide' : 'Show'} QR Code
                            </button>
                            <button className="menu-item delete-item" onClick={handleDelete}>
                                <span className="menu-icon">🗑️</span> Delete Flower
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="detail-content">
                {/* Flower Image Slideshow */}
                {images.length > 0 && (
                    <div className="detail-image-wrapper scale-in">
                        <img
                            key={currentImageIndex}
                            src={images[currentImageIndex]}
                            alt={`${flower.name} ${currentImageIndex + 1}`}
                            className="detail-image"
                            draggable="false"
                            onDragStart={(e) => e.preventDefault()}
                        />
                        {hasMultipleImages && (
                            <div className="image-indicators">
                                {images.map((_, index) => (
                                    <span
                                        key={index}
                                        className={`indicator ${index === currentImageIndex ? 'active' : ''}`}
                                        onClick={() => setCurrentImageIndex(index)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Flower Information Card */}
                <div className="detail-info-card card">
                    <h1 className="detail-title">{flower.name}</h1>

                    {(flower.type || flower.color) && (
                        <div className="detail-tags">
                            {flower.type && <span className="detail-tag">{flower.type}</span>}
                            {flower.color && <span className="detail-tag">{flower.color}</span>}
                        </div>
                    )}

                    {flower.description && (
                        <div className="detail-section">
                            <h3 className="section-title">Description</h3>
                            <p className="section-content">{flower.description}</p>
                        </div>
                    )}

                    {flower.bloomingSeason && (
                        <div className="detail-section">
                            <h3 className="section-title">Blooming Season</h3>
                            <p className="section-content">{flower.bloomingSeason}</p>
                        </div>
                    )}

                    {flower.careInstructions && (
                        <div className="detail-section">
                            <h3 className="section-title">Care Instructions</h3>
                            <p className="section-content">{flower.careInstructions}</p>
                        </div>
                    )}

                    {/* QR Code Section - Only show when toggled */}
                    {showQRCode && (
                        <div className="detail-section qr-section fade-in">
                            <h3 className="section-title">QR Code & Link</h3>
                            <div className="qr-code-container">
                                <QRCodeSVG
                                    value={flowerURL}
                                    size={200}
                                    level="H"
                                    includeMargin={true}
                                    fgColor="#1a1a35"
                                    bgColor="#ffffff"
                                />
                            </div>
                            <div className="url-display">
                                <code className="url-code">{flowerURL}</code>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
