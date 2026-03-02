import React, { useState } from 'react';
import { BookStyle } from '../../../types/style';
import './OrnamentalBreaksSection.css';

export interface OrnamentalBreaksSectionProps {
  bookStyle: BookStyle;
  onChange: (updates: Partial<BookStyle>) => void;
}

const PRESET_SYMBOLS = [
  { value: '✦', label: '✦ (Four Pointed Star)' },
  { value: '❦', label: '❦ (Floral Heart)' },
  { value: '✻', label: '✻ (Eight Pointed Star)' },
  { value: '※', label: '※ (Reference Mark)' },
  { value: '◆', label: '◆ (Diamond)' },
  { value: 'custom', label: 'Custom...' },
];

export const OrnamentalBreaksSection: React.FC<OrnamentalBreaksSectionProps> = ({
  bookStyle,
  onChange,
}) => {
  const { ornamentalBreak } = bookStyle;
  const [showCustomInput, setShowCustomInput] = useState(
    !PRESET_SYMBOLS.some((s) => s.value === ornamentalBreak.symbol) &&
      ornamentalBreak.symbol !== 'custom'
  );

  const handleEnabledToggle = () => {
    onChange({
      ornamentalBreak: {
        ...ornamentalBreak,
        enabled: !ornamentalBreak.enabled,
      },
    });
  };

  const handleSymbolChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomInput(true);
      onChange({
        ornamentalBreak: {
          ...ornamentalBreak,
          symbol: ornamentalBreak.customSymbol || '',
        },
      });
    } else {
      setShowCustomInput(false);
      onChange({
        ornamentalBreak: {
          ...ornamentalBreak,
          symbol: value,
        },
      });
    }
  };

  const handleCustomSymbolChange = (value: string) => {
    onChange({
      ornamentalBreak: {
        ...ornamentalBreak,
        symbol: value,
        customSymbol: value,
      },
    });
  };

  const handleFontSizeChange = (value: string) => {
    onChange({
      ornamentalBreak: {
        ...ornamentalBreak,
        fontSize: value,
      },
    });
  };

  const handleTextAlignChange = (value: 'left' | 'center' | 'right') => {
    onChange({
      ornamentalBreak: {
        ...ornamentalBreak,
        textAlign: value,
      },
    });
  };

  const handleMarginTopChange = (value: string) => {
    onChange({
      ornamentalBreak: {
        ...ornamentalBreak,
        marginTop: value,
      },
    });
  };

  const handleMarginBottomChange = (value: string) => {
    onChange({
      ornamentalBreak: {
        ...ornamentalBreak,
        marginBottom: value,
      },
    });
  };

  const getCurrentSymbolValue = () => {
    if (showCustomInput) return 'custom';
    const preset = PRESET_SYMBOLS.find((s) => s.value === ornamentalBreak.symbol);
    return preset ? preset.value : 'custom';
  };

  return (
    <div className="ornamental-breaks-section">
      <div className="ornamental-breaks-header">
        <h3 className="section-title">Ornamental Breaks</h3>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={ornamentalBreak.enabled}
            onChange={handleEnabledToggle}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      {ornamentalBreak.enabled && (
        <div className="ornamental-breaks-content">
          {/* Symbol Selector */}
          <div className="form-group">
            <label className="form-label">Symbol</label>
            <select
              className="form-select"
              value={getCurrentSymbolValue()}
              onChange={(e) => handleSymbolChange(e.target.value)}
            >
              {PRESET_SYMBOLS.map((symbol) => (
                <option key={symbol.value} value={symbol.value}>
                  {symbol.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Symbol Input */}
          {showCustomInput && (
            <div className="form-group">
              <label className="form-label">Custom Symbol</label>
              <input
                type="text"
                className="form-input"
                value={ornamentalBreak.customSymbol || ornamentalBreak.symbol}
                onChange={(e) => handleCustomSymbolChange(e.target.value)}
                placeholder="Enter custom symbol or text"
                maxLength={10}
              />
            </div>
          )}

          {/* Font Size Control */}
          <div className="form-group">
            <label className="form-label">Font Size</label>
            <div className="range-control">
              <input
                type="range"
                min="12"
                max="48"
                step="2"
                value={parseInt(ornamentalBreak.fontSize || '24')}
                onChange={(e) => handleFontSizeChange(`${e.target.value}px`)}
                className="range-input"
              />
              <span className="range-value">
                {ornamentalBreak.fontSize || '24px'}
              </span>
            </div>
          </div>

          {/* Text Alignment */}
          <div className="form-group">
            <label className="form-label">Text Alignment</label>
            <div className="alignment-buttons">
              <button
                className={`align-btn ${ornamentalBreak.textAlign === 'left' || !ornamentalBreak.textAlign ? 'active' : ''}`}
                onClick={() => handleTextAlignChange('left')}
                title="Align left"
              >
                <span className="align-icon">⊣</span>
              </button>
              <button
                className={`align-btn ${ornamentalBreak.textAlign === 'center' ? 'active' : ''}`}
                onClick={() => handleTextAlignChange('center')}
                title="Align center"
              >
                <span className="align-icon">≡</span>
              </button>
              <button
                className={`align-btn ${ornamentalBreak.textAlign === 'right' ? 'active' : ''}`}
                onClick={() => handleTextAlignChange('right')}
                title="Align right"
              >
                <span className="align-icon">⊢</span>
              </button>
            </div>
          </div>

          {/* Spacing Controls */}
          <div className="form-group">
            <label className="form-label">Top Margin</label>
            <div className="range-control">
              <input
                type="range"
                min="0"
                max="80"
                step="4"
                value={parseInt(ornamentalBreak.marginTop || '20')}
                onChange={(e) => handleMarginTopChange(`${e.target.value}px`)}
                className="range-input"
              />
              <span className="range-value">
                {ornamentalBreak.marginTop || '20px'}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Bottom Margin</label>
            <div className="range-control">
              <input
                type="range"
                min="0"
                max="80"
                step="4"
                value={parseInt(ornamentalBreak.marginBottom || '20')}
                onChange={(e) => handleMarginBottomChange(`${e.target.value}px`)}
                className="range-input"
              />
              <span className="range-value">
                {ornamentalBreak.marginBottom || '20px'}
              </span>
            </div>
          </div>

          {/* Visual Preview */}
          <div className="form-group">
            <label className="form-label">Preview</label>
            <div
              className="ornamental-preview"
              style={{
                fontSize: ornamentalBreak.fontSize || '24px',
                textAlign: ornamentalBreak.textAlign || 'center',
                marginTop: ornamentalBreak.marginTop || '20px',
                marginBottom: ornamentalBreak.marginBottom || '20px',
              }}
            >
              <div className="preview-text">Previous paragraph ends here.</div>
              <div className="preview-symbol">
                {ornamentalBreak.symbol || '✦'}
              </div>
              <div className="preview-text">Next paragraph starts here.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
