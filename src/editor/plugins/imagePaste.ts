/**
 * Image Paste Plugin
 * Handles pasting images from clipboard into the editor
 * Supports screenshots, copied images, and image files
 */

import { Plugin } from 'prosemirror-state';
import { Schema } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';
import {
  uploadImage,
  validateImageFile,
  SUPPORTED_IMAGE_TYPES,
  ImageUploadOptions,
} from '../utils/imageUpload';
import { insertImageFromUpload } from '../commands/insertImage';

/**
 * Options for image paste plugin
 */
export interface ImagePasteOptions extends ImageUploadOptions {
  /**
   * Callback when image paste starts
   */
  onPasteStart?: () => void;

  /**
   * Callback when image paste completes successfully
   */
  onPasteSuccess?: (src: string) => void;

  /**
   * Callback when image paste fails
   */
  onPasteError?: (error: Error) => void;
}

/**
 * Extract image files from clipboard data
 *
 * @param clipboardData - Clipboard data from paste event
 * @returns Array of image files found in clipboard
 */
function extractImageFiles(clipboardData: DataTransfer): File[] {
  const files: File[] = [];

  // Check clipboard files
  if (clipboardData.files && clipboardData.files.length > 0) {
    for (let i = 0; i < clipboardData.files.length; i++) {
      const file = clipboardData.files[i];
      // Check if it's an image file
      if (file.type.startsWith('image/')) {
        files.push(file);
      }
    }
  }

  return files;
}

/**
 * Extract image data URLs from clipboard HTML content
 * Handles cases where images are copied as HTML with inline data URLs
 *
 * @param clipboardData - Clipboard data from paste event
 * @returns Array of data URLs found in clipboard HTML
 */
function extractImageDataUrls(clipboardData: DataTransfer): string[] {
  const dataUrls: string[] = [];

  // Check for HTML content with image data URLs
  const html = clipboardData.getData('text/html');
  if (html) {
    // Parse HTML and extract img src attributes with data URLs
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const images = tempDiv.querySelectorAll('img[src^="data:image/"]');

    images.forEach((img) => {
      const src = img.getAttribute('src');
      if (src && src.startsWith('data:image/')) {
        dataUrls.push(src);
      }
    });
  }

  return dataUrls;
}

/**
 * Convert data URL to File object
 *
 * @param dataUrl - Data URL string
 * @param filename - Filename for the created file
 * @returns File object
 */
function dataUrlToFile(dataUrl: string, filename: string = 'pasted-image.png'): File {
  // Extract MIME type and base64 data
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  // Determine file extension from MIME type
  const extension = mime.split('/')[1] || 'png';
  const filenameWithExt = filename.includes('.') ? filename : `${filename}.${extension}`;

  return new File([u8arr], filenameWithExt, { type: mime });
}

/**
 * Validate if data URL is a supported image format
 *
 * @param dataUrl - Data URL to validate
 * @returns Boolean indicating if format is supported
 */
function isValidImageDataUrl(dataUrl: string): boolean {
  if (!dataUrl.startsWith('data:image/')) {
    return false;
  }

  // Extract MIME type from data URL
  const mimeMatch = dataUrl.match(/^data:(image\/[a-zA-Z]+);/);
  if (!mimeMatch) {
    return false;
  }

  const mimeType = mimeMatch[1];
  return SUPPORTED_IMAGE_TYPES.includes(mimeType as any);
}

/**
 * Handle image paste and insert into editor
 *
 * @param view - ProseMirror editor view
 * @param file - Image file to upload and insert
 * @param options - Upload options
 * @returns Promise that resolves when image is inserted
 */
async function handleImagePaste(
  view: EditorView,
  file: File,
  options: ImagePasteOptions = {}
): Promise<void> {
  const { schema, tr } = view.state;

  try {
    // Notify paste start
    options.onPasteStart?.();

    // Upload the image
    const result = await uploadImage(file, {
      useBase64: options.useBase64,
      uploadHandler: options.uploadHandler,
      onProgress: options.onProgress,
      onLoadingChange: options.onLoadingChange,
    });

    // Create insert command
    const command = insertImageFromUpload(schema, result, 'inline');

    // Execute command
    command(view.state, view.dispatch);

    // Notify success
    options.onPasteSuccess?.(result.src);
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Failed to paste image');

    // Notify error
    if (options.onPasteError) {
      options.onPasteError(err);
    } else {
      console.error('Image paste error:', err);
    }
  }
}

/**
 * Creates image paste plugin for ProseMirror
 * Intercepts paste events and handles image data from clipboard
 *
 * Features:
 * - Supports pasting image files from file explorer
 * - Supports pasting screenshots (Cmd+Shift+4 on Mac, etc.)
 * - Supports pasting copied images from web/other apps
 * - Supports pasting images embedded in HTML content
 * - Validates image formats before upload
 * - Reuses existing upload logic
 * - Inserts at cursor position
 *
 * @param schema - ProseMirror schema
 * @param options - Plugin options
 * @returns ProseMirror plugin
 */
export function createImagePastePlugin(
  schema: Schema,
  options: ImagePasteOptions = {}
): Plugin {
  return new Plugin({
    props: {
      handlePaste(view: EditorView, event: ClipboardEvent) {
        // Get clipboard data
        const clipboardData = event.clipboardData;
        if (!clipboardData) {
          return false;
        }

        // Extract image files from clipboard
        const imageFiles = extractImageFiles(clipboardData);

        // Extract image data URLs from clipboard HTML
        const imageDataUrls = extractImageDataUrls(clipboardData);

        // If no images found, let default paste handling occur
        if (imageFiles.length === 0 && imageDataUrls.length === 0) {
          return false;
        }

        // Prevent default paste behavior for images
        event.preventDefault();

        // Handle image files
        if (imageFiles.length > 0) {
          // Process first image file (most common case)
          const file = imageFiles[0];

          // Validate file before attempting upload
          const validation = validateImageFile(file);
          if (!validation.valid) {
            const error = new Error(validation.error || 'Invalid image file');
            if (options.onPasteError) {
              options.onPasteError(error);
            } else {
              console.error('Image validation error:', error.message);
            }
            return true;
          }

          // Show warning if present
          if (validation.warning) {
            console.warn(validation.warning);
          }

          // Handle the paste asynchronously
          handleImagePaste(view, file, options);

          return true;
        }

        // Handle data URLs
        if (imageDataUrls.length > 0) {
          const dataUrl = imageDataUrls[0];

          // Validate data URL format
          if (!isValidImageDataUrl(dataUrl)) {
            const error = new Error('Invalid image format in clipboard');
            if (options.onPasteError) {
              options.onPasteError(error);
            } else {
              console.error('Image validation error:', error.message);
            }
            return true;
          }

          // Convert data URL to File object
          try {
            const file = dataUrlToFile(dataUrl, 'pasted-image');

            // Validate the converted file
            const validation = validateImageFile(file);
            if (!validation.valid) {
              const error = new Error(validation.error || 'Invalid image file');
              if (options.onPasteError) {
                options.onPasteError(error);
              } else {
                console.error('Image validation error:', error.message);
              }
              return true;
            }

            // Show warning if present
            if (validation.warning) {
              console.warn(validation.warning);
            }

            // Handle the paste asynchronously
            handleImagePaste(view, file, options);
          } catch (error) {
            const err = error instanceof Error ? error : new Error('Failed to process image data');
            if (options.onPasteError) {
              options.onPasteError(err);
            } else {
              console.error('Image processing error:', err);
            }
          }

          return true;
        }

        return false;
      },
    },
  });
}

/**
 * Check if clipboard contains image data
 * Useful for enabling/disabling paste UI elements
 *
 * @param clipboardData - Clipboard data from event
 * @returns Boolean indicating if clipboard contains images
 */
export function hasImageInClipboard(clipboardData: DataTransfer | null): boolean {
  if (!clipboardData) {
    return false;
  }

  // Check for image files
  const imageFiles = extractImageFiles(clipboardData);
  if (imageFiles.length > 0) {
    return true;
  }

  // Check for image data URLs
  const imageDataUrls = extractImageDataUrls(clipboardData);
  if (imageDataUrls.length > 0) {
    return true;
  }

  return false;
}
