/**
 * React Hook for Chapter Store
 * Provides easy integration of chapter store with React components
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { ChapterStore, ChapterState, getChapterStore } from '../store/chapters';
import { Chapter } from '../types/chapter';

export interface UseChapterStoreOptions {
  cacheSize?: number;
  maxHistorySize?: number;
  initialChapterId?: string;
}

export interface UseChapterStoreReturn {
  state: ChapterState;
  store: ChapterStore;
  chapters: Chapter[];
  loadChapter: (chapterId: string) => Promise<boolean>;
  saveChapter: () => Promise<boolean>;
  undo: () => void;
  redo: () => void;
  navigateNext: () => Promise<boolean>;
  navigatePrevious: () => Promise<boolean>;
  getCacheStats: () => any;
}

export function useChapterStore(
  chapters: Chapter[],
  options?: UseChapterStoreOptions
): UseChapterStoreReturn {
  const store = useMemo(
    () => getChapterStore(options?.cacheSize, options?.maxHistorySize),
    [options?.cacheSize, options?.maxHistorySize]
  );

  const [state, setState] = useState<ChapterState>(store.getState());

  // Initialize chapters
  useEffect(() => {
    if (chapters.length > 0) {
      store.initializeChapters(chapters);

      // Load initial chapter if specified
      if (options?.initialChapterId) {
        store.loadChapter(options.initialChapterId);
      }
    }
  }, [chapters, store, options?.initialChapterId]);

  // Subscribe to store changes
  useEffect(() => {
    const unsubscribe = store.subscribe((newState) => {
      setState(newState);
    });

    return unsubscribe;
  }, [store]);

  const loadChapter = useCallback(
    (chapterId: string) => {
      return store.loadChapter(chapterId);
    },
    [store]
  );

  const saveChapter = useCallback(() => {
    return store.saveCurrentChapter();
  }, [store]);

  const undo = useCallback(() => {
    store.undo();
  }, [store]);

  const redo = useCallback(() => {
    store.redo();
  }, [store]);

  const navigateNext = useCallback(() => {
    return store.navigateNext();
  }, [store]);

  const navigatePrevious = useCallback(() => {
    return store.navigatePrevious();
  }, [store]);

  const getCacheStats = useCallback(() => {
    return store.getCacheStats();
  }, [store]);

  return {
    state,
    store,
    chapters: store.getAllChapters(),
    loadChapter,
    saveChapter,
    undo,
    redo,
    navigateNext,
    navigatePrevious,
    getCacheStats,
  };
}
