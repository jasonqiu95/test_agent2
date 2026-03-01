import { useState } from 'react';
import { useMenuActions, menuAPI } from '../hooks/useMenuActions';

/**
 * Example component demonstrating menu integration
 * This shows how to connect menu actions to your app's state
 */
export function AppWithMenu() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isSidebarVisible, setSidebarVisible] = useState(true);
  const [isPropertiesVisible, setPropertiesVisible] = useState(true);
  const [isOutlineVisible, setOutlineVisible] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState('paragraph');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  // Connect menu actions to state management
  useMenuActions({
    // File menu handlers
    onNew: () => {
      console.log('New file');
      // Implement new file logic or dispatch Redux action
    },
    onOpen: () => {
      console.log('Open file');
      // Implement open file logic or dispatch Redux action
    },
    onSave: () => {
      console.log('Save file');
      // Implement save file logic or dispatch Redux action
    },
    onSaveAs: () => {
      console.log('Save as file');
      // Implement save as logic or dispatch Redux action
    },
    onExport: (format) => {
      console.log(`Export as ${format}`);
      menuAPI.export(format).then((result) => {
        if (!result.canceled) {
          console.log(`Exporting to ${result.filePath}`);
          // Implement export logic
        }
      });
    },
    onClose: () => {
      console.log('Close file');
      // Implement close file logic or dispatch Redux action
    },

    // Edit menu handlers
    onUndo: () => {
      console.log('Undo');
      // Implement undo logic or dispatch Redux action
    },
    onRedo: () => {
      console.log('Redo');
      // Implement redo logic or dispatch Redux action
    },
    onFind: () => {
      console.log('Find');
      // Show find dialog or dispatch Redux action
    },
    onReplace: () => {
      console.log('Replace');
      // Show replace dialog or dispatch Redux action
    },

    // View menu handlers
    onToggleSidebar: () => {
      setSidebarVisible((prev) => !prev);
      console.log('Toggle sidebar');
    },
    onToggleProperties: () => {
      setPropertiesVisible((prev) => !prev);
      console.log('Toggle properties');
    },
    onToggleOutline: () => {
      setOutlineVisible((prev) => !prev);
      console.log('Toggle outline');
    },
    onZoomIn: () => {
      setZoomLevel((prev) => Math.min(prev + 10, 300));
      menuAPI.zoom('in');
    },
    onZoomOut: () => {
      setZoomLevel((prev) => Math.max(prev - 10, 50));
      menuAPI.zoom('out');
    },
    onResetZoom: () => {
      setZoomLevel(100);
      menuAPI.zoom('reset');
    },
    onThemeChange: (newTheme) => {
      setTheme(newTheme);
      console.log(`Theme changed to ${newTheme}`);
      // Dispatch Redux action or update theme context
    },

    // Format menu handlers
    onBold: () => {
      console.log('Toggle bold');
      // Dispatch Redux action to toggle bold formatting
    },
    onItalic: () => {
      console.log('Toggle italic');
      // Dispatch Redux action to toggle italic formatting
    },
    onUnderline: () => {
      console.log('Toggle underline');
      // Dispatch Redux action to toggle underline formatting
    },
    onStrikethrough: () => {
      console.log('Toggle strikethrough');
      // Dispatch Redux action to toggle strikethrough formatting
    },
    onAlign: (alignment) => {
      console.log(`Align ${alignment}`);
      // Dispatch Redux action to change text alignment
    },
    onStyle: (style) => {
      setSelectedStyle(style);
      console.log(`Style changed to ${style}`);
      // Dispatch Redux action to change text style
    },
    onClearFormatting: () => {
      console.log('Clear formatting');
      // Dispatch Redux action to clear text formatting
    },

    // Help menu handlers
    onShowShortcuts: () => {
      setShowShortcuts(true);
      console.log('Show shortcuts');
    },
    onShowAbout: () => {
      setShowAbout(true);
      menuAPI.showAbout();
    },
  });

  return (
    <div className="app" data-theme={theme}>
      <div className="app-layout">
        {isSidebarVisible && (
          <aside className="sidebar">
            <h3>Sidebar</h3>
            <p>Sidebar content</p>
          </aside>
        )}

        <main className="main-content">
          <h1>Menu Integration Example</h1>

          <div className="status">
            <p>Theme: {theme}</p>
            <p>Zoom: {zoomLevel}%</p>
            <p>Style: {selectedStyle}</p>
          </div>

          <div className="panels">
            <p>Sidebar: {isSidebarVisible ? 'Visible' : 'Hidden'}</p>
            <p>Properties: {isPropertiesVisible ? 'Visible' : 'Hidden'}</p>
            <p>Outline: {isOutlineVisible ? 'Visible' : 'Hidden'}</p>
          </div>

          <div className="instructions">
            <h2>Try the Menu</h2>
            <p>Use the application menu bar to:</p>
            <ul>
              <li>Create, open, save files (File menu)</li>
              <li>Undo, redo, find, replace (Edit menu)</li>
              <li>Toggle panels, change zoom, switch theme (View menu)</li>
              <li>Format text with bold, italic, styles (Format menu)</li>
              <li>View shortcuts and about info (Help menu)</li>
            </ul>
          </div>
        </main>

        {isPropertiesVisible && (
          <aside className="properties">
            <h3>Properties</h3>
            <p>Properties panel</p>
          </aside>
        )}
      </div>

      {showShortcuts && (
        <div className="modal" onClick={() => setShowShortcuts(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Keyboard Shortcuts</h2>
            <p>See the Help menu for all shortcuts</p>
            <button onClick={() => setShowShortcuts(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppWithMenu;
