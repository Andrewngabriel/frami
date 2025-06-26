const Frami = require('../dist/index.js').default;
const path = require('path');

async function testBasicUsage() {
  console.log('🎬 Testing Frami - Basic Usage');
  
  // Check if OpenAI API key is set
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Please set OPENAI_API_KEY environment variable');
    process.exit(1);
  }

  // Initialize Frami
  const frami = new Frami({
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiModel: 'gpt-4o'
  });

  // Test video path (you'll need to provide your own video file)
  const videoPath = process.argv[2];
  if (!videoPath) {
    console.error('❌ Please provide a video file path as an argument');
    console.log('Usage: node examples/basic-usage.js /path/to/your/video.mp4');
    process.exit(1);
  }

  try {
    console.log(`📹 Analyzing video: ${videoPath}`);
    console.log('⏳ This may take a few moments...\n');

    const startTime = Date.now();
    const result = await frami.recommendThumbnails(videoPath, {
      maxFrames: 8,
      topN: 3
    });

    console.log('✅ Analysis complete!\n');
    console.log(`📊 Results Summary:`);
    console.log(`   • Video Duration: ${result.videoMetadata.duration.toFixed(1)}s`);
    console.log(`   • Resolution: ${result.videoMetadata.width}x${result.videoMetadata.height}`);
    console.log(`   • Processing Time: ${(Date.now() - startTime) / 1000}s`);
    console.log(`   • Model Used: ${result.model}\n`);

    console.log('🏆 Top Thumbnail Recommendations:');
    result.bestFrames.forEach((candidate, index) => {
      console.log(`\n   ${index + 1}. Timestamp: ${candidate.frame.timestamp.toFixed(1)}s`);
      console.log(`      Score: ${(candidate.score * 100).toFixed(1)}%`);
      console.log(`      Confidence: ${(candidate.confidence * 100).toFixed(1)}%`);
      console.log(`      Colorfulness: ${candidate.analysis.colorfulness}/100`);
      console.log(`      Contrast: ${candidate.analysis.contrast}/100`);
      console.log(`      Sharpness: ${candidate.analysis.sharpness}/100`);
      console.log(`      Brightness: ${candidate.analysis.brightness}/100`);
      
      if (candidate.analysis.faceCount !== undefined) {
        console.log(`      Faces: ${candidate.analysis.faceCount}`);
      }
      if (candidate.analysis.objectCount !== undefined) {
        console.log(`      Objects: ${candidate.analysis.objectCount}`);
      }
      if (candidate.analysis.description) {
        console.log(`      Description: ${candidate.analysis.description}`);
      }
    });

    console.log('\n🎉 Test completed successfully!');

  } catch (error) {
    console.error('❌ Error during analysis:', error.message);
    
    if (error.message.includes('OpenAI')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('   • Check your OpenAI API key is valid');
      console.log('   • Ensure you have sufficient credits');
      console.log('   • Try with a smaller video file');
    } else if (error.message.includes('No frames extracted')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('   • Check the video file exists and is readable');
      console.log('   • Ensure FFmpeg is working (it should be auto-installed)');
      console.log('   • Try with a different video format');
    }
  }
}

testBasicUsage();