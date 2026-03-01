/**
 * React hook for Memory Manager integration
 */

import { useEffect, useState, useCallback } from 'react';
import { memoryManager, MemoryStats } from '../services/memory-manager';
import { cacheManager } from '../utils/cache';
import { poolManager } from '../utils/object-pool';

export interface UseMemoryManagerOptions {
  /**
   * Enable memory monitoring in development mode
   */
  enableInDev?: boolean;

  /**
   * Enable memory monitoring in production mode
   */
  enableInProd?: boolean;

  /**
   * Memory monitoring interval in milliseconds
   */
  interval?: number;

  /**
   * Maximum heap size in bytes (default: 1GB)
   */
  maxHeapSize?: number;

  /**
   * Warning threshold as percentage (0-1, default: 0.75)
   */
  warningThreshold?: number;

  /**
   * Critical threshold as percentage (0-1, default: 0.90)
   */
  criticalThreshold?: number;
}

export interface MemoryManagerState {
  isMonitoring: boolean;
  stats: MemoryStats | null;
  isWarning: boolean;
  isCritical: boolean;
}

/**
 * Hook to initialize and use the memory manager
 */
export function useMemoryManager(options: UseMemoryManagerOptions = {}) {
  const [state, setState] = useState<MemoryManagerState>({
    isMonitoring: false,
    stats: null,
    isWarning: false,
    isCritical: false,
  });

  const {
    enableInDev = true,
    enableInProd = false,
    interval = 5000,
    maxHeapSize = 1024 * 1024 * 1024, // 1GB
    warningThreshold = 0.75,
    criticalThreshold = 0.90,
  } = options;

  // Determine if monitoring should be enabled
  const shouldMonitor =
    (process.env.NODE_ENV === 'development' && enableInDev) ||
    (process.env.NODE_ENV === 'production' && enableInProd);

  // Initialize memory manager
  useEffect(() => {
    memoryManager.initialize({
      budget: {
        maxHeapSize,
        warningThreshold,
        criticalThreshold,
      },
      monitor: {
        enabled: shouldMonitor,
        interval,
        onWarning: (stats) => {
          console.warn('[useMemoryManager] Memory warning:', stats);
          setState((prev) => ({
            ...prev,
            stats,
            isWarning: true,
            isCritical: false,
          }));
        },
        onCritical: (stats) => {
          console.error('[useMemoryManager] Memory critical:', stats);
          setState((prev) => ({
            ...prev,
            stats,
            isWarning: true,
            isCritical: true,
          }));
        },
      },
    });

    setState((prev) => ({
      ...prev,
      isMonitoring: shouldMonitor,
      stats: memoryManager.getMemoryStats(),
    }));

    return () => {
      memoryManager.stopMonitoring();
    };
  }, [shouldMonitor, interval, maxHeapSize, warningThreshold, criticalThreshold]);

  // Update stats periodically
  useEffect(() => {
    if (!shouldMonitor) return;

    const timer = setInterval(() => {
      const stats = memoryManager.getMemoryStats();
      const isWarning = memoryManager.isMemoryWarning();
      const isCritical = memoryManager.isMemoryCritical();

      setState((prev) => ({
        ...prev,
        stats,
        isWarning,
        isCritical,
      }));
    }, interval);

    return () => clearInterval(timer);
  }, [shouldMonitor, interval]);

  // Trigger cleanup
  const triggerCleanup = useCallback(async () => {
    await memoryManager.triggerCleanup();
    const stats = memoryManager.getMemoryStats();
    setState((prev) => ({ ...prev, stats }));
  }, []);

  // Trigger aggressive cleanup
  const triggerAggressiveCleanup = useCallback(async () => {
    await memoryManager.triggerAggressiveCleanup();
    const stats = memoryManager.getMemoryStats();
    setState((prev) => ({ ...prev, stats }));
  }, []);

  // Get memory report
  const getMemoryReport = useCallback(() => {
    return memoryManager.getMemoryReport();
  }, []);

  // Print cache statistics
  const printCacheStats = useCallback(() => {
    cacheManager.printStats();
  }, []);

  // Print pool statistics
  const printPoolStats = useCallback(() => {
    poolManager.printStats();
  }, []);

  // Take heap snapshot
  const takeHeapSnapshot = useCallback(() => {
    memoryManager.takeHeapSnapshot();
  }, []);

  return {
    ...state,
    triggerCleanup,
    triggerAggressiveCleanup,
    getMemoryReport,
    printCacheStats,
    printPoolStats,
    takeHeapSnapshot,
  };
}

/**
 * Hook to register a cleanup handler
 */
export function useMemoryCleanupHandler(
  name: string,
  cleanup: () => void | Promise<void>,
  priority: number = 50
) {
  useEffect(() => {
    memoryManager.registerCleanupHandler({
      name,
      cleanup,
      priority,
    });

    return () => {
      memoryManager.unregisterCleanupHandler(name);
    };
  }, [name, cleanup, priority]);
}

/**
 * Hook to register a disposable object
 */
export function useDisposable(disposable: { dispose: () => void } | null) {
  useEffect(() => {
    if (!disposable) return;

    memoryManager.registerDisposable(disposable);

    return () => {
      memoryManager.unregisterDisposable(disposable);
    };
  }, [disposable]);
}
