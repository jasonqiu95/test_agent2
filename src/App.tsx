import { useState } from 'react'
import './App.css'
import { WelcomeScreen } from './components/WelcomeScreen'
import { ImportPreviewDialog } from './components/ImportPreviewDialog'
import { PreferencesDialog } from './components/PreferencesDialog'
import { getPersistenceService } from './services/persistence'
import { getRecentProjectsService } from './services/recentProjects'
import type { Book } from './types/book'

type AppView = 'welcome' | 'editor'

function App() {
  const [currentView, setCurrentView] = useState<AppView>('welcome')
  const [currentBook, setCurrentBook] = useState<Book | null>(null)
  const [currentFilePath, setCurrentFilePath] = useState<string>('')
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)

  const handleProjectOpen = (book: Book, filePath: string) => {
    setCurrentBook(book)
    setCurrentFilePath(filePath)
    setCurrentView('editor')

    // Add to recent projects if it has a file path
    if (filePath) {
      const recentProjectsService = getRecentProjectsService()
      recentProjectsService.addRecentProject({
        id: book.id,
        filePath,
        title: book.title,
        authors: book.authors.map(a => a.name),
        status: book.status,
        wordCount: book.wordCount,
        thumbnail: '📄',
      })
    }
  }

  const handleNewProject = () => {
    // Create a blank book
    const now = new Date()
    const newBook: Book = {
      id: `book-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
      title: 'Untitled',
      authors: [],
      frontMatter: [],
      chapters: [],
      backMatter: [],
      styles: [],
      metadata: {
        createdAt: now,
        updatedAt: now,
      },
      status: 'draft',
    }

    const persistenceService = getPersistenceService()
    persistenceService.createProject(newBook)
    handleProjectOpen(newBook, '')
  }

  const handleImportProject = () => {
    setShowImportDialog(true)
  }

  const handleBackToWelcome = () => {
    setCurrentView('welcome')
    setCurrentBook(null)
    setCurrentFilePath('')
  }

  return (
    <div className="app">
      {currentView === 'welcome' ? (
        <WelcomeScreen
          onProjectOpen={handleProjectOpen}
          onNewProject={handleNewProject}
          onImportProject={handleImportProject}
        />
      ) : (
        <div className="editor-view">
          <header className="editor-header">
            <button onClick={handleBackToWelcome} className="back-button">
              ← Back to Welcome
            </button>
            <h1 className="editor-title">
              {currentBook?.title || 'Untitled'}
            </h1>
            <div className="editor-info">
              {currentFilePath && (
                <span className="file-path">{currentFilePath}</span>
              )}
            </div>
          </header>
          <main className="editor-main">
            <div className="editor-placeholder">
              <h2>Editor View</h2>
              <p>Book: {currentBook?.title}</p>
              <p>Chapters: {currentBook?.chapters.length || 0}</p>
              <p>Authors: {currentBook?.authors.map(a => a.name).join(', ') || 'None'}</p>
              <p className="editor-note">
                This is a placeholder. The full editor implementation would go here.
              </p>
            </div>
          </main>
        </div>
      )}

      {showImportDialog && (
        <div className="import-dialog-overlay">
          <div className="import-dialog-content">
            <h2>Import Document</h2>
            <p>Document import functionality will be integrated here.</p>
            <button onClick={() => setShowImportDialog(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      <PreferencesDialog
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
      />
    </div>
  )
}

export default App
