# Preview Panel Component

A React component with intelligent debouncing for preview panel updates.

## Features

- **Smart Debouncing**: 300-500ms configurable debounce for text edits
- **Immediate Navigation Updates**: No delay for navigation events
- **Idle Callback Optimization**: Uses `requestIdleCallback` for non-critical renders
- **Visual Feedback**: Subtle loading spinner when preview is updating
- **Auto-cancellation**: Automatically cancels pending updates when switching chapters
- **Responsive Design**: Mobile-friendly and dark mode support

## Usage

### Basic Usage

```tsx
import PreviewPanel from './components/Preview';

function App() {
  const [content, setContent] = useState('<h1>Hello World</h1>');

  return (
    <PreviewPanel content={content} />
  );
}
```

### With Navigation Events

```tsx
import PreviewPanel from './components/Preview';

function App() {
  const [content, setContent] = useState('');
  const [updateType, setUpdateType] = useState<'text-edit' | 'navigation'>('text-edit');

  const handleEditorChange = (newContent: string) => {
    setContent(newContent);
    setUpdateType('text-edit'); // Debounced update
  };

  const handleNavigate = (chapterContent: string) => {
    setContent(chapterContent);
    setUpdateType('navigation'); // Immediate update
  };

  return (
    <PreviewPanel
      content={content}
      updateType={updateType}
    />
  );
}
```

### With Chapter Switching

```tsx
import PreviewPanel from './components/Preview';

function App() {
  const [content, setContent] = useState('');
  const [chapterId, setChapterId] = useState('chapter-1');

  const handleChapterChange = (newChapterId: string, newContent: string) => {
    setChapterId(newChapterId); // This will cancel any pending updates
    setContent(newContent);
  };

  return (
    <PreviewPanel
      content={content}
      chapterId={chapterId}
      updateType="navigation"
    />
  );
}
```

### Custom Debounce Delay

```tsx
import PreviewPanel from './components/Preview';

function App() {
  return (
    <PreviewPanel
      content={content}
      debounceDelay={300} // Custom delay in milliseconds
    />
  );
}
```

## Hook Usage

You can also use the `usePreviewUpdate` hook directly for more control:

```tsx
import { usePreviewUpdate } from '../../hooks/usePreviewUpdate';

function CustomPreview({ editorContent }: { editorContent: string }) {
  const {
    previewContent,
    isUpdating,
    triggerUpdate,
    cancelPendingUpdates,
  } = usePreviewUpdate({
    debounceDelay: 400,
    useIdleCallback: true,
    onUpdateStart: () => console.log('Update started'),
    onUpdateEnd: () => console.log('Update finished'),
  });

  useEffect(() => {
    triggerUpdate(editorContent, 'text-edit');
  }, [editorContent]);

  return (
    <div>
      {isUpdating && <span>Loading...</span>}
      <div dangerouslySetInnerHTML={{ __html: previewContent }} />
    </div>
  );
}
```

## Props

### PreviewPanel

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `string` | (required) | HTML content to preview |
| `updateType` | `'text-edit' \| 'navigation'` | `'text-edit'` | Type of update |
| `chapterId` | `string` | `undefined` | Current chapter ID for cancellation |
| `debounceDelay` | `number` | `400` | Debounce delay in milliseconds |
| `className` | `string` | `''` | Additional CSS class |
| `onPreviewUpdate` | `(content: string) => void` | `undefined` | Callback when preview updates |

### usePreviewUpdate Hook

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `debounceDelay` | `number` | `400` | Debounce delay for text edits (ms) |
| `useIdleCallback` | `boolean` | `true` | Use requestIdleCallback for renders |
| `onUpdateStart` | `() => void` | `undefined` | Callback when update starts |
| `onUpdateEnd` | `() => void` | `undefined` | Callback when update finishes |

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `previewContent` | `string` | Current preview content |
| `isUpdating` | `boolean` | Whether preview is updating |
| `triggerUpdate` | `(content: string, type?: UpdateType) => void` | Trigger an update |
| `cancelPendingUpdates` | `() => void` | Cancel pending updates |

## Performance Considerations

1. **Text Edit Debouncing**: Text edits are debounced by 300-500ms to prevent excessive re-renders during typing
2. **Navigation Priority**: Navigation events update immediately for better UX
3. **Idle Callback**: Non-critical renders use `requestIdleCallback` to avoid blocking the main thread
4. **Auto-cancellation**: Pending updates are automatically cancelled when switching chapters to prevent stale renders

## Browser Compatibility

- `requestIdleCallback` is used when available, with fallback to immediate execution
- `cancelIdleCallback` is used when available for cleanup
- Works in all modern browsers (Chrome, Firefox, Safari, Edge)

## Styling

The component includes built-in styling with:
- Light and dark mode support
- Responsive design for mobile devices
- Customizable via `className` prop
- CSS variables for easy theming

Override styles by targeting these classes:
- `.preview-panel` - Main container
- `.preview-panel__header` - Header section
- `.preview-panel__spinner` - Loading spinner
- `.preview-panel__content` - Content area
