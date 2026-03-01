/**
 * Preview slice for managing preview mode state
 * Handles preview rendering, device simulation, and export formats
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type PreviewMode = 'off' | 'side-by-side' | 'preview-only' | 'fullscreen';
export type ExportFormat = 'pdf' | 'epub' | 'mobi' | 'html' | 'docx' | 'markdown';
export type PageSize = 'A4' | 'A5' | 'Letter' | 'Legal' | 'Custom';
export type Orientation = 'portrait' | 'landscape';

export interface DevicePreset {
  id: string;
  name: string;
  width: number;
  height: number;
  pixelRatio: number;
  userAgent?: string;
}

export interface PageSettings {
  size: PageSize;
  width?: number;
  height?: number;
  orientation: Orientation;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  showPageNumbers: boolean;
  showHeaders: boolean;
  showFooters: boolean;
}

export interface PreviewState {
  mode: PreviewMode;
  isActive: boolean;
  exportFormat: ExportFormat;
  devicePreset: DevicePreset | null;
  pageSettings: PageSettings;
  scale: number;
  showGutter: boolean;
  showCropMarks: boolean;
  showBleed: boolean;
  highlightErrors: boolean;
  renderQuality: 'draft' | 'normal' | 'high';
  autoRefresh: boolean;
  refreshInterval: number; // milliseconds
  lastUpdated: Date | null;
}

const defaultPageSettings: PageSettings = {
  size: 'A4',
  orientation: 'portrait',
  margins: {
    top: 72, // 1 inch in points
    right: 72,
    bottom: 72,
    left: 72,
  },
  showPageNumbers: true,
  showHeaders: false,
  showFooters: false,
};

const initialState: PreviewState = {
  mode: 'off',
  isActive: false,
  exportFormat: 'pdf',
  devicePreset: null,
  pageSettings: defaultPageSettings,
  scale: 100,
  showGutter: false,
  showCropMarks: false,
  showBleed: false,
  highlightErrors: true,
  renderQuality: 'normal',
  autoRefresh: true,
  refreshInterval: 1000,
  lastUpdated: null,
};

const previewSlice = createSlice({
  name: 'preview',
  initialState,
  reducers: {
    // Preview mode
    setPreviewMode: (state, action: PayloadAction<PreviewMode>) => {
      state.mode = action.payload;
      state.isActive = action.payload !== 'off';
    },
    togglePreview: (state) => {
      if (state.mode === 'off') {
        state.mode = 'side-by-side';
        state.isActive = true;
      } else {
        state.mode = 'off';
        state.isActive = false;
      }
    },
    setPreviewActive: (state, action: PayloadAction<boolean>) => {
      state.isActive = action.payload;
      if (!action.payload) {
        state.mode = 'off';
      }
    },

    // Export format
    setExportFormat: (state, action: PayloadAction<ExportFormat>) => {
      state.exportFormat = action.payload;
    },

    // Device preset
    setDevicePreset: (state, action: PayloadAction<DevicePreset | null>) => {
      state.devicePreset = action.payload;
    },

    // Page settings
    setPageSettings: (state, action: PayloadAction<Partial<PageSettings>>) => {
      state.pageSettings = {
        ...state.pageSettings,
        ...action.payload,
      };
    },
    setPageSize: (state, action: PayloadAction<PageSize>) => {
      state.pageSettings.size = action.payload;
      // Set standard dimensions based on page size
      switch (action.payload) {
        case 'A4':
          state.pageSettings.width = 595;
          state.pageSettings.height = 842;
          break;
        case 'A5':
          state.pageSettings.width = 420;
          state.pageSettings.height = 595;
          break;
        case 'Letter':
          state.pageSettings.width = 612;
          state.pageSettings.height = 792;
          break;
        case 'Legal':
          state.pageSettings.width = 612;
          state.pageSettings.height = 1008;
          break;
        default:
          break;
      }
    },
    setPageOrientation: (state, action: PayloadAction<Orientation>) => {
      state.pageSettings.orientation = action.payload;
      // Swap width and height if dimensions exist
      if (state.pageSettings.width && state.pageSettings.height) {
        [state.pageSettings.width, state.pageSettings.height] =
          [state.pageSettings.height, state.pageSettings.width];
      }
    },
    setPageMargins: (state, action: PayloadAction<Partial<PageSettings['margins']>>) => {
      state.pageSettings.margins = {
        ...state.pageSettings.margins,
        ...action.payload,
      };
    },
    togglePageNumbers: (state) => {
      state.pageSettings.showPageNumbers = !state.pageSettings.showPageNumbers;
    },
    toggleHeaders: (state) => {
      state.pageSettings.showHeaders = !state.pageSettings.showHeaders;
    },
    toggleFooters: (state) => {
      state.pageSettings.showFooters = !state.pageSettings.showFooters;
    },

    // Scale and view options
    setScale: (state, action: PayloadAction<number>) => {
      state.scale = Math.max(25, Math.min(400, action.payload));
    },
    scalePreviewIn: (state) => {
      state.scale = Math.min(400, state.scale + 10);
    },
    scalePreviewOut: (state) => {
      state.scale = Math.max(25, state.scale - 10);
    },
    resetScale: (state) => {
      state.scale = 100;
    },
    toggleGutter: (state) => {
      state.showGutter = !state.showGutter;
    },
    toggleCropMarks: (state) => {
      state.showCropMarks = !state.showCropMarks;
    },
    toggleBleed: (state) => {
      state.showBleed = !state.showBleed;
    },
    toggleHighlightErrors: (state) => {
      state.highlightErrors = !state.highlightErrors;
    },

    // Render quality
    setRenderQuality: (state, action: PayloadAction<'draft' | 'normal' | 'high'>) => {
      state.renderQuality = action.payload;
    },

    // Auto refresh
    setAutoRefresh: (state, action: PayloadAction<boolean>) => {
      state.autoRefresh = action.payload;
    },
    setRefreshInterval: (state, action: PayloadAction<number>) => {
      state.refreshInterval = Math.max(100, action.payload);
    },
    refreshPreview: (state) => {
      state.lastUpdated = new Date();
    },

    // Reset
    resetPreviewSettings: () => initialState,
  },
});

export const {
  setPreviewMode,
  togglePreview,
  setPreviewActive,
  setExportFormat,
  setDevicePreset,
  setPageSettings,
  setPageSize,
  setPageOrientation,
  setPageMargins,
  togglePageNumbers,
  toggleHeaders,
  toggleFooters,
  setScale,
  scalePreviewIn,
  scalePreviewOut,
  resetScale,
  toggleGutter,
  toggleCropMarks,
  toggleBleed,
  toggleHighlightErrors,
  setRenderQuality,
  setAutoRefresh,
  setRefreshInterval,
  refreshPreview,
  resetPreviewSettings,
} = previewSlice.actions;

export default previewSlice.reducer;
