import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
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
                <div className="voice-controls">
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
                    <button
                        className={`speaker-btn ${isSpeaking ? 'speaking' : ''} ${(isTranslating || isPreparingSpeech) ? 'loading' : ''}`}
                        onClick={handleSpeak}
                        title={isTranslating ? "Translating..." : isPreparingSpeech ? "Preparing..." : isSpeaking ? "Stop Voice-Over" : "Play Voice-Over"}
                        disabled={isTranslating}
                    >
                        {(isTranslating || isPreparingSpeech) ? '' : isSpeaking ? '🔊' : '🔇'}
                    </button>
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

                    <h1 className="detail-title">
                        {translatedContent?.name || flower.name}
                    </h1>

                    {((translatedContent?.type || flower.type) || (translatedContent?.color || flower.color)) && (
                        <div className="detail-tags">
                            {(translatedContent?.type || flower.type) && (
                                <span className="detail-tag">{translatedContent?.type || flower.type}</span>
                            )}
                            {(translatedContent?.color || flower.color) && (
                                <span className="detail-tag">{translatedContent?.color || flower.color}</span>
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
