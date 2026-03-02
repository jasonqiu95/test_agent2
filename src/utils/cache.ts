/**
 * Cache Utilities
 *
 * Provides memory-efficient caching mechanisms including:
 * - WeakMap caches for DOM nodes and computed values
 * - LRU cache with size limits
 * - String interning for repeated values
 * - Cache statistics and monitoring
 */

import { memoryManager } from '../services/memory-manager';

/**
 * WeakMap-based cache for DOM nodes and object references
 * Automatically garbage collected when keys are no longer referenced
 */
export class WeakCache<K extends object, V> {
  private cache = new WeakMap<K, V>();
  private name: string;
  private hits = 0;
  private misses = 0;

  constructor(name: string) {
    this.name = name;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.hits++;
    } else {
      this.misses++;
    }
    return value;
  }

  set(key: K, value: V): void {
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): void {
    this.cache.delete(key);
  }

  getStats() {
    return {
      name: this.name,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits / (this.hits + this.misses) || 0,
    };
  }

  clear(): void {
    // WeakMap doesn't have a clear method, create a new instance
    this.cache = new WeakMap<K, V>();
    this.hits = 0;
    this.misses = 0;
  }
}

/**
 * LRU Cache with size limits
 */
export class LRUCache<K, V> implements Disposable {
  private cache = new Map<K, V>();
  private maxSize: number;
  private name: string;
  private hits = 0;
  private misses = 0;

  constructor(name: string, maxSize: number = 100) {
    this.name = name;
    this.maxSize = maxSize;

    // Register with memory manager
    memoryManager.registerDisposable(this);
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);

    if (value !== undefined) {
      this.hits++;
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    } else {
      this.misses++;
    }

    return value;
  }

  set(key: K, value: V): void {
    // Remove if exists (to update position)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Add to end
    this.cache.set(key, value);

    // Evict oldest if over size
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  get size(): number {
    return this.cache.size;
  }

  getStats() {
    return {
      name: this.name,
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits / (this.hits + this.misses) || 0,
    };
  }

  dispose(): void {
    this.clear();
    memoryManager.unregisterDisposable(this);
  }
}

/**
 * String Interning - Reuse identical strings to save memory
 */
export class StringInterner implements Disposable {
  private strings = new Map<string, string>();
  private name: string;
  private hits = 0;
  private misses = 0;

  constructor(name: string = 'default') {
    this.name = name;

    // Register with memory manager
    memoryManager.registerDisposable(this);
  }

  /**
   * Intern a string - returns existing instance if available
   */
  intern(str: string): string {
    const existing = this.strings.get(str);

    if (existing !== undefined) {
      this.hits++;
      return existing;
    }

    this.misses++;
    this.strings.set(str, str);
    return str;
  }

  /**
   * Check if string is interned
   */
  has(str: string): boolean {
    return this.strings.has(str);
  }

  /**
   * Get cache size
   */
  get size(): number {
    return this.strings.size;
  }

  /**
   * Clear all interned strings
   */
  clear(): void {
    this.strings.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats() {
    return {
      name: this.name,
      size: this.strings.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits / (this.hits + this.misses) || 0,
      estimatedMemorySaved: this.hits * 50, // Rough estimate
    };
  }

  dispose(): void {
    this.clear();
    memoryManager.unregisterDisposable(this);
  }
}

/**
 * Computed Value Cache with dependencies tracking
 */
export class ComputedCache<K, V> implements Disposable {
  private cache = new Map<K, { value: V; deps: any[] }>();
  private name: string;
  private maxSize: number;

  constructor(name: string, maxSize: number = 50) {
    this.name = name;
    this.maxSize = maxSize;

    memoryManager.registerDisposable(this);
  }

  /**
   * Get cached value if dependencies haven't changed
   */
  get(key: K, deps: any[]): V | undefined {
    const cached = this.cache.get(key);

    if (!cached) {
      return undefined;
    }

    // Check if dependencies match
    if (this.depsEqual(cached.deps, deps)) {
      return cached.value;
    }

    // Dependencies changed, invalidate
    this.cache.delete(key);
    return undefined;
  }

  /**
   * Set computed value with dependencies
   */
  set(key: K, value: V, deps: any[]): void {
    this.cache.set(key, { value, deps: [...deps] });

    // Evict oldest if over size
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
  }

  /**
   * Check if dependencies are equal (shallow comparison)
   */
  private depsEqual(a: any[], b: any[]): boolean {
    if (a.length !== b.length) {
      return false;
    }

    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }

    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  getStats() {
    return {
      name: this.name,
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }

  dispose(): void {
    this.clear();
    memoryManager.unregisterDisposable(this);
  }
}

/**
 * Cache Manager - Central registry for all caches
 */
export class CacheManager {
  private static instance: CacheManager;
  private caches: Array<WeakCache<any, any> | LRUCache<any, any> | StringInterner | ComputedCache<any, any>> = [];

  private constructor() {
    // Register cleanup handler
    memoryManager.registerCleanupHandler({
      name: 'cache-cleanup',
      priority: 10,
      cleanup: () => this.clearAll(),
    });
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  register(cache: WeakCache<any, any> | LRUCache<any, any> | StringInterner | ComputedCache<any, any>): void {
    this.caches.push(cache);
  }

  unregister(cache: WeakCache<any, any> | LRUCache<any, any> | StringInterner | ComputedCache<any, any>): void {
    const index = this.caches.indexOf(cache);
    if (index !== -1) {
      this.caches.splice(index, 1);
    }
  }

  clearAll(): void {
    console.log(`[CacheManager] Clearing ${this.caches.length} caches...`);
    for (const cache of this.caches) {
      cache.clear();
    }
  }

  getAllStats() {
    return this.caches.map(cache => cache.getStats());
  }

  printStats(): void {
    console.log('\n=== Cache Statistics ===');
    for (const stats of this.getAllStats()) {
      console.log(`\n${stats.name}:`);
      if ('hitRate' in stats) {
        console.log(`  Hit Rate: ${((stats.hitRate as number) * 100).toFixed(1)}%`);
      }
      if ('size' in stats) {
        console.log(`  Size: ${stats.size}`);
      }
      if ('maxSize' in stats) {
        console.log(`  Max Size: ${stats.maxSize}`);
      }
      if ('estimatedMemorySaved' in stats) {
        console.log(`  Est. Memory Saved: ${((stats.estimatedMemorySaved as number) / 1024).toFixed(1)} KB`);
      }
    }
    console.log('\n========================\n');
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();

// Disposable interface
interface Disposable {
  dispose(): void;
}

/**
 * DOM Node Cache - WeakMap-based cache for DOM node computations
 */
export class DOMNodeCache extends WeakCache<HTMLElement, any> {
  constructor() {
    super('dom-nodes');
    cacheManager.register(this);
  }
}

/**
 * Style Values Interner - For repeated style strings
 */
export class StyleInterner extends StringInterner {
  constructor() {
    super('style-values');
    cacheManager.register(this);
  }
}

// Create global instances
export const domNodeCache = new DOMNodeCache();
export const styleInterner = new StyleInterner();
