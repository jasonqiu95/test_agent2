import React, { useState, useRef, useEffect } from 'react';
import './FontSelector.css';

export interface FontOption {
  label: string;
  value: string;
  category: 'system' | 'web-safe' | 'google' | 'custom';
}

export interface FontSelectorProps {
  value?: string;
  onChange: (fontFamily: string) => void;
  label?: string;
  placeholder?: string;
  allowCustom?: boolean;
  enableGoogleFonts?: boolean;
}

// Web-safe and system fonts
const DEFAULT_FONTS: FontOption[] = [
  // Serif fonts
  { label: 'Georgia', value: 'Georgia, serif', category: 'web-safe' },
  { label: 'Garamond', value: 'Garamond, serif', category: 'web-safe' },
  { label: 'Palatino', value: '"Palatino Linotype", "Book Antiqua", Palatino, serif', category: 'web-safe' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif', category: 'web-safe' },

  // Sans-serif fonts
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif', category: 'web-safe' },
  { label: 'Helvetica', value: '"Helvetica Neue", Helvetica, Arial, sans-serif', category: 'web-safe' },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif', category: 'web-safe' },

  // Monospace fonts
  { label: 'Courier', value: '"Courier New", Courier, monospace', category: 'web-safe' },

  // System fonts
  { label: 'System UI', value: 'system-ui, -apple-system, sans-serif', category: 'system' },
];

export const FontSelector: React.FC<FontSelectorProps> = ({
  value = '',
  onChange,
  label,
  placeholder = 'Select a font family',
  allowCustom = true,
  enableGoogleFonts = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customFont, setCustomFont] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get display label for current value
  const getDisplayLabel = (fontValue: string): string => {
    if (!fontValue) return '';
    const matchedFont = DEFAULT_FONTS.find(f => f.value === fontValue);
    if (matchedFont) return matchedFont.label;
    // For custom fonts, try to extract the main font name
    const cleanFont = fontValue.split(',')[0].replace(/['"]/g, '').trim();
    return cleanFont;
  };

  const [displayValue, setDisplayValue] = useState(getDisplayLabel(value));

  // Filter fonts based on search term
  const filteredFonts = DEFAULT_FONTS.filter(font =>
    font.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCustomInput(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update display value when prop value changes
  useEffect(() => {
    setDisplayValue(getDisplayLabel(value));
  }, [value]);

  const handleFontSelect = (font: FontOption) => {
    setDisplayValue(font.label);
    onChange(font.value);
    setIsOpen(false);
    setSearchTerm('');
    setShowCustomInput(false);
  };

  const handleCustomFontSubmit = () => {
    if (customFont.trim()) {
      setDisplayValue(customFont.trim());
      onChange(customFont.trim());
      setCustomFont('');
      setShowCustomInput(false);
      setIsOpen(false);
    }
  };

  const handleCustomFontKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCustomFontSubmit();
    } else if (e.key === 'Escape') {
      setShowCustomInput(false);
      setCustomFont('');
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    } else if (e.key === 'ArrowDown' && filteredFonts.length > 0) {
      e.preventDefault();
      // Focus first option
      const firstOption = dropdownRef.current?.querySelector('.font-selector__option') as HTMLElement;
      firstOption?.focus();
    }
  };

  const handleOptionKeyDown = (e: React.KeyboardEvent, font: FontOption, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleFontSelect(font);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextOption = e.currentTarget.nextElementSibling as HTMLElement;
      nextOption?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (index === 0) {
        inputRef.current?.focus();
      } else {
        const prevOption = e.currentTarget.previousElementSibling as HTMLElement;
        prevOption?.focus();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  return (
    <div className="font-selector" ref={dropdownRef}>
      {label && <label className="font-selector__label">{label}</label>}

      <div className="font-selector__control">
        <div
          className="font-selector__display"
          onClick={() => setIsOpen(!isOpen)}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsOpen(!isOpen);
            }
          }}
        >
          <span
            className="font-selector__display-text"
            style={{ fontFamily: value || 'inherit' }}
          >
            {displayValue || placeholder}
          </span>
          <span className={`font-selector__arrow ${isOpen ? 'font-selector__arrow--open' : ''}`}>
            ▼
          </span>
        </div>

        {isOpen && (
          <div className="font-selector__dropdown" role="listbox">
            <div className="font-selector__search">
              <input
                ref={inputRef}
                type="text"
                className="font-selector__search-input"
                placeholder="Search fonts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                autoFocus
              />
            </div>

            <div className="font-selector__options">
              {filteredFonts.length > 0 ? (
                <>
                  {/* Serif fonts section */}
                  {filteredFonts.some(f => ['Georgia', 'Garamond', 'Palatino', 'Times New Roman'].includes(f.label)) && (
                    <>
                      <div className="font-selector__category">Serif Fonts</div>
                      {filteredFonts
                        .filter(f => ['Georgia', 'Garamond', 'Palatino', 'Times New Roman'].includes(f.label))
                        .map((font, index) => (
                          <div
                            key={font.value}
                            className={`font-selector__option ${value === font.value ? 'font-selector__option--selected' : ''}`}
                            onClick={() => handleFontSelect(font)}
                            onKeyDown={(e) => handleOptionKeyDown(e, font, index)}
                            role="option"
                            aria-selected={value === font.value}
                            tabIndex={0}
                          >
                            <span
                              className="font-selector__option-label"
                              style={{ fontFamily: font.value }}
                            >
                              {font.label}
                            </span>
                            <span className="font-selector__option-preview" style={{ fontFamily: font.value }}>
                              The quick brown fox jumps
                            </span>
                          </div>
                        ))}
                    </>
                  )}

                  {/* Sans-serif fonts section */}
                  {filteredFonts.some(f => ['Arial', 'Helvetica', 'Verdana', 'System UI'].includes(f.label)) && (
                    <>
                      <div className="font-selector__category">Sans-serif Fonts</div>
                      {filteredFonts
                        .filter(f => ['Arial', 'Helvetica', 'Verdana', 'System UI'].includes(f.label))
                        .map((font, index) => (
                          <div
                            key={font.value}
                            className={`font-selector__option ${value === font.value ? 'font-selector__option--selected' : ''}`}
                            onClick={() => handleFontSelect(font)}
                            onKeyDown={(e) => handleOptionKeyDown(e, font, index)}
                            role="option"
                            aria-selected={value === font.value}
                            tabIndex={0}
                          >
                            <span
                              className="font-selector__option-label"
                              style={{ fontFamily: font.value }}
                            >
                              {font.label}
                            </span>
                            <span className="font-selector__option-preview" style={{ fontFamily: font.value }}>
                              The quick brown fox jumps
                            </span>
                          </div>
                        ))}
                    </>
                  )}

                  {/* Monospace fonts section */}
                  {filteredFonts.some(f => f.label === 'Courier') && (
                    <>
                      <div className="font-selector__category">Monospace Fonts</div>
                      {filteredFonts
                        .filter(f => f.label === 'Courier')
                        .map((font, index) => (
                          <div
                            key={font.value}
                            className={`font-selector__option ${value === font.value ? 'font-selector__option--selected' : ''}`}
                            onClick={() => handleFontSelect(font)}
                            onKeyDown={(e) => handleOptionKeyDown(e, font, index)}
                            role="option"
                            aria-selected={value === font.value}
                            tabIndex={0}
                          >
                            <span
                              className="font-selector__option-label"
                              style={{ fontFamily: font.value }}
                            >
                              {font.label}
                            </span>
                            <span className="font-selector__option-preview" style={{ fontFamily: font.value }}>
                              The quick brown fox jumps
                            </span>
                          </div>
                        ))}
                    </>
                  )}
                </>
              ) : (
                <div className="font-selector__no-results">No fonts found</div>
              )}

              {enableGoogleFonts && (
                <div className="font-selector__category">
                  Google Fonts (Coming Soon)
                </div>
              )}

              {allowCustom && (
                <>
                  <div className="font-selector__divider" />
                  {!showCustomInput ? (
                    <button
                      className="font-selector__custom-button"
                      onClick={() => setShowCustomInput(true)}
                    >
                      + Add Custom Font
                    </button>
                  ) : (
                    <div className="font-selector__custom-input">
                      <input
                        type="text"
                        placeholder="e.g., MyCustomFont, serif"
                        value={customFont}
                        onChange={(e) => setCustomFont(e.target.value)}
                        onKeyDown={handleCustomFontKeyDown}
                        autoFocus
                      />
                      <button
                        className="font-selector__custom-submit"
                        onClick={handleCustomFontSubmit}
                        disabled={!customFont.trim()}
                      >
                        Add
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
