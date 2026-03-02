/**
 * Editor Component
 * Lazy-loaded editor with chapter navigation and state management
 */

import React, { useEffect, useState } from 'react';
import { ChapterStore, ChapterState } from '../../store/chapters';
import { Chapter } from '../../types/chapter';
import { TextBlock } from '../../types/textBlock';
import { EditorToolbar } from './EditorToolbar';
import { EditorContent } from './EditorContent';
import { LoadingOverlay } from './LoadingOverlay';
import './Editor.css';

export interface EditorProps {
  store: ChapterStore;
  initialChapterId?: string;
  onChapterChange?: (chapterId: string) => void;
}

export const Editor: React.FC<EditorProps> = ({
  store,
  initialChapterId,
  onChapterChange,
}) => {
  const [state, setState] = useState<ChapterState>(store.getState());
  const [chapters, setChapters] = useState<Chapter[]>([]);

  // Subscribe to store changes
  useEffect(() => {
    const unsubscribe = store.subscribe((newState) => {
      setState(newState);
    });

    // Load chapters
    setChapters(store.getAllChapters());

    // Load initial chapter if provided
    if (initialChapterId) {
      store.loadChapter(initialChapterId);
    }

    return unsubscribe;
  }, [store, initialChapterId]);

  // Notify parent of chapter changes
  useEffect(() => {
    if (state.activeChapterId && onChapterChange) {
      onChapterChange(state.activeChapterId);
    }
  }, [state.activeChapterId, onChapterChange]);

  const handleChapterSelect = async (chapterId: string) => {
    await store.loadChapter(chapterId);
  };

  const handleContentChange = (content: TextBlock[]) => {
    store.updateContent(content);
  };

  const handleSave = async () => {
    await store.saveCurrentChapter();
  };

  const handleUndo = () => {
    store.undo();
  };

  const handleRedo = () => {
    store.redo();
  };

  const handleNavigateNext = async () => {
    await store.navigateNext();
  };

  const handleNavigatePrevious = async () => {
    await store.navigatePrevious();
  };

  const currentChapter = state.activeChapterId
    ? store.getChapterInfo(state.activeChapterId)
    : null;

  return (
    <div className="editor-container">
      <EditorToolbar
        chapters={chapters}
        currentChapterId={state.activeChapterId}
        isDirty={state.isDirty}
        undoRedoState={state.undoRedoState}
        onChapterSelect={handleChapterSelect}
        onSave={handleSave}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onNavigateNext={handleNavigateNext}
        onNavigatePrevious={handleNavigatePrevious}
      />

      <div className="editor-main">
        {state.isLoading && <LoadingOverlay chapterTitle={currentChapter?.title} />}

        {!state.isLoading && state.activeChapterId ? (
          <EditorContent
            chapterId={state.activeChapterId}
            content={state.content}
            chapterTitle={currentChapter?.title}
            onChange={handleContentChange}
          />
        ) : (
          !state.isLoading && (
            <div className="editor-empty-state">
              <p>Select a chapter to start editing</p>
            </div>
          )
        )}
      </div>

      {state.isDirty && (
        <div className="editor-status-bar">
          <span className="status-indicator">Unsaved changes</span>
        </div>
      )}
    </div>
  );
};
