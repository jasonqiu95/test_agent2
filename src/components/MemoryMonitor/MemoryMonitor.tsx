/**
 * Memory Monitor Component
 *
 * Display real-time memory statistics and controls for debugging
 * Only visible in development mode
 */

import React from 'react';
import { useMemoryManager } from '../../hooks/useMemoryManager';
import './MemoryMonitor.css';

export interface MemoryMonitorProps {
  /**
   * Position of the monitor on screen
   */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

  /**
   * Show detailed statistics
   */
  detailed?: boolean;
}

export const MemoryMonitor: React.FC<MemoryMonitorProps> = ({
  position = 'bottom-right',
  detailed = false,
}) => {
  const {
    isMonitoring,
    stats,
    isWarning,
    isCritical,
    triggerCleanup,
    triggerAggressiveCleanup,
    getMemoryReport,
    printCacheStats,
    printPoolStats,
    takeHeapSnapshot,
  } = useMemoryManager({
    enableInDev: true,
    interval: 2000, // Update every 2 seconds
  });

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!isMonitoring || !stats) {
    return null;
  }

  const toMB = (bytes: number) => (bytes / 1024 / 1024).toFixed(1);
  const heapUsedMB = toMB(stats.heapUsed);
  const heapTotalMB = toMB(stats.heapTotal);
  const percentage = ((stats.heapUsed / stats.heapTotal) * 100).toFixed(1);

  const getStatusColor = () => {
    if (isCritical) return 'critical';
    if (isWarning) return 'warning';
    return 'normal';
  };

  const handlePrintReport = () => {
    console.log(getMemoryReport());
  };

  return (
    <div className={`memory-monitor memory-monitor--${position} memory-monitor--${getStatusColor()}`}>
      <div className="memory-monitor__header">
        <span className="memory-monitor__title">Memory</span>
        <span className="memory-monitor__status">{getStatusColor().toUpperCase()}</span>
      </div>

      <div className="memory-monitor__stats">
        <div className="memory-monitor__stat">
          <span className="memory-monitor__label">Heap:</span>
          <span className="memory-monitor__value">
            {heapUsedMB} / {heapTotalMB} MB ({percentage}%)
          </span>
        </div>

        {detailed && (
          <>
            <div className="memory-monitor__stat">
              <span className="memory-monitor__label">External:</span>
              <span className="memory-monitor__value">{toMB(stats.external)} MB</span>
            </div>
            <div className="memory-monitor__stat">
              <span className="memory-monitor__label">RSS:</span>
              <span className="memory-monitor__value">{toMB(stats.rss)} MB</span>
            </div>
          </>
        )}
      </div>

      <div className="memory-monitor__progress">
        <div
          className="memory-monitor__progress-bar"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="memory-monitor__actions">
        <button
          className="memory-monitor__button"
          onClick={triggerCleanup}
          title="Run cleanup"
        >
          🧹 Clean
        </button>
        <button
          className="memory-monitor__button"
          onClick={triggerAggressiveCleanup}
          title="Run aggressive cleanup"
        >
          🚨 Force
        </button>
        <button
          className="memory-monitor__button"
          onClick={handlePrintReport}
          title="Print memory report"
        >
          📊 Report
        </button>
        <button
          className="memory-monitor__button"
          onClick={printCacheStats}
          title="Print cache statistics"
        >
          💾 Cache
        </button>
        <button
          className="memory-monitor__button"
          onClick={printPoolStats}
          title="Print pool statistics"
        >
          🎱 Pools
        </button>
        <button
          className="memory-monitor__button"
          onClick={takeHeapSnapshot}
          title="Take heap snapshot"
        >
          📸 Snapshot
        </button>
      </div>
    </div>
  );
};
