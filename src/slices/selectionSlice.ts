/**
 * Redux slice for current selection state
 * Tracks selected chapters, elements, text blocks, and ranges
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type SelectionType = 'chapter' | 'element' | 'textBlock' | 'textRange' | null;

interface TextRange {
  blockId: string;
  start: number;
  end: number;
}

interface SelectionState {
  type: SelectionType;
  chapterId: string | null;
  elementId: string | null;
  textBlockId: string | null;
  textRange: TextRange | null;
  multipleSelection: string[]; // Array of IDs for multi-select
  clipboardContent: any | null; // For copy/paste operations
}

const initialState: SelectionState = {
  type: null,
  chapterId: null,
  elementId: null,
  textBlockId: null,
  textRange: null,
  multipleSelection: [],
  clipboardContent: null,
};

const selectionSlice = createSlice({
  name: 'selection',
  initialState,
  reducers: {
    selectChapter: (state, action: PayloadAction<string>) => {
      state.type = 'chapter';
      state.chapterId = action.payload;
      state.elementId = null;
      state.textBlockId = null;
      state.textRange = null;
      state.multipleSelection = [];
    },
    selectElement: (state, action: PayloadAction<string>) => {
      state.type = 'element';
      state.elementId = action.payload;
      state.chapterId = null;
      state.textBlockId = null;
      state.textRange = null;
      state.multipleSelection = [];
    },
    selectTextBlock: (
      state,
      action: PayloadAction<{ chapterId?: string; elementId?: string; textBlockId: string }>
    ) => {
      state.type = 'textBlock';
      state.textBlockId = action.payload.textBlockId;
      state.chapterId = action.payload.chapterId || null;
      state.elementId = action.payload.elementId || null;
      state.textRange = null;
      state.multipleSelection = [];
    },
    selectTextRange: (
      state,
      action: PayloadAction<{
        chapterId?: string;
        elementId?: string;
        textBlockId: string;
        start: number;
        end: number;
      }>
    ) => {
      state.type = 'textRange';
      state.textBlockId = action.payload.textBlockId;
      state.chapterId = action.payload.chapterId || null;
      state.elementId = action.payload.elementId || null;
      state.textRange = {
        blockId: action.payload.textBlockId,
        start: action.payload.start,
        end: action.payload.end,
      };
      state.multipleSelection = [];
    },
    selectMultiple: (state, action: PayloadAction<{ type: SelectionType; ids: string[] }>) => {
      state.type = action.payload.type;
      state.multipleSelection = action.payload.ids;
      state.chapterId = null;
      state.elementId = null;
      state.textBlockId = null;
      state.textRange = null;
    },
    addToSelection: (state, action: PayloadAction<string>) => {
      if (!state.multipleSelection.includes(action.payload)) {
        state.multipleSelection.push(action.payload);
      }
    },
    removeFromSelection: (state, action: PayloadAction<string>) => {
      state.multipleSelection = state.multipleSelection.filter((id) => id !== action.payload);
    },
    clearSelection: (state) => {
      state.type = null;
      state.chapterId = null;
      state.elementId = null;
      state.textBlockId = null;
      state.textRange = null;
      state.multipleSelection = [];
    },
    copyToClipboard: (state, action: PayloadAction<any>) => {
      state.clipboardContent = action.payload;
    },
    clearClipboard: (state) => {
      state.clipboardContent = null;
    },
  },
});

export const {
  selectChapter,
  selectElement,
  selectTextBlock,
  selectTextRange,
  selectMultiple,
  addToSelection,
  removeFromSelection,
  clearSelection,
  copyToClipboard,
  clearClipboard,
} = selectionSlice.actions;

export default selectionSlice.reducer;
