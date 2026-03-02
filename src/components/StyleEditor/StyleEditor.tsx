import React, { useState } from 'react';
import { BookStyle, HeadingStyle } from '../../types/style';
import { StylePreviewPanel } from './StylePreviewPanel';
import { OrnamentalBreaksSection } from './sections';
import { FontSelector } from './FontSelector';
import { HeadingStyleSection } from './sections/HeadingStyleSection';
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

  const handleHeadingChange = (
    level: 'h1' | 'h2' | 'h3' | 'h4',
    updatedHeadingStyle: HeadingStyle
  ) => {
    handleStyleChange({
      headings: {
        ...currentStyle.headings,
        [level]: updatedHeadingStyle,
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

          {/* Heading Styles Section */}
          <div className="style-editor__section">
            <h2 className="style-editor__section-title">Heading Styles</h2>
            <div className="style-editor__section-content">
              <HeadingStyleSection
                headingLevel="h1"
                headingStyle={currentStyle.headings.h1}
                onChange={(style) => handleHeadingChange('h1', style)}
              />
              <HeadingStyleSection
                headingLevel="h2"
                headingStyle={currentStyle.headings.h2}
                onChange={(style) => handleHeadingChange('h2', style)}
              />
              <HeadingStyleSection
                headingLevel="h3"
                headingStyle={currentStyle.headings.h3}
                onChange={(style) => handleHeadingChange('h3', style)}
              />
              {currentStyle.headings.h4 && (
                <HeadingStyleSection
                  headingLevel="h4"
                  headingStyle={currentStyle.headings.h4}
                  onChange={(style) => handleHeadingChange('h4', style)}
                />
              )}
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

          {/* Ornamental Breaks Section */}
          <div className="style-editor__section">
            <h2 className="style-editor__section-title">Ornamental Breaks</h2>
            <div className="style-editor__section-content">
              <OrnamentalBreaksSection
                bookStyle={currentStyle}
                onChange={handleStyleChange}
              />
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
            <StylePreviewPanel bookStyle={currentStyle} />
          </div>
        </div>
      </div>
    </div>
  );
};
