# EditorPanel Component

The `EditorPanel` component is the main editor container for the Vellum 3-panel layout. It provides a structured shell for housing the editor with dedicated areas for header, toolbar, content, and footer.

## Features

- **Header Section**: Displays panel title with optional close button
- **Toolbar Area**: Placeholder for editor controls and formatting tools
- **Content Area**: Main editor content area with placeholder support
- **Footer Section**: Optional footer for status indicators or actions
- **Responsive Design**: Adapts to different screen sizes
- **Dark Mode Support**: Automatic theme switching based on system preference
- **Accessible**: Includes proper ARIA labels and keyboard navigation

## Usage

```tsx
import { EditorPanel } from './components/EditorPanel';

function App() {
  return (
    <EditorPanel
      title="Document Editor"
      toolbar={
        <div>
          {/* Toolbar controls will go here */}
          <button>Bold</button>
          <button>Italic</button>
        </div>
      }
      footer={
        <div>
          {/* Status indicators will go here */}
          <span>Word count: 1,234</span>
        </div>
      }
    >
      {/* Editor content will go here */}
      <textarea placeholder="Start writing..." />
    </EditorPanel>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `'Editor'` | Title displayed in the panel header |
| `children` | `React.ReactNode` | - | Content to be rendered in the editor area |
| `toolbar` | `React.ReactNode` | - | Optional toolbar content |
| `footer` | `React.ReactNode` | - | Optional footer content |
| `className` | `string` | `''` | Additional CSS class names |
| `onClose` | `() => void` | - | Callback when panel is closed |

## Styling

The component uses CSS modules for styling and follows the Vellum design system:

- Consistent spacing and typography
- CSS variables for theming support
- Responsive breakpoints for mobile and tablet
- Dark mode styles using `prefers-color-scheme`

## Integration with MainLayout

The EditorPanel is designed to work within the 3-panel MainLayout structure:

```tsx
<MainLayout
  navigator={<NavigatorPanel />}
  editor={<EditorPanel />}
  preview={<PreviewPanel />}
/>
```

## Future Enhancements

This is currently a component shell. Future work will include:

- Integration with rich text editor (e.g., TipTap, Slate, or ProseMirror)
- Toolbar implementation with formatting controls
- Undo/redo functionality
- Auto-save integration
- Collaboration features
