/**
 * Editor plugins module
 * Exports all plugin creators and utilities
 */

export { createBasePlugins } from './base';
export { createHistoryPlugin, undo, redo } from './history';
export { createKeymapPlugins } from './keymap';

import { Plugin } from 'prosemirror-state';
import { Schema } from 'prosemirror-model';
import { createBasePlugins } from './base';
import { createHistoryPlugin } from './history';
import { createKeymapPlugins } from './keymap';

/**
 * Creates all default plugins for the editor
 *
 * @param schema - ProseMirror schema
 * @param config - Optional configuration
 * @returns Array of plugins
 */
export function createDefaultPlugins(
  schema: Schema,
  config?: {
    historyDepth?: number;
    newGroupDelay?: number;
  }
): Plugin[] {
  return [
    // History plugin must come first to track all changes
    createHistoryPlugin({
      depth: config?.historyDepth,
      newGroupDelay: config?.newGroupDelay,
    }),

    // Base plugins for cursor and drop functionality
    ...createBasePlugins(schema),

    // Keymaps should be last to have lowest priority
    ...createKeymapPlugins(schema),
  ];
}
