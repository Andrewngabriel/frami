# Testing Frami Locally

## Quick Setup

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Set your OpenAI API key**:
   ```bash
   export OPENAI_API_KEY="your-openai-api-key-here"
   ```

3. **Get a test video** (any format FFmpeg supports):
   - Download a sample video or use one you have
   - Shorter videos (30s-2min) work best for testing
   - Common formats: MP4, MOV, AVI, WebM

## Testing Options

### Option 1: Basic Usage Test
```bash
node examples/basic-usage.js /path/to/your/video.mp4
```

**What it does:**
- Analyzes 8 frames from your video
- Returns top 3 thumbnail recommendations
- Shows scores, confidence, and analysis metrics

### Option 2: Advanced Usage Test
```bash
node examples/advanced-usage.js /path/to/your/video.mp4
```

**What it does:**
- Uses custom extraction settings (skip first 30s, every 20s)
- Analyzes 12 frames, returns top 5
- Includes object/face detection and descriptions
- Shows detailed analysis breakdown
- **Now saves thumbnail images to ./thumbnails directory**

### Option 3: Image Output Test (NEW!)
```bash
npm run example:images /path/to/your/video.mp4
```

**What it does:**
- Analyzes 10 frames, returns top 5 recommendations
- **Automatically saves thumbnail images as JPG files**
- Creates output directory: `./output/thumbnails`
- Files named like: `thumbnail_1_12.5s_87pct.jpg`
- Shows file paths and sizes

### Option 4: Run Unit Tests
```bash
npm test
```

**What it does:**
- Runs all 18 unit tests
- Tests core functionality without needing videos/API keys
- Validates the library works correctly

### Option 4: Interactive Node REPL
```bash
npm run build
node -e "
const Frami = require('./dist/index.js').default;
const frami = new Frami({ openaiApiKey: process.env.OPENAI_API_KEY });
// Now you can call frami.recommendThumbnails() interactively
"
```

## Sample Test Videos

If you need test videos, you can:

1. **Create a simple test video**:
   ```bash
   # If you have ffmpeg installed globally
   ffmpeg -f lavfi -i testsrc=duration=30:size=1280x720:rate=30 -f lavfi -i sine=frequency=1000:duration=30 test-video.mp4
   ```

2. **Download from free sources**:
   - Sample videos from Pixabay, Pexels (royalty-free)
   - Short clips work best for testing

## Expected Output

The test will show something like:
```
🎬 Testing Frami - Basic Usage
📹 Analyzing video: test-video.mp4
⏳ This may take a few moments...

✅ Analysis complete!

📊 Results Summary:
   • Video Duration: 30.0s
   • Resolution: 1280x720
   • Processing Time: 15.2s
   • Model Used: OpenAI GPT-4 Vision

🏆 Top Thumbnail Recommendations:

   1. Timestamp: 12.5s
      Score: 87.3%
      Confidence: 89.1%
      Colorfulness: 78/100
      Contrast: 85/100
      Sharpness: 82/100
      Brightness: 65/100
      Faces: 2
      Objects: 3
      Description: A vibrant scene with people in motion
```

## Troubleshooting

### "No frames extracted"
- Check video file exists and is readable
- Try a different video format
- Ensure FFmpeg is working (should auto-install)

### OpenAI API errors
- Verify API key is correct
- Check you have sufficient credits
- Try with fewer frames (reduce `maxFrames`)

### "Cannot read properties of undefined"
- Make sure to build first: `npm run build`
- Check that video path is correct

## Cost Estimation

OpenAI GPT-4 Vision pricing (as of 2024):
- ~$0.01 per image analyzed
- 10 frames = ~$0.10 per video
- Adjust `maxFrames` to control costs

## Next Steps

Once local testing works, you can:
1. Integrate into your application
2. Add custom vision providers
3. Customize the scoring algorithm
4. Add your own frame extraction logic