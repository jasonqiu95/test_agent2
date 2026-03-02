import React from 'react';
import { HeadingStyle } from '../../../types/style';
import {
  AutocompleteField,
  InputWithUnitField,
  SelectField,
  InputField,
} from '../FormField';
import './HeadingStyleSection.css';

export interface HeadingStyleSectionProps {
  headingLevel: 'h1' | 'h2' | 'h3' | 'h4';
  headingStyle: HeadingStyle;
  onChange: (updatedStyle: HeadingStyle) => void;
}

// Common font families
const FONT_FAMILIES = [
  'Georgia, serif',
  'Times New Roman, serif',
  'Garamond, serif',
  'Palatino, serif',
  'Baskerville, serif',
  'Arial, sans-serif',
  'Helvetica, sans-serif',
  'Verdana, sans-serif',
  'Trebuchet MS, sans-serif',
  'Gill Sans, sans-serif',
  'Courier New, monospace',
  'Monaco, monospace',
];

// Font weight options
const FONT_WEIGHT_OPTIONS = [
  { value: '100', label: '100 (Thin)' },
  { value: '200', label: '200 (Extra Light)' },
  { value: '300', label: '300 (Light)' },
  { value: 'normal', label: 'Normal (400)' },
  { value: '500', label: '500 (Medium)' },
  { value: '600', label: '600 (Semi Bold)' },
  { value: 'bold', label: 'Bold (700)' },
  { value: '800', label: '800 (Extra Bold)' },
  { value: '900', label: '900 (Black)' },
];

// Text transform options
const TEXT_TRANSFORM_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'uppercase', label: 'Uppercase' },
  { value: 'lowercase', label: 'Lowercase' },
  { value: 'capitalize', label: 'Capitalize' },
];

export const HeadingStyleSection: React.FC<HeadingStyleSectionProps> = ({
  headingLevel,
  headingStyle,
  onChange,
}) => {
  const updateStyle = (key: keyof HeadingStyle, value: string | undefined) => {
    onChange({
      ...headingStyle,
      [key]: value,
    });
  };

  const headingLevelLabel = headingLevel.toUpperCase();

  return (
    <div className="heading-style-section">
      <div className="heading-style-section__header">
        <h3 className="heading-style-section__title">{headingLevelLabel}</h3>
      </div>

      <div className="heading-style-section__content">
        <div className="heading-style-section__row">
          <AutocompleteField
            label="Font Family"
            id={`${headingLevel}-font-family`}
            value={headingStyle.fontFamily || ''}
            onChange={(value) => updateStyle('fontFamily', value)}
            options={FONT_FAMILIES}
            placeholder="e.g., Georgia, serif"
            helperText="Select from common fonts or enter a custom font stack"
          />
        </div>

        <div className="heading-style-section__row heading-style-section__row--two-col">
          <InputWithUnitField
            label="Font Size"
            id={`${headingLevel}-font-size`}
            value={headingStyle.fontSize}
            onChange={(value) => updateStyle('fontSize', value)}
            units={['px', 'em', 'rem', 'pt']}
            required
            helperText="Size of the heading text"
          />

          <SelectField
            label="Font Weight"
            id={`${headingLevel}-font-weight`}
            value={headingStyle.fontWeight || 'bold'}
            onChange={(value) => updateStyle('fontWeight', value)}
            options={FONT_WEIGHT_OPTIONS}
          />
        </div>

        <div className="heading-style-section__row heading-style-section__row--two-col">
          <SelectField
            label="Text Transform"
            id={`${headingLevel}-text-transform`}
            value={headingStyle.textTransform || 'none'}
            onChange={(value) =>
              updateStyle(
                'textTransform',
                value as 'none' | 'uppercase' | 'lowercase' | 'capitalize'
              )
            }
            options={TEXT_TRANSFORM_OPTIONS}
          />

          <InputWithUnitField
            label="Letter Spacing"
            id={`${headingLevel}-letter-spacing`}
            value={headingStyle.letterSpacing || '0px'}
            onChange={(value) => updateStyle('letterSpacing', value)}
            units={['px', 'em', 'rem']}
            helperText="Space between characters"
          />
        </div>

        <div className="heading-style-section__row">
          <InputField
            label="Line Height"
            id={`${headingLevel}-line-height`}
            value={headingStyle.lineHeight || ''}
            onChange={(value) => updateStyle('lineHeight', value)}
            placeholder="e.g., 1.2 or 1.2em"
            helperText="Line height (unitless number or with unit)"
          />
        </div>

        <div className="heading-style-section__divider">
          <span className="heading-style-section__divider-text">Spacing</span>
        </div>

        <div className="heading-style-section__row heading-style-section__row--two-col">
          <InputWithUnitField
            label="Margin Top"
            id={`${headingLevel}-margin-top`}
            value={headingStyle.marginTop || '0px'}
            onChange={(value) => updateStyle('marginTop', value)}
            units={['px', 'em', 'rem']}
            helperText="Space above heading"
          />

          <InputWithUnitField
            label="Margin Bottom"
            id={`${headingLevel}-margin-bottom`}
            value={headingStyle.marginBottom || '0px'}
            onChange={(value) => updateStyle('marginBottom', value)}
            units={['px', 'em', 'rem']}
            helperText="Space below heading"
          />
        </div>

        <div className="heading-style-section__row">
          <InputField
            label="Color"
            id={`${headingLevel}-color`}
            value={headingStyle.color || ''}
            onChange={(value) => updateStyle('color', value)}
            placeholder="e.g., #000000 or rgb(0,0,0)"
            helperText="Text color (hex, rgb, or named color)"
          />
        </div>
      </div>
    </div>
  );
};
