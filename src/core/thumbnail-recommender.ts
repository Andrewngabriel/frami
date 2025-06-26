import { 
  IThumbnailRecommender, 
  IVisionProvider, 
  IFrameExtractor, 
  IThumbnailSelector,
  ThumbnailRecommendation,
  ThumbnailCandidate,
  ExtractionOptions,
  AnalysisOptions
} from './interfaces';
import { FFmpegFrameExtractor } from '../extractors/ffmpeg-extractor';
import { DefaultThumbnailSelector } from './default-thumbnail-selector';

export class ThumbnailRecommender implements IThumbnailRecommender {
  private visionProvider: IVisionProvider | null = null;
  private frameExtractor: IFrameExtractor;
  private thumbnailSelector: IThumbnailSelector;

  constructor(
    visionProvider?: IVisionProvider,
    frameExtractor?: IFrameExtractor,
    thumbnailSelector?: IThumbnailSelector
  ) {
    this.visionProvider = visionProvider || null;
    this.frameExtractor = frameExtractor || new FFmpegFrameExtractor();
    this.thumbnailSelector = thumbnailSelector || new DefaultThumbnailSelector();
  }

  setVisionProvider(provider: IVisionProvider): void {
    this.visionProvider = provider;
  }

  setFrameExtractor(extractor: IFrameExtractor): void {
    this.frameExtractor = extractor;
  }

  setThumbnailSelector(selector: IThumbnailSelector): void {
    this.thumbnailSelector = selector;
  }

  async recommendThumbnails(
    videoPath: string,
    options: {
      maxFrames?: number;
      topN?: number;
      extractionOptions?: ExtractionOptions;
      analysisOptions?: AnalysisOptions;
    } = {}
  ): Promise<ThumbnailRecommendation> {
    if (!this.visionProvider) {
      throw new Error('Vision provider not set. Call setVisionProvider() first.');
    }

    const startTime = Date.now();
    
    const {
      maxFrames = 10,
      topN = 3,
      extractionOptions = { maxFrames },
      analysisOptions = {}
    } = options;

    try {
      const videoMetadata = await this.frameExtractor.getVideoMetadata(videoPath);
      
      const frames = await this.frameExtractor.extractFrames(videoPath, {
        quality: 'medium',
        ...extractionOptions,
        maxFrames: extractionOptions.maxFrames || maxFrames
      });

      if (frames.length === 0) {
        throw new Error('No frames extracted from video');
      }

      const analysisResults = await this.visionProvider.analyzeFrames(frames, {
        includeObjectDetection: true,
        includeFaceDetection: true,
        includeTextDetection: true,
        includeDescription: true,
        ...analysisOptions
      });

      const candidates: ThumbnailCandidate[] = frames.map((frame, index) => {
        const analysis = analysisResults[index];
        const score = this.thumbnailSelector.scoreFrame(analysis);
        
        return {
          frame,
          score,
          confidence: this.calculateConfidence(analysis, score),
          analysis
        };
      });

      const bestFrames = this.thumbnailSelector.selectBestFrames(candidates, topN);
      
      const processingTime = Date.now() - startTime;

      return {
        bestFrames,
        videoMetadata,
        processingTime,
        model: this.visionProvider.getName()
      };
    } catch (error) {
      throw new Error(`Thumbnail recommendation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private calculateConfidence(analysis: any, score: number): number {
    let confidence = score;
    
    const hasAllMetrics = [
      analysis.colorfulness,
      analysis.contrast,
      analysis.brightness,
      analysis.sharpness
    ].every(metric => typeof metric === 'number' && metric > 0);
    
    if (hasAllMetrics) {
      confidence *= 1.1;
    }
    
    if (analysis.objectCount !== undefined || analysis.faceCount !== undefined) {
      confidence *= 1.05;
    }
    
    return Math.min(1.0, confidence);
  }
}