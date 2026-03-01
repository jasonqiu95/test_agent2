# Book Publishing Application with Keyboard Shortcuts

TypeScript data models for a book publishing application with a comprehensive keyboard shortcuts system for React applications.

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

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Watch mode
npm run build:watch

# Development server
npm run dev

# Preview build
npm run preview
```

## License

MIT
