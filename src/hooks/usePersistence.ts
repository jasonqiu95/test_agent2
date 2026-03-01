import { useState, useEffect, useCallback } from 'react'
import { getPersistenceService } from '../services/persistence'
import type { ProjectInfo, VellumProject } from '../services/persistence'
import type { Book } from '../types/book'

export interface UsePersistenceReturn {
  projectInfo: ProjectInfo
  currentProject: VellumProject | null
  saveProject: () => Promise<boolean>
  saveProjectAs: () => Promise<boolean>
  openProject: () => Promise<VellumProject | null>
  newProject: (book: Book) => Promise<boolean>
  closeProject: () => Promise<boolean>
  updateProject: (book: Book) => void
  setAutoSaveEnabled: (enabled: boolean) => void
}

export function usePersistence(): UsePersistenceReturn {
  const persistence = getPersistenceService()
  const [projectInfo, setProjectInfo] = useState<ProjectInfo>(
    persistence.getProjectInfo()
  )
  const [currentProject, setCurrentProject] = useState<VellumProject | null>(
    persistence.getCurrentProject()
  )

  // Update project info when changes occur
  useEffect(() => {
    const unsubscribe = persistence.onChangeStatusChange(() => {
      setProjectInfo(persistence.getProjectInfo())
    })

    return unsubscribe
  }, [persistence])

  // Update current project on save
  useEffect(() => {
    const unsubscribe = persistence.onSave(() => {
      setProjectInfo(persistence.getProjectInfo())
      setCurrentProject(persistence.getCurrentProject())
    })

    return unsubscribe
  }, [persistence])

  const saveProject = useCallback(async (): Promise<boolean> => {
    const result = await persistence.saveProject()
    if (result.success) {
      setProjectInfo(persistence.getProjectInfo())
      setCurrentProject(persistence.getCurrentProject())
    }
    return result.success
  }, [persistence])

  const saveProjectAs = useCallback(async (): Promise<boolean> => {
    const result = await persistence.saveProjectAs()
    if (result.success) {
      setProjectInfo(persistence.getProjectInfo())
      setCurrentProject(persistence.getCurrentProject())
    }
    return result.success
  }, [persistence])

  const openProject = useCallback(async (): Promise<VellumProject | null> => {
    const result = await persistence.openProject()
    if (result.success && result.project) {
      setProjectInfo(persistence.getProjectInfo())
      setCurrentProject(result.project)
      return result.project
    }
    return null
  }, [persistence])

  const newProject = useCallback(
    async (book: Book): Promise<boolean> => {
      const success = await persistence.newProject(book)
      if (success) {
        setProjectInfo(persistence.getProjectInfo())
        setCurrentProject(persistence.getCurrentProject())
      }
      return success
    },
    [persistence]
  )

  const closeProject = useCallback(async (): Promise<boolean> => {
    const success = await persistence.closeProject()
    if (success) {
      setProjectInfo(persistence.getProjectInfo())
      setCurrentProject(null)
    }
    return success
  }, [persistence])

  const updateProject = useCallback(
    (book: Book): void => {
      persistence.updateProject(book)
      setProjectInfo(persistence.getProjectInfo())
      setCurrentProject(persistence.getCurrentProject())
    },
    [persistence]
  )

  const setAutoSaveEnabled = useCallback(
    (enabled: boolean): void => {
      persistence.setAutoSaveEnabled(enabled)
      setProjectInfo(persistence.getProjectInfo())
    },
    [persistence]
  )

  return {
    projectInfo,
    currentProject,
    saveProject,
    saveProjectAs,
    openProject,
    newProject,
    closeProject,
    updateProject,
    setAutoSaveEnabled,
  }
}
