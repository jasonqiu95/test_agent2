import { useEffect } from 'react'

export interface UnsavedChangesWarningProps {
  hasUnsavedChanges: boolean
}

/**
 * Component that shows a warning when closing the window with unsaved changes
 * This is handled by the beforeunload event in the persistence service,
 * but this component can be used to show an in-app warning as well
 */
export function UnsavedChangesWarning({
  hasUnsavedChanges,
}: UnsavedChangesWarningProps) {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // This component doesn't render anything, it just handles the beforeunload event
  return null
}
