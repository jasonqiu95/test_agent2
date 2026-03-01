/**
 * Editor Toolbar Component
 * Navigation and action controls for the editor
 */

import React from 'react';
import { Chapter } from '../../types/chapter';
import { UndoRedoState } from '../../store/chapters';

export interface EditorToolbarProps {
  chapters: Chapter[];
  currentChapterId: string | null;
  isDirty: boolean;
  undoRedoState: UndoRedoState;
  onChapterSelect: (chapterId: string) => void;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onNavigateNext: () => void;
  onNavigatePrevious: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  chapters,
  currentChapterId,
  isDirty,
  undoRedoState,
  onChapterSelect,
  onSave,
  onUndo,
  onRedo,
  onNavigateNext,
  onNavigatePrevious,
}) => {
  const currentIndex = chapters.findIndex((ch) => ch.id === currentChapterId);
  const isFirstChapter = currentIndex === 0;
  const isLastChapter = currentIndex === chapters.length - 1;

  return (
    <div className="editor-toolbar">
      <div className="toolbar-section toolbar-navigation">
        <button
          className="toolbar-button"
          onClick={onNavigatePrevious}
          disabled={isFirstChapter || currentChapterId === null}
          title="Previous Chapter"
        >
          ← Previous
        </button>

        <select
          className="chapter-selector"
          value={currentChapterId || ''}
          onChange={(e) => onChapterSelect(e.target.value)}
        >
          <option value="" disabled>
            Select Chapter
          </option>
          {chapters.map((chapter) => (
            <option key={chapter.id} value={chapter.id}>
              {chapter.number ? `${chapter.number}. ` : ''}
              {chapter.title}
            </option>
          ))}
        </select>

        <button
          className="toolbar-button"
          onClick={onNavigateNext}
          disabled={isLastChapter || currentChapterId === null}
          title="Next Chapter"
        >
          Next →
        </button>
      </div>

      <div className="toolbar-section toolbar-actions">
        <button
          className="toolbar-button"
          onClick={onUndo}
          disabled={!undoRedoState.canUndo}
          title={`Undo (${undoRedoState.undoCount})`}
        >
          ↶ Undo
        </button>

        <button
          className="toolbar-button"
          onClick={onRedo}
          disabled={!undoRedoState.canRedo}
          title={`Redo (${undoRedoState.redoCount})`}
        >
          ↷ Redo
        </button>

        <button
          className={`toolbar-button toolbar-button-save ${isDirty ? 'dirty' : ''}`}
          onClick={onSave}
          disabled={!isDirty}
          title="Save Changes"
        >
          💾 Save
        </button>
      </div>
    </div>
  );
};
