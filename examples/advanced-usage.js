const { 
  ThumbnailRecommender, 
  OpenAIVisionProvider, 
  FFmpegFrameExtractor, 
  DefaultThumbnailSelector,
  saveThumbnails
} = require('../dist/index.js');

async function testAdvancedUsage() {
  console.log('🎬 Testing Frami - Advanced Usage');
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Please set OPENAI_API_KEY environment variable');
    process.exit(1);
  }

  const videoPath = process.argv[2];
  if (!videoPath) {
    console.error('❌ Please provide a video file path');
    console.log('Usage: node examples/advanced-usage.js /path/to/your/video.mp4');
    process.exit(1);
  }

  try {
    console.log('🔧 Setting up custom components...');

    // Create custom vision provider
    const visionProvider = new OpenAIVisionProvider();
    visionProvider.configure({
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4o'
    });

    // Create recommender with custom components
    const recommender = new ThumbnailRecommender(
      visionProvider,
      new FFmpegFrameExtractor(),
      new DefaultThumbnailSelector()
    );

    console.log(`📹 Analyzing video with custom settings: ${videoPath}`);

    const result = await recommender.recommendThumbnails(videoPath, {
      maxFrames: 12,
      topN: 5,
      extractionOptions: {
        maxFrames: 12,
        quality: 'high',
        startTime: 30, // Skip first 30 seconds
        intervalSeconds: 20 // Extract every 20 seconds
      },
      analysisOptions: {
        includeObjectDetection: true,
        includeFaceDetection: true,
        includeTextDetection: true,
        includeDescription: true,
        customPrompt: 'Focus on frames with people, action, or visually striking elements that would make compelling thumbnails'
      }
    });

    console.log('✅ Advanced analysis complete!\n');
    console.log('📊 Detailed Results:');
    
    result.bestFrames.forEach((candidate, index) => {
      console.log(`\n🏆 Rank ${index + 1} (${candidate.frame.timestamp.toFixed(1)}s)`);
      console.log(`   Overall Score: ${(candidate.score * 100).toFixed(1)}%`);
      console.log(`   Confidence: ${(candidate.confidence * 100).toFixed(1)}%`);
      console.log(`   
   📈 Metrics:`);
      console.log(`   • Colorfulness: ${candidate.analysis.colorfulness}/100`);
      console.log(`   • Contrast: ${candidate.analysis.contrast}/100`);
      console.log(`   • Brightness: ${candidate.analysis.brightness}/100`);
      console.log(`   • Sharpness: ${candidate.analysis.sharpness}/100`);
      
      if (candidate.analysis.objectCount !== undefined) {
        console.log(`   • Objects detected: ${candidate.analysis.objectCount}`);
      }
      if (candidate.analysis.faceCount !== undefined) {
        console.log(`   • Faces detected: ${candidate.analysis.faceCount}`);
      }
      if (candidate.analysis.textDetected !== undefined) {
        console.log(`   • Text present: ${candidate.analysis.textDetected ? 'Yes' : 'No'}`);
      }
      if (candidate.analysis.description) {
        console.log(`   📝 Description: ${candidate.analysis.description}`);
      }
      if (candidate.analysis.tags && candidate.analysis.tags.length > 0) {
        console.log(`   🏷️  Tags: ${candidate.analysis.tags.join(', ')}`);
      }
    });

    console.log(`\n⏱️  Total processing time: ${result.processingTime}ms`);

    // Save thumbnail images
    console.log('\n💾 Saving thumbnail images...');
    const outputDir = './thumbnails';
    
    try {
      const imageResult = await saveThumbnails(result.bestFrames, {
        outputDir,
        format: 'jpg',
        prefix: 'best_thumbnail',
        includeTimestamp: true,
        includeScore: true
      });

      console.log('✅ Images saved successfully!');
      console.log(`📁 Output directory: ${imageResult.outputDir}`);
      console.log(`📊 Total size: ${(imageResult.totalSize / 1024).toFixed(1)} KB`);
      console.log('📸 Saved files:');
      
      imageResult.savedPaths.forEach((path, index) => {
        const candidate = result.bestFrames[index];
        console.log(`   ${index + 1}. ${path}`);
        console.log(`      → ${candidate.frame.timestamp.toFixed(1)}s (${(candidate.score * 100).toFixed(1)}% score)`);
      });
      
    } catch (imageError) {
      console.warn('⚠️  Could not save images:', imageError.message);
    }

    console.log('\n🎉 Advanced test completed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAdvancedUsage();