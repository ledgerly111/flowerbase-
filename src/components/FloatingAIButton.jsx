import { useState } from 'react';
import './FloatingAIButton.css';

// Language options for translation
const LANGUAGES = [
    { code: 'Hindi', name: 'हिन्दी (Hindi)', flag: '🇮🇳' },
    { code: 'Malayalam', name: 'മലയാളം', flag: '🇮🇳' }
];

export default function FloatingAIButton({
    onTranslate,
    onChat,
    isTranslating = false,
    currentLanguage = 'English',
    onResetLanguage
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [showLanguages, setShowLanguages] = useState(false);

    const handleToggle = () => {
        if (isOpen) {
            setShowLanguages(false);
        }
        setIsOpen(!isOpen);
    };

    const handleTranslateClick = () => {
        setShowLanguages(!showLanguages);
    };

    const handleLanguageSelect = (language) => {
        setShowLanguages(false);
        setIsOpen(false);
        if (onTranslate) {
            onTranslate(language);
        }
    };

    const handleChatClick = () => {
        setIsOpen(false);
        if (onChat) {
            onChat();
        }
    };

    const handleResetClick = () => {
        setIsOpen(false);
        setShowLanguages(false);
        if (onResetLanguage) {
            onResetLanguage();
        }
    };

    return (
        <div className="floating-ai-container">
            {/* Backdrop when menu is open */}
            {isOpen && (
                <div
                    className="floating-backdrop"
                    onClick={() => {
                        setIsOpen(false);
                        setShowLanguages(false);
                    }}
                />
            )}

            {/* Language options (sub-menu) */}
            {isOpen && showLanguages && (
                <div className="language-bubbles">
                    {LANGUAGES.map((lang, index) => (
                        <button
                            key={lang.code}
                            className="language-bubble"
                            style={{ animationDelay: `${index * 0.05}s` }}
                            onClick={() => handleLanguageSelect(lang.code)}
                            disabled={isTranslating}
                        >
                            <span className="lang-flag">{lang.flag}</span>
                            <span className="lang-name">{lang.name}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Main option buttons */}
            {isOpen && (
                <div className="option-bubbles">
                    {/* Show "Back to English" if translated */}
                    {currentLanguage !== 'English' && (
                        <button
                            className="option-bubble reset-bubble"
                            style={{ animationDelay: '0s' }}
                            onClick={handleResetClick}
                        >
                            <span className="option-icon">🔄</span>
                            <span className="option-text">Back to English</span>
                        </button>
                    )}

                    <button
                        className={`option-bubble translate-bubble ${showLanguages ? 'active' : ''}`}
                        style={{ animationDelay: currentLanguage !== 'English' ? '0.05s' : '0s' }}
                        onClick={handleTranslateClick}
                        disabled={isTranslating}
                    >
                        <span className="option-icon">
                            {isTranslating ? (
                                <span className="mini-loader"></span>
                            ) : (
                                '🌐'
                            )}
                        </span>
                        <span className="option-text">
                            {isTranslating ? 'Translating...' : 'Translate'}
                        </span>
                    </button>

                    <button
                        className="option-bubble chat-bubble"
                        style={{ animationDelay: currentLanguage !== 'English' ? '0.1s' : '0.05s' }}
                        onClick={handleChatClick}
                    >
                        <span className="option-icon">💬</span>
                        <span className="option-text">Chat with AI</span>
                    </button>
                </div>
            )}

            {/* Main AI Button */}
            <button
                className={`floating-ai-btn ${isOpen ? 'open' : ''} ${isTranslating ? 'loading' : ''}`}
                onClick={handleToggle}
                disabled={isTranslating}
            >
                <span className="ai-icon">
                    {isOpen ? '✕' : '✨'}
                </span>
                {!isOpen && <span className="ai-label">AI</span>}
            </button>
        </div>
    );
}
