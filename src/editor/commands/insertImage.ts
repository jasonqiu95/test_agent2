/**
 * ProseMirror command for inserting images
 * Handles image upload and insertion at cursor position
 */

import { Command, Selection } from 'prosemirror-state';
import { Schema } from 'prosemirror-model';
import { NodeType, ImageAttrs } from '../types';
import {
  pickAndUploadImage,
  uploadImage,
  ImageUploadOptions,
  ImageUploadResult,
} from '../utils/imageUpload';

/**
 * Options for inserting an image
 */
export interface InsertImageOptions extends ImageUploadOptions {
  /**
   * Image alignment (default: 'inline')
   */
  alignment?: ImageAttrs['alignment'];

  /**
   * Optional callback when image is successfully inserted
   */
  onInsert?: (attrs: ImageAttrs) => void;

  /**
   * Optional callback for errors
   */
  onError?: (error: Error) => void;
}

/**
 * Insert an image node at the current cursor position
 *
 * @param schema - ProseMirror schema
 * @param attrs - Image attributes
 * @returns ProseMirror command
 */
export function insertImageNode(schema: Schema, attrs: ImageAttrs): Command {
  return (state, dispatch) => {
    const imageType = schema.nodes[NodeType.IMAGE];
    if (!imageType) {
      return false;
    }

    if (!dispatch) {
      return true;
    }

    // Create image node
    const node = imageType.create(attrs);

    // Get current selection
    const { $from } = state.selection;

    // Insert at cursor position
    const tr = state.tr.replaceSelectionWith(node);

    // Move cursor after the image
    const pos = tr.selection.$from.pos;
    tr.setSelection(Selection.near(tr.doc.resolve(pos)));

    dispatch(tr);
    return true;
  };
}

/**
 * Insert an image from a URL
 *
 * @param schema - ProseMirror schema
 * @param src - Image URL or data URI
 * @param options - Additional image attributes
 * @returns ProseMirror command
 */
export function insertImageFromUrl(
  schema: Schema,
  src: string,
  options: Partial<ImageAttrs> = {}
): Command {
  const attrs: ImageAttrs = {
    src,
    alignment: options.alignment || 'inline',
    alt: options.alt,
    title: options.title,
    width: options.width,
    height: options.height,
  };

  return insertImageNode(schema, attrs);
}

/**
 * Insert an image from upload result
 *
 * @param schema - ProseMirror schema
 * @param result - Image upload result
 * @param alignment - Image alignment
 * @returns ProseMirror command
 */
export function insertImageFromUpload(
  schema: Schema,
  result: ImageUploadResult,
  alignment: ImageAttrs['alignment'] = 'inline'
): Command {
  const attrs: ImageAttrs = {
    src: result.src,
    alt: result.alt,
    width: result.width,
    height: result.height,
    alignment,
  };

  return insertImageNode(schema, attrs);
}

/**
 * Insert an image with file picker
 * Opens file picker, validates, uploads, and inserts image
 *
 * @param schema - ProseMirror schema
 * @param options - Insert image options
 * @returns Async function that returns a ProseMirror command
 */
export function insertImageWithPicker(
  schema: Schema,
  options: InsertImageOptions = {}
): () => Promise<Command> {
  return async () => {
    try {
      // Pick and upload image
      const result = await pickAndUploadImage({
        useBase64: options.useBase64,
        uploadHandler: options.uploadHandler,
        onProgress: options.onProgress,
        onLoadingChange: options.onLoadingChange,
      });

      // User cancelled
      if (!result) {
        return () => false;
      }

      // Create command to insert image
      const command = insertImageFromUpload(
        schema,
        result,
        options.alignment || 'inline'
      );

      // Call success callback
      if (options.onInsert) {
        const attrs: ImageAttrs = {
          src: result.src,
          alt: result.alt,
          width: result.width,
          height: result.height,
          alignment: options.alignment || 'inline',
        };
        options.onInsert(attrs);
      }

      return command;
    } catch (error) {
      // Call error callback
      const err = error instanceof Error ? error : new Error('Failed to upload image');
      if (options.onError) {
        options.onError(err);
      } else {
        console.error('Image upload error:', err);
      }

      return () => false;
    }
  };
}

/**
 * Insert an image from a File object
 *
 * @param schema - ProseMirror schema
 * @param file - Image file
 * @param options - Insert image options
 * @returns Async function that returns a ProseMirror command
 */
export function insertImageFromFile(
  schema: Schema,
  file: File,
  options: InsertImageOptions = {}
): () => Promise<Command> {
  return async () => {
    try {
      // Upload image
      const result = await uploadImage(file, {
        useBase64: options.useBase64,
        uploadHandler: options.uploadHandler,
        onProgress: options.onProgress,
        onLoadingChange: options.onLoadingChange,
      });

      // Create command to insert image
      const command = insertImageFromUpload(
        schema,
        result,
        options.alignment || 'inline'
      );

      // Call success callback
      if (options.onInsert) {
        const attrs: ImageAttrs = {
          src: result.src,
          alt: result.alt,
          width: result.width,
          height: result.height,
          alignment: options.alignment || 'inline',
        };
        options.onInsert(attrs);
      }

      return command;
    } catch (error) {
      // Call error callback
      const err = error instanceof Error ? error : new Error('Failed to upload image');
      if (options.onError) {
        options.onError(err);
      } else {
        console.error('Image upload error:', err);
      }

      return () => false;
    }
  };
}

/**
 * Check if an image can be inserted at the current position
 *
 * @param state - Editor state
 * @returns Boolean indicating if image insertion is possible
 */
export function canInsertImage(state: any): boolean {
  const imageType = state.schema.nodes[NodeType.IMAGE];
  if (!imageType) {
    return false;
  }

  const { $from } = state.selection;

  // Check if image node can be inserted at this position
  for (let d = $from.depth; d >= 0; d--) {
    const index = $from.index(d);
    if ($from.node(d).canReplaceWith(index, index, imageType)) {
      return true;
    }
  }

  return false;
}

/**
 * Helper to create a simple insert image command
 * that opens a file picker and inserts the selected image
 *
 * Usage in UI:
 * ```typescript
 * const command = createInsertImageCommand(schema, {
 *   onLoadingChange: (loading) => setLoading(loading),
 *   onError: (error) => showError(error.message),
 * });
 *
 * button.onclick = async () => {
 *   const cmd = await command();
 *   cmd(view.state, view.dispatch);
 * };
 * ```
 */
export function createInsertImageCommand(
  schema: Schema,
  options: InsertImageOptions = {}
) {
  return insertImageWithPicker(schema, options);
}
