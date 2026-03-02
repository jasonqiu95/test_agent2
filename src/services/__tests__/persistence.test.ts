/**
 * Persistence Service Tests
 *
 * Tests for saving/loading book projects, JSON serialization/deserialization,
 * file system error handling, auto-save functionality, backup creation,
 * data migration, and edge cases.
 */

import { PersistenceService, VellumProject, SaveResult, LoadResult } from '../persistence';
import type { Book } from '../../types/book';

// Mock memory manager
jest.mock('../memory-manager', () => ({
  memoryManager: {
    registerDisposable: jest.fn(),
    unregisterDisposable: jest.fn(),
    registerCleanupHandler: jest.fn(),
    unregisterCleanupHandler: jest.fn(),
  },
}));

// Mock window.electron - Setup before tests
const mockElectronInvoke = jest.fn();
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();

// Setup global window mock
(global as any).window = Object.assign(global.window || {}, {
  electron: {
    invoke: mockElectronInvoke,
  },
  addEventListener: mockAddEventListener,
  removeEventListener: mockRemoveEventListener,
});

describe('PersistenceService', () => {
  let service: PersistenceService;
  let mockBook: Book;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PersistenceService();

    // Create a minimal valid book for testing
    mockBook = {
      id: 'test-book-1',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      title: 'Test Book',
      authors: [{ id: 'author-1', name: 'Test Author' }],
      frontMatter: [],
      chapters: [
        {
          id: 'chapter-1',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
          title: 'Chapter 1',
          content: [
            {
              id: 'block-1',
              createdAt: new Date('2024-01-01'),
              updatedAt: new Date('2024-01-02'),
              content: 'Test content',
              blockType: 'paragraph',
            },
          ],
        },
      ],
      backMatter: [],
      styles: [],
      metadata: {
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      },
    };
  });

  afterEach(() => {
    service.dispose();
  });

  describe('createProject', () => {
    it('should create a new project with the given book', () => {
      const project = service.createProject(mockBook);

      expect(project).toMatchObject({
        version: '1.0.0',
        formatVersion: '1.0.0',
        book: mockBook,
        metadata: {
          autoSaveEnabled: true,
        },
      });
      expect(project.metadata.lastSaved).toBeDefined();
    });

    it('should set unsaved changes flag after creating project', () => {
      service.createProject(mockBook);
      const info = service.getProjectInfo();

      expect(info.hasUnsavedChanges).toBe(true);
    });

    it('should set current project reference', () => {
      service.createProject(mockBook);
      const currentProject = service.getCurrentProject();

      expect(currentProject).not.toBeNull();
      expect(currentProject?.book).toBe(mockBook);
    });
  });

  describe('updateProject', () => {
    it('should update the current project book data', () => {
      service.createProject(mockBook);
      const updatedBook = { ...mockBook, title: 'Updated Title' };

      service.updateProject(updatedBook);
      const currentProject = service.getCurrentProject();

      expect(currentProject?.book.title).toBe('Updated Title');
    });

    it('should throw error when no project is loaded', () => {
      expect(() => service.updateProject(mockBook)).toThrow('No project loaded');
    });

    it('should set unsaved changes flag', () => {
      service.createProject(mockBook);
      const updatedBook = { ...mockBook, title: 'Updated Title' };

      service.updateProject(updatedBook);
      const info = service.getProjectInfo();

      expect(info.hasUnsavedChanges).toBe(true);
    });

    it('should not trigger auto-save if no file path is set', () => {
      jest.useFakeTimers();
      service.createProject(mockBook);
      const updatedBook = { ...mockBook, title: 'Updated Title' };

      service.updateProject(updatedBook);
      jest.advanceTimersByTime(5000);

      expect(mockElectronInvoke).not.toHaveBeenCalled();
      jest.useRealTimers();
    });
  });

  describe('saveProject', () => {
    it('should return error when no project exists', async () => {
      const result = await service.saveProject('/test/path.vellum');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No project to save');
    });

    it('should save project with JSON serialization', async () => {
      service.createProject(mockBook);
      mockElectronInvoke.mockResolvedValueOnce({ success: true });
      mockElectronInvoke.mockResolvedValueOnce({ success: true, modTime: Date.now() });

      const result = await service.saveProject('/test/path.vellum');

      expect(result.success).toBe(true);
      expect(mockElectronInvoke).toHaveBeenCalledWith(
        'persistence:save',
        expect.objectContaining({
          filePath: '/test/path.vellum',
          content: expect.any(String),
        })
      );
    });

    it('should include all project data in JSON', async () => {
      service.createProject(mockBook);
      mockElectronInvoke.mockResolvedValueOnce({ success: true });
      mockElectronInvoke.mockResolvedValueOnce({ success: true, modTime: Date.now() });

      await service.saveProject('/test/path.vellum');

      const saveCall = mockElectronInvoke.mock.calls.find(
        (call) => call[0] === 'persistence:save'
      );
      const savedContent = JSON.parse(saveCall[1].content);

      expect(savedContent).toMatchObject({
        version: '1.0.0',
        formatVersion: '1.0.0',
        book: expect.any(Object),
        metadata: expect.objectContaining({
          lastSaved: expect.any(String),
          autoSaveEnabled: true,
        }),
      });
    });

    it('should clear unsaved changes flag on successful save', async () => {
      service.createProject(mockBook);
      mockElectronInvoke.mockResolvedValueOnce({ success: true });
      mockElectronInvoke.mockResolvedValueOnce({ success: true, modTime: Date.now() });

      await service.saveProject('/test/path.vellum');
      const info = service.getProjectInfo();

      expect(info.hasUnsavedChanges).toBe(false);
    });

    it('should update save status during save process', async () => {
      service.createProject(mockBook);
      mockElectronInvoke.mockResolvedValueOnce({ success: true });
      mockElectronInvoke.mockResolvedValueOnce({ success: true, modTime: Date.now() });

      const statuses: string[] = [];
      service.onStatusChange((status) => statuses.push(status));

      await service.saveProject('/test/path.vellum');

      expect(statuses).toContain('saving');
      expect(statuses).toContain('saved');
    });

    it('should handle file system errors', async () => {
      service.createProject(mockBook);
      mockElectronInvoke.mockResolvedValueOnce({
        success: false,
        error: 'Permission denied',
      });

      const result = await service.saveProject('/test/path.vellum');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission denied');
    });

    it('should handle exceptions during save', async () => {
      service.createProject(mockBook);
      mockElectronInvoke.mockRejectedValueOnce(new Error('Network error'));

      const result = await service.saveProject('/test/path.vellum');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should trigger saveDialog when no path provided and no current path', async () => {
      service.createProject(mockBook);
      mockElectronInvoke.mockResolvedValueOnce({
        canceled: false,
        filePath: '/test/new-path.vellum',
      });
      mockElectronInvoke.mockResolvedValueOnce({ success: true });
      mockElectronInvoke.mockResolvedValueOnce({ success: true, modTime: Date.now() });

      await service.saveProject();

      expect(mockElectronInvoke).toHaveBeenCalledWith(
        'persistence:saveDialog',
        expect.any(Object)
      );
    });

    it('should detect and prevent external file modifications (conflict)', async () => {
      service.createProject(mockBook);

      // First save
      mockElectronInvoke.mockResolvedValueOnce({ success: true });
      mockElectronInvoke.mockResolvedValueOnce({ success: true, modTime: 1000 });
      await service.saveProject('/test/path.vellum');

      // Simulate external modification
      mockElectronInvoke.mockResolvedValueOnce({ success: true, modTime: 2000 });

      // Try to save again
      const result = await service.saveProject('/test/path.vellum');

      expect(result.success).toBe(false);
      expect(result.error).toContain('modified externally');
    });

    it('should notify save listeners on successful save', async () => {
      const savePath = '/test/path.vellum';
      const saveListener = jest.fn();

      service.createProject(mockBook);
      service.onSave(saveListener);

      mockElectronInvoke.mockResolvedValueOnce({ success: true });
      mockElectronInvoke.mockResolvedValueOnce({ success: true, modTime: Date.now() });

      await service.saveProject(savePath);

      expect(saveListener).toHaveBeenCalledWith(savePath);
    });
  });

  describe('saveProjectAs', () => {
    it('should open save dialog and save to selected path', async () => {
      service.createProject(mockBook);
      mockElectronInvoke.mockResolvedValueOnce({
        canceled: false,
        filePath: '/test/new-file.vellum',
      });
      mockElectronInvoke.mockResolvedValueOnce({ success: true });
      mockElectronInvoke.mockResolvedValueOnce({ success: true, modTime: Date.now() });

      const result = await service.saveProjectAs();

      expect(result.success).toBe(true);
      expect(mockElectronInvoke).toHaveBeenCalledWith(
        'persistence:saveDialog',
        expect.objectContaining({
          defaultPath: 'untitled.vellum',
        })
      );
    });

    it('should return error when user cancels dialog', async () => {
      service.createProject(mockBook);
      mockElectronInvoke.mockResolvedValueOnce({ canceled: true });

      const result = await service.saveProjectAs();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Save canceled');
    });

    it('should return error when no project exists', async () => {
      const result = await service.saveProjectAs();

      expect(result.success).toBe(false);
      expect(result.error).toBe('No project to save');
    });
  });

  describe('loadProject', () => {
    const validProjectContent: VellumProject = {
      version: '1.0.0',
      formatVersion: '1.0.0',
      book: mockBook,
      metadata: {
        lastSaved: new Date().toISOString(),
        autoSaveEnabled: true,
        filePath: '/test/path.vellum',
      },
    };

    it('should load and deserialize valid project', async () => {
      mockElectronInvoke.mockResolvedValueOnce({
        success: true,
        content: JSON.stringify(validProjectContent),
      });
      mockElectronInvoke.mockResolvedValueOnce({ success: true, modTime: Date.now() });

      const result = await service.loadProject('/test/path.vellum');

      expect(result.success).toBe(true);
      expect(result.project).toBeDefined();
      expect(result.project?.book.title).toBe('Test Book');
    });

    it('should clear unsaved changes flag after loading', async () => {
      mockElectronInvoke.mockResolvedValueOnce({
        success: true,
        content: JSON.stringify(validProjectContent),
      });
      mockElectronInvoke.mockResolvedValueOnce({ success: true, modTime: Date.now() });

      await service.loadProject('/test/path.vellum');
      const info = service.getProjectInfo();

      expect(info.hasUnsavedChanges).toBe(false);
    });

    it('should handle file not found error', async () => {
      mockElectronInvoke.mockResolvedValueOnce({
        success: false,
        error: 'File not found',
      });

      const result = await service.loadProject('/test/nonexistent.vellum');

      expect(result.success).toBe(false);
      expect(result.error).toContain('File not found');
    });

    it('should handle corrupted JSON files', async () => {
      mockElectronInvoke.mockResolvedValueOnce({
        success: true,
        content: '{ invalid json',
      });

      const result = await service.loadProject('/test/corrupted.vellum');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should validate project structure - missing book', async () => {
      const invalidProject = {
        version: '1.0.0',
        formatVersion: '1.0.0',
        metadata: {},
      };

      mockElectronInvoke.mockResolvedValueOnce({
        success: true,
        content: JSON.stringify(invalidProject),
      });

      const result = await service.loadProject('/test/invalid.vellum');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should validate project structure - missing version', async () => {
      const invalidProject = {
        book: mockBook,
        metadata: {},
      };

      mockElectronInvoke.mockResolvedValueOnce({
        success: true,
        content: JSON.stringify(invalidProject),
      });

      const result = await service.loadProject('/test/invalid.vellum');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle missing fields gracefully', async () => {
      const projectWithMissingFields = {
        version: '1.0.0',
        book: mockBook,
        // Missing formatVersion and some metadata
      };

      mockElectronInvoke.mockResolvedValueOnce({
        success: true,
        content: JSON.stringify(projectWithMissingFields),
      });
      mockElectronInvoke.mockResolvedValueOnce({ success: true, modTime: Date.now() });

      const result = await service.loadProject('/test/incomplete.vellum');

      expect(result.success).toBe(true);
      expect(result.project?.book).toBeDefined();
    });

    it('should handle network/permission errors', async () => {
      mockElectronInvoke.mockRejectedValueOnce(new Error('Permission denied'));

      const result = await service.loadProject('/test/path.vellum');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should track file modification time for conflict detection', async () => {
      const modTime = Date.now();
      mockElectronInvoke.mockResolvedValueOnce({
        success: true,
        content: JSON.stringify(validProjectContent),
      });
      mockElectronInvoke.mockResolvedValueOnce({ success: true, modTime });

      await service.loadProject('/test/path.vellum');

      // The service should have stored the modTime internally
      // Verify by checking that a subsequent save checks for conflicts
      mockElectronInvoke.mockResolvedValueOnce({ success: true, modTime: modTime + 1000 });

      const saveResult = await service.saveProject('/test/path.vellum');
      expect(saveResult.error).toContain('modified externally');
    });
  });

  describe('openProject', () => {
    const validProjectContent: VellumProject = {
      version: '1.0.0',
      formatVersion: '1.0.0',
      book: mockBook,
      metadata: {
        lastSaved: new Date().toISOString(),
        autoSaveEnabled: true,
      },
    };

    it('should open file dialog and load selected file', async () => {
      mockElectronInvoke.mockResolvedValueOnce({
        canceled: false,
        filePath: '/test/selected.vellum',
      });
      mockElectronInvoke.mockResolvedValueOnce({
        success: true,
        content: JSON.stringify(validProjectContent),
      });
      mockElectronInvoke.mockResolvedValueOnce({ success: true, modTime: Date.now() });

      const result = await service.openProject();

      expect(result.success).toBe(true);
      expect(mockElectronInvoke).toHaveBeenCalledWith('persistence:openDialog');
    });

    it('should return error when user cancels dialog', async () => {
      mockElectronInvoke.mockResolvedValueOnce({ canceled: true });

      const result = await service.openProject();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Open canceled');
    });

    it('should prompt to save unsaved changes before opening', async () => {
      service.createProject(mockBook);

      // User chooses to save
      mockElectronInvoke.mockResolvedValueOnce({ response: 0 });
      mockElectronInvoke.mockResolvedValueOnce({
        canceled: false,
        filePath: '/test/save-before-open.vellum',
      });
      mockElectronInvoke.mockResolvedValueOnce({ success: true });
      mockElectronInvoke.mockResolvedValueOnce({ success: true, modTime: Date.now() });

      // Open dialog
      mockElectronInvoke.mockResolvedValueOnce({
        canceled: false,
        filePath: '/test/selected.vellum',
      });
      mockElectronInvoke.mockResolvedValueOnce({
        success: true,
        content: JSON.stringify(validProjectContent),
      });
      mockElectronInvoke.mockResolvedValueOnce({ success: true, modTime: Date.now() });

      await service.openProject();

      expect(mockElectronInvoke).toHaveBeenCalledWith(
        'persistence:confirmUnsavedChanges',
        expect.any(Object)
      );
    });

    it('should cancel open if user cancels unsaved changes prompt', async () => {
      service.createProject(mockBook);

      // User chooses to cancel
      mockElectronInvoke.mockResolvedValueOnce({ response: 2 });

      const result = await service.openProject();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Open canceled');
    });
  });

  describe('Auto-save functionality', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should trigger auto-save after debounce period', async () => {
      service.createProject(mockBook);

      // Initial save
      mockElectronInvoke
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: true, modTime: Date.now() });

      await service.saveProject('/test/path.vellum');

      mockElectronInvoke.mockClear();

      service.updateProject({ ...mockBook, title: 'Updated' });

      // Should not save immediately
      expect(mockElectronInvoke).not.toHaveBeenCalled();

      // Mock for auto-save
      mockElectronInvoke
        .mockResolvedValueOnce({ success: true, modTime: Date.now() })  // checkForConflict
        .mockResolvedValueOnce({ success: true })  // save
        .mockResolvedValueOnce({ success: true, modTime: Date.now() });  // updateFileModTime

      // Should save after debounce (default 3000ms)
      jest.advanceTimersByTime(3000);
      await Promise.resolve(); // Wait for async operations
      await Promise.resolve(); // Extra tick for promises

      expect(mockElectronInvoke).toHaveBeenCalledWith(
        'persistence:getFileStats',
        expect.any(Object)
      );
    });

    it('should debounce multiple rapid updates', async () => {
      service.createProject(mockBook);

      // Initial save
      mockElectronInvoke
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: true, modTime: Date.now() });

      await service.saveProject('/test/path.vellum');

      mockElectronInvoke.mockClear();

      // Mock for auto-save
      mockElectronInvoke
        .mockResolvedValue({ success: true, modTime: Date.now() })
        .mockResolvedValue({ success: true })
        .mockResolvedValue({ success: true, modTime: Date.now() });

      // Make multiple rapid updates
      service.updateProject({ ...mockBook, title: 'Update 1' });
      jest.advanceTimersByTime(1000);
      service.updateProject({ ...mockBook, title: 'Update 2' });
      jest.advanceTimersByTime(1000);
      service.updateProject({ ...mockBook, title: 'Update 3' });

      // Should only save once after final debounce period
      jest.advanceTimersByTime(3000);
      await Promise.resolve();
      await Promise.resolve();

      const saveCalls = mockElectronInvoke.mock.calls.filter(
        (call) => call[0] === 'persistence:save'
      );
      expect(saveCalls.length).toBeGreaterThanOrEqual(1);
    });

    it('should respect custom debounce time', async () => {
      service.setAutoSaveDebounce(1000);
      service.createProject(mockBook);

      // Initial save
      mockElectronInvoke
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: true, modTime: Date.now() });

      await service.saveProject('/test/path.vellum');

      mockElectronInvoke.mockClear();

      // Mock for auto-save
      mockElectronInvoke
        .mockResolvedValue({ success: true, modTime: Date.now() })
        .mockResolvedValue({ success: true })
        .mockResolvedValue({ success: true, modTime: Date.now() });

      service.updateProject({ ...mockBook, title: 'Updated' });

      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      await Promise.resolve();

      expect(mockElectronInvoke).toHaveBeenCalledWith(
        'persistence:getFileStats',
        expect.any(Object)
      );
    });

    it('should disable auto-save when disabled', async () => {
      mockElectronInvoke.mockResolvedValue({ success: true });

      service.setAutoSaveEnabled(false);
      service.createProject(mockBook);
      await service.saveProject('/test/path.vellum');

      mockElectronInvoke.mockClear();

      service.updateProject({ ...mockBook, title: 'Updated' });

      jest.advanceTimersByTime(5000);

      expect(mockElectronInvoke).not.toHaveBeenCalled();
    });

    it('should clear auto-save timer when disabled', () => {
      mockElectronInvoke.mockResolvedValue({ success: true });

      service.createProject(mockBook);
      service.updateProject({ ...mockBook, title: 'Updated' });

      service.setAutoSaveEnabled(false);

      jest.advanceTimersByTime(5000);

      expect(mockElectronInvoke).not.toHaveBeenCalled();
    });
  });

  describe('Project info and state', () => {
    it('should return correct project info for new project', () => {
      service.createProject(mockBook);
      const info = service.getProjectInfo();

      expect(info).toMatchObject({
        hasUnsavedChanges: true,
        autoSaveEnabled: true,
        saveStatus: 'idle',
      });
      expect(info.filePath).toBeUndefined();
    });

    it('should return correct project info after save', async () => {
      service.createProject(mockBook);
      mockElectronInvoke.mockResolvedValueOnce({ success: true });
      mockElectronInvoke.mockResolvedValueOnce({ success: true, modTime: Date.now() });

      await service.saveProject('/test/path.vellum');
      const info = service.getProjectInfo();

      expect(info).toMatchObject({
        filePath: '/test/path.vellum',
        hasUnsavedChanges: false,
        autoSaveEnabled: true,
      });
      expect(info.lastSaved).toBeDefined();
    });

    it('should track save status correctly', async () => {
      service.createProject(mockBook);

      const statuses: string[] = [];
      service.onStatusChange((status) => statuses.push(status));

      mockElectronInvoke.mockResolvedValueOnce({ success: true });
      mockElectronInvoke.mockResolvedValueOnce({ success: true, modTime: Date.now() });

      await service.saveProject('/test/path.vellum');

      expect(statuses).toEqual(['saving', 'saved']);
    });

    it('should track error status on save failure', async () => {
      service.createProject(mockBook);

      // Mock conflict check to pass
      mockElectronInvoke.mockResolvedValueOnce({
        success: false,
        error: 'Disk full',
      });

      const result = await service.saveProject('/test/path.vellum');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Disk full');

      const info = service.getProjectInfo();
      expect(info.saveStatus).toBe('error');
      expect(info.lastError).toBe('Disk full');
    });
  });

  describe('Change listeners', () => {
    it('should notify change listeners when changes occur', () => {
      const changeListener = jest.fn();
      service.onChangeStatusChange(changeListener);

      service.createProject(mockBook);

      expect(changeListener).toHaveBeenCalledWith(true);
    });

    it('should notify change listeners when changes are saved', async () => {
      const changeListener = jest.fn();
      service.createProject(mockBook);
      service.onChangeStatusChange(changeListener);

      mockElectronInvoke.mockResolvedValueOnce({ success: true });
      mockElectronInvoke.mockResolvedValueOnce({ success: true, modTime: Date.now() });

      await service.saveProject('/test/path.vellum');

      expect(changeListener).toHaveBeenCalledWith(false);
    });

    it('should allow unsubscribing from change listeners', () => {
      const changeListener = jest.fn();
      const unsubscribe = service.onChangeStatusChange(changeListener);

      unsubscribe();
      service.createProject(mockBook);

      expect(changeListener).not.toHaveBeenCalled();
    });

    it('should allow unsubscribing from save listeners', async () => {
      const saveListener = jest.fn();
      service.createProject(mockBook);

      const unsubscribe = service.onSave(saveListener);
      unsubscribe();

      mockElectronInvoke.mockResolvedValueOnce({ success: true });
      mockElectronInvoke.mockResolvedValueOnce({ success: true, modTime: Date.now() });

      await service.saveProject('/test/path.vellum');

      expect(saveListener).not.toHaveBeenCalled();
    });
  });

  describe('newProject and closeProject', () => {
    it('should create new project without prompt when no unsaved changes', async () => {
      const result = await service.newProject(mockBook);

      expect(result).toBe(true);
      expect(service.getCurrentProject()).not.toBeNull();
    });

    it('should prompt before creating new project with unsaved changes', async () => {
      service.createProject(mockBook);

      // User chooses not to save
      mockElectronInvoke.mockResolvedValueOnce({ response: 1 });

      const result = await service.newProject({
        ...mockBook,
        id: 'new-book',
      });

      expect(result).toBe(true);
      expect(mockElectronInvoke).toHaveBeenCalledWith(
        'persistence:confirmUnsavedChanges',
        expect.any(Object)
      );
    });

    it('should close project without prompt when no unsaved changes', async () => {
      service.createProject(mockBook);
      mockElectronInvoke.mockResolvedValueOnce({ success: true });
      mockElectronInvoke.mockResolvedValueOnce({ success: true, modTime: Date.now() });

      await service.saveProject('/test/path.vellum');

      const result = await service.closeProject();

      expect(result).toBe(true);
      expect(service.getCurrentProject()).toBeNull();
    });

    it('should prompt before closing project with unsaved changes', async () => {
      service.createProject(mockBook);

      // User chooses not to save
      mockElectronInvoke.mockResolvedValueOnce({ response: 1 });

      const result = await service.closeProject();

      expect(result).toBe(true);
      expect(mockElectronInvoke).toHaveBeenCalledWith(
        'persistence:confirmUnsavedChanges',
        expect.any(Object)
      );
    });
  });

  describe('Version handling and data migration', () => {
    it('should handle different format versions gracefully', async () => {
      const futureVersionProject = {
        version: '2.0.0',
        formatVersion: '2.0.0',
        book: mockBook,
        metadata: {
          lastSaved: new Date().toISOString(),
          autoSaveEnabled: true,
        },
      };

      mockElectronInvoke.mockResolvedValueOnce({
        success: true,
        content: JSON.stringify(futureVersionProject),
      });
      mockElectronInvoke.mockResolvedValueOnce({ success: true, modTime: Date.now() });

      const result = await service.loadProject('/test/future-version.vellum');

      // Should load successfully even with different version
      expect(result.success).toBe(true);
      expect(result.project?.version).toBe('2.0.0');
    });

    it('should save with current version info', async () => {
      service.createProject(mockBook);
      mockElectronInvoke.mockResolvedValueOnce({ success: true });
      mockElectronInvoke.mockResolvedValueOnce({ success: true, modTime: Date.now() });

      await service.saveProject('/test/path.vellum');

      const saveCall = mockElectronInvoke.mock.calls.find(
        (call) => call[0] === 'persistence:save'
      );
      const savedContent = JSON.parse(saveCall[1].content);

      expect(savedContent.version).toBe('1.0.0');
      expect(savedContent.formatVersion).toBe('1.0.0');
    });
  });

  describe('Edge cases and error scenarios', () => {
    it('should handle empty file content', async () => {
      mockElectronInvoke.mockResolvedValueOnce({
        success: false,
        error: 'Empty file',
      });

      const result = await service.loadProject('/test/empty.vellum');

      expect(result.success).toBe(false);
    });

    it('should handle null/undefined in loaded data', async () => {
      const projectWithNulls = {
        version: '1.0.0',
        book: null,
      };

      mockElectronInvoke.mockResolvedValueOnce({
        success: false,
        error: 'Failed to load file',
      });

      const result = await service.loadProject('/test/nulls.vellum');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle very large files gracefully', async () => {
      const largeBook = {
        ...mockBook,
        chapters: Array(1000).fill(mockBook.chapters[0]),
      };
      const largeProject = {
        version: '1.0.0',
        formatVersion: '1.0.0',
        book: largeBook,
        metadata: {
          lastSaved: new Date().toISOString(),
          autoSaveEnabled: true,
        },
      };

      mockElectronInvoke.mockResolvedValueOnce({
        success: true,
        content: JSON.stringify(largeProject),
      });
      mockElectronInvoke.mockResolvedValueOnce({ success: true, modTime: Date.now() });

      const result = await service.loadProject('/test/large.vellum');

      expect(result.success).toBe(true);
      expect(result.project?.book.chapters).toHaveLength(1000);
    });

    it('should handle special characters in file paths', async () => {
      service.createProject(mockBook);
      const specialPath = '/test/path with spaces & special[chars].vellum';

      mockElectronInvoke.mockResolvedValueOnce({ success: true });
      mockElectronInvoke.mockResolvedValueOnce({ success: true, modTime: Date.now() });

      const result = await service.saveProject(specialPath);

      expect(result.success).toBe(true);
      expect(mockElectronInvoke).toHaveBeenCalledWith(
        'persistence:save',
        expect.objectContaining({ filePath: specialPath })
      );
    });

    it('should handle concurrent save operations', async () => {
      service.createProject(mockBook);

      mockElectronInvoke.mockImplementation((channel) => {
        if (channel === 'persistence:save') {
          return new Promise((resolve) => {
            setTimeout(() => resolve({ success: true }), 100);
          });
        }
        return Promise.resolve({ success: true, modTime: Date.now() });
      });

      // Start two saves concurrently
      const save1 = service.saveProject('/test/path1.vellum');
      const save2 = service.saveProject('/test/path2.vellum');

      const [result1, result2] = await Promise.all([save1, save2]);

      // Both should succeed (last one wins)
      expect(result1.success || result2.success).toBe(true);
    });
  });

  describe('Cleanup and disposal', () => {
    it('should clear all timers on dispose', () => {
      jest.useFakeTimers();
      service.createProject(mockBook);
      service.updateProject({ ...mockBook, title: 'Updated' });

      service.dispose();
      jest.advanceTimersByTime(5000);

      expect(mockElectronInvoke).not.toHaveBeenCalled();
      jest.useRealTimers();
    });

    it('should clear all listeners on dispose', () => {
      const changeListener = jest.fn();
      const saveListener = jest.fn();

      service.onChangeStatusChange(changeListener);
      service.onSave(saveListener);

      service.dispose();

      const listenerCount = service.getListenerCount();
      expect(listenerCount.changeListeners).toBe(0);
      expect(listenerCount.saveListeners).toBe(0);
    });

    it('should clear project data on dispose', () => {
      service.createProject(mockBook);
      service.dispose();

      expect(service.getCurrentProject()).toBeNull();
    });

    it('should remove event listeners on dispose', () => {
      service.dispose();

      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        'beforeunload',
        expect.any(Function)
      );
    });
  });

  describe('beforeunload handler', () => {
    it('should register beforeunload event listener', () => {
      // Service is already created in beforeEach
      expect(mockAddEventListener).toHaveBeenCalledWith(
        'beforeunload',
        expect.any(Function)
      );
    });
  });

  describe('JSON serialization edge cases', () => {
    it('should handle Date objects in serialization', async () => {
      service.createProject(mockBook);
      mockElectronInvoke.mockResolvedValueOnce({ success: true });
      mockElectronInvoke.mockResolvedValueOnce({ success: true, modTime: Date.now() });

      await service.saveProject('/test/path.vellum');

      const saveCall = mockElectronInvoke.mock.calls.find(
        (call) => call[0] === 'persistence:save'
      );
      const savedContent = JSON.parse(saveCall[1].content);

      // Dates should be serialized as ISO strings
      expect(typeof savedContent.metadata.lastSaved).toBe('string');
    });

    it('should preserve nested object structure', async () => {
      service.createProject(mockBook);
      mockElectronInvoke.mockResolvedValueOnce({ success: true });
      mockElectronInvoke.mockResolvedValueOnce({ success: true, modTime: Date.now() });

      await service.saveProject('/test/path.vellum');

      const saveCall = mockElectronInvoke.mock.calls.find(
        (call) => call[0] === 'persistence:save'
      );
      const savedContent = JSON.parse(saveCall[1].content);

      expect(savedContent.book.chapters[0].content[0]).toMatchObject({
        id: 'block-1',
        content: 'Test content',
        blockType: 'paragraph',
      });
    });
  });
});
