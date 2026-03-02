/**
 * Image Upload Utilities
 * Handles file validation, reading, and conversion for image uploads
 */

/**
 * Supported image MIME types
 */
export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

/**
 * Maximum file size in bytes (5MB)
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * File validation result
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
}

/**
 * Image upload result
 */
export interface ImageUploadResult {
  src: string;
  width?: number;
  height?: number;
  alt?: string;
}

/**
 * Image upload options
 */
export interface ImageUploadOptions {
  /**
   * Convert image to base64 data URI (default: true)
   * If false, you'll need to provide a custom upload handler
   */
  useBase64?: boolean;

  /**
   * Custom upload handler for uploading to external storage
   * Should return a URL to the uploaded image
   */
  uploadHandler?: (file: File) => Promise<string>;

  /**
   * Callback for upload progress (0-100)
   */
  onProgress?: (progress: number) => void;

  /**
   * Callback for loading state changes
   */
  onLoadingChange?: (loading: boolean) => void;
}

/**
 * Validate image file
 * Checks file type and size
 */
export function validateImageFile(file: File): FileValidationResult {
  // Check file type
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type as any)) {
    return {
      valid: false,
      error: `Invalid file type. Supported formats: JPG, PNG, GIF, WebP`,
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size (${sizeMB}MB) exceeds maximum allowed size of 5MB`,
    };
  }

  // Warn if file is large (but still within limit)
  if (file.size > MAX_FILE_SIZE * 0.8) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: true,
      warning: `Large file size (${sizeMB}MB). Consider optimizing the image for better performance.`,
    };
  }

  return { valid: true };
}

/**
 * Read image file and convert to base64 data URI
 */
export function readImageAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read file as base64'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Get image dimensions from a file
 */
export function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = src;
  });
}

/**
 * Upload image file and return image data
 *
 * @param file - The image file to upload
 * @param options - Upload options
 * @returns Promise resolving to image upload result
 */
export async function uploadImage(
  file: File,
  options: ImageUploadOptions = {}
): Promise<ImageUploadResult> {
  const {
    useBase64 = true,
    uploadHandler,
    onProgress,
    onLoadingChange,
  } = options;

  // Validate file
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Show warning if present
  if (validation.warning) {
    console.warn(validation.warning);
  }

  try {
    // Set loading state
    onLoadingChange?.(true);
    onProgress?.(0);

    let src: string;

    // Use custom upload handler if provided
    if (uploadHandler && !useBase64) {
      src = await uploadHandler(file);
      onProgress?.(100);
    } else {
      // Convert to base64
      onProgress?.(30);
      src = await readImageAsBase64(file);
      onProgress?.(100);
    }

    // Get image dimensions
    const dimensions = await getImageDimensions(src);

    // Use filename as alt text (remove extension)
    const alt = file.name.replace(/\.[^/.]+$/, '');

    return {
      src,
      width: dimensions.width,
      height: dimensions.height,
      alt,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upload image';
    throw new Error(message);
  } finally {
    onLoadingChange?.(false);
  }
}

/**
 * Create a file input element and trigger file picker
 * Returns selected file or null if cancelled
 */
export function pickImageFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = SUPPORTED_IMAGE_TYPES.join(',');

    input.onchange = () => {
      const file = input.files?.[0];
      resolve(file || null);
    };

    input.oncancel = () => {
      resolve(null);
    };

    // Trigger file picker
    input.click();
  });
}

/**
 * Complete image upload flow: pick file, validate, upload
 *
 * @param options - Upload options
 * @returns Promise resolving to image upload result or null if cancelled
 */
export async function pickAndUploadImage(
  options: ImageUploadOptions = {}
): Promise<ImageUploadResult | null> {
  // Pick file
  const file = await pickImageFile();
  if (!file) {
    return null;
  }

  // Upload file
  try {
    const result = await uploadImage(file, options);
    return result;
  } catch (error) {
    // Re-throw error to be handled by caller
    throw error;
  }
}
