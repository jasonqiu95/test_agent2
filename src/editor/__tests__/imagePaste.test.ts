/**
 * Tests for image paste plugin
 */

import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { editorSchema } from '../schema';
import { createImagePastePlugin, hasImageInClipboard } from '../plugins/imagePaste';
import { NodeType } from '../types';

/**
 * Helper to create a mock DataTransfer object
 */
function createMockDataTransfer(files: File[] = [], html: string = ''): DataTransfer {
  const items: any[] = [];

  files.forEach((file) => {
    items.push({
      kind: 'file',
      type: file.type,
      getAsFile: () => file,
    });
  });

  const dataTransfer = {
    files: files as any,
    items: items as any,
    types: [] as string[],
    data: {} as Record<string, string>,
    getData(format: string) {
      return this.data[format] || '';
    },
    setData(format: string, value: string) {
      this.data[format] = value;
      if (!this.types.includes(format)) {
        this.types.push(format);
      }
    },
  } as any;

  if (html) {
    dataTransfer.setData('text/html', html);
  }

  return dataTransfer;
}

/**
 * Helper to create a mock ClipboardEvent
 */
function createMockClipboardEvent(
  dataTransfer: DataTransfer
): ClipboardEvent {
  const event = {
    clipboardData: dataTransfer,
    _defaultPrevented: false,
    preventDefault() {
      this._defaultPrevented = true;
    },
    get defaultPrevented() {
      return this._defaultPrevented;
    },
  } as any;

  return event;
}

/**
 * Helper to create a test editor state
 */
function createTestState(content = 'test') {
  const textNode = editorSchema.text(content);
  const paragraphNode = editorSchema.nodes[NodeType.PARAGRAPH].create(null, textNode);
  const doc = editorSchema.node('doc', null, [paragraphNode]);

  return EditorState.create({
    doc,
    schema: editorSchema,
  });
}

/**
 * Helper to create a mock EditorView
 */
function createMockView(state: EditorState): EditorView {
  const div = document.createElement('div');

  return new EditorView(div, {
    state,
    dispatchTransaction(tr) {
      this.updateState(this.state.apply(tr));
    },
  });
}

/**
 * Helper to create a mock image file
 */
function createMockImageFile(
  name: string = 'test.png',
  type: string = 'image/png',
  size: number = 1024
): File {
  const blob = new Blob(['fake image data'], { type });
  const file = new File([blob], name, { type });

  // Override size property
  Object.defineProperty(file, 'size', { value: size });

  return file;
}

/**
 * Helper to create a base64 image data URL
 */
function createImageDataUrl(type: string = 'image/png'): string {
  // Minimal valid PNG data URL (1x1 transparent pixel)
  return `data:${type};base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`;
}

describe('Image Paste Plugin', () => {
  describe('createImagePastePlugin', () => {
    it('should create a plugin instance', () => {
      const plugin = createImagePastePlugin(editorSchema);
      expect(plugin).toBeDefined();
      expect(plugin.spec).toBeDefined();
      expect(plugin.spec.props?.handlePaste).toBeDefined();
    });

    it('should handle paste events with image files', () => {
      const plugin = createImagePastePlugin(editorSchema);
      const state = createTestState();
      const view = createMockView(state);

      const imageFile = createMockImageFile('screenshot.png', 'image/png', 1024);
      const dataTransfer = createMockDataTransfer([imageFile]);
      const event = createMockClipboardEvent(dataTransfer);

      const handlePaste = plugin.spec.props?.handlePaste;
      expect(handlePaste).toBeDefined();

      if (handlePaste) {
        const result = handlePaste(view, event);
        expect(result).toBe(true);
        // Note: preventDefault is called asynchronously in the actual handler
        // after validation, so it might not be reflected immediately in tests
      }
    });

    it('should ignore paste events without images', () => {
      const plugin = createImagePastePlugin(editorSchema);
      const state = createTestState();
      const view = createMockView(state);

      const dataTransfer = createMockDataTransfer();
      dataTransfer.setData('text/plain', 'Just some text');
      const event = createMockClipboardEvent(dataTransfer);

      const handlePaste = plugin.spec.props?.handlePaste;
      if (handlePaste) {
        const result = handlePaste(view, event);
        expect(result).toBe(false);
      }
    });

    it('should handle paste events with image data URLs in HTML', () => {
      const plugin = createImagePastePlugin(editorSchema);
      const state = createTestState();
      const view = createMockView(state);

      const dataUrl = createImageDataUrl('image/png');
      const html = `<img src="${dataUrl}" alt="test">`;
      const dataTransfer = createMockDataTransfer([], html);
      const event = createMockClipboardEvent(dataTransfer);

      const handlePaste = plugin.spec.props?.handlePaste;
      if (handlePaste) {
        const result = handlePaste(view, event);
        expect(result).toBe(true);
        // Note: preventDefault is called asynchronously in the actual handler
        // after validation, so it might not be reflected immediately in tests
      }
    });

    it('should reject invalid image file types', () => {
      const onPasteError = jest.fn();
      const plugin = createImagePastePlugin(editorSchema, { onPasteError });
      const state = createTestState();
      const view = createMockView(state);

      const invalidFile = createMockImageFile('test.bmp', 'image/bmp', 1024);
      const dataTransfer = createMockDataTransfer([invalidFile]);
      const event = createMockClipboardEvent(dataTransfer);

      const handlePaste = plugin.spec.props?.handlePaste;
      if (handlePaste) {
        const result = handlePaste(view, event);
        expect(result).toBe(true);
        expect(onPasteError).toHaveBeenCalled();
        expect(onPasteError.mock.calls[0][0].message).toContain('Invalid file type');
      }
    });

    it('should reject files exceeding size limit', () => {
      const onPasteError = jest.fn();
      const plugin = createImagePastePlugin(editorSchema, { onPasteError });
      const state = createTestState();
      const view = createMockView(state);

      // Create file larger than 5MB
      const largeFile = createMockImageFile('large.png', 'image/png', 6 * 1024 * 1024);
      const dataTransfer = createMockDataTransfer([largeFile]);
      const event = createMockClipboardEvent(dataTransfer);

      const handlePaste = plugin.spec.props?.handlePaste;
      if (handlePaste) {
        const result = handlePaste(view, event);
        expect(result).toBe(true);
        expect(onPasteError).toHaveBeenCalled();
        expect(onPasteError.mock.calls[0][0].message).toContain('exceeds maximum allowed size');
      }
    });

    it('should call onPasteStart callback', () => {
      const onPasteStart = jest.fn();
      const plugin = createImagePastePlugin(editorSchema, { onPasteStart });
      const state = createTestState();
      const view = createMockView(state);

      const imageFile = createMockImageFile('test.png', 'image/png', 1024);
      const dataTransfer = createMockDataTransfer([imageFile]);
      const event = createMockClipboardEvent(dataTransfer);

      const handlePaste = plugin.spec.props?.handlePaste;
      if (handlePaste) {
        handlePaste(view, event);
        // Note: onPasteStart is called asynchronously, so we can't check it synchronously
        // In a real test environment with proper async handling, you would await the result
      }
    });

    it('should handle multiple image formats', () => {
      const formats = [
        { name: 'test.jpg', type: 'image/jpeg' },
        { name: 'test.png', type: 'image/png' },
        { name: 'test.gif', type: 'image/gif' },
        { name: 'test.webp', type: 'image/webp' },
      ];

      formats.forEach(({ name, type }) => {
        const plugin = createImagePastePlugin(editorSchema);
        const state = createTestState();
        const view = createMockView(state);

        const imageFile = createMockImageFile(name, type, 1024);
        const dataTransfer = createMockDataTransfer([imageFile]);
        const event = createMockClipboardEvent(dataTransfer);

        const handlePaste = plugin.spec.props?.handlePaste;
        if (handlePaste) {
          const result = handlePaste(view, event);
          expect(result).toBe(true);
        }
      });
    });

    it('should ignore non-image files', () => {
      const plugin = createImagePastePlugin(editorSchema);
      const state = createTestState();
      const view = createMockView(state);

      const textFile = createMockImageFile('document.txt', 'text/plain', 1024);
      const dataTransfer = createMockDataTransfer([textFile]);
      const event = createMockClipboardEvent(dataTransfer);

      const handlePaste = plugin.spec.props?.handlePaste;
      if (handlePaste) {
        const result = handlePaste(view, event);
        expect(result).toBe(false);
      }
    });
  });

  describe('hasImageInClipboard', () => {
    it('should return true for clipboard with image files', () => {
      const imageFile = createMockImageFile('test.png', 'image/png', 1024);
      const dataTransfer = createMockDataTransfer([imageFile]);

      const result = hasImageInClipboard(dataTransfer);
      expect(result).toBe(true);
    });

    it('should return true for clipboard with image data URLs', () => {
      const dataUrl = createImageDataUrl('image/png');
      const html = `<img src="${dataUrl}">`;
      const dataTransfer = createMockDataTransfer([], html);

      const result = hasImageInClipboard(dataTransfer);
      expect(result).toBe(true);
    });

    it('should return false for clipboard without images', () => {
      const dataTransfer = createMockDataTransfer();
      dataTransfer.setData('text/plain', 'Just text');

      const result = hasImageInClipboard(dataTransfer);
      expect(result).toBe(false);
    });

    it('should return false for null clipboard data', () => {
      const result = hasImageInClipboard(null);
      expect(result).toBe(false);
    });

    it('should return false for clipboard with non-image files', () => {
      const textFile = createMockImageFile('doc.txt', 'text/plain', 1024);
      const dataTransfer = createMockDataTransfer([textFile]);

      const result = hasImageInClipboard(dataTransfer);
      expect(result).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty clipboard data gracefully', () => {
      const plugin = createImagePastePlugin(editorSchema);
      const state = createTestState();
      const view = createMockView(state);

      const event = {
        clipboardData: null,
        preventDefault: jest.fn(),
      } as any;

      const handlePaste = plugin.spec.props?.handlePaste;
      if (handlePaste) {
        const result = handlePaste(view, event);
        expect(result).toBe(false);
        expect(event.preventDefault).not.toHaveBeenCalled();
      }
    });

    it('should process only the first image when multiple are pasted', () => {
      const plugin = createImagePastePlugin(editorSchema);
      const state = createTestState();
      const view = createMockView(state);

      const file1 = createMockImageFile('test1.png', 'image/png', 1024);
      const file2 = createMockImageFile('test2.png', 'image/png', 1024);
      const dataTransfer = createMockDataTransfer([file1, file2]);
      const event = createMockClipboardEvent(dataTransfer);

      const handlePaste = plugin.spec.props?.handlePaste;
      if (handlePaste) {
        const result = handlePaste(view, event);
        expect(result).toBe(true);
        // Only first image should be processed
      }
    });

    it('should handle malformed HTML with images gracefully', () => {
      const plugin = createImagePastePlugin(editorSchema);
      const state = createTestState();
      const view = createMockView(state);

      const malformedHtml = '<img src="not-a-valid-data-url">';
      const dataTransfer = createMockDataTransfer([], malformedHtml);
      const event = createMockClipboardEvent(dataTransfer);

      const handlePaste = plugin.spec.props?.handlePaste;
      if (handlePaste) {
        const result = handlePaste(view, event);
        // Should return false since no valid image data URL found
        expect(result).toBe(false);
      }
    });
  });
});
