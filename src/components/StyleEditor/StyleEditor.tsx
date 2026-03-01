import React, { useState } from 'react';
import { BookStyle } from '../../types/style';
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

  return (
    <div className="style-editor">
      <div className="style-editor__container">
        <div className="style-editor__sections">
          <div className="style-editor__section">
            <h2 className="style-editor__section-title">Style Settings</h2>
            <div className="style-editor__section-content">
              {/* Style configuration forms will go here */}
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
