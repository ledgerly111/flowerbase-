import { useState, useEffect } from 'react';
import QRGenerator from './QRGenerator';
import './FlowerForm.css';

export default function FlowerForm({ onSave, onCancel, initialData = null, isEditing = false }) {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        type: initialData?.type || '',
        color: initialData?.color || '',
        category: initialData?.category || '',
        parental: initialData?.parental || '',
        bloomingSeason: initialData?.bloomingSeason || '',
        careInstructions: initialData?.careInstructions || '',
        description: initialData?.description || '',
        images: initialData?.images || []
    });

    const [imagePreviews, setImagePreviews] = useState(initialData?.images || []);
    const [showQR, setShowQR] = useState(false);
    const [savedFlowerId, setSavedFlowerId] = useState(initialData?.id || null);

    // Update form data when initialData changes (for edit mode)
    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                type: initialData.type || '',
                color: initialData.color || '',
                category: initialData.category || '',
                parental: initialData.parental || '',
                bloomingSeason: initialData.bloomingSeason || '',
                careInstructions: initialData.careInstructions || '',
                description: initialData.description || '',
                images: initialData.images || []
            });
            setImagePreviews(initialData.images || []);
            setSavedFlowerId(initialData.id || null);
        }
    }, [initialData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            const newImagePromises = files.map(file => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(file);
                });
            });

            Promise.all(newImagePromises).then(newImages => {
                setImagePreviews(prev => [...prev, ...newImages]);
                setFormData(prev => ({
                    ...prev,
                    images: [...prev.images, ...newImages]
                }));
            });
        }
    };

    const handleRemoveImage = (index) => {
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            alert('Please enter a flower name');
            return;
        }

        if (isEditing && initialData?.id) {
            // Update existing flower
            onSave(initialData.id, formData);
        } else {
            // Create new flower
            onSave(formData);
        }
    };

    const handleGenerateQR = () => {
        if (!savedFlowerId) {
            // Save first if not saved
            if (isEditing && initialData?.id) {
                const flowerId = onSave(initialData.id, formData);
                setSavedFlowerId(flowerId);
            } else {
                const flowerId = onSave(formData);
                setSavedFlowerId(flowerId);
            }
        }
        setShowQR(true);
    };

    if (showQR && savedFlowerId) {
        return (
            <QRGenerator
                flowerId={savedFlowerId}
                flowerName={formData.name}
                onClose={() => setShowQR(false)}
                onBack={onCancel}
            />
        );
    }

    return (
        <div className="form-container fade-in">
            <div className="form-header">
                <button className="back-btn" onClick={onCancel} title="Back to Gallery">
                    ← Back
                </button>
                <h2>{isEditing ? 'Edit Flower' : 'Create New Flower Space'}</h2>
            </div>

            <form className="flower-form" onSubmit={handleSubmit}>
                {/* Image Upload */}
                <div className="form-section">
                    <label className="form-label">Flower Photos</label>
                    <div className="image-upload-area">
                        {imagePreviews.length > 0 ? (
                            <div className="image-previews-grid">
                                {imagePreviews.map((preview, index) => (
                                    <div key={index} className="image-preview-wrapper">
                                        <img src={preview} alt={`Preview ${index + 1}`} className="image-preview" draggable="false" />
                                        <button
                                            type="button"
                                            className="remove-image-btn"
                                            onClick={() => handleRemoveImage(index)}
                                            title="Remove this image"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    className="add-more-images-btn"
                                    onClick={() => document.getElementById('imageInput').click()}
                                >
                                    + Add More
                                </button>
                            </div>
                        ) : (
                            <label htmlFor="imageInput" className="upload-placeholder">
                                <div className="upload-icon">📸</div>
                                <p>Click to upload flower photos</p>
                                <span className="upload-hint">JPG, PNG or GIF - Multiple images supported</span>
                            </label>
                        )}
                        <input
                            type="file"
                            id="imageInput"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            style={{ display: 'none' }}
                        />
                    </div>
                </div>

                {/* Basic Details */}
                <div className="form-section">
                    <label className="form-label">Flower Name *</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g., Sunset Rose Hybrid"
                        required
                    />
                </div>

                <div className="form-row">
                    <div className="form-section">
                        <label className="form-label">Type</label>
                        <input
                            type="text"
                            name="type"
                            value={formData.type}
                            onChange={handleInputChange}
                            placeholder="e.g., Rose, Lily, Orchid"
                        />
                    </div>

                    <div className="form-section">
                        <label className="form-label">Color</label>
                        <input
                            type="text"
                            name="color"
                            value={formData.color}
                            onChange={handleInputChange}
                            placeholder="e.g., Deep Purple"
                        />
                    </div>
                </div>

                <div className="form-section">
                    <label className="form-label">Blooming Season</label>
                    <input
                        type="text"
                        name="bloomingSeason"
                        value={formData.bloomingSeason}
                        onChange={handleInputChange}
                        placeholder="e.g., Spring, Summer, Year-round"
                    />
                </div>

                {/* Category and Parental */}
                <div className="form-row">
                    <div className="form-section">
                        <label className="form-label">Category</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                        >
                            <option value="">Select category...</option>
                            <option value="Flower">Flower</option>
                            <option value="Fruit">Fruit</option>
                            <option value="Vegetable">Vegetable</option>
                            <option value="Herb">Herb</option>
                            <option value="Tree">Tree</option>
                            <option value="Shrub">Shrub</option>
                            <option value="Succulent">Succulent</option>
                            <option value="Cactus">Cactus</option>
                            <option value="Vine">Vine</option>
                            <option value="Fern">Fern</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="form-section">
                        <label className="form-label">Parental (Parent Plants)</label>
                        <input
                            type="text"
                            name="parental"
                            value={formData.parental}
                            onChange={handleInputChange}
                            placeholder="e.g., Red Rose, White Lily"
                        />
                        <span className="form-hint">Enter parent plant names, separated by commas</span>
                    </div>
                </div>

                <div className="form-section">
                    <label className="form-label">Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Describe this beautiful hybrid flower..."
                        rows="3"
                    />
                </div>

                <div className="form-section">
                    <label className="form-label">Care Instructions</label>
                    <textarea
                        name="careInstructions"
                        value={formData.careInstructions}
                        onChange={handleInputChange}
                        placeholder="How to care for this flower..."
                        rows="4"
                    />
                </div>

                {/* Action Buttons */}
                <div className="form-actions">
                    <button type="submit" className="btn btn-primary">
                        {isEditing ? '💾 Update Flower' : '💾 Save Flower'}
                    </button>
                    {savedFlowerId && (
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleGenerateQR}
                            style={{ background: 'var(--gradient-accent)' }}
                        >
                            Generate QR Code
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
