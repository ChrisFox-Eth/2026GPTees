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
// const STYLE_PRESETS = ['Retro surf', 'Minimal line art', 'Neon cyberpunk', 'Vintage anime', 'Bold typographic'];
// const PROMPT_SUGGESTIONS = ['Birthday gift', 'Band tee', 'Inside joke', 'Sports drop', 'Team merch'];

const PROMPT_IDEAS: string[] = [
  'A corgi astronaut planting a GPTees flag on the moon.',
  'Neon dragon riding a bicycle through a cyberpunk alley.',
  'Minimal line-art koi fish with flowing neon water.',
  '“404: Boring tee not found” in bold glitch type.',
  'A fox curled up in a blanket of clouds, dreamy and whimsical, pastel tones',
  'Clusters of abstract shapes arranged in a surreal, dream-like composition.',
  'Steam forming tiny hearts over a teacup, soft focus, warm colors',
  'A castle perched on the back of a giant turtle, with a sunset in the background, magical atmosphere',
  'Hamster DJ spinning tiny neon records, vibrant party scene, dynamic energy',
  'A soft pink smoke swirling around shiny chrome objects, creating a dreamy atmosphere.',
  'Loaf-shaped corgi surrounded by sparkles, cozy and whimsical setting',
  'Thunderclouds forming the shape of a giant sleeping cat, with dramatic lighting and a whimsical atmosphere.',
];

const GUEST_PREVIEW_KEY = 'gptees_preview_guest';
const QUICKSTART_STYLE = 'trendy';

export default function Quickstart(): JSX.Element {
  const [products, setProducts] = useState<Product[]>([]);
  const [prompt, setPrompt] = useState<string>(
    localStorage.getItem(QUICKSTART_PROMPT_KEY) || ''
  );
  const [size, setSize] = useState<string>('');
  const [color, setColor] = useState<string>('');
  const [ideaIndex, setIdeaIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
        setLoading(true);
        const response = await apiGet('/api/products');
        setProducts(response.data || []);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Unable to load quickstart');
      } finally {
        setLoading(false);
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
  const tier = 'PREMIUM';
  const basePrice = Number(product?.basePrice || 0);
  const tierPrice = product?.tierPricing?.[tier]?.price || 0;
  const quickstartTotal = basePrice + tierPrice;

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
      setPrompt((prev) => (prev ? `${prev} • ${idea}` : idea));
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
      setIdeaIndex((prev) => (prev + 1) % PROMPT_IDEAS.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);

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
    setGeneratedDesign(response.data as Design);
    setCurrentOrderId(orderId);
    trackEvent('quickstart.preview.generated', {
      order_id: orderId,
      prompt_length: promptText.length,
      style: styleValue,
      source: 'quickstart_home',
    });
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
    navigate(`/checkout?orderId=${currentOrderId}`);
  };

  const handleTryAgain = async () => {
    const promptText = prompt.trim() || generatedDesign?.prompt || localStorage.getItem(QUICKSTART_PROMPT_KEY) || '';
    if (!currentOrderId) {
      setSubmitError('Start a preview first, then try again.');
      return;
    }
    if (!promptText) {
      setSubmitError('Add a new prompt to try again.');
      return;
    }
    try {
      const token = await getToken();
      if (!token) {
        setSubmitError('Please sign in to regenerate your preview.');
        return;
      }
      await startGenerationFlow(currentOrderId, promptText, token);
    } catch (err: any) {
      console.error('Error regenerating preview:', err);
      setSubmitError(err?.message || 'Failed to regenerate. Please try again.');
    }
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

  if (loading || !product) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-5 border border-gray-200 dark:border-gray-700">
        <p className="text-gray-600 dark:text-gray-300">Loading quickstart...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-5 border border-red-200 dark:border-red-800">
        <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-5 sm:p-6 flex flex-col gap-6 items-start w-full max-w-full overflow-hidden">
      <div className="flex-1 space-y-4 w-full">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Your prompt</label>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Try it right here—describe the tee you want and we will reveal the artwork after you pick your fit.
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

        {product && (
          <div className="hidden! space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Color</p>
                <div className="flex gap-2 flex-wrap items-center">
                  {product.colors.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => {
                        setColor(c.name);
                        trackEvent('quickstart.color_select', { color: c.name });
                      }}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        color === c.name
                          ? 'border-primary-600 scale-110'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      aria-label={`Select color ${c.name}`}
                      aria-pressed={color === c.name}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Size</p>
                <div className="flex gap-2 flex-wrap text-xs">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setSize(s);
                        trackEvent('quickstart.size_select', { size: s });
                      }}
                      className={`px-3 py-2 rounded-full border transition-colors ${
                        size === s
                          ? 'border-primary-600 bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-200'
                          : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200'
                      }`}
                      aria-pressed={size === s}
                      aria-label={`Select size ${s}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
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
                    className="absolute inset-0 group inline-flex items-center gap-3 rounded-xl border border-primary-200 dark:border-primary-800 bg-transparent dark:bg-transparent px-3 py-2 text-left shadow-sm focus-visible:outline-2 focus-visible:outline-primary-500 focus-visible:outline-offset-2"
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
        <div className="hidden! bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-16 h-16 rounded-md object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-16 h-16 rounded-md bg-gray-200 dark:bg-gray-700" />
            )}
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{product.name}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {color || defaultColor} • {size || defaultSize} • Limitless redraws · ${quickstartTotal.toFixed(2)} all-in
              </p>
            </div>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
            Submit your fit and tier to unlock the design preview right after checkout.
          </p>
        </div>
        <Button
          variant="primary"
          className="w-full"
          onClick={handleSubmit}
          disabled={isCreating || isGenerating}
        >
          {isCreating ? 'Starting preview...' : isGenerating ? 'Working on it...' : 'Create in 60s'}
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
                src={generatedDesign.imageUrl}
                alt={generatedDesign.prompt}
                className="w-full h-64 object-contain bg-gray-100 dark:bg-gray-900"
              />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Prompt: {generatedDesign.prompt}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="primary" onClick={handleCheckoutRedirect} className="w-full sm:w-auto">
                Continue with this
              </Button>
              <Button
                variant="secondary"
                onClick={handleTryAgain}
                disabled={isGenerating}
                className="w-full sm:w-auto"
              >
                {isGenerating ? 'Generating...' : 'Try again (Premium)'}
              </Button>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              We will reuse this preview order at checkout so your artwork stays attached.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
