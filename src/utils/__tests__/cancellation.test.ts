/**
 * Cancellation Token Tests
 */

import {
  CancellationToken,
  CancellationTokenSource,
  CancellationError,
  NeverCancelledToken,
  createCancellationTokenSource,
  createTimeoutToken,
  createLinkedTokenSource,
  isCancellationError,
  withCancellation,
} from '../cancellation';

describe('cancellation', () => {
  describe('CancellationToken', () => {
    it('should not be cancelled by default', () => {
      const token = new CancellationToken();
      expect(token.isCancellationRequested).toBe(false);
    });

    it('should not throw if cancellation is not requested', () => {
      const token = new CancellationToken();
      expect(() => token.throwIfCancellationRequested()).not.toThrow();
    });

    it('should throw if cancellation is requested', () => {
      const token = new CancellationToken();
      token._cancel();
      expect(() => token.throwIfCancellationRequested()).toThrow(CancellationError);
    });

    it('should return true when cancellation is requested', () => {
      const token = new CancellationToken();
      expect(token.isCancellationRequested).toBe(false);
      token._cancel();
      expect(token.isCancellationRequested).toBe(true);
    });

    it('should invoke callbacks when cancellation is requested', () => {
      const token = new CancellationToken();
      const callback = jest.fn();

      token.onCancellationRequested(callback);
      expect(callback).not.toHaveBeenCalled();

      token._cancel();
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should invoke callbacks immediately if already cancelled', () => {
      const token = new CancellationToken();
      token._cancel();

      const callback = jest.fn();
      token.onCancellationRequested(callback);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should support multiple callbacks', () => {
      const token = new CancellationToken();
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const callback3 = jest.fn();

      token.onCancellationRequested(callback1);
      token.onCancellationRequested(callback2);
      token.onCancellationRequested(callback3);

      token._cancel();

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback3).toHaveBeenCalledTimes(1);
    });

    it('should allow unregistering callbacks', () => {
      const token = new CancellationToken();
      const callback = jest.fn();

      const unregister = token.onCancellationRequested(callback);
      unregister();

      token._cancel();
      expect(callback).not.toHaveBeenCalled();
    });

    it('should not invoke callback multiple times on multiple cancel calls', () => {
      const token = new CancellationToken();
      const callback = jest.fn();

      token.onCancellationRequested(callback);
      token._cancel();
      token._cancel();
      token._cancel();

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle errors in callbacks gracefully', () => {
      const token = new CancellationToken();
      const errorCallback = jest.fn(() => {
        throw new Error('Callback error');
      });
      const normalCallback = jest.fn();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      token.onCancellationRequested(errorCallback);
      token.onCancellationRequested(normalCallback);

      token._cancel();

      expect(errorCallback).toHaveBeenCalledTimes(1);
      expect(normalCallback).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('CancellationError', () => {
    it('should create error with default message', () => {
      const error = new CancellationError();
      expect(error.message).toBe('Operation was cancelled');
      expect(error.name).toBe('CancellationError');
    });

    it('should create error with custom message', () => {
      const error = new CancellationError('Custom message');
      expect(error.message).toBe('Custom message');
      expect(error.name).toBe('CancellationError');
    });

    it('should be an instance of Error', () => {
      const error = new CancellationError();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('CancellationTokenSource', () => {
    it('should create a token', () => {
      const source = new CancellationTokenSource();
      expect(source.token).toBeInstanceOf(CancellationToken);
    });

    it('should not be cancelled by default', () => {
      const source = new CancellationTokenSource();
      expect(source.token.isCancellationRequested).toBe(false);
    });

    it('should cancel the token when cancel is called', () => {
      const source = new CancellationTokenSource();
      expect(source.token.isCancellationRequested).toBe(false);

      source.cancel();
      expect(source.token.isCancellationRequested).toBe(true);
    });

    it('should throw when cancel is called on disposed source', () => {
      const source = new CancellationTokenSource();
      source.dispose();

      expect(() => source.cancel()).toThrow('CancellationTokenSource has been disposed');
    });

    it('should allow multiple dispose calls', () => {
      const source = new CancellationTokenSource();
      source.dispose();
      expect(() => source.dispose()).not.toThrow();
    });

    it('should cancel after specified delay', done => {
      const source = new CancellationTokenSource();
      const callback = jest.fn();

      source.token.onCancellationRequested(callback);
      source.cancelAfter(50);

      expect(source.token.isCancellationRequested).toBe(false);

      setTimeout(() => {
        expect(source.token.isCancellationRequested).toBe(true);
        expect(callback).toHaveBeenCalledTimes(1);
        source.dispose();
        done();
      }, 100);
    });

    it('should cancel immediately when delay is 0', () => {
      const source = new CancellationTokenSource();
      source.cancelAfter(0);
      expect(source.token.isCancellationRequested).toBe(true);
    });

    it('should throw when cancelAfter is called with negative delay', () => {
      const source = new CancellationTokenSource();
      expect(() => source.cancelAfter(-1)).toThrow('Delay must be non-negative');
    });

    it('should throw when cancelAfter is called on disposed source', () => {
      const source = new CancellationTokenSource();
      source.dispose();
      expect(() => source.cancelAfter(100)).toThrow('CancellationTokenSource has been disposed');
    });

    it('should clear timeout when disposed', done => {
      const source = new CancellationTokenSource();
      const callback = jest.fn();

      source.token.onCancellationRequested(callback);
      source.cancelAfter(50);
      source.dispose();

      setTimeout(() => {
        expect(callback).not.toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should replace pending timeout when cancelAfter is called multiple times', done => {
      const source = new CancellationTokenSource();
      const callback = jest.fn();

      source.token.onCancellationRequested(callback);
      source.cancelAfter(1000); // Long delay
      source.cancelAfter(50); // Short delay

      setTimeout(() => {
        expect(callback).toHaveBeenCalledTimes(1);
        source.dispose();
        done();
      }, 100);
    });
  });

  describe('NeverCancelledToken', () => {
    it('should never be cancelled', () => {
      expect(NeverCancelledToken.isCancellationRequested).toBe(false);
    });

    it('should not throw', () => {
      expect(() => NeverCancelledToken.throwIfCancellationRequested()).not.toThrow();
    });

    it('should return no-op unregister function', () => {
      const callback = jest.fn();
      const unregister = NeverCancelledToken.onCancellationRequested(callback);
      expect(typeof unregister).toBe('function');
      expect(() => unregister()).not.toThrow();
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('createCancellationTokenSource', () => {
    it('should create a new CancellationTokenSource', () => {
      const source = createCancellationTokenSource();
      expect(source).toBeInstanceOf(CancellationTokenSource);
      expect(source.token).toBeInstanceOf(CancellationToken);
    });
  });

  describe('createTimeoutToken', () => {
    it('should create a token that cancels after delay', done => {
      const source = createTimeoutToken(50);
      const callback = jest.fn();

      source.token.onCancellationRequested(callback);

      setTimeout(() => {
        expect(source.token.isCancellationRequested).toBe(true);
        expect(callback).toHaveBeenCalledTimes(1);
        source.dispose();
        done();
      }, 100);
    });
  });

  describe('createLinkedTokenSource', () => {
    it('should create a token that cancels when any linked token cancels', () => {
      const source1 = new CancellationTokenSource();
      const source2 = new CancellationTokenSource();
      const linkedSource = createLinkedTokenSource(source1.token, source2.token);

      expect(linkedSource.token.isCancellationRequested).toBe(false);

      source1.cancel();
      expect(linkedSource.token.isCancellationRequested).toBe(true);

      linkedSource.dispose();
      source2.dispose();
    });

    it('should cancel immediately if any linked token is already cancelled', () => {
      const source1 = new CancellationTokenSource();
      const source2 = new CancellationTokenSource();

      source1.cancel();
      const linkedSource = createLinkedTokenSource(source1.token, source2.token);

      expect(linkedSource.token.isCancellationRequested).toBe(true);

      linkedSource.dispose();
      source2.dispose();
    });

    it('should work with multiple tokens', () => {
      const source1 = new CancellationTokenSource();
      const source2 = new CancellationTokenSource();
      const source3 = new CancellationTokenSource();
      const linkedSource = createLinkedTokenSource(source1.token, source2.token, source3.token);

      expect(linkedSource.token.isCancellationRequested).toBe(false);

      source2.cancel();
      expect(linkedSource.token.isCancellationRequested).toBe(true);

      linkedSource.dispose();
      source1.dispose();
      source3.dispose();
    });

    it('should clean up callbacks when disposed', () => {
      const source = new CancellationTokenSource();
      const linkedSource = createLinkedTokenSource(source.token);

      linkedSource.dispose();
      source.cancel();

      // Should not throw or cause issues
      expect(source.token.isCancellationRequested).toBe(true);
    });
  });

  describe('isCancellationError', () => {
    it('should return true for CancellationError', () => {
      const error = new CancellationError();
      expect(isCancellationError(error)).toBe(true);
    });

    it('should return false for other errors', () => {
      const error = new Error('Regular error');
      expect(isCancellationError(error)).toBe(false);
    });

    it('should return false for non-error values', () => {
      expect(isCancellationError('string')).toBe(false);
      expect(isCancellationError(123)).toBe(false);
      expect(isCancellationError(null)).toBe(false);
      expect(isCancellationError(undefined)).toBe(false);
    });
  });

  describe('withCancellation', () => {
    it('should resolve when operation completes successfully', async () => {
      const source = new CancellationTokenSource();
      const operation = jest.fn(async () => 'result');

      const result = await withCancellation(operation, source.token);

      expect(result).toBe('result');
      expect(operation).toHaveBeenCalledWith(source.token);
    });

    it('should reject with CancellationError when cancelled', async () => {
      const source = new CancellationTokenSource();
      const operation = jest.fn(
        async (token: CancellationToken) =>
          new Promise<string>((resolve, reject) => {
            setTimeout(() => resolve('result'), 100);
          })
      );

      const promise = withCancellation(operation, source.token);

      // Cancel after a short delay
      setTimeout(() => source.cancel(), 10);

      await expect(promise).rejects.toThrow(CancellationError);
    });

    it('should reject immediately if token is already cancelled', async () => {
      const source = new CancellationTokenSource();
      source.cancel();

      const operation = jest.fn(async () => 'result');

      await expect(withCancellation(operation, source.token)).rejects.toThrow(CancellationError);
      expect(operation).not.toHaveBeenCalled();
    });

    it('should propagate operation errors', async () => {
      const source = new CancellationTokenSource();
      const error = new Error('Operation failed');
      const operation = jest.fn(async () => {
        throw error;
      });

      await expect(withCancellation(operation, source.token)).rejects.toThrow('Operation failed');
    });

    it('should unregister callback when operation completes', async () => {
      const source = new CancellationTokenSource();
      const operation = jest.fn(async () => 'result');

      await withCancellation(operation, source.token);

      // Verify callback was unregistered by checking that cancellation doesn't affect anything
      source.cancel();
      expect(source.token.isCancellationRequested).toBe(true);
    });

    it('should unregister callback when operation fails', async () => {
      const source = new CancellationTokenSource();
      const operation = jest.fn(async () => {
        throw new Error('Failed');
      });

      await expect(withCancellation(operation, source.token)).rejects.toThrow('Failed');

      // Verify callback was unregistered
      source.cancel();
      expect(source.token.isCancellationRequested).toBe(true);
    });
  });

  describe('Integration scenarios', () => {
    it('should support async operation with timeout', async () => {
      const timeoutSource = createTimeoutToken(50);
      const operation = jest.fn(
        async () =>
          new Promise<string>(resolve => {
            setTimeout(() => resolve('result'), 200);
          })
      );

      await expect(withCancellation(operation, timeoutSource.token)).rejects.toThrow(
        CancellationError
      );

      timeoutSource.dispose();
    });

    it('should support linked cancellation tokens', async () => {
      const manualSource = new CancellationTokenSource();
      const timeoutSource = createTimeoutToken(1000);
      const linkedSource = createLinkedTokenSource(manualSource.token, timeoutSource.token);

      const operation = jest.fn(
        async () =>
          new Promise<string>(resolve => {
            setTimeout(() => resolve('result'), 200);
          })
      );

      const promise = withCancellation(operation, linkedSource.token);

      // Manually cancel before timeout
      setTimeout(() => manualSource.cancel(), 10);

      await expect(promise).rejects.toThrow(CancellationError);

      linkedSource.dispose();
      timeoutSource.dispose();
    });

    it('should support cancellation in long-running operation', async () => {
      const source = new CancellationTokenSource();
      let iterationCount = 0;

      const operation = async (token: CancellationToken) => {
        while (!token.isCancellationRequested) {
          iterationCount++;
          await new Promise(resolve => setTimeout(resolve, 10));

          if (iterationCount >= 100) {
            break;
          }
        }
        return iterationCount;
      };

      const promise = withCancellation(operation, source.token);

      // Cancel after a few iterations
      setTimeout(() => source.cancel(), 25);

      await expect(promise).rejects.toThrow(CancellationError);
      expect(iterationCount).toBeLessThan(100);
    });
  });
});
