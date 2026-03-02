import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { getPersistenceService } from './services/persistence'
import './index.css'

// Get persistence service for state preservation
const persistenceService = getPersistenceService();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ErrorBoundary
        level="app"
        preserveState={() => {
          // Preserve current project state on crash
          const project = persistenceService.getCurrentProject();
          return project;
        }}
        onError={(error) => {
          console.error('[App] Caught error at app level:', error);
        }}
      >
        <App />
      </ErrorBoundary>
    </Provider>
  </React.StrictMode>
)
