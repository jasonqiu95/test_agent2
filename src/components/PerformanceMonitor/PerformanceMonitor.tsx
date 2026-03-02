/**
 * Performance Monitor Component
 * Real-time display of performance metrics including render times, memory usage, and operation latency
 */

import React, { useState } from 'react';
import { usePerformanceMonitor, useMemoryUsage } from '../../hooks/usePerformance';
import { formatMemorySize } from '../../utils/performance';
import type { TimingStats } from '../../utils/performance';
import './PerformanceMonitor.css';

interface PerformanceMonitorProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  refreshInterval?: number;
  minimized?: boolean;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  position = 'bottom-right',
  refreshInterval = 1000,
  minimized: initialMinimized = false,
}) => {
  const [minimized, setMinimized] = useState(initialMinimized);
  const [activeTab, setActiveTab] = useState<'memory' | 'timing' | 'overview'>('overview');

  const { metrics, exportData, downloadData, clearAllData, toggleEnabled } =
    usePerformanceMonitor(refreshInterval);

  const { memoryData, isSupported: memorySupported, formatBytes } = useMemoryUsage(refreshInterval);

  // Only render in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!metrics.isEnabled) {
    return (
      <div className={`performance-monitor performance-monitor--disabled performance-monitor--${position}`}>
        <div className="performance-monitor__header">
          <span className="performance-monitor__title">Performance Monitor</span>
          <button
            className="performance-monitor__button"
            onClick={toggleEnabled}
            title="Enable Performance Monitoring"
          >
            Enable
          </button>
        </div>
      </div>
    );
  }

  if (minimized) {
    return (
      <div className={`performance-monitor performance-monitor--minimized performance-monitor--${position}`}>
        <div className="performance-monitor__header" onClick={() => setMinimized(false)}>
          <span className="performance-monitor__title">⚡ Perf</span>
          <button
            className="performance-monitor__button performance-monitor__button--close"
            onClick={toggleEnabled}
            title="Disable Performance Monitoring"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`performance-monitor performance-monitor--${position}`}>
      <div className="performance-monitor__header">
        <span className="performance-monitor__title">⚡ Performance Monitor</span>
        <div className="performance-monitor__header-actions">
          <button
            className="performance-monitor__button"
            onClick={() => setMinimized(true)}
            title="Minimize"
          >
            −
          </button>
          <button
            className="performance-monitor__button"
            onClick={toggleEnabled}
            title="Disable Performance Monitoring"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="performance-monitor__tabs">
        <button
          className={`performance-monitor__tab ${activeTab === 'overview' ? 'performance-monitor__tab--active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`performance-monitor__tab ${activeTab === 'memory' ? 'performance-monitor__tab--active' : ''}`}
          onClick={() => setActiveTab('memory')}
        >
          Memory
        </button>
        <button
          className={`performance-monitor__tab ${activeTab === 'timing' ? 'performance-monitor__tab--active' : ''}`}
          onClick={() => setActiveTab('timing')}
        >
          Timing
        </button>
      </div>

      <div className="performance-monitor__content">
        {activeTab === 'overview' && (
          <OverviewTab memoryData={memoryData} memorySupported={memorySupported} formatBytes={formatBytes} />
        )}

        {activeTab === 'memory' && (
          <MemoryTab memoryData={memoryData} memorySupported={memorySupported} formatBytes={formatBytes} />
        )}

        {activeTab === 'timing' && <TimingTab timingStats={metrics.timingStats} />}
      </div>

      <div className="performance-monitor__actions">
        <button className="performance-monitor__action-button" onClick={clearAllData}>
          Clear Data
        </button>
        <button className="performance-monitor__action-button" onClick={() => downloadData()}>
          Export JSON
        </button>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{
  memoryData: any;
  memorySupported: boolean;
  formatBytes: (bytes: number) => string;
}> = ({ memoryData, memorySupported, formatBytes }) => (
  <div className="performance-monitor__overview">
    <div className="performance-monitor__section">
      <h4 className="performance-monitor__section-title">Memory</h4>
      {memorySupported && memoryData ? (
        <div className="performance-monitor__metric-grid">
          <div className="performance-monitor__metric">
            <span className="performance-monitor__metric-label">Used:</span>
            <span className="performance-monitor__metric-value">
              {formatBytes(memoryData.usedJSHeapSize)}
            </span>
          </div>
          <div className="performance-monitor__metric">
            <span className="performance-monitor__metric-label">Total:</span>
            <span className="performance-monitor__metric-value">
              {formatBytes(memoryData.totalJSHeapSize)}
            </span>
          </div>
          <div className="performance-monitor__metric">
            <span className="performance-monitor__metric-label">Usage:</span>
            <span className="performance-monitor__metric-value">
              {((memoryData.usedJSHeapSize / memoryData.totalJSHeapSize) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      ) : (
        <p className="performance-monitor__no-data">Memory API not supported in this browser</p>
      )}
    </div>

    <div className="performance-monitor__section">
      <h4 className="performance-monitor__section-title">Status</h4>
      <div className="performance-monitor__status">
        <span className="performance-monitor__status-indicator performance-monitor__status-indicator--active"></span>
        <span>Monitoring Active</span>
      </div>
    </div>
  </div>
);

// Memory Tab Component
const MemoryTab: React.FC<{
  memoryData: any;
  memorySupported: boolean;
  formatBytes: (bytes: number) => string;
}> = ({ memoryData, memorySupported, formatBytes }) => (
  <div className="performance-monitor__memory">
    {memorySupported && memoryData ? (
      <>
        <div className="performance-monitor__metric-row">
          <span className="performance-monitor__metric-label">Used JS Heap Size:</span>
          <span className="performance-monitor__metric-value">
            {formatBytes(memoryData.usedJSHeapSize)}
          </span>
        </div>
        <div className="performance-monitor__metric-row">
          <span className="performance-monitor__metric-label">Total JS Heap Size:</span>
          <span className="performance-monitor__metric-value">
            {formatBytes(memoryData.totalJSHeapSize)}
          </span>
        </div>
        <div className="performance-monitor__metric-row">
          <span className="performance-monitor__metric-label">JS Heap Size Limit:</span>
          <span className="performance-monitor__metric-value">
            {formatBytes(memoryData.jsHeapSizeLimit)}
          </span>
        </div>
        <div className="performance-monitor__metric-row">
          <span className="performance-monitor__metric-label">Memory Usage:</span>
          <span className="performance-monitor__metric-value">
            {((memoryData.usedJSHeapSize / memoryData.jsHeapSizeLimit) * 100).toFixed(2)}%
          </span>
        </div>
        <div className="performance-monitor__progress-bar">
          <div
            className="performance-monitor__progress-bar-fill"
            style={{
              width: `${(memoryData.usedJSHeapSize / memoryData.jsHeapSizeLimit) * 100}%`,
            }}
          />
        </div>
      </>
    ) : (
      <p className="performance-monitor__no-data">
        Memory API not supported. This feature requires a Chromium-based browser.
      </p>
    )}
  </div>
);

// Timing Tab Component
const TimingTab: React.FC<{ timingStats: Map<string, TimingStats> }> = ({ timingStats }) => (
  <div className="performance-monitor__timing">
    {timingStats.size > 0 ? (
      <div className="performance-monitor__timing-list">
        {Array.from(timingStats.entries()).map(([name, stats]) => (
          <div key={name} className="performance-monitor__timing-item">
            <div className="performance-monitor__timing-header">
              <span className="performance-monitor__timing-name">{name}</span>
              <span className="performance-monitor__timing-count">×{stats.count}</span>
            </div>
            <div className="performance-monitor__timing-stats">
              <div className="performance-monitor__timing-stat">
                <span className="performance-monitor__timing-stat-label">Avg:</span>
                <span className="performance-monitor__timing-stat-value">
                  {stats.average.toFixed(2)}ms
                </span>
              </div>
              <div className="performance-monitor__timing-stat">
                <span className="performance-monitor__timing-stat-label">Min:</span>
                <span className="performance-monitor__timing-stat-value">
                  {stats.min.toFixed(2)}ms
                </span>
              </div>
              <div className="performance-monitor__timing-stat">
                <span className="performance-monitor__timing-stat-label">Max:</span>
                <span className="performance-monitor__timing-stat-value">
                  {stats.max.toFixed(2)}ms
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p className="performance-monitor__no-data">No timing data recorded yet</p>
    )}
  </div>
);

export default PerformanceMonitor;
