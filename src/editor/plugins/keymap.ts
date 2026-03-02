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
  setParagraph,
} from '../commands';

/**
 * Creates keymap plugins with standard keyboard shortcuts
 *
 * @param schema - ProseMirror schema
 * @returns Array of keymap plugins
 */
export function createKeymapPlugins(schema: Schema): Plugin[] {
  return [
    // Text formatting keymaps
    // Note: 'Mod' maps to Cmd on macOS and Ctrl on Windows/Linux
    keymap({
      'Mod-b': toggleBold(schema),
      'Mod-i': toggleItalic(schema),
      'Mod-u': toggleUnderline(schema),
    }),

    // Heading level keymaps
    keymap({
      'Ctrl-Alt-1': setHeading(1),
      'Ctrl-Alt-2': setHeading(2),
      'Ctrl-Alt-3': setHeading(3),
      'Ctrl-Alt-4': setHeading(4),
      'Ctrl-Alt-5': setHeading(5),
      'Ctrl-Alt-6': setHeading(6),
      'Ctrl-Alt-0': setParagraph(),
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
