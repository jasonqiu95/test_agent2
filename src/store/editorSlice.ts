/**
 * Editor Redux Slice
 *
 * Manages the ProseMirror editor state in Redux store with controlled component pattern.
 * Handles content synchronization, selection state, and editor metadata.
 */

import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { Node as PMNode } from 'prosemirror-model';
import { RootState } from './index';

/**
 * Editor selection state
 */
export interface EditorSelection {
  anchor: number;
  head: number;
}

/**
 * Editor metadata
 */
export interface EditorMetadata {
  wordCount: number;
  characterCount: number;
  isDirty: boolean;
  lastSaved: string | null;
  isEmpty: boolean;
}

/**
 * Editor state structure
 */
export interface EditorState {
  /** Currently active chapter/document ID */
  activeChapterId: string | null;

  /** Editor content in ProseMirror JSON format */
  content: Record<string, any> | null;

  /** Current selection state */
  selection: EditorSelection | null;

  /** Editor metadata */
  metadata: EditorMetadata;

  /** Loading state for async operations */
  isLoading: boolean;

  /** Error state */
  error: string | null;
}

const initialState: EditorState = {
  activeChapterId: null,
  content: null,
  selection: null,
  metadata: {
    wordCount: 0,
    characterCount: 0,
    isDirty: false,
    lastSaved: null,
    isEmpty: true,
  },
  isLoading: false,
  error: null,
};

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    /**
     * Set the active chapter
     */
    setActiveChapter: (state, action: PayloadAction<string>) => {
      state.activeChapterId = action.payload;
      state.error = null;
    },

    /**
     * Set editor content from ProseMirror JSON
     * This is the main action for updating editor state
     */
    setEditorContent: (state, action: PayloadAction<Record<string, any>>) => {
      state.content = action.payload;
      state.metadata.isDirty = true;
      state.error = null;
    },

    /**
     * Update editor content with calculated metadata
     * Used when content changes to update both content and metadata
     */
    updateEditorContent: (
      state,
      action: PayloadAction<{
        content: Record<string, any>;
        metadata?: Partial<EditorMetadata>;
      }>
    ) => {
      state.content = action.payload.content;

      if (action.payload.metadata) {
        state.metadata = {
          ...state.metadata,
          ...action.payload.metadata,
          isDirty: true,
        };
      } else {
        state.metadata.isDirty = true;
      }

      state.error = null;
    },

    /**
     * Update editor selection
     */
    updateSelection: (state, action: PayloadAction<EditorSelection>) => {
      state.selection = action.payload;
    },

    /**
     * Update editor metadata
     */
    updateMetadata: (state, action: PayloadAction<Partial<EditorMetadata>>) => {
      state.metadata = {
        ...state.metadata,
        ...action.payload,
      };
    },

    /**
     * Mark content as saved
     */
    markAsSaved: (state) => {
      state.metadata.isDirty = false;
      state.metadata.lastSaved = new Date().toISOString();
    },

    /**
     * Set loading state
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    /**
     * Set error state
     */
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },

    /**
     * Clear editor state
     */
    clearEditor: (state) => {
      state.activeChapterId = null;
      state.content = null;
      state.selection = null;
      state.metadata = initialState.metadata;
      state.isLoading = false;
      state.error = null;
    },

    /**
     * Load chapter content into editor
     */
    loadChapterContent: (
      state,
      action: PayloadAction<{
        chapterId: string;
        content: Record<string, any>;
        metadata?: Partial<EditorMetadata>;
      }>
    ) => {
      state.activeChapterId = action.payload.chapterId;
      state.content = action.payload.content;

      if (action.payload.metadata) {
        state.metadata = {
          ...initialState.metadata,
          ...action.payload.metadata,
          isDirty: false,
        };
      } else {
        state.metadata = {
          ...initialState.metadata,
          isDirty: false,
        };
      }

      state.selection = null;
      state.isLoading = false;
      state.error = null;
    },
  },
});

// Export actions
export const {
  setActiveChapter,
  setEditorContent,
  updateEditorContent,
  updateSelection,
  updateMetadata,
  markAsSaved,
  setLoading,
  setError,
  clearEditor,
  loadChapterContent,
} = editorSlice.actions;

// Basic selectors
export const selectActiveChapterId = (state: RootState) => state.editor.activeChapterId;
export const selectEditorContent = (state: RootState) => state.editor.content;
export const selectEditorSelection = (state: RootState) => state.editor.selection;
export const selectEditorMetadata = (state: RootState) => state.editor.metadata;
export const selectEditorIsLoading = (state: RootState) => state.editor.isLoading;
export const selectEditorError = (state: RootState) => state.editor.error;

// Memoized selectors
export const selectEditorIsDirty = createSelector(
  [selectEditorMetadata],
  (metadata) => metadata.isDirty
);

export const selectEditorWordCount = createSelector(
  [selectEditorMetadata],
  (metadata) => metadata.wordCount
);

export const selectEditorIsEmpty = createSelector(
  [selectEditorMetadata],
  (metadata) => metadata.isEmpty
);

/**
 * Select current chapter content
 * Combines editor content with active chapter ID
 */
export const selectCurrentChapterContent = createSelector(
  [selectActiveChapterId, selectEditorContent],
  (chapterId, content) => {
    if (!chapterId || !content) {
      return null;
    }
    return {
      chapterId,
      content,
    };
  }
);

/**
 * Select editor full state
 * Useful for components that need multiple pieces of editor state
 */
export const selectEditorState = createSelector(
  [
    selectActiveChapterId,
    selectEditorContent,
    selectEditorSelection,
    selectEditorMetadata,
    selectEditorIsLoading,
    selectEditorError,
  ],
  (activeChapterId, content, selection, metadata, isLoading, error) => ({
    activeChapterId,
    content,
    selection,
    metadata,
    isLoading,
    error,
  })
);

export default editorSlice.reducer;
