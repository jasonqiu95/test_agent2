import { useState } from 'react'
import { Provider } from 'react-redux'
import { store } from './store'
import { useUndoRedo } from './hooks/useUndoRedo'
import UndoRedoStatus from './components/UndoRedoStatus'
import './App.css'

function AppContent() {
  const [count, setCount] = useState(0)
  useUndoRedo() // Enable keyboard shortcuts

  return (
    <div className="app">
      <header className="app-header">
        <h1>Electron + React + TypeScript + Vite</h1>
        <UndoRedoStatus />
        <div className="card">
          <button onClick={() => setCount((count) => count + 1)}>
            Count is {count}
          </button>
          <p>Edit <code>src/App.tsx</code> and save to test HMR</p>
        </div>
        <p className="info">
          Click on the Electron, Vite, and React logos to learn more
        </p>
      </header>
    </div>
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
