import { OpenAI } from 'openai';
import { BaseVisionProvider } from '../core/base-classes';
import { VideoFrame, FrameAnalysis, AnalysisOptions, ProviderConfig } from '../core/interfaces';

export class OpenAIVisionProvider extends BaseVisionProvider {
  private client: OpenAI | null = null;

  getName(): string {
    return 'OpenAI GPT-4 Vision';
  }

  configure(config: ProviderConfig): void {
    super.configure(config);
    this.validateConfig(['apiKey']);
    
    this.client = new OpenAI({
      apiKey: this.config.apiKey as string
    });
  }

  async analyzeFrame(frame: VideoFrame, options: AnalysisOptions = {}): Promise<FrameAnalysis> {
    if (!this.client) {
      throw new Error('OpenAI client not configured. Call configure() first.');
    }

    const base64Image = frame.imageBuffer.toString('base64');
    const model = this.config.model as string || 'gpt-4o';
    
    const prompt = this.buildPrompt(options);
    
    try {
      const response = await this.client.chat.completions.create({
        model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/${frame.format};base64,${base64Image}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.1
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content from OpenAI');
      }

      return this.parseAnalysisResponse(content, options);
    } catch (error) {
      throw new Error(`OpenAI Vision analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildPrompt(options: AnalysisOptions): string {
    if (options.customPrompt) {
      return options.customPrompt;
    }

    let prompt = `Analyze this video frame for thumbnail potential. Rate each aspect from 0-100 and provide reasoning:

REQUIRED METRICS:
- Colorfulness: How vibrant and diverse are the colors?
- Contrast: How well do elements stand out from each other?
- Brightness: Overall lighting quality (avoid too dark/bright)
- Sharpness: Image clarity and focus quality

Format your response as JSON:
{
  "colorfulness": <0-100>,
  "contrast": <0-100>, 
  "brightness": <0-100>,
  "sharpness": <0-100>`;

    if (options.includeObjectDetection) {
      prompt += `,
  "objectCount": <number of distinct objects>`;
    }

    if (options.includeFaceDetection) {
      prompt += `,
  "faceCount": <number of faces detected>`;
    }

    if (options.includeTextDetection) {
      prompt += `,
  "textDetected": <true/false>`;
    }

    if (options.includeDescription) {
      prompt += `,
  "description": "<brief description of the scene>",
  "tags": ["<relevant>", "<descriptive>", "<tags>"]`;
    }

    prompt += `
}

Prioritize frames that would make engaging thumbnails with good visual appeal for video content.`;

    return prompt;
  }

  private parseAnalysisResponse(content: string, options: AnalysisOptions): FrameAnalysis {
    try {
      // Try to find JSON in various formats
      let jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        // Try to find JSON wrapped in code blocks
        jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          jsonMatch[0] = jsonMatch[1];
        }
      }
      
      if (!jsonMatch) {
        // If no JSON found, try to extract values manually from text
        console.warn('No JSON found in OpenAI response, attempting to parse text manually');
        return this.parseTextResponse(content);
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      const analysis: FrameAnalysis = {
        colorfulness: this.validateScore(parsed.colorfulness),
        contrast: this.validateScore(parsed.contrast),
        brightness: this.validateScore(parsed.brightness),
        sharpness: this.validateScore(parsed.sharpness)
      };

      if (options.includeObjectDetection && typeof parsed.objectCount === 'number') {
        analysis.objectCount = Math.max(0, parsed.objectCount);
      }

      if (options.includeFaceDetection && typeof parsed.faceCount === 'number') {
        analysis.faceCount = Math.max(0, parsed.faceCount);
      }

      if (options.includeTextDetection && typeof parsed.textDetected === 'boolean') {
        analysis.textDetected = parsed.textDetected;
      }

      if (options.includeDescription) {
        if (typeof parsed.description === 'string') {
          analysis.description = parsed.description;
        }
        if (Array.isArray(parsed.tags)) {
          analysis.tags = parsed.tags.filter((tag: any) => typeof tag === 'string');
        }
      }

      return analysis;
    } catch (error) {
      throw new Error(`Failed to parse OpenAI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseTextResponse(content: string): FrameAnalysis {
    // Fallback parsing for when JSON isn't provided
    const extractNumber = (pattern: RegExp): number => {
      const match = content.match(pattern);
      if (match) {
        const num = parseInt(match[1]);
        return isNaN(num) ? 50 : Math.max(0, Math.min(100, num));
      }
      return 50;
    };

    return {
      colorfulness: extractNumber(/colorfulness[:\s]*(\d+)/i),
      contrast: extractNumber(/contrast[:\s]*(\d+)/i),
      brightness: extractNumber(/brightness[:\s]*(\d+)/i),
      sharpness: extractNumber(/sharpness[:\s]*(\d+)/i),
      objectCount: extractNumber(/object[s]?[:\s]*(\d+)/i) || undefined,
      faceCount: extractNumber(/face[s]?[:\s]*(\d+)/i) || undefined,
      textDetected: /text[:\s]*(true|yes|detected)/i.test(content),
      description: content.length > 200 ? content.substring(0, 200) + '...' : content
    };
  }

  private validateScore(value: any): number {
    const num = Number(value);
    if (isNaN(num)) return 50;
    return Math.max(0, Math.min(100, num));
  }
}