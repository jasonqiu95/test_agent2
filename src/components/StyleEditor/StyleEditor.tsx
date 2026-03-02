import React, { useState } from 'react';
import { BookStyle, HeadingStyle } from '../../types/style';
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
        </div>

        <div className="style-editor__preview">
          <div className="style-editor__preview-header">
            <h2 className="style-editor__section-title">Live Preview</h2>
          </div>
          <div className="style-editor__preview-content">
            {/* Live preview will be rendered here */}
          </div>
        </div>
      </div>
    </div>
  );
};
