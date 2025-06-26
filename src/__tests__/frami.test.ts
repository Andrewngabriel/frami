import Frami from '../index';
import { OpenAIVisionProvider } from '../providers/openai-vision-provider';

jest.mock('../providers/openai-vision-provider');
jest.mock('../extractors/ffmpeg-extractor');

describe('Frami', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create instance without options', () => {
      const frami = new Frami();
      expect(frami).toBeInstanceOf(Frami);
    });

    it('should configure OpenAI provider when apiKey provided', () => {
      const mockConfigure = jest.fn();
      (OpenAIVisionProvider as jest.Mock).mockImplementation(() => ({
        configure: mockConfigure
      }));

      new Frami({
        openaiApiKey: 'test-key',
        openaiModel: 'gpt-4o'
      });

      expect(mockConfigure).toHaveBeenCalledWith({
        apiKey: 'test-key',
        model: 'gpt-4o'
      });
    });
  });

  describe('setOpenAIApiKey', () => {
    it('should configure vision provider with new API key', () => {
      const mockConfigure = jest.fn();
      (OpenAIVisionProvider as jest.Mock).mockImplementation(() => ({
        configure: mockConfigure
      }));

      const frami = new Frami();
      frami.setOpenAIApiKey('new-key', 'gpt-4-turbo');

      expect(mockConfigure).toHaveBeenCalledWith({
        apiKey: 'new-key',
        model: 'gpt-4-turbo'
      });
    });
  });

  describe('recommendThumbnails', () => {
    it('should create instance and accept options', async () => {
      const frami = new Frami({ openaiApiKey: 'test-key' });
      expect(frami).toBeInstanceOf(Frami);
      
      try {
        await frami.recommendThumbnails('/nonexistent/video.mp4');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });
});