/**
 * Redux slice for UI state management
 * Handles panels, modals, navigation, and view settings
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ViewMode = 'editor' | 'split' | 'preview';
export type PanelType = 'chapters' | 'styles' | 'outline' | 'properties' | 'search';

interface UIState {
  // View and layout
  viewMode: ViewMode;
  activePanels: PanelType[];
  sidebarCollapsed: boolean;
  propertiesPanelCollapsed: boolean;

  // Navigation
  activeView: 'book' | 'chapter' | 'element';
  breadcrumbs: Array<{ id: string; label: string; type: string }>;

  // Modals and dialogs
  activeModal: string | null;
  modalData: any | null;

  // Notifications
  notifications: Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    timestamp: Date;
  }>;

  // Search
  searchQuery: string;
  searchResults: any[];
  searchActive: boolean;

  // Editor settings
  showLineNumbers: boolean;
  showWordCount: boolean;
  fontSize: number;
  editorTheme: 'light' | 'dark';

  // Zoom and scale
  zoomLevel: number;
}

const initialState: UIState = {
  viewMode: 'editor',
  activePanels: ['chapters', 'properties'],
  sidebarCollapsed: false,
  propertiesPanelCollapsed: false,
  activeView: 'book',
  breadcrumbs: [],
  activeModal: null,
  modalData: null,
  notifications: [],
  searchQuery: '',
  searchResults: [],
  searchActive: false,
  showLineNumbers: true,
  showWordCount: true,
  fontSize: 14,
  editorTheme: 'light',
  zoomLevel: 100,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // View mode
    setViewMode: (state, action: PayloadAction<ViewMode>) => {
      state.viewMode = action.payload;
    },

    // Panel management
    togglePanel: (state, action: PayloadAction<PanelType>) => {
      const index = state.activePanels.indexOf(action.payload);
      if (index !== -1) {
        state.activePanels.splice(index, 1);
      } else {
        state.activePanels.push(action.payload);
      }
    },
    openPanel: (state, action: PayloadAction<PanelType>) => {
      if (!state.activePanels.includes(action.payload)) {
        state.activePanels.push(action.payload);
      }
    },
    closePanel: (state, action: PayloadAction<PanelType>) => {
      state.activePanels = state.activePanels.filter((panel) => panel !== action.payload);
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    togglePropertiesPanel: (state) => {
      state.propertiesPanelCollapsed = !state.propertiesPanelCollapsed;
    },

    // Navigation
    setActiveView: (state, action: PayloadAction<'book' | 'chapter' | 'element'>) => {
      state.activeView = action.payload;
    },
    setBreadcrumbs: (
      state,
      action: PayloadAction<Array<{ id: string; label: string; type: string }>>
    ) => {
      state.breadcrumbs = action.payload;
    },
    addBreadcrumb: (state, action: PayloadAction<{ id: string; label: string; type: string }>) => {
      state.breadcrumbs.push(action.payload);
    },
    removeBreadcrumb: (state, action: PayloadAction<string>) => {
      const index = state.breadcrumbs.findIndex((b) => b.id === action.payload);
      if (index !== -1) {
        state.breadcrumbs.splice(index, 1);
      }
    },

    // Modals
    openModal: (state, action: PayloadAction<{ modal: string; data?: any }>) => {
      state.activeModal = action.payload.modal;
      state.modalData = action.payload.data || null;
    },
    closeModal: (state) => {
      state.activeModal = null;
      state.modalData = null;
    },

    // Notifications
    addNotification: (
      state,
      action: PayloadAction<{
        type: 'info' | 'success' | 'warning' | 'error';
        message: string;
      }>
    ) => {
      state.notifications.push({
        id: `notif-${Date.now()}`,
        type: action.payload.type,
        message: action.payload.message,
        timestamp: new Date(),
      });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter((notif) => notif.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },

    // Search
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSearchResults: (state, action: PayloadAction<any[]>) => {
      state.searchResults = action.payload;
    },
    setSearchActive: (state, action: PayloadAction<boolean>) => {
      state.searchActive = action.payload;
    },
    clearSearch: (state) => {
      state.searchQuery = '';
      state.searchResults = [];
      state.searchActive = false;
    },

    // Editor settings
    setShowLineNumbers: (state, action: PayloadAction<boolean>) => {
      state.showLineNumbers = action.payload;
    },
    setShowWordCount: (state, action: PayloadAction<boolean>) => {
      state.showWordCount = action.payload;
    },
    setFontSize: (state, action: PayloadAction<number>) => {
      state.fontSize = Math.max(8, Math.min(32, action.payload));
    },
    setEditorTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.editorTheme = action.payload;
    },

    // Zoom
    setZoomLevel: (state, action: PayloadAction<number>) => {
      state.zoomLevel = Math.max(50, Math.min(200, action.payload));
    },
    zoomIn: (state) => {
      state.zoomLevel = Math.min(200, state.zoomLevel + 10);
    },
    zoomOut: (state) => {
      state.zoomLevel = Math.max(50, state.zoomLevel - 10);
    },
    resetZoom: (state) => {
      state.zoomLevel = 100;
    },
  },
});

export const {
  setViewMode,
  togglePanel,
  openPanel,
  closePanel,
  toggleSidebar,
  togglePropertiesPanel,
  setActiveView,
  setBreadcrumbs,
  addBreadcrumb,
  removeBreadcrumb,
  openModal,
  closeModal,
  addNotification,
  removeNotification,
  clearNotifications,
  setSearchQuery,
  setSearchResults,
  setSearchActive,
  clearSearch,
  setShowLineNumbers,
  setShowWordCount,
  setFontSize,
  setEditorTheme,
  setZoomLevel,
  zoomIn,
  zoomOut,
  resetZoom,
} = uiSlice.actions;

export default uiSlice.reducer;
