/**
 * ProseMirror command for updating image node size
 * Handles updating width and height attributes of image nodes
 */

import { Command } from 'prosemirror-state';
import { NodeType, ImageAttrs } from '../types';

/**
 * Options for updating image size
 */
export interface UpdateImageSizeOptions {
  /**
   * New width in pixels
   */
  width?: number;

  /**
   * New height in pixels
   */
  height?: number;

  /**
   * Whether to maintain aspect ratio
   */
  maintainAspectRatio?: boolean;

  /**
   * Optional callback when image size is successfully updated
   */
  onUpdate?: (attrs: ImageAttrs) => void;
}

/**
 * Update the size of an image node at a specific position
 *
 * @param pos - Position of the image node in the document
 * @param options - Size update options
 * @returns ProseMirror command
 */
export function updateImageSize(
  pos: number,
  options: UpdateImageSizeOptions
): Command {
  return (state, dispatch) => {
    const node = state.doc.nodeAt(pos);

    // Verify this is an image node
    if (!node || node.type.name !== NodeType.IMAGE) {
      return false;
    }

    if (!dispatch) {
      return true;
    }

    const currentAttrs = node.attrs as ImageAttrs;
    let { width, height } = options;

    // If maintaining aspect ratio and only one dimension is provided
    if (options.maintainAspectRatio && width && !height) {
      const currentWidth = currentAttrs.width;
      const currentHeight = currentAttrs.height;
      if (currentWidth && currentHeight) {
        const aspectRatio = currentWidth / currentHeight;
        height = Math.round(width / aspectRatio);
      }
    } else if (options.maintainAspectRatio && height && !width) {
      const currentWidth = currentAttrs.width;
      const currentHeight = currentAttrs.height;
      if (currentWidth && currentHeight) {
        const aspectRatio = currentWidth / currentHeight;
        width = Math.round(height * aspectRatio);
      }
    }

    // Create new attributes with updated dimensions
    const newAttrs: ImageAttrs = {
      ...currentAttrs,
      width: width !== undefined ? width : currentAttrs.width,
      height: height !== undefined ? height : currentAttrs.height,
    };

    // Create transaction to update node attributes
    const tr = state.tr.setNodeMarkup(pos, undefined, newAttrs);

    dispatch(tr);

    // Call success callback
    if (options.onUpdate) {
      options.onUpdate(newAttrs);
    }

    return true;
  };
}

/**
 * Update image dimensions while maintaining aspect ratio
 *
 * @param pos - Position of the image node
 * @param width - New width in pixels
 * @returns ProseMirror command
 */
export function updateImageWidth(pos: number, width: number): Command {
  return updateImageSize(pos, {
    width,
    maintainAspectRatio: true,
  });
}

/**
 * Update image dimensions while maintaining aspect ratio
 *
 * @param pos - Position of the image node
 * @param height - New height in pixels
 * @returns ProseMirror command
 */
export function updateImageHeight(pos: number, height: number): Command {
  return updateImageSize(pos, {
    height,
    maintainAspectRatio: true,
  });
}

/**
 * Reset image to its natural dimensions
 *
 * @param pos - Position of the image node
 * @param naturalWidth - Natural width of the image
 * @param naturalHeight - Natural height of the image
 * @returns ProseMirror command
 */
export function resetImageSize(
  pos: number,
  naturalWidth: number,
  naturalHeight: number
): Command {
  return updateImageSize(pos, {
    width: naturalWidth,
    height: naturalHeight,
  });
}

/**
 * Check if an image node exists at the given position
 *
 * @param state - Editor state
 * @param pos - Position to check
 * @returns Boolean indicating if an image node exists at position
 */
export function hasImageAtPos(state: any, pos: number): boolean {
  const node = state.doc.nodeAt(pos);
  return node !== null && node.type.name === NodeType.IMAGE;
}
