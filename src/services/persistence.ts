/**
 * Project persistence service for .vellum file format
 */

import { Book } from '../types/book';
import { getErrorHandler, ErrorType } from '../utils/errorHandler';

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

export interface ProjectInfo {
  filePath?: string;
  hasUnsavedChanges: boolean;
  lastSaved?: Date;
  autoSaveEnabled: boolean;
}

type ChangeListener = (hasChanges: boolean) => void;
type SaveListener = (filePath: string) => void;

export class PersistenceService {
  private currentProject: VellumProject | null = null;
  private currentFilePath: string | null = null;
  private hasUnsavedChanges: boolean = false;
  private autoSaveEnabled: boolean = true;
  private autoSaveDebounceMs: number = 2000;
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private changeListeners: Set<ChangeListener> = new Set();
  private saveListeners: Set<SaveListener> = new Set();
  private errorHandler = getErrorHandler();

  constructor() {
    this.setupBeforeUnloadHandler();
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
      this.currentProject.metadata.lastSaved = new Date().toISOString();
      this.currentProject.metadata.filePath = targetPath;

      const jsonContent = JSON.stringify(this.currentProject, null, 2);

      const result = (await window.electron.invoke('persistence:save', {
        filePath: targetPath,
        content: jsonContent,
      })) as SaveResult;

      if (result.success) {
        this.currentFilePath = targetPath;
        this.setUnsavedChanges(false);
        this.notifySaveListeners(targetPath);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
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
      this.setUnsavedChanges(false);

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
    window.addEventListener('beforeunload', (event) => {
      if (this.hasUnsavedChanges) {
        event.preventDefault();
        // Modern browsers require returnValue to be set
        event.returnValue = '';
      }
    });
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
