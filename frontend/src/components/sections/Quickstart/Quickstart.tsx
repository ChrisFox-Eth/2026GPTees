/**
 * @module components/sections/Quickstart
 * @description Quickstart component for creating preview orders with AI-generated designs
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
import { useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Button } from '@components/ui/Button';
import { apiGet, apiPost } from '@utils/api';
import { trackEvent } from '@utils/analytics';
import { Product } from '../../../types/product';
import { QUICKSTART_PROMPT_KEY } from '@utils/quickstart';
import { AnimatePresence, motion } from 'framer-motion';
import type { Design } from '../../../types/design';
import type { PendingGuestPreview } from '../../../types/preview';
import type { ColorOption } from '../../../types/product';

const PROMPT_IDEAS: string[] = [
  'Loaf-shaped corgi surrounded by sparkles, cozy and whimsical setting',
  'Thunderclouds forming the shape of a giant sleeping cat, with dramatic lighting and a whimsical atmosphere.',
  'Neon animal constellations floating in space.',
  'A mirrored tiger face with geometric shards reflecting a colorful spectrum.',
  'A 16-bit pixelated hero floating in space, with a dynamic and energetic atmosphere.',
  'A corgi astronaut planting a GPTees flag on the moon.',
  'Neon dragon riding a bicycle through a cyberpunk alley.',
  'Minimal line-art koi fish with flowing neon water.',
  '"404: Boring tee not found" in bold glitch type.',
  'A fox curled up in a blanket of clouds, dreamy and whimsical, pastel tones.',
  'Clusters of abstract shapes arranged in a surreal, dream-like composition.',
  'Steam forming tiny hearts over a teacup, soft focus, warm colors.',
  'A castle perched on the back of a giant turtle at sunset, magical atmosphere.',
  'Hamster DJ spinning tiny neon records, vibrant party scene, dynamic energy.',
  'A soft pink smoke swirling around shiny chrome objects, dreamy atmosphere.',
  'Retro sunset with palm trees, vector style, high contrast.',
  'Kawaii fox eating a slice of pizza, wearing a bow, no background.',
  'Chrome heart reflecting neon city lights at night.',
  'A phoenix rising from swirling ink, high contrast, centered.',
  'A floating library above a serene pond, enchanted vibe.',
  'Tiny dragon sleeping in a teacup, pastel florals around it.',
  'Bubble tea cup with heart-shaped bubbles, playful and bright.',
  'Steel rose with razor-blade petals, dramatic lighting.',
  'Holographic butterflies drifting across a pastel sky.',
  'Crystal cat lounging on clouds, iridescent glow.',
  'Streetwear panda carrying a boombox, bold outlines.',
  'Graffiti crown melting into butterflies, vibrant colors.',
  'Astronaut helmet with flowers blooming inside, cosmic background.',
  'Watercolor waves framed in a geometric shape, minimal palette.',
  'Origami crane made of galaxy textures, centered composition.',
  'Botanical skull with neon mushrooms, dark background.',
  'Retro badge of a T-Rex playing video games, playful colors.',
  'Minimal monogram with a lightning bolt, high contrast.',
  'Vaporwave sunset with grid lines and a lone palm tree.',
  'Solar eclipse with radiant rings and stardust.',
  'Glowing sword embedded in crystal, ethereal light.',
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
  const [prompt, setPrompt] = useState<string>(localStorage.getItem(QUICKSTART_PROMPT_KEY) || '');
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
  const { user } = useUser();
  const textareaId = 'quickstart-prompt';

  const navigate = useNavigate();
  const { isSignedIn, getToken, isLoaded } = useAuth();

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
        const parsed = JSON.parse(cached) as {
          orderId: string;
          design: Design;
          userId?: string | null;
        };
        const cachedUserId = parsed.userId || null;
        const currentUserId = user?.id || null;
        if (
          (cachedUserId && currentUserId && cachedUserId !== currentUserId) ||
          (cachedUserId && !currentUserId)
        ) {
          localStorage.removeItem(PREVIEW_CACHE_KEY);
        } else {
          setCurrentOrderId(parsed.orderId);
          setGeneratedDesign(parsed.design);
        }
      } catch (err) {
        console.error('Failed to parse preview cache', err);
        localStorage.removeItem(PREVIEW_CACHE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    const cached = localStorage.getItem(PREVIEW_CACHE_KEY);
    if (!cached) return;
    try {
      const parsed = JSON.parse(cached) as {
        orderId: string;
        design: Design;
        userId?: string | null;
      };
      const cachedUserId = parsed.userId || null;
      const currentUserId = user?.id || null;
      if (
        (cachedUserId && currentUserId && cachedUserId !== currentUserId) ||
        (cachedUserId && !currentUserId)
      ) {
        localStorage.removeItem(PREVIEW_CACHE_KEY);
        setCurrentOrderId(null);
        setGeneratedDesign(null);
      } else if (!currentOrderId) {
        setCurrentOrderId(parsed.orderId);
        setGeneratedDesign(parsed.design);
      }
    } catch (err) {
      console.error('Failed to parse preview cache on user change', err);
      localStorage.removeItem(PREVIEW_CACHE_KEY);
    }
  }, [user?.id, currentOrderId]);

  useEffect(() => {
    if (isSignedIn && currentOrderId) {
      const validateOwnership = async () => {
        try {
          const token = await getToken();
          if (!token) return;
          const orderResp = await apiGet(`/api/orders/${currentOrderId}`, token);
          const orderUserId = orderResp?.data?.userId;
          if (orderUserId && user?.id && orderUserId !== user.id) {
            localStorage.removeItem(PREVIEW_CACHE_KEY);
            setCurrentOrderId(null);
            setGeneratedDesign(null);
          }
        } catch (err: any) {
          console.warn('Preview ownership check failed, clearing cache', err?.message || err);
          localStorage.removeItem(PREVIEW_CACHE_KEY);
          setCurrentOrderId(null);
          setGeneratedDesign(null);
        }
      };
      validateOwnership();
    }
  }, [isSignedIn, currentOrderId, getToken, user?.id]);

  useEffect(() => {
    if (!isSignedIn && pendingGuest && isLoaded) {
      navigate('/auth?redirect=/');
    }
  }, [isSignedIn, pendingGuest, navigate, isLoaded]);

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
    for (let i = 0; i < 12; i += 1) {
      const designResp = await apiGet(`/api/designs/${designId}`, token);
      const design = designResp?.data as Design;
      if (design && !isTemporaryUrl(design.imageUrl || design.thumbnailUrl)) {
        setGeneratedDesign(design);
        localStorage.setItem(
          PREVIEW_CACHE_KEY,
          JSON.stringify({ orderId: design.orderId, design, userId: user?.id || null })
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
        JSON.stringify({ orderId, design: designData, userId: user?.id || null })
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

    const claimAndResume = async () => {
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

        // We already kicked off generation as a guest; go straight to design page
        localStorage.removeItem(GUEST_PREVIEW_KEY);
        setPendingGuest(null);
        setPrompt('');

        // try to hydrate design from cache or fetch latest
        const cached = localStorage.getItem(PREVIEW_CACHE_KEY);
        let designToUse: Design | null = null;
        if (cached) {
          try {
            const parsed = JSON.parse(cached) as { orderId: string; design: Design };
            if (parsed.orderId === pendingGuest.orderId) {
              designToUse = parsed.design;
              setCurrentOrderId(parsed.orderId);
              setGeneratedDesign(parsed.design);
            }
          } catch (err) {
            console.error('Failed to parse preview cache post-claim', err);
          }
        }

        // Retry-fetch designs if not immediately available (reassignment race)
        if (!designToUse) {
          for (let i = 0; i < 3 && !designToUse; i += 1) {
            try {
              const designsResp = await apiGet(
                `/api/designs?orderId=${pendingGuest.orderId}`,
                token
              );
              const designs = designsResp?.data as Design[];
              if (designs?.length) {
                designToUse = designs[0];
                setCurrentOrderId(pendingGuest.orderId);
                setGeneratedDesign(designToUse);
                localStorage.setItem(
                  PREVIEW_CACHE_KEY,
                  JSON.stringify({
                    orderId: pendingGuest.orderId,
                    design: designToUse,
                    userId: user?.id || null,
                  })
                );
                break;
              }
            } catch (err) {
              console.warn('Unable to fetch designs after claim (attempt)', err);
            }
            await new Promise((resolve) => setTimeout(resolve, 700));
          }
        }

        // If we still have a temp URL, poll Supabase until it is durable
        if (designToUse && isTemporaryUrl(designToUse.imageUrl || designToUse.thumbnailUrl)) {
          await pollDesignForSupabaseUrl(designToUse.id, token);
        }

        navigate(`/design?orderId=${pendingGuest.orderId}`);
      } catch (err: any) {
        console.error('Error claiming preview order:', err);
        setSubmitError(err?.message || 'Failed to claim your preview. Please try again.');
      } finally {
        setIsGenerating(false);
        setProgressMessage(null);
      }
    };

    claimAndResume();
  }, [isSignedIn, pendingGuest, getToken, navigate]);

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

        // Kick off generation as guest before redirect
        try {
          setProgressMessage('Generating your design while you sign in...');
          const genResponse = await apiPost('/api/designs/generate/guest', {
            orderId: guestOrderId,
            guestToken,
            prompt: promptText,
            style: QUICKSTART_STYLE,
          });
          const designData = genResponse.data as Design;
          setGeneratedDesign(designData);
          localStorage.setItem(
            PREVIEW_CACHE_KEY,
            JSON.stringify({ orderId: guestOrderId, design: designData, userId: null })
          );
        } catch (err: any) {
          console.warn('Guest design generation failed pre-auth', err);
          // We will regenerate after claim if needed
        } finally {
          setProgressMessage(null);
        }

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

  const handleStartOver = () => {
    trackEvent('quickstart.preview.reset');
    localStorage.removeItem(PREVIEW_CACHE_KEY);
    localStorage.removeItem(GUEST_PREVIEW_KEY);
    setGeneratedDesign(null);
    setCurrentOrderId(null);
    setProgressMessage(null);
    setSubmitError(null);
  };

  const hasPreview = Boolean(currentOrderId || generatedDesign);
  const showPromptUI = !isGenerating && !hasPreview;
  const showLoading = (isGenerating || isCreating) && !generatedDesign;

  return (
    <div className="flex w-full max-w-full flex-col items-start gap-6 overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow sm:p-6 dark:border-gray-700 dark:bg-gray-800">
      {showPromptUI && (
        <div className="w-full flex-1 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Your vision
            </label>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Describe the tee you want—we&apos;ll generate the artwork and take you to the design
              page to choose size and color before checkout.
            </p>
            <textarea
              id={textareaId}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Try: Retro surf wave; Minimal line-art tiger; Neon cyberpunk skyline"
              className="focus:ring-primary-500 w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-transparent focus:ring-2 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
              rows={3}
            />
          </div>

          <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">
                  Prompt ideas - Choose to Use
                </p>
              </div>
            </div>
            <div className="relative h-[64px] overflow-hidden sm:h-[68px]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.button
                  key={ideaIndex}
                  type="button"
                  onClick={() => handleUseIdea(PROMPT_IDEAS[ideaIndex])}
                  aria-label={`Try prompt: ${PROMPT_IDEAS[ideaIndex]}`}
                  className="group border-primary-200 dark:border-primary-800 hover:bg-primary-50 dark:hover:bg-primary-900 focus-visible:outline-primary-500 absolute inset-0 inline-flex transform cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-left shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                  initial={{ opacity: 0, y: 12, rotateX: -12 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  exit={{ opacity: 0, y: -12, rotateX: 12 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <span className="bg-primary-600 inline-flex h-7 items-center justify-center rounded-full px-3 text-[9px] font-bold tracking-wide text-white uppercase shadow-sm">
                    Use
                  </span>
                  <span className="text-primary-900 dark:text-primary-50 text-xs leading-snug">
                    {PROMPT_IDEAS[ideaIndex]}
                  </span>
                </motion.button>
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      {!showPromptUI && showLoading && (
        <div className="w-full space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Hang tight</p>
          <p className="text-xs text-blue-800 dark:text-blue-200">
            We&apos;re generating your preview.
          </p>
          {progressMessage && (
            <p className="text-xs text-blue-900 dark:text-blue-100">{progressMessage}</p>
          )}
        </div>
      )}

      <div className="w-full flex-shrink-0 space-y-3">
        {!hasPreview && (
          <Button
            variant="pulse-gradient"
            className="from-primary-600 w-full bg-gradient-to-r to-purple-600"
            onClick={handleSubmit}
            disabled={isCreating || isGenerating}
          >
            {isCreating
              ? 'Starting preview...'
              : isGenerating
                ? 'Working on it...'
                : 'Design my Tee!'}
          </Button>
        )}

        {hasPreview && (
          <div className="w-full space-y-2">
            <Button
              variant="pulse-gradient"
              className="from-primary-600 w-full bg-gradient-to-r to-purple-600"
              onClick={handleCheckoutRedirect}
              disabled={isGenerating || isCreating}
            >
              Go to your design
            </Button>
            <button
              type="button"
              onClick={handleStartOver}
              className="text-primary-600 dark:text-primary-300 w-full text-center text-xs underline"
              disabled={isGenerating || isCreating}
            >
              Start over
            </button>
          </div>
        )}

        {submitError && (
          <p className="text-center text-xs text-red-600 dark:text-red-400">{submitError}</p>
        )}
        {progressMessage && showPromptUI && (
          <div className="w-full rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-100">
            {progressMessage}
          </div>
        )}
        {pendingGuest && !isSignedIn && (
          <div className="w-full space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
              Sign in to reveal your free preview
            </p>
            <p className="text-xs text-amber-800 dark:text-amber-200">
              We saved your prompt and preview order. Log in to see the design and keep generating.
            </p>
            <Button
              variant="secondary"
              onClick={() => navigate('/auth?redirect=/')}
              className="w-full sm:w-auto"
            >
              Sign in to reveal
            </Button>
          </div>
        )}
        {generatedDesign && (
          <div className="w-full space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Your preview</p>
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <img
                src={generatedDesign.thumbnailUrl || generatedDesign.imageUrl}
                alt={generatedDesign.prompt}
                className="h-64 w-full bg-gray-100 object-contain dark:bg-gray-900"
              />
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
