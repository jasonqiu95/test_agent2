/**
 * Style Performance Profiler
 * Tools for measuring and analyzing style calculation performance
 *
 * Use these utilities to:
 * - Profile before/after optimization changes
 * - Measure cache hit rates
 * - Track render performance
 * - Identify bottlenecks
 */

import { BookStyle } from '../types/style';
import { Chapter } from '../types';
import { getStyleCacheStats, clearStyleCaches } from './style-engine';

// ============================================================================
// PERFORMANCE MEASUREMENT
// ============================================================================

interface PerformanceEntry {
  name: string;
  duration: number;
  timestamp: number;
}

class PerformanceTracker {
  private entries: PerformanceEntry[] = [];
  private startTimes = new Map<string, number>();

  start(name: string): void {
    this.startTimes.set(name, performance.now());
  }

  end(name: string): number {
    const startTime = this.startTimes.get(name);
    if (!startTime) {
      console.warn(`No start time found for: ${name}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.entries.push({
      name,
      duration,
      timestamp: Date.now(),
    });

    this.startTimes.delete(name);
    return duration;
  }

  getEntries(name?: string): PerformanceEntry[] {
    if (name) {
      return this.entries.filter(e => e.name === name);
    }
    return [...this.entries];
  }

  getAverageDuration(name: string): number {
    const entries = this.getEntries(name);
    if (entries.length === 0) return 0;

    const total = entries.reduce((sum, e) => sum + e.duration, 0);
    return total / entries.length;
  }

  clear(): void {
    this.entries = [];
    this.startTimes.clear();
  }

  getStats() {
    const groupedByName = new Map<string, PerformanceEntry[]>();

    this.entries.forEach(entry => {
      const existing = groupedByName.get(entry.name) || [];
      existing.push(entry);
      groupedByName.set(entry.name, existing);
    });

    const stats: Record<string, {
      count: number;
      average: number;
      min: number;
      max: number;
      total: number;
    }> = {};

    groupedByName.forEach((entries, name) => {
      const durations = entries.map(e => e.duration);
      stats[name] = {
        count: entries.length,
        average: durations.reduce((a, b) => a + b, 0) / durations.length,
        min: Math.min(...durations),
        max: Math.max(...durations),
        total: durations.reduce((a, b) => a + b, 0),
      };
    });

    return stats;
  }
}

// Global performance tracker
const performanceTracker = new PerformanceTracker();

// ============================================================================
// PROFILING DECORATORS
// ============================================================================

/**
 * Profile a function's execution time
 */
export function profileFunction<T extends (...args: any[]) => any>(
  fn: T,
  name?: string
): T {
  const functionName = name || fn.name || 'anonymous';

  return function (this: any, ...args: any[]) {
    performanceTracker.start(functionName);
    const result = fn.apply(this, args);
    const duration = performanceTracker.end(functionName);

    if (duration > 16) { // Longer than 1 frame at 60fps
      console.warn(`Slow function ${functionName}: ${duration.toFixed(2)}ms`);
    }

    return result;
  } as T;
}

/**
 * Profile an async function's execution time
 */
export function profileAsyncFunction<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  name?: string
): T {
  const functionName = name || fn.name || 'async-anonymous';

  return async function (this: any, ...args: any[]) {
    performanceTracker.start(functionName);
    const result = await fn.apply(this, args);
    const duration = performanceTracker.end(functionName);

    if (duration > 16) {
      console.warn(`Slow async function ${functionName}: ${duration.toFixed(2)}ms`);
    }

    return result;
  } as T;
}

// ============================================================================
// CACHE PERFORMANCE TRACKING
// ============================================================================

interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
}

class CachePerformanceTracker {
  private metrics = new Map<string, { hits: number; misses: number }>();

  recordHit(cacheName: string): void {
    const current = this.metrics.get(cacheName) || { hits: 0, misses: 0 };
    current.hits++;
    this.metrics.set(cacheName, current);
  }

  recordMiss(cacheName: string): void {
    const current = this.metrics.get(cacheName) || { hits: 0, misses: 0 };
    current.misses++;
    this.metrics.set(cacheName, current);
  }

  getMetrics(cacheName?: string): CacheMetrics | Record<string, CacheMetrics> {
    if (cacheName) {
      const data = this.metrics.get(cacheName) || { hits: 0, misses: 0 };
      const total = data.hits + data.misses;
      return {
        hits: data.hits,
        misses: data.misses,
        hitRate: total > 0 ? data.hits / total : 0,
        totalRequests: total,
      };
    }

    const allMetrics: Record<string, CacheMetrics> = {};
    this.metrics.forEach((data, name) => {
      const total = data.hits + data.misses;
      allMetrics[name] = {
        hits: data.hits,
        misses: data.misses,
        hitRate: total > 0 ? data.hits / total : 0,
        totalRequests: total,
      };
    });

    return allMetrics;
  }

  clear(): void {
    this.metrics.clear();
  }
}

const cachePerformanceTracker = new CachePerformanceTracker();

// ============================================================================
// STYLE APPLICATION PROFILER
// ============================================================================

/**
 * Profile style application to a chapter
 */
export function profileChapterStyling(
  chapter: Chapter,
  bookStyle: BookStyle,
  styleFunction: (chapter: Chapter, style: BookStyle) => any
) {
  const profileName = `chapter-${chapter.id}-styling`;

  performanceTracker.start(profileName);
  const result = styleFunction(chapter, bookStyle);
  const duration = performanceTracker.end(profileName);

  return {
    result,
    duration,
    blocksCount: chapter.content.length,
    msPerBlock: duration / chapter.content.length,
  };
}

/**
 * Profile style switching across multiple chapters
 */
export function profileStyleSwitch(
  chapters: Chapter[],
  fromStyle: BookStyle,
  toStyle: BookStyle,
  styleFunction: (chapter: Chapter, style: BookStyle) => any
) {
  const profileName = `style-switch-${fromStyle.id}-to-${toStyle.id}`;

  // Clear caches to measure cold performance
  clearStyleCaches();

  performanceTracker.start(`${profileName}-cold`);
  chapters.forEach(chapter => {
    styleFunction(chapter, toStyle);
  });
  const coldDuration = performanceTracker.end(`${profileName}-cold`);

  // Run again to measure warm cache performance
  performanceTracker.start(`${profileName}-warm`);
  chapters.forEach(chapter => {
    styleFunction(chapter, toStyle);
  });
  const warmDuration = performanceTracker.end(`${profileName}-warm`);

  return {
    chaptersCount: chapters.length,
    coldDuration,
    warmDuration,
    speedup: coldDuration / warmDuration,
    cacheEffectiveness: ((coldDuration - warmDuration) / coldDuration) * 100,
  };
}

// ============================================================================
// RENDER PERFORMANCE TRACKING
// ============================================================================

interface RenderMetrics {
  renderCount: number;
  totalTime: number;
  averageTime: number;
  componentName: string;
}

class RenderPerformanceTracker {
  private renders = new Map<string, number[]>();

  trackRender(componentName: string, duration: number): void {
    const existing = this.renders.get(componentName) || [];
    existing.push(duration);
    this.renders.set(componentName, existing);
  }

  getMetrics(componentName?: string): RenderMetrics | Record<string, RenderMetrics> {
    if (componentName) {
      const times = this.renders.get(componentName) || [];
      const total = times.reduce((sum, t) => sum + t, 0);
      return {
        renderCount: times.length,
        totalTime: total,
        averageTime: times.length > 0 ? total / times.length : 0,
        componentName,
      };
    }

    const allMetrics: Record<string, RenderMetrics> = {};
    this.renders.forEach((times, name) => {
      const total = times.reduce((sum, t) => sum + t, 0);
      allMetrics[name] = {
        renderCount: times.length,
        totalTime: total,
        averageTime: times.length > 0 ? total / times.length : 0,
        componentName: name,
      };
    });

    return allMetrics;
  }

  clear(): void {
    this.renders.clear();
  }
}

const renderPerformanceTracker = new RenderPerformanceTracker();

// ============================================================================
// REACT HOOKS FOR PROFILING
// ============================================================================

/**
 * Hook to track component render performance
 * Usage: useRenderProfiler('MyComponent')
 */
export function useRenderProfiler(componentName: string) {
  const startTime = performance.now();

  // This will run after render
  React.useEffect(() => {
    const duration = performance.now() - startTime;
    renderPerformanceTracker.trackRender(componentName, duration);

    if (duration > 16) {
      console.warn(
        `Slow render in ${componentName}: ${duration.toFixed(2)}ms`
      );
    }
  });
}

// ============================================================================
// COMPREHENSIVE PERFORMANCE REPORT
// ============================================================================

/**
 * Generate a comprehensive performance report
 */
export function generatePerformanceReport() {
  return {
    timestamp: new Date().toISOString(),
    functionPerformance: performanceTracker.getStats(),
    cacheMetrics: cachePerformanceTracker.getMetrics(),
    cacheStats: getStyleCacheStats(),
    renderMetrics: renderPerformanceTracker.getMetrics(),
  };
}

/**
 * Log performance report to console
 */
export function logPerformanceReport() {
  const report = generatePerformanceReport();

  console.group('🎯 Style Performance Report');

  console.group('⚡ Function Performance');
  console.table(report.functionPerformance);
  console.groupEnd();

  console.group('💾 Cache Metrics');
  console.table(report.cacheMetrics);
  console.groupEnd();

  console.group('📊 Cache Stats');
  console.table(report.cacheStats);
  console.groupEnd();

  console.group('🎨 Render Metrics');
  console.table(report.renderMetrics);
  console.groupEnd();

  console.groupEnd();
}

/**
 * Clear all performance data
 */
export function clearPerformanceData() {
  performanceTracker.clear();
  cachePerformanceTracker.clear();
  renderPerformanceTracker.clear();
  clearStyleCaches();
}

// ============================================================================
// BEFORE/AFTER COMPARISON
// ============================================================================

/**
 * Compare performance before and after optimization
 */
export async function comparePerformance(
  testName: string,
  beforeFn: () => void | Promise<void>,
  afterFn: () => void | Promise<void>,
  iterations = 10
) {
  const beforeTimes: number[] = [];
  const afterTimes: number[] = [];

  // Warm up
  await Promise.resolve(beforeFn());
  await Promise.resolve(afterFn());

  // Measure before
  for (let i = 0; i < iterations; i++) {
    clearStyleCaches();
    const start = performance.now();
    await Promise.resolve(beforeFn());
    beforeTimes.push(performance.now() - start);
  }

  // Measure after
  for (let i = 0; i < iterations; i++) {
    clearStyleCaches();
    const start = performance.now();
    await Promise.resolve(afterFn());
    afterTimes.push(performance.now() - start);
  }

  const beforeAvg = beforeTimes.reduce((a, b) => a + b, 0) / beforeTimes.length;
  const afterAvg = afterTimes.reduce((a, b) => a + b, 0) / afterTimes.length;
  const improvement = ((beforeAvg - afterAvg) / beforeAvg) * 100;

  console.group(`📈 Performance Comparison: ${testName}`);
  console.log(`Before: ${beforeAvg.toFixed(2)}ms (avg)`);
  console.log(`After: ${afterAvg.toFixed(2)}ms (avg)`);
  console.log(`Improvement: ${improvement.toFixed(1)}%`);
  console.log(`Speedup: ${(beforeAvg / afterAvg).toFixed(2)}x`);
  console.groupEnd();

  return {
    testName,
    before: beforeAvg,
    after: afterAvg,
    improvement,
    speedup: beforeAvg / afterAvg,
  };
}

// Export trackers for advanced usage
export const __profilers = {
  performanceTracker,
  cachePerformanceTracker,
  renderPerformanceTracker,
};

// Make React available for the hook (imported from the environment)
declare const React: any;
