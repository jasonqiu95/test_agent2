# Electron Book Publishing Application

A modern Electron application for book publishing built with React, TypeScript, and Vite. Features comprehensive data models for book publishing and a global keyboard shortcuts system.

## Features

### Core Data Models
- **Comprehensive Type Definitions**: TypeScript interfaces for all book components
- **Factory Functions**: Easy creation of model instances with sensible defaults
- **Helper Utilities**: Functions for word counting, sorting, filtering, and more
- **Metadata Support**: Built-in metadata tracking for all entities

### Keyboard Shortcuts System
- ⌨️ Global keyboard shortcuts with customizable actions
- 🖥️ Cross-platform support (Cmd on Mac, Ctrl on Windows)
- 📋 Built-in shortcuts cheat sheet dialog
- ♿ Accessible and keyboard-friendly
- 🎨 Dark mode support
- 🔧 Fully customizable and extensible

### Project Persistence
- 💾 Save/Load projects in `.vellum` format (JSON-based)
- 🔄 Auto-save with 3-second debouncing
- ⚠️ Unsaved changes warnings
- 📂 Native file dialogs (Open/Save/Save As)
- 🔐 Secure IPC communication between renderer and main process
- 📝 Project metadata tracking

### Electron Application
- ⚡ Vite for fast development and building
- ⚛️ React 18 with TypeScript
- 🔧 ESLint and Prettier configured
- 📦 electron-builder for packaging
- 🎨 Modern UI with CSS
- 🔄 Hot Module Replacement (HMR)
- 🏗️ Separate dev and production modes

## Implemented Shortcuts

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Cmd/Ctrl + S` | Save | Save current work |
| `Cmd/Ctrl + E` | Export | Export content |
| `Cmd/Ctrl + N` | New Chapter | Create new chapter |
| `Cmd/Ctrl + T` | Toggle Style Browser | Show/hide style browser |
| `Cmd/Ctrl + P` | Toggle Preview | Show/hide preview |
| `Cmd/Ctrl + F` | Find | Open find dialog |
| `Cmd/Ctrl + /` | Shortcuts Cheat Sheet | Show keyboard shortcuts dialog |

## Types

### Book
Main book structure containing:
- Title, subtitle, authors
- Front matter (title page, copyright, dedication, etc.)
- Chapters
- Back matter (appendix, glossary, index, etc.)
- Styles and metadata

### Chapter
Chapter structure with:
- Title, subtitle, number
- Content (text blocks)
- Epigraph support
- Word count tracking
- Part/section organization

### Element
Front and back matter elements including:
- Title page
- Copyright
- Dedication
- Foreword, Preface, Introduction
- Epilogue, Afterword
- Appendix, Glossary, Bibliography, Index

### TextBlock
Structured text content with:
- Content and block type (paragraph, heading, code, etc.)
- Style references
- Embedded text features
- Location tracking

### TextFeature
Inline text features:
- **Subhead**: Section subheadings with levels
- **Break**: Line, section, page, or scene breaks
- **Quote**: Block quotes, inline quotes, epigraphs
- **Verse**: Poetry with line and stanza support
- **List**: Ordered, unordered, and definition lists
- **Link**: Hyperlinks with targets and relations
- **Note**: Footnotes, endnotes, sidenotes

### Style
Text formatting and styling:
- Font properties (family, size, weight, style)
- Text alignment and decoration
- Colors and backgrounds
- Spacing and borders
- Custom properties

## Project Structure

```
.
├── electron/          # Electron main process
│   ├── main.ts       # Main process entry
│   └── preload.ts    # Preload script
├── src/              # React application
│   ├── App.tsx       # Main App component
│   ├── App.css       # App styles
│   ├── main.tsx      # React entry point
│   └── index.css     # Global styles
├── public/           # Static assets
├── build/            # Build resources
├── dist/             # Compiled React app
├── dist-electron/    # Compiled Electron files
└── release/          # Built installers
```

## Usage

### Creating a Book

```typescript
import { createBook, createAuthor, createChapter } from './models';

const author = createAuthor('Jane Doe', { bio: 'Award-winning author' });
const book = createBook('My Great Novel', [author]);

const chapter1 = createChapter('The Beginning', {
  number: 1,
  content: [
    createTextBlock('It was a dark and stormy night...'),
  ],
});

book.chapters.push(chapter1);
```

### Using Keyboard Shortcuts

```tsx
import { useKeyboardShortcuts, KeyboardShortcut } from './hooks/useKeyboardShortcuts';
import { ShortcutsDialog } from './components/ShortcutsDialog';

function App() {
  const [showDialog, setShowDialog] = useState(false);

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 's',
      ctrl: true,
      description: 'Save',
      action: () => {
        console.log('Saving...');
        // Your save logic
      },
    },
    {
      key: '/',
      ctrl: true,
      description: 'Show Shortcuts',
      action: () => setShowDialog(true),
    },
  ];

  useKeyboardShortcuts({ shortcuts });

  return (
    <div>
      <h1>My App</h1>
      <ShortcutsDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        shortcuts={shortcuts}
      />
    </div>
  );
}
```

## Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

This will start Vite dev server and launch Electron with hot reload enabled.

## Building

Build for production:

```bash
npm run build
```

Build for testing (unpacked):

```bash
npm run build:dir
```

## Testing

### Unit Tests

Run unit tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

### Coverage Reports

Generate code coverage reports:

```bash
npm run test:coverage
```

This command will:
- Run all tests with coverage collection
- Generate coverage reports in multiple formats:
  - **Text**: Summary displayed in terminal
  - **HTML**: Interactive report in `coverage/lcov-report/index.html`
  - **LCOV**: Machine-readable format in `coverage/lcov.info` for CI integration

#### Coverage Thresholds

The project enforces minimum coverage thresholds of **60%** for:
- Lines of code
- Branches
- Functions
- Statements

If coverage falls below these thresholds, the test run will fail.

#### What's Included in Coverage

Coverage is collected from:
- All TypeScript files in `src/**/*.{ts,tsx}`

Excluded from coverage:
- Test files (`*.test.{ts,tsx}`)
- Test directories (`__tests__/`)
- Type definition files (`*.d.ts`)
- Entry points (`main.tsx`, `vite-env.d.ts`)

#### Viewing Coverage Reports

After running `npm run test:coverage`, open the HTML report:

```bash
open coverage/lcov-report/index.html
```

The HTML report provides:
- File-by-file coverage breakdown
- Line-by-line highlighting of covered/uncovered code
- Interactive navigation through the codebase

### End-to-End Tests

Run E2E tests:

```bash
npm run test:e2e
```

Run E2E tests with UI:

```bash
npm run test:e2e:headed
```

Debug E2E tests:

```bash
npm run test:e2e:debug
```

View E2E test report:

```bash
npm run test:e2e:report
```

## Code Quality

Run ESLint:

```bash
npm run lint
```

Fix ESLint issues:

```bash
npm run lint:fix
```

Format code with Prettier:

```bash
npm run format
```

Type checking:

```bash
npm run type-check
```

## Main Process Features

The Electron main process (`electron/main.ts`) includes:

- Window management with proper lifecycle handling
- Dev/Production mode detection
- Preload script for secure IPC communication
- DevTools in development mode
- Proper window state management

## Technologies

- **Electron** - Desktop application framework
- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **electron-builder** - Application packaging
- **ESLint** - Code linting
- **Prettier** - Code formatting

## License

MIT
