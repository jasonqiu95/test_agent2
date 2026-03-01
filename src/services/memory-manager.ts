/**
 * Memory Manager Service
 *
 * Provides comprehensive memory management for large documents including:
 * - Memory monitoring and profiling
 * - Memory budgets and cleanup triggers
 * - Object lifecycle management
 * - Integration with cache and pooling systems
 */

export interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  timestamp: number;
}

export interface MemoryBudget {
  maxHeapSize: number; // bytes
  warningThreshold: number; // percentage (0-1)
  criticalThreshold: number; // percentage (0-1)
}

export interface MemoryMonitorOptions {
  enabled: boolean;
  interval: number; // ms
  onWarning?: (stats: MemoryStats) => void;
  onCritical?: (stats: MemoryStats) => void;
}

export interface CleanupHandler {
  priority: number; // Lower numbers = higher priority
  cleanup: () => void | Promise<void>;
  name: string;
}

/**
 * Memory Manager - Singleton service for managing application memory
 */
export class MemoryManager {
  private static instance: MemoryManager;

  private budget: MemoryBudget = {
    maxHeapSize: 1024 * 1024 * 1024, // 1GB default
    warningThreshold: 0.75, // 75%
    criticalThreshold: 0.90, // 90%
  };

  private monitorOptions: MemoryMonitorOptions = {
    enabled: false,
    interval: 5000, // 5 seconds
  };

  private monitorTimer: NodeJS.Timeout | null = null;
  private cleanupHandlers: CleanupHandler[] = [];
  private memoryHistory: MemoryStats[] = [];
  private maxHistorySize = 100;

  // Disposables tracking
  private disposables = new Set<{ dispose: () => void }>();

  private constructor() {
    // Private constructor for singleton
    this.setupDefaultCleanupHandlers();
  }

  public static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  /**
   * Initialize memory manager with custom configuration
   */
  public initialize(options: {
    budget?: Partial<MemoryBudget>;
    monitor?: Partial<MemoryMonitorOptions>;
  }): void {
    if (options.budget) {
      this.budget = { ...this.budget, ...options.budget };
    }

    if (options.monitor) {
      this.monitorOptions = { ...this.monitorOptions, ...options.monitor };
    }

    if (this.monitorOptions.enabled) {
      this.startMonitoring();
    }
  }

  /**
   * Get current memory statistics
   */
  public getMemoryStats(): MemoryStats | null {
    // Check if we're in Node.js environment (Electron main process)
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal,
        external: usage.external,
        rss: usage.rss,
        timestamp: Date.now(),
      };
    }

    // In browser/renderer, use performance.memory if available
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      return {
        heapUsed: memory.usedJSHeapSize,
        heapTotal: memory.totalJSHeapSize,
        external: 0,
        rss: 0,
        timestamp: Date.now(),
      };
    }

    return null;
  }

  /**
   * Get memory usage percentage
   */
  public getMemoryUsagePercentage(): number {
    const stats = this.getMemoryStats();
    if (!stats) return 0;

    return (stats.heapUsed / this.budget.maxHeapSize) * 100;
  }

  /**
   * Check if memory is above warning threshold
   */
  public isMemoryWarning(): boolean {
    const stats = this.getMemoryStats();
    if (!stats) return false;

    const percentage = stats.heapUsed / this.budget.maxHeapSize;
    return percentage >= this.budget.warningThreshold;
  }

  /**
   * Check if memory is above critical threshold
   */
  public isMemoryCritical(): boolean {
    const stats = this.getMemoryStats();
    if (!stats) return false;

    const percentage = stats.heapUsed / this.budget.maxHeapSize;
    return percentage >= this.budget.criticalThreshold;
  }

  /**
   * Start memory monitoring
   */
  public startMonitoring(): void {
    if (this.monitorTimer) {
      return; // Already monitoring
    }

    this.monitorOptions.enabled = true;

    this.monitorTimer = setInterval(() => {
      const stats = this.getMemoryStats();
      if (!stats) return;

      // Add to history
      this.memoryHistory.push(stats);
      if (this.memoryHistory.length > this.maxHistorySize) {
        this.memoryHistory.shift();
      }

      // Check thresholds
      const percentage = stats.heapUsed / this.budget.maxHeapSize;

      if (percentage >= this.budget.criticalThreshold) {
        console.warn('[MemoryManager] CRITICAL: Memory usage at',
          `${(percentage * 100).toFixed(1)}%`);
        this.monitorOptions.onCritical?.(stats);
        this.triggerAggressiveCleanup();
      } else if (percentage >= this.budget.warningThreshold) {
        console.warn('[MemoryManager] WARNING: Memory usage at',
          `${(percentage * 100).toFixed(1)}%`);
        this.monitorOptions.onWarning?.(stats);
        this.triggerCleanup();
      }

      // Log in dev mode
      if (process.env.NODE_ENV === 'development') {
        this.logMemoryStats(stats);
      }
    }, this.monitorOptions.interval);
  }

  /**
   * Stop memory monitoring
   */
  public stopMonitoring(): void {
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
      this.monitorTimer = null;
    }
    this.monitorOptions.enabled = false;
  }

  /**
   * Register a cleanup handler
   */
  public registerCleanupHandler(handler: CleanupHandler): void {
    this.cleanupHandlers.push(handler);
    // Sort by priority (lower number = higher priority)
    this.cleanupHandlers.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Unregister a cleanup handler
   */
  public unregisterCleanupHandler(name: string): void {
    this.cleanupHandlers = this.cleanupHandlers.filter(h => h.name !== name);
  }

  /**
   * Trigger normal cleanup (runs high-priority handlers)
   */
  public async triggerCleanup(): Promise<void> {
    console.log('[MemoryManager] Triggering cleanup...');

    // Run handlers with priority <= 50
    const handlers = this.cleanupHandlers.filter(h => h.priority <= 50);

    for (const handler of handlers) {
      try {
        await handler.cleanup();
        console.log(`[MemoryManager] Cleanup: ${handler.name}`);
      } catch (error) {
        console.error(`[MemoryManager] Cleanup failed: ${handler.name}`, error);
      }
    }

    // Suggest garbage collection
    this.suggestGarbageCollection();
  }

  /**
   * Trigger aggressive cleanup (runs all handlers)
   */
  public async triggerAggressiveCleanup(): Promise<void> {
    console.log('[MemoryManager] Triggering AGGRESSIVE cleanup...');

    // Run all handlers
    for (const handler of this.cleanupHandlers) {
      try {
        await handler.cleanup();
        console.log(`[MemoryManager] Aggressive cleanup: ${handler.name}`);
      } catch (error) {
        console.error(`[MemoryManager] Cleanup failed: ${handler.name}`, error);
      }
    }

    // Force garbage collection if available
    this.forceGarbageCollection();
  }

  /**
   * Suggest garbage collection (if available)
   */
  private suggestGarbageCollection(): void {
    if (global.gc) {
      console.log('[MemoryManager] Suggesting garbage collection...');
      global.gc();
    }
  }

  /**
   * Force garbage collection (if available)
   */
  private forceGarbageCollection(): void {
    if (global.gc) {
      console.log('[MemoryManager] Forcing garbage collection...');
      global.gc();
    } else {
      console.warn('[MemoryManager] GC not available. Run with --expose-gc flag.');
    }
  }

  /**
   * Register a disposable object
   */
  public registerDisposable(disposable: { dispose: () => void }): void {
    this.disposables.add(disposable);
  }

  /**
   * Unregister a disposable object
   */
  public unregisterDisposable(disposable: { dispose: () => void }): void {
    this.disposables.delete(disposable);
  }

  /**
   * Dispose all registered disposables
   */
  public disposeAll(): void {
    console.log(`[MemoryManager] Disposing ${this.disposables.size} objects...`);

    for (const disposable of this.disposables) {
      try {
        disposable.dispose();
      } catch (error) {
        console.error('[MemoryManager] Disposal failed:', error);
      }
    }

    this.disposables.clear();
  }

  /**
   * Get memory history
   */
  public getMemoryHistory(): MemoryStats[] {
    return [...this.memoryHistory];
  }

  /**
   * Clear memory history
   */
  public clearMemoryHistory(): void {
    this.memoryHistory = [];
  }

  /**
   * Take a heap snapshot (Chrome DevTools compatible)
   */
  public takeHeapSnapshot(): void {
    if (typeof (global as any).takeHeapSnapshot === 'function') {
      const filename = `heap-${Date.now()}.heapsnapshot`;
      console.log(`[MemoryManager] Taking heap snapshot: ${filename}`);
      (global as any).takeHeapSnapshot(filename);
    } else {
      console.warn('[MemoryManager] Heap snapshots not available.');
      console.log('[MemoryManager] Use Chrome DevTools or run with --inspect flag.');
    }
  }

  /**
   * Log memory statistics
   */
  private logMemoryStats(stats: MemoryStats): void {
    const heapUsedMB = (stats.heapUsed / 1024 / 1024).toFixed(2);
    const heapTotalMB = (stats.heapTotal / 1024 / 1024).toFixed(2);
    const percentage = ((stats.heapUsed / stats.heapTotal) * 100).toFixed(1);

    console.log(
      `[MemoryManager] Heap: ${heapUsedMB}MB / ${heapTotalMB}MB (${percentage}%)`
    );
  }

  /**
   * Setup default cleanup handlers
   */
  private setupDefaultCleanupHandlers(): void {
    // Default handler for disposing all registered objects
    this.registerCleanupHandler({
      name: 'dispose-all',
      priority: 100,
      cleanup: () => {
        this.disposeAll();
      },
    });
  }

  /**
   * Cleanup and dispose the memory manager
   */
  public dispose(): void {
    this.stopMonitoring();
    this.disposeAll();
    this.cleanupHandlers = [];
    this.memoryHistory = [];
    this.disposables.clear();
  }

  /**
   * Get formatted memory report
   */
  public getMemoryReport(): string {
    const stats = this.getMemoryStats();
    if (!stats) {
      return 'Memory statistics not available';
    }

    const toMB = (bytes: number) => (bytes / 1024 / 1024).toFixed(2);
    const percentage = ((stats.heapUsed / this.budget.maxHeapSize) * 100).toFixed(1);

    return `
Memory Report
=============
Heap Used:    ${toMB(stats.heapUsed)} MB
Heap Total:   ${toMB(stats.heapTotal)} MB
External:     ${toMB(stats.external)} MB
RSS:          ${toMB(stats.rss)} MB
Budget:       ${toMB(this.budget.maxHeapSize)} MB
Usage:        ${percentage}%
Status:       ${this.isMemoryCritical() ? 'CRITICAL' : this.isMemoryWarning() ? 'WARNING' : 'OK'}
Handlers:     ${this.cleanupHandlers.length} registered
Disposables:  ${this.disposables.size} tracked
`.trim();
  }
}

// Export singleton instance
export const memoryManager = MemoryManager.getInstance();
