import { createSlice } from '@reduxjs/toolkit';

// Initial state
const initialState = {
  deviceMode: 'iPad', // 'iPad' | 'Kindle' | 'iPhone' | 'PrintSpread'
  zoomLevel: 100, // percentage
  currentPage: 1,
  totalPages: 0,
};

// Create the preview slice
const previewSlice = createSlice({
  name: 'preview',
  initialState,
  reducers: {
    setDeviceMode: (state, action) => {
      const validModes = ['iPad', 'Kindle', 'iPhone', 'PrintSpread'];
      if (validModes.includes(action.payload)) {
        state.deviceMode = action.payload;
      }
    },
    setZoom: (state, action) => {
      const zoom = action.payload;
      // Clamp zoom level between 10% and 500%
      state.zoomLevel = Math.max(10, Math.min(500, zoom));
    },
    navigatePage: (state, action) => {
      const page = action.payload;
      // Ensure page is within valid range
      if (page >= 1 && page <= state.totalPages) {
        state.currentPage = page;
      } else if (state.totalPages > 0) {
        // Clamp to valid range
        state.currentPage = Math.max(1, Math.min(state.totalPages, page));
      }
    },
    updatePageCount: (state, action) => {
      const count = action.payload;
      if (count >= 0) {
        state.totalPages = count;
        // Adjust current page if it exceeds new total
        if (state.currentPage > count && count > 0) {
          state.currentPage = count;
        } else if (count === 0) {
          state.currentPage = 1;
        }
      }
    },
  },
});

// Export actions
export const { setDeviceMode, setZoom, navigatePage, updatePageCount } = previewSlice.actions;

// Selectors
export const selectDeviceMode = (state) => state.preview.deviceMode;
export const selectZoomLevel = (state) => state.preview.zoomLevel;
export const selectCurrentPage = (state) => state.preview.currentPage;
export const selectTotalPages = (state) => state.preview.totalPages;

// Export reducer
export default previewSlice.reducer;
