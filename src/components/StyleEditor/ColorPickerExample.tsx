import React, { useState } from 'react';
import { ColorPicker } from './ColorPicker';

/**
 * Example usage of the ColorPicker component
 * This demonstrates how to use the ColorPicker for text colors, background colors, and drop cap colors
 */
export const ColorPickerExample: React.FC = () => {
  const [textColor, setTextColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [dropCapColor, setDropCapColor] = useState('#704214');
  const [headingColor, setHeadingColor] = useState('#333333');

  return (
    <div style={{ padding: '2rem', maxWidth: '600px' }}>
      <h1>ColorPicker Component Example</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '2rem' }}>
        <ColorPicker
          label="Text Color"
          value={textColor}
          onChange={setTextColor}
        />

        <ColorPicker
          label="Background Color"
          value={backgroundColor}
          onChange={setBackgroundColor}
        />

        <ColorPicker
          label="Drop Cap Color"
          value={dropCapColor}
          onChange={setDropCapColor}
        />

        <ColorPicker
          label="Heading Color"
          value={headingColor}
          onChange={setHeadingColor}
        />
      </div>

      <div
        style={{
          marginTop: '2rem',
          padding: '2rem',
          backgroundColor,
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}
      >
        <h2 style={{ color: headingColor }}>Preview</h2>
        <p style={{ color: textColor }}>
          <span style={{
            fontSize: '3rem',
            float: 'left',
            marginRight: '0.5rem',
            lineHeight: '2.5rem',
            color: dropCapColor,
            fontWeight: 'bold'
          }}>
            T
          </span>
          his is a preview of your color selections. The ColorPicker component supports hex input, RGB input, and a visual color picker with preset color swatches. It includes common book colors like black, dark gray, and various sepia tones. The component is fully accessible with keyboard navigation support.
        </p>
      </div>
    </div>
  );
};
