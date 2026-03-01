/**
 * Memory Optimization Example
 *
 * Demonstrates how to use all memory optimization features:
 * - Memory Manager with monitoring
 * - WeakMap caches for DOM nodes
 * - String interning for styles
 * - Object pooling for frequently created objects
 * - Lazy loading for images
 * - Cleanup handlers
 */

import { useEffect, useState } from 'react';
import { MemoryMonitor } from '../components/MemoryMonitor';
import { useMemoryManager, useMemoryCleanupHandler } from '../hooks/useMemoryManager';
import {
  domNodeCache,
  styleInterner,
  styleObjectPool,
  useLazyLoadImage,
  useLazyLoadList,
} from '../utils';

/**
 * Example: Using string interning for repeated style values
 */
function StyleOptimizationExample() {
  const styles = [
    'font-family: Arial',
    'font-family: Arial', // Duplicate - will reuse the same string
    'font-family: Times New Roman',
    'font-family: Arial', // Another duplicate
    'color: #333333',
    'color: #333333', // Duplicate
  ];

  return (
    <div>
      <h3>String Interning for Styles</h3>
      <p>Original strings: {styles.length}</p>
      <p>
        Interned strings save memory by reusing identical strings:
        {styles.map((style, i) => (
          <code key={i} style={{ display: 'block' }}>
            {styleInterner.intern(style)}
          </code>
        ))}
      </p>
      <p>String interner stats: {JSON.stringify(styleInterner.getStats())}</p>
    </div>
  );
}

/**
 * Example: Using object pooling for style objects
 */
function ObjectPoolingExample() {
  const [pooledObjects, setPooledObjects] = useState<any[]>([]);

  const createAndReleaseObjects = () => {
    // Acquire objects from pool
    const objects = Array.from({ length: 10 }, () => {
      const obj = styleObjectPool.acquire();
      obj.fontFamily = styleInterner.intern('Arial');
      obj.fontSize = 14;
      obj.color = styleInterner.intern('#333');
      return obj;
    });

    setPooledObjects(objects);

    // Release back to pool after 2 seconds
    setTimeout(() => {
      objects.forEach((obj) => styleObjectPool.release(obj));
      setPooledObjects([]);
      console.log('Released objects back to pool');
    }, 2000);
  };

  return (
    <div>
      <h3>Object Pooling</h3>
      <button onClick={createAndReleaseObjects}>
        Create 10 Style Objects (will be pooled)
      </button>
      <p>Active objects: {pooledObjects.length}</p>
      <p>Pool stats: {JSON.stringify(styleObjectPool.getStats())}</p>
    </div>
  );
}

/**
 * Example: Using WeakMap cache for DOM node computations
 */
function DOMCacheExample() {
  const [elements, setElements] = useState<HTMLElement[]>([]);

  useEffect(() => {
    // Cache computations for DOM nodes
    elements.forEach((element) => {
      if (!domNodeCache.has(element)) {
        // Compute and cache expensive calculation
        const computed = {
          width: element.offsetWidth,
          height: element.offsetHeight,
          style: window.getComputedStyle(element).cssText,
        };
        domNodeCache.set(element, computed);
      }
    });
  }, [elements]);

  const addElement = () => {
    const div = document.createElement('div');
    div.textContent = `Element ${elements.length + 1}`;
    div.style.padding = '10px';
    div.style.margin = '5px';
    div.style.background = '#f0f0f0';
    document.getElementById('dom-cache-container')?.appendChild(div);
    setElements([...elements, div]);
  };

  return (
    <div>
      <h3>DOM Node Caching with WeakMap</h3>
      <button onClick={addElement}>Add Element (cached)</button>
      <p>Cached elements: {elements.length}</p>
      <p>Cache stats: {JSON.stringify(domNodeCache.getStats())}</p>
      <div id="dom-cache-container" />
    </div>
  );
}

/**
 * Example: Using lazy loading for images
 */
function LazyImageExample({ src }: { src: string }) {
  const { imageSrc, isLoading, error, imgRef } = useLazyLoadImage(src, {
    placeholder: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999"%3ELoading...%3C/text%3E%3C/svg%3E',
    rootMargin: '50px',
  });

  return (
    <div style={{ marginBottom: '20px' }}>
      <img
        ref={imgRef}
        src={imageSrc}
        alt="Lazy loaded"
        style={{
          width: '100%',
          maxWidth: '400px',
          height: '300px',
          objectFit: 'cover',
          borderRadius: '8px',
        }}
      />
      {isLoading && <p>Loading image...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
    </div>
  );
}

/**
 * Example: Using lazy loading for lists
 */
function LazyListExample() {
  const items = Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    title: `Item ${i + 1}`,
    description: `Description for item ${i + 1}`,
  }));

  const { visibleItems, hasMore, listRef } = useLazyLoadList(items, {
    batchSize: 20,
    rootMargin: '100px',
  });

  return (
    <div>
      <h3>Lazy Loading List</h3>
      <p>
        Showing {visibleItems.length} of {items.length} items
      </p>
      <div
        ref={listRef}
        style={{
          maxHeight: '400px',
          overflow: 'auto',
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '10px',
        }}
      >
        {visibleItems.map((item) => (
          <div
            key={item.id}
            style={{
              padding: '10px',
              marginBottom: '5px',
              background: '#f9f9f9',
              borderRadius: '4px',
            }}
          >
            <strong>{item.title}</strong>
            <p style={{ margin: '5px 0 0', color: '#666' }}>{item.description}</p>
          </div>
        ))}
        {hasMore && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
            Loading more...
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Example: Custom cleanup handler
 */
function CustomCleanupExample() {
  const [data, setData] = useState<string[]>([]);

  // Register cleanup handler that will be called when memory is low
  useMemoryCleanupHandler(
    'custom-data-cleanup',
    () => {
      console.log('[CustomCleanup] Clearing data...');
      setData([]);
    },
    40 // Priority: will run during normal cleanup
  );

  const generateData = () => {
    const newData = Array.from({ length: 1000 }, (_, i) => `Data item ${i}`);
    setData(newData);
  };

  return (
    <div>
      <h3>Custom Cleanup Handler</h3>
      <button onClick={generateData}>Generate 1000 Items</button>
      <p>Items in memory: {data.length}</p>
      <p style={{ color: '#666', fontSize: '14px' }}>
        Data will be automatically cleared during cleanup when memory is low
      </p>
    </div>
  );
}

/**
 * Main Example Component
 */
export function MemoryOptimizationExample() {
  const memoryManager = useMemoryManager({
    enableInDev: true,
    enableInProd: false,
    interval: 2000,
    maxHeapSize: 1024 * 1024 * 1024, // 1GB
    warningThreshold: 0.75,
    criticalThreshold: 0.90,
  });

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Memory Optimization Examples</h1>

      <div style={{ marginBottom: '20px', padding: '15px', background: '#f0f8ff', borderRadius: '8px' }}>
        <h3 style={{ marginTop: 0 }}>Memory Status</h3>
        <p>Monitoring: {memoryManager.isMonitoring ? '✅ Active' : '❌ Inactive'}</p>
        <p>
          Status:{' '}
          {memoryManager.isCritical ? '🔴 Critical' : memoryManager.isWarning ? '🟡 Warning' : '🟢 Normal'}
        </p>
        {memoryManager.stats && (
          <p>
            Heap Usage: {(memoryManager.stats.heapUsed / 1024 / 1024).toFixed(2)} MB /{' '}
            {(memoryManager.stats.heapTotal / 1024 / 1024).toFixed(2)} MB
          </p>
        )}
        <div style={{ marginTop: '10px' }}>
          <button onClick={memoryManager.triggerCleanup} style={{ marginRight: '10px' }}>
            Trigger Cleanup
          </button>
          <button onClick={memoryManager.triggerAggressiveCleanup} style={{ marginRight: '10px' }}>
            Aggressive Cleanup
          </button>
          <button onClick={memoryManager.printCacheStats} style={{ marginRight: '10px' }}>
            Print Cache Stats
          </button>
          <button onClick={memoryManager.printPoolStats}>Print Pool Stats</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        <section style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <StyleOptimizationExample />
        </section>

        <section style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <ObjectPoolingExample />
        </section>

        <section style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <DOMCacheExample />
        </section>

        <section style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <CustomCleanupExample />
        </section>

        <section style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px', gridColumn: '1 / -1' }}>
          <LazyListExample />
        </section>

        <section style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px', gridColumn: '1 / -1' }}>
          <h3>Lazy Loading Images</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <LazyImageExample src="https://picsum.photos/400/300?random=1" />
            <LazyImageExample src="https://picsum.photos/400/300?random=2" />
            <LazyImageExample src="https://picsum.photos/400/300?random=3" />
          </div>
        </section>
      </div>

      {/* Memory Monitor - visible in dev mode */}
      <MemoryMonitor position="bottom-right" detailed={true} />
    </div>
  );
}

export default MemoryOptimizationExample;
