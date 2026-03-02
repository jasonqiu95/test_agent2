/**
 * OrnamentalBreakPicker Component
 * Provides a palette of ornamental symbols for decorative breaks
 */

import React, { useState } from 'react';
import './OrnamentalBreakPicker.css';

export interface OrnamentalBreakPickerProps {
  /** Callback when a symbol is selected */
  onSelect: (symbol: string) => void;
  /** Callback when the picker is closed */
  onClose: () => void;
  /** Currently selected symbol */
  currentSymbol?: string;
}

/** Preset ornamental symbols with descriptions */
const PRESET_SYMBOLS = [
  { symbol: '***', label: 'Three Asterisks', group: 'classic' },
  { symbol: '* * *', label: 'Spaced Asterisks', group: 'classic' },
  { symbol: '•••', label: 'Three Bullets', group: 'classic' },
  { symbol: '• • •', label: 'Spaced Bullets', group: 'classic' },
  { symbol: '❦', label: 'Floral Heart', group: 'ornamental' },
  { symbol: '⁂', label: 'Asterism', group: 'ornamental' },
  { symbol: '✦', label: 'Four Pointed Star', group: 'ornamental' },
  { symbol: '✻', label: 'Eight Pointed Star', group: 'ornamental' },
  { symbol: '※', label: 'Reference Mark', group: 'ornamental' },
  { symbol: '◆', label: 'Diamond', group: 'ornamental' },
  { symbol: '♦', label: 'Diamond Suit', group: 'ornamental' },
  { symbol: '❖', label: 'Black Diamond Minus White X', group: 'ornamental' },
  { symbol: '◊', label: 'Lozenge', group: 'ornamental' },
  { symbol: '⬥', label: 'Black Diamond', group: 'ornamental' },
  { symbol: '✢', label: 'Heavy Cross', group: 'ornamental' },
  { symbol: '✥', label: 'Heavy Four Pointed Star', group: 'ornamental' },
];

/**
 * OrnamentalBreakPicker displays a palette of symbols for ornamental breaks
 */
export const OrnamentalBreakPicker: React.FC<OrnamentalBreakPickerProps> = ({
  onSelect,
  onClose,
  currentSymbol,
}) => {
  const [customSymbol, setCustomSymbol] = useState('');
  const [activeGroup, setActiveGroup] = useState<'classic' | 'ornamental' | 'custom'>(
    'classic'
  );

  const handleSymbolClick = (symbol: string) => {
    onSelect(symbol);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSymbol.trim()) {
      onSelect(customSymbol.trim());
      onClose();
    }
  };

  const classicSymbols = PRESET_SYMBOLS.filter((s) => s.group === 'classic');
  const ornamentalSymbols = PRESET_SYMBOLS.filter((s) => s.group === 'ornamental');

  return (
    <div className="ornamental-break-picker">
      <div className="picker-header">
        <h3 className="picker-title">Select Break Symbol</h3>
        <button className="picker-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      <div className="picker-tabs">
        <button
          className={`picker-tab ${activeGroup === 'classic' ? 'active' : ''}`}
          onClick={() => setActiveGroup('classic')}
        >
          Classic
        </button>
        <button
          className={`picker-tab ${activeGroup === 'ornamental' ? 'active' : ''}`}
          onClick={() => setActiveGroup('ornamental')}
        >
          Ornamental
        </button>
        <button
          className={`picker-tab ${activeGroup === 'custom' ? 'active' : ''}`}
          onClick={() => setActiveGroup('custom')}
        >
          Custom
        </button>
      </div>

      <div className="picker-content">
        {activeGroup === 'classic' && (
          <div className="symbol-grid">
            {classicSymbols.map(({ symbol, label }) => (
              <button
                key={symbol}
                className={`symbol-button ${currentSymbol === symbol ? 'selected' : ''}`}
                onClick={() => handleSymbolClick(symbol)}
                title={label}
              >
                <span className="symbol-display">{symbol}</span>
                <span className="symbol-label">{label}</span>
              </button>
            ))}
          </div>
        )}

        {activeGroup === 'ornamental' && (
          <div className="symbol-grid">
            {ornamentalSymbols.map(({ symbol, label }) => (
              <button
                key={symbol}
                className={`symbol-button ${currentSymbol === symbol ? 'selected' : ''}`}
                onClick={() => handleSymbolClick(symbol)}
                title={label}
              >
                <span className="symbol-display">{symbol}</span>
                <span className="symbol-label">{label}</span>
              </button>
            ))}
          </div>
        )}

        {activeGroup === 'custom' && (
          <form className="custom-symbol-form" onSubmit={handleCustomSubmit}>
            <label className="custom-label" htmlFor="custom-symbol">
              Enter custom symbol or text (up to 20 characters):
            </label>
            <input
              id="custom-symbol"
              type="text"
              className="custom-input"
              value={customSymbol}
              onChange={(e) => setCustomSymbol(e.target.value.slice(0, 20))}
              placeholder="e.g., ~*~, ∴, ---"
              maxLength={20}
              autoFocus
            />
            <div className="custom-preview">
              <span className="preview-label">Preview:</span>
              <div className="preview-display">{customSymbol || '(empty)'}</div>
            </div>
            <div className="custom-actions">
              <button type="submit" className="btn-primary" disabled={!customSymbol.trim()}>
                Use Custom Symbol
              </button>
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default OrnamentalBreakPicker;
