import React, { useState, useRef, useEffect } from 'react';
import './ColorPicker.css';

export interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  showAlpha?: boolean;
}

interface RGBColor {
  r: number;
  g: number;
  b: number;
  a?: number;
}

// Preset color swatches for common book colors
const PRESET_COLORS = [
  { name: 'Black', value: '#000000' },
  { name: 'Dark Gray', value: '#333333' },
  { name: 'Medium Gray', value: '#666666' },
  { name: 'Sepia Dark', value: '#704214' },
  { name: 'Sepia Brown', value: '#8B4513' },
  { name: 'Warm Sepia', value: '#A0826D' },
  { name: 'Light Sepia', value: '#C19A6B' },
  { name: 'Cream', value: '#FFF8DC' },
  { name: 'Off White', value: '#FAF9F6' },
  { name: 'Pure White', value: '#FFFFFF' },
  { name: 'Navy Blue', value: '#001F3F' },
  { name: 'Forest Green', value: '#228B22' },
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
  label,
  value,
  onChange,
  showAlpha = false,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [hexInput, setHexInput] = useState(value || '#000000');
  const [rgbColor, setRgbColor] = useState<RGBColor>(hexToRgb(value || '#000000'));
  const [inputMode, setInputMode] = useState<'hex' | 'rgb'>('hex');
  const pickerRef = useRef<HTMLDivElement>(null);
  const swatchRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (value) {
      setHexInput(value);
      setRgbColor(hexToRgb(value));
    }
  }, [value]);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        swatchRef.current &&
        !swatchRef.current.contains(event.target as Node)
      ) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPicker]);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setShowPicker(false);
      swatchRef.current?.focus();
    }
  };

  // Convert hex to RGB
  function hexToRgb(hex: string): RGBColor {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  }

  // Convert RGB to hex
  function rgbToHex(rgb: RGBColor): string {
    const toHex = (n: number) => {
      const hex = Math.max(0, Math.min(255, n)).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
  }

  const handleHexChange = (hex: string) => {
    setHexInput(hex);
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      const rgb = hexToRgb(hex);
      setRgbColor(rgb);
      onChange(hex);
    }
  };

  const handleRgbChange = (component: 'r' | 'g' | 'b', value: number) => {
    const newRgb = { ...rgbColor, [component]: value };
    setRgbColor(newRgb);
    const hex = rgbToHex(newRgb);
    setHexInput(hex);
    onChange(hex);
  };

  const handlePresetClick = (color: string) => {
    setHexInput(color);
    setRgbColor(hexToRgb(color));
    onChange(color);
    setShowPicker(false);
  };

  const handleSwatchClick = () => {
    setShowPicker(!showPicker);
  };

  const handleSwatchKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setShowPicker(!showPicker);
    }
  };

  return (
    <div className="color-picker" onKeyDown={handleKeyDown}>
      <label className="color-picker__label">{label}</label>

      <div className="color-picker__input-group">
        <button
          ref={swatchRef}
          className="color-picker__swatch"
          style={{ backgroundColor: value || '#000000' }}
          onClick={handleSwatchClick}
          onKeyDown={handleSwatchKeyDown}
          aria-label={`Select color for ${label}`}
          aria-expanded={showPicker}
          aria-haspopup="dialog"
          type="button"
        />

        <input
          type="text"
          className="color-picker__text-input"
          value={hexInput}
          onChange={(e) => handleHexChange(e.target.value)}
          placeholder="#000000"
          aria-label={`${label} hex value`}
        />

        <button
          className="color-picker__mode-toggle"
          onClick={() => setInputMode(inputMode === 'hex' ? 'rgb' : 'hex')}
          aria-label={`Switch to ${inputMode === 'hex' ? 'RGB' : 'hex'} input`}
          type="button"
        >
          {inputMode === 'hex' ? 'RGB' : 'HEX'}
        </button>
      </div>

      {showPicker && (
        <div
          ref={pickerRef}
          className="color-picker__dropdown"
          role="dialog"
          aria-label="Color picker dialog"
        >
          <div className="color-picker__input-section">
            <div className="color-picker__tabs">
              <button
                className={`color-picker__tab ${inputMode === 'hex' ? 'active' : ''}`}
                onClick={() => setInputMode('hex')}
                type="button"
              >
                HEX
              </button>
              <button
                className={`color-picker__tab ${inputMode === 'rgb' ? 'active' : ''}`}
                onClick={() => setInputMode('rgb')}
                type="button"
              >
                RGB
              </button>
            </div>

            {inputMode === 'hex' ? (
              <div className="color-picker__hex-input">
                <input
                  type="text"
                  value={hexInput}
                  onChange={(e) => handleHexChange(e.target.value)}
                  placeholder="#000000"
                  aria-label="Hex color value"
                />
              </div>
            ) : (
              <div className="color-picker__rgb-inputs">
                <div className="color-picker__rgb-field">
                  <label htmlFor="rgb-r">R</label>
                  <input
                    id="rgb-r"
                    type="number"
                    min="0"
                    max="255"
                    value={rgbColor.r}
                    onChange={(e) => handleRgbChange('r', parseInt(e.target.value) || 0)}
                    aria-label="Red value"
                  />
                </div>
                <div className="color-picker__rgb-field">
                  <label htmlFor="rgb-g">G</label>
                  <input
                    id="rgb-g"
                    type="number"
                    min="0"
                    max="255"
                    value={rgbColor.g}
                    onChange={(e) => handleRgbChange('g', parseInt(e.target.value) || 0)}
                    aria-label="Green value"
                  />
                </div>
                <div className="color-picker__rgb-field">
                  <label htmlFor="rgb-b">B</label>
                  <input
                    id="rgb-b"
                    type="number"
                    min="0"
                    max="255"
                    value={rgbColor.b}
                    onChange={(e) => handleRgbChange('b', parseInt(e.target.value) || 0)}
                    aria-label="Blue value"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="color-picker__presets">
            <div className="color-picker__presets-title">Preset Colors</div>
            <div className="color-picker__presets-grid" role="list">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.value}
                  className="color-picker__preset-swatch"
                  style={{ backgroundColor: preset.value }}
                  onClick={() => handlePresetClick(preset.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handlePresetClick(preset.value);
                    }
                  }}
                  aria-label={`Select ${preset.name} (${preset.value})`}
                  title={preset.name}
                  type="button"
                  role="listitem"
                />
              ))}
            </div>
          </div>

          <div className="color-picker__preview">
            <div className="color-picker__preview-label">Current Color</div>
            <div
              className="color-picker__preview-swatch"
              style={{ backgroundColor: value || '#000000' }}
              aria-label={`Current color: ${value || '#000000'}`}
            />
            <div className="color-picker__preview-values">
              <div>HEX: {hexInput}</div>
              <div>
                RGB: {rgbColor.r}, {rgbColor.g}, {rgbColor.b}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
