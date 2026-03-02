/**
 * Memory usage tracking utilities using performance.memory API
 * Note: performance.memory is only available in Chrome/Chromium-based browsers
 */

export interface MemorySnapshot {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  timestamp: string;
  label?: string;
}

export interface MemoryStats {
  snapshots: MemorySnapshot[];
  averageUsed: number;
  maxUsed: number;
  minUsed: number;
  currentUsed: number;
}

class MemoryTracker {
  private snapshots: MemorySnapshot[] = [];
  private enabled: boolean = process.env.NODE_ENV === 'development';
  private intervalId: number | null = null;

  /**
   * Check if performance.memory API is available
   */
  isSupported(): boolean {
    return (
      typeof performance !== 'undefined' &&
      'memory' in performance &&
      performance.memory !== undefined
    );
  }

  /**
   * Enable or disable memory tracking
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if memory tracking is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Take a memory snapshot
   */
  takeSnapshot(label?: string): MemorySnapshot | null {
    if (!this.enabled || !this.isSupported()) {
      return null;
    }

    const memory = (performance as any).memory;
    const snapshot: MemorySnapshot = {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      timestamp: new Date().toISOString(),
      label,
    };

    this.snapshots.push(snapshot);
    return snapshot;
  }

  /**
   * Start automatic memory tracking at specified interval
   */
  startTracking(intervalMs: number = 1000): void {
    if (!this.enabled || !this.isSupported()) {
      return;
    }

    // Stop existing tracking if any
    this.stopTracking();

    this.intervalId = window.setInterval(() => {
      this.takeSnapshot('auto');
    }, intervalMs);
  }

  /**
   * Stop automatic memory tracking
   */
  stopTracking(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Get all memory snapshots
   */
  getSnapshots(): MemorySnapshot[] {
    return [...this.snapshots];
  }

  /**
   * Get the latest memory snapshot
   */
  getLatestSnapshot(): MemorySnapshot | null {
    if (this.snapshots.length === 0) {
      return null;
    }
    return this.snapshots[this.snapshots.length - 1];
  }

  /**
   * Get current memory usage without storing snapshot
   */
  getCurrentMemoryUsage(): MemorySnapshot | null {
    if (!this.isSupported()) {
      return null;
    }

    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get memory usage statistics
   */
  getStats(): MemoryStats | null {
    if (this.snapshots.length === 0) {
      return null;
    }

    const usedSizes = this.snapshots.map(s => s.usedJSHeapSize);
    const averageUsed = usedSizes.reduce((sum, size) => sum + size, 0) / usedSizes.length;
    const maxUsed = Math.max(...usedSizes);
    const minUsed = Math.min(...usedSizes);
    const currentUsed = usedSizes[usedSizes.length - 1];

    return {
      snapshots: this.getSnapshots(),
      averageUsed,
      maxUsed,
      minUsed,
      currentUsed,
    };
  }

  /**
   * Calculate memory usage between two snapshots
   */
  getDifference(
    snapshot1: MemorySnapshot,
    snapshot2: MemorySnapshot
  ): {
    usedDiff: number;
    totalDiff: number;
    percentageChange: number;
  } {
    const usedDiff = snapshot2.usedJSHeapSize - snapshot1.usedJSHeapSize;
    const totalDiff = snapshot2.totalJSHeapSize - snapshot1.totalJSHeapSize;
    const percentageChange =
      ((snapshot2.usedJSHeapSize - snapshot1.usedJSHeapSize) / snapshot1.usedJSHeapSize) * 100;

    return {
      usedDiff,
      totalDiff,
      percentageChange,
    };
  }

  /**
   * Clear all memory snapshots
   */
  clear(): void {
    this.snapshots = [];
    this.stopTracking();
  }

  /**
   * Format bytes to human-readable string
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Export memory tracking data to JSON
   */
  exportToJSON(): string {
    const data = {
      snapshots: this.snapshots,
      stats: this.getStats(),
      supported: this.isSupported(),
      exportedAt: new Date().toISOString(),
    };

    return JSON.stringify(data, null, 2);
  }
}

// Singleton instance
export const memoryTracker = new MemoryTracker();

// Convenience functions
export const takeMemorySnapshot = (label?: string) => memoryTracker.takeSnapshot(label);
export const getCurrentMemory = () => memoryTracker.getCurrentMemoryUsage();
export const formatMemorySize = (bytes: number) => memoryTracker.formatBytes(bytes);
