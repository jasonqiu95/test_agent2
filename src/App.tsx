import { useState, useEffect } from 'react'
import { Provider } from 'react-redux'
import { DndContext, DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core'
import { store } from './store'
import { useUndoRedo } from './hooks/useUndoRedo'
import { usePdfGeneration } from './hooks/usePdfGeneration'
import { useEpubGeneration } from './hooks/useEpubGeneration'
import UndoRedoStatus from './components/UndoRedoStatus'
import './App.css'
import { WelcomeScreen } from './components/WelcomeScreen'
import { ImportPreviewDialog } from './components/ImportPreviewDialog'
import { PreferencesDialog } from './components/PreferencesDialog'
import { GenerationProgressModal } from './components/GenerationProgressModal/GenerationProgressModal'
import { getPersistenceService } from './services/persistence'
import { getRecentProjectsService } from './services/recentProjects'
import { formatFileSize } from './services/epub-generation'
import type { Book } from './types/book'

type AppView = 'welcome' | 'editor'

function AppContent() {
  const [currentView, setCurrentView] = useState<AppView>('welcome')
  const [currentBook, setCurrentBook] = useState<Book | null>(null)
  const [currentFilePath, setCurrentFilePath] = useState<string>('')
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)

  // Enable undo/redo keyboard shortcuts
  useUndoRedo()

  // PDF generation hook
  const {
    state: pdfState,
    startGeneration,
    cancelGeneration,
    reset: resetPdfGeneration,
    saveGeneratedFile,
  } = usePdfGeneration()

  // EPUB generation hook
  const {
    state: epubState,
    progress: epubProgress,
    error: epubError,
    result: epubResult,
    isGenerating,
    generate: generateEpub,
    cancel: cancelEpub,
    reset: resetEpub,
    saveFile: saveEpubFile,
  } = useEpubGeneration()

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

  const handleExportPdf = async () => {
    if (!currentBook) {
      console.error('No book to export')
      return
    }

    try {
      await startGeneration({
        book: currentBook,
        styles: currentBook.styles,
        images: [],
        options: {
          format: 'pdf',
          quality: 'standard',
          includeMetadata: true,
          includeToc: true,
          pdf: {
            trimSize: '6x9',
            margins: {
              top: 0.75,
              bottom: 0.75,
              inside: 0.75,
              outside: 0.5,
            },
            includeHeaders: false,
            includePageNumbers: true,
            pageNumberConfig: {
              enabled: true,
              position: 'bottom',
              alignment: 'center',
              startNumber: 1,
            },
            compress: true,
          },
        },
      })
    } catch (error) {
      console.error('Failed to start PDF generation:', error)
    }
  }

  const handlePdfModalClose = () => {
    if (pdfState.isComplete) {
      // Auto-save if complete
      saveGeneratedFile()
        .then(() => {
          console.log('PDF saved successfully')
          resetPdfGeneration()
        })
        .catch((error) => {
          console.error('Failed to save PDF:', error)
        })
    } else if (pdfState.isGenerating) {
      // Cancel if still generating
      cancelGeneration('User closed modal')
    } else {
      // Just close if error or cancelled
      resetPdfGeneration()
    }
  }

  // Drag and drop event handlers
  const handleDragStart = (event: DragStartEvent) => {
    console.log('Drag started:', event)
    // Additional drag start logic will be implemented by specific components
  }

  const handleDragOver = (event: DragOverEvent) => {
    // Handle drag over events for drop zone highlighting
    // This will be implemented by specific components
  }

  const handleDragEnd = (event: DragEndEvent) => {
    console.log('Drag ended:', event)
    // Handle reordering logic here
    // This will be implemented by specific components
  }

  // Handle EPUB export
  const handleExportEpub = async () => {
    if (!currentBook) {
      alert('No book loaded')
      return
    }

    try {
      // Generate EPUB with current book data
      // Using empty arrays for styles and images for now
      await generateEpub(currentBook, [], [])
    } catch (error) {
      console.error('Failed to start EPUB generation:', error)
      alert('Failed to start EPUB generation: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  // Handle EPUB generation completion - auto-save file
  useEffect(() => {
    if (epubState === 'completed' && epubResult) {
      saveEpubFile()
        .then(() => {
          console.log('EPUB file saved successfully')
          alert(`EPUB generated successfully!\n\nFile: ${epubResult.fileName}\nSize: ${formatFileSize(epubResult.fileSize)}`)
          resetEpub()
        })
        .catch((error) => {
          console.error('Failed to save EPUB file:', error)
          alert('Failed to save EPUB file: ' + (error instanceof Error ? error.message : 'Unknown error'))
        })
    }
  }, [epubState, epubResult, saveEpubFile, resetEpub])

  // Handle EPUB generation error
  useEffect(() => {
    if (epubState === 'error' && epubError) {
      console.error('EPUB generation error:', epubError)
      alert(`EPUB generation failed:\n\n${epubError.message}${epubError.details ? '\n\n' + epubError.details : ''}`)
      resetEpub()
    }
  }, [epubState, epubError, resetEpub])

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
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
              <UndoRedoStatus />
              <div className="editor-info">
                {currentFilePath && (
                  <span className="file-path">{currentFilePath}</span>
                )}
                <button
                  onClick={handleExportPdf}
                  className="export-pdf-button"
                  disabled={!currentBook || pdfState.isGenerating}
                >
                  {pdfState.isGenerating ? 'Generating...' : 'Export PDF'}
                </button>
                <button
                  onClick={handleExportEpub}
                  className="export-button"
                  disabled={isGenerating || !currentBook}
                >
                  {isGenerating ? 'Exporting...' : 'Export EPUB'}
                </button>
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

        <GenerationProgressModal
          isOpen={pdfState.isGenerating || pdfState.isComplete || pdfState.isCancelled || !!pdfState.error}
          onCancel={handlePdfModalClose}
          progress={pdfState.progress}
          status={pdfState.error || pdfState.status}
          generationType="PDF"
          title={pdfState.isComplete ? 'PDF Complete' : pdfState.error ? 'PDF Generation Failed' : undefined}
        />

        <GenerationProgressModal
          isOpen={isGenerating}
          onCancel={() => cancelEpub('User cancelled')}
          progress={epubProgress?.percentage || 0}
          status={epubProgress?.status || 'Initializing...'}
          generationType="EPUB"
        />
      </div>
    </DndContext>
  )
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  )
}

export default App
