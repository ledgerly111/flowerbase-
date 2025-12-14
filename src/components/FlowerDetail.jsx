import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './FlowerDetail.css';

// Color keyword to CSS color mapping
const COLOR_MAP = {
    red: '#e53e3e',
    blue: '#3182ce',
    green: '#38a169',
    yellow: '#ecc94b',
    orange: '#ed8936',
    purple: '#805ad5',
    pink: '#ed64a6',
    white: '#f7fafc',
    black: '#1a202c',
    brown: '#8b4513',
    gray: '#718096',
    grey: '#718096',
    violet: '#8b5cf6',
    indigo: '#667eea',
    teal: '#319795',
    cyan: '#0bc5ea',
    magenta: '#d53f8c',
    maroon: '#9b2c2c',
    navy: '#2c5282',
    olive: '#6b8e23',
    coral: '#ff7f50',
    salmon: '#fa8072',
    lavender: '#b794f4',
    crimson: '#dc143c',
    gold: '#d69e2e',
    silver: '#a0aec0',
    peach: '#ffdab9',
    cream: '#fffdd0',
    beige: '#f5f5dc',
    ivory: '#fffff0',
    rose: '#f687b3',
    scarlet: '#ff2400',
    burgundy: '#800020',
    plum: '#dda0dd',
    lime: '#32cd32',
    mint: '#98fb98',
    aqua: '#00ffff',
    turquoise: '#40e0d0'
};

// Extract CSS color from a color description string
const extractColor = (colorString) => {
    if (!colorString) return '#10b981'; // Default emerald

    const lowerColor = colorString.toLowerCase().trim();

    // First check if the exact string is a valid CSS color
    if (COLOR_MAP[lowerColor]) return COLOR_MAP[lowerColor];

    // Try to find a color keyword in the string
    for (const [colorName, cssColor] of Object.entries(COLOR_MAP)) {
        if (lowerColor.includes(colorName)) {
            return cssColor;
        }
    }

    // If no match found, return a default color
    return '#10b981';
};

export default function FlowerDetail({
    flower,
    allFlowers = [],
    onBack,
    onEdit,
    onDelete,
    onSelectFlower,
    isViewOnly = false,
    translatedContent = null,
    selectedLanguage = 'English',
    summarizedContent = null,
    showSparkle = false,
    onResetSummary
}) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showMenu, setShowMenu] = useState(false);
    const [showQRCode, setShowQRCode] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPreparingSpeech, setIsPreparingSpeech] = useState(false);
    const menuRef = useRef(null);
    const speechRef = useRef(null);

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

    // Text-to-Speech functionality
    const handleSpeak = () => {
        // Check if browser supports Web Speech API
        if (!('speechSynthesis' in window)) {
            alert('Sorry, your browser does not support text-to-speech.');
            return;
        }

        // If already speaking, stop it
        if (isSpeaking || isPreparingSpeech) {
            handleStopSpeaking();
            return;
        }

        // Set preparing state to show loading animation
        setIsPreparingSpeech(true);

        // Use translated content if available, otherwise use original
        const content = translatedContent || {
            name: flower.name,
            type: flower.type,
            color: flower.color,
            description: flower.description,
            bloomingSeason: flower.bloomingSeason,
            careInstructions: flower.careInstructions
        };

        // Build the text to speak
        let textToSpeak = `Flower details. Name: ${content.name}.`;

        if (content.type) {
            textToSpeak += ` Type: ${content.type}.`;
        }

        if (content.color) {
            textToSpeak += ` Color: ${content.color}.`;
        }

        if (content.description) {
            textToSpeak += ` Description: ${content.description}.`;
        }

        if (content.bloomingSeason) {
            textToSpeak += ` Blooming Season: ${content.bloomingSeason}.`;
        }

        if (content.careInstructions) {
            textToSpeak += ` Care Instructions: ${content.careInstructions}.`;
        }

        // Set language code for speech synthesis
        let langCode = 'en-US';
        if (translatedContent) {
            if (selectedLanguage === 'Hindi') langCode = 'hi-IN';
            else if (selectedLanguage === 'Malayalam') langCode = 'ml-IN';
        }

        // Create speech utterance
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = langCode;
        utterance.rate = 0.9; // Slightly slower for clarity
        utterance.pitch = 1;
        utterance.volume = 1;

        // Event handlers
        utterance.onstart = () => {
            setIsPreparingSpeech(false);
            setIsSpeaking(true);
        };

        utterance.onend = () => {
            setIsSpeaking(false);
            speechRef.current = null;
        };

        utterance.onerror = () => {
            setIsPreparingSpeech(false);
            setIsSpeaking(false);
            speechRef.current = null;
        };

        // Store reference and speak
        speechRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    };

    const handleStopSpeaking = () => {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            setIsPreparingSpeech(false);
            setIsSpeaking(false);
            speechRef.current = null;
        }
    };

    // Clean up speech on unmount
    useEffect(() => {
        return () => {
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    // Full page QR Code View
    if (showQRCode) {
        return (
            <div className="qr-page fade-in">
                <div className="qr-page-header">
                    <button className="back-btn" onClick={() => setShowQRCode(false)}>
                        ← Back
                    </button>
                    <h1 className="qr-page-title">QR Code</h1>
                </div>

                <div className="qr-page-content">
                    <div className="qr-flower-badge">
                        {images.length > 0 && (
                            <img src={images[0]} alt={flower.name} className="qr-flower-thumb" />
                        )}
                        <span className="qr-flower-label">{flower.name}</span>
                    </div>

                    <div className="qr-code-container" id="qr-code-print">
                        <QRCodeSVG
                            value={flowerURL}
                            size={280}
                            level="H"
                            includeMargin={true}
                            fgColor="#1a1a35"
                            bgColor="#ffffff"
                        />
                    </div>

                    <p className="qr-scan-hint">Scan this code to view flower details</p>

                    <div className="qr-page-actions">
                        <button
                            className="qr-action-btn share"
                            onClick={async () => {
                                try {
                                    const qrElement = document.getElementById('qr-code-print');
                                    const canvas = await html2canvas(qrElement, {
                                        backgroundColor: '#ffffff',
                                        scale: 2
                                    });

                                    const pdf = new jsPDF({
                                        orientation: 'portrait',
                                        unit: 'mm',
                                        format: 'a6'
                                    });

                                    const imgData = canvas.toDataURL('image/png');
                                    const pdfWidth = pdf.internal.pageSize.getWidth();
                                    const imgWidth = 80;
                                    const imgHeight = 80;
                                    const x = (pdfWidth - imgWidth) / 2;
                                    const y = 15;

                                    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
                                    pdf.setFontSize(16);
                                    pdf.setFont(undefined, 'bold');
                                    pdf.text(flower.name, pdfWidth / 2, y + imgHeight + 15, { align: 'center' });

                                    const pdfBlob = pdf.output('blob');
                                    const pdfFile = new File([pdfBlob], `${flower.name}-QRCode.pdf`, { type: 'application/pdf' });

                                    if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
                                        await navigator.share({
                                            title: `${flower.name} - QR Code`,
                                            text: `QR Code for ${flower.name}`,
                                            files: [pdfFile]
                                        });
                                    } else {
                                        pdf.save(`${flower.name}-QRCode.pdf`);
                                    }
                                } catch (err) {
                                    console.error('Share failed:', err);
                                }
                            }}
                        >
                            <span className="action-icon">📤</span>
                            <span>Share PDF</span>
                        </button>

                        <button
                            className="qr-action-btn print"
                            onClick={() => {
                                const printWindow = window.open('', '_blank');
                                const qrElement = document.getElementById('qr-code-print');
                                if (printWindow && qrElement) {
                                    printWindow.document.write(`
                                        <html>
                                            <head>
                                                <title>${flower.name} - QR Code</title>
                                                <style>
                                                    body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; font-family: sans-serif; }
                                                    h2 { margin-top: 20px; color: #333; }
                                                </style>
                                            </head>
                                            <body>
                                                ${qrElement.innerHTML}
                                                <h2>${flower.name}</h2>
                                            </body>
                                        </html>
                                    `);
                                    printWindow.document.close();
                                    printWindow.print();
                                }
                            }}
                        >
                            <span className="action-icon">🖨️</span>
                            <span>Print</span>
                        </button>

                        <button
                            className="qr-action-btn download"
                            onClick={() => {
                                const svg = document.querySelector('#qr-code-print svg');
                                if (svg) {
                                    const svgData = new XMLSerializer().serializeToString(svg);
                                    const canvas = document.createElement('canvas');
                                    const ctx = canvas.getContext('2d');
                                    const img = new Image();
                                    img.onload = () => {
                                        canvas.width = img.width;
                                        canvas.height = img.height;
                                        ctx.drawImage(img, 0, 0);
                                        const pngFile = canvas.toDataURL('image/png');
                                        const downloadLink = document.createElement('a');
                                        downloadLink.download = `${flower.name}-QR.png`;
                                        downloadLink.href = pngFile;
                                        downloadLink.click();
                                    };
                                    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
                                }
                            }}
                        >
                            <span className="action-icon">📥</span>
                            <span>Download</span>
                        </button>
                    </div>

                    <div className="qr-url-section">
                        <p className="qr-url-label">Direct Link</p>
                        <code className="qr-url-code">{flowerURL}</code>
                        <button
                            className="copy-url-btn"
                            onClick={() => {
                                navigator.clipboard.writeText(flowerURL);
                                const btn = document.querySelector('.copy-url-btn');
                                btn.textContent = '✓ Copied!';
                                setTimeout(() => btn.textContent = 'Copy Link', 2000);
                            }}
                        >
                            Copy Link
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`detail-container fade-in ${isViewOnly ? 'view-only-mode' : ''}`}>
            <div className="detail-header">
                {!isViewOnly && (
                    <button className="back-btn" onClick={onBack} title="Back to Gallery">
                        ← Back
                    </button>
                )}
                {isViewOnly && (
                    <div className="view-only-badge">
                        <span>🔒</span> View Only
                    </div>
                )}

                {/* Language indicator when translated */}
                {translatedContent && (
                    <div className="translation-indicator">
                        <span>🌐</span> {selectedLanguage}
                    </div>
                )}
                {!isViewOnly && (
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
                )}
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
                <div className={`detail-info-card card ${showSparkle ? 'sparkle-animation' : ''}`}>
                    <div className="title-with-speaker">
                        <h1 className="detail-title">
                            {translatedContent?.name || flower.name}
                        </h1>
                        <button
                            className={`speaker-btn ${isSpeaking ? 'speaking' : ''} ${isPreparingSpeech ? 'loading' : ''}`}
                            onClick={handleSpeak}
                            title={isPreparingSpeech ? "Preparing..." : isSpeaking ? "Stop Voice-Over" : "Play Voice-Over"}
                        >
                            {isSpeaking ? (
                                <div className="dancing-bars">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            ) : isPreparingSpeech ? (
                                <div className="speech-loader"></div>
                            ) : (
                                '🔊'
                            )}
                        </button>
                    </div>

                    {(flower.type || flower.color || flower.category) && (
                        <div className="detail-tags">
                            {flower.category && (
                                <span className="detail-tag category-tag">{flower.category}</span>
                            )}
                            {(translatedContent?.type || flower.type) && (
                                <span className="detail-tag">{translatedContent?.type || flower.type}</span>
                            )}
                            {(translatedContent?.color || flower.color) && (
                                <span
                                    className="detail-tag color-tag"
                                    style={{
                                        borderColor: extractColor(flower.color),
                                        color: extractColor(flower.color),
                                        boxShadow: `0 2px 8px ${extractColor(flower.color)}33`
                                    }}
                                >
                                    {translatedContent?.color || flower.color}
                                </span>
                            )}
                        </div>
                    )}

                    {/* AI Summarized Content */}
                    {summarizedContent && (
                        <div className="summarized-content">
                            <div className="summarized-header">
                                <span>✨</span>
                                <h4>{summarizedContent.type === 'expanded' ? 'Expanded by Flora' : 'Key Points by Flora'}</h4>
                                <span className="summarized-badge">
                                    {summarizedContent.type === 'expanded' ? 'ENRICHED' : 'SUMMARIZED'}
                                </span>
                            </div>

                            {summarizedContent.keyPoints && summarizedContent.keyPoints.length > 0 && (
                                <ul className="key-points-list">
                                    {summarizedContent.keyPoints.map((point, idx) => (
                                        <li key={idx}>{point}</li>
                                    ))}
                                </ul>
                            )}

                            {summarizedContent.quickCare && (
                                <div className="quick-care-box">
                                    <h5>🌱 Quick Care</h5>
                                    <p>{summarizedContent.quickCare}</p>
                                </div>
                            )}

                            {summarizedContent.bestFor && (
                                <div className="best-for-box">
                                    <h5>⭐ Best For</h5>
                                    <p>{summarizedContent.bestFor}</p>
                                </div>
                            )}

                            {summarizedContent.description && summarizedContent.type === 'expanded' && (
                                <div className="detail-section" style={{ marginTop: '1rem' }}>
                                    <h3 className="section-title">Expanded Description</h3>
                                    <p className="section-content">{summarizedContent.description}</p>
                                </div>
                            )}

                            {summarizedContent.careInstructions && summarizedContent.type === 'expanded' && (
                                <div className="detail-section">
                                    <h3 className="section-title">Detailed Care Guide</h3>
                                    <p className="section-content">{summarizedContent.careInstructions}</p>
                                </div>
                            )}

                            <button className="reset-summary-btn" onClick={onResetSummary}>
                                Show Original Content
                            </button>
                        </div>
                    )}

                    {/* Parental Section */}
                    {flower.parental && (
                        <div className="detail-section parental-section">
                            <h3 className="section-title">Parent Plants</h3>
                            <div className="parental-links">
                                {flower.parental.split(',').map((parentName, index) => {
                                    const trimmedName = parentName.trim();
                                    const parentFlower = allFlowers.find(
                                        f => f.name.toLowerCase() === trimmedName.toLowerCase()
                                    );

                                    return parentFlower ? (
                                        <button
                                            key={index}
                                            className="parent-link clickable"
                                            onClick={() => onSelectFlower && onSelectFlower(parentFlower)}
                                        >
                                            🔗 {trimmedName}
                                        </button>
                                    ) : (
                                        <span key={index} className="parent-link">
                                            {trimmedName}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {(translatedContent?.description || flower.description) && (
                        <div className="detail-section">
                            <h3 className="section-title">Description</h3>
                            <p className="section-content">{translatedContent?.description || flower.description}</p>
                        </div>
                    )}

                    {(translatedContent?.bloomingSeason || flower.bloomingSeason) && (
                        <div className="detail-section">
                            <h3 className="section-title">Blooming Season</h3>
                            <p className="section-content">{translatedContent?.bloomingSeason || flower.bloomingSeason}</p>
                        </div>
                    )}

                    {(translatedContent?.careInstructions || flower.careInstructions) && (
                        <div className="detail-section">
                            <h3 className="section-title">Care Instructions</h3>
                            <p className="section-content">{translatedContent?.careInstructions || flower.careInstructions}</p>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
