# EPUB Generation Library Decision

**Date:** 2026-03-01
**Project:** Electron Book Publishing App
**Decision:** Select EPUB generation library for the application

---

## Options Evaluated

1. **epub-gen-memory** - Ready-to-use EPUB generation library
2. **JSZip + Custom Builder** - Build custom EPUB generator from scratch

---

## Comparison Matrix

| Criteria | epub-gen-memory | JSZip + Custom Builder |
|----------|----------------|----------------------|
| **Implementation Time** | Immediate | 2-4 weeks |
| **TypeScript Support** | ✅ Built-in types | ⚠️ Need to write types |
| **Maintenance Burden** | Low (library maintained) | High (we maintain) |
| **API Flexibility** | Medium (library API) | High (full control) |
| **Bundle Size** | 56 KB gzipped | ~40-50 KB gzipped |
| **EPUB Standards** | EPUB 2 & 3 | Manual implementation |
| **Testing Required** | Minimal | Extensive |
| **Learning Curve** | Low | High |

---

## Option 1: epub-gen-memory

### Overview
A well-maintained fork of epub-gen with improved memory handling and TypeScript support. Works in both Node.js and browsers.

### Pros
✅ **Ready to use immediately** - No implementation time needed
✅ **Excellent TypeScript support** - Built-in type definitions, no @types package needed
✅ **Actively maintained** - Last updated July 2024 (v1.1.2) with recent bug fixes
✅ **Production-ready** - 4,642+ weekly downloads, proven in real-world usage
✅ **Comprehensive features:**
  - EPUB 2 & 3 support
  - Automatic table of contents generation
  - Image and font embedding
  - Parallel asset downloading with retry logic
  - Custom CSS support
  - Configurable metadata

✅ **Dual environment support** - Works in Node.js AND browsers (important for Electron)
✅ **Good API design** - Clean, flexible configuration with sensible defaults
✅ **Reasonable size** - 56 KB gzipped is acceptable for full EPUB generation
✅ **MIT Licensed** - No licensing concerns

### Cons
❌ **Small community** - Only 57 GitHub stars (but steady downloads indicate real usage)
❌ **Browser CORS limitation** - Can only download images from CORS-enabled servers in browser environments
❌ **One known validation bug** - Open PR for epubcheck validation error (MED-004/PKG-021) when cover images fail
❌ **CommonJS only** - No ESM support, can't benefit from tree-shaking
❌ **Adds dependency** - ~190 KB unminified (though this includes jszip which we already have)

### Dependencies Added
```json
{
  "epub-gen-memory": "^1.1.2"
}
```
Note: Project already has `jszip@3.10.1` installed, which is epub-gen-memory's main dependency.

### Code Example
```typescript
import epub from 'epub-gen-memory';

const content = await epub({
  title: 'Book Title',
  author: 'Author Name',
  publisher: 'Publisher',
  cover: 'path/to/cover.jpg',
  content: [
    {
      title: 'Chapter 1',
      data: '<h1>Chapter 1</h1><p>Content...</p>'
    },
    {
      title: 'Chapter 2',
      data: '<h1>Chapter 2</h1><p>More content...</p>'
    }
  ],
  css: 'body { font-family: Arial; }',
  version: 3
});

// Returns Buffer (Node.js) or Blob (browser)
fs.writeFileSync('book.epub', content);
```

---

## Option 2: JSZip + Custom EPUB Builder

### Overview
Build a custom EPUB generator from scratch using jszip (already installed) plus helper libraries for XML generation and metadata handling.

### Pros
✅ **Maximum flexibility** - Full control over EPUB generation logic
✅ **No external EPUB library** - Avoid dependency on third-party EPUB implementation
✅ **Slightly smaller bundle** - Estimated 40-50 KB gzipped (vs 56 KB)
✅ **Tailored to needs** - Only implement features we actually use
✅ **Learning opportunity** - Deep understanding of EPUB format
✅ **JSZip already installed** - Already have main dependency (jszip@3.10.1)

### Cons
❌ **Significant development time** - 2-4 weeks for production-ready implementation
❌ **High complexity** - Must understand EPUB 2/3 specifications in detail
❌ **Implementation challenges:**
  - Proper XML/XHTML generation with correct namespaces
  - mimetype file MUST be first and uncompressed in ZIP
  - Complex metadata handling (Dublin Core, unique IDs)
  - Table of contents generation (both NCX and navigation documents)
  - Media type detection and manifest generation
  - Spine ordering and reading flow
  - Image embedding and resource management

❌ **Extensive testing required** - Must validate against EPUBCheck and multiple e-readers
❌ **Ongoing maintenance burden** - We own all bugs and compatibility issues
❌ **No TypeScript types initially** - Must create our own type definitions
❌ **Risk of non-compliance** - Easy to miss EPUB specification requirements
❌ **Delayed project timeline** - Diverts focus from core book publishing features

### Additional Dependencies Needed
```json
{
  "ejs": "^4.0.1",          // Template-based XML generation
  "uuid": "^13.0.0",         // Unique book identifiers (already installed: 9.0.0)
  "mime": "^4.0.0",          // Media type detection
  "htmlparser2": "^9.0.0"    // HTML parsing for image extraction
}
```

Plus development time to:
- Create EJS templates for content.opf, container.xml, toc.ncx, toc.xhtml, chapters
- Implement EPubGenerator class with proper ZIP ordering
- Write comprehensive tests
- Validate against EPUBCheck
- Test in multiple e-readers (Calibre, Apple Books, Kindle Previewer)

### Estimated Implementation Effort
- **Basic working version:** 3-5 days
- **Production-ready with error handling:** 1-2 weeks
- **Feature-complete (images, fonts, CSS, cover):** 2-4 weeks
- **Testing and validation:** Additional 3-5 days

---

## Recommendation: ✅ **epub-gen-memory**

### Rationale

I strongly recommend using **epub-gen-memory** for the following reasons:

#### 1. **Time-to-Market**
Building a custom EPUB generator would take 2-4 weeks of dedicated development time. This diverts focus from the core book publishing features. epub-gen-memory can be integrated in hours.

#### 2. **Risk Mitigation**
- EPUB specification is complex with many edge cases
- Custom implementation risks non-compliance and compatibility issues
- epub-gen-memory is battle-tested with 4,642+ weekly downloads
- Known validation issues (like the MED-004/PKG-021 bug) are documented and can be worked around

#### 3. **Production Quality**
- Library includes features we'd need to build: parallel asset downloading, retry logic, error handling
- Supports both EPUB 2 and EPUB 3 standards
- Works in both Node.js and browser environments (critical for Electron apps)

#### 4. **TypeScript Support**
- Built-in type definitions provide excellent developer experience
- Type safety catches errors at compile time
- No need to write custom type definitions

#### 5. **Maintenance**
- Library maintainer handles EPUB spec changes and bug fixes
- Recent updates (July 2024) show active maintenance
- We can contribute PRs if needed (e.g., fix MED-004/PKG-021 validation issue)

#### 6. **Cost-Benefit Analysis**
- Bundle size difference: Only 6-16 KB larger (56 KB vs 40-50 KB) - negligible for desktop Electron app
- Development cost: 2-4 weeks of engineering time saved
- Maintenance cost: Significantly lower ongoing burden

#### 7. **Current Project Context**
- Project already has jszip@3.10.1 installed (epub-gen-memory's main dependency)
- TypeScript project benefits from library's built-in types
- Electron app can leverage dual Node.js/browser support

### Workarounds for Known Limitations

**Browser CORS Issue:**
- Not a concern for Electron main process
- For renderer process, serve images from local file system or internal server

**Cover Image Validation Bug (MED-004/PKG-021):**
- Ensure cover images are accessible before generation
- Add validation in our code before calling epub-gen-memory
- Monitor PR #2 in epub-gen-memory repo for fix

**CommonJS Module:**
- Not a concern for Electron/Node.js environment
- Webpack/Vite can handle CommonJS dependencies

### When to Reconsider Custom Implementation

Consider building custom EPUB generator only if:
- ❌ epub-gen-memory proves incompatible with specific requirements
- ❌ Need EPUB features not supported by the library
- ❌ Performance bottlenecks in library can't be worked around
- ❌ Library becomes unmaintained (no updates for >2 years)

None of these conditions currently apply.

---

## Implementation Plan

### Phase 1: Installation (5 minutes)
```bash
npm install epub-gen-memory
# or
yarn add epub-gen-memory
```

### Phase 2: Integration (2-4 hours)
1. Create EPUB service module
2. Map application data models to epub-gen-memory options
3. Handle image embedding
4. Add error handling and validation

### Phase 3: Testing (4-8 hours)
1. Unit tests for EPUB generation
2. Validate output with EPUBCheck
3. Test in multiple e-readers (Calibre, Apple Books)
4. Edge case testing (missing images, special characters)

### Phase 4: Documentation (2 hours)
1. Document EPUB generation API
2. Add usage examples
3. Document known limitations and workarounds

**Total Implementation Time: 1-2 days**

---

## Decision

**Selected Library:** epub-gen-memory v1.1.2

**Justification:** Provides production-ready EPUB generation with excellent TypeScript support, active maintenance, and significant time savings compared to custom implementation. The small bundle size difference (6-16 KB) is negligible for an Electron desktop application, while the development time savings (2-4 weeks) are substantial.

**Next Steps:**
1. ✅ Install epub-gen-memory via npm
2. Create EPUB service module in src/services/
3. Integrate with existing document parsing pipeline
4. Add EPUB export functionality to UI
