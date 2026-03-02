# Integration Tests for Book Styles Application

This directory contains comprehensive integration tests for the book styles system, covering the complete workflow from loading styles to applying them to books.

## Test Coverage

### 1. Loading Built-in Styles
- Load all available built-in styles
- Retrieve styles by ID
- Filter styles by category
- Verify style structure and required properties

### 2. Applying Styles to Books
- Apply styles using style ID or BookStyle object
- Apply styles to all chapters and content blocks
- Handle different block types (headings, paragraphs, code)
- Apply special styling to first paragraphs
- Error handling for non-existent styles

### 3. Preview Generation
- Generate style previews without mutating original book
- Generate previews for multiple styles
- Support rapid style switching
- Instant preview updates

### 4. Style Features Verification

#### Heading Styles
- Compute heading styles for h1, h2, h3, h4
- Apply correct font families and sizes
- Apply heading colors and text transforms
- Verify proper spacing and margins

#### Drop Caps
- Compute drop cap styles when enabled
- Handle different characters
- Apply proper positioning and sizing
- Color and font weight application

#### Ornamental Breaks
- Compute ornamental break styles
- Handle enabled/disabled states
- Apply correct symbols and spacing
- Center alignment and styling

#### Paragraph Styles
- Regular paragraph styling
- First paragraph special styling
- Paragraphs with drop caps
- Line height and spacing

#### Font Families
- Serif font stacks
- Sans-serif font stacks
- Heading vs body font distinction
- Fallback fonts

#### Color Schemes
- Complete color scheme validation
- Text and heading colors
- Accent colors
- Background colors

### 5. Chapter Style Application
- Apply styles to entire chapters
- Compute individual block styles
- Handle mixed content (headings, paragraphs, code)
- Proper style inheritance

### 6. Custom Style Management
- Save custom styles
- Load custom styles
- Update existing custom styles
- Delete custom styles
- Merge built-in and custom styles
- Error handling (duplicates, non-existent styles)

### 7. Style Merging and Customization
- Merge base styles with overrides
- Partial property overrides
- Non-destructive merging
- Handle empty/undefined overrides

### 8. Performance and Caching
- Style computation caching
- Heading styles cache
- Paragraph styles cache
- Drop cap styles cache
- Cache clearing
- Large book performance

### 9. Complete Integration Workflows
- End-to-end style application
- Customize and save workflow
- Style switching with preview
- Multi-style comparison

## Running the Tests

### Run all integration tests
```bash
npm test tests/integration
```

### Run with coverage
```bash
npm run test:coverage tests/integration
```

### Run in watch mode
```bash
npm run test:watch tests/integration
```

### Run specific test file
```bash
npm test tests/integration/styles.integration.test.ts
```

## Test Structure

```
tests/integration/
├── README.md                           # This file
├── styles.integration.test.ts          # Main integration test suite
├── workflow.integration.test.ts        # Complete workflow tests
└── helpers/
    └── test-data.ts                   # Test data utilities
```

## Test Data

The tests use sample book content that includes:
- Multiple chapters with varied content
- Headings at different levels (h1, h2, h3)
- Regular paragraphs
- First paragraphs (for drop cap testing)
- Code blocks (for code styling)
- Front and back matter

Sample content is designed to test:
- Drop cap positioning and styling
- Heading hierarchy and spacing
- Paragraph spacing and alignment
- Ornamental breaks
- Font application across different elements
- Color scheme consistency

## Key Test Scenarios

### Basic Style Application
1. Load a built-in style (e.g., Garamond)
2. Apply it to a sample book
3. Verify all chapters and blocks have correct styles
4. Check that all style features are applied

### Style Switching
1. Apply initial style to book
2. Generate previews for other styles
3. Switch to different style
4. Verify instant updates
5. Check all features update correctly

### Custom Style Workflow
1. Load a base style
2. Create customizations (colors, fonts, spacing)
3. Save as custom style
4. Apply custom style to book
5. Update custom style
6. Verify changes reflected

### Performance Testing
1. Create large book (50+ chapters)
2. Apply style to entire book
3. Measure computation time
4. Verify caching effectiveness
5. Test rapid style switching

## Dependencies

The integration tests depend on:
- Jest test framework
- @testing-library/jest-dom
- Source modules:
  - `src/types/*` - Type definitions
  - `src/data/styles/*` - Built-in styles
  - `src/services/styleService.ts` - Style application service
  - `src/services/style-engine.ts` - Style computation engine

## Mock Data

Tests use localStorage mocking for custom style persistence. The mock is automatically set up by Jest configuration.

## Common Issues

### localStorage not available
If you see errors about localStorage, ensure jest.config.js has:
```javascript
testEnvironment: 'jsdom'
```

### Style cache issues
If tests fail due to cached styles, ensure each test:
1. Calls `clearStyleCaches()` in beforeEach
2. Clears localStorage if testing custom styles

### Async timing issues
If preview generation tests fail intermittently:
1. Check that async/await is used correctly
2. Consider adding small delays with `wait()` helper
3. Verify Promise.all is used for parallel operations

## Extending the Tests

To add new test scenarios:

1. **New Style Feature**: Add tests to "Style Features Verification" suite
2. **New Workflow**: Add to "Complete Integration Workflows" suite
3. **Performance**: Add to "Performance and Caching" suite
4. **Custom Styles**: Add to "Custom Style Management" suite

Example:
```typescript
test('should handle new feature', async () => {
  const style = getStyleById('garamond')!;
  // Test implementation
  expect(result).toBeDefined();
});
```

## CI/CD Integration

These tests are suitable for CI/CD pipelines:
- Fast execution (< 30 seconds typical)
- No external dependencies
- Deterministic results
- Good coverage of critical paths

## Notes

- Tests use sample book content that is representative of real-world usage
- All tests are isolated and can run in any order
- Caches are cleared between tests to ensure clean state
- Custom styles are stored in localStorage and cleared after each test
- Performance tests have reasonable time thresholds to avoid flaky tests
