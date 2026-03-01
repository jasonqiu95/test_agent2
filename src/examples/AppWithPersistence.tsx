import { useState, useEffect } from 'react'
import { usePersistence } from '../hooks/usePersistence'
import { UnsavedChangesWarning } from '../components/UnsavedChangesWarning'
import { Book } from '../types/book'
import { createBook, createAuthor } from '../models/factories'

export function AppWithPersistence() {
  const [book, setBook] = useState<Book>(() =>
    createBook('Untitled Book', [createAuthor('Anonymous')])
  )

  const {
    projectInfo,
    currentProject,
    saveProject,
    saveProjectAs,
    openProject,
    newProject,
    updateProject,
    setAutoSaveEnabled,
  } = usePersistence()

  useEffect(() => {
    if (currentProject) {
      setBook(currentProject.book as Book)
    }
  }, [currentProject])

  const handleBookChange = (updatedBook: Book) => {
    setBook(updatedBook)
    updateProject(updatedBook)
  }

  const handleSave = async () => {
    const success = await saveProject()
    if (success) {
      alert('Project saved successfully')
    } else {
      alert('Failed to save project')
    }
  }

  const handleSaveAs = async () => {
    const success = await saveProjectAs()
    if (success) {
      alert('Project saved successfully')
    } else {
      alert('Failed to save project')
    }
  }

  const handleOpen = async () => {
    const project = await openProject()
    if (project) {
      alert('Project loaded successfully')
    }
  }

  const handleNew = async () => {
    const newBook = createBook('Untitled Book', [createAuthor('Anonymous')])
    const success = await newProject(newBook)
    if (success) {
      setBook(newBook)
      alert('New project created')
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <UnsavedChangesWarning hasUnsavedChanges={projectInfo.hasUnsavedChanges} />

      <h1>Vellum Project Persistence Demo</h1>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={handleNew}>New Project</button>
        <button onClick={handleOpen}>Open Project</button>
        <button onClick={handleSave} disabled={!projectInfo.filePath}>
          Save
        </button>
        <button onClick={handleSaveAs}>Save As...</button>
        <button onClick={() => setAutoSaveEnabled(!projectInfo.autoSaveEnabled)}>
          Auto-save: {projectInfo.autoSaveEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa' }}>
        <h3>Project Info</h3>
        <p>File: {projectInfo.filePath || 'Untitled'}</p>
        <p>Status: {projectInfo.hasUnsavedChanges ? 'Unsaved changes' : 'Saved'}</p>
        <p>Auto-save: {projectInfo.autoSaveEnabled ? 'Enabled' : 'Disabled'}</p>
      </div>

      <div style={{ padding: '15px', backgroundColor: '#fff' }}>
        <h3>Edit Book</h3>
        <div style={{ marginBottom: '10px' }}>
          <label>Title:</label>
          <input
            type="text"
            value={book.title}
            onChange={(e) => handleBookChange({ ...book, title: e.target.value })}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Subtitle:</label>
          <input
            type="text"
            value={book.subtitle || ''}
            onChange={(e) => handleBookChange({ ...book, subtitle: e.target.value })}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
      </div>
    </div>
  )
}
