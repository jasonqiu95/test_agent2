# Editor Module

This module provides a comprehensive ProseMirror-based editor schema for novel and book editing, with support for serialization/deserialization to the application's `TextBlock` format.

## Features

### Node Types

The editor schema supports the following node types:

#### Core Nodes
- **Document (`doc`)** - Top-level container for all content
- **Paragraph (`paragraph`)** - Standard text paragraphs
- **Heading (`heading`)** - Headings from H1 to H6 with level attribute
- **Text (`text`)** - Leaf text nodes

#### Block Elements
- **Block Quote (`blockquote`)** - Quoted text sections
- **Ordered List (`ordered_list`)** - Numbered lists with optional start number
- **Bullet List (`bullet_list`)** - Unordered lists
- **List Item (`list_item`)** - Individual list items

#### Special Content
- **Scene Break (`scene_break`)** - Visual separator between scenes (default: `* * *`)
- **Hard Break (`hard_break`)** - Line breaks within paragraphs

#### Placeholder Nodes (Future Implementation)
- **Ornamental Break (`ornamental_break`)** - Decorative section separators
- **Verse (`verse`)** - Poetry/verse container with stanza support
- **Verse Line (`verse_line`)** - Individual verse lines
- **Image (`image`)** - Image nodes with src, alt, title, dimensions

### Mark Types

Inline text formatting marks:

- **Bold (`bold`)** - Bold text
- **Italic (`italic`)** - Italic text
- **Underline (`underline`)** - Underlined text
- **Strikethrough (`strikethrough`)** - Strikethrough text
- **Subscript (`subscript`)** - Subscript text (excludes superscript)
- **Superscript (`superscript`)** - Superscript text (excludes subscript)
- **Code (`code`)** - Monospace/code text
- **Link (`link`)** - Hyperlinks with href, title, and target attributes

## Usage

### Basic Schema Usage

```typescript
import { editorSchema, NodeType, MarkType } from './editor';

// Create a paragraph node
const paragraph = editorSchema.node(NodeType.PARAGRAPH, null, [
  editorSchema.text('Hello, world!')
]);

// Create a heading
const heading = editorSchema.node(
  NodeType.HEADING,
  { level: 1 },
  editorSchema.text('Chapter Title')
);

// Create a document
const doc = editorSchema.node(NodeType.DOC, null, [heading, paragraph]);
```

### Applying Marks

```typescript
import { editorSchema, MarkType } from './editor';

// Create bold text
const boldMark = editorSchema.marks[MarkType.BOLD].create();
const boldText = editorSchema.text('Bold text').mark([boldMark]);

// Create italic and bold text
const italicMark = editorSchema.marks[MarkType.ITALIC].create();
const boldItalicText = editorSchema.text('Bold and italic').mark([boldMark, italicMark]);
```

### Serialization

Convert between ProseMirror documents and TextBlock arrays:

```typescript
import {
  serializeToTextBlocks,
  deserializeFromTextBlocks,
  editorSchema,
} from './editor';

// Convert ProseMirror doc to TextBlock[]
const textBlocks = serializeToTextBlocks(doc);

// Convert TextBlock[] back to ProseMirror doc
const doc = deserializeFromTextBlocks(textBlocks, editorSchema);
```

### JSON Serialization

```typescript
import {
  serializeToJSON,
  deserializeFromJSON,
  editorSchema,
} from './editor';

// Save document as JSON
const json = serializeToJSON(doc);
localStorage.setItem('document', JSON.stringify(json));

// Load document from JSON
const savedJson = JSON.parse(localStorage.getItem('document')!);
const doc = deserializeFromJSON(savedJson, editorSchema);
```

### HTML Serialization

```typescript
import {
  serializeToHTML,
  deserializeFromHTML,
  editorSchema,
} from './editor';

// Convert to HTML
const html = serializeToHTML(doc);

// Parse HTML back to document
const doc = deserializeFromHTML(html, editorSchema);
```

### Helper Functions

```typescript
import {
  createEmptyDocument,
  isDocumentEmpty,
  getNodeType,
  getMarkType,
} from './editor';

// Create an empty document
const emptyDoc = createEmptyDocument();

// Check if document is empty
if (isDocumentEmpty(doc)) {
  console.log('Document is empty');
}

// Get node/mark types
const paragraphType = getNodeType(editorSchema, NodeType.PARAGRAPH);
const boldMark = getMarkType(editorSchema, MarkType.BOLD);
```

## Integration with Existing Types

The editor schema is designed to work seamlessly with the existing TypeScript types:

- **TextBlock** - Maps to block nodes (paragraph, heading, etc.)
- **TextFeature** - Maps to special nodes (breaks, quotes, lists, etc.)
- **InlineStyle** - Maps to text marks (bold, italic, etc.)

The serialization utilities handle conversion between these formats automatically.

## Future Enhancements

The schema includes placeholder nodes for future features:

1. **Ornamental Breaks** - Decorative section separators with custom styles
2. **Verse/Poetry** - Full poetry support with line/stanza management
3. **Images** - Embedded images with full metadata

These nodes are defined in the schema but not yet fully integrated with the serialization layer.

## Examples

### Creating a Scene Break

```typescript
const sceneBreak = editorSchema.node(NodeType.SCENE_BREAK, {
  symbol: '***',
});
```

### Creating a Block Quote

```typescript
const quoteParagraph = editorSchema.node(
  NodeType.PARAGRAPH,
  null,
  editorSchema.text('To be or not to be.')
);

const blockQuote = editorSchema.node(NodeType.BLOCKQUOTE, null, [quoteParagraph]);
```

### Creating a List

```typescript
const items = ['First item', 'Second item', 'Third item'].map(text =>
  editorSchema.node(NodeType.LIST_ITEM, null, [
    editorSchema.node(NodeType.PARAGRAPH, null, editorSchema.text(text))
  ])
);

const orderedList = editorSchema.node(
  NodeType.ORDERED_LIST,
  { order: 1 },
  items
);
```

## Type Safety

All node and mark types are fully typed using TypeScript enums and interfaces:

```typescript
// Type-safe node creation
const heading: PMNode = editorSchema.node(
  NodeType.HEADING,
  { level: 2 } as HeadingAttrs,
  editorSchema.text('Subheading')
);

// Type-safe link creation
const link = editorSchema.marks[MarkType.LINK].create({
  href: 'https://example.com',
  title: 'Example',
  target: '_blank',
} as LinkAttrs);
```
