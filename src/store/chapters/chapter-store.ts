/**
 * Chapter Store
 * Manages chapter state, lazy loading, and coordination between services
 */

import { Chapter } from '../../types/chapter';
import { TextBlock } from '../../types/textBlock';
import { ContentLoaderService, getContentLoader } from '../../services/content-loader';
import { UndoRedoManager, UndoRedoState } from './undo-redo';

export interface ChapterState {
  activeChapterId: string | null;
  content: TextBlock[];
  isLoading: boolean;
  isDirty: boolean;
  undoRedoState: UndoRedoState;
}

export type ChapterStoreListener = (state: ChapterState) => void;

export class ChapterStore {
  private state: ChapterState;
  private contentLoader: ContentLoaderService;
  private undoRedoManager: UndoRedoManager;
  private listeners: Set<ChapterStoreListener>;
  private chapters: Map<string, Chapter>;

  constructor(cacheSize: number = 5, maxHistorySize: number = 50) {
    this.state = {
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
    };

    this.contentLoader = getContentLoader(cacheSize);
    this.undoRedoManager = new UndoRedoManager(maxHistorySize);
    this.listeners = new Set();
    this.chapters = new Map();

    // Setup loading state change listener
    this.contentLoader.setOnLoadingStateChange((loadingState) => {
      if (loadingState.chapterId === this.state.activeChapterId) {
        this.updateState({ isLoading: loadingState.isLoading });
      }
    });
  }

  /**
   * Initialize store with chapters
   */
  initializeChapters(chapters: Chapter[]): void {
    this.chapters.clear();
    chapters.forEach(chapter => {
      if (chapter.id) {
        this.chapters.set(chapter.id, chapter);
      }
    });
    this.contentLoader.initializeChapters(chapters);
  }

  /**
   * Get current state
   */
  getState(): Readonly<ChapterState> {
    return { ...this.state };
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: ChapterStoreListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Load and activate a chapter
   */
  async loadChapter(chapterId: string): Promise<boolean> {
    // Check if already loaded
    if (this.state.activeChapterId === chapterId && !this.state.isLoading) {
      return true;
    }

    // Check for unsaved changes in current chapter
    if (this.state.activeChapterId && this.state.isDirty) {
      const shouldSave = await this.promptSaveChanges();
      if (shouldSave) {
        await this.saveCurrentChapter();
      } else {
        this.contentLoader.discardChanges(this.state.activeChapterId);
      }
    }

    // Load new chapter
    this.updateState({ isLoading: true, activeChapterId: chapterId });

    try {
      const chapterContent = await this.contentLoader.loadChapter(chapterId);
      if (!chapterContent) {
        throw new Error(`Failed to load chapter ${chapterId}`);
      }

      // Initialize undo/redo for this chapter
      this.undoRedoManager.initializeChapter(chapterId, chapterContent.content);

      // Update state with loaded content
      this.updateState({
        content: chapterContent.unsavedChanges || chapterContent.content,
        isDirty: chapterContent.isDirty,
        isLoading: false,
        undoRedoState: this.undoRedoManager.getState(chapterId),
      });

      return true;
    } catch (error) {
      console.error('Failed to load chapter:', error);
      this.updateState({ isLoading: false });
      return false;
    }
  }

  /**
   * Update chapter content
   */
  updateContent(content: TextBlock[]): void {
    if (!this.state.activeChapterId) {
      console.warn('No active chapter to update');
      return;
    }

    // Save current state to undo stack
    this.undoRedoManager.pushState(this.state.activeChapterId, this.state.content);

    // Update content in loader and state
    this.contentLoader.updateChapterContent(this.state.activeChapterId, content);

    this.updateState({
      content,
      isDirty: true,
      undoRedoState: this.undoRedoManager.getState(this.state.activeChapterId),
    });
  }

  /**
   * Undo last change
   */
  undo(): void {
    if (!this.state.activeChapterId) return;

    const previousContent = this.undoRedoManager.undo(
      this.state.activeChapterId,
      this.state.content
    );

    if (previousContent) {
      this.contentLoader.updateChapterContent(this.state.activeChapterId, previousContent);

      this.updateState({
        content: previousContent,
        isDirty: true,
        undoRedoState: this.undoRedoManager.getState(this.state.activeChapterId),
      });
    }
  }

  /**
   * Redo last undone change
   */
  redo(): void {
    if (!this.state.activeChapterId) return;

    const nextContent = this.undoRedoManager.redo(
      this.state.activeChapterId,
      this.state.content
    );

    if (nextContent) {
      this.contentLoader.updateChapterContent(this.state.activeChapterId, nextContent);

      this.updateState({
        content: nextContent,
        isDirty: true,
        undoRedoState: this.undoRedoManager.getState(this.state.activeChapterId),
      });
    }
  }

  /**
   * Save current chapter
   */
  async saveCurrentChapter(): Promise<boolean> {
    if (!this.state.activeChapterId) {
      return false;
    }

    const success = await this.contentLoader.saveChapter(this.state.activeChapterId);

    if (success) {
      this.updateState({ isDirty: false });
    }

    return success;
  }

  /**
   * Navigate to next chapter
   */
  async navigateNext(): Promise<boolean> {
    if (!this.state.activeChapterId) return false;

    const chapterIds = Array.from(this.chapters.keys());
    const currentIndex = chapterIds.indexOf(this.state.activeChapterId);

    if (currentIndex < chapterIds.length - 1) {
      return this.loadChapter(chapterIds[currentIndex + 1]);
    }

    return false;
  }

  /**
   * Navigate to previous chapter
   */
  async navigatePrevious(): Promise<boolean> {
    if (!this.state.activeChapterId) return false;

    const chapterIds = Array.from(this.chapters.keys());
    const currentIndex = chapterIds.indexOf(this.state.activeChapterId);

    if (currentIndex > 0) {
      return this.loadChapter(chapterIds[currentIndex - 1]);
    }

    return false;
  }

  /**
   * Get chapter info
   */
  getChapterInfo(chapterId: string): Chapter | undefined {
    return this.chapters.get(chapterId);
  }

  /**
   * Get all chapters
   */
  getAllChapters(): Chapter[] {
    return Array.from(this.chapters.values());
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      contentLoader: this.contentLoader.getCacheStats(),
      undoRedo: this.undoRedoManager.getStats(),
    };
  }

  /**
   * Clear cache
   */
  clearCache(preserveUnsaved: boolean = true): void {
    this.contentLoader.clearCache(preserveUnsaved);
  }

  /**
   * Update state and notify listeners
   */
  private updateState(partial: Partial<ChapterState>): void {
    this.state = { ...this.state, ...partial };
    this.notifyListeners();
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getState());
      } catch (error) {
        console.error('Error in store listener:', error);
      }
    });
  }

  /**
   * Prompt user to save changes (placeholder)
   * In real app, this would show a dialog
   */
  private async promptSaveChanges(): Promise<boolean> {
    // For now, auto-save
    return true;
  }
}

// Singleton instance
let storeInstance: ChapterStore | null = null;

export function getChapterStore(
  cacheSize?: number,
  maxHistorySize?: number
): ChapterStore {
  if (!storeInstance) {
    storeInstance = new ChapterStore(cacheSize, maxHistorySize);
  }
  return storeInstance;
}

export function resetChapterStore(): void {
  storeInstance = null;
}
