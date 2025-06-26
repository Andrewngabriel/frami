import { 
  VideoFrame, 
  ThumbnailCandidate, 
  ThumbnailRecommendation, 
  VideoMetadata,
  ProviderConfig,
  ExtractionOptions,
  AnalysisOptions,
  FrameAnalysis
} from './types';

export {
  VideoFrame,
  ThumbnailCandidate,
  ThumbnailRecommendation,
  VideoMetadata,
  ProviderConfig,
  ExtractionOptions,
  AnalysisOptions,
  FrameAnalysis
};

export interface IFrameExtractor {
  extractFrames(videoPath: string, options: ExtractionOptions): Promise<VideoFrame[]>;
  getVideoMetadata(videoPath: string): Promise<VideoMetadata>;
}

export interface IVisionProvider {
  analyzeFrame(frame: VideoFrame, options?: AnalysisOptions): Promise<FrameAnalysis>;
  analyzeFrames(frames: VideoFrame[], options?: AnalysisOptions): Promise<FrameAnalysis[]>;
  configure(config: ProviderConfig): void;
  getName(): string;
}

export interface IThumbnailSelector {
  selectBestFrames(
    candidates: ThumbnailCandidate[], 
    count?: number
  ): ThumbnailCandidate[];
  scoreFrame(analysis: FrameAnalysis): number;
}

export interface IThumbnailRecommender {
  recommendThumbnails(
    videoPath: string, 
    options?: {
      maxFrames?: number;
      topN?: number;
      extractionOptions?: ExtractionOptions;
      analysisOptions?: AnalysisOptions;
    }
  ): Promise<ThumbnailRecommendation>;
  
  setVisionProvider(provider: IVisionProvider): void;
  setFrameExtractor(extractor: IFrameExtractor): void;
  setThumbnailSelector(selector: IThumbnailSelector): void;
}