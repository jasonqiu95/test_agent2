import React, { useState } from 'react';
import { BookStyle } from '../../types/style';
import { FontSelector } from './FontSelector';
import './StyleEditor.css';

export interface StyleEditorProps {
  bookStyle: BookStyle;
  onChange: (updatedStyle: BookStyle) => void;
}

export const StyleEditor: React.FC<StyleEditorProps> = ({
  bookStyle,
  onChange,
}) => {
  const [currentStyle, setCurrentStyle] = useState<BookStyle>(bookStyle);

  const handleStyleChange = (updates: Partial<BookStyle>) => {
    const updatedStyle = { ...currentStyle, ...updates };
    setCurrentStyle(updatedStyle);
    onChange(updatedStyle);
  };

  const handleBodyFontChange = (fontFamily: string) => {
    handleStyleChange({
      fonts: {
        ...currentStyle.fonts,
        body: fontFamily,
      },
    });
  };

  const handleHeadingFontChange = (fontFamily: string) => {
    handleStyleChange({
      fonts: {
        ...currentStyle.fonts,
        heading: fontFamily,
      },
    });
  };

  const handleDropCapFontChange = (fontFamily: string) => {
    handleStyleChange({
      dropCap: {
        ...currentStyle.dropCap,
        fontFamily,
      },
    });
  };

  return (
    <div className="style-editor">
      <div className="style-editor__container">
        <div className="style-editor__sections">
          {/* Typography Section */}
          <div className="style-editor__section">
            <h2 className="style-editor__section-title">Typography</h2>
            <div className="style-editor__section-content">
              <FontSelector
                label="Body Font"
                value={currentStyle.fonts.body}
                onChange={handleBodyFontChange}
                placeholder="Select body font"
                allowCustom={true}
                enableGoogleFonts={true}
              />

              <FontSelector
                label="Heading Font"
                value={currentStyle.fonts.heading}
                onChange={handleHeadingFontChange}
                placeholder="Select heading font"
                allowCustom={true}
                enableGoogleFonts={true}
              />
            </div>
          </div>

          {/* Drop Caps Section */}
          <div className="style-editor__section">
            <h2 className="style-editor__section-title">Drop Caps</h2>
            <div className="style-editor__section-content">
              <div className="style-editor__field">
                <label className="style-editor__checkbox-label">
                  <input
                    type="checkbox"
                    checked={currentStyle.dropCap.enabled}
                    onChange={(e) =>
                      handleStyleChange({
                        dropCap: {
                          ...currentStyle.dropCap,
                          enabled: e.target.checked,
                        },
                      })
                    }
                  />
                  <span>Enable Drop Caps</span>
                </label>
              </div>

              {currentStyle.dropCap.enabled && (
                <FontSelector
                  label="Drop Cap Font"
                  value={currentStyle.dropCap.fontFamily || currentStyle.fonts.heading}
                  onChange={handleDropCapFontChange}
                  placeholder="Select drop cap font"
                  allowCustom={true}
                  enableGoogleFonts={true}
                />
              )}
            </div>
          </div>

          <div className="style-editor__section">
            <h2 className="style-editor__section-title">Additional Settings</h2>
            <div className="style-editor__section-content">
              {/* Additional style configuration forms will go here */}
            </div>
          </div>
        </div>

        <div className="style-editor__preview">
          <div className="style-editor__preview-header">
            <h2 className="style-editor__section-title">Live Preview</h2>
          </div>
          <div className="style-editor__preview-content">
            {/* Preview content */}
            <div
              className="style-editor__preview-sample"
              style={{
                fontFamily: currentStyle.fonts.body,
                fontSize: currentStyle.body.fontSize,
                lineHeight: currentStyle.body.lineHeight,
              }}
            >
              <h1 style={{ fontFamily: currentStyle.fonts.heading }}>
                {currentStyle.headings.h1.fontSize && (
                  <span style={{ fontSize: currentStyle.headings.h1.fontSize }}>
                    Sample Heading
                  </span>
                )}
                {!currentStyle.headings.h1.fontSize && 'Sample Heading'}
              </h1>
              <p>
                {currentStyle.dropCap.enabled && (
                  <span
                    className="drop-cap"
                    style={{
                      fontFamily: currentStyle.dropCap.fontFamily || currentStyle.fonts.heading,
                      fontSize: currentStyle.dropCap.fontSize,
                      fontWeight: currentStyle.dropCap.fontWeight,
                      color: currentStyle.dropCap.color,
                      float: 'left',
                      lineHeight: '0.8',
                      marginRight: currentStyle.dropCap.marginRight || '0.1em',
                      padding: '0.1em 0.1em 0 0',
                    }}
                  >
                    L
                  </span>
                )}
                orem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
                ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                aliquip ex ea commodo consequat.
              </p>
              <p>
                Duis aute irure dolor in reprehenderit in voluptate velit esse
                cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
                cupidatat non proident, sunt in culpa qui officia deserunt mollit
                anim id est laborum.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
