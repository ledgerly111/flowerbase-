import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import FlowerGallery from './components/FlowerGallery';
import FlowerForm from './components/FlowerForm';
import FlowerDetail from './components/FlowerDetail';
import './App.css';

function App() {
  const [flowers, setFlowers] = useState([]);
  const [currentView, setCurrentView] = useState('gallery'); // 'gallery', 'form', 'detail'
  const [selectedFlower, setSelectedFlower] = useState(null);
  const [editingFlower, setEditingFlower] = useState(null);

  // Load flowers from localStorage on mount
  useEffect(() => {
    const savedFlowers = localStorage.getItem('flowers');
    if (savedFlowers) {
      const flowersData = JSON.parse(savedFlowers);

      // Migrate old data structure (single image) to new structure (images array)
      const migratedFlowers = flowersData.map(flower => {
        if (flower.image && !flower.images) {
          const { image, ...rest } = flower; // Remove old image property
          return {
            ...rest,
            images: [image]
          };
        }
        return flower;
      });

      setFlowers(migratedFlowers);
    }

    // Check if URL has a flower parameter (from QR scan)
    const params = new URLSearchParams(window.location.search);
    const flowerId = params.get('flower');
    if (flowerId) {
      const savedFlowers = localStorage.getItem('flowers');
      if (savedFlowers) {
        const flowersData = JSON.parse(savedFlowers);
        const flower = flowersData.find(f => f.id === flowerId);
        if (flower) {
          setSelectedFlower(flower);
          setCurrentView('detail');
        }
      }
    }
  }, []);

  // Save flowers to localStorage whenever they change
  useEffect(() => {
    if (flowers.length > 0) {
      localStorage.setItem('flowers', JSON.stringify(flowers));
    } else {
      localStorage.removeItem('flowers');
    }
  }, [flowers]);

  const handleSaveFlower = (flowerData) => {
    const newFlower = {
      ...flowerData,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    };

    setFlowers(prev => [...prev, newFlower]);
    setCurrentView('gallery'); // Navigate back to gallery
    return newFlower.id; // Return the ID for QR generation
  };

  const handleUpdateFlower = (flowerId, updatedData) => {
    setFlowers(prev => prev.map(flower =>
      flower.id === flowerId
        ? { ...flower, ...updatedData, updatedAt: new Date().toISOString() }
        : flower
    ));
    setCurrentView('gallery'); // Navigate back to gallery after update
    return flowerId;
  };

  const handleDeleteFlower = (flowerId) => {
    if (window.confirm('Are you sure you want to delete this flower?')) {
      setFlowers(prev => prev.filter(flower => flower.id !== flowerId));

      // If we're viewing the deleted flower, go back to gallery
      if (selectedFlower?.id === flowerId) {
        handleBackToGallery();
      }
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
    // Clear URL parameters
    window.history.replaceState({}, '', window.location.pathname);
  };

  return (
    <div className="app">
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
          onBack={handleBackToGallery}
          onEdit={() => handleEditFlower(selectedFlower)}
          onDelete={() => handleDeleteFlower(selectedFlower.id)}
        />
      )}
    </div>
  );
}

export default App;
