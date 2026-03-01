import { useState } from 'react';
import { PreferencesDialog } from './components/PreferencesDialog';
import './App.css';

function App() {
  const [count, setCount] = useState(0);
  const [showPreferences, setShowPreferences] = useState(false);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Electron + React + TypeScript + Vite</h1>
        <div className="card">
          <button onClick={() => setCount((count) => count + 1)}>
            Count is {count}
          </button>
          <button onClick={() => setShowPreferences(true)} style={{ marginLeft: '10px' }}>
            Open Preferences
          </button>
          <p>Edit <code>src/App.tsx</code> and save to test HMR</p>
        </div>
        <p className="info">
          Click on the Electron, Vite, and React logos to learn more
        </p>
      </header>

      <PreferencesDialog
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
      />
    </div>
  );
}

export default App;
