/**
 * @module services/openai
 * @description OpenAI DALL-E 3 service for design generation
 * @since 2025-11-21
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORGANIZATION_ID,
});

export interface DesignGenerationParams {
  prompt: string;
  style?: 'modern' | 'vintage' | 'artistic' | 'playful' | 'professional' | 'trendy';
  size?: '1024x1024' | '1024x1792' | '1792x1024';
}

export interface DesignGenerationResult {
  imageUrl: string;
  revisedPrompt: string;
}

/**
 * Style-based prompt enhancements
 */
const STYLE_PROMPTS = {
  modern: 'in a modern, clean, minimalist style with bold colors',
  vintage: 'in a vintage, retro style with muted colors and aged textures',
  artistic: 'in an artistic, creative style with expressive brushstrokes',
  playful: 'in a playful, fun style with bright colors and whimsical elements',
  professional: 'in a professional, sophisticated style with elegant design',
  trendy: 'in a trendy, contemporary style with current design trends',
};

/**
 * Enhance prompt based on style
 * @param {string} basePrompt - User's base prompt
 * @param {string} style - Selected style
 * @returns {string} Enhanced prompt
 */
function enhancePrompt(basePrompt: string, style?: string): string {
  let enhanced = basePrompt;

  // Add style enhancement
  if (style && STYLE_PROMPTS[style as keyof typeof STYLE_PROMPTS]) {
    enhanced += ` ${STYLE_PROMPTS[style as keyof typeof STYLE_PROMPTS]}`;
  }

  // Add t-shirt specific guidance
  enhanced += '. Designed for a t-shirt print, high contrast, centered composition, no background.';

  return enhanced;
}

/**
 * Check content moderation
 * @param {string} prompt - Prompt to check
 * @returns {Promise<boolean>} True if safe, false if flagged
 */
export async function moderateContent(prompt: string): Promise<boolean> {
  try {
    const moderation = await openai.moderations.create({
      input: prompt,
    });

    const result = moderation.results[0];
    return !result.flagged;
  } catch (error) {
    console.error('Moderation API error:', error);
    // If moderation fails, allow the request (don't block users due to API issues)
    return true;
  }
}

/**
 * Generate AI design using DALL-E 3
 * @param {DesignGenerationParams} params - Generation parameters
 * @returns {Promise<DesignGenerationResult>} Generated design
 */
export async function generateDesign(
  params: DesignGenerationParams
): Promise<DesignGenerationResult> {
  const { prompt, style, size = '1024x1024' } = params;

  // Check content moderation first
  const isSafe = await moderateContent(prompt);
  if (!isSafe) {
    throw new Error('Prompt contains inappropriate content and cannot be processed.');
  }

  // Enhance prompt with style
  const enhancedPrompt = enhancePrompt(prompt, style);

  console.log('Generating design with DALL-E 3...');
  console.log('Original prompt:', prompt);
  console.log('Enhanced prompt:', enhancedPrompt);

  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: enhancedPrompt,
      n: 1,
      size: size,
      quality: 'standard',
      response_format: 'url',
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('No image data returned from DALL-E 3');
    }

    const imageUrl = response.data[0]?.url;
    const revisedPrompt = response.data[0]?.revised_prompt || enhancedPrompt;

    if (!imageUrl) {
      throw new Error('No image URL returned from DALL-E 3');
    }

    console.log('✓ Design generated successfully');

    return {
      imageUrl,
      revisedPrompt,
    };
  } catch (error: any) {
    console.error('❌ DALL-E 3 generation error:', error);

    // Handle specific OpenAI errors
    if (error.status === 400) {
      throw new Error('Invalid prompt. Please try a different description.');
    } else if (error.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    } else if (error.status === 500) {
      throw new Error('OpenAI service error. Please try again later.');
    }

    throw new Error(error.message || 'Failed to generate design');
  }
}

/**
 * Generate random creative prompt for "Surprise Me" feature
 * @returns {string} Random prompt
 */
export function generateRandomPrompt(): string {
  const subjects = [
    'a majestic dragon',
    'a cosmic nebula',
    'a geometric mandala',
    'a vintage motorcycle',
    'a mystical forest',
    'a retro arcade game',
    'a cyberpunk cityscape',
    'an abstract wave pattern',
    'a minimalist mountain range',
    'a steampunk robot',
    'a tropical sunset',
    'a space explorer',
    'a zen garden',
    'a neon graffiti design',
    'a mythical phoenix',
  ];

  const themes = [
    'with vibrant colors',
    'in monochrome style',
    'with geometric patterns',
    'with flowing lines',
    'in pixel art style',
    'with watercolor effects',
    'with bold outlines',
    'in a symmetrical design',
  ];

  const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
  const randomTheme = themes[Math.floor(Math.random() * themes.length)];

  return `${randomSubject} ${randomTheme}`;
}

export default openai;
