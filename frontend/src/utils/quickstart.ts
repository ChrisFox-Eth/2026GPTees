/**
 * @module utils/quickstart
 * @description Constants for the quickstart design flow localStorage persistence
 * @since 2025-11-21
 */

/**
 * @constant {string} QUICKSTART_PROMPT_KEY
 * @description LocalStorage key for persisting user's design prompt from the homepage
 * quickstart form. Used to carry the prompt across to the design page.
 *
 * @example
 * // Store prompt before navigation
 * localStorage.setItem(QUICKSTART_PROMPT_KEY, userPrompt);
 *
 * // Retrieve on design page
 * const savedPrompt = localStorage.getItem(QUICKSTART_PROMPT_KEY);
 */
export const QUICKSTART_PROMPT_KEY = 'gptees_quickstart_prompt';
