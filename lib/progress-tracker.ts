/**
 * Progress Tracker - Track generation progress for long-running operations
 * Similar to how Suno shows progress during song generation
 */

export interface GenerationProgress {
  stage: string;
  progress: number; // 0-100
  message: string;
  details?: any;
}

export class ProgressTracker {
  private progress: GenerationProgress;
  private listeners: Set<(progress: GenerationProgress) => void> = new Set();

  constructor(initialStage: string = "Starting...") {
    this.progress = {
      stage: initialStage,
      progress: 0,
      message: initialStage,
    };
  }

  update(stage: string, progress: number, message: string, details?: any) {
    this.progress = {
      stage,
      progress: Math.min(100, Math.max(0, progress)),
      message,
      details,
    };
    this.notify();
  }

  subscribe(listener: (progress: GenerationProgress) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.progress));
  }

  getProgress(): GenerationProgress {
    return { ...this.progress };
  }
}

// Global progress tracker instance (in production, use Redis or similar for multi-instance)
const progressTrackers = new Map<string, ProgressTracker>();

export function getProgressTracker(id: string): ProgressTracker {
  if (!progressTrackers.has(id)) {
    progressTrackers.set(id, new ProgressTracker());
  }
  return progressTrackers.get(id)!;
}

export function createProgressTracker(id: string, initialStage: string = "Starting..."): ProgressTracker {
  const tracker = new ProgressTracker(initialStage);
  progressTrackers.set(id, tracker);
  return tracker;
}
