import React from 'react';
import { DropCapStyle } from '../../../types/style';
import './DropCapsSection.css';

export interface DropCapsSectionProps {
  dropCapStyle: DropCapStyle;
  headingFontFamily?: string;
  onChange: (updates: Partial<DropCapStyle>) => void;
}

export const DropCapsSection: React.FC<DropCapsSectionProps> = ({
  dropCapStyle,
  headingFontFamily,
  onChange,
}) => {
  const handleToggle = () => {
    onChange({ enabled: !dropCapStyle.enabled });
  };

  const handleLinesChange = (lines: number) => {
    onChange({ lines });
  };

  const handleFontSizeChange = (fontSize: string) => {
    onChange({ fontSize });
  };

  const handleFontFamilyChange = (fontFamily: string) => {
    onChange({ fontFamily });
  };

  const handleFontWeightChange = (fontWeight: string) => {
    onChange({ fontWeight });
  };

  const handleColorChange = (color: string) => {
    onChange({ color });
  };

  const handleMarginRightChange = (marginRight: string) => {
    onChange({ marginRight });
  };

  return (
    <div className="drop-caps-section">
      <div className="drop-caps-section__header">
        <h3 className="drop-caps-section__title">Drop Caps</h3>
      </div>

      <div className="drop-caps-section__content">
        {/* Toggle Enable/Disable */}
        <div className="drop-caps-field">
          <label className="drop-caps-checkbox-label">
            <input
              type="checkbox"
              checked={dropCapStyle.enabled}
              onChange={handleToggle}
              className="drop-caps-checkbox"
            />
            <span>Enable drop caps</span>
          </label>
        </div>

        {/* Number of Lines */}
        <div className="drop-caps-field">
          <label className="drop-caps-label">
            Number of lines
            <span className="drop-caps-label-hint">(1-5)</span>
          </label>
          <input
            type="number"
            min="1"
            max="5"
            value={dropCapStyle.lines}
            onChange={(e) => handleLinesChange(Number(e.target.value))}
            disabled={!dropCapStyle.enabled}
            className="drop-caps-input"
          />
        </div>

        {/* Font Size */}
        <div className="drop-caps-field">
          <label className="drop-caps-label">Font size</label>
          <select
            value={dropCapStyle.fontSize || '3em'}
            onChange={(e) => handleFontSizeChange(e.target.value)}
            disabled={!dropCapStyle.enabled}
            className="drop-caps-select"
          >
            <option value="2em">2em</option>
            <option value="2.5em">2.5em</option>
            <option value="3em">3em</option>
            <option value="3.5em">3.5em</option>
            <option value="4em">4em</option>
            <option value="4.5em">4.5em</option>
            <option value="5em">5em</option>
          </select>
        </div>

        {/* Font Family */}
        <div className="drop-caps-field">
          <label className="drop-caps-label">Font family</label>
          <select
            value={dropCapStyle.fontFamily || 'inherit-heading'}
            onChange={(e) => handleFontFamilyChange(e.target.value)}
            disabled={!dropCapStyle.enabled}
            className="drop-caps-select"
          >
            <option value="inherit-heading">
              Inherit from heading{headingFontFamily ? ` (${headingFontFamily})` : ''}
            </option>
            <option value="serif">Serif</option>
            <option value="sans-serif">Sans-serif</option>
            <option value="monospace">Monospace</option>
            <option value="Georgia, serif">Georgia</option>
            <option value="'Times New Roman', serif">Times New Roman</option>
            <option value="Arial, sans-serif">Arial</option>
            <option value="Helvetica, sans-serif">Helvetica</option>
            <option value="'Courier New', monospace">Courier New</option>
          </select>
        </div>

        {/* Font Weight */}
        <div className="drop-caps-field">
          <label className="drop-caps-label">Font weight</label>
          <select
            value={dropCapStyle.fontWeight || 'bold'}
            onChange={(e) => handleFontWeightChange(e.target.value)}
            disabled={!dropCapStyle.enabled}
            className="drop-caps-select"
          >
            <option value="normal">Normal (400)</option>
            <option value="500">Medium (500)</option>
            <option value="600">Semi-bold (600)</option>
            <option value="bold">Bold (700)</option>
            <option value="800">Extra-bold (800)</option>
            <option value="900">Black (900)</option>
          </select>
        </div>

        {/* Color Picker */}
        <div className="drop-caps-field">
          <label className="drop-caps-label">Color</label>
          <div className="drop-caps-color-control">
            <input
              type="color"
              value={dropCapStyle.color || '#000000'}
              onChange={(e) => handleColorChange(e.target.value)}
              disabled={!dropCapStyle.enabled}
              className="drop-caps-color-input"
            />
            <input
              type="text"
              value={dropCapStyle.color || '#000000'}
              onChange={(e) => handleColorChange(e.target.value)}
              disabled={!dropCapStyle.enabled}
              className="drop-caps-text-input"
              placeholder="#000000"
            />
          </div>
        </div>

        {/* Margin Right */}
        <div className="drop-caps-field">
          <label className="drop-caps-label">Margin right spacing</label>
          <select
            value={dropCapStyle.marginRight || '0.1em'}
            onChange={(e) => handleMarginRightChange(e.target.value)}
            disabled={!dropCapStyle.enabled}
            className="drop-caps-select"
          >
            <option value="0">None (0)</option>
            <option value="0.05em">Extra Small (0.05em)</option>
            <option value="0.1em">Small (0.1em)</option>
            <option value="0.15em">Medium (0.15em)</option>
            <option value="0.2em">Large (0.2em)</option>
            <option value="0.25em">Extra Large (0.25em)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
