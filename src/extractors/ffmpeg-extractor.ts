import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';
import { IFrameExtractor, VideoFrame, VideoMetadata, ExtractionOptions } from '../core/interfaces';

export class FFmpegFrameExtractor implements IFrameExtractor {
  constructor() {
    if (ffmpegStatic) {
      ffmpeg.setFfmpegPath(ffmpegStatic);
    }
  }

  async extractFrames(videoPath: string, options: ExtractionOptions): Promise<VideoFrame[]> {
    const metadata = await this.getVideoMetadata(videoPath);
    const timestamps = this.calculateTimestamps(metadata, options);
    
    const tempDir = join(tmpdir(), 'frami-' + randomBytes(8).toString('hex'));
    await fs.mkdir(tempDir, { recursive: true });

    try {
      const frames: VideoFrame[] = [];
      
      for (let i = 0; i < timestamps.length; i++) {
        const timestamp = timestamps[i];
        const outputPath = join(tempDir, `frame_${i}.png`);
        
        await this.extractSingleFrame(videoPath, timestamp, outputPath, options.quality);
        
        const imageBuffer = await fs.readFile(outputPath);
        const frame: VideoFrame = {
          timestamp,
          imageBuffer,
          width: metadata.width,
          height: metadata.height,
          format: 'png'
        };
        
        frames.push(frame);
      }
      
      return frames;
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }

  async getVideoMetadata(videoPath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(new Error(`Failed to get video metadata: ${err.message}`));
          return;
        }

        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        if (!videoStream) {
          reject(new Error('No video stream found'));
          return;
        }

        const stats = require('fs').statSync(videoPath);
        
        resolve({
          duration: metadata.format.duration || 0,
          width: videoStream.width || 0,
          height: videoStream.height || 0,
          fps: this.parseFps(videoStream.r_frame_rate),
          format: metadata.format.format_name || 'unknown',
          fileSize: stats.size
        });
      });
    });
  }

  private calculateTimestamps(metadata: VideoMetadata, options: ExtractionOptions): number[] {
    const { maxFrames, intervalSeconds, startTime = 0, endTime } = options;
    const actualEndTime = endTime || metadata.duration;
    const duration = actualEndTime - startTime;
    
    if (intervalSeconds) {
      const timestamps: number[] = [];
      for (let t = startTime; t <= actualEndTime && timestamps.length < maxFrames; t += intervalSeconds) {
        timestamps.push(t);
      }
      return timestamps;
    }
    
    const timestamps: number[] = [];
    const interval = duration / (maxFrames + 1);
    
    for (let i = 1; i <= maxFrames; i++) {
      timestamps.push(startTime + (interval * i));
    }
    
    return timestamps;
  }

  private extractSingleFrame(
    videoPath: string, 
    timestamp: number, 
    outputPath: string, 
    quality: string = 'medium'
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let command = ffmpeg(videoPath)
        .seekInput(timestamp)
        .frames(1)
        .output(outputPath);

      switch (quality) {
        case 'high':
          command = command.outputOptions(['-q:v', '1']);
          break;
        case 'low':
          command = command.outputOptions(['-q:v', '10']);
          break;
        default:
          command = command.outputOptions(['-q:v', '5']);
      }

      command
        .on('end', () => resolve())
        .on('error', (err: any) => reject(new Error(`Frame extraction failed: ${err.message}`)))
        .run();
    });
  }

  private parseFps(fpsString?: string): number {
    if (!fpsString) return 30;
    
    const parts = fpsString.split('/');
    if (parts.length === 2) {
      return parseInt(parts[0]) / parseInt(parts[1]);
    }
    
    return parseFloat(fpsString) || 30;
  }
}