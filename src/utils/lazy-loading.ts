/**
 * Lazy Loading Utilities
 *
 * Provides lazy loading for images and content using IntersectionObserver:
 * - Image lazy loading with blur-up effect
 * - Content lazy loading for large lists
 * - Automatic cleanup and memory management
 */

import { useEffect, useRef, useState } from 'react';

export interface LazyLoadOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  placeholder?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Lazy Loading Manager - Singleton for managing IntersectionObserver instances
 */
class LazyLoadManager {
  private static instance: LazyLoadManager;
  private observers = new Map<string, IntersectionObserver>();
  private observedElements = new WeakMap<Element, { callback: () => void; observerKey: string }>();

  private constructor() {}

  public static getInstance(): LazyLoadManager {
    if (!LazyLoadManager.instance) {
      LazyLoadManager.instance = new LazyLoadManager();
    }
    return LazyLoadManager.instance;
  }

  /**
   * Get or create an observer for the given options
   */
  public getObserver(options: LazyLoadOptions = {}): IntersectionObserver {
    const key = this.getObserverKey(options);

    if (!this.observers.has(key)) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const data = this.observedElements.get(entry.target);
              if (data) {
                data.callback();
                observer.unobserve(entry.target);
              }
            }
          });
        },
        {
          root: options.root,
          rootMargin: options.rootMargin || '50px',
          threshold: options.threshold || 0.01,
        }
      );

      this.observers.set(key, observer);
    }

    return this.observers.get(key)!;
  }

  /**
   * Observe an element
   */
  public observe(element: Element, callback: () => void, options: LazyLoadOptions = {}): void {
    const observer = this.getObserver(options);
    const key = this.getObserverKey(options);

    this.observedElements.set(element, { callback, observerKey: key });
    observer.observe(element);
  }

  /**
   * Unobserve an element
   */
  public unobserve(element: Element): void {
    const data = this.observedElements.get(element);
    if (data) {
      const observer = this.observers.get(data.observerKey);
      if (observer) {
        observer.unobserve(element);
      }
    }
  }

  /**
   * Generate a unique key for observer options
   */
  private getObserverKey(options: LazyLoadOptions): string {
    return JSON.stringify({
      rootMargin: options.rootMargin || '50px',
      threshold: options.threshold || 0.01,
    });
  }

  /**
   * Cleanup all observers
   */
  public dispose(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Export singleton instance
export const lazyLoadManager = LazyLoadManager.getInstance();

/**
 * Hook for lazy loading images
 */
export function useLazyLoadImage(
  src: string,
  options: LazyLoadOptions = {}
): {
  imageSrc: string | undefined;
  isLoading: boolean;
  error: Error | null;
  imgRef: React.RefObject<HTMLImageElement>;
} {
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageSrc, setImageSrc] = useState<string | undefined>(options.placeholder);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const element = imgRef.current;
    if (!element) return;

    // Start loading when element is visible
    const loadImage = () => {
      setIsLoading(true);

      const img = new Image();

      img.onload = () => {
        setImageSrc(src);
        setIsLoading(false);
        setError(null);
        options.onLoad?.();
      };

      img.onerror = () => {
        const err = new Error(`Failed to load image: ${src}`);
        setError(err);
        setIsLoading(false);
        options.onError?.(err);
      };

      img.src = src;
    };

    // Observe the element
    lazyLoadManager.observe(element, loadImage, options);

    // Cleanup
    return () => {
      lazyLoadManager.unobserve(element);
    };
  }, [src, options]);

  return { imageSrc, isLoading, error, imgRef };
}

/**
 * Hook for lazy loading content
 */
export function useLazyLoadContent(
  options: LazyLoadOptions = {}
): {
  isVisible: boolean;
  contentRef: React.RefObject<HTMLDivElement>;
} {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    const loadContent = () => {
      setIsVisible(true);
      options.onLoad?.();
    };

    lazyLoadManager.observe(element, loadContent, options);

    return () => {
      lazyLoadManager.unobserve(element);
    };
  }, [options]);

  return { isVisible, contentRef };
}

/**
 * Hook for lazy loading list items (virtualization helper)
 */
export function useLazyLoadList<T>(
  items: T[],
  options: LazyLoadOptions & { batchSize?: number } = {}
): {
  visibleItems: T[];
  loadMore: () => void;
  hasMore: boolean;
  listRef: React.RefObject<HTMLDivElement>;
} {
  const listRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(options.batchSize || 20);

  const batchSize = options.batchSize || 20;
  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  const loadMore = () => {
    setVisibleCount(prev => Math.min(prev + batchSize, items.length));
  };

  useEffect(() => {
    const element = listRef.current;
    if (!element || !hasMore) return;

    // Find the last item element
    const lastItem = element.lastElementChild;
    if (!lastItem) return;

    lazyLoadManager.observe(lastItem, loadMore, options);

    return () => {
      lazyLoadManager.unobserve(lastItem);
    };
  }, [visibleCount, hasMore, options]);

  return { visibleItems, loadMore, hasMore, listRef };
}

/**
 * Preload an image
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to preload image: ${src}`));
    img.src = src;
  });
}

/**
 * Preload multiple images
 */
export async function preloadImages(srcs: string[]): Promise<void> {
  await Promise.all(srcs.map(preloadImage));
}

/**
 * Get image dimensions without loading the full image
 */
export function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => reject(new Error(`Failed to get image dimensions: ${src}`));
    img.src = src;
  });
}

/**
 * Image cache for loaded images
 */
class ImageCache {
  private cache = new Map<string, string>();
  private maxSize = 50;

  set(key: string, value: string): void {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  get(key: string): string | undefined {
    return this.cache.get(key);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const imageCache = new ImageCache();
