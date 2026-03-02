/**
 * EPUB 3 Note Converter
 * Converts footnotes and endnotes to proper EPUB 3 markup
 *
 * Features:
 * - Generates EPUB 3 semantic markup with epub:type attributes
 * - Creates <aside> elements for popup notes
 * - Generates <a> links with proper IDs for backlinks
 * - Supports both inline and popup footnote styles
 * - Maintains proper accessibility with ARIA attributes
 */

export type NoteType = 'footnote' | 'endnote';
export type NoteStyle = 'inline' | 'popup';

export interface NoteReference {
  /** Unique identifier for the note */
  id: string;
  /** Reference number or marker (e.g., "1", "*", "a") */
  marker: string;
  /** Type of note */
  type: NoteType;
  /** Content of the note (HTML string) */
  content: string;
  /** Optional custom class for styling */
  className?: string;
}

export interface NoteConversionOptions {
  /** Style to use for notes (inline or popup) */
  style?: NoteStyle;
  /** Prefix for generated IDs (default: "note") */
  idPrefix?: string;
  /** Whether to include ARIA labels for accessibility */
  includeAriaLabels?: boolean;
  /** Custom CSS class prefix */
  classPrefix?: string;
  /** Whether to use superscript for note markers */
  useSuperscript?: boolean;
}

export interface ConvertedNote {
  /** HTML for the note reference in the main text */
  referenceHtml: string;
  /** HTML for the note content (popup or end-of-document) */
  noteHtml: string;
  /** Note ID for cross-referencing */
  noteId: string;
  /** Reference ID for backlinks */
  refId: string;
}

export interface NoteCollectionResult {
  /** Array of converted notes */
  notes: ConvertedNote[];
  /** HTML for all note contents (for endnotes section) */
  notesHtml: string;
}

/**
 * Converts a single note reference to EPUB 3 format
 *
 * @param note - Note reference data
 * @param options - Conversion options
 * @returns Converted note with reference and content HTML
 *
 * @example
 * ```typescript
 * const note: NoteReference = {
 *   id: 'fn1',
 *   marker: '1',
 *   type: 'footnote',
 *   content: 'This is a footnote.'
 * };
 *
 * const converted = convertNote(note, { style: 'popup' });
 * console.log(converted.referenceHtml); // <a epub:type="noteref" href="#fn1">1</a>
 * console.log(converted.noteHtml);      // <aside epub:type="footnote" id="fn1">...</aside>
 * ```
 */
export function convertNote(
  note: NoteReference,
  options: NoteConversionOptions = {}
): ConvertedNote {
  const {
    style = 'popup',
    idPrefix = 'note',
    includeAriaLabels = true,
    classPrefix = '',
    useSuperscript = true,
  } = options;

  const noteId = `${idPrefix}-${note.id}`;
  const refId = `${idPrefix}-ref-${note.id}`;
  const noteTypeAttr = note.type === 'footnote' ? 'footnote' : 'endnote';
  const classBase = classPrefix ? `${classPrefix}-` : '';

  // Generate reference HTML (appears in main text)
  const referenceHtml = generateReferenceHtml({
    noteId,
    refId,
    marker: note.marker,
    noteType: noteTypeAttr,
    useSuperscript,
    includeAriaLabels,
    className: note.className,
    classBase,
  });

  // Generate note content HTML
  const noteHtml = style === 'popup'
    ? generatePopupNoteHtml({
        noteId,
        refId,
        content: note.content,
        noteType: noteTypeAttr,
        marker: note.marker,
        includeAriaLabels,
        classBase,
      })
    : generateInlineNoteHtml({
        noteId,
        refId,
        content: note.content,
        noteType: noteTypeAttr,
        marker: note.marker,
        includeAriaLabels,
        classBase,
      });

  return {
    referenceHtml,
    noteHtml,
    noteId,
    refId,
  };
}

/**
 * Converts multiple notes and generates a complete notes section
 *
 * @param notes - Array of note references
 * @param options - Conversion options
 * @returns Collection with individual notes and combined HTML
 *
 * @example
 * ```typescript
 * const notes: NoteReference[] = [
 *   { id: 'fn1', marker: '1', type: 'footnote', content: 'First note' },
 *   { id: 'fn2', marker: '2', type: 'footnote', content: 'Second note' }
 * ];
 *
 * const collection = convertNoteCollection(notes, { style: 'inline' });
 * console.log(collection.notesHtml); // Complete notes section HTML
 * ```
 */
export function convertNoteCollection(
  notes: NoteReference[],
  options: NoteConversionOptions = {}
): NoteCollectionResult {
  const convertedNotes = notes.map(note => convertNote(note, options));

  const notesHtml = generateNotesSection(
    convertedNotes,
    notes[0]?.type || 'footnote',
    options
  );

  return {
    notes: convertedNotes,
    notesHtml,
  };
}

/**
 * Generates HTML for a note reference link in the main text
 */
function generateReferenceHtml(params: {
  noteId: string;
  refId: string;
  marker: string;
  noteType: string;
  useSuperscript: boolean;
  includeAriaLabels: boolean;
  className?: string;
  classBase: string;
}): string {
  const {
    noteId,
    refId,
    marker,
    noteType,
    useSuperscript,
    includeAriaLabels,
    className,
    classBase,
  } = params;

  const classes = [
    `${classBase}noteref`,
    className,
  ].filter(Boolean).join(' ');

  const ariaLabel = includeAriaLabels
    ? ` aria-label="${noteType} ${escapeHtml(marker)}"`
    : '';

  const role = includeAriaLabels ? ' role="doc-noteref"' : '';

  const markerHtml = useSuperscript
    ? `<sup>${escapeHtml(marker)}</sup>`
    : escapeHtml(marker);

  return `<a id="${refId}" epub:type="noteref" href="#${noteId}" class="${classes}"${ariaLabel}${role}>${markerHtml}</a>`;
}

/**
 * Generates HTML for a popup-style note (using <aside>)
 */
function generatePopupNoteHtml(params: {
  noteId: string;
  refId: string;
  content: string;
  noteType: string;
  marker: string;
  includeAriaLabels: boolean;
  classBase: string;
}): string {
  const {
    noteId,
    refId,
    content,
    noteType,
    marker,
    includeAriaLabels,
    classBase,
  } = params;

  const ariaLabel = includeAriaLabels
    ? ` aria-label="${noteType} ${marker}"`
    : '';

  const role = includeAriaLabels ? ` role="doc-${noteType}"` : '';

  return `<aside id="${noteId}" epub:type="${noteType}" class="${classBase}${noteType}"${ariaLabel}${role}>
  <p><a href="#${refId}" class="${classBase}note-backlink" epub:type="backlink" role="doc-backlink">↩</a> ${content}</p>
</aside>`;
}

/**
 * Generates HTML for an inline-style note (for end-of-document notes)
 */
function generateInlineNoteHtml(params: {
  noteId: string;
  refId: string;
  content: string;
  noteType: string;
  marker: string;
  includeAriaLabels: boolean;
  classBase: string;
}): string {
  const {
    noteId,
    refId,
    content,
    noteType,
    marker,
    includeAriaLabels,
    classBase,
  } = params;

  const ariaLabel = includeAriaLabels
    ? ` aria-label="${noteType} ${marker}"`
    : '';

  const role = includeAriaLabels ? ` role="doc-${noteType}"` : '';

  return `<li id="${noteId}" epub:type="${noteType}" class="${classBase}${noteType}"${ariaLabel}${role}>
  <p><a href="#${refId}" class="${classBase}note-backlink" epub:type="backlink" role="doc-backlink">${escapeHtml(marker)}</a> ${content}</p>
</li>`;
}

/**
 * Generates a complete notes section (footnotes or endnotes)
 */
function generateNotesSection(
  notes: ConvertedNote[],
  noteType: NoteType,
  options: NoteConversionOptions = {}
): string {
  if (notes.length === 0) {
    return '';
  }

  const { classPrefix = '', includeAriaLabels = true } = options;
  const classBase = classPrefix ? `${classPrefix}-` : '';
  const sectionType = noteType === 'footnote' ? 'footnotes' : 'endnotes';
  const sectionTitle = noteType === 'footnote' ? 'Footnotes' : 'Endnotes';

  const ariaLabel = includeAriaLabels
    ? ` aria-label="${sectionTitle}"`
    : '';

  const role = includeAriaLabels ? ` role="doc-${sectionType}"` : '';

  const notesContent = notes.map(note => note.noteHtml).join('\n');

  return `<section epub:type="${sectionType}" class="${classBase}${sectionType}"${ariaLabel}${role}>
  <h2 class="${classBase}notes-title">${sectionTitle}</h2>
  <ol class="${classBase}notes-list">
    ${notesContent}
  </ol>
</section>`;
}

/**
 * Extracts notes from HTML content and converts them
 *
 * Looks for footnote markers in the format: [^1], [^*], [^a], etc.
 * and corresponding note definitions.
 *
 * @param html - HTML content with note markers
 * @param noteDefinitions - Map of note ID to content
 * @param options - Conversion options
 * @returns Modified HTML with converted notes
 *
 * @example
 * ```typescript
 * const html = '<p>Some text[^1] with footnotes[^2].</p>';
 * const definitions = new Map([
 *   ['1', 'First footnote content'],
 *   ['2', 'Second footnote content']
 * ]);
 *
 * const result = extractAndConvertNotes(html, definitions, { style: 'popup' });
 * ```
 */
export function extractAndConvertNotes(
  html: string,
  noteDefinitions: Map<string, string>,
  options: NoteConversionOptions = {}
): { html: string; notes: ConvertedNote[] } {
  const notes: ConvertedNote[] = [];
  let modifiedHtml = html;
  let noteCounter = 0;

  // Match note markers: [^1], [^*], [^a], etc.
  const notePattern = /\[\^([^\]]+)\]/g;

  modifiedHtml = modifiedHtml.replace(notePattern, (match, marker) => {
    const content = noteDefinitions.get(marker);

    if (!content) {
      // If no definition found, leave marker as-is
      return match;
    }

    noteCounter++;
    const noteRef: NoteReference = {
      id: `${noteCounter}`,
      marker,
      type: 'footnote',
      content,
    };

    const converted = convertNote(noteRef, options);
    notes.push(converted);

    return converted.referenceHtml;
  });

  return { html: modifiedHtml, notes };
}

/**
 * Generates CSS for note styling
 *
 * @param options - Styling options
 * @returns CSS string
 */
export function generateNoteStyles(options: {
  classPrefix?: string;
  style?: NoteStyle;
  fontSize?: string;
  color?: string;
}): string {
  const { classPrefix = '', style = 'popup', fontSize = '0.9em', color = '#333' } = options;
  const prefix = classPrefix ? `${classPrefix}-` : '';

  const baseStyles = `/* Note reference styles */
.${prefix}noteref {
  text-decoration: none;
  color: #0066cc;
  font-weight: normal;
}

.${prefix}noteref sup {
  font-size: ${fontSize};
  line-height: 0;
}

.${prefix}noteref:hover {
  color: #0052a3;
  text-decoration: underline;
}`;

  const popupStyles = style === 'popup' ? `

/* Popup note styles */
aside.${prefix}footnote,
aside.${prefix}endnote {
  display: none;
  position: absolute;
  background: #fffff0;
  border: 1px solid #ccc;
  padding: 0.5em 1em;
  margin: 0.5em 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-size: ${fontSize};
  max-width: 30em;
  z-index: 1000;
}

aside.${prefix}footnote:target,
aside.${prefix}endnote:target {
  display: block;
}` : '';

  const inlineStyles = style === 'inline' ? `

/* Inline note styles */
section.${prefix}footnotes,
section.${prefix}endnotes {
  margin-top: 3em;
  padding-top: 1em;
  border-top: 1px solid #ccc;
}

.${prefix}notes-title {
  font-size: 1.2em;
  font-weight: bold;
  margin-bottom: 1em;
}

.${prefix}notes-list {
  list-style-position: outside;
  padding-left: 2em;
  font-size: ${fontSize};
}

.${prefix}notes-list li {
  margin-bottom: 0.5em;
  color: ${color};
}` : '';

  const backlinkStyles = `

/* Backlink styles */
.${prefix}note-backlink {
  text-decoration: none;
  color: #0066cc;
  margin-right: 0.5em;
  font-weight: bold;
}

.${prefix}note-backlink:hover {
  color: #0052a3;
  text-decoration: underline;
}`;

  return baseStyles + popupStyles + inlineStyles + backlinkStyles;
}

/**
 * Escapes HTML special characters
 */
function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return text.replace(/[&<>"']/g, char => htmlEscapes[char] || char);
}
