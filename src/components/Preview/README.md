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

## PreviewContent Component

The `PreviewContent` component provides isolated content rendering using iframe for style isolation. This ensures that the preview content doesn't interfere with the parent application's styles.

### Features

- **Style Isolation**: Uses iframe for complete style isolation
- **Device Mode Support**: Responsive dimensions for desktop, tablet, and mobile views
- **Message Passing API**: Bidirectional communication between parent and iframe
- **Dynamic Content Updates**: Updates content without full page reload
- **Overflow Handling**: Automatically adjusts height based on content
- **Loading States**: Visual feedback during content loading
- **Empty State**: User-friendly placeholder when no content is available

### Basic Usage

```jsx
import { PreviewContent } from './components/Preview';

function App() {
  const [content, setContent] = useState('<h1>Hello World</h1>');
  const [styles, setStyles] = useState('body { font-family: Arial; }');

  return (
    <PreviewContent
      content={content}
      styles={styles}
      deviceMode="desktop"
    />
  );
}
```

### With Device Modes

```jsx
import { PreviewContent } from './components/Preview';

function App() {
  const [deviceMode, setDeviceMode] = useState('desktop');

  return (
    <>
      <button onClick={() => setDeviceMode('desktop')}>Desktop</button>
      <button onClick={() => setDeviceMode('tablet')}>Tablet</button>
      <button onClick={() => setDeviceMode('mobile')}>Mobile</button>

      <PreviewContent
        content={content}
        styles={styles}
        deviceMode={deviceMode}
      />
    </>
  );
}
```

### With Content Update Callback

```jsx
import { PreviewContent } from './components/Preview';

function App() {
  const handleContentUpdate = (message) => {
    if (message.type === 'contentHeightChanged') {
      console.log('Content height changed:', message.height);
    }
  };

  return (
    <PreviewContent
      content={content}
      styles={styles}
      deviceMode="desktop"
      onContentUpdate={handleContentUpdate}
    />
  );
}
```

### Using the Message Passing API

The component exposes methods for updating content via message passing:

```jsx
import { useRef } from 'react';
import { PreviewContent } from './components/Preview';

function App() {
  const previewRef = useRef(null);

  const updateContent = () => {
    if (previewRef.current) {
      previewRef.current.updateContent('<h2>New Content</h2>');
    }
  };

  const updateStyles = () => {
    if (previewRef.current) {
      previewRef.current.updateStyles('body { background: #f0f0f0; }');
    }
  };

  return (
    <>
      <button onClick={updateContent}>Update Content</button>
      <button onClick={updateStyles}>Update Styles</button>
      <div ref={previewRef}>
        <PreviewContent content={content} styles={styles} />
      </div>
    </>
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `string` | `''` | HTML content to render |
| `styles` | `string` | `''` | CSS styles to apply |
| `deviceMode` | `'desktop' \| 'tablet' \| 'mobile'` | `'desktop'` | Device mode for responsive dimensions |
| `onContentUpdate` | `function` | `null` | Callback for content update messages |
| `className` | `string` | `''` | Additional CSS class |

### Device Dimensions

| Mode | Width | Max Width | Min Height |
|------|-------|-----------|------------|
| Desktop | 100% | 1200px | 800px |
| Tablet | 768px | 768px | 1024px |
| Mobile | 375px | 375px | 667px |

### Message API

The iframe communicates with the parent via `postMessage`:

#### From Parent to Iframe

```javascript
// Update content
iframe.contentWindow.postMessage({
  type: 'updateContent',
  content: '<h1>New Content</h1>'
}, '*');

// Update styles
iframe.contentWindow.postMessage({
  type: 'updateStyles',
  styles: 'body { color: red; }'
}, '*');
```

#### From Iframe to Parent

```javascript
// Content height changed
{
  type: 'contentHeightChanged',
  height: 1200
}
```

### Styling

Override default styles by targeting:
- `.preview-content` - Main wrapper
- `.preview-content-container` - Content container
- `.preview-content-iframe` - Iframe element
- `.preview-content-empty` - Empty state
- `.preview-content-loading` - Loading state

### Security Considerations

The iframe uses the `sandbox` attribute with:
- `allow-same-origin` - Allows content to access its own origin
- `allow-scripts` - Allows JavaScript execution for message passing

This provides a secure isolated environment for rendering user content.
