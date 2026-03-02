/**
 * Keyboard shortcut configuration for the editor
 */

import { keymap } from 'prosemirror-keymap';
import { baseKeymap } from 'prosemirror-commands';
import { undo, redo } from 'prosemirror-history';
import { Plugin } from 'prosemirror-state';
import { Schema } from 'prosemirror-model';

/**
 * Creates keymap plugins with standard keyboard shortcuts
 *
 * @param _schema - ProseMirror schema (unused but kept for API consistency)
 * @returns Array of keymap plugins
 */
export function createKeymapPlugins(_schema: Schema): Plugin[] {
  return [
    // History keymaps (undo/redo)
    keymap({
      'Mod-z': undo,
      'Mod-y': redo,
      'Shift-Mod-z': redo,
    }),

    // Base keymap with standard editing commands
    // Includes: Enter, Backspace, Delete, arrow keys, etc.
    keymap(baseKeymap),
  ];
}
