/**
 * Base plugins for ProseMirror editor
 * Provides fundamental editor functionality
 */

import { Plugin } from 'prosemirror-state';
import { gapCursor } from 'prosemirror-gapcursor';
import { Schema } from 'prosemirror-model';

/**
 * Creates base plugins for the editor
 * Includes gap cursor for better cursor placement
 */
export function createBasePlugins(_schema: Schema): Plugin[] {
  return [
    // Gap cursor - allows cursor placement in locations that normally wouldn't be selectable
    gapCursor(),
  ];
}
