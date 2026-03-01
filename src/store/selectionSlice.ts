import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SelectionState {
  selectedElementId: string | null;
}

const initialState: SelectionState = {
  selectedElementId: null,
};

const selectionSlice = createSlice({
  name: 'selection',
  initialState,
  reducers: {
    setSelectedElement: (state, action: PayloadAction<string>) => {
      state.selectedElementId = action.payload;
    },
    clearSelection: (state) => {
      state.selectedElementId = null;
    },
  },
});

export const { setSelectedElement, clearSelection } = selectionSlice.actions;

export default selectionSlice.reducer;
