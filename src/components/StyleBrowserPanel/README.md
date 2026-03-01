# StyleBrowserPanel Component

A comprehensive style browser component for displaying and managing book typography styles.

## Features

- **Category Navigation**: Browse styles by category (Serif, Sans Serif, Script, Modern) or view all
- **Search & Filter**: Real-time search through style names, descriptions, and categories
- **Favorites**: Star styles to mark them as favorites for quick access
- **Recently Used**: Automatically tracks and displays recently applied styles
- **Visual Previews**: Each style card shows a sample text preview with the actual typography
- **Responsive Grid Layout**: Adaptive grid that works on all screen sizes
- **Dark Mode Support**: Automatic theme switching based on system preferences
- **Persistent Storage**: Favorites and recent styles are saved to localStorage

## Usage

```tsx
import { StyleBrowserPanel } from './components/StyleBrowserPanel';
import { BookStyle } from './types/style';

function App() {
  const [currentStyleId, setCurrentStyleId] = useState<string>();

  const handleApplyStyle = (style: BookStyle) => {
    console.log('Applying style:', style);
    setCurrentStyleId(style.id);
    // Your logic to apply the style to the document
  };

  return (
    <StyleBrowserPanel
      onApplyStyle={handleApplyStyle}
      currentStyleId={currentStyleId}
    />
  );
}
```

## Props

### StyleBrowserPanelProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onApplyStyle` | `(style: BookStyle) => void` | Yes | Callback function called when a style is selected |
| `currentStyleId` | `string` | No | ID of the currently active style to highlight it |

## Component Structure

### Main Component
- **StyleBrowserPanel**: The main container component that manages state and renders all sections

### Sub-components
- **StyleCard**: Individual style preview card with:
  - Style name and category badge
  - Favorite toggle button
  - Typography preview
  - Description
  - Font information
  - Active state indicator

## Styling

The component uses CSS with the following organization:
- Responsive grid layout with `auto-fill` and `minmax`
- Smooth transitions and hover effects
- Dark mode support via `@media (prefers-color-scheme: dark)`
- Mobile-friendly responsive breakpoints
- Custom scrollbar styling

## Data Source

Styles are loaded from `src/data/styles/index.ts`, which provides:
- `allStyles`: Array of all available styles
- `getStylesByCategory()`: Function to filter styles by category

## Local Storage

The component persists the following data:
- `styleBrowser.favorites`: Array of favorited style IDs
- `styleBrowser.recents`: Array of recently used style IDs (max 10)

## Categories

Available categories with their icons:
- ✨ All Styles
- 📖 Serif
- 🔤 Sans Serif
- ✍️ Script
- ⚡ Modern

## Browser Compatibility

- Modern browsers with ES6+ support
- CSS Grid support required
- localStorage API required for persistence
