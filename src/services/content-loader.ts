/**
 * Content Loader Service
 * Handles lazy loading, caching, and preloading of chapter content
 */

import { Chapter } from '../types/chapter';
import { TextBlock } from '../types/textBlock';
import { LRUCache } from '../utils/lru-cache';

export interface ChapterContent {
  chapterId: string;
  content: TextBlock[];
  unsavedChanges?: TextBlock[];
  isDirty: boolean;
}

export interface LoadingState {
  isLoading: boolean;
  chapterId?: string;
  progress?: number;
}

export class ContentLoaderService {
  private cache: LRUCache<ChapterContent>;
  private loadingStates: Map<string, LoadingState>;
  private preloadQueue: Set<string>;
  private chapters: Map<string, Chapter>;
  private onLoadingStateChange?: (state: LoadingState) => void;

  constructor(cacheSize: number = 5) {
    this.cache = new LRUCache<ChapterContent>(cacheSize);
    this.loadingStates = new Map();
    this.preloadQueue = new Set();
    this.chapters = new Map();
  }

  /**
   * Initialize with book chapters
   */
  initializeChapters(chapters: Chapter[]): void {
    this.chapters.clear();
    chapters.forEach(chapter => {
      if (chapter.id) {
        this.chapters.set(chapter.id, chapter);
      }
    });
  }

  /**
   * Set loading state change callback
   */
  setOnLoadingStateChange(callback: (state: LoadingState) => void): void {
    this.onLoadingStateChange = callback;
  }

  /**
   * Load chapter content (from cache or fetch)
   */
  async loadChapter(chapterId: string): Promise<ChapterContent | null> {
    // Check cache first
    const cached = this.cache.get(chapterId);
    if (cached) {
      return cached;
    }

    // Set loading state
    this.setLoadingState(chapterId, true);

    try {
      // Simulate async loading (in real app, this would fetch from storage/API)
      const chapter = this.chapters.get(chapterId);
      if (!chapter) {
        throw new Error(`Chapter ${chapterId} not found`);
      }

      // Simulate network delay for demonstration
      await this.delay(100);

      const content: ChapterContent = {
        chapterId,
        content: [...chapter.content], // Clone content
        isDirty: false,
      };

      // Cache the loaded content
      this.cache.set(chapterId, content);

      // Preload adjacent chapters
      this.preloadAdjacentChapters(chapterId);

      return content;
    } catch (error) {
      console.error(`Failed to load chapter ${chapterId}:`, error);
      return null;
    } finally {
      this.setLoadingState(chapterId, false);
    }
  }

  /**
   * Update chapter content (marks as dirty and stores in cache)
   */
  updateChapterContent(chapterId: string, content: TextBlock[]): void {
    const cached = this.cache.get(chapterId);

    if (cached) {
      // Update existing cache entry
      this.cache.set(chapterId, {
        ...cached,
        unsavedChanges: content,
        isDirty: true,
      });
    } else {
      // Create new cache entry for unsaved changes
      this.cache.set(chapterId, {
        chapterId,
        content: [],
        unsavedChanges: content,
        isDirty: true,
      });
    }
  }

  /**
   * Save chapter changes (persist to storage)
   */
  async saveChapter(chapterId: string): Promise<boolean> {
    const cached = this.cache.get(chapterId);
    if (!cached || !cached.isDirty) {
      return true;
    }

    try {
      // Simulate save operation
      await this.delay(50);

      // Update the chapter in the chapters map
      const chapter = this.chapters.get(chapterId);
      if (chapter && cached.unsavedChanges) {
        chapter.content = [...cached.unsavedChanges];
      }

      // Update cache to mark as clean
      this.cache.set(chapterId, {
        ...cached,
        content: cached.unsavedChanges || cached.content,
        unsavedChanges: undefined,
        isDirty: false,
      });

      return true;
    } catch (error) {
      console.error(`Failed to save chapter ${chapterId}:`, error);
      return false;
    }
  }

  /**
   * Get unsaved changes for a chapter
   */
  getUnsavedChanges(chapterId: string): TextBlock[] | undefined {
    const cached = this.cache.get(chapterId);
    return cached?.unsavedChanges;
  }

  /**
   * Check if chapter has unsaved changes
   */
  hasUnsavedChanges(chapterId: string): boolean {
    const cached = this.cache.get(chapterId);
    return cached?.isDirty || false;
  }

  /**
   * Discard unsaved changes for a chapter
   */
  discardChanges(chapterId: string): void {
    const cached = this.cache.get(chapterId);
    if (cached) {
      this.cache.set(chapterId, {
        ...cached,
        unsavedChanges: undefined,
        isDirty: false,
      });
    }
  }

  /**
   * Preload adjacent chapters (prev/next) in background
   */
  private async preloadAdjacentChapters(currentChapterId: string): Promise<void> {
    const chapterIds = Array.from(this.chapters.keys());
    const currentIndex = chapterIds.indexOf(currentChapterId);

    if (currentIndex === -1) return;

    const adjacentIds: string[] = [];

    // Previous chapter
    if (currentIndex > 0) {
      adjacentIds.push(chapterIds[currentIndex - 1]);
    }

    // Next chapter
    if (currentIndex < chapterIds.length - 1) {
      adjacentIds.push(chapterIds[currentIndex + 1]);
    }

    // Preload in background
    adjacentIds.forEach(id => {
      if (!this.cache.has(id) && !this.preloadQueue.has(id)) {
        this.preloadQueue.add(id);
        this.preloadChapter(id).finally(() => {
          this.preloadQueue.delete(id);
        });
      }
    });
  }

  /**
   * Preload a chapter in the background
   */
  private async preloadChapter(chapterId: string): Promise<void> {
    try {
      const chapter = this.chapters.get(chapterId);
      if (!chapter) return;

      // Simulate async loading with lower priority
      await this.delay(200);

      const content: ChapterContent = {
        chapterId,
        content: [...chapter.content],
        isDirty: false,
      };

      // Only cache if not already loaded
      if (!this.cache.has(chapterId)) {
        this.cache.set(chapterId, content);
      }
    } catch (error) {
      console.error(`Failed to preload chapter ${chapterId}:`, error);
    }
  }

  /**
   * Unload chapter from cache (preserves unsaved changes)
   */
  unloadChapter(chapterId: string): void {
    const cached = this.cache.get(chapterId);

    // Don't unload if there are unsaved changes
    if (cached && cached.isDirty) {
      console.warn(`Cannot unload chapter ${chapterId} with unsaved changes`);
      return;
    }

    this.cache.delete(chapterId);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      ...this.cache.getStats(),
      loadingStates: Array.from(this.loadingStates.entries()),
      preloadQueue: Array.from(this.preloadQueue),
    };
  }

  /**
   * Clear all cached content (preserves unsaved changes)
   */
  clearCache(preserveUnsaved: boolean = true): void {
    if (preserveUnsaved) {
      const keys = this.cache.keys();
      keys.forEach(key => {
        const cached = this.cache.get(key);
        if (cached && !cached.isDirty) {
          this.cache.delete(key);
        }
      });
    } else {
      this.cache.clear();
    }
  }

  /**
   * Set loading state for a chapter
   */
  private setLoadingState(chapterId: string, isLoading: boolean): void {
    const state: LoadingState = {
      isLoading,
      chapterId: isLoading ? chapterId : undefined,
    };

    this.loadingStates.set(chapterId, state);

    if (this.onLoadingStateChange) {
      this.onLoadingStateChange(state);
    }
  }

  /**
   * Get loading state for a chapter
   */
  getLoadingState(chapterId: string): LoadingState {
    return this.loadingStates.get(chapterId) || { isLoading: false };
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let contentLoaderInstance: ContentLoaderService | null = null;

export function getContentLoader(cacheSize?: number): ContentLoaderService {
  if (!contentLoaderInstance) {
    contentLoaderInstance = new ContentLoaderService(cacheSize);
  }
  return contentLoaderInstance;
}

export function resetContentLoader(): void {
  contentLoaderInstance = null;
}
