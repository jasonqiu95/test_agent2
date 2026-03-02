/**
 * Unit tests for usePersistence hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { usePersistence } from '../usePersistence';
import type { Book } from '../../types/book';
import type { VellumProject, SaveStatus } from '../../services/persistence';

// Mock the persistence service
jest.mock('../../services/persistence', () => {
  const mockPersistenceService = {
    getProjectInfo: jest.fn(),
    getCurrentProject: jest.fn(),
    onChangeStatusChange: jest.fn(),
    onSave: jest.fn(),
    onStatusChange: jest.fn(),
    saveProject: jest.fn(),
    saveProjectAs: jest.fn(),
    openProject: jest.fn(),
    createProject: jest.fn(),
    updateProject: jest.fn(),
    setAutoSaveEnabled: jest.fn(),
  };

  return {
    getPersistenceService: jest.fn(() => mockPersistenceService),
    __mockPersistenceService: mockPersistenceService,
  };
});

const persistenceMock = require('../../services/persistence').__mockPersistenceService;

describe('usePersistence', () => {
  let mockBook: Book;
  let mockProject: VellumProject;

  beforeEach(() => {
    jest.useFakeTimers();

    mockBook = {
      id: 'test-book-1',
      title: 'Test Book',
      author: 'Test Author',
      chapters: [],
      metadata: {
        wordCount: 0,
        characterCount: 0,
        language: 'en',
        version: '1.0.0',
      },
    } as Book;

    mockProject = {
      version: '1.0.0',
      formatVersion: '1.0.0',
      book: mockBook,
      metadata: {
        lastSaved: new Date().toISOString(),
        autoSaveEnabled: true,
      },
    };

    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    persistenceMock.getProjectInfo.mockReturnValue({
      filePath: undefined,
      hasUnsavedChanges: false,
      lastSaved: undefined,
      autoSaveEnabled: true,
      saveStatus: 'idle' as SaveStatus,
      lastError: undefined,
    });

    persistenceMock.getCurrentProject.mockReturnValue(null);

    persistenceMock.onChangeStatusChange.mockImplementation((callback: any) => {
      return () => {};
    });

    persistenceMock.onSave.mockImplementation((callback: any) => {
      return () => {};
    });

    persistenceMock.onStatusChange.mockImplementation((callback: any) => {
      return () => {};
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with project info from persistence service', () => {
      const { result } = renderHook(() => usePersistence());

      expect(result.current.currentProject.fileName).toBeNull();
      expect(result.current.currentProject.filePath).toBeNull();
      expect(result.current.currentProject.data).toBeNull();
      expect(result.current.hasUnsavedChanges).toBe(false);
      expect(result.current.isAutoSaveEnabled).toBe(true);
      expect(result.current.saveStatus).toBe('idle');
      expect(persistenceMock.getProjectInfo).toHaveBeenCalled();
      expect(persistenceMock.getCurrentProject).toHaveBeenCalled();
    });

    it('should display project info when project is loaded', () => {
      persistenceMock.getProjectInfo.mockReturnValue({
        filePath: '/path/to/test.vellum',
        hasUnsavedChanges: false,
        lastSaved: new Date(),
        autoSaveEnabled: true,
        saveStatus: 'saved' as SaveStatus,
      });

      persistenceMock.getCurrentProject.mockReturnValue(mockProject);

      const { result } = renderHook(() => usePersistence());

      expect(result.current.currentProject.fileName).toBe('test.vellum');
      expect(result.current.currentProject.filePath).toBe('/path/to/test.vellum');
      expect(result.current.currentProject.data).toEqual(mockProject);
      expect(result.current.saveStatus).toBe('saved');
    });
  });

  describe('manual save', () => {
    it('should save a new project', async () => {
      persistenceMock.saveProject.mockResolvedValue({
        success: true,
        filePath: '/path/to/newfile.vellum',
      });

      const { result } = renderHook(() => usePersistence());

      let saveResult;
      await act(async () => {
        saveResult = await result.current.save(mockBook);
      });

      expect(persistenceMock.createProject).toHaveBeenCalledWith(mockBook);
      expect(persistenceMock.saveProject).toHaveBeenCalled();
      expect(saveResult).toEqual({
        success: true,
        fileName: 'newfile.vellum',
        error: undefined,
        canceled: false,
      });
    });

    it('should update and save existing project', async () => {
      persistenceMock.getCurrentProject.mockReturnValue(mockProject);
      persistenceMock.saveProject.mockResolvedValue({
        success: true,
        filePath: '/path/to/existing.vellum',
      });

      const { result } = renderHook(() => usePersistence());

      let saveResult;
      await act(async () => {
        saveResult = await result.current.save(mockBook);
      });

      expect(persistenceMock.updateProject).toHaveBeenCalledWith(mockBook);
      expect(persistenceMock.createProject).not.toHaveBeenCalled();
      expect(persistenceMock.saveProject).toHaveBeenCalled();
      expect(saveResult).toEqual({
        success: true,
        fileName: 'existing.vellum',
        error: undefined,
        canceled: false,
      });
    });

    it('should handle save errors', async () => {
      persistenceMock.saveProject.mockResolvedValue({
        success: false,
        error: 'Permission denied',
      });

      const { result } = renderHook(() => usePersistence());

      let saveResult;
      await act(async () => {
        saveResult = await result.current.save(mockBook);
      });

      expect(saveResult).toEqual({
        success: false,
        fileName: undefined,
        error: 'Permission denied',
        canceled: false,
      });
    });

    it('should handle save cancellation', async () => {
      persistenceMock.saveProject.mockResolvedValue({
        success: false,
      });

      const { result } = renderHook(() => usePersistence());

      let saveResult;
      await act(async () => {
        saveResult = await result.current.save(mockBook);
      });

      expect(saveResult).toEqual({
        success: false,
        fileName: undefined,
        error: undefined,
        canceled: true,
      });
    });
  });

  describe('saveAs', () => {
    it('should save project with new file path', async () => {
      persistenceMock.getCurrentProject.mockReturnValue(mockProject);
      persistenceMock.saveProjectAs.mockResolvedValue({
        success: true,
        filePath: '/path/to/newname.vellum',
      });

      const { result } = renderHook(() => usePersistence());

      let saveResult;
      await act(async () => {
        saveResult = await result.current.saveAs(mockBook);
      });

      expect(persistenceMock.updateProject).toHaveBeenCalledWith(mockBook);
      expect(persistenceMock.saveProjectAs).toHaveBeenCalled();
      expect(saveResult).toEqual({
        success: true,
        fileName: 'newname.vellum',
        error: undefined,
        canceled: false,
      });
    });

    it('should handle saveAs cancellation', async () => {
      persistenceMock.saveProjectAs.mockResolvedValue({
        success: false,
      });

      const { result } = renderHook(() => usePersistence());

      let saveResult;
      await act(async () => {
        saveResult = await result.current.saveAs(mockBook);
      });

      expect(saveResult).toEqual({
        success: false,
        fileName: undefined,
        error: undefined,
        canceled: true,
      });
    });
  });

  describe('load', () => {
    it('should load a project successfully', async () => {
      persistenceMock.openProject.mockResolvedValue({
        success: true,
        project: mockProject,
      });

      persistenceMock.getProjectInfo.mockReturnValue({
        filePath: '/path/to/loaded.vellum',
        hasUnsavedChanges: false,
        autoSaveEnabled: true,
        saveStatus: 'idle' as SaveStatus,
      });

      const { result } = renderHook(() => usePersistence());

      let loadResult;
      await act(async () => {
        loadResult = await result.current.load();
      });

      expect(persistenceMock.openProject).toHaveBeenCalled();
      expect(loadResult).toEqual({
        success: true,
        data: mockProject,
        fileName: 'loaded.vellum',
        error: undefined,
        canceled: false,
      });
    });

    it('should handle load errors', async () => {
      persistenceMock.openProject.mockResolvedValue({
        success: false,
        error: 'File not found',
      });

      const { result } = renderHook(() => usePersistence());

      let loadResult;
      await act(async () => {
        loadResult = await result.current.load();
      });

      expect(loadResult).toEqual({
        success: false,
        data: undefined,
        fileName: undefined,
        error: 'File not found',
        canceled: false,
      });
    });

    it('should handle load cancellation', async () => {
      persistenceMock.openProject.mockResolvedValue({
        success: false,
      });

      const { result } = renderHook(() => usePersistence());

      let loadResult;
      await act(async () => {
        loadResult = await result.current.load();
      });

      expect(loadResult).toEqual({
        success: false,
        data: undefined,
        fileName: undefined,
        error: undefined,
        canceled: true,
      });
    });
  });

  describe('error handling', () => {
    it('should expose error information', () => {
      persistenceMock.getProjectInfo.mockReturnValue({
        filePath: '/path/to/test.vellum',
        hasUnsavedChanges: true,
        autoSaveEnabled: true,
        saveStatus: 'error' as SaveStatus,
        lastError: 'Network error',
      });

      const { result } = renderHook(() => usePersistence());

      expect(result.current.saveStatus).toBe('error');
      expect(result.current.lastError).toBe('Network error');
    });

    it('should update error state when persistence service notifies', async () => {
      let statusCallback: any;
      persistenceMock.onStatusChange.mockImplementation((callback: any) => {
        statusCallback = callback;
        return () => {};
      });

      persistenceMock.getProjectInfo.mockReturnValue({
        filePath: '/path/to/test.vellum',
        hasUnsavedChanges: false,
        autoSaveEnabled: true,
        saveStatus: 'idle' as SaveStatus,
      });

      const { result } = renderHook(() => usePersistence());

      expect(result.current.saveStatus).toBe('idle');

      // Simulate error
      act(() => {
        persistenceMock.getProjectInfo.mockReturnValue({
          filePath: '/path/to/test.vellum',
          hasUnsavedChanges: false,
          autoSaveEnabled: true,
          saveStatus: 'error' as SaveStatus,
          lastError: 'Save failed',
        });
        statusCallback();
      });

      await waitFor(() => {
        expect(result.current.saveStatus).toBe('error');
        expect(result.current.lastError).toBe('Save failed');
      });
    });
  });

  describe('markModified', () => {
    it('should mark project as modified', () => {
      const { result } = renderHook(() => usePersistence());

      act(() => {
        result.current.markModified(mockBook);
      });

      expect(persistenceMock.createProject).toHaveBeenCalledWith(mockBook);
      expect(persistenceMock.getProjectInfo).toHaveBeenCalled();
      expect(persistenceMock.getCurrentProject).toHaveBeenCalled();
    });

    it('should update existing project when marking as modified', () => {
      persistenceMock.getCurrentProject.mockReturnValue(mockProject);

      const { result } = renderHook(() => usePersistence());

      act(() => {
        result.current.markModified(mockBook);
      });

      expect(persistenceMock.updateProject).toHaveBeenCalledWith(mockBook);
      expect(persistenceMock.createProject).not.toHaveBeenCalled();
    });
  });

  describe('auto-save', () => {
    it('should toggle auto-save enabled state', () => {
      const { result } = renderHook(() => usePersistence());

      act(() => {
        result.current.setAutoSaveEnabled(false);
      });

      expect(persistenceMock.setAutoSaveEnabled).toHaveBeenCalledWith(false);
      expect(persistenceMock.getProjectInfo).toHaveBeenCalled();
    });

    it('should reflect auto-save state', () => {
      persistenceMock.getProjectInfo.mockReturnValue({
        filePath: undefined,
        hasUnsavedChanges: false,
        autoSaveEnabled: false,
        saveStatus: 'idle' as SaveStatus,
      });

      const { result } = renderHook(() => usePersistence());

      expect(result.current.isAutoSaveEnabled).toBe(false);
    });
  });

  describe('newProject', () => {
    it('should allow creating new project when no unsaved changes', async () => {
      persistenceMock.getProjectInfo.mockReturnValue({
        filePath: '/path/to/test.vellum',
        hasUnsavedChanges: false,
        autoSaveEnabled: true,
        saveStatus: 'idle' as SaveStatus,
      });

      const { result } = renderHook(() => usePersistence());

      let newProjectResult;
      await act(async () => {
        newProjectResult = await result.current.newProject();
      });

      expect(newProjectResult).toEqual({
        success: true,
        needsSave: false,
      });
    });

    it('should prevent creating new project when unsaved changes exist', async () => {
      persistenceMock.getProjectInfo.mockReturnValue({
        filePath: '/path/to/test.vellum',
        hasUnsavedChanges: true,
        autoSaveEnabled: true,
        saveStatus: 'idle' as SaveStatus,
      });

      const { result } = renderHook(() => usePersistence());

      let newProjectResult;
      await act(async () => {
        newProjectResult = await result.current.newProject();
      });

      expect(newProjectResult).toEqual({
        success: false,
        needsSave: true,
      });
    });
  });

  describe('callbacks', () => {
    it('should call onSave callback when project is saved', async () => {
      const onSaveMock = jest.fn();
      let saveCallback: any;

      persistenceMock.onSave.mockImplementation((callback: any) => {
        saveCallback = callback;
        return () => {};
      });

      renderHook(() => usePersistence({ onSave: onSaveMock }));

      act(() => {
        saveCallback('/path/to/saved.vellum');
      });

      await waitFor(() => {
        expect(onSaveMock).toHaveBeenCalledWith('/path/to/saved.vellum');
      });
    });

    it('should call onChange callback when changes occur', async () => {
      const onChangeMock = jest.fn();
      let changeCallback: any;

      persistenceMock.onChangeStatusChange.mockImplementation((callback: any) => {
        changeCallback = callback;
        return () => {};
      });

      renderHook(() => usePersistence({ onChange: onChangeMock }));

      act(() => {
        changeCallback(true);
      });

      await waitFor(() => {
        expect(onChangeMock).toHaveBeenCalledWith(true);
      });
    });
  });

  describe('cleanup on unmount', () => {
    it('should unsubscribe from change listener on unmount', () => {
      const unsubscribeMock = jest.fn();
      persistenceMock.onChangeStatusChange.mockReturnValue(unsubscribeMock);

      const { unmount } = renderHook(() => usePersistence());

      unmount();

      expect(unsubscribeMock).toHaveBeenCalled();
    });

    it('should unsubscribe from save listener on unmount', () => {
      const unsubscribeMock = jest.fn();
      persistenceMock.onSave.mockReturnValue(unsubscribeMock);

      const { unmount } = renderHook(() => usePersistence());

      unmount();

      expect(unsubscribeMock).toHaveBeenCalled();
    });

    it('should unsubscribe from status listener on unmount', () => {
      const unsubscribeMock = jest.fn();
      persistenceMock.onStatusChange.mockReturnValue(unsubscribeMock);

      const { unmount } = renderHook(() => usePersistence());

      unmount();

      expect(unsubscribeMock).toHaveBeenCalled();
    });

    it('should clean up all listeners on unmount', () => {
      const changeUnsubscribe = jest.fn();
      const saveUnsubscribe = jest.fn();
      const statusUnsubscribe = jest.fn();

      persistenceMock.onChangeStatusChange.mockReturnValue(changeUnsubscribe);
      persistenceMock.onSave.mockReturnValue(saveUnsubscribe);
      persistenceMock.onStatusChange.mockReturnValue(statusUnsubscribe);

      const { unmount } = renderHook(() => usePersistence());

      unmount();

      expect(changeUnsubscribe).toHaveBeenCalled();
      expect(saveUnsubscribe).toHaveBeenCalled();
      expect(statusUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('save status states', () => {
    it('should reflect idle status', () => {
      persistenceMock.getProjectInfo.mockReturnValue({
        filePath: undefined,
        hasUnsavedChanges: false,
        autoSaveEnabled: true,
        saveStatus: 'idle' as SaveStatus,
      });

      const { result } = renderHook(() => usePersistence());

      expect(result.current.saveStatus).toBe('idle');
    });

    it('should reflect saving status', () => {
      persistenceMock.getProjectInfo.mockReturnValue({
        filePath: '/path/to/test.vellum',
        hasUnsavedChanges: true,
        autoSaveEnabled: true,
        saveStatus: 'saving' as SaveStatus,
      });

      const { result } = renderHook(() => usePersistence());

      expect(result.current.saveStatus).toBe('saving');
    });

    it('should reflect saved status', () => {
      persistenceMock.getProjectInfo.mockReturnValue({
        filePath: '/path/to/test.vellum',
        hasUnsavedChanges: false,
        autoSaveEnabled: true,
        saveStatus: 'saved' as SaveStatus,
      });

      const { result } = renderHook(() => usePersistence());

      expect(result.current.saveStatus).toBe('saved');
    });

    it('should reflect conflict status', () => {
      persistenceMock.getProjectInfo.mockReturnValue({
        filePath: '/path/to/test.vellum',
        hasUnsavedChanges: true,
        autoSaveEnabled: true,
        saveStatus: 'conflict' as SaveStatus,
        lastError: 'File modified externally',
      });

      const { result } = renderHook(() => usePersistence());

      expect(result.current.saveStatus).toBe('conflict');
      expect(result.current.lastError).toBe('File modified externally');
    });
  });
});
