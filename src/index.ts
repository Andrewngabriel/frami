export * from './core/types';
export * from './core/interfaces';
export * from './core/base-classes';
export * from './core/thumbnail-recommender';
export * from './core/default-thumbnail-selector';

export * from './extractors/ffmpeg-extractor';
export * from './providers/openai-vision-provider';
export * from './utils/image-utils';

import { ThumbnailRecommender } from './core/thumbnail-recommender';
import { OpenAIVisionProvider } from './providers/openai-vision-provider';
import { FFmpegFrameExtractor } from './extractors/ffmpeg-extractor';
import { DefaultThumbnailSelector } from './core/default-thumbnail-selector';
import { ThumbnailRecommendation, ExtractionOptions, AnalysisOptions } from './core/interfaces';

export interface FramiOptions {
  openaiApiKey?: string;
  openaiModel?: string;
  maxFrames?: number;
  topN?: number;
  extractionOptions?: ExtractionOptions;
  analysisOptions?: AnalysisOptions;
}

export class Frami {
  private recommender: ThumbnailRecommender;
  private visionProvider: OpenAIVisionProvider;

  constructor(options: FramiOptions = {}) {
    this.visionProvider = new OpenAIVisionProvider();
    
    if (options.openaiApiKey) {
      this.visionProvider.configure({
        apiKey: options.openaiApiKey,
        model: options.openaiModel
      });
    }

    this.recommender = new ThumbnailRecommender(
      this.visionProvider,
      new FFmpegFrameExtractor(),
      new DefaultThumbnailSelector()
    );
  }

  async recommendThumbnails(
    videoPath: string,
    options: Omit<FramiOptions, 'openaiApiKey' | 'openaiModel'> = {}
  ): Promise<ThumbnailRecommendation> {
    return this.recommender.recommendThumbnails(videoPath, options);
  }

  async recommendThumbnailsWithImages(
    videoPath: string,
    outputDir: string,
    options: Omit<FramiOptions, 'openaiApiKey' | 'openaiModel'> & {
      imageFormat?: 'png' | 'jpg';
      imageQuality?: number;
      filenamePrefix?: string;
    } = {}
  ): Promise<ThumbnailRecommendation & { savedImages: string[] }> {
    const { imageFormat = 'jpg', imageQuality = 85, filenamePrefix = 'thumbnail', ...recommendOptions } = options;
    
    const result = await this.recommender.recommendThumbnails(videoPath, recommendOptions);
    
    // Save images
    const { ImageUtils } = await import('./utils/image-utils');
    const savedPaths = await ImageUtils.saveThumbnailFrames(result.bestFrames, {
      outputDir,
      format: imageFormat,
      quality: imageQuality,
      prefix: filenamePrefix,
      includeTimestamp: true,
      includeScore: true
    });

    return {
      ...result,
      savedImages: savedPaths
    };
  }

  setOpenAIApiKey(apiKey: string, model?: string): void {
    this.visionProvider.configure({ apiKey, model });
  }
}

export default Frami;