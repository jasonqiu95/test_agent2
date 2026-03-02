# Test Fixtures

This directory contains test fixtures for DOCX import integration tests.

## Available Fixtures

### sample-book.docx

A basic sample DOCX file with multiple chapters, created for e2e testing.

**Structure:**
- Title: "The Adventures of Test Book"
- Author: "By E2E Tester"
- 4 Chapters with Heading 1 styles
- Multiple paragraphs per chapter

**Usage:**
```typescript
import path from 'path';
const samplePath = path.join(__dirname, '../fixtures/sample-book.docx');
```

## Dynamic Fixtures

The integration tests in `tests/integration/docx-import.spec.ts` create additional fixtures programmatically using JSZip. These include:

- **test-chapters.docx** - Multiple chapters with clean structure
- **test-numbered.docx** - Chapters with word numbers (One, Two, etc.)
- **test-bold.docx** - Document with bold formatting
- **test-italic.docx** - Document with italic formatting
- **test-bold-italic.docx** - Document with combined formatting
- **test-headings.docx** - Document with multiple heading levels
- **test-prologue.docx** - Document with prologue (front matter)
- **test-preface.docx** - Document with preface (front matter)
- **test-epilogue.docx** - Document with epilogue (back matter)
- **test-afterword.docx** - Document with afterword (back matter)
- **test-large.docx** - Large file (100+ chapters) for performance testing
- **test-corrupted.docx** - Malformed DOCX for error handling
- **test-empty.docx** - Empty document
- **test-no-chapters.docx** - Document without headings
- **test-multi-level.docx** - Document with H1, H2 hierarchy
- **test-page-breaks.docx** - Document with page breaks

Dynamic fixtures are created during test execution and cleaned up automatically.

## Creating New Fixtures

### Using the Fixture Script

You can create custom fixtures using the `createDocxFixtures.js` script:

```bash
node tests/fixtures/createDocxFixtures.js
```

This will generate several pre-defined fixture files.

### Programmatic Creation

To create fixtures programmatically in tests:

```typescript
import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';

async function createCustomFixture(filename: string, content: string): Promise<string> {
  const zip = new JSZip();

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${content}
  </w:body>
</w:document>`;

  // Add required DOCX structure files
  zip.file('word/document.xml', documentXml);
  zip.file('word/styles.xml', stylesXml);
  zip.file('[Content_Types].xml', contentTypesXml);
  zip.file('_rels/.rels', relsXml);
  zip.file('word/_rels/document.xml.rels', docRelsXml);

  const buffer = await zip.generateAsync({ type: 'nodebuffer' });
  const filepath = path.join(__dirname, filename);
  fs.writeFileSync(filepath, buffer);

  return filepath;
}
```

## DOCX Structure Reference

A minimal valid DOCX file requires:

1. **word/document.xml** - Main document content
2. **word/styles.xml** - Style definitions
3. **[Content_Types].xml** - MIME types
4. **_rels/.rels** - Package relationships
5. **word/_rels/document.xml.rels** - Document relationships

### Common XML Patterns

#### Heading 1
```xml
<w:p>
  <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
  <w:r><w:t>Chapter Title</w:t></w:r>
</w:p>
```

#### Bold Text
```xml
<w:r>
  <w:rPr><w:b/></w:rPr>
  <w:t>Bold text</w:t>
</w:r>
```

#### Italic Text
```xml
<w:r>
  <w:rPr><w:i/></w:rPr>
  <w:t>Italic text</w:t>
</w:r>
```

#### Page Break
```xml
<w:r>
  <w:br w:type="page"/>
</w:r>
```

## Testing Notes

- Fixtures should be realistic but minimal
- Use consistent naming: `test-<feature>.docx`
- Clean up dynamic fixtures after tests
- Document expected structure in test comments
- Consider file size for performance tests
