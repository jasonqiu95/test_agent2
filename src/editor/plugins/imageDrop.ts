/**
 * ProseMirror plugin for drag-and-drop image upload
 * Handles drag events, validates image files, and inserts images at drop position
 */

import { Plugin, EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema } from 'prosemirror-model';
import { validateImageFile, uploadImage, ImageUploadOptions } from '../utils/imageUpload';
import { insertImageFromUpload } from '../commands/insertImage';

/**
 * Options for the image drop plugin
 */
export interface ImageDropPluginOptions extends ImageUploadOptions {
  /**
   * Whether to show a drop indicator during drag-over (default: true)
   */
  showDropIndicator?: boolean;

  /**
   * Custom class name for the drop indicator
   */
  dropIndicatorClass?: string;

  /**
   * Callback when a file is dropped but rejected (e.g., wrong type)
   */
  onDropRejected?: (reason: string) => void;
}

/**
 * Plugin state for tracking drag-drop status
 */
interface ImageDropPluginState {
  dragging: boolean;
  dropPos: number | null;
}

/**
 * Default drop indicator class
 */
const DEFAULT_DROP_INDICATOR_CLASS = 'pm-drop-indicator';

/**
 * Check if a DataTransfer contains image files
 */
function containsImageFiles(dataTransfer: DataTransfer): boolean {
  if (!dataTransfer.files || dataTransfer.files.length === 0) {
    return false;
  }

  // Check if any file is an image
  for (let i = 0; i < dataTransfer.files.length; i++) {
    const file = dataTransfer.files[i];
    if (file.type.startsWith('image/')) {
      return true;
    }
  }

  return false;
}

/**
 * Get the first valid image file from DataTransfer
 */
function getFirstImageFile(dataTransfer: DataTransfer): File | null {
  if (!dataTransfer.files || dataTransfer.files.length === 0) {
    return null;
  }

  for (let i = 0; i < dataTransfer.files.length; i++) {
    const file = dataTransfer.files[i];
    if (file.type.startsWith('image/')) {
      return file;
    }
  }

  return null;
}

/**
 * Add drop indicator CSS to the document
 */
function addDropIndicatorStyles(className: string): void {
  // Check if styles already exist
  if (document.getElementById('pm-drop-indicator-styles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'pm-drop-indicator-styles';
  style.textContent = `
    .${className} {
      position: relative;
    }
    .${className}::before {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      height: 2px;
      background-color: #4a90e2;
      pointer-events: none;
      z-index: 10;
      animation: pulse 1s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Add drop indicator decoration to the editor
 */
function addDropIndicator(view: EditorView, pos: number, className: string): void {
  // Remove existing indicators
  removeDropIndicator(view, className);

  // Find the DOM node at the position
  const domPos = view.domAtPos(pos);
  const node = domPos.node;

  // Add class to the closest element node
  let element: HTMLElement | null = null;
  if (node.nodeType === Node.ELEMENT_NODE) {
    element = node as HTMLElement;
  } else if (node.parentElement) {
    element = node.parentElement;
  }

  if (element) {
    element.classList.add(className);
  }
}

/**
 * Remove drop indicator decoration from the editor
 */
function removeDropIndicator(view: EditorView, className: string): void {
  const elements = view.dom.querySelectorAll(`.${className}`);
  elements.forEach((el) => el.classList.remove(className));
}

/**
 * Handle image file upload and insertion
 */
async function handleImageDrop(
  view: EditorView,
  file: File,
  pos: number,
  options: ImageDropPluginOptions
): Promise<void> {
  const { schema, tr } = view.state;

  try {
    // Upload the image
    const result = await uploadImage(file, {
      useBase64: options.useBase64,
      uploadHandler: options.uploadHandler,
      onProgress: options.onProgress,
      onLoadingChange: options.onLoadingChange,
    });

    // Create a new transaction to insert at the drop position
    const insertTr = view.state.tr;

    // Determine alignment (default to 'inline')
    const alignment = 'inline';

    // Create image node
    const imageType = schema.nodes.image;
    if (!imageType) {
      throw new Error('Image node type not found in schema');
    }

    const node = imageType.create({
      src: result.src,
      alt: result.alt,
      width: result.width,
      height: result.height,
      alignment,
    });

    // Insert at drop position
    insertTr.insert(pos, node);

    // Apply transaction
    view.dispatch(insertTr);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upload image';
    console.error('Image drop error:', message);
    options.onDropRejected?.(message);
  }
}

/**
 * Creates the image drop plugin
 *
 * Features:
 * - Shows drop indicator during drag-over
 * - Validates image file types
 * - Handles drop events and uploads images
 * - Inserts images at drop position
 *
 * @param schema - ProseMirror schema
 * @param options - Plugin options
 * @returns ProseMirror plugin
 */
export function createImageDropPlugin(
  schema: Schema,
  options: ImageDropPluginOptions = {}
): Plugin {
  const showDropIndicator = options.showDropIndicator !== false;
  const dropIndicatorClass = options.dropIndicatorClass || DEFAULT_DROP_INDICATOR_CLASS;

  // Add drop indicator styles if enabled
  if (showDropIndicator) {
    addDropIndicatorStyles(dropIndicatorClass);
  }

  return new Plugin({
    state: {
      init(): ImageDropPluginState {
        return {
          dragging: false,
          dropPos: null,
        };
      },
      apply(tr, value): ImageDropPluginState {
        // Reset state if not dragging
        return value;
      },
    },

    props: {
      handleDOMEvents: {
        /**
         * Handle dragover event to show drop indicator
         */
        dragover(view: EditorView, event: Event): boolean {
          const dragEvent = event as DragEvent;

          if (!dragEvent.dataTransfer) {
            return false;
          }

          // Check if dragging contains image files
          const hasImages = containsImageFiles(dragEvent.dataTransfer);
          if (!hasImages) {
            return false;
          }

          // Prevent default to allow drop
          event.preventDefault();

          if (showDropIndicator) {
            // Get drop position
            const pos = view.posAtCoords({
              left: dragEvent.clientX,
              top: dragEvent.clientY,
            });

            if (pos) {
              addDropIndicator(view, pos.pos, dropIndicatorClass);
            }
          }

          return false;
        },

        /**
         * Handle dragleave event to remove drop indicator
         */
        dragleave(view: EditorView, event: Event): boolean {
          const dragEvent = event as DragEvent;

          // Only remove indicator if leaving the editor
          if (
            dragEvent.relatedTarget &&
            view.dom.contains(dragEvent.relatedTarget as Node)
          ) {
            return false;
          }

          if (showDropIndicator) {
            removeDropIndicator(view, dropIndicatorClass);
          }

          return false;
        },

        /**
         * Handle drop event to upload and insert image
         */
        drop(view: EditorView, event: Event): boolean {
          const dropEvent = event as DragEvent;

          if (!dropEvent.dataTransfer) {
            return false;
          }

          // Remove drop indicator
          if (showDropIndicator) {
            removeDropIndicator(view, dropIndicatorClass);
          }

          // Get the first image file
          const file = getFirstImageFile(dropEvent.dataTransfer);
          if (!file) {
            return false;
          }

          // Prevent default behavior
          event.preventDefault();

          // Validate file
          const validation = validateImageFile(file);
          if (!validation.valid) {
            console.error('Invalid image file:', validation.error);
            options.onDropRejected?.(validation.error || 'Invalid image file');
            return true;
          }

          // Show warning if present
          if (validation.warning) {
            console.warn(validation.warning);
          }

          // Get drop position
          const pos = view.posAtCoords({
            left: dropEvent.clientX,
            top: dropEvent.clientY,
          });

          if (!pos) {
            return true;
          }

          // Handle the image upload and insertion
          handleImageDrop(view, file, pos.pos, options);

          return true;
        },
      },
    },
  });
}
