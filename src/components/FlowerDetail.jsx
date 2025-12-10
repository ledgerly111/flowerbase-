import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './FlowerDetail.css';

// Indian language options for voice-over
const INDIAN_LANGUAGES = [
    { code: 'en-IN', name: 'English', translationCode: 'en' },
    { code: 'hi-IN', name: 'हिन्दी (Hindi)', translationCode: 'hi' },
    { code: 'ta-IN', name: 'தமிழ் (Tamil)', translationCode: 'ta' },
    { code: 'te-IN', name: 'తెలుగు (Telugu)', translationCode: 'te' },
    { code: 'bn-IN', name: 'বাংলা (Bengali)', translationCode: 'bn' },
    { code: 'mr-IN', name: 'मराठी (Marathi)', translationCode: 'mr' },
    { code: 'gu-IN', name: 'ગુજરાતી (Gujarati)', translationCode: 'gu' },
    { code: 'kn-IN', name: 'ಕನ್ನಡ (Kannada)', translationCode: 'kn' },
    { code: 'ml-IN', name: 'മലയാളം (Malayalam)', translationCode: 'ml' },
    { code: 'pa-IN', name: 'ਪੰਜਾਬੀ (Punjabi)', translationCode: 'pa' }
];

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

export default function FlowerDetail({ flower, onBack, onEdit, onDelete }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showMenu, setShowMenu] = useState(false);
    const [showQRCode, setShowQRCode] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPreparingSpeech, setIsPreparingSpeech] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState(INDIAN_LANGUAGES[0]);
    const [translatedContent, setTranslatedContent] = useState(null);
    const [isTranslating, setIsTranslating] = useState(false);
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

    // Translation function using MyMemory Translation API (free, no auth required)
    // Translation function using MyMemory Translation API
    // Handles text exceeding 500 chars by chunking
    const translateText = async (text, targetLang) => {
        if (!text) return "";
        if (targetLang === 'en') return text;

        const MAX_CHUNK_SIZE = 450; // Safe limit below 500

        // Helper to split text into chunks
        const splitText = (str) => {
            if (str.length <= MAX_CHUNK_SIZE) return [str];

            const chunks = [];
            let currentChunk = "";
            const sentences = str.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [str];

            for (let sentence of sentences) {
                if ((currentChunk + sentence).length > MAX_CHUNK_SIZE) {
                    if (currentChunk) chunks.push(currentChunk.trim());
                    currentChunk = sentence;

                    // If a single sentence is still too huge, force split it
                    while (currentChunk.length > MAX_CHUNK_SIZE) {
                        chunks.push(currentChunk.slice(0, MAX_CHUNK_SIZE));
                        currentChunk = currentChunk.slice(MAX_CHUNK_SIZE);
                    }
                } else {
                    currentChunk += sentence;
                }
            }
            if (currentChunk) chunks.push(currentChunk.trim());
            return chunks;
        };

        try {
            const chunks = splitText(text);
            const translationPromises = chunks.map(async (chunk) => {
                const response = await fetch(
                    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=en|${targetLang}`
                );
                const data = await response.json();

                // Check if API returned an error message as translation
                if (data.responseStatus !== 200 ||
                    (data.responseData.translatedText &&
                        (data.responseData.translatedText.includes("QUERY LENGTH LIMIT EXCEEDED") ||
                            data.responseData.translatedText.includes("MYMEMORY WARNING")))) {
                    throw new Error("Translation API limit or error");
                }

                return data.responseData.translatedText;
            });

            const translatedChunks = await Promise.all(translationPromises);
            return translatedChunks.join(" ");
        } catch (error) {
            console.warn('Translation failed, falling back to original text:', error);
            return text; // Fallback to original text on error
        }
    };

    // Handle language change
    const handleLanguageChange = (e) => {
        const langCode = e.target.value;
        const language = INDIAN_LANGUAGES.find(lang => lang.code === langCode);
        setSelectedLanguage(language);
        setTranslatedContent(null); // Clear previous translations

        // Stop speaking if currently speaking
        if (isSpeaking) {
            handleStopSpeaking();
        }
    };

    // Translate content when language changes (except English)
    useEffect(() => {
        const translateContent = async () => {
            if (selectedLanguage.translationCode === 'en') {
                setTranslatedContent(null);
                return;
            }

            setIsTranslating(true);

            const translated = {
                name: await translateText(flower.name, selectedLanguage.translationCode),
                type: flower.type ? await translateText(flower.type, selectedLanguage.translationCode) : null,
                color: flower.color ? await translateText(flower.color, selectedLanguage.translationCode) : null,
                description: flower.description ? await translateText(flower.description, selectedLanguage.translationCode) : null,
                bloomingSeason: flower.bloomingSeason ? await translateText(flower.bloomingSeason, selectedLanguage.translationCode) : null,
                careInstructions: flower.careInstructions ? await translateText(flower.careInstructions, selectedLanguage.translationCode) : null
            };

            setTranslatedContent(translated);
            setIsTranslating(false);
        };

        translateContent();
    }, [selectedLanguage, flower]);

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

        // Create speech utterance
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = selectedLanguage.code; // Use selected language
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

    return (
        <div className="detail-container fade-in">
            <div className="detail-header">
                <button className="back-btn" onClick={onBack} title="Back to Gallery">
                    ← Back
                </button>
                <div className="language-selector-wrapper">
                    <select
                        className="language-selector"
                        value={selectedLanguage.code}
                        onChange={handleLanguageChange}
                        disabled={isSpeaking}
                        title="Select Language"
                    >
                        {INDIAN_LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code}>
                                {lang.name}
                            </option>
                        ))}
                    </select>
                </div>
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
                    {isTranslating && (
                        <div className="translation-loading">
                            <span>🌐 Translating to {selectedLanguage.name}...</span>
                        </div>
                    )}

                    <div className="title-with-speaker">
                        <h1 className="detail-title">
                            {translatedContent?.name || flower.name}
                        </h1>
                        <button
                            className={`speaker-btn ${isSpeaking ? 'speaking' : ''} ${(isTranslating || isPreparingSpeech) ? 'loading' : ''}`}
                            onClick={handleSpeak}
                            title={isTranslating ? "Translating..." : isPreparingSpeech ? "Preparing..." : isSpeaking ? "Stop Voice-Over" : "Play Voice-Over"}
                            disabled={isTranslating}
                        >
                            {(isTranslating || isPreparingSpeech) ? '' : isSpeaking ? '🔊' : '🔇'}
                        </button>
                    </div>

                    {((translatedContent?.type || flower.type) || (translatedContent?.color || flower.color)) && (
                        <div className="detail-tags">
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

                    {/* QR Code Fullscreen Modal */}
                    {showQRCode && (
                        <div className="qr-modal-overlay" onClick={handleToggleQR}>
                            <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
                                <button className="qr-close-btn" onClick={handleToggleQR}>✕</button>
                                <div className="qr-modal-content">
                                    <div className="qr-code-large" id="qr-code-print">
                                        <QRCodeSVG
                                            value={flowerURL}
                                            size={280}
                                            level="H"
                                            includeMargin={true}
                                            fgColor="#1a1a35"
                                            bgColor="#ffffff"
                                        />
                                    </div>
                                    <p className="qr-flower-name">{flower.name}</p>
                                    <div className="qr-modal-actions">
                                        <button
                                            className="qr-share-btn"
                                            onClick={async () => {
                                                try {
                                                    // Show loading state
                                                    const btn = document.querySelector('.qr-share-btn');
                                                    const originalText = btn.textContent;
                                                    btn.textContent = '⏳ Generating...';
                                                    btn.disabled = true;

                                                    // Get the QR code element
                                                    const qrElement = document.getElementById('qr-code-print');

                                                    // Convert SVG to canvas
                                                    const canvas = await html2canvas(qrElement, {
                                                        backgroundColor: '#ffffff',
                                                        scale: 2
                                                    });

                                                    // Create PDF
                                                    const pdf = new jsPDF({
                                                        orientation: 'portrait',
                                                        unit: 'mm',
                                                        format: 'a6'
                                                    });

                                                    const imgData = canvas.toDataURL('image/png');
                                                    const pdfWidth = pdf.internal.pageSize.getWidth();
                                                    const pdfHeight = pdf.internal.pageSize.getHeight();

                                                    // Add QR code centered
                                                    const imgWidth = 80;
                                                    const imgHeight = 80;
                                                    const x = (pdfWidth - imgWidth) / 2;
                                                    const y = 15;

                                                    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);

                                                    // Add flower name
                                                    pdf.setFontSize(16);
                                                    pdf.setFont(undefined, 'bold');
                                                    pdf.text(flower.name, pdfWidth / 2, y + imgHeight + 15, { align: 'center' });

                                                    // Get PDF as blob
                                                    const pdfBlob = pdf.output('blob');
                                                    const pdfFile = new File([pdfBlob], `${flower.name}-QRCode.pdf`, { type: 'application/pdf' });

                                                    // Try to share the PDF file
                                                    if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
                                                        await navigator.share({
                                                            title: `${flower.name} - QR Code`,
                                                            text: `QR Code for ${flower.name}`,
                                                            files: [pdfFile]
                                                        });
                                                    } else {
                                                        // Fallback: Download the PDF
                                                        pdf.save(`${flower.name}-QRCode.pdf`);
                                                        // Show toast
                                                        const toast = document.createElement('div');
                                                        toast.textContent = '✓ PDF downloaded!';
                                                        toast.style.cssText = 'position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; font-weight: 600; z-index: 10000;';
                                                        document.body.appendChild(toast);
                                                        setTimeout(() => toast.remove(), 2000);
                                                    }

                                                    btn.textContent = originalText;
                                                    btn.disabled = false;
                                                } catch (err) {
                                                    console.error('Share failed:', err);
                                                    alert('Failed to generate PDF. Please try again.');
                                                }
                                            }}
                                        >
                                            📤 Share
                                        </button>
                                        <button
                                            className="qr-print-btn"
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
                                            🖨️ Print
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
