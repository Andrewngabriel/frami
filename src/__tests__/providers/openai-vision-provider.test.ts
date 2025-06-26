import { OpenAIVisionProvider } from '../../providers/openai-vision-provider';
import { VideoFrame } from '../../core/interfaces';

jest.mock('openai');

describe('OpenAIVisionProvider', () => {
  let provider: OpenAIVisionProvider;

  beforeEach(() => {
    provider = new OpenAIVisionProvider();
  });

  describe('configure', () => {
    it('should throw error if apiKey is missing', () => {
      expect(() => provider.configure({})).toThrow('Missing required configuration: apiKey');
    });

    it('should configure successfully with valid apiKey', () => {
      expect(() => provider.configure({ apiKey: 'test-key' })).not.toThrow();
    });
  });

  describe('getName', () => {
    it('should return correct provider name', () => {
      expect(provider.getName()).toBe('OpenAI GPT-4 Vision');
    });
  });

  describe('analyzeFrame', () => {
    const mockFrame: VideoFrame = {
      timestamp: 10,
      imageBuffer: Buffer.from('test-image-data'),
      width: 1920,
      height: 1080,
      format: 'png'
    };

    it('should throw error if not configured', async () => {
      await expect(provider.analyzeFrame(mockFrame)).rejects.toThrow(
        'OpenAI client not configured. Call configure() first.'
      );
    });

    it('should handle malformed JSON response gracefully', async () => {
      const mockClient = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{ message: { content: 'Invalid JSON response' } }]
            })
          }
        }
      };

      (require('openai').OpenAI as jest.Mock).mockImplementation(() => mockClient);
      
      provider.configure({ apiKey: 'test-key' });

      const result = await provider.analyzeFrame(mockFrame);
      
      expect(result).toBeDefined();
      expect(result.description).toBe('Invalid JSON response');
      expect(typeof result.colorfulness).toBe('number');
    });

    it('should parse valid analysis response', async () => {
      const mockResponse = {
        colorfulness: 75,
        contrast: 80,
        brightness: 65,
        sharpness: 70,
        objectCount: 3,
        faceCount: 1,
        textDetected: false,
        description: 'A colorful scene',
        tags: ['outdoor', 'nature']
      };

      const mockClient = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{ message: { content: JSON.stringify(mockResponse) } }]
            })
          }
        }
      };

      (require('openai').OpenAI as jest.Mock).mockImplementation(() => mockClient);
      
      provider.configure({ apiKey: 'test-key' });

      const result = await provider.analyzeFrame(mockFrame, {
        includeObjectDetection: true,
        includeFaceDetection: true,
        includeTextDetection: true,
        includeDescription: true
      });

      expect(result.colorfulness).toBe(75);
      expect(result.contrast).toBe(80);
      expect(result.brightness).toBe(65);
      expect(result.sharpness).toBe(70);
      expect(result.objectCount).toBe(3);
      expect(result.faceCount).toBe(1);
      expect(result.textDetected).toBe(false);
      expect(result.description).toBe('A colorful scene');
      expect(result.tags).toEqual(['outdoor', 'nature']);
    });

    it('should validate and clamp scores to 0-100 range', async () => {
      const mockResponse = {
        colorfulness: 150,
        contrast: -10,
        brightness: 'invalid',
        sharpness: 50
      };

      const mockClient = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{ message: { content: JSON.stringify(mockResponse) } }]
            })
          }
        }
      };

      (require('openai').OpenAI as jest.Mock).mockImplementation(() => mockClient);
      
      provider.configure({ apiKey: 'test-key' });

      const result = await provider.analyzeFrame(mockFrame);

      expect(result.colorfulness).toBe(100);
      expect(result.contrast).toBe(0); 
      expect(result.brightness).toBe(50);
      expect(result.sharpness).toBe(50);
    });
  });

  describe('analyzeFrames', () => {
    it('should analyze multiple frames', async () => {
      const frames: VideoFrame[] = [
        {
          timestamp: 10,
          imageBuffer: Buffer.from('frame1'),
          width: 1920,
          height: 1080,
          format: 'png'
        },
        {
          timestamp: 20,
          imageBuffer: Buffer.from('frame2'),
          width: 1920,
          height: 1080,
          format: 'png'
        }
      ];

      const mockResponse = {
        colorfulness: 75,
        contrast: 80,
        brightness: 65,
        sharpness: 70
      };

      const mockClient = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{ message: { content: JSON.stringify(mockResponse) } }]
            })
          }
        }
      };

      (require('openai').OpenAI as jest.Mock).mockImplementation(() => mockClient);
      
      provider.configure({ apiKey: 'test-key' });

      const results = await provider.analyzeFrames(frames);

      expect(results).toHaveLength(2);
      expect(mockClient.chat.completions.create).toHaveBeenCalledTimes(2);
    });
  });
});