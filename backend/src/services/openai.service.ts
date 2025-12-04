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
const STYLE_PROMPTS: Record<NonNullable<DesignGenerationParams['style']>, string> = {
  modern: 'in a modern, clean, minimalist style with bold colors',
  vintage: 'in a vintage, retro style with muted colors and aged textures',
  artistic: 'in an artistic, creative style with expressive brushstrokes',
  playful: 'in a playful, fun style with bright colors and whimsical elements',
  professional: 'in a professional, sophisticated style with elegant design',
  trendy: 'in a trendy, contemporary style with current design trends',
};

type LayoutIntent = 'pattern' | 'single';

/**
 * Normalize user prompt to reduce noise for detection & enhancement
 */
function normalizePrompt(prompt: string): string {
  return prompt.trim().replace(/\s+/g, ' ');
}

/**
 * Very lightweight layout detection based on language only
 * (no extra user controls)
 */
function detectLayoutIntent(prompt: string): LayoutIntent {
  const lower = prompt.toLowerCase();

  const patternKeywords = [
    'pattern',
    'seamless',
    'repeating',
    'repeat pattern',
    'all over',
    'all-over',
    'tiled',
    'tileable',
    'wallpaper',
    'fabric print',
    'allover',
  ];

  const isPattern = patternKeywords.some((kw) => lower.includes(kw));

  return isPattern ? 'pattern' : 'single';
}

/**
 * Enhance prompt based on style and inferred layout
 * @param basePrompt - User's base prompt
 * @param style - Selected style
 * @returns Enhanced prompt actually sent to DALL-E
 */
function enhancePrompt(basePrompt: string, style?: DesignGenerationParams['style']): string {
  const normalized = normalizePrompt(basePrompt);
  const lower = normalized.toLowerCase();
  const layout = detectLayoutIntent(normalized);

  // Optional style fragment
  const styleFragment =
    style && STYLE_PROMPTS[style] ? ` ${STYLE_PROMPTS[style]}` : '';

  // Shared constraints for *all* designs
  const sharedConstraints =
    ' Vector illustration, clean digital art, screen-print friendly. ' +
    'No text, no logos, no watermarks. ' +
    'Do not show any t-shirts, hoodies, clothing, models, people, mannequins, ' +
    'hands, closets, hangers, or product mockups of any kind. ' +
    'Only show the artwork itself, not the design printed on an object.';

  if (layout === 'pattern') {
    // Pattern / all-over fabric style
    const backgroundAlreadySpecified =
      /\bno background\b|\btransparent background\b/.test(lower);

    const backgroundInstructions = backgroundAlreadySpecified
      ? ' Treat any background as flat and simple; avoid scenery or objects that break the repeat.'
      : ' Use a transparent or plain simple background behind the pattern only; avoid scenery or complex environments.';

    return (
      normalized +
      styleFragment +
      '. Create a seamless, repeating pattern that completely fills the entire canvas, ' +
      'suitable for an all-over t-shirt or fabric print. ' +
      'The pattern should tile perfectly on all edges with no visible seams or blank borders. ' +
      'Use high contrast and bold shapes so details remain readable when printed.' +
      sharedConstraints +
      backgroundInstructions
    );
  }

  // Single centered graphic / sticker-style illustration
  const backgroundAlreadySpecified =
    /\bno background\b|\btransparent background\b/.test(lower);

  const backgroundInstructions = backgroundAlreadySpecified
    ? ' Treat the background as transparent or plain and avoid extra scenery or props.'
    : ' Use a transparent or plain white background only; do not add scenery, environments, or extra background elements.';

  return (
    normalized +
    styleFragment +
    '. Create a single, centered, sticker-style illustration for a t-shirt print. ' +
    'The main subject should be fully visible (not cropped), occupying most of the canvas ' +
    'with even, clean padding around all four sides. ' +
    'Use high contrast and bold shapes so the design reads clearly when printed from a distance.' +
    sharedConstraints +
    backgroundInstructions
  );
}

/**
 * Check content moderation
 * @param prompt - Prompt to check
 * @returns True if safe, false if flagged
 */
export async function moderateContent(prompt: string): Promise<boolean> {
  try {
    const moderation = await openai.moderations.create({
      input: prompt,
      // model: 'omni-moderation-latest', // optional; let API default if not configured
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
 * @param params - Generation parameters
 * @returns Generated design
 */
export async function generateDesign(
  params: DesignGenerationParams
): Promise<DesignGenerationResult> {
  const { prompt, style, size = '1024x1024' } = params;

  // Check content moderation first against the *user* prompt
  const isSafe = await moderateContent(prompt);
  if (!isSafe) {
    throw new Error('Prompt contains inappropriate content and cannot be processed.');
  }

  // Enhance prompt with style + inferred layout
  const enhancedPrompt = enhancePrompt(prompt, style);

  console.log('Generating design with DALL-E 3...');
  console.log('Original prompt:', prompt);
  console.log('Enhanced prompt:', enhancedPrompt);

  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: enhancedPrompt,
      n: 1,
      size,
      quality: 'standard',
      // style: 'vivid', // uncomment if you want consistently punchy color
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

    console.log('Design generated successfully');

    return {
      imageUrl,
      revisedPrompt,
    };
  } catch (error: any) {
    console.error('DALL-E 3 generation error:', error);

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
 * @returns Random prompt
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
