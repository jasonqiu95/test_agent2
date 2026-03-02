/**
 * Custom React hooks for performance monitoring
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  performanceTimer,
  memoryTracker,
  performanceManager,
  type MemorySnapshot,
  type TimingStats,
} from '../utils/performance';

/**
 * Hook to track component render time
 */
export function useRenderTime(componentName: string) {
  const renderCount = useRef(0);
  const startTime = useRef(0);

  useEffect(() => {
    // Record render start time
    startTime.current = performance.now();
    renderCount.current += 1;

    return () => {
      // Record render end time when component unmounts or updates
      if (performanceManager.isEnabled() && startTime.current > 0) {
        const endTime = performance.now();
        const duration = endTime - startTime.current;

        // Log render time
        console.debug(
          `[Render Time] ${componentName}: ${duration.toFixed(2)}ms (render #${renderCount.current})`
        );
      }
    };
  });

  return {
    renderCount: renderCount.current,
  };
}

/**
 * Hook to track and monitor memory usage
 */
export function useMemoryUsage(intervalMs: number = 1000) {
  const [memoryData, setMemoryData] = useState<MemorySnapshot | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(memoryTracker.isSupported());

    if (!performanceManager.isEnabled() || !memoryTracker.isSupported()) {
      return;
    }

    // Take initial snapshot
    const initialSnapshot = memoryTracker.takeSnapshot('useMemoryUsage-initial');
    if (initialSnapshot) {
      setMemoryData(initialSnapshot);
    }

    // Set up interval for periodic snapshots
    const intervalId = setInterval(() => {
      const snapshot = memoryTracker.getCurrentMemoryUsage();
      if (snapshot) {
        setMemoryData(snapshot);
      }
    }, intervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [intervalMs]);

  return {
    memoryData,
    isSupported,
    formatBytes: memoryTracker.formatBytes.bind(memoryTracker),
  };
}

/**
 * Hook to track operation timing with manual control
 */
export function useOperationTiming() {
  const [timings, setTimings] = useState<Map<string, TimingStats>>(new Map());

  const startOperation = useCallback((operationName: string) => {
    if (!performanceManager.isEnabled()) return;
    performanceTimer.start(operationName);
  }, []);

  const endOperation = useCallback((operationName: string) => {
    if (!performanceManager.isEnabled()) return null;

    const duration = performanceTimer.end(operationName);

    // Update timings state
    const stats = performanceTimer.getStats(operationName);
    if (stats) {
      setTimings(prev => {
        const updated = new Map(prev);
        updated.set(operationName, stats);
        return updated;
      });
    }

    return duration;
  }, []);

  const measureAsync = useCallback(
    async <T,>(operationName: string, operation: () => Promise<T>) => {
      if (!performanceManager.isEnabled()) {
        return { result: await operation(), duration: 0 };
      }

      const result = await performanceTimer.measure(operationName, operation);

      // Update timings state
      const stats = performanceTimer.getStats(operationName);
      if (stats) {
        setTimings(prev => {
          const updated = new Map(prev);
          updated.set(operationName, stats);
          return updated;
        });
      }

      return result;
    },
    []
  );

  const measureSync = useCallback(
    <T,>(operationName: string, operation: () => T) => {
      if (!performanceManager.isEnabled()) {
        return { result: operation(), duration: 0 };
      }

      const result = performanceTimer.measureSync(operationName, operation);

      // Update timings state
      const stats = performanceTimer.getStats(operationName);
      if (stats) {
        setTimings(prev => {
          const updated = new Map(prev);
          updated.set(operationName, stats);
          return updated;
        });
      }

      return result;
    },
    []
  );

  const getOperationStats = useCallback((operationName: string) => {
    return performanceTimer.getStats(operationName);
  }, []);

  const clearOperation = useCallback((operationName: string) => {
    performanceTimer.clearOperation(operationName);
    setTimings(prev => {
      const updated = new Map(prev);
      updated.delete(operationName);
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    performanceTimer.clear();
    setTimings(new Map());
  }, []);

  return {
    startOperation,
    endOperation,
    measureAsync,
    measureSync,
    getOperationStats,
    clearOperation,
    clearAll,
    timings,
  };
}

/**
 * Hook to monitor overall performance metrics
 */
export function usePerformanceMonitor(refreshIntervalMs: number = 1000) {
  const [metrics, setMetrics] = useState({
    timingStats: new Map<string, TimingStats>(),
    memorySnapshot: null as MemorySnapshot | null,
    componentStats: new Map<string, any>(),
    isEnabled: performanceManager.isEnabled(),
  });

  useEffect(() => {
    if (!performanceManager.isEnabled()) {
      return;
    }

    const updateMetrics = () => {
      const timingStats = performanceTimer.getAllStats();
      const memorySnapshot = memoryTracker.getCurrentMemoryUsage();
      const componentStats = new Map(); // reactProfiler.getAllComponentStats() if needed

      setMetrics({
        timingStats,
        memorySnapshot,
        componentStats,
        isEnabled: performanceManager.isEnabled(),
      });
    };

    // Initial update
    updateMetrics();

    // Set up interval for periodic updates
    const intervalId = setInterval(updateMetrics, refreshIntervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [refreshIntervalMs]);

  const exportData = useCallback(() => {
    return performanceManager.exportAllToJSON();
  }, []);

  const downloadData = useCallback((filename?: string) => {
    performanceManager.downloadPerformanceData(filename);
  }, []);

  const clearAllData = useCallback(() => {
    performanceManager.clearAll();
    setMetrics({
      timingStats: new Map(),
      memorySnapshot: null,
      componentStats: new Map(),
      isEnabled: performanceManager.isEnabled(),
    });
  }, []);

  const toggleEnabled = useCallback(() => {
    const newState = !performanceManager.isEnabled();
    performanceManager.setEnabled(newState);
    setMetrics(prev => ({ ...prev, isEnabled: newState }));
  }, []);

  return {
    metrics,
    exportData,
    downloadData,
    clearAllData,
    toggleEnabled,
  };
}
