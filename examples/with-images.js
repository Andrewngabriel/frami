const Frami = require('../dist/index.js').default;
const path = require('path');

async function testWithImageOutput() {
  console.log('🎬 Testing Frami - With Image Output');
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Please set OPENAI_API_KEY environment variable');
    process.exit(1);
  }

  const videoPath = process.argv[2];
  if (!videoPath) {
    console.error('❌ Please provide a video file path');
    console.log('Usage: node examples/with-images.js /path/to/your/video.mp4');
    process.exit(1);
  }

  const frami = new Frami({
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiModel: 'gpt-4o'
  });

  try {
    const outputDir = './output/thumbnails';
    console.log(`📹 Analyzing video and saving thumbnails: ${videoPath}`);
    console.log(`💾 Output directory: ${outputDir}`);
    console.log('⏳ This may take a few moments...\n');

    const startTime = Date.now();
    
    // Use the new method that automatically saves images
    const result = await frami.recommendThumbnailsWithImages(videoPath, outputDir, {
      maxFrames: 10,
      topN: 5,
      imageFormat: 'jpg',
      imageQuality: 90,
      filenamePrefix: 'thumbnail'
    });

    const processingTime = (Date.now() - startTime) / 1000;

    console.log('✅ Analysis and image saving complete!\n');
    
    console.log(`📊 Results Summary:`);
    console.log(`   • Video Duration: ${result.videoMetadata.duration.toFixed(1)}s`);
    console.log(`   • Resolution: ${result.videoMetadata.width}x${result.videoMetadata.height}`);
    console.log(`   • Processing Time: ${processingTime.toFixed(1)}s`);
    console.log(`   • Model Used: ${result.model}`);
    console.log(`   • Images Saved: ${result.savedImages.length}\n`);

    console.log('🏆 Generated Thumbnails:');
    result.bestFrames.forEach((candidate, index) => {
      const imagePath = result.savedImages[index];
      const filename = path.basename(imagePath);
      
      console.log(`\n   ${index + 1}. ${filename}`);
      console.log(`      📁 Path: ${imagePath}`);
      console.log(`      ⏰ Timestamp: ${candidate.frame.timestamp.toFixed(1)}s`);
      console.log(`      📊 Score: ${(candidate.score * 100).toFixed(1)}%`);
      console.log(`      🎯 Confidence: ${(candidate.confidence * 100).toFixed(1)}%`);
      
      console.log(`      📈 Metrics:`);
      console.log(`         • Colorfulness: ${candidate.analysis.colorfulness}/100`);
      console.log(`         • Contrast: ${candidate.analysis.contrast}/100`);
      console.log(`         • Brightness: ${candidate.analysis.brightness}/100`);
      console.log(`         • Sharpness: ${candidate.analysis.sharpness}/100`);
      
      if (candidate.analysis.faceCount !== undefined) {
        console.log(`         • Faces: ${candidate.analysis.faceCount}`);
      }
      if (candidate.analysis.objectCount !== undefined) {
        console.log(`         • Objects: ${candidate.analysis.objectCount}`);
      }
      if (candidate.analysis.description) {
        console.log(`      💬 Description: ${candidate.analysis.description}`);
      }
    });

    console.log(`\n📁 All thumbnails saved to: ${outputDir}`);
    console.log('🎉 Test completed successfully!');
    console.log('\n💡 You can now view the generated thumbnail images in your file explorer!');

  } catch (error) {
    console.error('❌ Error during analysis:', error.message);
    
    if (error.message.includes('OpenAI')) {
      console.log('\n💡 OpenAI-related troubleshooting:');
      console.log('   • Check your API key is valid and has credits');
      console.log('   • The advanced analysis uses more detailed prompts');
      console.log('   • Try reducing maxFrames to lower costs');
    } else if (error.message.includes('No frames extracted')) {
      console.log('\n💡 Video processing troubleshooting:');
      console.log('   • Ensure the video file exists and is readable');
      console.log('   • Check that FFmpeg is working properly');
    } else if (error.message.includes('ENOENT') || error.message.includes('permission')) {
      console.log('\n💡 File system troubleshooting:');
      console.log('   • Check you have write permissions for the output directory');
      console.log('   • The output directory will be created if it doesn\'t exist');
    }
  }
}

testWithImageOutput();