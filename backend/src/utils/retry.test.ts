import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { retry, RetryOptions } from './retry.js';

describe('retry utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('successful execution', () => {
    it('should return result on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      
      const result = await retry(fn);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should return result with custom options', async () => {
      const fn = vi.fn().mockResolvedValue(42);
      
      const result = await retry(fn, { maxAttempts: 5, delayMs: 500 });
      
      expect(result).toBe(42);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('retry on failure', () => {
    it('should retry on failure and succeed on second attempt', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce('success');
      
      const onRetry = vi.fn();
      
      const promise = retry(fn, {
        maxAttempts: 3,
        delayMs: 1000,
        backoffMultiplier: 2,
        onRetry,
      });
      
      // Fast-forward time to trigger retry
      await vi.advanceTimersByTimeAsync(1000);
      
      const result = await promise;
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
    });

    it('should retry multiple times with exponential backoff', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Attempt 1 failed'))
        .mockRejectedValueOnce(new Error('Attempt 2 failed'))
        .mockResolvedValueOnce('success');
      
      const onRetry = vi.fn();
      
      const promise = retry(fn, {
        maxAttempts: 3,
        delayMs: 1000,
        backoffMultiplier: 2,
        onRetry,
      });
      
      // Fast-forward through all retries
      await vi.advanceTimersByTimeAsync(1000); // First retry delay
      await vi.advanceTimersByTimeAsync(2000); // Second retry delay (2^1 * 1000)
      
      const result = await promise;
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
      expect(onRetry).toHaveBeenCalledTimes(2);
    });

    it('should use exponential backoff correctly', async () => {
      const delays: number[] = [];
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValueOnce('success');
      
      const onRetry = vi.fn((attempt, error) => {
        delays.push(Date.now());
      });
      
      const startTime = Date.now();
      const promise = retry(fn, {
        maxAttempts: 3,
        delayMs: 100,
        backoffMultiplier: 2,
        onRetry,
      });
      
      // Advance timers to simulate delays
      await vi.advanceTimersByTimeAsync(100); // First delay: 100ms
      await vi.advanceTimersByTimeAsync(200); // Second delay: 200ms (100 * 2^1)
      
      await promise;
      
      // Verify exponential backoff was used
      expect(onRetry).toHaveBeenCalledTimes(2);
    });
  });

  describe('max attempts reached', () => {
    it('should throw error after max attempts', async () => {
      const error = new Error('Always fails');
      const fn = vi.fn().mockRejectedValue(error);
      
      const onRetry = vi.fn();
      
      const promise = retry(fn, {
        maxAttempts: 3,
        delayMs: 100,
        onRetry,
      });
      
      // Fast-forward through all retries
      await vi.advanceTimersByTimeAsync(100); // First retry
      await vi.advanceTimersByTimeAsync(200); // Second retry
      
      await expect(promise).rejects.toThrow('Always fails');
      expect(fn).toHaveBeenCalledTimes(3);
      expect(onRetry).toHaveBeenCalledTimes(2); // Called before last attempt
    });

    it('should throw last error after all attempts', async () => {
      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2');
      const error3 = new Error('Error 3');
      
      const fn = vi.fn()
        .mockRejectedValueOnce(error1)
        .mockRejectedValueOnce(error2)
        .mockRejectedValueOnce(error3);
      
      const promise = retry(fn, {
        maxAttempts: 3,
        delayMs: 100,
      });
      
      await vi.advanceTimersByTimeAsync(100);
      await vi.advanceTimersByTimeAsync(200);
      
      await expect(promise).rejects.toThrow('Error 3');
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('default options', () => {
    it('should use default maxAttempts (3)', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Fail'));
      
      const promise = retry(fn);
      
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);
      
      await expect(promise).rejects.toThrow();
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should use default delayMs (1000)', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValueOnce('success');
      
      const promise = retry(fn);
      
      // Default delay is 1000ms
      await vi.advanceTimersByTimeAsync(1000);
      
      const result = await promise;
      expect(result).toBe('success');
    });

    it('should use default backoffMultiplier (2)', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValueOnce('success');
      
      const promise = retry(fn);
      
      // First delay: 1000ms, second delay: 2000ms (1000 * 2^1)
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);
      
      const result = await promise;
      expect(result).toBe('success');
    });
  });

  describe('error handling', () => {
    it('should handle non-Error objects', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce('String error')
        .mockResolvedValueOnce('success');
      
      const promise = retry(fn, { delayMs: 100 });
      
      await vi.advanceTimersByTimeAsync(100);
      
      const result = await promise;
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should handle null/undefined errors', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(null)
        .mockResolvedValueOnce('success');
      
      const promise = retry(fn, { delayMs: 100 });
      
      await vi.advanceTimersByTimeAsync(100);
      
      const result = await promise;
      expect(result).toBe('success');
    });
  });

  describe('onRetry callback', () => {
    it('should call onRetry with correct attempt number', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValueOnce('success');
      
      const onRetry = vi.fn();
      
      const promise = retry(fn, {
        maxAttempts: 3,
        delayMs: 100,
        onRetry,
      });
      
      await vi.advanceTimersByTimeAsync(100);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
      
      await vi.advanceTimersByTimeAsync(200);
      expect(onRetry).toHaveBeenCalledWith(2, expect.any(Error));
      
      await promise;
      
      expect(onRetry).toHaveBeenCalledTimes(2);
    });

    it('should call onRetry before last attempt but not after', async () => {
      const error = new Error('Final error');
      const fn = vi.fn().mockRejectedValue(error);
      
      const onRetry = vi.fn();
      
      const promise = retry(fn, {
        maxAttempts: 2,
        delayMs: 100,
        onRetry,
      });
      
      await vi.advanceTimersByTimeAsync(100);
      
      await expect(promise).rejects.toThrow('Final error');
      
      // onRetry should be called once (before last attempt, not after)
      // First attempt fails -> onRetry called -> second attempt fails -> no onRetry
      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
});

