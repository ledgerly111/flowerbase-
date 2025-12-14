import { useState, useEffect } from 'react';
import FlowerGallery from './components/FlowerGallery';
import FlowerForm from './components/FlowerForm';
import FlowerDetail from './components/FlowerDetail';
import Settings from './components/Settings';
import FloatingAIButton from './components/FloatingAIButton';
import FloraChat from './components/FloraChat';
import { getFlowers, getFlowerById, addFlower, updateFlower, deleteFlower } from './firebaseService';
import { translateFlowerContent, isGeminiConfigured } from './geminiService';
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
          {showSettings && <Settings onClose={() => setShowSettings(false)} />}
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
          />
        )}
      </main>

      {/* Floating AI Button */}
      {isGeminiConfigured() && currentView === 'detail' && selectedFlower && (
        <FloatingAIButton
          onTranslate={async (language) => {
            setIsTranslating(true);
            setSelectedLanguage(language);
            try {
              const result = await translateFlowerContent(selectedFlower, language);
              setTranslatedContent(result);
            } catch (err) {
              console.error('Translation failed:', err);
              alert('Translation failed. Please try again.');
            } finally {
              setIsTranslating(false);
            }
          }}
          onChat={() => {
            setShowFloraChat(true);
          }}
          isTranslating={isTranslating}
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
