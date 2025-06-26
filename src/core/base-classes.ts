import { 
  IVisionProvider, 
  IThumbnailSelector, 
  ProviderConfig, 
  VideoFrame, 
  FrameAnalysis, 
  ThumbnailCandidate,
  AnalysisOptions 
} from './interfaces';

export abstract class BaseVisionProvider implements IVisionProvider {
  protected config: ProviderConfig = {};

  abstract analyzeFrame(frame: VideoFrame, options?: AnalysisOptions): Promise<FrameAnalysis>;
  abstract getName(): string;

  async analyzeFrames(frames: VideoFrame[], options?: AnalysisOptions): Promise<FrameAnalysis[]> {
    return Promise.all(frames.map(frame => this.analyzeFrame(frame, options)));
  }

  configure(config: ProviderConfig): void {
    this.config = { ...this.config, ...config };
  }

  protected validateConfig(requiredKeys: string[]): void {
    const missing = requiredKeys.filter(key => !this.config[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required configuration: ${missing.join(', ')}`);
    }
  }
}

export abstract class BaseThumbnailSelector implements IThumbnailSelector {
  abstract scoreFrame(analysis: FrameAnalysis): number;

  selectBestFrames(candidates: ThumbnailCandidate[], count: number = 3): ThumbnailCandidate[] {
    return candidates
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  }

  protected normalizeScore(value: number, min: number, max: number): number {
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  }

  protected calculateWeightedScore(metrics: Record<string, number>, weights: Record<string, number>): number {
    let totalScore = 0;
    let totalWeight = 0;

    for (const [metric, value] of Object.entries(metrics)) {
      const weight = weights[metric] || 0;
      totalScore += value * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }
}