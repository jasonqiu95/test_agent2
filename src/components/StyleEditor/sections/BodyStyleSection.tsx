import React from 'react';
import { BookStyle } from '../../../types/style';
import { SelectField, InputField, RadioGroup } from './FormField';
import './BodyStyleSection.css';

export interface BodyStyleSectionProps {
  bookStyle: BookStyle;
  onChange: (updates: Partial<BookStyle>) => void;
}

const FONT_FAMILIES = [
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
  { value: 'Garamond, serif', label: 'Garamond' },
  { value: 'Baskerville, serif', label: 'Baskerville' },
  { value: 'Palatino, serif', label: 'Palatino' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: 'system-ui, sans-serif', label: 'System UI' },
];

const FONT_WEIGHTS = [
  { value: '300', label: 'Light (300)' },
  { value: '400', label: 'Normal (400)' },
  { value: '500', label: 'Medium (500)' },
  { value: '600', label: 'Semi-bold (600)' },
  { value: '700', label: 'Bold (700)' },
];

const TEXT_ALIGNMENT = [
  { value: 'left', label: 'Left' },
  { value: 'justify', label: 'Justify' },
];

export const BodyStyleSection: React.FC<BodyStyleSectionProps> = ({
  bookStyle,
  onChange,
}) => {
  const handleFontFamilyChange = (value: string) => {
    onChange({
      fonts: {
        ...bookStyle.fonts,
        body: value,
      },
    });
  };

  const handleFontSizeChange = (value: string) => {
    onChange({
      body: {
        ...bookStyle.body,
        fontSize: value,
      },
    });
  };

  const handleLineHeightChange = (value: string) => {
    onChange({
      body: {
        ...bookStyle.body,
        lineHeight: value,
      },
    });
  };

  const handleFontWeightChange = (value: string) => {
    onChange({
      body: {
        ...bookStyle.body,
        fontWeight: value,
      },
    });
  };

  const handleTextAlignChange = (value: string) => {
    onChange({
      body: {
        ...bookStyle.body,
        textAlign: value as 'left' | 'justify',
      },
    });
  };

  const handleParagraphSpacingChange = (value: string) => {
    onChange({
      spacing: {
        ...bookStyle.spacing,
        paragraphSpacing: value,
      },
    });
  };

  return (
    <div className="body-style-section">
      <h3 className="body-style-section__title">Body Text Style</h3>

      <div className="body-style-section__content">
        <SelectField
          label="Font Family"
          value={bookStyle.fonts.body}
          options={FONT_FAMILIES}
          onChange={handleFontFamilyChange}
          hint="Select the font for body text"
        />

        <InputField
          label="Font Size"
          value={bookStyle.body.fontSize}
          onChange={handleFontSizeChange}
          type="text"
          placeholder="e.g., 12pt, 1rem"
          hint="Specify font size with units (pt, px, rem, em)"
        />

        <InputField
          label="Line Height (Leading)"
          value={bookStyle.body.lineHeight}
          onChange={handleLineHeightChange}
          type="text"
          placeholder="e.g., 1.5, 18pt"
          hint="Set line spacing (unitless number or with units)"
        />

        <SelectField
          label="Font Weight"
          value={bookStyle.body.fontWeight || '400'}
          options={FONT_WEIGHTS}
          onChange={handleFontWeightChange}
          hint="Choose the weight of the body text"
        />

        <RadioGroup
          label="Text Alignment"
          value={bookStyle.body.textAlign || 'left'}
          options={TEXT_ALIGNMENT}
          onChange={handleTextAlignChange}
          hint="Choose how text is aligned in paragraphs"
        />

        <div className="body-style-section__margins">
          <h4 className="body-style-section__subtitle">Paragraph Margins</h4>

          <InputField
            label="Paragraph Spacing"
            value={bookStyle.spacing.paragraphSpacing}
            onChange={handleParagraphSpacingChange}
            type="text"
            placeholder="e.g., 0.5em, 8pt"
            hint="Space between paragraphs"
          />
        </div>
      </div>
    </div>
  );
};
