import { promises as fs } from 'fs';
import { join, dirname, extname } from 'path';
import { VideoFrame, ThumbnailCandidate } from '../core/interfaces';

export interface ImageOutputOptions {
  outputDir: string;
  format?: 'png' | 'jpg';
  quality?: number;
  prefix?: string;
  includeTimestamp?: boolean;
  includeScore?: boolean;
}

export class ImageUtils {
  static async saveThumbnailFrames(
    candidates: ThumbnailCandidate[],
    options: ImageOutputOptions
  ): Promise<string[]> {
    const {
      outputDir,
      format = 'jpg',
      prefix = 'thumbnail',
      includeTimestamp = true,
      includeScore = true
    } = options;

    await fs.mkdir(outputDir, { recursive: true });

    const savedPaths: string[] = [];

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      const filename = this.generateFilename(candidate, i, {
        prefix,
        format,
        includeTimestamp,
        includeScore
      });
      
      const outputPath = join(outputDir, filename);
      
      if (format === 'jpg' && candidate.frame.format === 'png') {
        const jpegBuffer = await this.convertPngToJpeg(candidate.frame.imageBuffer, options.quality);
        await fs.writeFile(outputPath, jpegBuffer);
      } else {
        await fs.writeFile(outputPath, candidate.frame.imageBuffer);
      }
      
      savedPaths.push(outputPath);
    }

    return savedPaths;
  }

  static async saveVideoFrame(
    frame: VideoFrame,
    outputPath: string,
    options: { format?: 'png' | 'jpg'; quality?: number } = {}
  ): Promise<void> {
    const { format, quality } = options;
    
    await fs.mkdir(dirname(outputPath), { recursive: true });
    
    if (format === 'jpg' && frame.format === 'png') {
      const jpegBuffer = await this.convertPngToJpeg(frame.imageBuffer, quality);
      await fs.writeFile(outputPath, jpegBuffer);
    } else {
      await fs.writeFile(outputPath, frame.imageBuffer);
    }
  }

  private static generateFilename(
    candidate: ThumbnailCandidate,
    index: number,
    options: {
      prefix: string;
      format: string;
      includeTimestamp: boolean;
      includeScore: boolean;
    }
  ): string {
    const { prefix, format, includeTimestamp, includeScore } = options;
    
    let filename = `${prefix}_${index + 1}`;
    
    if (includeTimestamp) {
      const timestamp = Math.round(candidate.frame.timestamp * 10) / 10;
      filename += `_${timestamp}s`;
    }
    
    if (includeScore) {
      const score = Math.round(candidate.score * 100);
      filename += `_${score}pct`;
    }
    
    return `${filename}.${format}`;
  }

  private static async convertPngToJpeg(pngBuffer: Buffer, quality: number = 85): Promise<Buffer> {
    // For now, we'll just return the PNG buffer as-is since converting PNG to JPEG
    // would require additional dependencies like sharp or canvas
    // This is a placeholder for future enhancement
    return pngBuffer;
  }

  static async createThumbnailGrid(
    candidates: ThumbnailCandidate[],
    outputPath: string,
    options: {
      columns?: number;
      padding?: number;
      showLabels?: boolean;
    } = {}
  ): Promise<void> {
    // Placeholder for future grid creation functionality
    // Would require image manipulation library like sharp
    throw new Error('Grid creation not yet implemented. Install sharp for this feature.');
  }
}

export interface ThumbnailOutputResult {
  savedPaths: string[];
  outputDir: string;
  format: string;
  totalSize: number;
}

export async function saveThumbnails(
  candidates: ThumbnailCandidate[],
  options: ImageOutputOptions
): Promise<ThumbnailOutputResult> {
  const savedPaths = await ImageUtils.saveThumbnailFrames(candidates, options);
  
  let totalSize = 0;
  for (const path of savedPaths) {
    const stats = await fs.stat(path);
    totalSize += stats.size;
  }

  return {
    savedPaths,
    outputDir: options.outputDir,
    format: options.format || 'jpg',
    totalSize
  };
}