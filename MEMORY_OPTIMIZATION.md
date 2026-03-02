# Memory Optimization Guide

Comprehensive memory management system for handling large documents in the Vellum book publishing application.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Usage Guide](#usage-guide)
- [API Reference](#api-reference)
- [Best Practices](#best-practices)
- [Performance Profiling](#performance-profiling)

## Overview

This memory optimization system provides comprehensive tools for managing memory usage when working with large documents, including:

- **Memory Manager**: Central service for monitoring and cleanup
- **Cache System**: WeakMap and LRU caches for computed values
- **Object Pooling**: Reuse frequently created objects
- **String Interning**: Deduplicate repeated strings
- **Lazy Loading**: Load images and content on demand
- **Cleanup Handlers**: Automatic cleanup when memory is low

## Features

### 1. Memory Manager (`src/services/memory-manager.ts`)

The Memory Manager provides:
- Real-time memory monitoring
- Memory budgets and thresholds
- Automatic and manual cleanup triggers
- Heap snapshot support for profiling
- Disposable object tracking

### 2. Cache Utilities (`src/utils/cache.ts`)

**WeakCache**: Automatic garbage collection for DOM node caches
```typescript
const domCache = new WeakCache<HTMLElement, ComputedData>('dom-cache');
domCache.set(element, computedData);
const data = domCache.get(element); // Returns undefined if element is GC'd
```

**LRUCache**: Size-limited cache with least-recently-used eviction
```typescript
const cache = new LRUCache<string, Data>('my-cache', 100); // Max 100 items
cache.set('key', data);
const data = cache.get('key');
```

**StringInterner**: Deduplicate repeated strings
```typescript
const interner = new StringInterner('styles');
const style1 = interner.intern('font-family: Arial');
const style2 = interner.intern('font-family: Arial'); // Same reference as style1
```

**ComputedCache**: Cache with dependency tracking
```typescript
const computed = new ComputedCache<string, Result>('computed', 50);
computed.set('key', result, [dep1, dep2]);
const cached = computed.get('key', [dep1, dep2]); // Returns undefined if deps changed
```

### 3. Object Pooling (`src/utils/object-pool.ts`)

Reuse objects instead of creating new ones:

```typescript
import { styleObjectPool, domMeasurementPool } from './utils';

// Acquire object from pool
const styleObj = styleObjectPool.acquire();
styleObj.fontFamily = 'Arial';
styleObj.fontSize = 14;

// Use the object...

// Release back to pool
styleObjectPool.release(styleObj);
```

Available pools:
- `styleObjectPool`: Style objects
- `domMeasurementPool`: DOM measurement objects
- `pointPool`: Point coordinates
- `rectanglePool`: Rectangle dimensions

### 4. Lazy Loading (`src/utils/lazy-loading.ts`)

**Image Lazy Loading**:
```typescript
import { useLazyLoadImage } from './utils';

function MyImage({ src }: { src: string }) {
  const { imageSrc, isLoading, error, imgRef } = useLazyLoadImage(src, {
    rootMargin: '50px',
    placeholder: 'data:image/...',
  });

  return <img ref={imgRef} src={imageSrc} alt="Lazy loaded" />;
}
```

**List Lazy Loading**:
```typescript
import { useLazyLoadList } from './utils';

function MyList({ items }: { items: Item[] }) {
  const { visibleItems, hasMore, listRef } = useLazyLoadList(items, {
    batchSize: 20,
    rootMargin: '100px',
  });

  return (
    <div ref={listRef}>
      {visibleItems.map(item => <ItemComponent key={item.id} item={item} />)}
    </div>
  );
}
```

### 5. Memory Monitor Component (`src/components/MemoryMonitor`)

Visual memory monitoring for development:

```typescript
import { MemoryMonitor } from './components/MemoryMonitor';

function App() {
  return (
    <div>
      {/* Your app content */}
      <MemoryMonitor position="bottom-right" detailed={true} />
    </div>
  );
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Memory Manager                          │
│  - Monitoring & Budgets                                     │
│  - Cleanup Coordination                                     │
│  - Disposable Tracking                                      │
└────────────┬────────────────────────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼────┐      ┌────▼─────┐      ┌──────────┐
│ Caches │      │  Pools   │      │  Lazy    │
│        │      │          │      │ Loading  │
│ Weak   │      │ Style    │      │          │
│ LRU    │      │ DOM      │      │ Images   │
│ String │      │ Point    │      │ Lists    │
│ Intern │      │ Rect     │      │          │
└────────┘      └──────────┘      └──────────┘
     │               │                  │
     └───────────────┴──────────────────┘
                     │
           ┌─────────▼──────────┐
           │   Cleanup Handlers  │
           │   Priority Queue    │
           └────────────────────┘
```

## Usage Guide

### Basic Setup

1. **Initialize Memory Manager in your app**:

```typescript
import { useMemoryManager } from './hooks/useMemoryManager';

function App() {
  const memoryManager = useMemoryManager({
    enableInDev: true,
    enableInProd: false,
    interval: 5000, // Check every 5 seconds
    maxHeapSize: 1024 * 1024 * 1024, // 1GB
    warningThreshold: 0.75, // 75%
    criticalThreshold: 0.90, // 90%
  });

  return <YourApp />;
}
```

2. **Use caches for expensive computations**:

```typescript
import { domNodeCache, styleInterner } from './utils';

// Cache DOM measurements
const element = document.getElementById('my-element');
if (!domNodeCache.has(element)) {
  const measurements = {
    width: element.offsetWidth,
    height: element.offsetHeight,
    // ... other expensive computations
  };
  domNodeCache.set(element, measurements);
}

// Intern repeated strings
const fontFamily = styleInterner.intern('Arial');
const fontSize = styleInterner.intern('14px');
```

3. **Use object pooling for frequently created objects**:

```typescript
import { styleObjectPool } from './utils';

function applyStyle(element: HTMLElement) {
  const style = styleObjectPool.acquire();
  style.fontFamily = 'Arial';
  style.fontSize = 14;

  // Apply style...

  styleObjectPool.release(style);
}
```

4. **Register cleanup handlers**:

```typescript
import { useMemoryCleanupHandler } from './hooks/useMemoryManager';

function MyComponent() {
  const [cache, setCache] = useState(new Map());

  useMemoryCleanupHandler(
    'my-component-cache',
    () => {
      console.log('Clearing component cache');
      setCache(new Map());
    },
    50 // Priority (lower = higher priority)
  );

  return <div>...</div>;
}
```

### Advanced Usage

**Custom Object Pools**:

```typescript
import { ObjectPool, PoolableObject } from './utils';

class MyPooledObject implements PoolableObject {
  data: any = null;

  reset(): void {
    this.data = null;
  }
}

const myPool = new ObjectPool(
  'my-objects',
  () => new MyPooledObject(),
  10, // Initial size
  100 // Max size
);

const obj = myPool.acquire();
// Use object...
myPool.release(obj);
```

**Custom Caches**:

```typescript
import { LRUCache } from './utils';

const documentCache = new LRUCache<string, Document>('documents', 50);

function getDocument(id: string): Document {
  let doc = documentCache.get(id);
  if (!doc) {
    doc = loadDocument(id);
    documentCache.set(id, doc);
  }
  return doc;
}
```

## API Reference

### Memory Manager

```typescript
// Initialize
memoryManager.initialize({
  budget: { maxHeapSize, warningThreshold, criticalThreshold },
  monitor: { enabled, interval, onWarning, onCritical }
});

// Get stats
const stats = memoryManager.getMemoryStats();
const percentage = memoryManager.getMemoryUsagePercentage();

// Cleanup
await memoryManager.triggerCleanup(); // Normal cleanup
await memoryManager.triggerAggressiveCleanup(); // Aggressive cleanup

// Handlers
memoryManager.registerCleanupHandler({ name, priority, cleanup });
memoryManager.registerDisposable(disposable);

// Profiling
memoryManager.takeHeapSnapshot();
const report = memoryManager.getMemoryReport();
```

### Cache Manager

```typescript
// Register caches
cacheManager.register(myCache);

// Get all stats
const stats = cacheManager.getAllStats();

// Clear all caches
cacheManager.clearAll();

// Print statistics
cacheManager.printStats();
```

### Pool Manager

```typescript
// Register pools
poolManager.register(myPool);

// Get all stats
const stats = poolManager.getAllStats();

// Print statistics
poolManager.printStats();
```

## Best Practices

### 1. Use WeakMap for DOM references
```typescript
// ✅ Good - automatic cleanup
const cache = new WeakCache<HTMLElement, Data>('dom-cache');

// ❌ Bad - memory leak
const cache = new Map<HTMLElement, Data>();
```

### 2. Intern repeated strings
```typescript
// ✅ Good - save memory
const family = styleInterner.intern('Arial');

// ❌ Bad - duplicate strings
const family = 'Arial';
```

### 3. Use object pooling for hot paths
```typescript
// ✅ Good - reuse objects
const measurement = domMeasurementPool.acquire();
// ... use ...
domMeasurementPool.release(measurement);

// ❌ Bad - creates garbage
const measurement = { width: 0, height: 0 };
```

### 4. Register cleanup handlers
```typescript
// ✅ Good - cleanup on low memory
useMemoryCleanupHandler('my-cache', () => clearCache(), 40);

// ❌ Bad - no cleanup strategy
const cache = new Map();
```

### 5. Use lazy loading for large lists
```typescript
// ✅ Good - load on scroll
const { visibleItems } = useLazyLoadList(items, { batchSize: 20 });

// ❌ Bad - render everything
items.map(item => <Item item={item} />)
```

## Performance Profiling

### Chrome DevTools Integration

1. **Enable heap snapshots**:
   - Run app with `--expose-gc` flag
   - Click "Take Snapshot" button in Memory Monitor

2. **Compare snapshots**:
   - Take snapshot before operation
   - Perform operation
   - Take snapshot after
   - Compare in Chrome DevTools

3. **Memory profiling**:
   ```bash
   # Run with --inspect flag
   npm start -- --inspect

   # Open chrome://inspect
   # Take heap snapshots
   # Analyze memory usage
   ```

### Memory Monitoring

**In Development**:
- Use `<MemoryMonitor />` component
- Check console for memory warnings
- Use cleanup buttons to test GC

**In Production**:
- Enable monitoring with `enableInProd: true`
- Set up telemetry for memory stats
- Monitor cleanup handler execution

### Debugging Memory Leaks

1. **Enable monitoring**:
   ```typescript
   useMemoryManager({ enableInDev: true, interval: 1000 });
   ```

2. **Check cache stats**:
   ```typescript
   cacheManager.printStats();
   poolManager.printStats();
   ```

3. **Print memory report**:
   ```typescript
   console.log(memoryManager.getMemoryReport());
   ```

4. **Take heap snapshot**:
   ```typescript
   memoryManager.takeHeapSnapshot();
   ```

5. **Check listener counts**:
   ```typescript
   const counts = persistenceService.getListenerCount();
   console.log('Listeners:', counts);
   ```

## Example Implementation

See `src/examples/memory-optimization-example.tsx` for a complete working example demonstrating all features.

## Troubleshooting

### High Memory Usage

1. Check cache stats: `cacheManager.printStats()`
2. Check pool stats: `poolManager.printStats()`
3. Trigger cleanup: `memoryManager.triggerCleanup()`
4. Review cleanup handlers execution

### Memory Leaks

1. Use WeakMap for object references
2. Remove event listeners in cleanup
3. Release pooled objects after use
4. Check for circular references
5. Use heap snapshots to identify leaks

### Performance Issues

1. Increase pool sizes for hot paths
2. Use lazy loading for large lists
3. Increase cache sizes for frequent lookups
4. Reduce monitoring interval
5. Profile with Chrome DevTools

## Contributing

When adding new features that use significant memory:

1. Register cleanup handlers
2. Use appropriate caching strategies
3. Consider object pooling for hot paths
4. Add telemetry for memory usage
5. Update this documentation

## License

Part of the Vellum book publishing application.
