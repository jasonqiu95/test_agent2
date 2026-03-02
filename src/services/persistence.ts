/**
 * Project persistence service for .vellum file format
 */

import { Book } from '../types/book';
import { getErrorHandler, ErrorType } from '../utils/errorHandler';
import { memoryManager } from './memory-manager';

export interface VellumProject {
  version: string;
  formatVersion: string;
  book: Book;
  metadata: {
    lastSaved: string;
    autoSaveEnabled: boolean;
    filePath?: string;
  };
}

export interface SaveResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

export interface LoadResult {
  success: boolean;
  project?: VellumProject;
  error?: string;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'conflict';

export interface ProjectInfo {
  filePath?: string;
  hasUnsavedChanges: boolean;
  lastSaved?: Date;
  autoSaveEnabled: boolean;
  saveStatus: SaveStatus;
  lastError?: string;
}

type ChangeListener = (hasChanges: boolean) => void;
type SaveListener = (filePath: string) => void;
type StatusListener = (status: SaveStatus) => void;

export class PersistenceService {
  private currentProject: VellumProject | null = null;
  private currentFilePath: string | null = null;
  private hasUnsavedChanges: boolean = false;
  private autoSaveEnabled: boolean = true;
  private autoSaveDebounceMs: number = 3000; // Default to 3 seconds as per requirements
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private changeListeners: Set<ChangeListener> = new Set();
  private saveListeners: Set<SaveListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private saveStatus: SaveStatus = 'idle';
  private lastError: string | undefined = undefined;
  private lastFileModTime: number | null = null;
  private errorHandler = getErrorHandler();
  private beforeUnloadHandler: ((event: BeforeUnloadEvent) => void) | null = null;

  constructor() {
    this.setupBeforeUnloadHandler();

    // Register with memory manager
    memoryManager.registerDisposable(this);

    // Register cleanup handler for memory optimization
    memoryManager.registerCleanupHandler({
      name: 'persistence-cleanup',
      priority: 30,
      cleanup: () => this.cleanup(),
    });
  }

  /**
   * Create a new project with the given book data
   */
  createProject(book: Book): VellumProject {
    const project: VellumProject = {
      version: '1.0.0',
      formatVersion: '1.0.0',
      book,
      metadata: {
        lastSaved: new Date().toISOString(),
        autoSaveEnabled: this.autoSaveEnabled,
      },
    };

    this.currentProject = project;
    this.currentFilePath = null;
    this.setUnsavedChanges(true);

    return project;
  }

  /**
   * Update the current project's book data
   */
  updateProject(book: Book): void {
    if (!this.currentProject) {
      throw new Error('No project loaded');
    }

    this.currentProject.book = book;
    this.setUnsavedChanges(true);

    if (this.autoSaveEnabled && this.currentFilePath) {
      this.scheduleAutoSave();
    }
  }

  /**
   * Save the current project to a file
   */
  async saveProject(filePath?: string): Promise<SaveResult> {
    if (!this.currentProject) {
      return { success: false, error: 'No project to save' };
    }

    const targetPath = filePath || this.currentFilePath;

    if (!targetPath) {
      return await this.saveProjectAs();
    }

    try {
      // Check for conflicts if file exists
      if (this.currentFilePath === targetPath && this.lastFileModTime !== null) {
        const conflict = await this.checkForConflict(targetPath);
        if (conflict) {
          this.setSaveStatus('conflict', 'File has been modified externally');
          return {
            success: false,
            error: 'File has been modified externally. Please reload or resolve conflicts.',
          };
        }
      }

      this.setSaveStatus('saving');

      this.currentProject.metadata.lastSaved = new Date().toISOString();
      this.currentProject.metadata.filePath = targetPath;

      const jsonContent = JSON.stringify(this.currentProject, null, 2);

      const result = (await window.electron.invoke('persistence:save', {
        filePath: targetPath,
        content: jsonContent,
      })) as SaveResult;

      if (result.success) {
        this.currentFilePath = targetPath;
        await this.updateFileModTime(targetPath);
        this.setUnsavedChanges(false);
        this.setSaveStatus('saved');
        this.notifySaveListeners(targetPath);

        // Reset to idle after 2 seconds
        setTimeout(() => {
          if (this.saveStatus === 'saved') {
            this.setSaveStatus('idle');
          }
        }, 2000);
      } else {
        this.setSaveStatus('error', result.error);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.setSaveStatus('error', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Save the current project to a new file (with dialog)
   */
  async saveProjectAs(): Promise<SaveResult> {
    if (!this.currentProject) {
      return { success: false, error: 'No project to save' };
    }

    try {
      const result = (await window.electron.invoke('persistence:saveDialog', {
        defaultPath: this.currentFilePath || 'untitled.vellum',
      })) as { canceled: boolean; filePath?: string };

      if (result.canceled || !result.filePath) {
        return { success: false, error: 'Save canceled' };
      }

      return await this.saveProject(result.filePath);
    } catch (error) {
      const appError = this.errorHandler.handleError(
        error,
        {
          userAction: 'Opening save dialog',
        },
        ErrorType.EXPORT_ERROR
      );
      return {
        success: false,
        error: appError.userMessage,
      };
    }
  }

  /**
   * Load a project from file (with dialog)
   */
  async openProject(): Promise<LoadResult> {
    if (this.hasUnsavedChanges) {
      const shouldContinue = await this.confirmUnsavedChanges();
      if (!shouldContinue) {
        return { success: false, error: 'Open canceled' };
      }
    }

    try {
      const result = (await window.electron.invoke(
        'persistence:openDialog'
      )) as { canceled: boolean; filePath?: string };

      if (result.canceled || !result.filePath) {
        return { success: false, error: 'Open canceled' };
      }

      return await this.loadProject(result.filePath);
    } catch (error) {
      const appError = this.errorHandler.handleError(
        error,
        {
          userAction: 'Opening file dialog',
        },
        ErrorType.FILE_NOT_FOUND
      );
      return {
        success: false,
        error: appError.userMessage,
      };
    }
  }

  /**
   * Load a project from a specific file path
   */
  async loadProject(filePath: string): Promise<LoadResult> {
    try {
      const result = (await window.electron.invoke('persistence:load', {
        filePath,
      })) as { success: boolean; content?: string; error?: string };

      if (!result.success || !result.content) {
        return { success: false, error: result.error || 'Failed to load file' };
      }

      const project: VellumProject = JSON.parse(result.content);

      // Validate project structure
      if (!project.book || !project.version) {
        return { success: false, error: 'Invalid .vellum file format' };
      }

      this.currentProject = project;
      this.currentFilePath = filePath;
      await this.updateFileModTime(filePath);
      this.setUnsavedChanges(false);
      this.setSaveStatus('idle');

      return { success: true, project };
    } catch (error) {
      const appError = this.errorHandler.handleError(
        error,
        {
          userAction: 'Loading project',
          filePath,
        },
        error instanceof SyntaxError ? ErrorType.PARSE_ERROR : ErrorType.FILE_NOT_FOUND
      );
      return {
        success: false,
        error: appError.userMessage,
      };
    }
  }

  /**
   * Create a new project (with unsaved changes warning)
   */
  async newProject(book: Book): Promise<boolean> {
    if (this.hasUnsavedChanges) {
      const shouldContinue = await this.confirmUnsavedChanges();
      if (!shouldContinue) {
        return false;
      }
    }

    this.createProject(book);
    return true;
  }

  /**
   * Close the current project (with unsaved changes warning)
   */
  async closeProject(): Promise<boolean> {
    if (this.hasUnsavedChanges) {
      const shouldContinue = await this.confirmUnsavedChanges();
      if (!shouldContinue) {
        return false;
      }
    }

    this.currentProject = null;
    this.currentFilePath = null;
    this.setUnsavedChanges(false);
    return true;
  }

  /**
   * Get current project info
   */
  getProjectInfo(): ProjectInfo {
    return {
      filePath: this.currentFilePath || undefined,
      hasUnsavedChanges: this.hasUnsavedChanges,
      lastSaved: this.currentProject?.metadata.lastSaved
        ? new Date(this.currentProject.metadata.lastSaved)
        : undefined,
      autoSaveEnabled: this.autoSaveEnabled,
      saveStatus: this.saveStatus,
      lastError: this.lastError,
    };
  }

  /**
   * Get the current project
   */
  getCurrentProject(): VellumProject | null {
    return this.currentProject;
  }

  /**
   * Enable or disable auto-save
   */
  setAutoSaveEnabled(enabled: boolean): void {
    this.autoSaveEnabled = enabled;
    if (this.currentProject) {
      this.currentProject.metadata.autoSaveEnabled = enabled;
    }

    if (!enabled && this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * Set auto-save debounce time in milliseconds
   */
  setAutoSaveDebounce(ms: number): void {
    this.autoSaveDebounceMs = ms;
  }

  /**
   * Register a listener for unsaved changes
   */
  onChangeStatusChange(listener: ChangeListener): () => void {
    this.changeListeners.add(listener);
    return () => this.changeListeners.delete(listener);
  }

  /**
   * Register a listener for save events
   */
  onSave(listener: SaveListener): () => void {
    this.saveListeners.add(listener);
    return () => this.saveListeners.delete(listener);
  }

  /**
   * Register a listener for save status changes
   */
  onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  /**
   * Schedule an auto-save with debouncing
   */
  private scheduleAutoSave(): void {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }

    this.autoSaveTimer = setTimeout(() => {
      this.saveProject();
    }, this.autoSaveDebounceMs);
  }

  /**
   * Set unsaved changes flag and notify listeners
   */
  private setUnsavedChanges(hasChanges: boolean): void {
    if (this.hasUnsavedChanges !== hasChanges) {
      this.hasUnsavedChanges = hasChanges;
      this.notifyChangeListeners();
    }
  }

  /**
   * Notify change listeners
   */
  private notifyChangeListeners(): void {
    this.changeListeners.forEach((listener) => {
      listener(this.hasUnsavedChanges);
    });
  }

  /**
   * Notify save listeners
   */
  private notifySaveListeners(filePath: string): void {
    this.saveListeners.forEach((listener) => {
      listener(filePath);
    });
  }

  /**
   * Confirm with user before losing unsaved changes
   */
  private async confirmUnsavedChanges(): Promise<boolean> {
    try {
      const result = (await window.electron.invoke(
        'persistence:confirmUnsavedChanges',
        {
          filePath: this.currentFilePath || 'Untitled',
        }
      )) as { response: number };

      // result.response: 0 = Save, 1 = Don't Save, 2 = Cancel
      if (result.response === 0) {
        // Save
        const saveResult = await this.saveProject();
        return saveResult.success;
      } else if (result.response === 1) {
        // Don't Save
        return true;
      } else {
        // Cancel
        return false;
      }
    } catch (error) {
      this.errorHandler.handleError(error, {
        userAction: 'Confirming unsaved changes',
      });
      return false;
    }
  }

  /**
   * Setup handler for before unload (window close)
   */
  private setupBeforeUnloadHandler(): void {
    this.beforeUnloadHandler = (event: BeforeUnloadEvent) => {
      if (this.hasUnsavedChanges) {
        event.preventDefault();
        // Modern browsers require returnValue to be set
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  }

  /**
   * Cleanup method for memory optimization
   * Clears non-essential data but keeps project state
   */
  private cleanup(): void {
    // Clear auto-save timer
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }

    // Trim listener sets (no actual clearing since they're needed)
    // This is just to ensure no zombie listeners
    console.log(
      `[PersistenceService] Cleanup: ${this.changeListeners.size} change listeners, ` +
      `${this.saveListeners.size} save listeners`
    );
  }

  /**
   * Dispose the persistence service and clean up all resources
   * WARNING: This will clear all project data and listeners
   */
  public dispose(): void {
    // Clear auto-save timer
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }

    // Clear all listeners
    this.changeListeners.clear();
    this.saveListeners.clear();
    this.statusListeners.clear();

    // Remove event listener
    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }

    // Clear project data
    this.currentProject = null;
    this.currentFilePath = null;
    this.hasUnsavedChanges = false;

    // Unregister from memory manager
    memoryManager.unregisterDisposable(this);
    memoryManager.unregisterCleanupHandler('persistence-cleanup');

    console.log('[PersistenceService] Disposed');
  }

  /**
   * Get listener count for debugging/monitoring
   */
  public getListenerCount(): { changeListeners: number; saveListeners: number } {
    return {
      changeListeners: this.changeListeners.size,
      saveListeners: this.saveListeners.size,
    };
  }

  /**
   * Set save status and notify listeners
   */
  private setSaveStatus(status: SaveStatus, error?: string): void {
    this.saveStatus = status;
    this.lastError = error;
    this.notifyStatusListeners();
  }

  /**
   * Notify status listeners
   */
  private notifyStatusListeners(): void {
    this.statusListeners.forEach((listener) => {
      listener(this.saveStatus);
    });
  }

  /**
   * Update the stored file modification time
   */
  private async updateFileModTime(filePath: string): Promise<void> {
    try {
      const stats = (await window.electron.invoke('persistence:getFileStats', {
        filePath,
      })) as { success: boolean; modTime?: number; error?: string };

      if (stats.success && stats.modTime !== undefined) {
        this.lastFileModTime = stats.modTime;
      }
    } catch (error) {
      console.error('Failed to get file modification time:', error);
    }
  }

  /**
   * Check if file has been modified externally
   */
  private async checkForConflict(filePath: string): Promise<boolean> {
    try {
      const stats = (await window.electron.invoke('persistence:getFileStats', {
        filePath,
      })) as { success: boolean; modTime?: number; error?: string };

      if (!stats.success || stats.modTime === undefined) {
        return false;
      }

      // If file modification time has changed since we last saved/loaded
      if (this.lastFileModTime !== null && stats.modTime > this.lastFileModTime) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to check for conflicts:', error);
      return false;
    }
  }
}

// Singleton instance
let persistenceServiceInstance: PersistenceService | null = null;

export function getPersistenceService(): PersistenceService {
  if (!persistenceServiceInstance) {
    persistenceServiceInstance = new PersistenceService();
  }
  return persistenceServiceInstance;
}
