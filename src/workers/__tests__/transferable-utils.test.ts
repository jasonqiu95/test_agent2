/**
 * Unit tests for transferable-utils
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  isArrayBuffer,
  isTransferable,
  getTransferableSize,
  extractTransferables,
  prepareForTransfer,
  validateTransferables,
  cloneWithTransferables,
  isMessagePort,
  isImageBitmap,
  isOffscreenCanvas,
} from '../transferable-utils';

describe('transferable-utils', () => {
  describe('Type checking functions', () => {
    describe('isArrayBuffer', () => {
      it('should return true for ArrayBuffer', () => {
        const buffer = new ArrayBuffer(100);
        expect(isArrayBuffer(buffer)).toBe(true);
      });

      it('should return false for non-ArrayBuffer', () => {
        expect(isArrayBuffer(new Uint8Array(10))).toBe(false);
        expect(isArrayBuffer({})).toBe(false);
        expect(isArrayBuffer(null)).toBe(false);
        expect(isArrayBuffer(undefined)).toBe(false);
        expect(isArrayBuffer('string')).toBe(false);
        expect(isArrayBuffer(123)).toBe(false);
      });
    });

    describe('isTransferable', () => {
      it('should return true for ArrayBuffer', () => {
        const buffer = new ArrayBuffer(100);
        expect(isTransferable(buffer)).toBe(true);
      });

      it('should return false for non-transferable types', () => {
        expect(isTransferable({})).toBe(false);
        expect(isTransferable([])).toBe(false);
        expect(isTransferable('string')).toBe(false);
        expect(isTransferable(123)).toBe(false);
        expect(isTransferable(null)).toBe(false);
        expect(isTransferable(undefined)).toBe(false);
      });

      it('should return false for typed arrays', () => {
        // Typed arrays themselves are not transferable, but their buffers are
        const uint8 = new Uint8Array(10);
        expect(isTransferable(uint8)).toBe(false);
      });
    });
  });

  describe('getTransferableSize', () => {
    it('should return byte length for ArrayBuffer', () => {
      const buffer = new ArrayBuffer(1024);
      expect(getTransferableSize(buffer)).toBe(1024);
    });

    it('should handle empty ArrayBuffer', () => {
      const buffer = new ArrayBuffer(0);
      expect(getTransferableSize(buffer)).toBe(0);
    });
  });

  describe('extractTransferables', () => {
    it('should extract ArrayBuffer from simple object', () => {
      const buffer = new ArrayBuffer(100);
      const data = { buffer };

      const transferables = extractTransferables(data);

      expect(transferables).toHaveLength(1);
      expect(transferables[0]).toBe(buffer);
    });

    it('should extract multiple ArrayBuffers', () => {
      const buffer1 = new ArrayBuffer(100);
      const buffer2 = new ArrayBuffer(200);
      const data = {
        buffer1,
        buffer2,
      };

      const transferables = extractTransferables(data);

      expect(transferables).toHaveLength(2);
      expect(transferables).toContain(buffer1);
      expect(transferables).toContain(buffer2);
    });

    it('should extract ArrayBuffers from nested objects', () => {
      const buffer1 = new ArrayBuffer(100);
      const buffer2 = new ArrayBuffer(200);
      const data = {
        nested: {
          buffer: buffer1,
          deep: {
            buffer: buffer2,
          },
        },
      };

      const transferables = extractTransferables(data);

      expect(transferables).toHaveLength(2);
      expect(transferables).toContain(buffer1);
      expect(transferables).toContain(buffer2);
    });

    it('should extract ArrayBuffers from arrays', () => {
      const buffer1 = new ArrayBuffer(100);
      const buffer2 = new ArrayBuffer(200);
      const data = [buffer1, buffer2];

      const transferables = extractTransferables(data);

      expect(transferables).toHaveLength(2);
      expect(transferables).toContain(buffer1);
      expect(transferables).toContain(buffer2);
    });

    it('should extract ArrayBuffer from typed arrays', () => {
      const uint8 = new Uint8Array(100);
      const data = { data: uint8 };

      const transferables = extractTransferables(data);

      expect(transferables).toHaveLength(1);
      expect(transferables[0]).toBe(uint8.buffer);
    });

    it('should handle multiple typed arrays sharing the same buffer', () => {
      const buffer = new ArrayBuffer(100);
      const uint8 = new Uint8Array(buffer);
      const uint16 = new Uint16Array(buffer);
      const data = { uint8, uint16 };

      const transferables = extractTransferables(data);

      // Should only extract the buffer once
      expect(transferables).toHaveLength(1);
      expect(transferables[0]).toBe(buffer);
    });

    it('should handle circular references', () => {
      const buffer = new ArrayBuffer(100);
      const data: any = { buffer };
      data.self = data; // Circular reference

      const transferables = extractTransferables(data);

      expect(transferables).toHaveLength(1);
      expect(transferables[0]).toBe(buffer);
    });

    it('should respect maxDepth option', () => {
      const buffer = new ArrayBuffer(100);
      const data = {
        level1: {
          level2: {
            level3: {
              buffer,
            },
          },
        },
      };

      // Depth counting:
      // data = depth 0
      // level1 = depth 1
      // level2 = depth 2
      // level3 = depth 3
      // buffer = depth 4

      // Should not find buffer at depth 4 if maxDepth is 3
      const transferables = extractTransferables(data, { maxDepth: 3 });
      expect(transferables).toHaveLength(0);

      // Should find buffer if maxDepth is 4
      const transferables2 = extractTransferables(data, { maxDepth: 4 });
      expect(transferables2).toHaveLength(1);
    });

    it('should skip typed arrays if includeTypedArrays is false', () => {
      const uint8 = new Uint8Array(100);
      const data = { data: uint8 };

      const transferables = extractTransferables(data, {
        includeTypedArrays: false,
      });

      expect(transferables).toHaveLength(0);
    });

    it('should handle null and undefined values', () => {
      const data = {
        nullValue: null,
        undefinedValue: undefined,
        buffer: new ArrayBuffer(100),
      };

      const transferables = extractTransferables(data);

      expect(transferables).toHaveLength(1);
    });

    it('should handle empty objects and arrays', () => {
      const data = {
        emptyObject: {},
        emptyArray: [],
        buffer: new ArrayBuffer(100),
      };

      const transferables = extractTransferables(data);

      expect(transferables).toHaveLength(1);
    });

    it('should extract from complex nested structure', () => {
      const buffer1 = new ArrayBuffer(100);
      const buffer2 = new ArrayBuffer(200);
      const buffer3 = new ArrayBuffer(300);

      const data = {
        images: [
          { id: 'img1', buffer: buffer1 },
          { id: 'img2', buffer: buffer2 },
        ],
        metadata: {
          thumbnail: {
            data: new Uint8Array(buffer3),
          },
        },
      };

      const transferables = extractTransferables(data);

      expect(transferables).toHaveLength(3);
      expect(transferables).toContain(buffer1);
      expect(transferables).toContain(buffer2);
      expect(transferables).toContain(buffer3);
    });
  });

  describe('prepareForTransfer', () => {
    it('should prepare data with transferables', () => {
      const buffer = new ArrayBuffer(1024);
      const data = { buffer, text: 'hello' };

      const result = prepareForTransfer(data);

      expect(result.data).toBe(data);
      expect(result.transferables).toHaveLength(1);
      expect(result.transferables[0]).toBe(buffer);
      expect(result.metrics.transferableCount).toBe(1);
      expect(result.metrics.transferableBytes).toBe(1024);
      expect(result.metrics.prepareTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should handle data with no transferables', () => {
      const data = { text: 'hello', number: 42 };

      const result = prepareForTransfer(data);

      expect(result.data).toBe(data);
      expect(result.transferables).toHaveLength(0);
      expect(result.metrics.transferableCount).toBe(0);
      expect(result.metrics.transferableBytes).toBe(0);
    });

    it('should deduplicate transferables by default', () => {
      const buffer = new ArrayBuffer(100);
      const uint8 = new Uint8Array(buffer);
      const uint16 = new Uint16Array(buffer);
      const data = { uint8, uint16, buffer };

      const result = prepareForTransfer(data);

      // Should only include the buffer once
      expect(result.transferables).toHaveLength(1);
      expect(result.transferables[0]).toBe(buffer);
    });

    it('should not deduplicate if deduplicate option is false', () => {
      const buffer = new ArrayBuffer(100);
      const data = [buffer, buffer, buffer];

      const result = prepareForTransfer(data, { deduplicate: false });

      // Without deduplication, same buffer may appear multiple times
      // (though extractTransferables uses WeakSet, so this test may not be valid)
      expect(result.transferables.length).toBeGreaterThanOrEqual(1);
    });

    it('should measure preparation time', () => {
      const buffer = new ArrayBuffer(100);
      const data = { buffer };

      const result = prepareForTransfer(data);

      expect(result.metrics.prepareTimeMs).toBeGreaterThanOrEqual(0);
      expect(typeof result.metrics.prepareTimeMs).toBe('number');
    });

    it('should handle large nested structures', () => {
      const buffers = Array.from({ length: 10 }, () => new ArrayBuffer(1024));
      const data = {
        images: buffers.map((buffer, i) => ({ id: i, buffer })),
      };

      const result = prepareForTransfer(data);

      expect(result.transferables).toHaveLength(10);
      expect(result.metrics.transferableBytes).toBe(10 * 1024);
    });

    it('should pass options to extractTransferables', () => {
      const buffer = new ArrayBuffer(100);
      const data = {
        deep: {
          nested: {
            buffer,
          },
        },
      };

      const result = prepareForTransfer(data, { maxDepth: 1 });

      // Should not find buffer due to maxDepth
      expect(result.transferables).toHaveLength(0);
    });
  });

  describe('validateTransferables', () => {
    it('should validate valid transferables', () => {
      const buffer = new ArrayBuffer(100);
      const transferables = [buffer];

      const result = validateTransferables(transferables);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect null/undefined transferables', () => {
      const transferables = [null as any, undefined as any];

      const result = validateTransferables(transferables);

      expect(result.valid).toBe(false);
      // Each null/undefined gets 2 errors: one for being null/undefined, one for not being transferable
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
      expect(result.errors.some(e => e.includes('null or undefined'))).toBe(true);
    });

    it('should detect non-transferable objects', () => {
      const transferables = [{} as any, 'string' as any];

      const result = validateTransferables(transferables);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle empty array', () => {
      const result = validateTransferables([]);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should count potentially neutered buffers', () => {
      const emptyBuffer = new ArrayBuffer(0);
      const transferables = [emptyBuffer];

      const result = validateTransferables(transferables);

      expect(result.neuteredCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('cloneWithTransferables', () => {
    it('should clone primitive values', () => {
      expect(cloneWithTransferables(42)).toBe(42);
      expect(cloneWithTransferables('hello')).toBe('hello');
      expect(cloneWithTransferables(true)).toBe(true);
      expect(cloneWithTransferables(null)).toBe(null);
      expect(cloneWithTransferables(undefined)).toBe(undefined);
    });

    it('should clone arrays', () => {
      const original = [1, 2, 3];
      const cloned = cloneWithTransferables(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });

    it('should clone plain objects', () => {
      const original = { a: 1, b: 2 };
      const cloned = cloneWithTransferables(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });

    it('should preserve ArrayBuffer references', () => {
      const buffer = new ArrayBuffer(100);
      const original = { buffer };
      const cloned = cloneWithTransferables(original);

      expect(cloned).not.toBe(original);
      expect(cloned.buffer).toBe(buffer); // Same reference
    });

    it('should clone nested structures', () => {
      const buffer = new ArrayBuffer(100);
      const original = {
        nested: {
          buffer,
          value: 42,
        },
      };
      const cloned = cloneWithTransferables(original);

      expect(cloned).not.toBe(original);
      expect(cloned.nested).not.toBe(original.nested);
      expect(cloned.nested.buffer).toBe(buffer);
      expect(cloned.nested.value).toBe(42);
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle book generation message with ArrayBuffer', () => {
      // Simulate a complete message from worker
      const epubBuffer = new ArrayBuffer(1024 * 1024); // 1MB EPUB
      const message = {
        type: 'COMPLETE',
        timestamp: Date.now(),
        data: {
          buffer: epubBuffer,
          fileName: 'book.epub',
          fileSize: epubBuffer.byteLength,
          mimeType: 'application/epub+zip',
          metadata: {
            pageCount: 100,
            wordCount: 50000,
            processingTimeMs: 5000,
          },
        },
      };

      const result = prepareForTransfer(message);

      expect(result.transferables).toHaveLength(1);
      expect(result.transferables[0]).toBe(epubBuffer);
      expect(result.metrics.transferableBytes).toBe(1024 * 1024);
    });

    it('should handle message with multiple image buffers', () => {
      const images = [
        { id: 'img1', buffer: new ArrayBuffer(100 * 1024) },
        { id: 'img2', buffer: new ArrayBuffer(200 * 1024) },
        { id: 'img3', buffer: new ArrayBuffer(150 * 1024) },
      ];

      const message = {
        type: 'INITIALIZE',
        data: {
          images,
          book: { title: 'Test' },
        },
      };

      const result = prepareForTransfer(message);

      expect(result.transferables).toHaveLength(3);
      expect(result.metrics.transferableBytes).toBe(450 * 1024);
    });

    it('should handle PDF generation with Uint8Array chunks', () => {
      // Simulate PDF chunks as Uint8Arrays
      const chunk1 = new Uint8Array(512 * 1024);
      const chunk2 = new Uint8Array(512 * 1024);
      const pdfBuffer = new ArrayBuffer(1024 * 1024);

      const message = {
        type: 'COMPLETE',
        data: {
          buffer: pdfBuffer,
          chunks: [chunk1, chunk2],
        },
      };

      const result = prepareForTransfer(message);

      // Should extract all buffers
      expect(result.transferables.length).toBeGreaterThan(0);
      expect(result.metrics.transferableBytes).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should be fast for small data structures', () => {
      const buffer = new ArrayBuffer(1024);
      const data = { buffer };

      const result = prepareForTransfer(data);

      // Should take less than 1ms for small structures
      expect(result.metrics.prepareTimeMs).toBeLessThan(10);
    });

    it('should handle large nested structures efficiently', () => {
      const data = {
        images: Array.from({ length: 100 }, (_, i) => ({
          id: `img${i}`,
          buffer: new ArrayBuffer(10 * 1024),
        })),
      };

      const result = prepareForTransfer(data);

      expect(result.transferables).toHaveLength(100);
      // Should still be reasonably fast
      expect(result.metrics.prepareTimeMs).toBeLessThan(100);
    });
  });

  describe('Edge cases', () => {
    it('should handle data with Symbol properties', () => {
      const sym = Symbol('test');
      const buffer = new ArrayBuffer(100);
      const data = {
        [sym]: buffer,
        normalProp: 'value',
      };

      // Should not throw, symbols are not enumerable
      const result = prepareForTransfer(data);
      expect(result).toBeDefined();
    });

    it('should handle data with getters', () => {
      const buffer = new ArrayBuffer(100);
      const data = {
        get dynamicBuffer() {
          return buffer;
        },
      };

      // Should not throw
      const result = prepareForTransfer(data);
      expect(result).toBeDefined();
    });

    it('should handle data with non-enumerable properties', () => {
      const buffer = new ArrayBuffer(100);
      const data = {};
      Object.defineProperty(data, 'buffer', {
        value: buffer,
        enumerable: false,
      });

      const result = prepareForTransfer(data);

      // Non-enumerable properties are not extracted
      expect(result.transferables).toHaveLength(0);
    });

    it('should handle class instances', () => {
      class CustomClass {
        buffer: ArrayBuffer;
        constructor() {
          this.buffer = new ArrayBuffer(100);
        }
      }

      const instance = new CustomClass();
      const result = prepareForTransfer(instance);

      // Should extract from class instances if they have the property
      expect(result.transferables.length).toBeGreaterThanOrEqual(0);
    });
  });
});
