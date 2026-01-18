/**
 * LocalStorage cache utility for offline-first experience
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: number;
}

const CACHE_VERSION = 1;
const CACHE_PREFIX = 'shuckin_cache_';

// Cache durations in milliseconds
export const CACHE_DURATIONS = {
  TEAMS: 5 * 60 * 1000,        // 5 minutes
  MESSAGES: 30 * 1000,          // 30 seconds
  MEDIA: 10 * 60 * 1000,        // 10 minutes
  GAMES: 2 * 60 * 1000,         // 2 minutes
  USER_STATS: 5 * 60 * 1000,    // 5 minutes
};

export function getCacheKey(type: string, ...ids: string[]): string {
  return `${CACHE_PREFIX}${type}_${ids.join('_')}`;
}

export function setCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    // localStorage might be full, try to clear old entries
    console.warn('Cache write failed, clearing old entries:', error);
    clearOldCache();
  }
}

export function getCache<T>(key: string, maxAge: number): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const entry: CacheEntry<T> = JSON.parse(raw);

    // Check version
    if (entry.version !== CACHE_VERSION) {
      localStorage.removeItem(key);
      return null;
    }

    // Check age
    if (Date.now() - entry.timestamp > maxAge) {
      return null; // Expired but don't remove - can use as stale
    }

    return entry.data;
  } catch (error) {
    console.warn('Cache read failed:', error);
    return null;
  }
}

export function getStaleCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const entry: CacheEntry<T> = JSON.parse(raw);
    if (entry.version !== CACHE_VERSION) {
      localStorage.removeItem(key);
      return null;
    }

    return entry.data;
  } catch (error) {
    return null;
  }
}

export function invalidateCache(keyPattern: string): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX) && key.includes(keyPattern)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Cache invalidation failed:', error);
  }
}

export function clearOldCache(): void {
  try {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));

    // Sort by timestamp and remove oldest 50%
    const entries: { key: string; timestamp: number }[] = [];
    cacheKeys.forEach((key) => {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const entry = JSON.parse(raw);
          entries.push({ key, timestamp: entry.timestamp || 0 });
        }
      } catch {
        // Remove invalid entries
        localStorage.removeItem(key);
      }
    });

    entries.sort((a, b) => a.timestamp - b.timestamp);
    const toRemove = entries.slice(0, Math.floor(entries.length / 2));
    toRemove.forEach(({ key }) => localStorage.removeItem(key));
  } catch (error) {
    console.warn('Clear old cache failed:', error);
  }
}

// Stale-while-revalidate pattern
export async function fetchWithCache<T>(
  key: string,
  maxAge: number,
  fetcher: () => Promise<T>,
  onData?: (data: T, isStale: boolean) => void
): Promise<T> {
  // Try to get fresh cache first
  const cached = getCache<T>(key, maxAge);
  if (cached) {
    onData?.(cached, false);
    return cached;
  }

  // Get stale cache while fetching
  const stale = getStaleCache<T>(key);
  if (stale && onData) {
    onData(stale, true);
  }

  // Fetch fresh data
  try {
    const data = await fetcher();
    setCache(key, data);
    onData?.(data, false);
    return data;
  } catch (error) {
    // If fetch fails and we have stale data, use it
    if (stale) {
      return stale;
    }
    throw error;
  }
}

// Image optimization utilities
export function getOptimizedImageUrl(url: string, width: number = 400): string {
  // If it's a base64 data URL, we can't optimize it server-side
  if (url.startsWith('data:')) {
    return url;
  }

  // If using a CDN that supports transforms (like Cloudinary, Imgix, etc.)
  // Add query params for resizing
  // For now, return as-is since we're using base64
  return url;
}

// Compress image before upload
export async function compressImage(
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Could not compress image'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => reject(new Error('Could not load image'));
    img.src = URL.createObjectURL(file);
  });
}

// Create thumbnail from image
export async function createThumbnail(
  dataUrl: string,
  maxWidth: number = 300,
  maxHeight: number = 300
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };

    img.onerror = () => reject(new Error('Could not load image'));
    img.src = dataUrl;
  });
}
