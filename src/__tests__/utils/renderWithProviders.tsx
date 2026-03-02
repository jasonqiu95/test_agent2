/**
 * Custom render function with Redux store and required providers
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { configureStore, PreloadedState } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import bookReducer from '../../slices/bookSlice';
import selectionReducer from '../../store/selectionSlice';
import undoReducer from '../../slices/undoSlice';
import undoMiddleware from '../../store/middleware/undoMiddleware';
import { RootState } from '../../store';

/**
 * Create a test store with optional preloaded state
 */
export function createTestStore(preloadedState?: PreloadedState<RootState>) {
  return configureStore({
    reducer: {
      book: bookReducer,
      selection: selectionReducer,
      undo: undoReducer,
    },
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [
            'book/setBook',
            'book/addChapter',
            'book/addFrontMatter',
            'book/addBackMatter',
            'undo/addToHistory',
          ],
          ignoredActionPaths: ['payload.stateBefore', 'payload.stateAfter', 'payload.action'],
          ignoredPaths: [
            'book.book.createdAt',
            'book.book.updatedAt',
            'book.book.metadata.publicationDate',
            'undo.past',
            'undo.future',
          ],
        },
      }).concat(undoMiddleware),
  });
}

/**
 * Custom render options
 */
export interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: PreloadedState<RootState>;
  store?: ReturnType<typeof createTestStore>;
}

/**
 * Custom render result with store access
 */
export interface CustomRenderResult extends RenderResult {
  store: ReturnType<typeof createTestStore>;
}

/**
 * Render component with Redux Provider
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState,
    store = createTestStore(preloadedState),
    ...renderOptions
  }: CustomRenderOptions = {}
): CustomRenderResult {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

/**
 * Render component with custom providers (for extending)
 */
export interface ExtendedProviderOptions extends CustomRenderOptions {
  additionalProviders?: React.ComponentType<{ children: React.ReactNode }>[];
}

export function renderWithExtendedProviders(
  ui: ReactElement,
  {
    preloadedState,
    store = createTestStore(preloadedState),
    additionalProviders = [],
    ...renderOptions
  }: ExtendedProviderOptions = {}
): CustomRenderResult {
  function Wrapper({ children }: { children: React.ReactNode }) {
    let wrapped = <Provider store={store}>{children}</Provider>;

    // Wrap with additional providers from outer to inner
    for (const ProviderComponent of additionalProviders.reverse()) {
      wrapped = <ProviderComponent>{wrapped}</ProviderComponent>;
    }

    return wrapped;
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

/**
 * Helper to get current Redux state from rendered component
 */
export function getStoreState(result: CustomRenderResult): RootState {
  return result.store.getState();
}

/**
 * Helper to dispatch action and wait for state update
 */
export async function dispatchAndWait(
  result: CustomRenderResult,
  action: any,
  waitMs: number = 0
): Promise<void> {
  result.store.dispatch(action);
  if (waitMs > 0) {
    await new Promise(resolve => setTimeout(resolve, waitMs));
  }
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react';
export { renderWithProviders as render };
