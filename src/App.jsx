import { useState, useEffect } from 'react';
import FlowerGallery from './components/FlowerGallery';
import FlowerForm from './components/FlowerForm';
import FlowerDetail from './components/FlowerDetail';
import Settings from './components/Settings';
import FloatingAIButton from './components/FloatingAIButton';
import FloraChat from './components/FloraChat';
import { getFlowers, getFlowerById, addFlower, updateFlower, deleteFlower } from './firebaseService';
import { translateFlowerContent, summarizeFlowerContent, isGeminiConfigured } from './geminiService';
import { getCacheKey, getFromCache, saveToCache } from './cacheService';
import './App.css';

function App() {
  const [flowers, setFlowers] = useState([]);
  const [currentView, setCurrentView] = useState('gallery'); // 'gallery', 'form', 'detail'
  const [selectedFlower, setSelectedFlower] = useState(null);
  const [editingFlower, setEditingFlower] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);

  // AI Translation state
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [translatedContent, setTranslatedContent] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showFloraChat, setShowFloraChat] = useState(false);

  // AI Summarize state
  const [summarizedContent, setSummarizedContent] = useState(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showSparkle, setShowSparkle] = useState(false);

  // Dark Mode state
  const [darkMode, setDarkMode] = useState(false);

  // Initialize dark mode based on user preference or system preference
  useEffect(() => {
    const initTheme = () => {
      // Check if we're in view-only mode (QR visitor)
      const params = new URLSearchParams(window.location.search);
      const isQRVisitor = params.get('flower') !== null;

      if (isQRVisitor) {
        // For QR visitors: use system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setDarkMode(prefersDark);
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      } else {
        // For regular users: check localStorage
        const savedTheme = localStorage.getItem('flowerbase_theme');
        if (savedTheme) {
          const isDark = savedTheme === 'dark';
          setDarkMode(isDark);
          document.documentElement.setAttribute('data-theme', savedTheme);
        } else {
          // Default to light if no preference saved
          document.documentElement.setAttribute('data-theme', 'light');
        }
      }
    };

    initTheme();
  }, []);

  // Handle dark mode toggle
  const handleToggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    const theme = newDarkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('flowerbase_theme', theme);
  };

  // Load flowers from Firebase on mount
  useEffect(() => {
    const loadFlowers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const flowersData = await getFlowers();
        setFlowers(flowersData);

        // Check if URL has a flower parameter (from QR scan)
        const params = new URLSearchParams(window.location.search);
        const flowerId = params.get('flower');
        if (flowerId) {
          const flower = await getFlowerById(flowerId);
          if (flower) {
            setSelectedFlower(flower);
            setCurrentView('detail');
            setIsViewOnly(true); // Enable view-only mode for QR visitors
          }
        }
      } catch (err) {
        console.error("Error loading flowers:", err);
        setError("Failed to load flowers. Please check your connection.");
      } finally {
        setIsLoading(false);
      }
    };

    loadFlowers();
  }, []);

  const handleSaveFlower = async (flowerData) => {
    try {
      setIsLoading(true);
      const newFlower = await addFlower(flowerData);
      setFlowers(prev => [newFlower, ...prev]);
      setCurrentView('gallery');
      return newFlower.id;
    } catch (err) {
      console.error("Error saving flower:", err);
      alert("Failed to save flower. Please try again.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateFlower = async (flowerId, updatedData) => {
    try {
      setIsLoading(true);
      const updated = await updateFlower(flowerId, updatedData);
      setFlowers(prev => prev.map(flower =>
        flower.id === flowerId ? updated : flower
      ));
      setCurrentView('gallery');
      return flowerId;
    } catch (err) {
      console.error("Error updating flower:", err);
      alert("Failed to update flower. Please try again.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFlower = async (flowerId) => {
    try {
      setIsLoading(true);
      await deleteFlower(flowerId);
      setFlowers(prev => prev.filter(flower => flower.id !== flowerId));

      if (selectedFlower?.id === flowerId) {
        handleBackToGallery();
      }
    } catch (err) {
      console.error("Error deleting flower:", err);
      alert("Failed to delete flower. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewFlower = () => {
    setEditingFlower(null);
    setCurrentView('form');
    setSelectedFlower(null);
    setSidebarOpen(false);
  };

  const handleEditFlower = (flower) => {
    setEditingFlower(flower);
    setCurrentView('form');
    setSelectedFlower(null);
  };

  const handleSelectFlower = (flower) => {
    setSelectedFlower(flower);
    setCurrentView('detail');
  };

  const handleBackToGallery = () => {
    setCurrentView('gallery');
    setSelectedFlower(null);
    setEditingFlower(null);
    window.history.replaceState({}, '', window.location.pathname);
  };

  // Loading screen
  if (isLoading && flowers.length === 0) {
    return (
      <div className="app loading-screen">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Loading flowers...</p>
        </div>
      </div>
    );
  }

  // Error screen
  if (error && flowers.length === 0) {
    return (
      <div className="app error-screen">
        <div className="error-content">
          <p>⚠️ {error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Global Pink Header - Hidden for view-only QR visitors */}
      {!isViewOnly && (
        <header className="app-header">
          <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <span></span>
            <span></span>
            <span></span>
          </button>
          <h1 className="header-title" onClick={handleBackToGallery} style={{ cursor: 'pointer' }}>
            Flower Base
          </h1>
        </header>
      )}

      {/* Global Sidebar - Hidden for view-only QR visitors */}
      {!isViewOnly && (
        <>
          <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
              <h2>Menu</h2>
              <button className="close-btn" onClick={() => setSidebarOpen(false)}>✕</button>
            </div>
            <nav className="sidebar-nav">
              <a href="#" className={`sidebar-link ${currentView === 'gallery' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); handleBackToGallery(); setSidebarOpen(false); }}>
                <span className="sidebar-icon">🏠</span>
                <span>Home</span>
              </a>
              <a href="#" className={`sidebar-link ${currentView === 'form' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); handleNewFlower(); }}>
                <span className="sidebar-icon">➕</span>
                <span>Create Space</span>
              </a>
              <a href="#" className="sidebar-link"
                onClick={(e) => { e.preventDefault(); setShowSettings(true); setSidebarOpen(false); }}>
                <span className="sidebar-icon">⚙️</span>
                <span>Settings</span>
              </a>
            </nav>
          </div>

          {/* Sidebar Overlay */}
          {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

          {/* Settings Modal */}
          {showSettings && (
            <Settings
              onClose={() => setShowSettings(false)}
              darkMode={darkMode}
              onToggleDarkMode={handleToggleDarkMode}
            />
          )}
        </>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}

      {/* Main Content */}
      <main className={`app-main ${isViewOnly ? 'view-only' : ''}`}>
        {currentView === 'gallery' && (
          <FlowerGallery
            flowers={flowers}
            onNewFlower={handleNewFlower}
            onSelectFlower={handleSelectFlower}
            onEditFlower={handleEditFlower}
            onDeleteFlower={handleDeleteFlower}
          />
        )}

        {currentView === 'form' && (
          <FlowerForm
            onSave={editingFlower ? handleUpdateFlower : handleSaveFlower}
            onCancel={handleBackToGallery}
            initialData={editingFlower}
            isEditing={!!editingFlower}
          />
        )}

        {currentView === 'detail' && selectedFlower && (
          <FlowerDetail
            flower={selectedFlower}
            allFlowers={flowers}
            onBack={handleBackToGallery}
            onEdit={() => handleEditFlower(selectedFlower)}
            onDelete={() => handleDeleteFlower(selectedFlower.id)}
            onSelectFlower={handleSelectFlower}
            isViewOnly={isViewOnly}
            translatedContent={translatedContent}
            selectedLanguage={selectedLanguage}
            summarizedContent={summarizedContent}
            showSparkle={showSparkle}
            onResetSummary={() => setSummarizedContent(null)}
          />
        )}
      </main>

      {/* Floating AI Button */}
      {isGeminiConfigured() && currentView === 'detail' && selectedFlower && (
        <FloatingAIButton
          onTranslate={async (language) => {
            setShowSparkle(true);
            setIsTranslating(true);
            setSelectedLanguage(language);
            try {
              // Check cache first
              const cacheKey = getCacheKey('translate', selectedFlower.id, language);
              const cached = getFromCache(cacheKey);

              if (cached) {
                console.log('Using cached translation');
                setTranslatedContent(cached);
              } else {
                // API call - sparkle continues until this completes
                const result = await translateFlowerContent(selectedFlower, language);
                setTranslatedContent(result);

                // Save to cache
                if (result) {
                  saveToCache(cacheKey, result);
                  console.log('Translation cached');
                }
              }
            } catch (err) {
              console.error('Translation failed:', err);
              alert('Translation failed. Please try again.');
            } finally {
              setShowSparkle(false);
              setIsTranslating(false);
            }
          }}
          onChat={() => {
            setShowFloraChat(true);
          }}
          onSummarize={async () => {
            setShowSparkle(true);
            setIsSummarizing(true);
            try {
              // Check cache first
              const cacheKey = getCacheKey('summarize', selectedFlower.id, '');
              const cached = getFromCache(cacheKey);

              if (cached) {
                console.log('Using cached summary');
                setSummarizedContent(cached);
              } else {
                // API call - sparkle continues until this completes
                const result = await summarizeFlowerContent(selectedFlower);
                setSummarizedContent(result);

                // Save to cache
                if (result) {
                  saveToCache(cacheKey, result);
                  console.log('Summary cached');
                }
              }

              // Auto-scroll to summarized content
              setTimeout(() => {
                const section = document.getElementById('summarized-section');
                if (section) {
                  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }, 100);
            } catch (err) {
              console.error('Summarize failed:', err);
              alert('Summarize failed. Please try again.');
            } finally {
              setShowSparkle(false);
              setIsSummarizing(false);
            }
          }}
          isTranslating={isTranslating}
          isSummarizing={isSummarizing}
          currentLanguage={selectedLanguage}
          onResetLanguage={() => {
            setSelectedLanguage('English');
            setTranslatedContent(null);
          }}
        />
      )}

      {/* Flora Chat Modal */}
      {showFloraChat && (
        <FloraChat
          flower={selectedFlower}
          onClose={() => setShowFloraChat(false)}
        />
      )}
    </div>
  );
}

export default App;
