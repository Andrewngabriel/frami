import { BaseThumbnailSelector } from './base-classes';
import { FrameAnalysis } from './interfaces';

export class DefaultThumbnailSelector extends BaseThumbnailSelector {
  private readonly weights = {
    colorfulness: 0.25,
    contrast: 0.25,
    brightness: 0.15,
    sharpness: 0.20,
    objectCount: 0.10,
    faceCount: 0.05
  };

  scoreFrame(analysis: FrameAnalysis): number {
    const metrics: Record<string, number> = {
      colorfulness: this.normalizeScore(analysis.colorfulness, 0, 100),
      contrast: this.normalizeScore(analysis.contrast, 0, 100),
      brightness: this.scoreBrightness(analysis.brightness),
      sharpness: this.normalizeScore(analysis.sharpness, 0, 100)
    };

    if (analysis.objectCount !== undefined) {
      metrics.objectCount = this.scoreObjectCount(analysis.objectCount);
    }

    if (analysis.faceCount !== undefined) {
      metrics.faceCount = this.scoreFaceCount(analysis.faceCount);
    }

    const baseScore = this.calculateWeightedScore(metrics, this.weights);
    
    return this.applyBonuses(baseScore, analysis);
  }

  private scoreBrightness(brightness: number): number {
    if (brightness < 20 || brightness > 80) {
      return 0.3;
    }
    if (brightness < 30 || brightness > 70) {
      return 0.7;
    }
    return 1.0;
  }

  private scoreObjectCount(count: number): number {
    if (count === 0) return 0;
    if (count <= 3) return 1.0;
    if (count <= 6) return 0.8;
    return 0.5;
  }

  private scoreFaceCount(count: number): number {
    if (count === 0) return 0.5;
    if (count <= 2) return 1.0;
    if (count <= 4) return 0.8;
    return 0.6;
  }

  private applyBonuses(baseScore: number, analysis: FrameAnalysis): number {
    let score = baseScore;

    if (analysis.faceCount && analysis.faceCount > 0) {
      score *= 1.1;
    }

    if (analysis.textDetected === false) {
      score *= 1.05;
    }

    if (analysis.tags && analysis.tags.length > 0) {
      const engagementTags = ['action', 'emotion', 'smile', 'eye contact', 'gesture', 'peak moment'];
      const hasEngagementTag = analysis.tags.some(tag => 
        engagementTags.some(engagementTag => 
          tag.toLowerCase().includes(engagementTag.toLowerCase())
        )
      );
      
      if (hasEngagementTag) {
        score *= 1.15;
      }
    }

    return Math.min(1.0, score);
  }
}