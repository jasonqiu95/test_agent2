# ImageNodeView Component

Custom NodeView implementation for rendering image nodes in ProseMirror editor with full support for loading states, error handling, alignment modes, and interactive resizing.

## Features

- ✨ **Image Rendering**: Displays images with proper styling and attributes
- ⏳ **Loading States**: Shows spinner and loading indicator while images load
- ⚠️ **Error Handling**: Displays user-friendly error messages for broken images
- 📐 **Dimension Control**: Support for width/height attributes with visual feedback
- 📍 **Alignment Modes**:
  - `inline` - Inline with text (default)
  - `block` - Centered block image
  - `left` - Float left with text wrapping
  - `right` - Float right with text wrapping
- 🔲 **Selection Border**: Visual indicator when image is selected
- 🔧 **Resize Handles**: Interactive corner handles for resizing images
  - Hold Shift while resizing to maintain aspect ratio
  - Shows current dimensions during resize

## Usage

### Basic Integration

To use the ImageNodeView in your ProseMirror editor, register it with the EditorView:

```typescript
import { EditorView } from 'prosemirror-view';
import { EditorState } from 'prosemirror-state';
import { editorSchema } from './editor/schema';
import { createImageNodeView } from './editor/nodeviews';

const state = EditorState.create({
  schema: editorSchema,
  // ... other configuration
});

const view = new EditorView(document.querySelector('#editor'), {
  state,
  nodeViews: {
    image: createImageNodeView,
  },
});
```

### Image Node Attributes

The ImageNodeView uses the following attributes from the image node:

```typescript
interface ImageAttrs {
  src: string;                                    // Required: Image URL or data URI
  alt?: string;                                   // Optional: Alt text for accessibility
  title?: string;                                 // Optional: Image title
  width?: number;                                 // Optional: Width in pixels
  height?: number;                                // Optional: Height in pixels
  alignment?: 'inline' | 'block' | 'left' | 'right'; // Optional: Alignment mode (default: 'inline')
}
```

### Creating Image Nodes

You can insert image nodes using ProseMirror commands:

```typescript
import { NodeType } from './editor/types';

// Insert an image at the current selection
const insertImage = (src: string, attrs?: Partial<ImageAttrs>) => {
  return (state, dispatch) => {
    const { schema } = state;
    const imageNode = schema.nodes[NodeType.IMAGE].create({
      src,
      alignment: 'block',
      ...attrs,
    });

    if (dispatch) {
      const tr = state.tr.replaceSelectionWith(imageNode);
      dispatch(tr);
    }
    return true;
  };
};
```

### Styling

The component includes comprehensive CSS styling in `ImageNodeView.css`. The styles are automatically applied when the component is rendered and include:

- Alignment-specific layouts
- Loading and error state styling
- Selection borders and focus indicators
- Resize handle positioning and hover effects
- Dark mode support
- Print-friendly styles
- Responsive mobile adjustments

## Component Architecture

### ImageNodeView Class

The main `ImageNodeView` class implements the ProseMirror `NodeView` interface:

- **`constructor`**: Initializes the node view and renders the React component
- **`update`**: Updates the component when the node changes
- **`selectNode/deselectNode`**: Handles selection state
- **`destroy`**: Cleans up React component on unmount
- **`stopEvent`**: Controls event handling for resize interactions
- **`ignoreMutation`**: Prevents ProseMirror from reacting to React-managed DOM changes

### ImageNodeComponent

The React component handles:

- Image loading state management
- Error state detection
- Interactive resize functionality with mouse drag
- Dimension updates through ProseMirror transactions
- Visual feedback for selected state

## Accessibility

The component includes several accessibility features:

- Alt text support for screen readers
- Title attribute for additional context
- Keyboard focus indicators
- Error messages that explain what went wrong
- Proper semantic HTML structure

## Browser Compatibility

The ImageNodeView works in all modern browsers that support:

- ProseMirror (IE11+)
- React 16.8+ (for hooks)
- CSS Grid and Flexbox
- CSS custom properties (for theming)

## Performance

The component is optimized for performance:

- React rendering only updates when node attributes change
- Resize operations use local state to avoid excessive ProseMirror transactions
- Final dimensions are committed to ProseMirror only after resize completes
- Image loading is handled asynchronously with proper error boundaries

## Testing

See the test file `ImageNodeView.test.tsx` for examples of:

- Component rendering
- Loading state handling
- Error state handling
- Resize functionality
- Alignment mode rendering
- Selection state updates

## Future Enhancements

Potential improvements for future versions:

- Image rotation controls
- Crop functionality
- Image filters and adjustments
- Batch operations for multiple images
- Lazy loading support
- Progressive image loading
- Image optimization hints
