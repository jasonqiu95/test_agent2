# StyleEditor Sections

This directory contains configuration sections for the StyleEditor component.

## DropCapsSection

The `DropCapsSection` component provides a comprehensive interface for configuring drop caps in book styling.

### Features

- **Toggle Enable/Disable**: Master switch to enable or disable drop caps
- **Number of Lines**: Input field to set how many lines the drop cap should span (1-5)
- **Font Size Selector**: Dropdown with pre-defined sizes from 2em to 5em
- **Font Family Selector**: Choose to inherit from heading font or select custom fonts
- **Font Weight Selector**: Control the boldness (normal to black/900)
- **Color Picker**: Visual color picker with text input for hex values
- **Margin Right Spacing**: Control spacing between drop cap and text

### Usage Example

```tsx
import { DropCapsSection } from './sections';
import { DropCapStyle } from '../../types/style';

function MyStyleEditor() {
  const [dropCapStyle, setDropCapStyle] = useState<DropCapStyle>({
    enabled: true,
    lines: 3,
    fontSize: '3em',
    fontFamily: 'inherit-heading',
    fontWeight: 'bold',
    color: '#000000',
    marginRight: '0.1em',
  });

  const handleDropCapChange = (updates: Partial<DropCapStyle>) => {
    setDropCapStyle(prev => ({ ...prev, ...updates }));
  };

  return (
    <DropCapsSection
      dropCapStyle={dropCapStyle}
      headingFontFamily="Georgia" // Optional: shows in font family dropdown
      onChange={handleDropCapChange}
    />
  );
}
```

### Props

- `dropCapStyle`: Current drop cap configuration
- `headingFontFamily` (optional): The heading font family to display in the inherit option
- `onChange`: Callback function called when any setting changes

### Behavior

When drop caps are disabled via the toggle:
- All dependent fields are automatically disabled
- The visual state of inputs indicates they are inactive
- Changes are not allowed until drop caps are re-enabled

This ensures a clear user experience and prevents invalid configurations.
