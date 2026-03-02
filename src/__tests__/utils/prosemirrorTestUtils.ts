/**
 * ProseMirror test utilities and helpers
 */

import { EditorState, Transaction, Plugin } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema, Node as ProseMirrorNode, DOMParser, DOMSerializer } from 'prosemirror-model';
import { history, undo, redo } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';

/**
 * Create a basic ProseMirror schema for testing
 */
export function createTestSchema(): Schema {
  // Create a minimal test schema
  return new Schema({
    nodes: {
      doc: {
        content: 'block+',
      },
      paragraph: {
        content: 'inline*',
        group: 'block',
        parseDOM: [{ tag: 'p' }],
        toDOM() {
          return ['p', 0];
        },
      },
      text: {
        group: 'inline',
      },
    },
    marks: {
      strong: {
        parseDOM: [
          { tag: 'strong' },
          { tag: 'b' },
          { style: 'font-weight', getAttrs: (value) => /^(bold(er)?|[5-9]\d{2,})$/.test(value as string) && null },
        ],
        toDOM() {
          return ['strong', 0];
        },
      },
      em: {
        parseDOM: [{ tag: 'i' }, { tag: 'em' }, { style: 'font-style=italic' }],
        toDOM() {
          return ['em', 0];
        },
      },
      code: {
        parseDOM: [{ tag: 'code' }],
        toDOM() {
          return ['code', 0];
        },
      },
    },
  });
}

// Cache the schema for reuse
const basicSchema = createTestSchema();

/**
 * Create a test editor state
 */
export function createTestEditorState(
  content?: string | ProseMirrorNode,
  schema: Schema = basicSchema,
  plugins: Plugin[] = []
): EditorState {
  let doc: ProseMirrorNode;

  if (typeof content === 'string') {
    // Parse HTML string to ProseMirror document
    const div = document.createElement('div');
    div.innerHTML = content;
    doc = DOMParser.fromSchema(schema).parse(div);
  } else if (content) {
    doc = content;
  } else {
    // Create empty document
    doc = schema.node('doc', null, [schema.node('paragraph')]);
  }

  return EditorState.create({
    doc,
    schema,
    plugins: [
      history(),
      keymap({
        'Mod-z': undo,
        'Mod-y': redo,
        'Mod-Shift-z': redo,
      }),
      ...plugins,
    ],
  });
}

/**
 * Create a test editor view
 */
export function createTestEditorView(
  state: EditorState,
  container?: HTMLElement
): EditorView {
  const mount = container || document.createElement('div');

  if (!container) {
    document.body.appendChild(mount);
  }

  return new EditorView(mount, {
    state,
    dispatchTransaction(tr: Transaction) {
      const newState = this.state.apply(tr);
      this.updateState(newState);
    },
  });
}

/**
 * Create a complete test editor (state + view)
 */
export function createTestEditor(
  content?: string | ProseMirrorNode,
  container?: HTMLElement,
  schema: Schema = basicSchema,
  plugins: Plugin[] = []
): { view: EditorView; state: EditorState } {
  const state = createTestEditorState(content, schema, plugins);
  const view = createTestEditorView(state, container);

  return { view, state };
}

/**
 * Apply a transaction to an editor view
 */
export function applyTransaction(view: EditorView, tr: Transaction): EditorState {
  const newState = view.state.apply(tr);
  view.updateState(newState);
  return newState;
}

/**
 * Insert text at the current selection
 */
export function insertText(view: EditorView, text: string): void {
  const tr = view.state.tr.insertText(text);
  applyTransaction(view, tr);
}

/**
 * Delete text in a range
 */
export function deleteText(view: EditorView, from: number, to: number): void {
  const tr = view.state.tr.delete(from, to);
  applyTransaction(view, tr);
}

/**
 * Set selection in the editor
 */
export function setSelection(view: EditorView, from: number, to?: number): void {
  const tr = view.state.tr.setSelection(
    view.state.selection.constructor.create(
      view.state.doc,
      from,
      to !== undefined ? to : from
    )
  );
  applyTransaction(view, tr);
}

/**
 * Apply a mark (formatting) to the current selection
 */
export function applyMark(
  view: EditorView,
  markType: string,
  attrs?: Record<string, any>
): void {
  const mark = view.state.schema.marks[markType];
  if (!mark) {
    throw new Error(`Mark type "${markType}" not found in schema`);
  }

  const tr = view.state.tr.addMark(
    view.state.selection.from,
    view.state.selection.to,
    mark.create(attrs)
  );
  applyTransaction(view, tr);
}

/**
 * Remove a mark from the current selection
 */
export function removeMark(view: EditorView, markType: string): void {
  const mark = view.state.schema.marks[markType];
  if (!mark) {
    throw new Error(`Mark type "${markType}" not found in schema`);
  }

  const tr = view.state.tr.removeMark(
    view.state.selection.from,
    view.state.selection.to,
    mark
  );
  applyTransaction(view, tr);
}

/**
 * Toggle a mark on/off
 */
export function toggleMark(view: EditorView, markType: string): void {
  const mark = view.state.schema.marks[markType];
  if (!mark) {
    throw new Error(`Mark type "${markType}" not found in schema`);
  }

  const { from, to } = view.state.selection;
  const hasMark = view.state.doc.rangeHasMark(from, to, mark);

  if (hasMark) {
    removeMark(view, markType);
  } else {
    applyMark(view, markType);
  }
}

/**
 * Get the text content of the document
 */
export function getDocumentText(state: EditorState): string {
  return state.doc.textContent;
}

/**
 * Get the HTML content of the document
 */
export function getDocumentHTML(state: EditorState): string {
  const div = document.createElement('div');
  const fragment = DOMSerializer.fromSchema(state.schema).serializeFragment(
    state.doc.content
  );
  div.appendChild(fragment);
  return div.innerHTML;
}

/**
 * Create a ProseMirror node from HTML
 */
export function nodeFromHTML(html: string, schema: Schema = basicSchema): ProseMirrorNode {
  const div = document.createElement('div');
  div.innerHTML = html;
  return DOMParser.fromSchema(schema).parse(div);
}

/**
 * Simulate typing in the editor
 */
export function typeText(view: EditorView, text: string, delay: number = 0): Promise<void> {
  return new Promise(resolve => {
    const chars = text.split('');
    let index = 0;

    const typeChar = () => {
      if (index < chars.length) {
        insertText(view, chars[index]);
        index++;
        if (delay > 0) {
          setTimeout(typeChar, delay);
        } else {
          typeChar();
        }
      } else {
        resolve();
      }
    };

    typeChar();
  });
}

/**
 * Simulate pressing a key in the editor
 */
export function pressKey(view: EditorView, key: string, modifiers?: {
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
}): boolean {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ctrlKey: modifiers?.ctrl,
    shiftKey: modifiers?.shift,
    altKey: modifiers?.alt,
    metaKey: modifiers?.meta,
  });

  return view.dom.dispatchEvent(event);
}

/**
 * Simulate undo
 */
export function simulateUndo(view: EditorView): boolean {
  return pressKey(view, 'z', { meta: true });
}

/**
 * Simulate redo
 */
export function simulateRedo(view: EditorView): boolean {
  return pressKey(view, 'y', { meta: true });
}

/**
 * Check if the document has a specific mark at a position
 */
export function hasMarkAt(
  state: EditorState,
  pos: number,
  markType: string
): boolean {
  const mark = state.schema.marks[markType];
  if (!mark) return false;

  const $pos = state.doc.resolve(pos);
  return mark.isInSet($pos.marks()) !== undefined;
}

/**
 * Get all marks at a position
 */
export function getMarksAt(state: EditorState, pos: number): string[] {
  const $pos = state.doc.resolve(pos);
  return $pos.marks().map(mark => mark.type.name);
}

/**
 * Create a test plugin
 */
export function createTestPlugin(name: string, props: any = {}): Plugin {
  return new Plugin({
    key: new Plugin.PluginKey(name),
    ...props,
  });
}

/**
 * Flush all pending transactions
 */
export function flushTransactions(view: EditorView): void {
  // Allow any pending transactions to complete
  return;
}

/**
 * Destroy the editor and clean up
 */
export function destroyEditor(view: EditorView): void {
  const dom = view.dom;
  view.destroy();
  if (dom.parentNode) {
    dom.parentNode.removeChild(dom);
  }
}

/**
 * Mock ProseMirror EditorView for testing without actual DOM
 */
export function createMockEditorView(state: EditorState): Partial<EditorView> {
  let currentState = state;

  const mockView: Partial<EditorView> = {
    state: currentState,
    dom: document.createElement('div'),

    updateState(newState: EditorState) {
      currentState = newState;
      (this as any).state = newState;
    },

    dispatch(tr: Transaction) {
      const newState = currentState.apply(tr);
      this.updateState!(newState);
    },

    destroy() {
      // Mock cleanup
    },

    focus() {
      this.dom!.focus();
    },
  };

  return mockView;
}

/**
 * Assert document structure matches expected
 */
export function assertDocumentStructure(
  state: EditorState,
  expected: Record<string, any>
): void {
  const actual = state.doc.toJSON();
  expect(actual).toMatchObject(expected);
}

/**
 * Wait for editor to be ready
 */
export async function waitForEditor(view: EditorView, timeout: number = 1000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (view.dom.isConnected) {
        resolve();
      } else if (Date.now() - start > timeout) {
        reject(new Error('Timeout waiting for editor'));
      } else {
        setTimeout(check, 10);
      }
    };
    check();
  });
}
