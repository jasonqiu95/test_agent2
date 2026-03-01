# Rich Text Editor Library Decision

**Date:** March 1, 2026
**Decision:** ProseMirror
**Status:** Recommended

## Executive Summary

After evaluating ProseMirror and Draft.js for the Vellum clone book publishing application, **ProseMirror is the recommended choice**. It provides superior extensibility for custom node types, better TypeScript support, excellent performance with long documents, and a more flexible document model that aligns with our existing type system.

## Requirements Analysis

Our book publishing application requires:

1. **Custom Node Types**
   - Scene breaks (with optional decorative symbols)
   - Section breaks, page breaks
   - Verse/poetry formatting with line and stanza support
   - Block quotes, inline quotes, and epigraphs
   - Multiple list types (ordered, unordered, definition)
   - Footnotes, endnotes, and sidenotes
   - Subheadings with multiple levels
   - Image embeds with metadata

2. **Inline Formatting**
   - Standard formatting (bold, italic, underline, strikethrough)
   - Subscript/superscript for scientific notation
   - Custom colors and highlights
   - Font family and size control

3. **Technical Requirements**
   - Strong TypeScript support
   - Performance with long documents (50,000+ words)
   - Extensible plugin system
   - Custom styling integration
   - Structured document model

## Comparison

### ProseMirror

#### Pros

**Extensibility for Custom Nodes** ⭐⭐⭐⭐⭐
- Schema-based document model allows defining any custom node type
- Clear separation between block nodes (paragraphs, headings, scene breaks) and inline marks (bold, italic)
- Can define custom nodes like:
  ```typescript
  sceneBreak: {
    group: "block",
    attrs: { symbol: { default: "***" } },
    parseDOM: [{ tag: "div.scene-break" }],
    toDOM: (node) => ["div", { class: "scene-break" }, node.attrs.symbol]
  }
  ```
- Supports complex nested structures (verse blocks with stanzas, nested lists)

**Plugin Ecosystem** ⭐⭐⭐⭐⭐
- Rich plugin system with well-defined APIs
- Official plugins: history, keymap, commands, input rules, gapcursor
- Community plugins: tables, collaborative editing (y-prosemirror), markdown parsing
- Easy to create custom plugins for specialized formatting

**TypeScript Support** ⭐⭐⭐⭐⭐
- Written in TypeScript with first-class type definitions
- Strong typing for schemas, nodes, marks, commands, and plugins
- Excellent IDE autocomplete and type safety
- Integrates well with our existing TypeScript codebase

**Performance** ⭐⭐⭐⭐⭐
- Efficient document model with immutable data structures
- Handles documents with 100,000+ words smoothly
- Virtual DOM-like diffing for optimal React integration
- Minimal re-renders with proper state management

**Custom Styling** ⭐⭐⭐⭐⭐
- Complete control over DOM structure and CSS classes
- Attrs system allows attaching metadata to nodes (style references)
- Can integrate seamlessly with our existing style system
- No forced styling or UI components

**Document Model** ⭐⭐⭐⭐⭐
- Hierarchical node structure similar to our existing types
- Clean separation of content and presentation
- Easy serialization to/from JSON
- Aligns well with our TextBlock and TextFeature types

#### Cons

**Learning Curve** ⭐⭐
- More complex API than Draft.js initially
- Requires understanding of schemas, transactions, and plugins
- Documentation is comprehensive but assumes some background knowledge

**UI Components** ⭐⭐⭐
- Does not include built-in UI components (toolbar, menus)
- Need to build or integrate third-party React components
- More initial setup work

**Bundle Size**
- Core: ~100KB minified + gzipped (prosemirror-state, prosemirror-view, prosemirror-model)
- Additional plugins add to size, but tree-shakeable

#### Production Users
- Atlassian (Confluence, Jira)
- The New York Times
- GitLab
- Airtable
- Many other enterprise applications

---

### Draft.js

#### Pros

**React Integration** ⭐⭐⭐⭐
- Built by Facebook specifically for React
- React-first API design
- Good community understanding among React developers

**Initial Learning Curve** ⭐⭐⭐⭐
- Simpler API for basic use cases
- Good starter documentation
- Familiar component patterns

**UI Examples**
- More examples of toolbars and UI components in documentation
- Draft.js plugins ecosystem has some pre-built components

#### Cons

**Extensibility for Custom Nodes** ⭐⭐
- Limited to predefined block types (unstyled, header-one, etc.)
- Custom block types require workarounds using atomic blocks and custom rendering
- Verse formatting with precise line control is difficult
- Scene breaks would need to be implemented as atomic blocks
- Less elegant solution for structured content

**Plugin Ecosystem** ⭐⭐⭐
- Draft.js plugins project exists but less maintained
- Fewer official plugins
- Community has fragmented with library in maintenance mode

**TypeScript Support** ⭐⭐⭐
- Type definitions via @types/draft-js (DefinitelyTyped)
- Not written in TypeScript originally
- Type definitions can lag behind API changes
- Less comprehensive than ProseMirror's native types

**Performance** ⭐⭐⭐
- Reports of performance issues with documents >10,000 words
- ContentState updates can be slow with many blocks
- Re-rendering issues in complex documents
- Not optimized for book-length content

**Custom Styling** ⭐⭐⭐
- Custom style maps for inline styles
- Block-level styling more limited
- Harder to integrate with external style systems
- Some styling forced by the library

**Document Model** ⭐⭐
- ContentState with blocks and entity ranges
- Less structured than our existing types
- Entities system is more complex for simple use cases
- Harder to map to TextBlock and TextFeature types

**Maintenance Status** ⚠️
- Facebook has moved Draft.js to maintenance mode
- Minimal active development
- Community-driven updates only
- Uncertain long-term future

## Decision Matrix

| Criteria | Weight | ProseMirror | Draft.js |
|----------|--------|-------------|----------|
| Custom Node Extensibility | 25% | 10/10 | 4/10 |
| TypeScript Support | 20% | 10/10 | 6/10 |
| Performance (Long Docs) | 20% | 10/10 | 6/10 |
| Plugin Ecosystem | 15% | 9/10 | 6/10 |
| Custom Styling Integration | 10% | 10/10 | 6/10 |
| Learning Curve | 5% | 5/10 | 7/10 |
| Maintenance/Future | 5% | 9/10 | 4/10 |
| **Weighted Score** | | **9.0/10** | **5.6/10** |

## Recommendation: ProseMirror

**ProseMirror is strongly recommended** for the following reasons:

### 1. Perfect Fit for Custom Node Types
Our application requires numerous custom node types (scene breaks, verse formatting, various break types). ProseMirror's schema system is designed exactly for this use case. We can define each of our TextFeature types as proper ProseMirror nodes with appropriate attributes and behaviors.

### 2. Performance Requirements
Book publishing means working with long documents. ProseMirror's architecture handles 50,000+ word documents smoothly, while Draft.js has known performance limitations beyond 10,000 words.

### 3. TypeScript Alignment
ProseMirror's native TypeScript support and type-safe API will integrate seamlessly with our existing codebase. This reduces bugs and improves developer experience.

### 4. Document Model Compatibility
ProseMirror's hierarchical node structure maps naturally to our TextBlock and TextFeature types. Converting between ProseMirror documents and our internal format will be straightforward.

### 5. Long-term Viability
ProseMirror is actively maintained with a healthy ecosystem and growing adoption. Draft.js is in maintenance mode with uncertain future.

### 6. Verse and Poetry Support
Verse formatting with precise line control and indentation is critical for our application. ProseMirror can model this as:
```typescript
verse: {
  content: "verse_line+",
  attrs: { stanza: { default: null } }
}
verse_line: {
  content: "inline*",
  attrs: { indentation: { default: 0 } }
}
```

This is much cleaner than trying to implement the same in Draft.js atomic blocks.

## Implementation Plan

### Phase 1: Core Setup
1. Install ProseMirror core packages:
   - `prosemirror-state` - Document state management
   - `prosemirror-view` - Rendering and event handling
   - `prosemirror-model` - Document schema and nodes
   - `prosemirror-transform` - Document transformations
   - `prosemirror-commands` - Editing commands
   - `prosemirror-keymap` - Keyboard shortcuts
   - `prosemirror-history` - Undo/redo
   - `prosemirror-inputrules` - Smart input (e.g., markdown shortcuts)

2. Optional but recommended:
   - `prosemirror-gapcursor` - Better cursor positioning
   - `prosemirror-schema-basic` - Basic schema as reference
   - `prosemirror-schema-list` - List support

### Phase 2: Schema Definition
1. Create custom schema mapping our types:
   - TextBlock types → ProseMirror block nodes
   - TextFeature types → ProseMirror custom nodes
   - InlineStyle → ProseMirror marks

2. Define attributes for style references and metadata

### Phase 3: Converters
1. Build converters between ProseMirror and our internal format
2. Ensure round-trip conversion maintains fidelity

### Phase 4: UI Integration
1. Create React wrapper component
2. Build toolbar and formatting controls
3. Integrate keyboard shortcuts with existing system

### Phase 5: Advanced Features
1. Custom plugins for publishing-specific features
2. Style browser integration
3. Export functionality

## Risks and Mitigations

### Risk: Learning Curve
**Mitigation:** ProseMirror has excellent documentation and a supportive community. The initial investment in learning will pay off with a more maintainable solution.

### Risk: Building UI Components
**Mitigation:** While ProseMirror doesn't include UI components, this gives us complete control. We can build exactly what we need for book publishing, not adapt generic components.

### Risk: Bundle Size
**Mitigation:** ProseMirror is modular. We only include the plugins we need. Tree-shaking will eliminate unused code.

## References

- [ProseMirror](https://prosemirror.net/)
- [ProseMirror Guide](https://prosemirror.net/docs/guide/)
- [ProseMirror Examples](https://prosemirror.net/examples/)
- [Draft.js](https://draftjs.org/)
- [Why we moved from Draft.js to ProseMirror](https://discuss.prosemirror.net/) (various discussions)

## Conclusion

ProseMirror's superior extensibility, performance, and TypeScript support make it the clear choice for our Vellum clone book publishing application. While it requires more initial setup than Draft.js, it provides the flexibility and power needed for professional book publishing workflows.

The ability to model our complex content types (verses, scene breaks, notes) as first-class ProseMirror nodes rather than working around Draft.js's limitations will result in cleaner code, better performance, and a more maintainable solution long-term.
