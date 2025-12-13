/**
 * @module components/sections/Quickstart
 * @description Quickstart component for creating preview orders with custom designs
 * @since 2025-11-21
 */

/**
 * @component
 * @description Complex component that handles the entire preview order creation flow including:
 * - Prompt input with rotating ideas
 * - Guest preview creation before authentication
 * - Design generation via API with polling for Supabase URLs
 * - Preview caching and ownership validation
 * - Design display and checkout navigation
 * - Sign-in flow integration with Clerk
 *
 * Supports both authenticated and guest users, with automatic claim flow after sign-in.
 * Includes extensive error handling, loading states, and analytics tracking throughout the flow.
 *
 * @returns {JSX.Element} Card container with prompt input, idea suggestions, preview display, and action buttons
 *
 * @example
 * <Quickstart />
 */

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@components/ui/Button';
import { apiGet } from '@utils/api';
import { useCreationCorridor } from '@components/CreationCorridor';
import { trackEvent } from '@utils/analytics';
import { Product } from '../../../types/product';
import type { QuickstartPrefillEventDetail } from '../../../types/domEvents';
import { QUICKSTART_PROMPT_KEY } from '@utils/quickstart';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const PROMPT_IDEAS: string[] = [
  'A cosmic koi fish shaped like a crescent moon, neon linework, bold outline.',
  'A shattered stained-glass butterfly with prismatic shards, crisp vector edges.',
  'A neon ramen bowl where the noodles form a spiral galaxy, high contrast.',
  'A black cat made of constellations and star maps, clean silhouette, centered.',
  'A chrome skull with blooming wildflowers bursting through, dramatic lighting.',
  'A retro arcade joystick as an ancient relic, stone texture + glowing runes.',
  'A phoenix made of ink splashes and sharp brush strokes, centered, high contrast.',
  'A symmetrical tiger mask built from geometric facets, iridescent gradients.',
  'A crystal heart cracked open with tiny lightning inside, glossy highlights.',
  'A cute robot holding a tiny bonsai tree, bold shapes, playful color palette.',
  'A whirlpool of paper cranes forming an infinity symbol, minimal palette.',
  'A mountain range shaped like audio waveforms, clean lines, bold outline.',
  'A jellyfish made of holographic ribbons, elegant curves, high contrast.',
  'A streetwear panda DJ with oversized headphones, thick outlines, vibrant colors.',
  'A dragon curled into a circular emblem, engraved line art, sharp details.',
  'A lucky cat statue with cyberpunk neon accents, glossy ceramic look.',
  'A compass rose made of interlocking roses and gears, ornate symmetry.',
  'A sword made of frozen light, fractured prism edges, centered composition.',
  'A tarot-style sun and moon duo, minimal shapes, bold contrast, clean edges.',
  'A koi fish skeleton rendered as delicate lace filigree, monochrome, centered.',
  'A retro surf wave badge with halftone shading, bold outlines, vibrant accents.',
  'A giant mushroom with tiny glowing windows like a lantern house, whimsical.',
  'A hummingbird made of folded origami paper, sharp creases, bright gradients.',
  'A galactic eye with rings like Saturn, crisp vector shapes, high contrast.',
  'A rose made of polished steel with rivets, industrial + elegant contrast.',
  'A bear face split into day/night halves, clean symmetry, minimal palette.',
  'A skull-shaped hourglass with swirling sand as stardust, centered, dramatic.',
  'A neon crown melting into butterflies, bold outline, punchy colors.',
  'A potion bottle filled with tiny floating planets, clean silhouette, centered.',
  'A dragonfly made of circuit traces, sleek tech aesthetic, high contrast.',
  'A vintage camera with a tiny universe inside the lens, glossy highlights.',
  'A geometric mandala built from ocean waves, crisp line art, centered.',
  'A wolf silhouette filled with aurora gradients, clean edges, high contrast.',
  'A sparkly donut as a black hole, playful colors, bold outline.',
  'A lighthouse built from stacked crystals, radiant glow, centered composition.',
  'A mechanical owl with floral engravings, ornate detail, clean silhouette.',
];

const QUICKSTART_STYLE = 'trendy';
const QUICKSTART_TIER = 'LIMITLESS';

export default function Quickstart(): JSX.Element {
  const [products, setProducts] = useState<Product[]>([]);
  const [prompt, setPrompt] = useState<string>(localStorage.getItem(QUICKSTART_PROMPT_KEY) || '');
  const [size, setSize] = useState<string>('');
  const [color, setColor] = useState<string>('');
  const [ideaIndex, setIdeaIndex] = useState<number>(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const textareaId = 'quickstart-prompt';

  const { start: startCorridor } = useCreationCorridor();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await apiGet('/api/products');
        setProducts(response.data || []);
      } catch (err: unknown) {
        console.warn('Quickstart products failed to load', err);
        setSubmitError('Unable to load products right now. Please refresh and try again.');
      }
    };
    loadProducts();
  }, []);

  const product = useMemo(() => {
    return products.find((p) => p.slug === 'basic-tee') || products[0] || null;
  }, [products]);

  const defaultColor =
    product?.colors?.find((c) => c.name.toLowerCase() === 'black')?.name ||
    product?.colors?.[0]?.name ||
    'Black';
  const defaultSize =
    product?.sizes?.find((s) => s === 'XL') || product?.sizes?.[2] || product?.sizes?.[0] || 'XL';
  const tier = QUICKSTART_TIER;

  useEffect(() => {
    if (!product) return;
    setSize(
      product.sizes?.find((s) => s === 'XL') || product.sizes?.[2] || product.sizes?.[0] || 'XL'
    );
    setColor(
      product.colors?.find((c) => c.name.toLowerCase() === 'black')?.name ||
        product.colors?.[0]?.name ||
        'Black'
    );
  }, [product]);

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<QuickstartPrefillEventDetail>;
      const idea = customEvent.detail?.prompt;
      if (!idea) return;
      setPrompt(idea);
      const textarea = document.getElementById(textareaId);
      if (textarea) {
        textarea.focus();
      }
    };
    window.addEventListener('gptees.quickstart.prefill', handler);
    return () => window.removeEventListener('gptees.quickstart.prefill', handler);
  }, [textareaId]);

  useEffect(() => {
    if (!PROMPT_IDEAS.length) return;
    const id = setInterval(() => {
      setIdeaIndex(Math.floor(Math.random() * PROMPT_IDEAS.length));
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const handleUseIdea = (idea: string) => {
    setPrompt(idea);
    trackEvent('quickstart.prompt_idea_select', { idea });
    const textarea = document.getElementById(textareaId) as HTMLTextAreaElement | null;
    if (textarea) {
      textarea.focus();
    }
  };

  const handleSubmit = async () => {
    const promptText = prompt.trim();
    if (!promptText) {
      setSubmitError('Please describe your idea to start your preview.');
      return;
    }
    if (!product) {
      setSubmitError('Unable to start without a product. Please refresh and try again.');
      return;
    }

    setSubmitError(null);
    try {
      setIsStarting(true);
      await startCorridor({
        prompt: promptText,
        style: QUICKSTART_STYLE,
        productId: product.id,
        color: color || defaultColor,
        size: size || defaultSize,
        tier,
        quantity: 1,
      });
    } catch (err: unknown) {
      console.error('Creation corridor start failed from quickstart', err);
      setSubmitError('Unable to start your draft right now. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="flex w-full max-w-full flex-col items-start gap-6 overflow-hidden rounded-xl border border-muted/20 bg-surface p-5 shadow-soft sm:p-6 dark:border-muted-dark/20 dark:bg-surface-dark">
      <div className="w-full flex-1 space-y-4">
        <div className="space-y-2">
          <label className="font-sans text-sm font-semibold text-ink dark:text-ink-dark">
            Describe your idea
          </label>
          <p className="font-sans text-xs text-muted dark:text-muted-dark">
            Tell us what to create. You&apos;ll preview the artwork before choosing your fit and color.
          </p>
          <p className="font-sans text-xs text-muted dark:text-muted-dark">
            Shopping for someone else?{' '}
            <Link to="/gift" className="text-accent hover:underline dark:text-accent-dark">
              Gift card
            </Link>
            .
          </p>
          <textarea
            id={textareaId}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Try: Retro surf wave; Minimal line-art tiger; Neon cyberpunk skyline"
            className="w-full resize-none rounded-lg border border-muted/30 bg-surface px-3 py-2 font-sans text-sm text-ink placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 dark:border-muted-dark/30 dark:bg-surface-dark dark:text-ink-dark dark:placeholder:text-muted-dark/60 dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
            rows={3}
          />
        </div>

        <div className="space-y-2 rounded-lg border border-muted/20 bg-surface-2 p-3 dark:border-muted-dark/20 dark:bg-surface-dark">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="font-sans text-xs font-semibold text-ink dark:text-ink-dark">Ideas to try</p>
            </div>
          </div>
          <div className="relative h-[64px] overflow-hidden sm:h-[68px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.button
                key={ideaIndex}
                type="button"
                onClick={() => handleUseIdea(PROMPT_IDEAS[ideaIndex])}
                aria-label={`Try idea: ${PROMPT_IDEAS[ideaIndex]}`}
                className="group absolute inset-0 inline-flex transform cursor-pointer items-center gap-3 rounded-xl border border-accent/20 bg-surface px-3 py-2 text-left shadow-sm transition-colors hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 dark:border-accent-dark/20 dark:bg-surface-dark dark:hover:bg-accent-dark/10"
                initial={{ opacity: 0, y: 12, rotateX: -12 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                exit={{ opacity: 0, y: -12, rotateX: 12 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="inline-flex h-7 items-center justify-center rounded-full bg-accent px-3 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm dark:bg-accent-dark">
                  Use
                </span>
                <span className="font-sans text-xs leading-snug text-ink dark:text-ink-dark">
                  {PROMPT_IDEAS[ideaIndex]}
                </span>
              </motion.button>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="w-full flex-shrink-0 space-y-3">
        <Button
          variant="pulse-gradient"
          className="w-full bg-accent hover:opacity-90 dark:bg-accent-dark"
          onClick={handleSubmit}
          disabled={isStarting || !product}
        >
          {isStarting ? 'Starting draft…' : 'Create draft'}
        </Button>

        {submitError && (
          <p className="text-center text-xs text-red-600 dark:text-red-400">{submitError}</p>
        )}
      </div>
    </div>
  );
}
