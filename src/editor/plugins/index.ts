/**
 * Editor plugins module
 * Exports all plugin creators and utilities
 */

export { createBasePlugins } from './base';
export { createHistoryPlugin, undo, redo } from './history';
export { createKeymapPlugins } from './keymap';
export { createNoteMarkersPlugin } from './noteMarkers';
export { createImagePastePlugin, hasImageInClipboard } from './imagePaste';
export type { ImagePasteOptions } from './imagePaste';

import { Plugin } from 'prosemirror-state';
import { Schema } from 'prosemirror-model';
import { createBasePlugins } from './base';
import { createHistoryPlugin } from './history';
import { createKeymapPlugins } from './keymap';
import { createNoteMarkersPlugin } from './noteMarkers';
import { createImagePastePlugin } from './imagePaste';

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
    enableImagePaste?: boolean;
  }
): Plugin[] {
  const plugins: Plugin[] = [
    // History plugin must come first to track all changes
    createHistoryPlugin({
      depth: config?.historyDepth,
      newGroupDelay: config?.newGroupDelay,
    }),

    // Base plugins for cursor and drop functionality
    ...createBasePlugins(schema),

    // Note markers plugin for footnote/endnote interactions
    createNoteMarkersPlugin(),
  ];

  // Image paste plugin (enabled by default)
  if (config?.enableImagePaste !== false) {
    plugins.push(createImagePastePlugin(schema));
  }

  // Keymaps should be last to have lowest priority
  plugins.push(...createKeymapPlugins(schema));

  return plugins;
}
