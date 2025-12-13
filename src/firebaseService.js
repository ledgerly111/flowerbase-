// Firebase Firestore service for flower operations
import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp
} from "firebase/firestore";
import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "firebase/storage";
import { db, storage } from "./firebase";

const FLOWERS_COLLECTION = "flowers";
const STORAGE_SETTINGS_DOC = "storage_settings";

// Image compression settings - adjust these to control storage usage
const COMPRESSION_SETTINGS = {
    maxWidth: 600,      // Max width in pixels (reduce for smaller files)
    quality: 0.5,       // JPEG quality 0.1-1.0 (lower = smaller file)
    maxFileSize: 150    // Target max file size in KB
};

// Helper function to compress image before upload
const compressImage = async (base64String) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Calculate new dimensions
            if (width > COMPRESSION_SETTINGS.maxWidth) {
                height = (height * COMPRESSION_SETTINGS.maxWidth) / width;
                width = COMPRESSION_SETTINGS.maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to blob with compression
            canvas.toBlob(
                (blob) => resolve(blob),
                'image/jpeg',
                COMPRESSION_SETTINGS.quality
            );
        };
        img.src = base64String;
    });
};

// Upload image to Firebase Storage
const uploadImage = async (base64Image, flowerId, imageIndex) => {
    try {
        // Compress image first
        const blob = await compressImage(base64Image);

        // Create storage reference
        const imageRef = ref(storage, `flowers/${flowerId}/image_${imageIndex}_${Date.now()}.jpg`);

        // Upload
        await uploadBytes(imageRef, blob);

        // Get download URL
        const downloadURL = await getDownloadURL(imageRef);
        return downloadURL;
    } catch (error) {
        console.error("Error uploading image:", error);
        throw error;
    }
};

// Get all flowers
export const getFlowers = async () => {
    try {
        const q = query(collection(db, FLOWERS_COLLECTION), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        const flowers = [];
        querySnapshot.forEach((doc) => {
            flowers.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return flowers;
    } catch (error) {
        console.error("Error getting flowers:", error);
        throw error;
    }
};

// Get single flower by ID
export const getFlowerById = async (flowerId) => {
    try {
        const docRef = doc(db, FLOWERS_COLLECTION, flowerId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return {
                id: docSnap.id,
                ...docSnap.data()
            };
        }
        return null;
    } catch (error) {
        console.error("Error getting flower:", error);
        throw error;
    }
};

// Add new flower
export const addFlower = async (flowerData) => {
    try {
        // First, create the document to get an ID
        const docRef = await addDoc(collection(db, FLOWERS_COLLECTION), {
            name: flowerData.name,
            type: flowerData.type || "",
            color: flowerData.color || "",
            category: flowerData.category || "",
            parental: flowerData.parental || "",
            description: flowerData.description || "",
            bloomingSeason: flowerData.bloomingSeason || "",
            careInstructions: flowerData.careInstructions || "",
            images: [], // Will be updated after image upload
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        // Upload images if provided
        const imageUrls = [];
        if (flowerData.images && flowerData.images.length > 0) {
            for (let i = 0; i < flowerData.images.length; i++) {
                const imageUrl = await uploadImage(flowerData.images[i], docRef.id, i);
                imageUrls.push(imageUrl);
            }

            // Update document with image URLs
            await updateDoc(docRef, { images: imageUrls });
        }

        return {
            id: docRef.id,
            ...flowerData,
            images: imageUrls
        };
    } catch (error) {
        console.error("Error adding flower:", error);
        throw error;
    }
};

// Update flower
export const updateFlower = async (flowerId, flowerData) => {
    try {
        const docRef = doc(db, FLOWERS_COLLECTION, flowerId);

        // Prepare update data
        const updateData = {
            name: flowerData.name,
            type: flowerData.type || "",
            color: flowerData.color || "",
            category: flowerData.category || "",
            parental: flowerData.parental || "",
            description: flowerData.description || "",
            bloomingSeason: flowerData.bloomingSeason || "",
            careInstructions: flowerData.careInstructions || "",
            updatedAt: serverTimestamp()
        };

        // Handle images - check if there are new base64 images to upload
        if (flowerData.images && flowerData.images.length > 0) {
            const imageUrls = [];
            for (let i = 0; i < flowerData.images.length; i++) {
                const img = flowerData.images[i];
                // Check if it's a new base64 image or existing URL
                if (img.startsWith('data:')) {
                    // New image - upload it
                    const imageUrl = await uploadImage(img, flowerId, i);
                    imageUrls.push(imageUrl);
                } else {
                    // Existing URL - keep it
                    imageUrls.push(img);
                }
            }
            updateData.images = imageUrls;
        }

        await updateDoc(docRef, updateData);

        return {
            id: flowerId,
            ...flowerData,
            images: updateData.images || flowerData.images
        };
    } catch (error) {
        console.error("Error updating flower:", error);
        throw error;
    }
};

// Delete flower
export const deleteFlower = async (flowerId) => {
    try {
        // Delete the document
        await deleteDoc(doc(db, FLOWERS_COLLECTION, flowerId));

        // Note: Images in storage will remain (you can add cleanup logic later)
        return true;
    } catch (error) {
        console.error("Error deleting flower:", error);
        throw error;
    }
};

// Get storage statistics
export const getStorageStats = async () => {
    try {
        const flowers = await getFlowers();

        let totalImages = 0;
        let totalFlowers = flowers.length;

        // Count images
        flowers.forEach(flower => {
            if (flower.images) {
                totalImages += flower.images.length;
            }
        });

        // Estimate storage (average compressed image is ~80-150KB)
        const avgImageSizeKB = 100;
        const avgFlowerDataKB = 2; // Text data per flower

        const estimatedImageStorageMB = (totalImages * avgImageSizeKB) / 1024;
        const estimatedDataStorageMB = (totalFlowers * avgFlowerDataKB) / 1024;
        const totalStorageMB = estimatedImageStorageMB + estimatedDataStorageMB;

        // Free tier limits
        const freeStorageLimitMB = 5120; // 5GB for Storage
        const freeDataLimitMB = 1024;    // 1GB for Firestore

        return {
            totalFlowers,
            totalImages,
            estimatedImageStorageMB: estimatedImageStorageMB.toFixed(2),
            estimatedDataStorageMB: estimatedDataStorageMB.toFixed(2),
            totalStorageMB: totalStorageMB.toFixed(2),
            freeStorageLimitMB,
            freeDataLimitMB,
            storageUsagePercent: ((estimatedImageStorageMB / freeStorageLimitMB) * 100).toFixed(1),
            dataUsagePercent: ((estimatedDataStorageMB / freeDataLimitMB) * 100).toFixed(1),
            compressionSettings: COMPRESSION_SETTINGS
        };
    } catch (error) {
        console.error("Error getting storage stats:", error);
        throw error;
    }
};
