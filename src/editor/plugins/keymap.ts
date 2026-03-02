/**
 * Keyboard shortcut configuration for the editor
 */

import { keymap } from 'prosemirror-keymap';
import { baseKeymap } from 'prosemirror-commands';
import { undo, redo } from 'prosemirror-history';
import { Plugin } from 'prosemirror-state';
import { Schema } from 'prosemirror-model';
import {
  toggleBold,
  toggleItalic,
  toggleUnderline,
  setHeading,
} from '../commands';

/**
 * Creates keymap plugins with standard keyboard shortcuts
 *
 * @param schema - ProseMirror schema
 * @returns Array of keymap plugins
 */
export function createKeymapPlugins(schema: Schema): Plugin[] {
  return [
    // Formatting keymaps
    // Note: 'Mod' maps to Cmd on macOS and Ctrl on Windows/Linux
    keymap({
      // Text formatting
      'Mod-b': toggleBold(schema),
      'Mod-i': toggleItalic(schema),
      'Mod-u': toggleUnderline(schema),

      // Heading shortcuts (Ctrl/Cmd + 1-6)
      'Mod-1': setHeading(schema, 1),
      'Mod-2': setHeading(schema, 2),
      'Mod-3': setHeading(schema, 3),
      'Mod-4': setHeading(schema, 4),
      'Mod-5': setHeading(schema, 5),
      'Mod-6': setHeading(schema, 6),
    }),

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
