/**
 * Mock ChapterStore for testing
 */

import { ChapterStore, ChapterState, ChapterStoreListener } from '../../store/chapters/chapter-store';
import { Chapter } from '../../types/chapter';
import { TextBlock } from '../../types/textBlock';

export interface MockChapterStoreOptions {
  initialState?: Partial<ChapterState>;
  chapters?: Chapter[];
  autoSave?: boolean;
  loadDelay?: number;
}

/**
 * Create a mock ChapterStore for testing
 */
export function createMockChapterStore(options: MockChapterStoreOptions = {}): jest.Mocked<ChapterStore> {
  const {
    initialState = {},
    chapters = [],
    autoSave = true,
    loadDelay = 0,
  } = options;

  const defaultState: ChapterState = {
    activeChapterId: null,
    content: [],
    isLoading: false,
    isDirty: false,
    undoRedoState: {
      canUndo: false,
      canRedo: false,
      undoCount: 0,
      redoCount: 0,
    },
    ...initialState,
  };

  let currentState = { ...defaultState };
  const listeners = new Set<ChapterStoreListener>();
  const chaptersMap = new Map(chapters.map(ch => [ch.id!, ch]));

  const notifyListeners = () => {
    listeners.forEach(listener => listener({ ...currentState }));
  };

  const updateState = (updates: Partial<ChapterState>) => {
    currentState = { ...currentState, ...updates };
    notifyListeners();
  };

  const mockStore: Partial<ChapterStore> = {
    getState: jest.fn(() => ({ ...currentState })),

    subscribe: jest.fn((listener: ChapterStoreListener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }),

    initializeChapters: jest.fn((chaps: Chapter[]) => {
      chaptersMap.clear();
      chaps.forEach(ch => {
        if (ch.id) chaptersMap.set(ch.id, ch);
      });
    }),

    loadChapter: jest.fn(async (chapterId: string) => {
      const chapter = chaptersMap.get(chapterId);
      if (!chapter) {
        return false;
      }

      updateState({ isLoading: true, activeChapterId: chapterId });

      // Simulate loading delay
      if (loadDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, loadDelay));
      }

      updateState({
        activeChapterId: chapterId,
        content: chapter.content,
        isLoading: false,
        isDirty: false,
      });

      return true;
    }),

    updateContent: jest.fn((content: TextBlock[]) => {
      if (!currentState.activeChapterId) {
        return;
      }

      const chapter = chaptersMap.get(currentState.activeChapterId);
      if (chapter) {
        chapter.content = content;
      }

      updateState({
        content,
        isDirty: true,
        undoRedoState: {
          ...currentState.undoRedoState,
          canUndo: true,
        },
      });
    }),

    saveCurrentChapter: jest.fn(async () => {
      if (!currentState.activeChapterId) {
        return false;
      }

      if (autoSave) {
        updateState({ isDirty: false });
        return true;
      }

      return false;
    }),

    undo: jest.fn(() => {
      if (currentState.undoRedoState.canUndo) {
        updateState({
          undoRedoState: {
            ...currentState.undoRedoState,
            canUndo: false,
            canRedo: true,
            undoCount: currentState.undoRedoState.undoCount - 1,
            redoCount: currentState.undoRedoState.redoCount + 1,
          },
        });
      }
    }),

    redo: jest.fn(() => {
      if (currentState.undoRedoState.canRedo) {
        updateState({
          undoRedoState: {
            ...currentState.undoRedoState,
            canUndo: true,
            canRedo: false,
            undoCount: currentState.undoRedoState.undoCount + 1,
            redoCount: currentState.undoRedoState.redoCount - 1,
          },
        });
      }
    }),

    navigateNext: jest.fn(async () => {
      if (!currentState.activeChapterId) return false;

      const chapterIds = Array.from(chaptersMap.keys());
      const currentIndex = chapterIds.indexOf(currentState.activeChapterId);

      if (currentIndex < chapterIds.length - 1) {
        const nextId = chapterIds[currentIndex + 1];
        await mockStore.loadChapter!(nextId);
        return true;
      }

      return false;
    }),

    navigatePrevious: jest.fn(async () => {
      if (!currentState.activeChapterId) return false;

      const chapterIds = Array.from(chaptersMap.keys());
      const currentIndex = chapterIds.indexOf(currentState.activeChapterId);

      if (currentIndex > 0) {
        const prevId = chapterIds[currentIndex - 1];
        await mockStore.loadChapter!(prevId);
        return true;
      }

      return false;
    }),

    getChapterInfo: jest.fn((chapterId: string) => {
      return chaptersMap.get(chapterId);
    }),

    getAllChapters: jest.fn(() => {
      return Array.from(chaptersMap.values());
    }),

    getCacheStats: jest.fn(() => ({
      contentLoader: {
        cacheSize: 0,
        hitCount: 0,
        missCount: 0,
      },
      undoRedo: {
        historySize: 0,
        totalChapters: 0,
      },
    })),

    clearCache: jest.fn(() => {
      // Mock implementation - no-op
    }),
  };

  return mockStore as jest.Mocked<ChapterStore>;
}

/**
 * Helper to simulate chapter store loading state
 */
export function simulateLoading(
  store: jest.Mocked<ChapterStore>,
  duration: number = 100
): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, duration);
  });
}

/**
 * Helper to get the current state from a mock store
 */
export function getMockStoreState(store: jest.Mocked<ChapterStore>): ChapterState {
  return store.getState();
}

/**
 * Helper to trigger a state change and wait for listeners
 */
export async function waitForStateChange(
  store: jest.Mocked<ChapterStore>,
  predicate: (state: ChapterState) => boolean,
  timeout: number = 1000
): Promise<ChapterState> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      unsubscribe();
      reject(new Error('Timeout waiting for state change'));
    }, timeout);

    const unsubscribe = store.subscribe((state) => {
      if (predicate(state)) {
        clearTimeout(timeoutId);
        unsubscribe();
        resolve(state);
      }
    });

    // Check current state immediately
    const currentState = store.getState();
    if (predicate(currentState)) {
      clearTimeout(timeoutId);
      unsubscribe();
      resolve(currentState);
    }
  });
}

/**
 * Reset all mock functions on a store
 */
export function resetMockStore(store: jest.Mocked<ChapterStore>): void {
  Object.values(store).forEach(value => {
    if (typeof value === 'function' && 'mockClear' in value) {
      (value as jest.Mock).mockClear();
    }
  });
}
