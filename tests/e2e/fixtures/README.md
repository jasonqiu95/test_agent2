# Test Fixtures

This directory contains test fixtures for E2E tests.

## Files

### sample-book.docx
A sample DOCX file with multiple chapters used for testing the import flow.

**Contents:**
- Chapter 1: The Beginning (with 2 paragraphs)
- Chapter 2: The Journey (with 2 paragraphs)
- Chapter 3: The Discovery (with 2 paragraphs)

This file is used to test:
- DOCX file parsing
- Chapter detection from headings
- Import preview dialog
- Chapter navigation after import

### createSampleDocx.js
A Node.js script to regenerate the sample DOCX file if needed.

**Note:** This file requires JSZip to be installed. Since the sample DOCX is already
committed, you typically don't need to run this script unless you want to modify
the test document structure.

## Regenerating Sample Files

If you need to regenerate the sample DOCX file with different content:

1. Ensure dependencies are installed: `npm install`
2. Run the script: `node tests/e2e/fixtures/createSampleDocx.js`

Alternatively, use Python:
```bash
cd tests/e2e/fixtures
python3 -c "import zipfile; ..." # See createSampleDocx.js for the Python approach
```

## Adding New Fixtures

When adding new test fixtures:
1. Keep files small and focused on specific test scenarios
2. Document the purpose of each fixture in this README
3. Commit binary files (like .docx) to ensure consistent test behavior
4. For large files, consider using Git LFS or generating them in CI
