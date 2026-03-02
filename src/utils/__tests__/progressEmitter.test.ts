import { ProgressEmitter } from '../progressEmitter';
import { ProgressEvent, ProgressMetadata } from '../../types/progress';

describe('ProgressEmitter', () => {
  let emitter: ProgressEmitter;

  beforeEach(() => {
    emitter = new ProgressEmitter();
  });

  afterEach(() => {
    emitter.clear();
  });

  describe('subscribe/unsubscribe', () => {
    it('should subscribe a handler and receive events', () => {
      const handler = jest.fn();
      emitter.subscribe(handler);

      emitter.emit(50);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          progress: 50,
          timestamp: expect.any(Number),
        })
      );
    });

    it('should support multiple subscribers', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const handler3 = jest.fn();

      emitter.subscribe(handler1);
      emitter.subscribe(handler2);
      emitter.subscribe(handler3);

      emitter.emit(75);

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler3).toHaveBeenCalledTimes(1);
    });

    it('should return an unsubscribe function', () => {
      const handler = jest.fn();
      const unsubscribe = emitter.subscribe(handler);

      emitter.emit(25);
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();
      emitter.emit(50);
      expect(handler).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should unsubscribe a handler directly', () => {
      const handler = jest.fn();
      emitter.subscribe(handler);

      expect(emitter.unsubscribe(handler)).toBe(true);
      emitter.emit(50);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should return false when unsubscribing non-existent handler', () => {
      const handler = jest.fn();
      expect(emitter.unsubscribe(handler)).toBe(false);
    });

    it('should throw error when subscribing with non-function', () => {
      expect(() => {
        emitter.subscribe(null as any);
      }).toThrow(TypeError);

      expect(() => {
        emitter.subscribe(undefined as any);
      }).toThrow(TypeError);

      expect(() => {
        emitter.subscribe('not a function' as any);
      }).toThrow(TypeError);
    });

    it('should not add the same handler twice', () => {
      const handler = jest.fn();
      emitter.subscribe(handler);
      emitter.subscribe(handler); // Add same handler again

      emitter.emit(50);

      expect(handler).toHaveBeenCalledTimes(1); // Called only once
    });
  });

  describe('emit', () => {
    it('should emit progress with valid percentage', () => {
      const handler = jest.fn();
      emitter.subscribe(handler);

      emitter.emit(0);
      emitter.emit(50);
      emitter.emit(100);

      expect(handler).toHaveBeenCalledTimes(3);
    });

    it('should include metadata in emitted event', () => {
      const handler = jest.fn();
      emitter.subscribe(handler);

      const metadata: ProgressMetadata = {
        currentItem: 'Chapter 3',
        totalItems: 10,
        statusMessage: 'Processing chapter',
      };

      emitter.emit(50, metadata);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          progress: 50,
          metadata,
        })
      );
    });

    it('should throw error for invalid progress values', () => {
      expect(() => emitter.emit(-1)).toThrow(RangeError);
      expect(() => emitter.emit(101)).toThrow(RangeError);
      expect(() => emitter.emit(NaN)).toThrow(TypeError);
      expect(() => emitter.emit('50' as any)).toThrow(TypeError);
    });

    it('should handle errors in handlers gracefully', () => {
      const errorHandler = jest.fn(() => {
        throw new Error('Handler error');
      });
      const normalHandler = jest.fn();

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      emitter.subscribe(errorHandler);
      emitter.subscribe(normalHandler);

      emitter.emit(50);

      expect(errorHandler).toHaveBeenCalled();
      expect(normalHandler).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should include timestamp in event', () => {
      const handler = jest.fn();
      emitter.subscribe(handler);

      const beforeTimestamp = Date.now();
      emitter.emit(50);
      const afterTimestamp = Date.now();

      const event: ProgressEvent = handler.mock.calls[0][0];
      expect(event.timestamp).toBeGreaterThanOrEqual(beforeTimestamp);
      expect(event.timestamp).toBeLessThanOrEqual(afterTimestamp);
    });
  });

  describe('getState', () => {
    it('should return initial state', () => {
      const state = emitter.getState();

      expect(state).toEqual({
        currentProgress: 0,
        currentMetadata: undefined,
        isComplete: false,
      });
    });

    it('should return current state after emit', () => {
      const metadata: ProgressMetadata = {
        statusMessage: 'Processing',
      };

      emitter.emit(50, metadata);

      const state = emitter.getState();
      expect(state).toEqual({
        currentProgress: 50,
        currentMetadata: metadata,
        isComplete: false,
      });
    });

    it('should mark as complete when progress reaches 100', () => {
      emitter.emit(100);

      const state = emitter.getState();
      expect(state.isComplete).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset progress to initial state', () => {
      emitter.emit(75, { statusMessage: 'Processing' });
      expect(emitter.getState().currentProgress).toBe(75);

      emitter.reset();

      const state = emitter.getState();
      expect(state).toEqual({
        currentProgress: 0,
        currentMetadata: undefined,
        isComplete: false,
      });
    });

    it('should not affect subscribers', () => {
      const handler = jest.fn();
      emitter.subscribe(handler);

      emitter.emit(50);
      emitter.reset();
      emitter.emit(25);

      expect(handler).toHaveBeenCalledTimes(2);
    });
  });

  describe('clear', () => {
    it('should remove all subscribers', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      emitter.subscribe(handler1);
      emitter.subscribe(handler2);

      expect(emitter.getSubscriberCount()).toBe(2);

      emitter.clear();

      expect(emitter.getSubscriberCount()).toBe(0);

      emitter.emit(50);
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('getSubscriberCount', () => {
    it('should return correct subscriber count', () => {
      expect(emitter.getSubscriberCount()).toBe(0);

      const handler1 = jest.fn();
      const handler2 = jest.fn();

      emitter.subscribe(handler1);
      expect(emitter.getSubscriberCount()).toBe(1);

      emitter.subscribe(handler2);
      expect(emitter.getSubscriberCount()).toBe(2);

      emitter.unsubscribe(handler1);
      expect(emitter.getSubscriberCount()).toBe(1);
    });
  });

  describe('isProgressComplete', () => {
    it('should return false initially', () => {
      expect(emitter.isProgressComplete()).toBe(false);
    });

    it('should return false for progress < 100', () => {
      emitter.emit(99);
      expect(emitter.isProgressComplete()).toBe(false);
    });

    it('should return true when progress is 100', () => {
      emitter.emit(100);
      expect(emitter.isProgressComplete()).toBe(true);
    });

    it('should return false after reset', () => {
      emitter.emit(100);
      expect(emitter.isProgressComplete()).toBe(true);

      emitter.reset();
      expect(emitter.isProgressComplete()).toBe(false);
    });
  });

  describe('emitProgress', () => {
    it('should calculate progress based on item index and total', () => {
      const handler = jest.fn();
      emitter.subscribe(handler);

      emitter.emitProgress(0, 4); // First of 4 items = 25%
      expect(handler).toHaveBeenLastCalledWith(
        expect.objectContaining({
          progress: 25,
          metadata: expect.objectContaining({
            currentItemIndex: 0,
            totalItems: 4,
          }),
        })
      );

      emitter.emitProgress(1, 4); // Second of 4 items = 50%
      expect(handler).toHaveBeenLastCalledWith(
        expect.objectContaining({
          progress: 50,
        })
      );

      emitter.emitProgress(3, 4); // Fourth of 4 items = 100%
      expect(handler).toHaveBeenLastCalledWith(
        expect.objectContaining({
          progress: 100,
        })
      );
    });

    it('should include additional metadata', () => {
      const handler = jest.fn();
      emitter.subscribe(handler);

      const metadata: ProgressMetadata = {
        currentItem: 'Chapter 1',
        statusMessage: 'Processing',
      };

      emitter.emitProgress(0, 10, metadata);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          progress: 10,
          metadata: expect.objectContaining({
            currentItem: 'Chapter 1',
            statusMessage: 'Processing',
            currentItemIndex: 0,
            totalItems: 10,
          }),
        })
      );
    });

    it('should throw error for invalid total', () => {
      expect(() => emitter.emitProgress(0, 0)).toThrow(RangeError);
      expect(() => emitter.emitProgress(0, -1)).toThrow(RangeError);
    });

    it('should handle edge cases correctly', () => {
      const handler = jest.fn();
      emitter.subscribe(handler);

      // Single item
      emitter.emitProgress(0, 1);
      expect(handler).toHaveBeenLastCalledWith(
        expect.objectContaining({
          progress: 100,
        })
      );

      // Large number of items
      emitter.emitProgress(99, 100);
      expect(handler).toHaveBeenLastCalledWith(
        expect.objectContaining({
          progress: 100,
        })
      );
    });

    it('should round progress to nearest integer', () => {
      const handler = jest.fn();
      emitter.subscribe(handler);

      emitter.emitProgress(0, 3); // 33.33... should round to 33
      expect(handler).toHaveBeenLastCalledWith(
        expect.objectContaining({
          progress: 33,
        })
      );
    });
  });

  describe('integration scenarios', () => {
    it('should support real-world file processing scenario', () => {
      const handler = jest.fn();
      emitter.subscribe(handler);

      const files = ['file1.txt', 'file2.txt', 'file3.txt', 'file4.txt', 'file5.txt'];

      files.forEach((file, index) => {
        emitter.emitProgress(index, files.length, {
          currentItem: file,
          statusMessage: `Processing ${file}`,
        });
      });

      expect(handler).toHaveBeenCalledTimes(5);
      expect(handler).toHaveBeenLastCalledWith(
        expect.objectContaining({
          progress: 100,
          metadata: expect.objectContaining({
            currentItem: 'file5.txt',
            statusMessage: 'Processing file5.txt',
          }),
        })
      );
    });

    it('should support multiple operations with reset', () => {
      const handler = jest.fn();
      emitter.subscribe(handler);

      // First operation
      emitter.emit(50, { statusMessage: 'First operation' });
      expect(emitter.getState().currentProgress).toBe(50);

      // Reset and start second operation
      emitter.reset();
      expect(emitter.getState().currentProgress).toBe(0);

      emitter.emit(75, { statusMessage: 'Second operation' });
      expect(emitter.getState().currentProgress).toBe(75);

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should support dynamic subscriber management', () => {
      const events: ProgressEvent[] = [];

      const handler1 = (event: ProgressEvent) => events.push(event);
      const handler2 = jest.fn();

      // Start with handler1
      const unsubscribe1 = emitter.subscribe(handler1);
      emitter.emit(25);

      // Add handler2
      emitter.subscribe(handler2);
      emitter.emit(50);

      // Remove handler1
      unsubscribe1();
      emitter.emit(75);

      expect(events).toHaveLength(2); // handler1 got 2 events
      expect(handler2).toHaveBeenCalledTimes(2); // handler2 got 2 events
    });
  });
});
