# DOCX Parser Module

A comprehensive DOCX parser that provides both high-level HTML conversion (via [mammoth.js](https://github.com/mwilliamson/mammoth.js)) and low-level structured document parsing.

## Features

- **HTML Conversion**: Convert DOCX files to clean HTML
- **Text Extraction**: Extract plain text from DOCX files
- **Structured Parsing**: Parse document structure with full metadata
  - Paragraph-level metadata (styles, alignment, spacing, indentation)
  - Heading levels (h1-h6)
  - Inline formatting (bold, italic, underline, strikethrough, color, font)
  - Page breaks, line breaks, and section breaks
  - Paragraph numbering and lists
- **Full TypeScript Support**: Comprehensive type definitions
- **Clean API**: Promise-based, easy to use
- **Error Handling**: Detailed error messages and warnings

## Usage

### Basic HTML Conversion

```typescript
import { DocxParser } from './lib/docx';

// Convert to HTML
const result = await DocxParser.parseToHtml('/path/to/document.docx');
console.log(result.value); // HTML string

// Extract plain text
const textResult = await DocxParser.extractText('/path/to/document.docx');
console.log(textResult.value); // Plain text string
```

### Structured Document Parsing

```typescript
import { DocxParser } from './lib/docx';

// Parse structured document
const result = await DocxParser.parseStructured('/path/to/document.docx');

// Access document elements
for (const element of result.document.elements) {
  if (element.type === 'paragraph') {
    console.log(`Paragraph: ${element.rawText}`);
    console.log(`Heading level: ${element.style.headingLevel || 'none'}`);
    console.log(`Style: ${element.style.styleName || 'default'}`);

    // Access formatted text runs
    for (const content of element.content) {
      if (content.type === 'text') {
        console.log(`Text: "${content.text}"`);
        console.log(`Bold: ${content.formatting.bold || false}`);
        console.log(`Italic: ${content.formatting.italic || false}`);
        console.log(`Font: ${content.formatting.fontFamily || 'default'}`);
      } else if (content.type === 'break') {
        console.log(`Break: ${content.breakType}`);
      }
    }
  } else if (element.type === 'section-break') {
    console.log(`Section break: ${element.sectionType}`);
  }
}

// Access metadata
console.log(`Total paragraphs: ${result.document.metadata.paragraphCount}`);
console.log(`Total words: ${result.document.metadata.wordCount}`);
console.log(`Total characters: ${result.document.metadata.characterCount}`);
```

### Working with Buffers

```typescript
import { DocxParser } from './lib/docx';
import { readFileSync } from 'fs';

const buffer = readFileSync('/path/to/document.docx');

// Parse from buffer
const result = await DocxParser.parseStructuredFromBuffer(buffer);
```

## API Reference

### Methods

#### `parseToHtml(filePath: string, options?: DocxParseOptions): Promise<DocxParseResult>`
Convert DOCX to HTML.

#### `parseBufferToHtml(buffer: Buffer, options?: DocxParseOptions): Promise<DocxParseResult>`
Convert DOCX buffer to HTML.

#### `extractText(filePath: string): Promise<DocxParseResult>`
Extract plain text from DOCX.

#### `extractTextFromBuffer(buffer: Buffer): Promise<DocxParseResult>`
Extract plain text from DOCX buffer.

#### `parseStructured(filePath: string): Promise<StructuredParseResult>`
Parse DOCX and return structured document tree with full metadata.

#### `parseStructuredFromBuffer(buffer: Buffer): Promise<StructuredParseResult>`
Parse DOCX buffer and return structured document tree.

### Types

#### `StructuredDocument`
Represents the complete document structure:
- `elements`: Array of paragraphs and section breaks
- `metadata`: Document statistics (paragraph count, word count, character count)

#### `Paragraph`
Represents a paragraph with:
- `content`: Array of text runs, breaks, and tabs
- `style`: Paragraph-level styling and metadata
- `rawText`: Plain text content

#### `ParagraphStyle`
Paragraph formatting:
- `styleName`: Style identifier (e.g., "Heading1")
- `headingLevel`: 1-6 for headings
- `alignment`: left, center, right, justify
- `indentation`: left, right, firstLine, hanging
- `spacing`: before, after, line
- `numbering`: level and format for lists

#### `InlineFormatting`
Text run formatting:
- `bold`, `italic`, `underline`, `strikethrough`
- `subscript`, `superscript`
- `color`, `highlight`
- `fontSize`, `fontFamily`

## License

Part of the Electron Book Publishing Application.
