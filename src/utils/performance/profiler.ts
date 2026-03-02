/**
 * React Profiler wrapper for tracking component render performance
 */

import type { ProfilerOnRenderCallback } from 'react';

export interface RenderMetric {
  id: string;
  phase: 'mount' | 'update';
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
  timestamp: string;
}

export interface ComponentStats {
  id: string;
  renderCount: number;
  totalActualDuration: number;
  totalBaseDuration: number;
  averageActualDuration: number;
  averageBaseDuration: number;
  maxActualDuration: number;
  minActualDuration: number;
  mountDuration: number | null;
  updateCount: number;
}

class ReactProfiler {
  private metrics: Map<string, RenderMetric[]> = new Map();
  private enabled: boolean = process.env.NODE_ENV === 'development';

  /**
   * Enable or disable profiling
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if profiling is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Create a profiler callback for React Profiler component
   */
  createCallback(): ProfilerOnRenderCallback {
    return (
      id: string,
      phase: 'mount' | 'update',
      actualDuration: number,
      baseDuration: number,
      startTime: number,
      commitTime: number
    ) => {
      if (!this.enabled) return;

      const metric: RenderMetric = {
        id,
        phase,
        actualDuration,
        baseDuration,
        startTime,
        commitTime,
        timestamp: new Date().toISOString(),
      };

      const existingMetrics = this.metrics.get(id) || [];
      existingMetrics.push(metric);
      this.metrics.set(id, existingMetrics);
    };
  }

  /**
   * Get all metrics for a specific component
   */
  getMetrics(componentId: string): RenderMetric[] {
    return this.metrics.get(componentId) || [];
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Map<string, RenderMetric[]> {
    return new Map(this.metrics);
  }

  /**
   * Get statistics for a specific component
   */
  getComponentStats(componentId: string): ComponentStats | null {
    const metrics = this.metrics.get(componentId);
    if (!metrics || metrics.length === 0) {
      return null;
    }

    const actualDurations = metrics.map(m => m.actualDuration);
    const baseDurations = metrics.map(m => m.baseDuration);
    const mountMetric = metrics.find(m => m.phase === 'mount');
    const updateMetrics = metrics.filter(m => m.phase === 'update');

    const totalActualDuration = actualDurations.reduce((sum, d) => sum + d, 0);
    const totalBaseDuration = baseDurations.reduce((sum, d) => sum + d, 0);

    return {
      id: componentId,
      renderCount: metrics.length,
      totalActualDuration,
      totalBaseDuration,
      averageActualDuration: totalActualDuration / metrics.length,
      averageBaseDuration: totalBaseDuration / metrics.length,
      maxActualDuration: Math.max(...actualDurations),
      minActualDuration: Math.min(...actualDurations),
      mountDuration: mountMetric ? mountMetric.actualDuration : null,
      updateCount: updateMetrics.length,
    };
  }

  /**
   * Get statistics for all components
   */
  getAllComponentStats(): Map<string, ComponentStats> {
    const stats = new Map<string, ComponentStats>();

    for (const [id, _] of this.metrics) {
      const componentStats = this.getComponentStats(id);
      if (componentStats) {
        stats.set(id, componentStats);
      }
    }

    return stats;
  }

  /**
   * Get components with slow renders (above threshold)
   */
  getSlowRenders(thresholdMs: number = 16): Map<string, RenderMetric[]> {
    const slowRenders = new Map<string, RenderMetric[]>();

    for (const [id, metrics] of this.metrics) {
      const slow = metrics.filter(m => m.actualDuration > thresholdMs);
      if (slow.length > 0) {
        slowRenders.set(id, slow);
      }
    }

    return slowRenders;
  }

  /**
   * Get components sorted by average render time
   */
  getComponentsByAverageRenderTime(): Array<{ id: string; stats: ComponentStats }> {
    const allStats = this.getAllComponentStats();
    const statsArray = Array.from(allStats.entries()).map(([id, stats]) => ({ id, stats }));

    return statsArray.sort(
      (a, b) => b.stats.averageActualDuration - a.stats.averageActualDuration
    );
  }

  /**
   * Clear all profiling data
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * Clear profiling data for a specific component
   */
  clearComponent(componentId: string): void {
    this.metrics.delete(componentId);
  }

  /**
   * Export profiling data to JSON
   */
  exportToJSON(): string {
    const data = {
      metrics: Array.from(this.metrics.entries()).map(([id, metrics]) => ({
        componentId: id,
        metrics,
        stats: this.getComponentStats(id),
      })),
      slowRenders: Array.from(this.getSlowRenders(16).entries()).map(([id, metrics]) => ({
        componentId: id,
        slowRenderCount: metrics.length,
        metrics,
      })),
      exportedAt: new Date().toISOString(),
    };

    return JSON.stringify(data, null, 2);
  }
}

// Singleton instance
export const reactProfiler = new ReactProfiler();

// Convenience function to create profiler callback
export const createProfilerCallback = () => reactProfiler.createCallback();
