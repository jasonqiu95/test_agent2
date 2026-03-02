/**
 * Performance timing utilities for tracking operation latency
 */

export interface TimingResult {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  timestamp: string;
}

export interface TimingStats {
  count: number;
  total: number;
  average: number;
  min: number;
  max: number;
}

class PerformanceTimer {
  private timings: Map<string, TimingResult[]> = new Map();
  private activeTimers: Map<string, number> = new Map();
  private enabled: boolean = process.env.NODE_ENV === 'development';

  /**
   * Enable or disable performance timing
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if performance timing is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Start timing an operation
   */
  start(operationName: string): void {
    if (!this.enabled) return;

    const startTime = performance.now();
    this.activeTimers.set(operationName, startTime);
  }

  /**
   * End timing an operation and record the result
   */
  end(operationName: string): number | null {
    if (!this.enabled) return null;

    const startTime = this.activeTimers.get(operationName);
    if (startTime === undefined) {
      console.warn(`No active timer found for operation: ${operationName}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    const result: TimingResult = {
      name: operationName,
      startTime,
      endTime,
      duration,
      timestamp: new Date().toISOString(),
    };

    // Store the timing result
    const existingTimings = this.timings.get(operationName) || [];
    existingTimings.push(result);
    this.timings.set(operationName, existingTimings);

    // Clean up active timer
    this.activeTimers.delete(operationName);

    return duration;
  }

  /**
   * Measure an async operation
   */
  async measure<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    if (!this.enabled) {
      const result = await operation();
      return { result, duration: 0 };
    }

    this.start(operationName);
    try {
      const result = await operation();
      const duration = this.end(operationName) || 0;
      return { result, duration };
    } catch (error) {
      this.end(operationName);
      throw error;
    }
  }

  /**
   * Measure a synchronous operation
   */
  measureSync<T>(
    operationName: string,
    operation: () => T
  ): { result: T; duration: number } {
    if (!this.enabled) {
      const result = operation();
      return { result, duration: 0 };
    }

    this.start(operationName);
    try {
      const result = operation();
      const duration = this.end(operationName) || 0;
      return { result, duration };
    } catch (error) {
      this.end(operationName);
      throw error;
    }
  }

  /**
   * Get all timing results for a specific operation
   */
  getTimings(operationName: string): TimingResult[] {
    return this.timings.get(operationName) || [];
  }

  /**
   * Get all timing results
   */
  getAllTimings(): Map<string, TimingResult[]> {
    return new Map(this.timings);
  }

  /**
   * Get statistics for a specific operation
   */
  getStats(operationName: string): TimingStats | null {
    const timings = this.timings.get(operationName);
    if (!timings || timings.length === 0) {
      return null;
    }

    const durations = timings.map(t => t.duration);
    const total = durations.reduce((sum, d) => sum + d, 0);
    const average = total / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);

    return {
      count: timings.length,
      total,
      average,
      min,
      max,
    };
  }

  /**
   * Get statistics for all operations
   */
  getAllStats(): Map<string, TimingStats> {
    const stats = new Map<string, TimingStats>();

    for (const [name, _] of this.timings) {
      const operationStats = this.getStats(name);
      if (operationStats) {
        stats.set(name, operationStats);
      }
    }

    return stats;
  }

  /**
   * Clear all timing data
   */
  clear(): void {
    this.timings.clear();
    this.activeTimers.clear();
  }

  /**
   * Clear timing data for a specific operation
   */
  clearOperation(operationName: string): void {
    this.timings.delete(operationName);
    this.activeTimers.delete(operationName);
  }

  /**
   * Export all timing data to JSON
   */
  exportToJSON(): string {
    const data = {
      timings: Array.from(this.timings.entries()).map(([name, results]) => ({
        operation: name,
        results,
        stats: this.getStats(name),
      })),
      exportedAt: new Date().toISOString(),
    };

    return JSON.stringify(data, null, 2);
  }
}

// Singleton instance
export const performanceTimer = new PerformanceTimer();

// Convenience functions
export const startTiming = (operationName: string) => performanceTimer.start(operationName);
export const endTiming = (operationName: string) => performanceTimer.end(operationName);
export const measureAsync = <T>(operationName: string, operation: () => Promise<T>) =>
  performanceTimer.measure(operationName, operation);
export const measureSync = <T>(operationName: string, operation: () => T) =>
  performanceTimer.measureSync(operationName, operation);
