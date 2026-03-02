import React, { useState, useEffect, useCallback } from 'react';
import { BookStyle } from '../../types/style';
import { StylePreviewPanel } from './StylePreviewPanel';
import { OrnamentalBreaksSection, BodyStyleSection } from './sections';
import { FontSelector } from './FontSelector';
import { HeadingStyleSection } from './sections/HeadingStyleSection';
import { useStyleEditor } from './useStyleEditor';
import { StyleEditorToolbar } from './StyleEditorToolbar';
import { SaveStyleDialog } from './SaveStyleDialog';
import { ConfirmDialog } from './ConfirmDialog';
import { saveCustomStyle } from '../../services/styleService';
import './StyleEditor.css';

export interface StyleEditorProps {
  bookStyle: BookStyle;
  onChange: (updatedStyle: BookStyle) => void;
  onApply?: () => void;
}

export const StyleEditor: React.FC<StyleEditorProps> = ({
  bookStyle,
  onChange,
  onApply,
}) => {
  const {
    currentStyle,
    isDirty,
    validationErrors,
    isValid,
    updateStyle,
    updateBodyFont,
    updateHeadingFont,
    updateDropCapFont,
    updateHeading,
    resetStyle,
  } = useStyleEditor(bookStyle, {
    debounceMs: 300,
    onChange,
  });

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Handle Cmd+S keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (isDirty && isValid) {
          handleSaveClick();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirty, isValid]);

  const handleSaveClick = useCallback(() => {
    setShowSaveDialog(true);
    setSaveError(null);
  }, []);

  const handleSaveStyle = useCallback(async (name: string, description: string) => {
    try {
      const customStyle: BookStyle = {
        ...currentStyle,
        id: `custom-${Date.now()}`,
        name,
        description,
        category: 'custom',
      };

      await saveCustomStyle(customStyle);
      setShowSaveDialog(false);
      setSaveError(null);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save style');
    }
  }, [currentStyle]);

  const handleResetClick = useCallback(() => {
    if (isDirty) {
      setShowResetDialog(true);
    }
  }, [isDirty]);

  const handleResetConfirm = useCallback(() => {
    resetStyle();
    setShowResetDialog(false);
  }, [resetStyle]);

  const handleApply = useCallback(() => {
    if (isValid) {
      onChange(currentStyle);
      onApply?.();
    }
  }, [isValid, currentStyle, onChange, onApply]);

  return (
    <div className="style-editor">
      {/* Toolbar */}
      <StyleEditorToolbar
        isDirty={isDirty}
        isValid={isValid}
        onSave={handleSaveClick}
        onReset={handleResetClick}
        onApply={handleApply}
      />

      {/* Validation Errors Display */}
      {validationErrors.length > 0 && (
        <div className="style-editor__validation-errors">
          <div className="style-editor__validation-header">
            <span className="style-editor__validation-icon">⚠️</span>
            <strong>Validation Errors:</strong>
          </div>
          <ul className="style-editor__validation-list">
            {validationErrors.map((error, index) => (
              <li key={index} className="style-editor__validation-error">
                <span className="style-editor__validation-field">{error.field}:</span>{' '}
                {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Dirty State Indicator */}
      {isDirty && isValid && (
        <div className="style-editor__dirty-indicator">
          <span className="style-editor__dirty-icon">●</span>
          Unsaved changes
        </div>
      )}

      {/* Save Error Display */}
      {saveError && (
        <div className="style-editor__validation-errors">
          <div className="style-editor__validation-header">
            <span className="style-editor__validation-icon">⚠️</span>
            <strong>Save Error:</strong>
          </div>
          <p className="style-editor__validation-error">{saveError}</p>
        </div>
      )}

      <div className="style-editor__container">
        <div className="style-editor__sections">
          {/* Typography Section */}
          <div className="style-editor__section">
            <h2 className="style-editor__section-title">Typography</h2>
            <div className="style-editor__section-content">
              <FontSelector
                label="Body Font"
                value={currentStyle.fonts.body}
                onChange={updateBodyFont}
                placeholder="Select body font"
                allowCustom={true}
                enableGoogleFonts={true}
              />

              <FontSelector
                label="Heading Font"
                value={currentStyle.fonts.heading}
                onChange={updateHeadingFont}
                placeholder="Select heading font"
                allowCustom={true}
                enableGoogleFonts={true}
              />
            </div>
          </div>

          {/* Body Text Section */}
          <div className="style-editor__section">
            <h2 className="style-editor__section-title">Body Text</h2>
            <div className="style-editor__section-content">
              <BodyStyleSection
                bookStyle={currentStyle}
                onChange={updateStyle}
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
                onChange={(style) => updateHeading('h1', style)}
              />
              <HeadingStyleSection
                headingLevel="h2"
                headingStyle={currentStyle.headings.h2}
                onChange={(style) => updateHeading('h2', style)}
              />
              <HeadingStyleSection
                headingLevel="h3"
                headingStyle={currentStyle.headings.h3}
                onChange={(style) => updateHeading('h3', style)}
              />
              {currentStyle.headings.h4 && (
                <HeadingStyleSection
                  headingLevel="h4"
                  headingStyle={currentStyle.headings.h4}
                  onChange={(style) => updateHeading('h4', style)}
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
                      updateStyle({
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
                  onChange={updateDropCapFont}
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
                onChange={updateStyle}
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

      {/* Save Dialog */}
      <SaveStyleDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveStyle}
        defaultName={`Custom ${bookStyle.name}`}
        defaultDescription={`Custom variation of ${bookStyle.name}`}
      />

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showResetDialog}
        title="Reset to Default"
        message="Are you sure you want to reset all changes? This action cannot be undone."
        confirmLabel="Reset"
        cancelLabel="Cancel"
        confirmVariant="danger"
        onConfirm={handleResetConfirm}
        onCancel={() => setShowResetDialog(false)}
      />
    </div>
  );
};
