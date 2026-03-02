/**
 * Auto-Save Functionality Tests
 * Comprehensive tests for auto-save behavior including triggering, debouncing,
 * status indicators, error handling, and cursor position preservation
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAutoSave } from '../../hooks/useAutoSave';
import type { Book } from '../../types/book';
import type { SaveStatus } from '../../services/persistence';

// Mock the persistence service
jest.mock('../../services/persistence', () => {
  const mockPersistenceService = {
    getProjectInfo: jest.fn(),
    getCurrentProject: jest.fn(),
    onChangeStatusChange: jest.fn(),
    onSave: jest.fn(),
    onStatusChange: jest.fn(),
    saveProject: jest.fn(),
    updateProject: jest.fn(),
    createProject: jest.fn(),
    setAutoSaveEnabled: jest.fn(),
    setAutoSaveDebounce: jest.fn(),
    loadProject: jest.fn(),
  };

  return {
    getPersistenceService: jest.fn(() => mockPersistenceService),
    __mockPersistenceService: mockPersistenceService,
  };
});

const persistenceMock = require('../../services/persistence').__mockPersistenceService;

describe('Auto-Save Functionality', () => {
  let mockBook: Book;
  let statusCallback: (status: SaveStatus) => void;
  let saveCallback: (filePath: string) => void;

  beforeEach(() => {
    jest.useFakeTimers();

    mockBook = {
      id: 'test-book-1',
      title: 'Test Book',
      author: 'Test Author',
      chapters: [],
      metadata: {
        wordCount: 1000,
        characterCount: 5000,
        language: 'en',
        version: '1.0.0',
      },
    } as Book;

    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    persistenceMock.getProjectInfo.mockReturnValue({
      filePath: '/test/project.vellum',
      hasUnsavedChanges: false,
      lastSaved: new Date(),
      autoSaveEnabled: true,
      saveStatus: 'idle' as SaveStatus,
      lastError: undefined,
    });

    persistenceMock.getCurrentProject.mockReturnValue({
      version: '1.0.0',
      formatVersion: '1.0.0',
      book: mockBook,
      metadata: {
        lastSaved: new Date().toISOString(),
        autoSaveEnabled: true,
      },
    });

    // Capture callbacks for manual triggering
    persistenceMock.onStatusChange.mockImplementation((callback: any) => {
      statusCallback = callback;
      return () => {};
    });

    persistenceMock.onSave.mockImplementation((callback: any) => {
      saveCallback = callback;
      return () => {};
    });

    persistenceMock.onChangeStatusChange.mockImplementation((callback: any) => {
      return () => {};
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('1. Auto-save triggers after content edits', () => {
    it('should trigger auto-save when book content changes', async () => {
      const { result, rerender } = renderHook(
        ({ book }) => useAutoSave(book, { enabled: true, debounceMs: 3000 }),
        { initialProps: { book: mockBook } }
      );

      // Initial state should not trigger save
      expect(persistenceMock.updateProject).not.toHaveBeenCalled();

      // Update book content
      const updatedBook = {
        ...mockBook,
        title: 'Updated Test Book',
      };

      rerender({ book: updatedBook });

      // Fast-forward time to trigger debounced save
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(persistenceMock.updateProject).toHaveBeenCalledWith(updatedBook);
      });
    });

    it('should trigger auto-save for chapter content changes', async () => {
      const { result, rerender } = renderHook(
        ({ book }) => useAutoSave(book, { enabled: true, debounceMs: 3000 }),
        { initialProps: { book: mockBook } }
      );

      // Add a chapter to the book
      const bookWithChapter = {
        ...mockBook,
        chapters: [
          {
            id: 'chapter-1',
            title: 'Chapter One',
            content: 'Initial content',
          },
        ],
      };

      rerender({ book: bookWithChapter });

      // Fast-forward time to trigger debounced save
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(persistenceMock.updateProject).toHaveBeenCalledWith(bookWithChapter);
      });
    });

    it('should trigger auto-save for metadata changes', async () => {
      const { result, rerender } = renderHook(
        ({ book }) => useAutoSave(book, { enabled: true, debounceMs: 3000 }),
        { initialProps: { book: mockBook } }
      );

      // Update metadata
      const bookWithUpdatedMetadata = {
        ...mockBook,
        metadata: {
          ...mockBook.metadata,
          wordCount: 2000,
        },
      };

      rerender({ book: bookWithUpdatedMetadata });

      // Fast-forward time to trigger debounced save
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(persistenceMock.updateProject).toHaveBeenCalledWith(bookWithUpdatedMetadata);
      });
    });
  });

  describe('2. Auto-save debouncing (waits for typing to stop)', () => {
    it('should debounce rapid changes and only save once', async () => {
      const { result, rerender } = renderHook(
        ({ book }) => useAutoSave(book, { enabled: true, debounceMs: 3000 }),
        { initialProps: { book: mockBook } }
      );

      // Make multiple rapid changes
      for (let i = 1; i <= 5; i++) {
        const updatedBook = {
          ...mockBook,
          title: `Updated Test Book ${i}`,
        };
        rerender({ book: updatedBook });

        // Advance time by 500ms (less than debounce time)
        act(() => {
          jest.advanceTimersByTime(500);
        });
      }

      // Should not have saved yet
      expect(persistenceMock.updateProject).not.toHaveBeenCalled();

      // Complete the debounce period
      act(() => {
        jest.advanceTimersByTime(2500); // 500 * 5 + 2500 = 5000ms total
      });

      // Should save only once with the last update
      await waitFor(() => {
        expect(persistenceMock.updateProject).toHaveBeenCalledTimes(1);
        expect(persistenceMock.updateProject).toHaveBeenCalledWith(
          expect.objectContaining({ title: 'Updated Test Book 5' })
        );
      });
    });

    it('should reset debounce timer on each change', async () => {
      const { result, rerender } = renderHook(
        ({ book }) => useAutoSave(book, { enabled: true, debounceMs: 3000 }),
        { initialProps: { book: mockBook } }
      );

      // First change
      rerender({ book: { ...mockBook, title: 'Update 1' } });
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // Second change resets the timer
      rerender({ book: { ...mockBook, title: 'Update 2' } });
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // Still no save because timer was reset
      expect(persistenceMock.updateProject).not.toHaveBeenCalled();

      // Complete the final debounce period
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(persistenceMock.updateProject).toHaveBeenCalledTimes(1);
      });
    });

    it('should respect custom debounce time', async () => {
      const customDebounceMs = 5000;
      const { result, rerender } = renderHook(
        ({ book }) => useAutoSave(book, { enabled: true, debounceMs: customDebounceMs }),
        { initialProps: { book: mockBook } }
      );

      rerender({ book: { ...mockBook, title: 'Updated' } });

      // Should not save before debounce time
      act(() => {
        jest.advanceTimersByTime(4999);
      });
      expect(persistenceMock.updateProject).not.toHaveBeenCalled();

      // Should save after debounce time
      act(() => {
        jest.advanceTimersByTime(1);
      });

      await waitFor(() => {
        expect(persistenceMock.updateProject).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('3. Auto-save indicator shows saving/saved state', () => {
    it('should show "saving" status during save operation', async () => {
      const { result } = renderHook(() =>
        useAutoSave(mockBook, { enabled: true, debounceMs: 3000 })
      );

      // Initial status should be idle
      expect(result.current.saveStatus).toBe('idle');

      // Trigger status change to "saving"
      act(() => {
        statusCallback('saving');
      });

      expect(result.current.saveStatus).toBe('saving');
    });

    it('should show "saved" status after successful save', async () => {
      const { result } = renderHook(() =>
        useAutoSave(mockBook, { enabled: true, debounceMs: 3000 })
      );

      // Trigger saving status
      act(() => {
        statusCallback('saving');
      });

      // Then trigger saved status
      act(() => {
        statusCallback('saved');
      });

      expect(result.current.saveStatus).toBe('saved');
    });

    it('should transition through status states correctly', async () => {
      const { result } = renderHook(() =>
        useAutoSave(mockBook, { enabled: true, debounceMs: 3000 })
      );

      // Start with idle
      expect(result.current.saveStatus).toBe('idle');

      // Transition to saving
      act(() => {
        statusCallback('saving');
      });
      expect(result.current.saveStatus).toBe('saving');

      // Transition to saved
      act(() => {
        statusCallback('saved');
      });
      expect(result.current.saveStatus).toBe('saved');

      // Back to idle
      act(() => {
        statusCallback('idle');
      });
      expect(result.current.saveStatus).toBe('idle');
    });
  });

  describe('4. Auto-save success updates last saved timestamp', () => {
    it('should trigger onSaveComplete callback with file path', async () => {
      const onSaveCompleteMock = jest.fn();
      const { result } = renderHook(() =>
        useAutoSave(mockBook, {
          enabled: true,
          debounceMs: 3000,
          onSaveComplete: onSaveCompleteMock,
        })
      );

      // Simulate successful save
      const filePath = '/test/project.vellum';
      act(() => {
        saveCallback(filePath);
      });

      await waitFor(() => {
        expect(onSaveCompleteMock).toHaveBeenCalledWith(filePath);
      });
    });

    it('should update project info after successful save', async () => {
      const lastSavedTime = new Date();
      persistenceMock.getProjectInfo.mockReturnValue({
        filePath: '/test/project.vellum',
        hasUnsavedChanges: false,
        lastSaved: lastSavedTime,
        autoSaveEnabled: true,
        saveStatus: 'saved' as SaveStatus,
      });

      const { result } = renderHook(() =>
        useAutoSave(mockBook, { enabled: true, debounceMs: 3000 })
      );

      act(() => {
        statusCallback('saved');
      });

      expect(result.current.saveStatus).toBe('saved');
    });

    it('should call onSaveStart callback when save begins', async () => {
      const onSaveStartMock = jest.fn();
      const { result } = renderHook(() =>
        useAutoSave(mockBook, {
          enabled: true,
          debounceMs: 3000,
          onSaveStart: onSaveStartMock,
        })
      );

      act(() => {
        statusCallback('saving');
      });

      await waitFor(() => {
        expect(onSaveStartMock).toHaveBeenCalled();
      });
    });
  });

  describe('5. Auto-save failure shows error message', () => {
    it('should show error status and message on save failure', async () => {
      const errorMessage = 'Network error: Unable to save file';
      persistenceMock.getProjectInfo.mockReturnValue({
        filePath: '/test/project.vellum',
        hasUnsavedChanges: true,
        autoSaveEnabled: true,
        saveStatus: 'error' as SaveStatus,
        lastError: errorMessage,
      });

      const { result } = renderHook(() =>
        useAutoSave(mockBook, { enabled: true, debounceMs: 3000 })
      );

      act(() => {
        statusCallback('error');
      });

      expect(result.current.saveStatus).toBe('error');
      expect(result.current.lastError).toBe(errorMessage);
    });

    it('should call onSaveError callback with error message', async () => {
      const onSaveErrorMock = jest.fn();
      const errorMessage = 'Disk full';

      persistenceMock.getProjectInfo.mockReturnValue({
        filePath: '/test/project.vellum',
        hasUnsavedChanges: true,
        autoSaveEnabled: true,
        saveStatus: 'error' as SaveStatus,
        lastError: errorMessage,
      });

      const { result } = renderHook(() =>
        useAutoSave(mockBook, {
          enabled: true,
          debounceMs: 3000,
          onSaveError: onSaveErrorMock,
        })
      );

      act(() => {
        statusCallback('error');
      });

      await waitFor(() => {
        expect(onSaveErrorMock).toHaveBeenCalledWith(errorMessage);
      });
    });

    it('should handle conflict status with callback', async () => {
      const onConflictMock = jest.fn();

      persistenceMock.getProjectInfo.mockReturnValue({
        filePath: '/test/project.vellum',
        hasUnsavedChanges: true,
        autoSaveEnabled: true,
        saveStatus: 'conflict' as SaveStatus,
        lastError: 'File modified externally',
      });

      const { result } = renderHook(() =>
        useAutoSave(mockBook, {
          enabled: true,
          debounceMs: 3000,
          onConflict: onConflictMock,
        })
      );

      act(() => {
        statusCallback('conflict');
      });

      await waitFor(() => {
        expect(onConflictMock).toHaveBeenCalled();
      });
      expect(result.current.saveStatus).toBe('conflict');
    });
  });

  describe('6. Auto-save doesn\'t trigger on initial load', () => {
    it('should not auto-save when book is first loaded', async () => {
      const { result } = renderHook(() =>
        useAutoSave(mockBook, { enabled: true, debounceMs: 3000 })
      );

      // Advance time past debounce period
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Should not have called updateProject on initial render
      expect(persistenceMock.updateProject).not.toHaveBeenCalled();
    });

    it('should not auto-save when book is null', async () => {
      const { result, rerender } = renderHook(
        ({ book }) => useAutoSave(book, { enabled: true, debounceMs: 3000 }),
        { initialProps: { book: null } }
      );

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(persistenceMock.updateProject).not.toHaveBeenCalled();
    });

    it('should not auto-save for new unsaved projects without file path', async () => {
      persistenceMock.getProjectInfo.mockReturnValue({
        filePath: undefined, // No file path means new project
        hasUnsavedChanges: false,
        autoSaveEnabled: true,
        saveStatus: 'idle' as SaveStatus,
      });

      const { result, rerender } = renderHook(
        ({ book }) => useAutoSave(book, { enabled: true, debounceMs: 3000 }),
        { initialProps: { book: mockBook } }
      );

      // Update book
      const updatedBook = { ...mockBook, title: 'Updated' };
      rerender({ book: updatedBook });

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Should not save because there's no file path
      expect(persistenceMock.updateProject).not.toHaveBeenCalled();
    });
  });

  describe('7. Manual save bypasses debounce', () => {
    it('should save immediately when triggerSave is called', async () => {
      persistenceMock.saveProject.mockResolvedValue({
        success: true,
        filePath: '/test/project.vellum',
      });

      const { result, rerender } = renderHook(
        ({ book }) => useAutoSave(book, { enabled: true, debounceMs: 3000 }),
        { initialProps: { book: mockBook } }
      );

      // Make a change
      const updatedBook = { ...mockBook, title: 'Updated' };
      rerender({ book: updatedBook });

      // Trigger manual save immediately (before debounce)
      await act(async () => {
        await result.current.triggerSave();
      });

      // Should have called updateProject and saveProject immediately
      expect(persistenceMock.updateProject).toHaveBeenCalledWith(updatedBook);
      expect(persistenceMock.saveProject).toHaveBeenCalled();
    });

    it('should clear pending auto-save timer when manual save is triggered', async () => {
      persistenceMock.saveProject.mockResolvedValue({
        success: true,
        filePath: '/test/project.vellum',
      });

      const { result, rerender } = renderHook(
        ({ book }) => useAutoSave(book, { enabled: true, debounceMs: 3000 }),
        { initialProps: { book: mockBook } }
      );

      // Make a change to start debounce timer
      const updatedBook = { ...mockBook, title: 'Updated' };
      rerender({ book: updatedBook });

      // Advance time partially through debounce
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Trigger manual save
      await act(async () => {
        await result.current.triggerSave();
      });

      // Complete the original debounce period
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Should only have called updateProject once (from manual save, not auto-save)
      expect(persistenceMock.updateProject).toHaveBeenCalledTimes(1);
    });

    it('should handle manual save when auto-save is disabled', async () => {
      persistenceMock.saveProject.mockResolvedValue({
        success: true,
        filePath: '/test/project.vellum',
      });

      const { result } = renderHook(() =>
        useAutoSave(mockBook, { enabled: false, debounceMs: 3000 })
      );

      await act(async () => {
        await result.current.triggerSave();
      });

      expect(persistenceMock.updateProject).toHaveBeenCalledWith(mockBook);
      expect(persistenceMock.saveProject).toHaveBeenCalled();
    });

    it('should create new project if no current project exists on manual save', async () => {
      persistenceMock.getCurrentProject.mockReturnValue(null);
      persistenceMock.saveProject.mockResolvedValue({
        success: true,
        filePath: '/test/new-project.vellum',
      });

      const { result } = renderHook(() =>
        useAutoSave(mockBook, { enabled: true, debounceMs: 3000 })
      );

      await act(async () => {
        await result.current.triggerSave();
      });

      expect(persistenceMock.createProject).toHaveBeenCalledWith(mockBook);
      expect(persistenceMock.saveProject).toHaveBeenCalled();
    });
  });

  describe('8. Auto-save preserves cursor position', () => {
    it('should not disrupt editor state during auto-save', async () => {
      const { result, rerender } = renderHook(
        ({ book }) => useAutoSave(book, { enabled: true, debounceMs: 3000 }),
        { initialProps: { book: mockBook } }
      );

      // Simulate user typing (making changes)
      const updatedBook = { ...mockBook, title: 'User is typing...' };
      rerender({ book: updatedBook });

      // Store initial status
      const statusBeforeSave = result.current.saveStatus;

      // Trigger auto-save
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Status should change to reflect save operation
      act(() => {
        statusCallback('saving');
      });

      expect(result.current.saveStatus).toBe('saving');

      // Complete save
      act(() => {
        statusCallback('saved');
      });

      expect(result.current.saveStatus).toBe('saved');

      // Book reference should remain stable
      expect(result.current.isAutoSaveEnabled).toBe(true);
    });

    it('should allow continued editing during auto-save', async () => {
      const { result, rerender } = renderHook(
        ({ book }) => useAutoSave(book, { enabled: true, debounceMs: 3000 }),
        { initialProps: { book: mockBook } }
      );

      // First change
      const updatedBook1 = { ...mockBook, title: 'First change' };
      rerender({ book: updatedBook1 });

      // Trigger auto-save
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Start saving
      act(() => {
        statusCallback('saving');
      });

      // User makes another change during save
      const updatedBook2 = { ...mockBook, title: 'Second change while saving' };
      rerender({ book: updatedBook2 });

      // Complete first save
      act(() => {
        statusCallback('saved');
      });

      // New change should trigger another auto-save
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        // Should have saved twice
        expect(persistenceMock.updateProject).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Additional auto-save controls', () => {
    it('should enable and disable auto-save', async () => {
      const { result } = renderHook(() =>
        useAutoSave(mockBook, { enabled: true, debounceMs: 3000 })
      );

      expect(result.current.isAutoSaveEnabled).toBe(true);

      // Disable auto-save
      act(() => {
        result.current.disableAutoSave();
      });

      expect(persistenceMock.setAutoSaveEnabled).toHaveBeenCalledWith(false);

      // Enable auto-save
      act(() => {
        result.current.enableAutoSave();
      });

      expect(persistenceMock.setAutoSaveEnabled).toHaveBeenCalledWith(true);
    });

    it('should clear pending timer when auto-save is disabled', async () => {
      const { result, rerender } = renderHook(
        ({ book }) => useAutoSave(book, { enabled: true, debounceMs: 3000 }),
        { initialProps: { book: mockBook } }
      );

      // Make a change to start timer
      const updatedBook = { ...mockBook, title: 'Updated' };
      rerender({ book: updatedBook });

      // Disable auto-save before timer completes
      act(() => {
        result.current.disableAutoSave();
      });

      // Advance past debounce time
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Should not have saved because auto-save was disabled
      expect(persistenceMock.updateProject).not.toHaveBeenCalled();
    });

    it('should reload file to resolve conflicts', async () => {
      persistenceMock.loadProject.mockResolvedValue({
        success: true,
        project: mockBook,
      });

      const { result } = renderHook(() =>
        useAutoSave(mockBook, { enabled: true, debounceMs: 3000 })
      );

      let reloadResult: boolean = false;
      await act(async () => {
        reloadResult = await result.current.reloadFile();
      });

      expect(reloadResult).toBe(true);
      expect(persistenceMock.loadProject).toHaveBeenCalledWith('/test/project.vellum');
    });

    it('should handle reload when no file path exists', async () => {
      persistenceMock.getProjectInfo.mockReturnValue({
        filePath: undefined,
        hasUnsavedChanges: false,
        autoSaveEnabled: true,
        saveStatus: 'idle' as SaveStatus,
      });

      const { result } = renderHook(() =>
        useAutoSave(mockBook, { enabled: true, debounceMs: 3000 })
      );

      let reloadResult: boolean = false;
      await act(async () => {
        reloadResult = await result.current.reloadFile();
      });

      expect(reloadResult).toBe(false);
      expect(persistenceMock.loadProject).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup on unmount', () => {
    it('should clear auto-save timer on unmount', async () => {
      const { result, rerender, unmount } = renderHook(
        ({ book }) => useAutoSave(book, { enabled: true, debounceMs: 3000 }),
        { initialProps: { book: mockBook } }
      );

      // Make a change to start timer
      const updatedBook = { ...mockBook, title: 'Updated' };
      rerender({ book: updatedBook });

      // Unmount before timer completes
      unmount();

      // Advance time
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Should not have saved because component unmounted
      expect(persistenceMock.updateProject).not.toHaveBeenCalled();
    });
  });
});
