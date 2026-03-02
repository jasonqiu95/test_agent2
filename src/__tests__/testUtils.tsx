/**
 * Test Utilities
 *
 * Provides reusable testing utilities including Redux store wrappers,
 * custom render functions, and mock helpers for React Testing Library.
 */

import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore, PreloadedState } from '@reduxjs/toolkit';
import bookReducer from '../slices/bookSlice';
import selectionReducer from '../store/selectionSlice';
import undoReducer from '../slices/undoSlice';
import { RootState } from '../store';

/**
 * Creates a mock Redux store for testing
 * Allows pre-loading initial state for test scenarios
 */
export function createMockStore(preloadedState?: PreloadedState<RootState>) {
  return configureStore({
    reducer: {
      book: bookReducer,
      selection: selectionReducer,
      undo: undoReducer,
      preview: (state = {}) => state, // Mock preview reducer
    },
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false, // Disable for testing
      }),
  });
}

/**
 * Provider wrapper for testing components that need Redux
 */
interface AllProvidersProps {
  children: ReactNode;
  store?: ReturnType<typeof createMockStore>;
}

export function AllProviders({ children, store }: AllProvidersProps) {
  const testStore = store || createMockStore();

  return (
    <Provider store={testStore}>
      {children}
    </Provider>
  );
}

/**
 * Custom render function that wraps components with necessary providers
 *
 * Usage:
 * ```typescript
 * const { getByText } = renderWithProviders(<MyComponent />);
 * ```
 *
 * With custom store state:
 * ```typescript
 * const { getByText } = renderWithProviders(<MyComponent />, {
 *   preloadedState: {
 *     book: { currentBook: mockBook, books: [], loading: false, error: null }
 *   }
 * });
 * ```
 */
interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: PreloadedState<RootState>;
  store?: ReturnType<typeof createMockStore>;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState = {},
    store = createMockStore(preloadedState),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <AllProviders store={store}>{children}</AllProviders>;
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

/**
 * Mock book data for testing
 */
export const mockBook = {
  id: 'test-book-1',
  title: 'Test Book',
  subtitle: 'A Test Subtitle',
  authors: [
    {
      id: 'author-1',
      name: 'Test Author',
      role: 'Author' as const,
    },
  ],
  chapters: [
    {
      id: 'chapter-1',
      title: 'Chapter 1',
      content: [],
      order: 0,
    },
    {
      id: 'chapter-2',
      title: 'Chapter 2',
      content: [],
      order: 1,
    },
  ],
  frontMatter: [],
  backMatter: [],
  metadata: {
    isbn: '978-0-123456-78-9',
    publisher: 'Test Publisher',
    publicationDate: new Date('2024-01-01'),
    language: 'en',
    genre: 'Fiction',
  },
  version: '1.0.0',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

/**
 * Mock element data for testing preview rendering
 */
export const mockElement = {
  id: 'element-1',
  type: 'chapter' as const,
  matter: 'body' as const,
  title: 'Test Chapter',
  content: [
    { type: 'paragraph', text: 'This is test content.' },
    { type: 'paragraph', text: 'This is more test content.' },
  ],
};

/**
 * Mock style configuration for testing preview rendering
 */
export const mockStyleConfig = {
  id: 'style-1',
  name: 'Default Style',
  fonts: {
    body: 'Georgia',
    heading: 'Arial',
    fallback: 'serif',
  },
  body: {
    fontSize: '16px',
    lineHeight: '1.6',
    textAlign: 'left' as const,
  },
  headings: {
    h1: {
      fontSize: '32px',
      fontWeight: 'bold',
      lineHeight: '1.2',
      marginTop: '2rem',
      marginBottom: '1rem',
      textTransform: 'none' as const,
    },
    h2: {
      fontSize: '24px',
      fontWeight: 'bold',
      lineHeight: '1.3',
      marginTop: '1.5rem',
      marginBottom: '0.75rem',
    },
    h3: {
      fontSize: '20px',
      fontWeight: 'bold',
      lineHeight: '1.4',
      marginTop: '1rem',
      marginBottom: '0.5rem',
    },
  },
  colors: {
    text: '#333333',
    heading: '#000000',
    background: '#ffffff',
  },
  spacing: {
    chapterSpacing: '2rem',
    sectionSpacing: '1.5rem',
    paragraphSpacing: '1rem',
  },
};

/**
 * Wait for specified milliseconds (useful for testing debounced functions)
 */
export const waitFor = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Mock window.matchMedia for responsive tests
 */
export function mockMatchMedia(matches: boolean = false) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

/**
 * Mock requestIdleCallback for preview update tests
 */
export function mockRequestIdleCallback() {
  global.requestIdleCallback = jest.fn((callback) => {
    const handle = setTimeout(() => {
      callback({
        didTimeout: false,
        timeRemaining: () => 50,
      } as IdleDeadline);
    }, 0);
    return handle as unknown as number;
  });

  global.cancelIdleCallback = jest.fn((handle) => {
    clearTimeout(handle);
  });
}

/**
 * Clean up mocked functions
 */
export function cleanupMocks() {
  if (global.requestIdleCallback && jest.isMockFunction(global.requestIdleCallback)) {
    (global.requestIdleCallback as jest.Mock).mockRestore();
  }
  if (global.cancelIdleCallback && jest.isMockFunction(global.cancelIdleCallback)) {
    (global.cancelIdleCallback as jest.Mock).mockRestore();
  }
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
