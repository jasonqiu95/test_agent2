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
    currentProject,
    hasUnsavedChanges,
    isAutoSaveEnabled,
    save,
    saveAs,
    load,
    newProject,
    markModified,
    setAutoSaveEnabled,
  } = usePersistence({
    onSave: (filePath: string) => {
      console.log('Project saved to:', filePath)
    },
    onChange: () => {
      console.log('Project modified')
    },
  })

  useEffect(() => {
    if (currentProject.data) {
      setBook(currentProject.data.book as Book)
    }
  }, [currentProject.data])

  const handleBookChange = (updatedBook: Book) => {
    setBook(updatedBook)
    markModified(updatedBook)
  }

  const handleSave = async () => {
    const result = await save(book)
    if (result.success) {
      alert(`Project saved successfully to ${result.fileName}`)
    } else if (!result.canceled) {
      alert(`Failed to save: ${result.error}`)
    }
  }

  const handleSaveAs = async () => {
    const result = await saveAs(book)
    if (result.success) {
      alert(`Project saved as ${result.fileName}`)
    } else if (!result.canceled) {
      alert(`Failed to save: ${result.error}`)
    }
  }

  const handleLoad = async () => {
    const result = await load()
    if (result.success && result.data) {
      setBook(result.data.book as Book)
      alert(`Project loaded from ${result.fileName}`)
    } else if (!result.canceled) {
      alert(`Failed to load: ${result.error}`)
    }
  }

  const handleNew = async () => {
    const result = await newProject()
    if (result.needsSave) {
      const saveFirst = window.confirm('Save current project first?')
      if (saveFirst) {
        await handleSave()
      }
      await newProject()
    }
    if (result.success) {
      setBook(createBook('Untitled Book', [createAuthor('Anonymous')]))
      alert('New project created')
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <UnsavedChangesWarning
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={handleSave}
        onDiscard={() => console.log('Changes discarded')}
      />

      <h1>Vellum Project Persistence Demo</h1>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={handleNew}>New Project</button>
        <button onClick={handleLoad}>Open Project</button>
        <button onClick={handleSave} disabled={!currentProject.filePath}>
          Save
        </button>
        <button onClick={handleSaveAs}>Save As...</button>
        <button onClick={() => setAutoSaveEnabled(!isAutoSaveEnabled)}>
          Auto-save: {isAutoSaveEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa' }}>
        <h3>Project Info</h3>
        <p>File: {currentProject.fileName || 'Untitled'}</p>
        <p>Path: {currentProject.filePath || 'Not saved'}</p>
        <p>Status: {hasUnsavedChanges ? 'Unsaved changes' : 'Saved'}</p>
        <p>Auto-save: {isAutoSaveEnabled ? 'Enabled (3s delay)' : 'Disabled'}</p>
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
