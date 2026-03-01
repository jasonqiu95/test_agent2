import { useState, useEffect, useCallback } from 'react'
import { getPersistenceService, SaveStatus } from '../services/persistence'
import type { ProjectInfo, VellumProject } from '../services/persistence'
import type { Book } from '../types/book'

export interface UsePersistenceOptions {
  onSave?: (filePath: string) => void
  onChange?: (hasChanges: boolean) => void
}

export interface UsePersistenceReturn {
  currentProject: {
    fileName: string | null
    filePath: string | null
    data: VellumProject | null
  }
  hasUnsavedChanges: boolean
  isAutoSaveEnabled: boolean
  saveStatus: SaveStatus
  lastError?: string
  save: (book: Book) => Promise<{
    success: boolean
    fileName?: string
    error?: string
    canceled?: boolean
  }>
  saveAs: (book: Book) => Promise<{
    success: boolean
    fileName?: string
    error?: string
    canceled?: boolean
  }>
  load: () => Promise<{
    success: boolean
    data?: VellumProject
    fileName?: string
    error?: string
    canceled?: boolean
  }>
  newProject: () => Promise<{
    success: boolean
    needsSave: boolean
  }>
  markModified: (book: Book) => void
  setAutoSaveEnabled: (enabled: boolean) => void
}

export function usePersistence(
  options: UsePersistenceOptions = {}
): UsePersistenceReturn {
  const persistence = getPersistenceService()
  const [projectInfo, setProjectInfo] = useState<ProjectInfo>(
    persistence.getProjectInfo()
  )
  const [currentProject, setCurrentProject] = useState<VellumProject | null>(
    persistence.getCurrentProject()
  )

  // Update project info when changes occur
  useEffect(() => {
    const unsubscribeChange = persistence.onChangeStatusChange((hasChanges) => {
      setProjectInfo(persistence.getProjectInfo())
      setCurrentProject(persistence.getCurrentProject())
      options.onChange?.(hasChanges)
    })

    return unsubscribeChange
  }, [persistence, options])

  // Update current project on save
  useEffect(() => {
    const unsubscribeSave = persistence.onSave((filePath) => {
      setProjectInfo(persistence.getProjectInfo())
      setCurrentProject(persistence.getCurrentProject())
      options.onSave?.(filePath)
    })

    return unsubscribeSave
  }, [persistence, options])

  // Update project info on save status changes
  useEffect(() => {
    const unsubscribeStatus = persistence.onStatusChange(() => {
      setProjectInfo(persistence.getProjectInfo())
    })

    return unsubscribeStatus
  }, [persistence])

  const save = useCallback(
    async (book: Book) => {
      const currentProj = persistence.getCurrentProject()
      if (currentProj) {
        persistence.updateProject(book)
      } else {
        persistence.createProject(book)
      }

      const result = await persistence.saveProject()
      setProjectInfo(persistence.getProjectInfo())
      setCurrentProject(persistence.getCurrentProject())

      return {
        success: result.success,
        fileName: result.filePath ? result.filePath.split('/').pop() : undefined,
        error: result.error,
        canceled: !result.success && !result.error,
      }
    },
    [persistence]
  )

  const saveAs = useCallback(
    async (book: Book) => {
      const currentProj = persistence.getCurrentProject()
      if (currentProj) {
        persistence.updateProject(book)
      } else {
        persistence.createProject(book)
      }

      const result = await persistence.saveProjectAs()
      setProjectInfo(persistence.getProjectInfo())
      setCurrentProject(persistence.getCurrentProject())

      return {
        success: result.success,
        fileName: result.filePath ? result.filePath.split('/').pop() : undefined,
        error: result.error,
        canceled: !result.success && !result.error,
      }
    },
    [persistence]
  )

  const load = useCallback(async () => {
    const result = await persistence.openProject()
    setProjectInfo(persistence.getProjectInfo())
    setCurrentProject(result.project || null)

    return {
      success: result.success,
      data: result.project,
      fileName: result.project
        ? persistence.getProjectInfo().filePath?.split('/').pop()
        : undefined,
      error: result.error,
      canceled: !result.success && !result.error,
    }
  }, [persistence])

  const newProject = useCallback(async () => {
    const hasChanges = persistence.getProjectInfo().hasUnsavedChanges

    if (hasChanges) {
      return { success: false, needsSave: true }
    }

    return { success: true, needsSave: false }
  }, [persistence])

  const markModified = useCallback(
    (book: Book) => {
      const currentProj = persistence.getCurrentProject()
      if (currentProj) {
        persistence.updateProject(book)
      } else {
        persistence.createProject(book)
      }
      setProjectInfo(persistence.getProjectInfo())
      setCurrentProject(persistence.getCurrentProject())
    },
    [persistence]
  )

  const setAutoSaveEnabled = useCallback(
    (enabled: boolean) => {
      persistence.setAutoSaveEnabled(enabled)
      setProjectInfo(persistence.getProjectInfo())
    },
    [persistence]
  )

  return {
    currentProject: {
      fileName: projectInfo.filePath?.split('/').pop() || null,
      filePath: projectInfo.filePath || null,
      data: currentProject,
    },
    hasUnsavedChanges: projectInfo.hasUnsavedChanges,
    isAutoSaveEnabled: projectInfo.autoSaveEnabled,
    saveStatus: projectInfo.saveStatus,
    lastError: projectInfo.lastError,
    save,
    saveAs,
    load,
    newProject,
    markModified,
    setAutoSaveEnabled,
  }
}
