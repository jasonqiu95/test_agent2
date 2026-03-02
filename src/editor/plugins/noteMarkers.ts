/**
 * Note Markers Plugin
 * Handles click events and tooltips for footnote and endnote markers
 */

import { Plugin, PluginKey } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { NodeType } from '../types';

/**
 * Plugin key for note markers
 */
export const noteMarkersPluginKey = new PluginKey('noteMarkers');

/**
 * Tooltip state
 */
interface TooltipState {
  show: boolean;
  noteId: string;
  noteType: 'footnote' | 'endnote';
  x: number;
  y: number;
  preview?: string;
}

/**
 * Create tooltip element
 */
function createTooltip(): HTMLDivElement {
  const tooltip = document.createElement('div');
  tooltip.className = 'note-marker-tooltip';
  tooltip.style.cssText = `
    position: absolute;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    max-width: 300px;
    z-index: 1000;
    pointer-events: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    white-space: pre-wrap;
    word-wrap: break-word;
  `;
  tooltip.style.display = 'none';
  return tooltip;
}

/**
 * Get note preview text from noteId
 * This is a placeholder - in a real implementation, this would fetch
 * the actual note content from a data store
 */
function getNotePreview(noteId: string, noteType: 'footnote' | 'endnote'): string {
  // Placeholder implementation
  // In a real app, you would look up the note content by ID
  return `${noteType === 'footnote' ? 'Footnote' : 'Endnote'} content preview for ${noteId}`;
}

/**
 * Jump to note content (placeholder implementation)
 * In a real implementation, this would scroll to the note content section
 */
function jumpToNote(noteId: string, noteType: 'footnote' | 'endnote'): void {
  console.log(`Jump to ${noteType}: ${noteId}`);
  // Placeholder: In a real app, this would:
  // 1. Find the note content element in the document
  // 2. Scroll to it
  // 3. Highlight it temporarily
}

/**
 * Show tooltip at position
 */
function showTooltip(
  tooltip: HTMLDivElement,
  x: number,
  y: number,
  noteId: string,
  noteType: 'footnote' | 'endnote'
): void {
  const preview = getNotePreview(noteId, noteType);
  tooltip.textContent = preview;
  tooltip.style.left = x + 'px';
  tooltip.style.top = y + 20 + 'px'; // Offset below cursor
  tooltip.style.display = 'block';
}

/**
 * Hide tooltip
 */
function hideTooltip(tooltip: HTMLDivElement): void {
  tooltip.style.display = 'none';
}

/**
 * Create the note markers plugin
 */
export function createNoteMarkersPlugin(): Plugin {
  let tooltip: HTMLDivElement | null = null;
  let hoverTimeout: number | null = null;

  return new Plugin({
    key: noteMarkersPluginKey,

    view(editorView: EditorView) {
      // Create tooltip element when view is created
      tooltip = createTooltip();
      document.body.appendChild(tooltip);

      return {
        destroy() {
          // Clean up tooltip when view is destroyed
          if (tooltip && tooltip.parentNode) {
            tooltip.parentNode.removeChild(tooltip);
          }
          if (hoverTimeout) {
            clearTimeout(hoverTimeout);
          }
        },
      };
    },

    props: {
      /**
       * Handle click events on markers
       */
      handleClickOn(view: EditorView, pos: number, node, nodePos, event) {
        const { target } = event;
        if (!(target instanceof HTMLElement)) {
          return false;
        }

        // Check if clicked on a footnote or endnote marker
        const isFootnote = target.classList.contains('footnote-marker');
        const isEndnote = target.classList.contains('endnote-marker');

        if (isFootnote || isEndnote) {
          const noteId = target.getAttribute('data-note-id');
          if (noteId) {
            jumpToNote(noteId, isFootnote ? 'footnote' : 'endnote');
            event.preventDefault();
            return true;
          }
        }

        return false;
      },

      /**
       * Handle DOM events for hover tooltips
       */
      handleDOMEvents: {
        mouseover(view: EditorView, event: MouseEvent) {
          const { target } = event;
          if (!(target instanceof HTMLElement)) {
            return false;
          }

          // Check if hovering over a footnote or endnote marker
          const isFootnote = target.classList.contains('footnote-marker');
          const isEndnote = target.classList.contains('endnote-marker');

          if ((isFootnote || isEndnote) && tooltip) {
            const noteId = target.getAttribute('data-note-id');
            if (noteId) {
              // Clear any existing timeout
              if (hoverTimeout) {
                clearTimeout(hoverTimeout);
              }

              // Show tooltip after a short delay
              hoverTimeout = window.setTimeout(() => {
                const rect = target.getBoundingClientRect();
                showTooltip(
                  tooltip!,
                  rect.left + window.scrollX,
                  rect.bottom + window.scrollY,
                  noteId,
                  isFootnote ? 'footnote' : 'endnote'
                );
              }, 500); // 500ms delay
            }
          }

          return false;
        },

        mouseout(view: EditorView, event: MouseEvent) {
          const { target } = event;
          if (!(target instanceof HTMLElement)) {
            return false;
          }

          // Check if leaving a marker
          const isMarker =
            target.classList.contains('footnote-marker') ||
            target.classList.contains('endnote-marker');

          if (isMarker && tooltip) {
            // Clear hover timeout
            if (hoverTimeout) {
              clearTimeout(hoverTimeout);
              hoverTimeout = null;
            }
            // Hide tooltip
            hideTooltip(tooltip);
          }

          return false;
        },
      },
    },
  });
}
