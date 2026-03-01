/**
 * Utilities Index
 * Exports all utility modules for memory optimization
 */

// Cache utilities
export {
  WeakCache,
  LRUCache,
  StringInterner,
  ComputedCache,
  CacheManager,
  cacheManager,
  DOMNodeCache,
  StyleInterner,
  domNodeCache,
  styleInterner,
} from './cache';

// Object pooling
export {
  ObjectPool,
  PooledStyleObject,
  PooledDOMMeasurement,
  PooledPoint,
  PooledRectangle,
  PoolManager,
  poolManager,
  styleObjectPool,
  domMeasurementPool,
  pointPool,
  rectanglePool,
} from './object-pool';

export type { PoolableObject } from './object-pool';

// Lazy loading
export {
  lazyLoadManager,
  useLazyLoadImage,
  useLazyLoadContent,
  useLazyLoadList,
  preloadImage,
  preloadImages,
  getImageDimensions,
  imageCache,
} from './lazy-loading';

export type { LazyLoadOptions } from './lazy-loading';
