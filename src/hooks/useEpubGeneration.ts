/**
 * useEpubGeneration Hook
 *
 * React hook for managing EPUB generation in components.
 * Handles worker lifecycle, progress tracking, and state management.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  EpubGenerationService,
  saveEpubFile,
  EpubGenerationProgress,
  EpubGenerationError,
  EpubGenerationComplete,
} from '../services/epub-generation';
import type { Book } from '../types/book';
import type { BookStyle } from '../types/style';
import type { ImageData } from '../workers/types';
import type { InitializeMessage } from '../workers/types';

/**
 * State of EPUB generation
 */
export type EpubGenerationState = 'idle' | 'initializing' | 'generating' | 'completed' | 'error';

/**
 * EPUB generation hook state
 */
export interface UseEpubGenerationState {
  state: EpubGenerationState;
  progress: EpubGenerationProgress | null;
  error: EpubGenerationError | null;
  result: EpubGenerationComplete | null;
  isGenerating: boolean;
}

/**
 * EPUB generation hook actions
 */
export interface UseEpubGenerationActions {
  generate: (
    book: Book,
    styles: BookStyle[],
    images?: ImageData[],
    options?: InitializeMessage['data']['options']
  ) => Promise<void>;
  cancel: (reason?: string) => void;
  reset: () => void;
  saveFile: () => Promise<void>;
}

/**
 * Hook return type
 */
export interface UseEpubGenerationReturn extends UseEpubGenerationState, UseEpubGenerationActions {}

/**
 * useEpubGeneration Hook
 *
 * Manages EPUB generation lifecycle and state
 *
 * @example
 * ```tsx
 * const { state, progress, generate, cancel, saveFile } = useEpubGeneration();
 *
 * const handleExport = async () => {
 *   await generate(book, styles, images);
 * };
 *
 * if (state === 'completed') {
 *   await saveFile();
 * }
 * ```
 */
export function useEpubGeneration(): UseEpubGenerationReturn {
  const [state, setState] = useState<EpubGenerationState>('idle');
  const [progress, setProgress] = useState<EpubGenerationProgress | null>(null);
  const [error, setError] = useState<EpubGenerationError | null>(null);
  const [result, setResult] = useState<EpubGenerationComplete | null>(null);

  const serviceRef = useRef<EpubGenerationService | null>(null);
  const isGeneratingRef = useRef(false);

  /**
   * Initialize service on mount
   */
  useEffect(() => {
    const initService = async () => {
      const service = new EpubGenerationService();

      await service.initialize({
        onProgress: (progressData) => {
          setProgress(progressData);
          if (state !== 'generating') {
            setState('generating');
          }
        },
        onComplete: (completeData) => {
          setResult(completeData);
          setState('completed');
          isGeneratingRef.current = false;
        },
        onError: (errorData) => {
          setError(errorData);
          setState('error');
          isGeneratingRef.current = false;
        },
      });

      serviceRef.current = service;
    };

    initService();

    return () => {
      if (serviceRef.current) {
        serviceRef.current.terminate();
        serviceRef.current = null;
      }
    };
  }, []);

  /**
   * Generate EPUB file
   */
  const generate = useCallback(
    async (
      book: Book,
      styles: BookStyle[],
      images: ImageData[] = [],
      options?: InitializeMessage['data']['options']
    ) => {
      if (!serviceRef.current) {
        throw new Error('Service not initialized');
      }

      if (isGeneratingRef.current) {
        throw new Error('Generation already in progress');
      }

      // Reset state
      setState('initializing');
      setProgress(null);
      setError(null);
      setResult(null);
      isGeneratingRef.current = true;

      try {
        await serviceRef.current.generate(book, styles, images, options);
      } catch (err) {
        const error: EpubGenerationError = {
          code: 'GENERATION_FAILED',
          message: err instanceof Error ? err.message : 'Unknown error',
        };
        setError(error);
        setState('error');
        isGeneratingRef.current = false;
      }
    },
    []
  );

  /**
   * Cancel ongoing generation
   */
  const cancel = useCallback((reason?: string) => {
    if (serviceRef.current && isGeneratingRef.current) {
      serviceRef.current.cancel(reason);
      setState('idle');
      setProgress(null);
      isGeneratingRef.current = false;
    }
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState('idle');
    setProgress(null);
    setError(null);
    setResult(null);
    isGeneratingRef.current = false;
  }, []);

  /**
   * Save generated file
   */
  const saveFile = useCallback(async () => {
    if (!result) {
      throw new Error('No file to save');
    }

    try {
      await saveEpubFile(result.buffer, result.fileName);
    } catch (err) {
      const error: EpubGenerationError = {
        code: 'SAVE_FAILED',
        message: err instanceof Error ? err.message : 'Failed to save file',
      };
      setError(error);
      setState('error');
      throw err;
    }
  }, [result]);

  return {
    // State
    state,
    progress,
    error,
    result,
    isGenerating: isGeneratingRef.current || state === 'generating' || state === 'initializing',

    // Actions
    generate,
    cancel,
    reset,
    saveFile,
  };
}
