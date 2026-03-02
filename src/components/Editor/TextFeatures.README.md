# Text Features Insertion Tests

## Overview

The `TextFeatures.test.tsx` file contains comprehensive tests for inserting and managing special text features in the editor. These tests follow Test-Driven Development (TDD) principles and define the expected behavior for text feature insertion functionality.

## Test Coverage

### 1. Scene Breaks
- **Tests**: 2
- **Functionality**:
  - Insert scene breaks at cursor position via keyboard shortcut (Cmd+Shift+B)
  - Insert scene breaks via toolbar button
  - Scene breaks should be stored as `Break` features with `breakType: 'scene'`

### 2. Ornamental Breaks
- **Tests**: 3
- **Functionality**:
  - Insert ornamental breaks with default symbol ('* * *')
  - Insert ornamental breaks with custom symbols
  - Support multiple style variations: '* * *', '• • •', '~ ~ ~', '❦', '✦'
  - Stored as `Break` features with `symbol` property

### 3. Block Quotations
- **Tests**: 2
- **Functionality**:
  - Insert and format block quotations with keyboard shortcut (Cmd+Shift+Q)
  - Support attribution and source fields
  - Support different quote types: 'block', 'inline', 'epigraph'
  - Stored as `Quote` features

### 4. Verse/Poetry Blocks
- **Tests**: 3
- **Functionality**:
  - Insert verse blocks with keyboard shortcut (Cmd+Shift+V)
  - Parse multiple lines separated by line breaks
  - Support line-by-line indentation
  - Support multi-stanza poetry with stanza numbers
  - Stored as `Verse` features with `lines` array

### 5. Inline Images
- **Tests**: 2
- **Functionality**:
  - Insert images via keyboard shortcut (Cmd+Shift+I)
  - Support image source path/URL
  - Support alignment options: left, center, right
  - Support alt text for accessibility

### 6. Footnotes and Endnotes
- **Tests**: 4
- **Functionality**:
  - Insert footnotes with keyboard shortcut (Cmd+Alt+F)
  - Insert endnotes with keyboard shortcut (Cmd+Alt+E)
  - Auto-increment reference numbers
  - Support custom symbols instead of numbers
  - Stored as `Note` features with `noteType: 'footnote' | 'endnote'`

### 7. Web Links
- **Tests**: 3
- **Functionality**:
  - Insert links via keyboard shortcut (Cmd+K)
  - Apply links to selected text
  - Validate URL format
  - Support title attribute
  - Support target options: '_blank', '_self', '_parent', '_top'
  - Stored as `Link` features

### 8. Keyboard Shortcuts
- **Tests**: 1
- **Functionality**:
  - Verify all keyboard shortcuts open appropriate dialogs/UI
  - Shortcuts summary:
    - `Cmd+Shift+B`: Scene break
    - `Cmd+Shift+Q`: Quote
    - `Cmd+Shift+V`: Verse
    - `Cmd+Shift+I`: Image
    - `Cmd+Alt+F`: Footnote
    - `Cmd+Alt+E`: Endnote
    - `Cmd+K`: Link

### 9. Rendering and State Updates
- **Tests**: 3
- **Functionality**:
  - Render text features correctly in content blocks
  - Display feature tags for each feature type
  - Update editor state (isDirty flag) when features are added
  - Support undo/redo operations for feature insertion
  - Maintain undo/redo state correctly

## Implementation Requirements

To make these tests pass, the following components and functionality need to be implemented:

### 1. EditorToolbar Enhancements
Add toolbar buttons for each text feature type:
- Scene Break button
- Ornamental Break button
- Quote button
- Verse button
- Image button
- Footnote button
- Endnote button
- Link button

### 2. Keyboard Shortcut Handlers
Implement keyboard event handlers in the Editor component or a dedicated keyboard shortcuts hook:
- Register all keyboard shortcuts listed above
- Open appropriate dialogs/insertion UI for each shortcut
- Handle platform differences (Cmd on macOS, Ctrl on Windows/Linux)

### 3. Feature Insertion Dialogs
Create modal dialogs or inline forms for each feature type with appropriate inputs:

#### Scene Break Dialog
- Simple confirmation or immediate insertion

#### Ornamental Break Dialog
- Symbol input field (default: '* * *')
- Preset symbol options

#### Quote Dialog
- Quote content textarea
- Attribution input (optional)
- Source input (optional)
- Quote type selector (block, inline, epigraph)

#### Verse Dialog
- Multi-line textarea for verse lines
- Indentation input (comma-separated levels)
- Stanza number input (optional)

#### Image Dialog
- Image source input (path or URL)
- Alignment selector (left, center, right)
- Alt text input

#### Footnote/Endnote Dialog
- Note content textarea
- Option to use symbol instead of number
- Symbol input (if custom symbol selected)

#### Link Dialog
- URL input with validation
- Title input (optional)
- Target selector (_blank, _self, _parent, _top)

### 4. Feature Rendering
Enhance the EditorContent component to display text features:
- Render scene breaks as visual separators
- Render ornamental breaks with symbols
- Render quotes with proper formatting and attribution
- Render verse with line breaks and indentation
- Render inline images with alignment
- Render footnote/endnote reference numbers/symbols
- Render links as clickable elements

### 5. State Management
Update the ChapterStore to handle text features:
- Add features to TextBlock objects
- Trigger isDirty flag when features are added/modified
- Support undo/redo for feature operations
- Auto-increment note numbers across all blocks

### 6. URL Validation
Implement URL validation for link insertion:
- Check for valid URL format
- Support http://, https://, and relative URLs
- Display validation error messages

## Running the Tests

```bash
npm test -- --testPathPatterns=TextFeatures.test.tsx
```

## Current Status

**All tests are currently failing** - this is expected as the feature insertion functionality has not been implemented yet. These tests serve as specifications for the implementation.

## Test Structure

The tests use:
- `@testing-library/react` for rendering and interaction
- Custom test utilities from `src/__tests__/utils`
- Mock chapter store for state management
- User event simulation for realistic interactions

## Next Steps

1. Implement toolbar buttons for text features
2. Add keyboard shortcut handlers
3. Create feature insertion dialogs
4. Implement feature rendering in EditorContent
5. Update state management to handle features
6. Run tests iteratively to verify implementation
