/**
 * Local Storage Cache Service
 * Caches AI translations and summaries in browser storage
 * No Firebase space used - all in user's browser
 */

const CACHE_PREFIX = 'flora_ai_';
const CACHE_EXPIRY_DAYS = 7;

/**
 * Generate a cache key based on content and type
 * @param {string} type - 'translate' or 'summarize'
 * @param {string} flowerId - Flower ID
 * @param {string} extra - Extra identifier (e.g., language code)
 * @returns {string} Cache key
 */
export function getCacheKey(type, flowerId, extra = '') {
    return `${CACHE_PREFIX}${type}_${flowerId}_${extra}`;
}

/**
 * Get item from cache
 * @param {string} key - Cache key
 * @returns {object|null} Cached data or null if expired/not found
 */
export function getFromCache(key) {
    try {
        const cached = localStorage.getItem(key);
        if (!cached) return null;

        const { data, timestamp } = JSON.parse(cached);

        // Check if cache has expired
        const expiryTime = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
        if (Date.now() - timestamp > expiryTime) {
            localStorage.removeItem(key);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Cache read error:', error);
        return null;
    }
}

/**
 * Save item to cache
 * @param {string} key - Cache key
 * @param {object} data - Data to cache
 */
export function saveToCache(key, data) {
    try {
        const cacheItem = {
            data,
            timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(cacheItem));
    } catch (error) {
        console.error('Cache write error:', error);
        // If storage is full, clear old cache items
        if (error.name === 'QuotaExceededError') {
            clearOldCache();
        }
    }
}

/**
 * Clear old/expired cache items
 */
export function clearOldCache() {
    try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(CACHE_PREFIX)) {
                const cached = localStorage.getItem(key);
                if (cached) {
                    const { timestamp } = JSON.parse(cached);
                    const expiryTime = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
                    if (Date.now() - timestamp > expiryTime) {
                        keysToRemove.push(key);
                    }
                }
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
        console.error('Cache clear error:', error);
    }
}

/**
 * Get cache stats (for debugging)
 * @returns {object} Cache statistics
 */
export function getCacheStats() {
    let count = 0;
    let size = 0;

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_PREFIX)) {
            count++;
            size += (localStorage.getItem(key) || '').length;
        }
    }

    return {
        itemCount: count,
        sizeKB: Math.round(size / 1024 * 100) / 100
    };
}
