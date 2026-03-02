/**
 * ProgressReporter - A utility class for tracking and reporting progress during long operations
 *
 * Features:
 * - Track multiple steps with different weights
 * - Calculate ETA based on elapsed time and progress
 * - Support sub-progress for long steps
 * - Emit structured progress events
 * - Handle cancellation
 */

export interface ProgressStep {
  id: string;
  name: string;
  weight: number; // Relative weight compared to other steps (e.g., 1, 2, 3)
}

export interface ProgressEvent {
  stepId: string;
  stepName: string;
  stepProgress: number; // 0-100 for current step
  overallProgress: number; // 0-100 for entire operation
  eta: number | null; // Estimated time remaining in milliseconds, null if not enough data
  status: string; // Human-readable status message
  details?: string; // Optional additional details
}

export type ProgressCallback = (event: ProgressEvent) => void;

export class ProgressReporter {
  private steps: ProgressStep[];
  private currentStepIndex: number;
  private currentStepProgress: number;
  private startTime: number;
  private totalWeight: number;
  private completedWeight: number;
  private callback: ProgressCallback;
  private isCancelled: boolean;
  private lastEmitTime: number;
  private minEmitInterval: number; // Minimum milliseconds between emits to avoid spam

  constructor(steps: ProgressStep[], callback: ProgressCallback, minEmitInterval: number = 100) {
    if (!steps || steps.length === 0) {
      throw new Error('ProgressReporter requires at least one step');
    }

    if (!callback || typeof callback !== 'function') {
      throw new Error('ProgressReporter requires a valid callback function');
    }

    this.steps = steps;
    this.currentStepIndex = 0;
    this.currentStepProgress = 0;
    this.startTime = Date.now();
    this.totalWeight = steps.reduce((sum, step) => sum + step.weight, 0);
    this.completedWeight = 0;
    this.callback = callback;
    this.isCancelled = false;
    this.lastEmitTime = 0;
    this.minEmitInterval = minEmitInterval;
  }

  /**
   * Start a new step by its ID
   */
  public startStep(stepId: string): void {
    this.checkCancellation();

    const stepIndex = this.steps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) {
      throw new Error(`Step with ID "${stepId}" not found`);
    }

    // Mark all previous steps as complete
    if (stepIndex > this.currentStepIndex) {
      for (let i = this.currentStepIndex; i < stepIndex; i++) {
        this.completedWeight += this.steps[i].weight;
      }
    }

    this.currentStepIndex = stepIndex;
    this.currentStepProgress = 0;

    this.emit({
      status: `Starting: ${this.steps[stepIndex].name}`,
    });
  }

  /**
   * Update progress for the current step
   * @param progress - Progress percentage (0-100) for the current step
   * @param status - Optional status message
   * @param details - Optional additional details
   */
  public updateProgress(progress: number, status?: string, details?: string): void {
    this.checkCancellation();

    // Clamp progress between 0 and 100
    progress = Math.max(0, Math.min(100, progress));
    this.currentStepProgress = progress;

    const currentTime = Date.now();
    // Only emit if enough time has passed since last emit (to avoid spam)
    if (currentTime - this.lastEmitTime >= this.minEmitInterval || progress === 100) {
      this.emit({ status, details });
      this.lastEmitTime = currentTime;
    }
  }

  /**
   * Complete the current step and move to the next
   */
  public completeStep(status?: string): void {
    this.checkCancellation();

    const currentStep = this.steps[this.currentStepIndex];
    this.completedWeight += currentStep.weight;
    this.currentStepProgress = 100;

    this.emit({
      status: status || `Completed: ${currentStep.name}`,
    });

    // Move to next step if available
    if (this.currentStepIndex < this.steps.length - 1) {
      this.currentStepIndex++;
      this.currentStepProgress = 0;
    }
  }

  /**
   * Complete all remaining steps (call when operation finishes successfully)
   */
  public complete(status?: string): void {
    this.checkCancellation();

    // Mark all remaining steps as complete
    while (this.currentStepIndex < this.steps.length) {
      this.completeStep();
    }

    this.emit({
      status: status || 'Complete',
    });
  }

  /**
   * Cancel the operation
   */
  public cancel(): void {
    this.isCancelled = true;
  }

  /**
   * Check if operation has been cancelled and throw if so
   */
  private checkCancellation(): void {
    if (this.isCancelled) {
      throw new Error('PROGRESS_CANCELLED');
    }
  }

  /**
   * Get the overall progress percentage (0-100)
   */
  public getOverallProgress(): number {
    const currentStep = this.steps[this.currentStepIndex];
    const currentStepWeight = currentStep.weight;
    const currentStepContribution = (this.currentStepProgress / 100) * currentStepWeight;

    const totalProgress = this.completedWeight + currentStepContribution;
    return Math.min(100, Math.max(0, (totalProgress / this.totalWeight) * 100));
  }

  /**
   * Calculate estimated time of arrival (ETA) in milliseconds
   * Returns null if not enough data to calculate
   */
  private calculateETA(): number | null {
    const overallProgress = this.getOverallProgress();

    // Need at least 5% progress to make reasonable estimate
    if (overallProgress < 5) {
      return null;
    }

    const elapsed = Date.now() - this.startTime;
    const progressFraction = overallProgress / 100;
    const estimatedTotal = elapsed / progressFraction;
    const remaining = estimatedTotal - elapsed;

    return Math.max(0, Math.round(remaining));
  }

  /**
   * Emit a progress event
   */
  private emit(options: { status?: string; details?: string }): void {
    const currentStep = this.steps[this.currentStepIndex];
    const overallProgress = this.getOverallProgress();
    const eta = this.calculateETA();

    const event: ProgressEvent = {
      stepId: currentStep.id,
      stepName: currentStep.name,
      stepProgress: this.currentStepProgress,
      overallProgress: Math.round(overallProgress * 100) / 100, // Round to 2 decimal places
      eta,
      status: options.status || currentStep.name,
      details: options.details,
    };

    this.callback(event);
  }

  /**
   * Get current step information
   */
  public getCurrentStep(): ProgressStep {
    return this.steps[this.currentStepIndex];
  }

  /**
   * Get all steps
   */
  public getSteps(): readonly ProgressStep[] {
    return this.steps;
  }

  /**
   * Check if cancelled
   */
  public isCancelledStatus(): boolean {
    return this.isCancelled;
  }
}

/**
 * Format milliseconds to human-readable time string
 * @param ms - Milliseconds
 * @returns Formatted string like "2m 30s" or "45s"
 */
export function formatETA(ms: number | null): string {
  if (ms === null) {
    return 'Calculating...';
  }

  if (ms < 1000) {
    return 'Less than 1s';
  }

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  return `${seconds}s`;
}
