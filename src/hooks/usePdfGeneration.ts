/**
 * PDF Generation Hook
 * React hook for managing PDF generation with progress tracking
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  PdfGenerationService,
  getPdfGenerationService,
  PdfGenerationConfig,
} from '../services/pdf-generation';
import {
  ProgressMessage,
  ErrorMessage,
  CompleteMessage,
  CancelledMessage,
} from '../workers/types';

export interface PdfGenerationState {
  isGenerating: boolean;
  progress: number;
  status: string;
  error: string | null;
  isComplete: boolean;
  isCancelled: boolean;
  completedData: CompleteMessage['data'] | null;
}

export interface UsePdfGenerationResult {
  state: PdfGenerationState;
  startGeneration: (config: PdfGenerationConfig) => Promise<void>;
  cancelGeneration: (reason?: string) => void;
  reset: () => void;
  saveGeneratedFile: () => Promise<void>;
}

const initialState: PdfGenerationState = {
  isGenerating: false,
  progress: 0,
  status: '',
  error: null,
  isComplete: false,
  isCancelled: false,
  completedData: null,
};

/**
 * Hook for PDF generation with progress tracking
 */
export function usePdfGeneration(): UsePdfGenerationResult {
  const [state, setState] = useState<PdfGenerationState>(initialState);
  const serviceRef = useRef<PdfGenerationService | null>(null);

  // Initialize service on mount
  useEffect(() => {
    let mounted = true;

    const initService = async () => {
      try {
        const service = getPdfGenerationService();
        await service.initialize();
        if (mounted) {
          serviceRef.current = service;
        }
      } catch (error) {
        console.error('Failed to initialize PDF service:', error);
        if (mounted) {
          setState((prev) => ({
            ...prev,
            error: error instanceof Error ? error.message : 'Failed to initialize PDF service',
          }));
        }
      }
    };

    initService();

    return () => {
      mounted = false;
      // Don't terminate on unmount - service is a singleton
    };
  }, []);

  /**
   * Handle progress updates from worker
   */
  const handleProgress = useCallback((data: ProgressMessage['data']) => {
    setState((prev) => ({
      ...prev,
      progress: data.percentage,
      status: data.status,
    }));
  }, []);

  /**
   * Handle errors from worker
   */
  const handleError = useCallback((data: ErrorMessage['data']) => {
    console.error('PDF generation error:', data);
    setState((prev) => ({
      ...prev,
      isGenerating: false,
      error: data.message,
      status: 'Error',
    }));
  }, []);

  /**
   * Handle completion from worker
   */
  const handleComplete = useCallback((data: CompleteMessage['data']) => {
    setState((prev) => ({
      ...prev,
      isGenerating: false,
      progress: 100,
      status: 'Complete',
      isComplete: true,
      completedData: data,
    }));
  }, []);

  /**
   * Handle cancellation from worker
   */
  const handleCancelled = useCallback((data: CancelledMessage['data']) => {
    setState((prev) => ({
      ...prev,
      isGenerating: false,
      isCancelled: true,
      status: 'Cancelled',
    }));
  }, []);

  /**
   * Start PDF generation
   */
  const startGeneration = useCallback(
    async (config: PdfGenerationConfig) => {
      if (!serviceRef.current) {
        throw new Error('PDF service not initialized');
      }

      // Reset state
      setState({
        ...initialState,
        isGenerating: true,
        status: 'Starting...',
      });

      try {
        await serviceRef.current.generate(config, {
          onProgress: handleProgress,
          onError: handleError,
          onComplete: handleComplete,
          onCancelled: handleCancelled,
        });
      } catch (error) {
        handleError({
          code: 'GENERATION_START_ERROR',
          message: error instanceof Error ? error.message : 'Failed to start generation',
        });
      }
    },
    [handleProgress, handleError, handleComplete, handleCancelled]
  );

  /**
   * Cancel PDF generation
   */
  const cancelGeneration = useCallback((reason?: string) => {
    if (serviceRef.current) {
      serviceRef.current.cancel(reason);
    }
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  /**
   * Save the generated PDF file
   */
  const saveGeneratedFile = useCallback(async () => {
    if (!state.completedData || !serviceRef.current) {
      throw new Error('No completed PDF to save');
    }

    try {
      await serviceRef.current.saveFile(
        state.completedData.buffer,
        state.completedData.fileName
      );
    } catch (error) {
      console.error('Failed to save PDF:', error);
      throw error;
    }
  }, [state.completedData]);

  return {
    state,
    startGeneration,
    cancelGeneration,
    reset,
    saveGeneratedFile,
  };
}
