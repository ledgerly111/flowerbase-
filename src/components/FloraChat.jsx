import { useState, useRef, useEffect } from 'react';
import { chatWithFlora } from '../geminiService';
import './FloraChat.css';

export default function FloraChat({ flower, onClose }) {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: flower
                ? `Hi! I'm Flora 🌸 I see you're looking at ${flower.name}. What would you like to know about this beautiful flower?`
                : `Hi! I'm Flora 🌸 Your friendly flower expert! How can I help you today?`
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage = inputValue.trim();
        setInputValue('');

        // Add user message
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            // Get Flora's response
            const response = await chatWithFlora(userMessage, flower, messages);
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: '😔 Sorry, I had trouble processing that. Please try again!'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Quick question suggestions
    const quickQuestions = flower ? [
        `How do I care for ${flower.name}?`,
        `When does ${flower.name} bloom?`,
        `Tell me fun facts about this flower`,
        `What flowers are similar to this?`
    ] : [
        'What flower should I grow indoors?',
        'Tell me about roses',
        'Best flowers for beginners?'
    ];

    return (
        <div className="flora-chat-overlay" onClick={onClose}>
            <div className="flora-chat-container" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flora-chat-header">
                    <div className="flora-avatar">
                        <span>🌸</span>
                    </div>
                    <div className="flora-info">
                        <h3>Flora</h3>
                        <span className="flora-status">Your Flower Expert</span>
                    </div>
                    <button className="flora-close-btn" onClick={onClose}>
                        ✕
                    </button>
                </div>

                {/* Context indicator */}
                {flower && (
                    <div className="flora-context">
                        <span>🌺</span> Talking about: <strong>{flower.name}</strong>
                    </div>
                )}

                {/* Messages */}
                <div className="flora-messages">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flora-message ${msg.role}`}>
                            {msg.role === 'assistant' && (
                                <div className="message-avatar">🌸</div>
                            )}
                            <div className="message-content">
                                {msg.content}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flora-message assistant">
                            <div className="message-avatar">🌸</div>
                            <div className="message-content typing">
                                <span className="typing-dot"></span>
                                <span className="typing-dot"></span>
                                <span className="typing-dot"></span>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Quick questions (only show if few messages) */}
                {messages.length <= 2 && !isLoading && (
                    <div className="flora-quick-questions">
                        {quickQuestions.map((q, i) => (
                            <button
                                key={i}
                                className="quick-question-btn"
                                onClick={() => {
                                    setInputValue(q);
                                    inputRef.current?.focus();
                                }}
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input area */}
                <div className="flora-input-area">
                    <input
                        ref={inputRef}
                        type="text"
                        className="flora-input"
                        placeholder="Ask Flora anything..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                    />
                    <button
                        className={`flora-send-btn ${isLoading ? 'loading' : ''}`}
                        onClick={handleSendMessage}
                        disabled={isLoading || !inputValue.trim()}
                    >
                        {isLoading ? (
                            <span className="send-loader"></span>
                        ) : (
                            '→'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
