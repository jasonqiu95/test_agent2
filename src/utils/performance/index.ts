/**
 * Performance profiling infrastructure
 * Provides utilities for tracking render times, memory usage, and operation latency
 */

// Timing utilities
export {
  performanceTimer,
  startTiming,
  endTiming,
  measureAsync,
  measureSync,
  type TimingResult,
  type TimingStats,
} from './timing';

// Memory tracking
export {
  memoryTracker,
  takeMemorySnapshot,
  getCurrentMemory,
  formatMemorySize,
  type MemorySnapshot,
  type MemoryStats,
} from './memory';

// React profiling
export {
  reactProfiler,
  createProfilerCallback,
  type RenderMetric,
  type ComponentStats,
} from './profiler';

// Performance manager to control all profiling features
export interface PerformanceConfig {
  enabled: boolean;
  trackTiming: boolean;
  trackMemory: boolean;
  trackRenders: boolean;
  memoryTrackingInterval?: number;
}

class PerformanceManager {
  private config: PerformanceConfig = {
    enabled: process.env.NODE_ENV === 'development',
    trackTiming: true,
    trackMemory: true,
    trackRenders: true,
    memoryTrackingInterval: 1000,
  };

  /**
   * Initialize performance tracking with configuration
   */
  init(config: Partial<PerformanceConfig> = {}): void {
    this.config = { ...this.config, ...config };

    if (this.config.enabled) {
      if (this.config.trackTiming) {
        performanceTimer.setEnabled(true);
      }

      if (this.config.trackMemory) {
        memoryTracker.setEnabled(true);
        if (this.config.memoryTrackingInterval) {
          memoryTracker.startTracking(this.config.memoryTrackingInterval);
        }
      }

      if (this.config.trackRenders) {
        reactProfiler.setEnabled(true);
      }
    }
  }

  /**
   * Enable or disable all performance tracking
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    performanceTimer.setEnabled(enabled && this.config.trackTiming);
    memoryTracker.setEnabled(enabled && this.config.trackMemory);
    reactProfiler.setEnabled(enabled && this.config.trackRenders);

    if (!enabled) {
      memoryTracker.stopTracking();
    } else if (this.config.trackMemory && this.config.memoryTrackingInterval) {
      memoryTracker.startTracking(this.config.memoryTrackingInterval);
    }
  }

  /**
   * Check if performance tracking is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get current configuration
   */
  getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PerformanceConfig>): void {
    const wasEnabled = this.config.enabled;
    this.config = { ...this.config, ...config };

    // If enabled state changed, reinitialize
    if (wasEnabled !== this.config.enabled) {
      this.setEnabled(this.config.enabled);
    }
  }

  /**
   * Clear all performance data
   */
  clearAll(): void {
    performanceTimer.clear();
    memoryTracker.clear();
    reactProfiler.clear();
  }

  /**
   * Export all performance data to JSON
   */
  exportAllToJSON(): string {
    const data = {
      config: this.config,
      timing: JSON.parse(performanceTimer.exportToJSON()),
      memory: JSON.parse(memoryTracker.exportToJSON()),
      profiling: JSON.parse(reactProfiler.exportToJSON()),
      exportedAt: new Date().toISOString(),
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Download all performance data as JSON file
   */
  downloadPerformanceData(filename: string = 'performance-data.json'): void {
    const data = this.exportAllToJSON();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Singleton instance
export const performanceManager = new PerformanceManager();

// Import for re-export
import { performanceTimer } from './timing';
import { memoryTracker } from './memory';
import { reactProfiler } from './profiler';
