# Block-Level Formatting Tests

## Overview
This document describes the comprehensive test suite for block-level formatting functionality in the Editor component.

## Test Coverage

### 1. Heading Levels (H1-H6)
- **Apply H1-H6 headings**: Tests keyboard shortcuts (Cmd+Alt+1 through Cmd+Alt+6) to apply heading levels
- **Display heading indicators**: Verifies that heading blocks show correct type indicators in the UI
- **All heading levels**: Ensures all 6 heading levels can be applied and are properly represented in the editor state

### 2. Paragraph and Heading Conversion
- **Heading to paragraph**: Tests conversion from any heading level back to paragraph (Cmd+Alt+0)
- **Bidirectional conversion**: Verifies content is preserved when converting between paragraph and heading
- **Level changes**: Tests changing between different heading levels without data loss

### 3. Text Alignment
- **Left alignment**: Cmd+Shift+L
- **Center alignment**: Cmd+Shift+E
- **Right alignment**: Cmd+Shift+R
- **Justify alignment**: Cmd+Shift+J
- **Dynamic alignment changes**: Tests switching between different alignment modes

### 4. List Formatting
- **Unordered lists**: Cmd+Shift+8 for bullet lists
- **Ordered lists**: Cmd+Shift+7 for numbered lists
- **List to paragraph**: Toggle lists back to paragraphs
- **List type conversion**: Convert between ordered and unordered lists

### 5. Nested List Handling
- **Indent with Tab**: Increase nesting level of list items
- **Outdent with Shift+Tab**: Decrease nesting level
- **Multi-level nesting**: Support for multiple indent levels
- **Maximum nesting limit**: Prevents excessive nesting beyond 6 levels

### 6. Block Format Keyboard Shortcuts
Tests a comprehensive set of keyboard shortcuts:
- `Cmd+Alt+0`: Convert to paragraph
- `Cmd+Alt+1` through `Cmd+Alt+6`: Apply heading levels H1-H6
- `Cmd+Shift+L`: Left align
- `Cmd+Shift+E`: Center align
- `Cmd+Shift+R`: Right align
- `Cmd+Shift+J`: Justify
- `Cmd+Shift+7`: Ordered list
- `Cmd+Shift+8`: Unordered list
- `Tab`: Increase indent (in lists)
- `Shift+Tab`: Decrease indent (in lists)

### 7. Multiple Block Selection and Formatting
- **Multi-block heading application**: Apply heading formats to multiple selected blocks
- **Multi-block alignment**: Apply alignment to multiple blocks simultaneously
- **Multi-block list conversion**: Convert multiple paragraphs to list items at once

### 8. Editor State Management
- **Immediate state updates**: Verifies editor state reflects block type changes immediately
- **Metadata preservation**: Ensures block metadata (id, timestamps, content) is preserved during formatting
- **Undo/Redo support**: Tests that block formatting changes can be undone and redone

## Test Results Summary
- **Total Tests**: 27
- **Currently Passing**: 4
  - Maximum nesting level enforcement
  - Toolbar tooltip display
  - Metadata preservation
  - (One additional test)
- **Pending Implementation**: 23 tests define expected behavior for features not yet implemented

## Data Model Extensions
The test suite required extending the `TextBlock` type definition to support:

```typescript
export interface TextBlock extends Metadata {
  content: string;
  blockType: 'paragraph' | 'heading' | 'preformatted' | 'code' | 'list';
  style?: StyleReference & {
    alignment?: 'left' | 'center' | 'right' | 'justify';
  };
  level?: number; // For headings (1-6)
  listType?: 'ordered' | 'unordered'; // For list blocks
  indentLevel?: number; // For nested lists (0-6)
}
```

## Implementation Guidance
The tests define the expected behavior for:

1. **EditorContent Component**: Should handle block type changes and formatting
2. **Keyboard Shortcuts**: Should implement the shortcut handlers defined in tests
3. **Block Formatting Toolbar**: Should provide UI buttons for all formatting options
4. **State Management**: Should properly track block types, alignment, and list properties
5. **Undo/Redo**: Should support undoing and redoing block format changes

## Running the Tests
```bash
npm test -- BlockFormatting.test.tsx
```

## Files Modified
- `src/components/Editor/__tests__/BlockFormatting.test.tsx` - New comprehensive test suite
- `src/types/textBlock.ts` - Extended to support list types, alignment, and indent levels

## Next Steps
1. Implement block formatting controls in EditorToolbar
2. Add keyboard shortcut handlers to EditorContent
3. Implement block type transformation logic
4. Add UI for alignment and list formatting
5. Integrate with undo/redo system
6. Style the different block types appropriately
