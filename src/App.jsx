import { useState, useEffect } from 'react';
import FlowerGallery from './components/FlowerGallery';
import FlowerForm from './components/FlowerForm';
import FlowerDetail from './components/FlowerDetail';
import { getFlowers, getFlowerById, addFlower, updateFlower, deleteFlower } from './firebaseService';
import './App.css';

function App() {
  const [flowers, setFlowers] = useState([]);
  const [currentView, setCurrentView] = useState('gallery'); // 'gallery', 'form', 'detail'
  const [selectedFlower, setSelectedFlower] = useState(null);
  const [editingFlower, setEditingFlower] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}

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
        />
      )}
    </div>
  );
}

export default App;
