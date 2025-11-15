export interface ProgressUpdate {
  stage: string;
  percent: number;
  message?: string;
  timestamp: number;
}

export class ProgressTracker {
  private updates: ProgressUpdate[] = [];

  update(stage: string, percent: number, message?: string) {
    const clampedPercent = Math.max(0, Math.min(100, percent));
    const entry: ProgressUpdate = {
      stage,
      percent: clampedPercent,
      message,
      timestamp: Date.now(),
    };

    this.updates.push(entry);

    if (process.env.NODE_ENV !== "test") {
      const suffix = message ? ` - ${message}` : "";
      console.log(`[Progress] ${stage}: ${clampedPercent}%${suffix}`);
    }
  }

  getHistory(): ProgressUpdate[] {
    return [...this.updates];
  }

  getLatest(): ProgressUpdate | undefined {
    return this.updates.length > 0
      ? this.updates[this.updates.length - 1]
      : undefined;
  }
}
