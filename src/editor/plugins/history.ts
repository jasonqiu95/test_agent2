/**
 * History plugin configuration for undo/redo functionality
 */

import { Plugin } from 'prosemirror-state';
import { history, undo, redo } from 'prosemirror-history';

/**
 * Creates the history plugin for undo/redo
 *
 * @param config - Optional configuration for history plugin
 * @returns History plugin
 */
export function createHistoryPlugin(config?: {
  depth?: number;
  newGroupDelay?: number;
}): Plugin {
  return history({
    depth: config?.depth ?? 100,
    newGroupDelay: config?.newGroupDelay ?? 500,
  });
}

/**
 * Export undo and redo commands for use in keymaps
 */
export { undo, redo };
