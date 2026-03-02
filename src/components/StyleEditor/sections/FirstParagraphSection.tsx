import React from 'react';
import { FirstParagraphStyle } from '../../../types/style';
import './FirstParagraphSection.css';

export interface FirstParagraphSectionProps {
  firstParagraph: FirstParagraphStyle;
  onChange: (updates: FirstParagraphStyle) => void;
}

export const FirstParagraphSection: React.FC<FirstParagraphSectionProps> = ({
  firstParagraph,
  onChange,
}) => {
  const handleEnabledChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...firstParagraph,
      enabled: e.target.checked,
    });
  };

  const handleTextTransformChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as FirstParagraphStyle['textTransform'];
    onChange({
      ...firstParagraph,
      textTransform: value,
    });
  };

  const handleFontVariantChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...firstParagraph,
      fontVariant: e.target.value,
    });
  };

  const handleLetterSpacingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...firstParagraph,
      letterSpacing: e.target.value,
    });
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...firstParagraph,
      fontSize: e.target.value,
    });
  };

  const handleIndentEnabledChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...firstParagraph,
      indent: {
        enabled: e.target.checked,
        value: firstParagraph.indent?.value || '0px',
      },
    });
  };

  const handleIndentValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...firstParagraph,
      indent: {
        enabled: firstParagraph.indent?.enabled || false,
        value: e.target.value,
      },
    });
  };

  return (
    <div className="first-paragraph-section">
      <div className="first-paragraph-section__header">
        <h3 className="first-paragraph-section__title">First Paragraph Style</h3>
        <label className="first-paragraph-section__toggle">
          <input
            type="checkbox"
            checked={firstParagraph.enabled}
            onChange={handleEnabledChange}
            className="first-paragraph-section__toggle-input"
          />
          <span className="first-paragraph-section__toggle-label">
            {firstParagraph.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </label>
      </div>

      {firstParagraph.enabled && (
        <div className="first-paragraph-section__content">
          <div className="first-paragraph-section__field">
            <label className="first-paragraph-section__label">
              Text Transform
            </label>
            <select
              value={firstParagraph.textTransform || 'none'}
              onChange={handleTextTransformChange}
              className="first-paragraph-section__select"
            >
              <option value="none">None</option>
              <option value="uppercase">All Caps (Uppercase)</option>
              <option value="small-caps">Small Caps</option>
              <option value="capitalize">Capitalize</option>
              <option value="lowercase">Lowercase</option>
            </select>
          </div>

          {firstParagraph.textTransform === 'small-caps' && (
            <div className="first-paragraph-section__field first-paragraph-section__field--conditional">
              <label className="first-paragraph-section__label">
                Font Variant
              </label>
              <input
                type="text"
                value={firstParagraph.fontVariant || 'small-caps'}
                onChange={handleFontVariantChange}
                placeholder="e.g., small-caps"
                className="first-paragraph-section__input"
              />
              <span className="first-paragraph-section__hint">
                CSS font-variant property value
              </span>
            </div>
          )}

          <div className="first-paragraph-section__field">
            <label className="first-paragraph-section__label">
              Letter Spacing
            </label>
            <input
              type="text"
              value={firstParagraph.letterSpacing || ''}
              onChange={handleLetterSpacingChange}
              placeholder="e.g., 0.1em, 2px"
              className="first-paragraph-section__input"
            />
            <span className="first-paragraph-section__hint">
              CSS letter-spacing value
            </span>
          </div>

          <div className="first-paragraph-section__field">
            <label className="first-paragraph-section__label">
              Font Size Override
            </label>
            <input
              type="text"
              value={firstParagraph.fontSize || ''}
              onChange={handleFontSizeChange}
              placeholder="e.g., 1.2rem, 18px"
              className="first-paragraph-section__input"
            />
            <span className="first-paragraph-section__hint">
              Leave empty to use default body font size
            </span>
          </div>

          <div className="first-paragraph-section__field">
            <label className="first-paragraph-section__toggle">
              <input
                type="checkbox"
                checked={firstParagraph.indent?.enabled || false}
                onChange={handleIndentEnabledChange}
                className="first-paragraph-section__toggle-input"
              />
              <span className="first-paragraph-section__toggle-label">
                Enable Indent
              </span>
            </label>
          </div>

          {firstParagraph.indent?.enabled && (
            <div className="first-paragraph-section__field first-paragraph-section__field--conditional">
              <label className="first-paragraph-section__label">
                Indent Value
              </label>
              <input
                type="text"
                value={firstParagraph.indent?.value || ''}
                onChange={handleIndentValueChange}
                placeholder="e.g., 2em, 30px"
                className="first-paragraph-section__input"
              />
              <span className="first-paragraph-section__hint">
                CSS text-indent value
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
