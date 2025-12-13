/**
 * @module services/openai
 * @description OpenAI DALL-E 3 service for AI-powered t-shirt design generation. Handles prompt enhancement, content moderation, and image generation with style customization.
 * @since 2025-11-21
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORGANIZATION_ID,
});

/**
 * Design generation parameters interface
 * @interface DesignGenerationParams
 * @property {string} prompt - User's design prompt
 * @property {string} [style] - Optional style preset
 * @property {string} [size] - Image dimensions
 */
export interface DesignGenerationParams {
  prompt: string;
  style?: 'modern' | 'vintage' | 'artistic' | 'playful' | 'professional' | 'trendy';
  size?: '1024x1024' | '1024x1792' | '1792x1024';
}

/**
 * Design generation result interface
 * @interface DesignGenerationResult
 * @property {string} imageUrl - URL to generated image
 * @property {string} revisedPrompt - DALL-E's revised/enhanced prompt
 */
export interface DesignGenerationResult {
  imageUrl: string;
  revisedPrompt: string;
}

/**
 * Style-based prompt enhancements mapping
 * Maps style names to prompt suffixes that guide DALL-E generation
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
 * @function enhancePrompt
 * @description Enhances user's base prompt with style-specific guidance and print-ready graphic best practices. Adds style modifiers and guardrails to reduce unwanted product mockups/background scenes.
 *
 * @param {string} basePrompt - User's original design prompt
 * @param {string} [style] - Optional style preset to apply
 *
 * @returns {string} Enhanced prompt with style and print optimization
 *
 * @example
 * const enhanced = enhancePrompt('a dragon', 'vintage');
 * // Returns: "a dragon in a vintage, retro style with muted colors and aged textures. Output a standalone, print-ready graphic illustration (not a product photo/mockup). Centered composition, high contrast, clean edges. No background scene; isolate subject on a plain transparent or solid background."
 */
const APPAREL_TRIGGER_REGEX =
  /\b(t\s*-?\s*shirt|tshirt|tee\s*-?\s*shirt)s?\b/gi;

const TEXT_INTENT_REGEX =
  /["“”`]|(\btext\b|\btypography\b|\bletter(?:ing|s)?\b|\bword(?:s)?\b|\bquote\b|\bslogan\b|\bphrase\b|\bcaption\b|\bheadline\b|\btitle\b|\bmonogram\b|\binitials?\b)/i;

function normalizeBasePrompt(prompt: string): string {
  const trimmed = prompt.trim();
  if (!trimmed) return '';

  const apparelNeutralized = trimmed.replace(APPAREL_TRIGGER_REGEX, 'graphic');
  return apparelNeutralized.replace(/\s+/g, ' ').trim();
}

function shouldAllowText(prompt: string): boolean {
  return TEXT_INTENT_REGEX.test(prompt);
}

function enhancePrompt(basePrompt: string, style?: string): string {
  let enhanced = normalizeBasePrompt(basePrompt);

  // Add style enhancement
  if (style && STYLE_PROMPTS[style as keyof typeof STYLE_PROMPTS]) {
    enhanced += ` ${STYLE_PROMPTS[style as keyof typeof STYLE_PROMPTS]}`;
  }

  // Add product-agnostic print guidance to reduce mockups/background scenes
  enhanced +=
    '. Output a standalone, print-ready graphic illustration (not a product photo/mockup). Centered composition, high contrast, clean edges. No background scene; isolate subject on a plain transparent or solid background.';

  if (!shouldAllowText(enhanced)) {
    enhanced += ' No text, letters, numbers, watermark, or signature.';
  }

  return enhanced;
}

/**
 * @function moderateContent
 * @description Checks prompt content for policy violations using OpenAI's moderation API. Prevents generation of inappropriate, harmful, or policy-violating content.
 *
 * @param {string} prompt - User prompt to moderate
 *
 * @returns {Promise<boolean>} True if content is safe, false if flagged
 *
 * @example
 * const isSafe = await moderateContent('a cute puppy');
 * if (!isSafe) {
 *   throw new Error('Content violates policies');
 * }
 *
 * @async
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
 * @function generateDesign
 * @description Generates a custom print-ready graphic using OpenAI's DALL-E 3 model. Includes content moderation, prompt enhancement, and error handling for common OpenAI API errors.
 *
 * @param {DesignGenerationParams} params - Design generation parameters
 * @param {string} params.prompt - User's design description
 * @param {string} [params.style] - Optional style preset ('modern', 'vintage', etc.)
 * @param {string} [params.size='1024x1024'] - Image dimensions
 *
 * @returns {Promise<DesignGenerationResult>} Generated design with image URL and revised prompt
 * @returns {string} imageUrl - Temporary URL to generated image (expires after 1 hour)
 * @returns {string} revisedPrompt - DALL-E's enhanced version of the prompt
 *
 * @throws {Error} When prompt contains inappropriate content
 * @throws {Error} When prompt is invalid (400 error)
 * @throws {Error} When rate limit is exceeded (429 error)
 * @throws {Error} When OpenAI service has an error (500 error)
 *
 * @example
 * const design = await generateDesign({
 *   prompt: 'a majestic dragon',
 *   style: 'vintage',
 *   size: '1024x1024'
 * });
 *
 * @async
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
 * @function generateRandomPrompt
 * @description Generates random creative prompt for the "Surprise Me" feature. Combines random subjects and themes to create unique design prompts.
 *
 * @returns {string} Randomly generated design prompt
 *
 * @example
 * const prompt = generateRandomPrompt();
 * // Returns something like: "a majestic dragon with vibrant colors"
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
