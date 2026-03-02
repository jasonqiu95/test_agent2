/**
 * Object Pooling
 *
 * Reuses frequently created objects to reduce garbage collection pressure:
 * - Style objects
 * - DOM measurements
 * - Temporary calculation objects
 */

import { memoryManager } from '../services/memory-manager';

export interface PoolableObject {
  reset(): void;
}

/**
 * Generic Object Pool
 */
export class ObjectPool<T extends PoolableObject> implements Disposable {
  private available: T[] = [];
  private inUse = new Set<T>();
  private factory: () => T;
  private maxSize: number;
  private name: string;

  // Statistics
  private created = 0;
  private reused = 0;

  constructor(name: string, factory: () => T, initialSize: number = 10, maxSize: number = 100) {
    this.name = name;
    this.factory = factory;
    this.maxSize = maxSize;

    // Pre-allocate initial objects
    for (let i = 0; i < initialSize; i++) {
      this.available.push(this.factory());
      this.created++;
    }

    // Register with memory manager
    memoryManager.registerDisposable(this);

    // Register cleanup handler
    memoryManager.registerCleanupHandler({
      name: `pool-${name}`,
      priority: 20,
      cleanup: () => this.shrink(),
    });
  }

  /**
   * Acquire an object from the pool
   */
  acquire(): T {
    let obj: T;

    if (this.available.length > 0) {
      obj = this.available.pop()!;
      this.reused++;
    } else {
      obj = this.factory();
      this.created++;
    }

    this.inUse.add(obj);
    return obj;
  }

  /**
   * Release an object back to the pool
   */
  release(obj: T): void {
    if (!this.inUse.has(obj)) {
      console.warn(`[ObjectPool:${this.name}] Attempting to release object not from pool`);
      return;
    }

    this.inUse.delete(obj);

    // Reset the object
    obj.reset();

    // Only keep if under max size
    if (this.available.length < this.maxSize) {
      this.available.push(obj);
    }
  }

  /**
   * Shrink pool to reduce memory usage
   */
  shrink(): void {
    const targetSize = Math.floor(this.available.length / 2);
    this.available.splice(targetSize);
    console.log(`[ObjectPool:${this.name}] Shrunk to ${this.available.length} objects`);
  }

  /**
   * Clear all available objects
   */
  clear(): void {
    this.available = [];
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      name: this.name,
      available: this.available.length,
      inUse: this.inUse.size,
      created: this.created,
      reused: this.reused,
      reuseRate: this.reused / (this.created + this.reused) || 0,
    };
  }

  dispose(): void {
    this.clear();
    this.inUse.clear();
    memoryManager.unregisterDisposable(this);
    memoryManager.unregisterCleanupHandler(`pool-${this.name}`);
  }
}

interface Disposable {
  dispose(): void;
}

/**
 * Style Object for pooling
 */
export class PooledStyleObject implements PoolableObject {
  public fontFamily: string = '';
  public fontSize: number = 0;
  public fontWeight: string = '';
  public fontStyle: string = '';
  public textDecoration: string = '';
  public color: string = '';
  public backgroundColor: string = '';
  public lineHeight: number = 0;
  public letterSpacing: number = 0;
  public textAlign: string = '';

  reset(): void {
    this.fontFamily = '';
    this.fontSize = 0;
    this.fontWeight = '';
    this.fontStyle = '';
    this.textDecoration = '';
    this.color = '';
    this.backgroundColor = '';
    this.lineHeight = 0;
    this.letterSpacing = 0;
    this.textAlign = '';
  }

  copyFrom(source: Partial<PooledStyleObject>): void {
    if (source.fontFamily !== undefined) this.fontFamily = source.fontFamily;
    if (source.fontSize !== undefined) this.fontSize = source.fontSize;
    if (source.fontWeight !== undefined) this.fontWeight = source.fontWeight;
    if (source.fontStyle !== undefined) this.fontStyle = source.fontStyle;
    if (source.textDecoration !== undefined) this.textDecoration = source.textDecoration;
    if (source.color !== undefined) this.color = source.color;
    if (source.backgroundColor !== undefined) this.backgroundColor = source.backgroundColor;
    if (source.lineHeight !== undefined) this.lineHeight = source.lineHeight;
    if (source.letterSpacing !== undefined) this.letterSpacing = source.letterSpacing;
    if (source.textAlign !== undefined) this.textAlign = source.textAlign;
  }
}

/**
 * DOM Measurement Object for pooling
 */
export class PooledDOMMeasurement implements PoolableObject {
  public width: number = 0;
  public height: number = 0;
  public top: number = 0;
  public left: number = 0;
  public right: number = 0;
  public bottom: number = 0;

  reset(): void {
    this.width = 0;
    this.height = 0;
    this.top = 0;
    this.left = 0;
    this.right = 0;
    this.bottom = 0;
  }

  setFromDOMRect(rect: DOMRect): void {
    this.width = rect.width;
    this.height = rect.height;
    this.top = rect.top;
    this.left = rect.left;
    this.right = rect.right;
    this.bottom = rect.bottom;
  }

  setFromElement(element: HTMLElement): void {
    const rect = element.getBoundingClientRect();
    this.setFromDOMRect(rect);
  }
}

/**
 * Point Object for pooling (used in calculations)
 */
export class PooledPoint implements PoolableObject {
  public x: number = 0;
  public y: number = 0;

  reset(): void {
    this.x = 0;
    this.y = 0;
  }

  set(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }
}

/**
 * Rectangle Object for pooling
 */
export class PooledRectangle implements PoolableObject {
  public x: number = 0;
  public y: number = 0;
  public width: number = 0;
  public height: number = 0;

  reset(): void {
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;
  }

  set(x: number, y: number, width: number, height: number): void {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
}

/**
 * Pool Manager - Central registry for all object pools
 */
export class PoolManager {
  private static instance: PoolManager;
  private pools: ObjectPool<any>[] = [];

  private constructor() {}

  public static getInstance(): PoolManager {
    if (!PoolManager.instance) {
      PoolManager.instance = new PoolManager();
    }
    return PoolManager.instance;
  }

  register(pool: ObjectPool<any>): void {
    this.pools.push(pool);
  }

  unregister(pool: ObjectPool<any>): void {
    const index = this.pools.indexOf(pool);
    if (index !== -1) {
      this.pools.splice(index, 1);
    }
  }

  getAllStats() {
    return this.pools.map(pool => pool.getStats());
  }

  printStats(): void {
    console.log('\n=== Object Pool Statistics ===');
    for (const stats of this.getAllStats()) {
      console.log(`\n${stats.name}:`);
      console.log(`  Available: ${stats.available}`);
      console.log(`  In Use: ${stats.inUse}`);
      console.log(`  Created: ${stats.created}`);
      console.log(`  Reused: ${stats.reused}`);
      console.log(`  Reuse Rate: ${(stats.reuseRate * 100).toFixed(1)}%`);
    }
    console.log('\n==============================\n');
  }
}

// Export singleton instance
export const poolManager = PoolManager.getInstance();

// Create global pools
export const styleObjectPool = new ObjectPool(
  'style-objects',
  () => new PooledStyleObject(),
  20,
  100
);

export const domMeasurementPool = new ObjectPool(
  'dom-measurements',
  () => new PooledDOMMeasurement(),
  10,
  50
);

export const pointPool = new ObjectPool(
  'points',
  () => new PooledPoint(),
  20,
  100
);

export const rectanglePool = new ObjectPool(
  'rectangles',
  () => new PooledRectangle(),
  20,
  100
);

// Register pools with manager
poolManager.register(styleObjectPool);
poolManager.register(domMeasurementPool);
poolManager.register(pointPool);
poolManager.register(rectanglePool);
