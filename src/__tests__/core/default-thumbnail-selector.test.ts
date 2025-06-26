import { DefaultThumbnailSelector } from '../../core/default-thumbnail-selector';
import { FrameAnalysis, ThumbnailCandidate, VideoFrame } from '../../core/interfaces';

describe('DefaultThumbnailSelector', () => {
  let selector: DefaultThumbnailSelector;

  beforeEach(() => {
    selector = new DefaultThumbnailSelector();
  });

  describe('scoreFrame', () => {
    it('should score a high-quality frame highly', () => {
      const analysis: FrameAnalysis = {
        colorfulness: 80,
        contrast: 75,
        brightness: 60,
        sharpness: 85,
        objectCount: 2,
        faceCount: 1
      };

      const score = selector.scoreFrame(analysis);
      expect(score).toBeGreaterThan(0.7);
    });

    it('should score a low-quality frame poorly', () => {
      const analysis: FrameAnalysis = {
        colorfulness: 20,
        contrast: 15,
        brightness: 95,
        sharpness: 25
      };

      const score = selector.scoreFrame(analysis);
      expect(score).toBeLessThan(0.4);
    });

    it('should apply face bonus correctly', () => {
      const baseAnalysis: FrameAnalysis = {
        colorfulness: 60,
        contrast: 60,
        brightness: 60,
        sharpness: 60
      };

      const withFaces: FrameAnalysis = {
        ...baseAnalysis,
        faceCount: 1
      };

      const scoreWithoutFaces = selector.scoreFrame(baseAnalysis);
      const scoreWithFaces = selector.scoreFrame(withFaces);

      expect(scoreWithFaces).toBeGreaterThan(scoreWithoutFaces);
    });

    it('should penalize extreme brightness values', () => {
      const darkAnalysis: FrameAnalysis = {
        colorfulness: 60,
        contrast: 60,
        brightness: 10,
        sharpness: 60
      };

      const brightAnalysis: FrameAnalysis = {
        colorfulness: 60,
        contrast: 60,
        brightness: 90,
        sharpness: 60
      };

      const normalAnalysis: FrameAnalysis = {
        colorfulness: 60,
        contrast: 60,
        brightness: 50,
        sharpness: 60
      };

      const darkScore = selector.scoreFrame(darkAnalysis);
      const brightScore = selector.scoreFrame(brightAnalysis);
      const normalScore = selector.scoreFrame(normalAnalysis);

      expect(normalScore).toBeGreaterThan(darkScore);
      expect(normalScore).toBeGreaterThan(brightScore);
    });
  });

  describe('selectBestFrames', () => {
    it('should select frames with highest scores', () => {
      const mockFrame: VideoFrame = {
        timestamp: 0,
        imageBuffer: Buffer.from('test'),
        width: 100,
        height: 100,
        format: 'png'
      };

      const candidates: ThumbnailCandidate[] = [
        {
          frame: mockFrame,
          score: 0.9,
          confidence: 0.8,
          analysis: { colorfulness: 80, contrast: 80, brightness: 60, sharpness: 80 }
        },
        {
          frame: mockFrame,
          score: 0.5,
          confidence: 0.6,
          analysis: { colorfulness: 40, contrast: 40, brightness: 60, sharpness: 40 }
        },
        {
          frame: mockFrame,
          score: 0.7,
          confidence: 0.7,
          analysis: { colorfulness: 60, contrast: 60, brightness: 60, sharpness: 60 }
        }
      ];

      const selected = selector.selectBestFrames(candidates, 2);

      expect(selected).toHaveLength(2);
      expect(selected[0].score).toBe(0.9);
      expect(selected[1].score).toBe(0.7);
    });

    it('should return all frames if count exceeds available', () => {
      const mockFrame: VideoFrame = {
        timestamp: 0,
        imageBuffer: Buffer.from('test'),
        width: 100,
        height: 100,
        format: 'png'
      };

      const candidates: ThumbnailCandidate[] = [
        {
          frame: mockFrame,
          score: 0.9,
          confidence: 0.8,
          analysis: { colorfulness: 80, contrast: 80, brightness: 60, sharpness: 80 }
        }
      ];

      const selected = selector.selectBestFrames(candidates, 5);
      expect(selected).toHaveLength(1);
    });
  });
});