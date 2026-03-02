import React from 'react';
import './StyleEditorToolbar.css';

export interface StyleEditorToolbarProps {
  isDirty: boolean;
  isValid: boolean;
  onSave: () => void;
  onReset: () => void;
  onApply: () => void;
}

export const StyleEditorToolbar: React.FC<StyleEditorToolbarProps> = ({
  isDirty,
  isValid,
  onSave,
  onReset,
  onApply,
}) => {
  return (
    <div className="style-editor-toolbar">
      <div className="style-editor-toolbar__actions">
        <button
          className="style-editor-toolbar__btn style-editor-toolbar__btn--save"
          onClick={onSave}
          disabled={!isDirty || !isValid}
          title="Save as custom style (Cmd+S)"
        >
          Save Custom Style
        </button>
        <button
          className="style-editor-toolbar__btn style-editor-toolbar__btn--reset"
          onClick={onReset}
          disabled={!isDirty}
          title="Reset to default"
        >
          Reset to Default
        </button>
        <button
          className="style-editor-toolbar__btn style-editor-toolbar__btn--primary"
          onClick={onApply}
          disabled={!isValid}
          title="Apply changes to document"
        >
          Apply
        </button>
      </div>
    </div>
  );
};
