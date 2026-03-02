# Book Validation System

The book validation system provides comprehensive pre-export checks to ensure your book meets quality standards and format requirements.

## Features

The validation system checks for:

1. **Required Metadata**
   - Book title presence
   - Author information completeness
   - Description and language recommendations
   - Publisher information

2. **Chapter Content**
   - Empty chapters detection
   - Chapters with no text content
   - Missing chapter titles

3. **ISBN Validation**
   - Valid ISBN-10 format and check digit
   - Valid ISBN-13 format and check digit
   - ISBN presence recommendations

4. **Image Quality**
   - Image resolution for PDF export
   - Missing alt text for accessibility
   - Cover image presence

5. **Link Validation**
   - Empty or missing URLs
   - Insecure HTTP links
   - Localhost references
   - Invalid URL formats
   - Missing link text

6. **Style Completeness**
   - Style definitions presence
   - Referenced styles existence
   - Unused styles detection
   - Empty style properties

## Usage

### Basic Validation

```typescript
import { validateBook } from './services/validator';
import type { Book } from './types/book';

const book: Book = {
  // your book data
};

const result = validateBook(book);

console.log(`Valid: ${result.valid}`);
console.log(`Errors: ${result.errors.length}`);
console.log(`Warnings: ${result.warnings.length}`);
console.log(`Info: ${result.info.length}`);
```

### Validation with Options

```typescript
import { validateBook } from './services/validator';

const result = validateBook(book, {
  validateMetadata: true,
  validateChapters: true,
  validateISBN: true,
  validateImages: true,
  validateLinks: true,
  validateStyles: true,
  minImageWidth: 300,
  minImageHeight: 300,
  exportFormat: 'pdf',
});
```

### Using the ValidationDialog Component

```typescript
import React, { useState } from 'react';
import { ValidationDialog } from './components/ValidationDialog';
import { validateBook } from './services/validator';

export const MyComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  const handleValidate = () => {
    const result = validateBook(myBook);
    setValidationResult(result);
    setIsOpen(true);
  };

  const handleProceed = () => {
    // Proceed with export
    console.log('Exporting book...');
  };

  return (
    <>
      <button onClick={handleValidate}>Validate Book</button>

      {validationResult && (
        <ValidationDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onProceed={handleProceed}
          validationResult={validationResult}
          canProceedWithWarnings={true}
        />
      )}
    </>
  );
};
```

## Validation Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `validateMetadata` | boolean | `true` | Check required metadata fields |
| `validateChapters` | boolean | `true` | Check chapter content |
| `validateISBN` | boolean | `true` | Validate ISBN format |
| `validateImages` | boolean | `true` | Check image quality |
| `validateLinks` | boolean | `true` | Detect broken links |
| `validateStyles` | boolean | `true` | Validate style definitions |
| `minImageWidth` | number | `300` | Minimum image width in pixels |
| `minImageHeight` | number | `300` | Minimum image height in pixels |
| `exportFormat` | string | `'pdf'` | Target export format |

## Validation Result

The validation result contains:

```typescript
interface ValidationResult {
  valid: boolean;           // true if no errors
  issues: ValidationIssue[]; // all issues
  errors: ValidationIssue[]; // blocking errors
  warnings: ValidationIssue[]; // non-blocking warnings
  info: ValidationIssue[];   // informational messages
}

interface ValidationIssue {
  id: string;          // unique identifier
  severity: 'error' | 'warning' | 'info';
  category: string;    // issue category
  message: string;     // short description
  location?: string;   // where the issue occurs
  details?: string;    // additional details
  fixable?: boolean;   // can be auto-fixed
}
```

## Severity Levels

- **Error**: Blocking issues that prevent export. Must be fixed.
- **Warning**: Non-blocking issues that should be reviewed.
- **Info**: Informational messages and recommendations.

## ValidationDialog Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | boolean | Yes | Dialog visibility |
| `onClose` | function | Yes | Close handler |
| `onProceed` | function | No | Export proceed handler |
| `validationResult` | ValidationResult | Yes | Validation results |
| `title` | string | No | Dialog title |
| `canProceedWithWarnings` | boolean | No | Allow export with warnings |

## Examples

See `src/examples/validationExample.tsx` for a complete working example.

## Customization

### Custom Validation Rules

You can extend the validator by adding custom validation functions:

```typescript
function customValidateBook(book: Book): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Add your custom validation logic
  if (book.chapters.length < 3) {
    issues.push({
      id: 'custom-min-chapters',
      severity: 'warning',
      category: 'Content',
      message: 'Book should have at least 3 chapters',
      details: 'Most books have multiple chapters.',
    });
  }

  return issues;
}
```

### Custom Styling

The ValidationDialog component can be styled by overriding CSS classes in `ValidationDialog.css` or by providing your own CSS file.

## Best Practices

1. **Validate Before Export**: Always validate your book before exporting to catch issues early.

2. **Fix Errors First**: Address all errors before proceeding. Warnings can be reviewed but don't block export.

3. **Review Warnings**: While warnings don't prevent export, they often indicate quality issues worth addressing.

4. **Test Links**: Ensure all external links are valid and accessible.

5. **Check Images**: Verify image resolution is adequate for your target format (especially PDF).

6. **Provide Metadata**: Complete metadata improves discoverability and professionalism.

## Troubleshooting

### Common Issues

**"Book has no chapters"**
- Ensure your book has at least one chapter with content.

**"Invalid ISBN format"**
- Verify your ISBN matches the correct format (10 or 13 digits with valid check digit).
- Use online ISBN validators to verify your ISBN.

**"Referenced style does not exist"**
- Check that all style references in your content match defined style IDs.

**"Link has invalid URL format"**
- Ensure all URLs are properly formatted (e.g., `https://example.com`).

**"Image has low resolution for PDF export"**
- Use higher resolution images (at least 300x300px for PDF).

## Integration

The validation system integrates seamlessly with:

- Export workflows
- Save operations
- Publishing pipelines
- Content review processes

## Testing

Run the validation tests:

```bash
npm test src/services/__tests__/validator.test.ts
```

## Future Enhancements

Planned features:

- Auto-fix for common issues
- Custom validation rule plugins
- Batch validation for multiple books
- Validation report export
- Integration with spell checkers
- Grammar checking
