# EPUB Export Integration Tests

This directory contains integration tests for the EPUB 3 export workflow.

## Overview

The tests verify the complete EPUB generation workflow:

1. **Book Data** → Parse and validate book structure
2. **EPUB Structure** → Convert book data to EPUB-compatible structure
3. **Metadata Injection** → Add book metadata (title, author, ISBN, etc.)
4. **Styling** → Apply CSS styles to content
5. **TOC Generation** → Create table of contents
6. **File Packaging** → Bundle everything into a valid EPUB file

## Test Coverage

### Basic EPUB Generation
- Minimal book data conversion
- Multiple authors handling
- HTML content generation

### Front and Back Matter
- Front matter elements (dedication, acknowledgments, etc.)
- Back matter elements (epilogue, about author, etc.)
- TOC inclusion/exclusion

### Styling
- Custom CSS application
- Default base styles
- Multiple stylesheet combination

### Images
- Image processing and embedding
- Cover image handling
- Books without images

### Table of Contents
- TOC generation from chapter structure
- Selective chapter inclusion
- Front/back matter in TOC

### EPUB Validation
- Complete structure validation
- Required metadata validation
- Content validation
- Error reporting

### Complete Workflow
- End-to-end export process
- Progress tracking
- Various configuration options
- Error handling

### Different Book Configurations
- Complex chapter structures with formatting
- Books with/without front and back matter
- Text-only books (no images)
- Books with custom styles
- Multi-author books

## Running Tests

```bash
# Run all integration tests
npm test -- tests/integration

# Run EPUB export tests specifically
npm test -- tests/integration/epub-export.test.ts

# Run with coverage
npm test -- --coverage tests/integration

# Watch mode
npm test -- --watch tests/integration
```

## Test Fixtures

The `fixtures.ts` file contains sample book data for testing:

- `sampleBookMinimal` - Minimal book with one chapter
- `sampleBookWithMatter` - Complete book with front/back matter
- `sampleBookWithImages` - Book with cover and embedded images
- `sampleBookWithFormatting` - Book with rich text formatting
- `sampleStyles` - Standard and modern style templates
- `sampleImages` - Sample image data

## Mocking

The tests mock the filesystem writes and the `epub-gen-memory` library to:
- Avoid actual file I/O during tests
- Speed up test execution
- Allow testing of error conditions
- Verify correct data is passed to the EPUB generator

## Validation

Tests include validation checks that verify:
- Generated EPUBs meet EPUB 3 specifications
- Required metadata is present
- Content structure is valid
- TOC is properly formatted
- Images are correctly embedded

## Adding New Tests

To add new test cases:

1. Create test fixtures in `fixtures.ts` if needed
2. Add test cases to `epub-export.test.ts`
3. Use descriptive test names
4. Test both success and error cases
5. Verify validation results

Example:

```typescript
it('should handle specific book configuration', async () => {
  const book = createCustomBook();
  const result = await exportEPUB(book, [], []);

  expect(result.success).toBe(true);
  expect(result.validation?.valid).toBe(true);
});
```
