/**
 * Style slice for managing style settings and style library
 * Handles CRUD operations for styles and style templates
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Style } from '../types/style';

export interface StyleTemplate {
  id: string;
  name: string;
  description?: string;
  styles: Style[];
  category: 'heading' | 'paragraph' | 'list' | 'quote' | 'code' | 'custom';
  isBuiltIn?: boolean;
}

export interface StyleState {
  styles: Style[];
  templates: StyleTemplate[];
  currentStyleId: string | null;
  recentlyUsed: string[]; // IDs of recently used styles
  favorites: string[]; // IDs of favorite styles
}

const initialState: StyleState = {
  styles: [],
  templates: [],
  currentStyleId: null,
  recentlyUsed: [],
  favorites: [],
};

const styleSlice = createSlice({
  name: 'style',
  initialState,
  reducers: {
    // Style CRUD operations
    addStyle: (state, action: PayloadAction<Style>) => {
      state.styles.push(action.payload);
    },
    updateStyle: (state, action: PayloadAction<{ id: string; style: Partial<Style> }>) => {
      const index = state.styles.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.styles[index] = {
          ...state.styles[index],
          ...action.payload.style,
          updatedAt: new Date(),
        };
      }
    },
    deleteStyle: (state, action: PayloadAction<string>) => {
      state.styles = state.styles.filter(s => s.id !== action.payload);
      // Remove from favorites and recently used
      state.favorites = state.favorites.filter(id => id !== action.payload);
      state.recentlyUsed = state.recentlyUsed.filter(id => id !== action.payload);
      // Clear if it was current
      if (state.currentStyleId === action.payload) {
        state.currentStyleId = null;
      }
    },
    duplicateStyle: (state, action: PayloadAction<{ id: string; newId: string }>) => {
      const style = state.styles.find(s => s.id === action.payload.id);
      if (style) {
        const duplicate: Style = {
          ...style,
          id: action.payload.newId,
          name: `${style.name} (Copy)`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        state.styles.push(duplicate);
      }
    },
    setStyles: (state, action: PayloadAction<Style[]>) => {
      state.styles = action.payload;
    },

    // Current style selection
    setCurrentStyle: (state, action: PayloadAction<string | null>) => {
      state.currentStyleId = action.payload;
      // Add to recently used
      if (action.payload && !state.recentlyUsed.includes(action.payload)) {
        state.recentlyUsed.unshift(action.payload);
        // Keep only last 10 recently used
        if (state.recentlyUsed.length > 10) {
          state.recentlyUsed.pop();
        }
      }
    },

    // Favorites
    addToFavorites: (state, action: PayloadAction<string>) => {
      if (!state.favorites.includes(action.payload)) {
        state.favorites.push(action.payload);
      }
    },
    removeFromFavorites: (state, action: PayloadAction<string>) => {
      state.favorites = state.favorites.filter(id => id !== action.payload);
    },
    toggleFavorite: (state, action: PayloadAction<string>) => {
      const index = state.favorites.indexOf(action.payload);
      if (index !== -1) {
        state.favorites.splice(index, 1);
      } else {
        state.favorites.push(action.payload);
      }
    },

    // Templates
    addTemplate: (state, action: PayloadAction<StyleTemplate>) => {
      state.templates.push(action.payload);
    },
    updateTemplate: (
      state,
      action: PayloadAction<{ id: string; template: Partial<StyleTemplate> }>
    ) => {
      const index = state.templates.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.templates[index] = {
          ...state.templates[index],
          ...action.payload.template,
        };
      }
    },
    deleteTemplate: (state, action: PayloadAction<string>) => {
      state.templates = state.templates.filter(t => t.id !== action.payload);
    },
    applyTemplate: (state, action: PayloadAction<string>) => {
      const template = state.templates.find(t => t.id === action.payload);
      if (template) {
        // Add all styles from template
        template.styles.forEach(style => {
          const exists = state.styles.find(s => s.id === style.id);
          if (!exists) {
            state.styles.push(style);
          }
        });
      }
    },
    setTemplates: (state, action: PayloadAction<StyleTemplate[]>) => {
      state.templates = action.payload;
    },

    // Bulk operations
    importStyles: (state, action: PayloadAction<Style[]>) => {
      action.payload.forEach(style => {
        const exists = state.styles.find(s => s.id === style.id);
        if (!exists) {
          state.styles.push(style);
        }
      });
    },
    clearRecentlyUsed: (state) => {
      state.recentlyUsed = [];
    },
    resetStyles: () => initialState,
  },
});

export const {
  addStyle,
  updateStyle,
  deleteStyle,
  duplicateStyle,
  setStyles,
  setCurrentStyle,
  addToFavorites,
  removeFromFavorites,
  toggleFavorite,
  addTemplate,
  updateTemplate,
  deleteTemplate,
  applyTemplate,
  setTemplates,
  importStyles,
  clearRecentlyUsed,
  resetStyles,
} = styleSlice.actions;

export default styleSlice.reducer;
