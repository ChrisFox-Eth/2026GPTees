/**
 * @module components/Quickstart
 * @description Quickstart CTA to start a preview order with minimal input.
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Button } from '@components/Button';
import { apiGet, apiPost } from '@utils/api';
import { trackEvent } from '@utils/analytics';
import { Product } from '../../types/product';
import { QUICKSTART_PROMPT_KEY } from '@utils/quickstart';
import { AnimatePresence, motion } from 'framer-motion';
import type { Design } from '../../types/design';
import type { PendingGuestPreview } from '../../types/preview';
import type { ColorOption } from '../../types/product';
// const STYLE_PRESETS = ['Retro surf', 'Minimal line art', 'Neon cyberpunk', 'Vintage anime', 'Bold typographic'];
// const PROMPT_SUGGESTIONS = ['Birthday gift', 'Band tee', 'Inside joke', 'Sports drop', 'Team merch'];

const PROMPT_IDEAS: string[] = [
  'A corgi astronaut planting a GPTees flag on the moon.',
  'Neon dragon riding a bicycle through a cyberpunk alley.',
  'Minimal line-art koi fish with flowing neon water.',
  '"404: Boring tee not found" in bold glitch type.',
  'A fox curled up in a blanket of clouds, dreamy and whimsical, pastel tones',
  'Clusters of abstract shapes arranged in a surreal, dream-like composition.',
  'Steam forming tiny hearts over a teacup, soft focus, warm colors',
  'A castle perched on the back of a giant turtle, with a sunset in the background, magical atmosphere',
  'Hamster DJ spinning tiny neon records, vibrant party scene, dynamic energy',
  'A soft pink smoke swirling around shiny chrome objects, creating a dreamy atmosphere.',
  'Loaf-shaped corgi surrounded by sparkles, cozy and whimsical setting',
  'Thunderclouds forming the shape of a giant sleeping cat, with dramatic lighting and a whimsical atmosphere.',
  'Neon animal constellations floating in space.',
  'A mirrored tiger face with geometric shards reflecting a colorful spectrum.',
  'A 16-bit pixelated hero floating in space, with a dynamic and energetic atmosphere.',
];

const GUEST_PREVIEW_KEY = 'gptees_preview_guest';
const PREVIEW_CACHE_KEY = 'gptees_quickstart_preview_cache';
const QUICKSTART_STYLE = 'trendy';
const QUICKSTART_TIER = 'LIMITLESS';

const FALLBACK_COLORS: ColorOption[] = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Navy', hex: '#1b2a4f' },
  { name: 'Heather Gray', hex: '#9ea3ab' },
];

const FALLBACK_PRODUCT: Product = {
  id: 'fallback-basic-tee',
  name: 'Limitless Tee',
  slug: 'basic-tee',
  description: 'Limitless design-first tee with free previews.',
  basePrice: 54.99,
  printfulId: 'fallback',
  category: 'T_SHIRT',
  sizes: ['S', 'M', 'L', 'XL', '2XL'],
  colors: FALLBACK_COLORS,
  imageUrl: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const isTemporaryUrl = (url?: string | null) => {
  if (!url) return true;
  const lower = url.toLowerCase();
  return lower.includes('oaidalle') || lower.includes('openai');
};

export default function Quickstart(): JSX.Element {
  const [products, setProducts] = useState<Product[]>([FALLBACK_PRODUCT]);
  const [prompt, setPrompt] = useState<string>(
    localStorage.getItem(QUICKSTART_PROMPT_KEY) || ''
  );
  const [size, setSize] = useState<string>('');
  const [color, setColor] = useState<string>('');
  const [ideaIndex, setIdeaIndex] = useState<number>(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [generatedDesign, setGeneratedDesign] = useState<Design | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [pendingGuest, setPendingGuest] = useState<PendingGuestPreview | null>(null);
  const textareaId = 'quickstart-prompt';

  const navigate = useNavigate();
  const { isSignedIn, getToken } = useAuth();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await apiGet('/api/products');
        setProducts(response.data || []);
      } catch (err: any) {
        console.warn('Quickstart products fallback in use', err);
      }
    };
    loadProducts();
  }, []);

  const product = useMemo(
    () => products.find((p) => p.slug === 'basic-tee') || products[0],
    [products]
  );

  useEffect(() => {
    const stored = localStorage.getItem(GUEST_PREVIEW_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as PendingGuestPreview;
        setPendingGuest(parsed);
      } catch (err) {
        console.error('Failed to parse pending guest preview', err);
        localStorage.removeItem(GUEST_PREVIEW_KEY);
      }
    }

    const cached = localStorage.getItem(PREVIEW_CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as { orderId: string; design: Design };
        setCurrentOrderId(parsed.orderId);
        setGeneratedDesign(parsed.design);
      } catch (err) {
        console.error('Failed to parse preview cache', err);
        localStorage.removeItem(PREVIEW_CACHE_KEY);
      }
    }
  }, []);

  const defaultColor =
    product?.colors?.find((c) => c.name.toLowerCase() === 'black')?.name ||
    product?.colors?.[0]?.name ||
    'Black';
  const defaultSize =
    product?.sizes?.find((s) => s === 'XL') ||
    product?.sizes?.[2] ||
    product?.sizes?.[0] ||
    'XL';
  const tier = QUICKSTART_TIER;

  useEffect(() => {
    if (!product) return;
    setSize(
      product.sizes?.find((s) => s === 'XL') ||
        product.sizes?.[2] ||
        product.sizes?.[0] ||
        'XL'
    );
    setColor(
      product.colors?.find((c) => c.name.toLowerCase() === 'black')?.name ||
        product.colors?.[0]?.name ||
        'Black'
    );
  }, [product]);

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ prompt?: string }>;
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

  const pollDesignForSupabaseUrl = async (designId: string, token: string) => {
    for (let i = 0; i < 8; i += 1) {
      const designResp = await apiGet(`/api/designs/${designId}`, token);
      const design = designResp?.data as Design;
      if (design && !isTemporaryUrl(design.imageUrl || design.thumbnailUrl)) {
        setGeneratedDesign(design);
        localStorage.setItem(
          PREVIEW_CACHE_KEY,
          JSON.stringify({ orderId: design.orderId, design })
        );
        return design;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    return null;
  };

  const generateDesignWithToken = async (
    orderId: string,
    promptText: string,
    styleValue: string,
    token: string
  ) => {
    const response = await apiPost(
      '/api/designs/generate',
      {
        orderId,
        prompt: promptText,
        style: styleValue,
      },
      token
    );
    const designData = response.data as Design;
    setGeneratedDesign(designData);
    setCurrentOrderId(orderId);
    trackEvent('quickstart.preview.generated', {
      order_id: orderId,
      prompt_length: promptText.length,
      style: styleValue,
      source: 'quickstart_home',
    });

    if (isTemporaryUrl(designData.imageUrl)) {
      await pollDesignForSupabaseUrl(designData.id, token);
    } else {
      localStorage.setItem(
        PREVIEW_CACHE_KEY,
        JSON.stringify({ orderId, design: designData })
      );
    }

    navigate(`/design?orderId=${orderId}`);
  };

  const handleCheckoutRedirect = () => {
    if (!currentOrderId) {
      setSubmitError('Create a preview first to continue to checkout.');
      return;
    }
    trackEvent('quickstart.preview.checkout_click', {
      order_id: currentOrderId,
      source: 'quickstart_home',
    });
    navigate(`/design?orderId=${currentOrderId}`);
  };

  useEffect(() => {
    if (!isSignedIn || !pendingGuest) return;

    const claimAndGenerate = async () => {
      try {
        setIsGenerating(true);
        setProgressMessage('Reattaching your preview...');
        const token = await getToken();
        if (!token) {
          setSubmitError('Authentication required. Please sign in again.');
          return;
        }

        await apiPost(
          '/api/orders/preview/claim',
          {
            orderId: pendingGuest.orderId,
            guestToken: pendingGuest.guestToken,
          },
          token
        );

        setProgressMessage('Generating your design...');
        await generateDesignWithToken(
          pendingGuest.orderId,
          pendingGuest.prompt,
          pendingGuest.style,
          token
        );
        localStorage.removeItem(GUEST_PREVIEW_KEY);
        setPendingGuest(null);
        setPrompt('');
      } catch (err: any) {
        console.error('Error claiming preview order:', err);
        setSubmitError(err?.message || 'Failed to claim your preview. Please try again.');
      } finally {
        setIsGenerating(false);
        setProgressMessage(null);
      }
    };

    claimAndGenerate();
  }, [isSignedIn, pendingGuest, getToken]);

  const handleUseIdea = (idea: string) => {
    setPrompt(idea);
    trackEvent('quickstart.prompt_idea_select', { idea });
    const textarea = document.getElementById(textareaId) as HTMLTextAreaElement | null;
    if (textarea) {
      textarea.focus();
    }
  };

  const startGenerationFlow = async (orderId: string, promptText: string, token: string) => {
    try {
      setGeneratedDesign(null);
      setIsGenerating(true);
      setProgressMessage('Generating your design...');
      await generateDesignWithToken(orderId, promptText, QUICKSTART_STYLE, token);
      setPrompt('');
    } catch (err: any) {
      console.error('Error generating design from quickstart:', err);
      setSubmitError(err?.message || 'Failed to generate your design. Please try again.');
    } finally {
      setIsGenerating(false);
      setProgressMessage(null);
    }
  };

  const handleSubmit = async () => {
    if (!product) return;
    const promptText = prompt.trim();
    if (!promptText) {
      setSubmitError('Please add a prompt to start your preview.');
      return;
    }

    if (!isSignedIn) {
      try {
        setIsCreating(true);
        setSubmitError(null);
        const response = await apiPost('/api/orders/preview/guest', {
          productId: product.id,
          color: color || defaultColor,
          size: size || defaultSize,
          tier,
          quantity: 1,
        });

        const guestOrderId = response?.data?.orderId;
        const guestToken = response?.data?.guestToken;
        if (!guestOrderId || !guestToken) {
          throw new Error('Missing preview order details');
        }

        const guestPreview: PendingGuestPreview = {
          orderId: guestOrderId,
          guestToken,
          prompt: promptText,
          style: QUICKSTART_STYLE,
        };
        localStorage.setItem(GUEST_PREVIEW_KEY, JSON.stringify(guestPreview));
        setPendingGuest(guestPreview);

        trackEvent('quickstart.preview_guest_created', {
          product_id: product.id,
          color: color || defaultColor,
          size: size || defaultSize,
          tier,
          has_prompt: Boolean(promptText),
          order_id: guestOrderId,
        });

        navigate('/auth?redirect=/');
      } catch (err: any) {
        console.error('Error creating guest preview order:', err);
        setSubmitError(err?.message || 'Failed to start your preview. Please try again.');
      } finally {
        setIsCreating(false);
      }
      return;
    }

    try {
      setIsCreating(true);
      setSubmitError(null);
      setGeneratedDesign(null);
      const token = await getToken();
      if (!token) {
        setSubmitError('Authentication required. Please sign in again.');
        return;
      }

      const response = await apiPost(
        '/api/orders/preview',
        {
          productId: product.id,
          color: color || defaultColor,
          size: size || defaultSize,
          tier,
          quantity: 1,
        },
        token
      );

      const createdOrder = response?.data;
      const orderId = createdOrder?.id;
      if (promptText) {
        localStorage.setItem(QUICKSTART_PROMPT_KEY, promptText);
      }

      trackEvent('quickstart.preview_order_created', {
        product_id: product.id,
        color: color || defaultColor,
        size: size || defaultSize,
        tier,
        has_prompt: Boolean(promptText),
        order_id: orderId,
      });

      if (orderId) {
        setCurrentOrderId(orderId);
        await startGenerationFlow(orderId, promptText, token);
      } else {
        navigate('/design');
      }
    } catch (err: any) {
      console.error('Error creating preview order:', err);
      setSubmitError(err?.message || 'Failed to start your preview. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-5 sm:p-6 flex flex-col gap-6 items-start w-full max-w-full overflow-hidden">
      <div className="flex-1 space-y-4 w-full">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Your vision</label>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Describe the tee you want—we&apos;ll generate the artwork and take you to the design page to choose size and color before checkout.
          </p>
          <textarea
            id={textareaId}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Try: Retro surf wave; Minimal line-art tiger; Neon cyberpunk skyline"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            rows={3}
          />
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">Prompt ideas - Choose to Use</p>
                </div>
              </div>
              <div className="relative overflow-hidden h-[64px] sm:h-[68px]">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.button
                    key={ideaIndex}
                    type="button"
                    onClick={() => handleUseIdea(PROMPT_IDEAS[ideaIndex])}
                    aria-label={`Try prompt: ${PROMPT_IDEAS[ideaIndex]}`}
                    className="cursor-pointer absolute inset-0 group inline-flex items-center gap-3 rounded-xl border border-primary-200 dark:border-primary-800 hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors transform px-3 py-2 text-left shadow-sm focus-visible:outline-2 focus-visible:outline-primary-500 focus-visible:outline-offset-2"
                    initial={{ opacity: 0, y: 12, rotateX: -12 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    exit={{ opacity: 0, y: -12, rotateX: 12 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <span className="inline-flex items-center justify-center h-7 px-3 rounded-full bg-primary-600 text-white text-[9px] font-bold uppercase tracking-wide shadow-sm">
                      Use
                    </span>
                    <span className="text-xs text-primary-900 dark:text-primary-50 leading-snug">
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
          className="bg-gradient-to-r from-primary-600 to-purple-600 w-full"
          onClick={handleSubmit}
          disabled={isCreating || isGenerating}
        >
          {isCreating ? 'Starting preview...' : isGenerating ? 'Working on it...' : 'Design my Tee!'}
        </Button>
        {submitError && (
          <p className="text-xs text-red-600 dark:text-red-400 text-center">{submitError}</p>
        )}
        {progressMessage && (
          <div className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-3 text-sm text-blue-900 dark:text-blue-100">
            {progressMessage}
          </div>
        )}
        {pendingGuest && !isSignedIn && (
          <div className="w-full rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 space-y-2">
            <p className="text-sm text-amber-900 dark:text-amber-100 font-semibold">
              Sign in to reveal your free preview
            </p>
            <p className="text-xs text-amber-800 dark:text-amber-200">
              We saved your prompt and preview order. Log in to see the design and keep generating.
            </p>
            <Button variant="secondary" onClick={() => navigate('/auth?redirect=/')} className="w-full sm:w-auto">
              Sign in to reveal
            </Button>
          </div>
        )}
        {generatedDesign && (
          <div className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Your preview</p>
            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <img
                src={generatedDesign.thumbnailUrl || generatedDesign.imageUrl}
                alt={generatedDesign.prompt}
                className="w-full h-64 object-contain bg-gray-100 dark:bg-gray-900"
              />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Prompt: {generatedDesign.prompt}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="primary" onClick={handleCheckoutRedirect} className="w-full sm:w-auto">
                Go to your design
              </Button>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              We saved this preview to your account. Choose fit and continue on the design page.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
