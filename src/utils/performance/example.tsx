/**
 * Example usage of Performance Profiling Infrastructure
 * This file demonstrates various ways to use the performance monitoring system
 */

import React, { useState, useEffect, Profiler } from 'react';
import {
  performanceManager,
  performanceTimer,
  memoryTracker,
  createProfilerCallback,
  startTiming,
  endTiming,
  measureAsync,
  measureSync,
} from './index';

import {
  useRenderTime,
  useMemoryUsage,
  useOperationTiming,
  usePerformanceMonitor,
} from '../../hooks/usePerformance';

import { PerformanceMonitor } from '../../components/PerformanceMonitor';

// Example 1: Initialize performance tracking in your app
export function initializePerformanceTracking() {
  performanceManager.init({
    enabled: process.env.NODE_ENV === 'development',
    trackTiming: true,
    trackMemory: true,
    trackRenders: true,
    memoryTrackingInterval: 1000,
  });
}

// Example 2: Manual timing with utility functions
export function manualTimingExample() {
  // Start timing
  startTiming('dataProcessing');

  // Simulate some work
  for (let i = 0; i < 1000000; i++) {
    Math.sqrt(i);
  }

  // End timing and get duration
  const duration = endTiming('dataProcessing');
  console.log(`Data processing took ${duration}ms`);

  // Get statistics
  const stats = performanceTimer.getStats('dataProcessing');
  if (stats) {
    console.log(`Average: ${stats.average}ms, Min: ${stats.min}ms, Max: ${stats.max}ms`);
  }
}

// Example 3: Measure async operations
export async function asyncOperationExample() {
  const { result, duration } = await measureAsync('fetchUserData', async () => {
    const response = await fetch('/api/users');
    return await response.json();
  });

  console.log(`Fetched ${result.length} users in ${duration}ms`);
}

// Example 4: Measure sync operations
export function syncOperationExample(data: any[]) {
  const { result, duration } = measureSync('sortData', () => {
    return data.sort((a, b) => a.value - b.value);
  });

  console.log(`Sorted ${result.length} items in ${duration}ms`);
}

// Example 5: Component with render time tracking
export function TrackedComponent() {
  const { renderCount } = useRenderTime('TrackedComponent');
  const [count, setCount] = useState(0);

  return (
    <div>
      <h2>Tracked Component</h2>
      <p>Rendered {renderCount} times</p>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}

// Example 6: Component with memory tracking
export function MemoryTrackedComponent() {
  const { memoryData, isSupported, formatBytes } = useMemoryUsage(1000);

  if (!isSupported) {
    return <div>Memory tracking not supported in this browser</div>;
  }

  if (!memoryData) {
    return <div>Loading memory data...</div>;
  }

  return (
    <div>
      <h2>Memory Usage</h2>
      <p>Used: {formatBytes(memoryData.usedJSHeapSize)}</p>
      <p>Total: {formatBytes(memoryData.totalJSHeapSize)}</p>
      <p>Limit: {formatBytes(memoryData.jsHeapSizeLimit)}</p>
      <p>
        Usage: {((memoryData.usedJSHeapSize / memoryData.jsHeapSizeLimit) * 100).toFixed(2)}%
      </p>
    </div>
  );
}

// Example 7: Component with operation timing
export function OperationTimingComponent() {
  const { startOperation, endOperation, measureAsync, timings, clearAll } = useOperationTiming();
  const [data, setData] = useState<any[]>([]);

  const loadData = async () => {
    const { result } = await measureAsync('loadData', async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return Array.from({ length: 100 }, (_, i) => ({ id: i, value: Math.random() }));
    });

    setData(result);
  };

  const processData = () => {
    startOperation('processData');

    // Simulate heavy processing
    const processed = data.map(item => ({
      ...item,
      processed: Math.sqrt(item.value),
    }));

    endOperation('processData');
    setData(processed);
  };

  return (
    <div>
      <h2>Operation Timing</h2>
      <button onClick={loadData}>Load Data</button>
      <button onClick={processData} disabled={data.length === 0}>
        Process Data
      </button>
      <button onClick={clearAll}>Clear Timings</button>

      <div>
        <h3>Timing Statistics</h3>
        {Array.from(timings.entries()).map(([name, stats]) => (
          <div key={name}>
            <strong>{name}:</strong>
            <p>Count: {stats.count}</p>
            <p>Average: {stats.average.toFixed(2)}ms</p>
            <p>Min: {stats.min.toFixed(2)}ms</p>
            <p>Max: {stats.max.toFixed(2)}ms</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Example 8: Component with performance monitoring
export function PerformancePanel() {
  const { metrics, exportData, downloadData, clearAllData, toggleEnabled } =
    usePerformanceMonitor(1000);

  return (
    <div>
      <h2>Performance Monitor</h2>
      <div>
        <button onClick={toggleEnabled}>
          {metrics.isEnabled ? 'Disable' : 'Enable'} Monitoring
        </button>
        <button onClick={clearAllData}>Clear All Data</button>
        <button onClick={() => downloadData('performance-report.json')}>
          Download Report
        </button>
      </div>

      {metrics.isEnabled && (
        <div>
          <h3>Current Metrics</h3>

          {metrics.memorySnapshot && (
            <div>
              <h4>Memory</h4>
              <p>Used: {(metrics.memorySnapshot.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB</p>
              <p>Total: {(metrics.memorySnapshot.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          )}

          {metrics.timingStats.size > 0 && (
            <div>
              <h4>Timing Stats</h4>
              {Array.from(metrics.timingStats.entries()).map(([name, stats]) => (
                <div key={name}>
                  <strong>{name}:</strong> {stats.average.toFixed(2)}ms avg ({stats.count} calls)
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Example 9: React Profiler wrapper
export function ProfiledApp() {
  return (
    <Profiler id="App" onRender={createProfilerCallback()}>
      <AppContent />
    </Profiler>
  );
}

function AppContent() {
  return (
    <div>
      <h1>My App</h1>
      <TrackedComponent />
      <MemoryTrackedComponent />
    </div>
  );
}

// Example 10: Complete app with PerformanceMonitor component
export function AppWithPerformanceMonitor() {
  // Initialize on mount
  useEffect(() => {
    performanceManager.init({
      enabled: true,
      trackTiming: true,
      trackMemory: true,
      trackRenders: true,
      memoryTrackingInterval: 1000,
    });

    return () => {
      // Clean up on unmount
      performanceManager.clearAll();
    };
  }, []);

  return (
    <>
      <div className="app">
        <h1>Book Publishing App</h1>
        <TrackedComponent />
        <OperationTimingComponent />
        <MemoryTrackedComponent />
        <PerformancePanel />
      </div>

      {/* Performance Monitor - only renders in development */}
      <PerformanceMonitor position="bottom-right" refreshInterval={1000} />
    </>
  );
}

// Example 11: Memory snapshot comparison
export function memorySnapshotExample() {
  // Take initial snapshot
  const before = memoryTracker.takeSnapshot('before-operation');

  // Perform memory-intensive operation
  const largeArray = new Array(1000000).fill(0).map((_, i) => ({
    id: i,
    data: Math.random(),
  }));

  // Take snapshot after
  const after = memoryTracker.takeSnapshot('after-operation');

  if (before && after) {
    const diff = memoryTracker.getDifference(before, after);
    console.log(`Memory increased by ${memoryTracker.formatBytes(diff.usedDiff)}`);
    console.log(`Percentage change: ${diff.percentageChange.toFixed(2)}%`);
  }

  // Clean up
  largeArray.length = 0;
}

// Example 12: Export all performance data
export function exportPerformanceData() {
  // Get JSON string
  const jsonData = performanceManager.exportAllToJSON();
  console.log('Performance Data:', jsonData);

  // Or download as file
  performanceManager.downloadPerformanceData('performance-report.json');
}

// Example 13: Toggle performance tracking at runtime
export function PerformanceToggle() {
  const [enabled, setEnabled] = useState(performanceManager.isEnabled());

  const toggle = () => {
    const newState = !enabled;
    performanceManager.setEnabled(newState);
    setEnabled(newState);
  };

  return (
    <button onClick={toggle}>
      Performance Tracking: {enabled ? 'ON' : 'OFF'}
    </button>
  );
}
