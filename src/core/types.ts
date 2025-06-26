export interface VideoFrame {
  timestamp: number;
  imageBuffer: Buffer;
  width: number;
  height: number;
  format: string;
}

export interface ThumbnailCandidate {
  frame: VideoFrame;
  score: number;
  confidence: number;
  analysis: FrameAnalysis;
}

export interface FrameAnalysis {
  colorfulness: number;
  contrast: number;
  brightness: number;
  sharpness: number;
  objectCount?: number;
  faceCount?: number;
  textDetected?: boolean;
  description?: string;
  tags?: string[];
}

export interface ThumbnailRecommendation {
  bestFrames: ThumbnailCandidate[];
  videoMetadata: VideoMetadata;
  processingTime: number;
  model: string;
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  format: string;
  fileSize: number;
}

export interface ProviderConfig {
  apiKey?: string;
  endpoint?: string;
  model?: string;
  maxFrames?: number;
  [key: string]: any;
}

export interface ExtractionOptions {
  maxFrames: number;
  intervalSeconds?: number;
  startTime?: number;
  endTime?: number;
  quality?: 'low' | 'medium' | 'high';
}

export interface AnalysisOptions {
  includeObjectDetection?: boolean;
  includeFaceDetection?: boolean;
  includeTextDetection?: boolean;
  includeDescription?: boolean;
  customPrompt?: string;
}