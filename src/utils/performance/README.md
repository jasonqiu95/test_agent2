# Performance Profiling Infrastructure

A comprehensive performance monitoring system for tracking render times, memory usage, and operation latency in React applications.

## Features

- **Timing Utilities**: Track operation execution times with detailed statistics
- **Memory Tracking**: Monitor JavaScript heap memory usage using performance.memory API
- **React Profiling**: Custom React Profiler wrapper for component render performance
- **Custom Hooks**: React hooks for easy integration into components
- **Real-time Monitor**: Visual component for displaying live performance metrics
- **Data Export**: Export profiling data to JSON format
- **Dev-Only Mode**: Automatically disabled in production builds

## Installation

The performance profiling infrastructure is already integrated into the project. Import the utilities you need:

```typescript
import { performanceManager, performanceTimer, memoryTracker } from '@/utils/performance';
import { usePerformanceMonitor, useRenderTime, useMemoryUsage, useOperationTiming } from '@/hooks/usePerformance';
import { PerformanceMonitor } from '@/components/PerformanceMonitor';
```

## Usage

### Initialize Performance Tracking

Initialize the performance manager in your app entry point (e.g., `main.tsx` or `App.tsx`):

```typescript
import { performanceManager } from '@/utils/performance';

// Initialize with default settings (enabled in development)
performanceManager.init();

// Or customize the configuration
performanceManager.init({
  enabled: true,
  trackTiming: true,
  trackMemory: true,
  trackRenders: true,
  memoryTrackingInterval: 1000, // milliseconds
});
```

### Timing Operations

Track operation execution times:

```typescript
import { performanceTimer, startTiming, endTiming, measureAsync, measureSync } from '@/utils/performance';

// Manual timing
startTiming('loadData');
// ... your code
const duration = endTiming('loadData');

// Async operations
const { result, duration } = await measureAsync('fetchAPI', async () => {
  return await fetch('/api/data');
});

// Sync operations
const { result, duration } = measureSync('processData', () => {
  return processData(data);
});

// Get statistics
const stats = performanceTimer.getStats('loadData');
console.log(`Average: ${stats.average}ms, Min: ${stats.min}ms, Max: ${stats.max}ms`);
```

### Memory Tracking

Monitor memory usage:

```typescript
import { memoryTracker, takeMemorySnapshot, getCurrentMemory, formatMemorySize } from '@/utils/performance';

// Take a snapshot
const snapshot = takeMemorySnapshot('afterLoad');

// Get current memory usage
const current = getCurrentMemory();
console.log(`Used: ${formatMemorySize(current.usedJSHeapSize)}`);

// Start automatic tracking (updates every 1 second)
memoryTracker.startTracking(1000);

// Stop automatic tracking
memoryTracker.stopTracking();

// Get statistics
const stats = memoryTracker.getStats();
console.log(`Average: ${formatMemorySize(stats.averageUsed)}`);
```

### React Hooks

#### useRenderTime

Track component render times:

```typescript
import { useRenderTime } from '@/hooks/usePerformance';

function MyComponent() {
  const { renderCount } = useRenderTime('MyComponent');

  return <div>Rendered {renderCount} times</div>;
}
```

#### useMemoryUsage

Monitor memory usage in real-time:

```typescript
import { useMemoryUsage } from '@/hooks/usePerformance';

function MemoryDisplay() {
  const { memoryData, isSupported, formatBytes } = useMemoryUsage(1000);

  if (!isSupported) {
    return <div>Memory API not supported</div>;
  }

  return (
    <div>
      <p>Used: {formatBytes(memoryData.usedJSHeapSize)}</p>
      <p>Total: {formatBytes(memoryData.totalJSHeapSize)}</p>
    </div>
  );
}
```

#### useOperationTiming

Track custom operations:

```typescript
import { useOperationTiming } from '@/hooks/usePerformance';

function DataProcessor() {
  const { startOperation, endOperation, measureAsync, timings } = useOperationTiming();

  const loadData = async () => {
    const { result, duration } = await measureAsync('loadData', async () => {
      return await fetchData();
    });
    console.log(`Data loaded in ${duration}ms`);
  };

  return (
    <div>
      <button onClick={loadData}>Load Data</button>
      {Array.from(timings.entries()).map(([name, stats]) => (
        <div key={name}>
          {name}: {stats.average.toFixed(2)}ms avg
        </div>
      ))}
    </div>
  );
}
```

#### usePerformanceMonitor

Comprehensive performance monitoring:

```typescript
import { usePerformanceMonitor } from '@/hooks/usePerformance';

function PerformancePanel() {
  const { metrics, exportData, downloadData, clearAllData, toggleEnabled } = usePerformanceMonitor(1000);

  return (
    <div>
      <button onClick={toggleEnabled}>
        {metrics.isEnabled ? 'Disable' : 'Enable'} Monitoring
      </button>
      <button onClick={clearAllData}>Clear Data</button>
      <button onClick={() => downloadData()}>Export JSON</button>

      {metrics.memorySnapshot && (
        <div>Memory: {metrics.memorySnapshot.usedJSHeapSize} bytes</div>
      )}
    </div>
  );
}
```

### Performance Monitor Component

Add the visual performance monitor to your app:

```typescript
import { PerformanceMonitor } from '@/components/PerformanceMonitor';

function App() {
  return (
    <>
      <YourAppContent />

      {/* Add PerformanceMonitor - only renders in development */}
      <PerformanceMonitor
        position="bottom-right"
        refreshInterval={1000}
        minimized={false}
      />
    </>
  );
}
```

**Props:**
- `position`: `'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'` (default: `'bottom-right'`)
- `refreshInterval`: Update interval in milliseconds (default: `1000`)
- `minimized`: Start minimized (default: `false`)

### React Profiler Wrapper

Use the React Profiler with custom callback:

```typescript
import { Profiler } from 'react';
import { createProfilerCallback } from '@/utils/performance';

function App() {
  return (
    <Profiler id="App" onRender={createProfilerCallback()}>
      <YourAppContent />
    </Profiler>
  );
}
```

### Export Performance Data

Export all profiling data to JSON:

```typescript
import { performanceManager } from '@/utils/performance';

// Get JSON string
const jsonData = performanceManager.exportAllToJSON();
console.log(jsonData);

// Download as file
performanceManager.downloadPerformanceData('performance-report.json');
```

## API Reference

### performanceManager

- `init(config?)`: Initialize with optional configuration
- `setEnabled(enabled)`: Enable/disable all tracking
- `isEnabled()`: Check if tracking is enabled
- `getConfig()`: Get current configuration
- `updateConfig(config)`: Update configuration
- `clearAll()`: Clear all performance data
- `exportAllToJSON()`: Export all data to JSON string
- `downloadPerformanceData(filename?)`: Download data as JSON file

### performanceTimer

- `start(operationName)`: Start timing an operation
- `end(operationName)`: End timing and get duration
- `measure(operationName, asyncFn)`: Measure async operation
- `measureSync(operationName, syncFn)`: Measure sync operation
- `getTimings(operationName)`: Get all timing results for an operation
- `getStats(operationName)`: Get statistics for an operation
- `clear()`: Clear all timing data
- `exportToJSON()`: Export timing data to JSON

### memoryTracker

- `takeSnapshot(label?)`: Take a memory snapshot
- `startTracking(intervalMs)`: Start automatic tracking
- `stopTracking()`: Stop automatic tracking
- `getCurrentMemoryUsage()`: Get current memory without storing
- `getSnapshots()`: Get all snapshots
- `getStats()`: Get memory statistics
- `formatBytes(bytes)`: Format bytes to human-readable string
- `clear()`: Clear all snapshots
- `exportToJSON()`: Export memory data to JSON

### reactProfiler

- `createCallback()`: Create React Profiler onRender callback
- `getMetrics(componentId)`: Get metrics for a component
- `getComponentStats(componentId)`: Get statistics for a component
- `getSlowRenders(thresholdMs)`: Get renders exceeding threshold
- `clear()`: Clear all profiling data
- `exportToJSON()`: Export profiling data to JSON

## Dev-Only Mode

The performance profiling infrastructure is automatically disabled in production builds. All utilities check `process.env.NODE_ENV === 'development'` and return early if not in development mode.

The `PerformanceMonitor` component will not render in production builds.

## Browser Support

- **Timing API**: Supported in all modern browsers
- **Memory API** (`performance.memory`): Only available in Chromium-based browsers (Chrome, Edge, Opera)

The memory tracking gracefully degrades if the API is not available.

## Best Practices

1. **Initialize early**: Call `performanceManager.init()` in your app entry point
2. **Name operations clearly**: Use descriptive names for timing operations
3. **Clean up data**: Periodically call `clearAll()` to prevent memory buildup
4. **Use hooks in components**: Leverage React hooks for component-level tracking
5. **Export data regularly**: Export profiling data for analysis
6. **Monitor slow renders**: Use `getSlowRenders()` to identify performance bottlenecks

## Example: Complete Setup

```typescript
// main.tsx or App.tsx
import { performanceManager } from '@/utils/performance';
import { PerformanceMonitor } from '@/components/PerformanceMonitor';

// Initialize performance tracking
performanceManager.init({
  enabled: process.env.NODE_ENV === 'development',
  trackTiming: true,
  trackMemory: true,
  trackRenders: true,
  memoryTrackingInterval: 1000,
});

function App() {
  return (
    <>
      <YourApplication />
      <PerformanceMonitor position="bottom-right" />
    </>
  );
}
```

## Troubleshooting

**Memory API not available:**
- The memory API is only available in Chromium-based browsers
- Other browsers will show "Memory API not supported"
- All other features will still work normally

**Performance tracking not working:**
- Ensure you've called `performanceManager.init()`
- Check that `process.env.NODE_ENV === 'development'`
- Verify tracking is enabled with `performanceManager.isEnabled()`

**Data not appearing in PerformanceMonitor:**
- Wait for the refresh interval to pass
- Ensure operations are being tracked (check console logs)
- Try clearing data and restarting tracking
