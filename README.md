# Frami

A TypeScript library for intelligent video thumbnail recommendation using AI vision models. Frami analyzes video frames to recommend the most engaging thumbnails for improved click-through rates.

![cover.png](cover.png)

## Features

- 🎯 **Smart Frame Selection**: AI-powered analysis of video frames for optimal thumbnail selection
- 🔧 **Extensible Architecture**: Support for multiple vision providers (OpenAI GPT-4 Vision, and more)
- ⚡ **Lightweight**: Minimal dependencies with efficient frame extraction
- 🧪 **Well Tested**: Comprehensive test coverage
- 📦 **TypeScript**: Full type safety and excellent DX

## Installation

```bash
npm install frami
```

## Quick Start

```typescript
import Frami from 'frami';

const frami = new Frami({
  openaiApiKey: 'your-openai-api-key'
});

const result = await frami.recommendThumbnails('./video.mp4', {
  maxFrames: 10,
  topN: 3
});

console.log('Best thumbnail candidates:', result.bestFrames);
```

## API Reference

### Constructor Options

```typescript
interface FramiOptions {
  openaiApiKey?: string;        // OpenAI API key
  openaiModel?: string;         // Model name (default: 'gpt-4o')
  maxFrames?: number;           // Max frames to analyze (default: 10)
  topN?: number;               // Number of recommendations (default: 3)
  extractionOptions?: ExtractionOptions;
  analysisOptions?: AnalysisOptions;
}
```

### Main Method

#### `recommendThumbnails(videoPath, options?)`

Analyzes a video and returns thumbnail recommendations.

**Parameters:**
- `videoPath` (string): Path to the video file
- `options` (object, optional): Configuration options

**Returns:** `Promise<ThumbnailRecommendation>`

```typescript
interface ThumbnailRecommendation {
  bestFrames: ThumbnailCandidate[];
  videoMetadata: VideoMetadata;
  processingTime: number;
  model: string;
}

interface ThumbnailCandidate {
  frame: VideoFrame;
  score: number;           // 0-1 quality score
  confidence: number;      // 0-1 confidence level
  analysis: FrameAnalysis;
}
```

## Advanced Usage

### Custom Frame Extraction

```typescript
import { Frami, FFmpegFrameExtractor } from 'frami';

const frami = new Frami({ openaiApiKey: 'your-key' });

const result = await frami.recommendThumbnails('./video.mp4', {
  extractionOptions: {
    maxFrames: 15,
    intervalSeconds: 30,    // Extract every 30 seconds
    startTime: 60,          // Start at 1 minute
    endTime: 300,           // End at 5 minutes
    quality: 'high'
  }
});
```

### Custom Analysis Options

```typescript
const result = await frami.recommendThumbnails('./video.mp4', {
  analysisOptions: {
    includeObjectDetection: true,
    includeFaceDetection: true,
    includeTextDetection: true,
    includeDescription: true,
    customPrompt: 'Focus on frames with people and bright colors'
  }
});
```

### Using Custom Providers

```typescript
import { 
  ThumbnailRecommender, 
  OpenAIVisionProvider,
  FFmpegFrameExtractor,
  DefaultThumbnailSelector 
} from 'frami';

// Create custom components
const visionProvider = new OpenAIVisionProvider();
visionProvider.configure({ apiKey: 'your-key' });

const recommender = new ThumbnailRecommender(
  visionProvider,
  new FFmpegFrameExtractor(),
  new DefaultThumbnailSelector()
);

const result = await recommender.recommendThumbnails('./video.mp4');
```

## Scoring Algorithm

Frami evaluates frames based on multiple criteria:

- **Colorfulness** (25%): Vibrant, diverse colors
- **Contrast** (25%): Clear distinction between elements  
- **Sharpness** (20%): Image clarity and focus
- **Brightness** (15%): Optimal lighting (not too dark/bright)
- **Object Count** (10%): Presence of interesting objects
- **Face Count** (5%): Human faces for engagement

Additional bonuses are applied for:
- Presence of faces (+10%)
- Absence of text overlays (+5%)
- Emotional or action-oriented content (+15%)

## Requirements

- Node.js 16+
- FFmpeg (automatically handled via ffmpeg-static)
- OpenAI API key for vision analysis

## Supported Formats

Frami supports all video formats that FFmpeg can process, including:
- MP4, MOV, AVI, MKV
- WebM, FLV, WMV
- And many more

## Error Handling

```typescript
try {
  const result = await frami.recommendThumbnails('./video.mp4');
} catch (error) {
  if (error.message.includes('No frames extracted')) {
    console.log('Video may be corrupted or unsupported format');
  } else if (error.message.includes('OpenAI')) {
    console.log('API key issue or rate limit exceeded');
  }
}
```

## Development

### Local Development
```bash
git clone https://github.com/andrewngabriel/frami.git
cd frami
npm install
npm run build
npm test
```

### Testing Locally
```bash
# Basic test
npm run example:basic /path/to/video.mp4

# Advanced test with image output
npm run example:images /path/to/video.mp4
```

See [test-local.md](./test-local.md) for detailed testing instructions.

### Publishing

This package uses automated GitHub Actions for publishing to NPM. See [PUBLISHING.md](./PUBLISHING.md) for complete instructions.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Run `npm test` to ensure all tests pass
5. Submit a pull request

## Repository

- **GitHub**: [andrewngabriel/frami](https://github.com/andrewngabriel/frami)
- **NPM**: [frami](https://www.npmjs.com/package/frami)
- **Issues**: [GitHub Issues](https://github.com/andrewngabriel/frami/issues)

## License

ISC