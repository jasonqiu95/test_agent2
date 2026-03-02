# DOCX Import Integration Tests

Comprehensive integration tests for DOCX import functionality using Playwright.

## Overview

The `docx-import.spec.ts` file contains extensive tests for:

- ✅ Basic import and chapter auto-detection
- ✅ Formatting preservation (bold, italic, underline, strikethrough, headings)
- ✅ Front matter detection (prologue, preface, introduction)
- ✅ Back matter detection (epilogue, afterword)
- ✅ Large file handling (10MB+)
- ✅ Error handling for corrupted files
- ✅ Progress feedback during import
- ✅ Cancellation support
- ✅ Redux store state validation
- ✅ Complex document structures

## Test Scenarios

### 1. Basic Import and Chapter Detection

- **Import DOCX file**: Tests basic parsing of DOCX files
- **Auto-detect chapters**: Verifies chapters are detected by Heading 1 styles
- **Numbered chapters**: Tests detection of "Chapter One", "Chapter Two", etc.

### 2. Formatting Preservation

- **Bold text**: Ensures bold formatting is preserved
- **Italic text**: Ensures italic formatting is preserved
- **Combined formatting**: Tests bold + italic combinations
- **Heading levels**: Verifies H1, H2, H3, etc. are preserved
- **Underline and strikethrough**: Additional formatting tests

### 3. Front and Back Matter

- **Prologue**: Detected as front matter
- **Preface**: Detected as front matter
- **Introduction**: Detected as front matter
- **Epilogue**: Detected as back matter
- **Afterword**: Detected as back matter

### 4. Large File Handling

- **10MB+ files**: Tests parsing performance and stability
- **100+ chapters**: Verifies chapter detection scales
- **Progress tracking**: Ensures parsing doesn't hang

### 5. Error Handling

- **Corrupted files**: Gracefully handles malformed XML
- **Empty files**: Handles documents with no content
- **No chapters**: Handles documents without headings
- **Missing files**: Handles file not found errors

### 6. Progress and Cancellation

- **Progress feedback**: Tracks parsing time and progress
- **Cancel operation**: Tests ability to cancel long-running imports

### 7. Redux Store Integration

- **Book structure validation**: Ensures imported data matches Book type
- **Metadata validation**: Verifies word count, paragraph count, etc.

### 8. Complex Structures

- **Multiple heading levels**: H1, H2, H3 hierarchy
- **Page breaks**: Properly handles page break elements
- **Mixed content**: Documents with varied structure

## Running the Tests

### Prerequisites

```bash
# Install dependencies
npm install
```

### Run All Integration Tests

```bash
npm run test:e2e tests/integration/docx-import.spec.ts
```

### Run Specific Test Suite

```bash
npx playwright test tests/integration/docx-import.spec.ts --grep "Formatting Preservation"
```

### Run in Debug Mode

```bash
npx playwright test tests/integration/docx-import.spec.ts --debug
```

### Run with Report

```bash
npm run test:e2e:report
```

## Test Fixtures

The tests use fixture DOCX files located in `tests/fixtures/`:

- `sample-book.docx` - Basic sample with multiple chapters
- Fixtures are created programmatically during tests using JSZip

## Key Features

### Dynamic Fixture Generation

Tests create DOCX fixtures on-the-fly using JSZip, allowing precise control over:

- Document structure
- Formatting attributes
- Content size
- Error conditions

### Comprehensive Assertions

Each test validates:

- Document structure (elements, paragraphs, runs)
- Formatting properties (bold, italic, etc.)
- Chapter metadata (title, type, confidence)
- Error messages and edge cases

### Performance Testing

Large file tests track:

- Parse time (should be < 30s for 10MB files)
- Memory usage
- Chapter detection accuracy

## Integration with Redux Store

Tests verify that parsed DOCX data can be properly stored in Redux:

- Book structure matches `Book` type from `src/types/book.ts`
- Chapters match `Chapter` type
- Front/back matter properly categorized
- Metadata includes word count, page count, etc.

## Troubleshooting

### Test Failures

1. **JSZip not found**: Run `npm install` to install dependencies
2. **Timeout errors**: Increase timeout in test file or use `test.setTimeout()`
3. **Fixture creation fails**: Check file system permissions

### Performance Issues

- Large file tests may take several minutes
- Use `--workers=1` to run tests serially if memory is constrained
- Skip large file tests with `--grep-invert "Large File"`

## Future Enhancements

- [ ] Test images embedded in DOCX
- [ ] Test tables and lists
- [ ] Test custom styles
- [ ] Test non-English content
- [ ] Test password-protected files
- [ ] Test real-world samples from various Word versions
