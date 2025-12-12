/**
 * @module pages/DesignPage
 * @description Design studio page for creating and approving artwork
 * @since 2025-11-21
 */

import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { apiGet, apiPost, apiPatch } from '../utils/api';
import { Button } from '@components/ui/Button';
import ProtectedRoute from '../components/ProtectedRoute';
import { trackEvent } from '@utils/analytics';
import { QUICKSTART_PROMPT_KEY } from '@utils/quickstart';
import type { Order } from '../types/order';
import type { Design } from '../types/design';
import type { Product } from '../types/product';
import previewBlack from '../assets/previewBlack.png';
import previewWhite from '../assets/previewWhite.png';
import previewGray from '../assets/previewGray.png';
import previewNavy from '../assets/previewNavy.png';

const STYLE_OPTIONS = [
  { value: 'modern', label: 'Modern', description: 'Clean, minimalist with bold colors' },
  { value: 'vintage', label: 'Vintage', description: 'Retro style with muted colors' },
  { value: 'artistic', label: 'Artistic', description: 'Creative with expressive strokes' },
  { value: 'playful', label: 'Playful', description: 'Fun with bright colors' },
  { value: 'professional', label: 'Professional', description: 'Sophisticated and elegant' },
  { value: 'trendy', label: 'Trendy', description: 'Contemporary design trends' },
];

const PRESET_PROMPTS = [
  'Minimal line art wave, bold outline, no background',
  'Retro sunset with palm trees, vector style, high contrast',
  'Vintage motorcycle badge, distressed texture, center composition',
  'Playful cat astronaut, cartoon style, high contrast',
  'Professional monogram logo, serif, simple and bold',
  'Streetwear graffiti tag, neon accents, no background',
];

/**
 * @function DesignContent
 * @description Protected design studio content for creating and approving AI-generated artwork with real-time polling
 *
 * @returns {JSX.Element} The design studio content with generation and approval tools
 *
 * @example
 * // Used within ProtectedRoute wrapper
 * <ProtectedRoute>
 *   <DesignContent />
 * </ProtectedRoute>
 */
function DesignContent(): JSX.Element {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true';
  const isAuthLoaded = skipAuth ? true : isLoaded;
  const isAuthed = skipAuth ? true : isSignedIn;
  const getAuthToken = async (): Promise<string | null> => {
    if (skipAuth) {
      return 'dev';
    }
    return getToken();
  };

  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<Order | null>(null);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('modern');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingSurprise, setIsLoadingSurprise] = useState(false);
  const [isApproving, setIsApproving] = useState<string | null>(null);
  const [variantMessage, setVariantMessage] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedPrompts, setExpandedPrompts] = useState<Record<string, boolean>>({});
  const hasTrackedOrderView = useRef(false);
  const hasLoadedQuickstartPrompt = useRef(false);
  const hasGeneratingDesign = designs.some((d) => d.status === 'GENERATING');

  const previewMocks: Record<string, string> = {
    black: previewBlack,
    white: previewWhite,
    gray: previewGray,
    grey: previewGray,
    navy: previewNavy,
  };

  useEffect(() => {
    if (!orderId) {
      setError('No order ID provided');
      setLoading(false);
      return;
    }
    if (isAuthLoaded && isAuthed) {
      fetchOrderAndDesigns();
    }
  }, [orderId, isAuthLoaded, isAuthed]);

  useEffect(() => {
    if (order && !hasTrackedOrderView.current) {
      hasTrackedOrderView.current = true;
      trackEvent('design.page.loaded', {
        order_id: order.id,
        status: order.status,
        design_tier: order.designTier,
        designs_generated: order.designsGenerated,
        max_designs: order.maxDesigns,
      });
    }
  }, [order]);

  useEffect(() => {
    // Only hydrate from Quickstart once to avoid re-inserting after the user clears the field.
    if (hasLoadedQuickstartPrompt.current) return;
    if (prompt) {
      hasLoadedQuickstartPrompt.current = true;
      return;
    }
    const saved = localStorage.getItem(QUICKSTART_PROMPT_KEY);
    if (saved) {
      setPrompt(saved);
    }
    hasLoadedQuickstartPrompt.current = true;
  }, [prompt]);

  // Auto-refresh while any design is still uploading/generating so the image swaps to the
  // permanent Supabase URL without a manual page refresh.
  useEffect(() => {
    if (!hasGeneratingDesign || !orderId) {
      return;
    }

    let cancelled = false;
    const pollDesigns = async () => {
      try {
        const token = await getAuthToken();
        if (!token || cancelled) {
          return;
        }
        await fetchDesigns(token);
      } catch (err) {
        console.error('Error refreshing designs:', err);
      }
    };

    // Immediate check, then poll until no generating designs remain
    pollDesigns();
    const intervalId = setInterval(pollDesigns, 5000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [hasGeneratingDesign, orderId, getToken, isSignedIn]);

  useEffect(() => {
    if (!product) return;
    if (!selectedColor && product.colors.length) {
      setSelectedColor(product.colors[0].name);
    }
    if (!selectedSize && product.sizes.length) {
      setSelectedSize(product.sizes[0]);
    }
  }, [product, selectedColor, selectedSize]);

  const fetchDesigns = async (token: string) => {
    const designsResponse = await apiGet(`/api/designs?orderId=${orderId}`, token);
    const data = designsResponse.data || [];
    setDesigns(data);
    return data;
  };

  const fetchOrderAndDesigns = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getAuthToken();
      if (!token) {
        setError('Authentication required. Please sign in again.');
        return;
      }

      // Fetch order details
      const orderResponse = await apiGet(`/api/orders/${orderId}`, token);
      const loadedOrder = orderResponse.data as Order;
      setOrder(loadedOrder);

      const firstItem = loadedOrder?.items?.[0];
      if (firstItem) {
        setSelectedColor(firstItem.color || null);
        setSelectedSize(firstItem.size || null);
        if (firstItem.product) {
          setProduct(firstItem.product as Product);
        }
      }

      // Fetch existing designs for this order
      const loadedDesigns = await fetchDesigns(token);
      trackEvent('design.gallery.loaded', {
        order_id: orderId,
        design_count: loadedDesigns.length,
      });

      if (!firstItem?.product) {
        const productsResponse = await apiGet('/api/products');
        const match = (productsResponse.data || []).find(
          (p: Product) => p.id === firstItem?.productId
        );
        if (match) {
          setProduct(match);
        }
      }
    } catch (err: any) {
      console.error('Error fetching order/designs:', err);
      setError(err.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleVariantSelect = (nextColor: string, nextSize: string) => {
    setSelectedColor(nextColor);
    setSelectedSize(nextSize);
    setVariantMessage('Fit updated. We will save this choice when you checkout.');
    trackEvent('design.variant.selected', {
      order_id: orderId,
      color: nextColor,
      size: nextSize,
    });
  };

  const handleSurpriseMe = async () => {
    try {
      setIsLoadingSurprise(true);
      const response = await apiGet('/api/designs/random-prompt');
      const promptText = response.data.prompt;
      setPrompt(promptText);
      trackEvent('design.prompt.randomized', {
        order_id: orderId,
        prompt_length: promptText?.length ?? 0,
        style: selectedStyle,
      });
    } catch (err: any) {
      console.error('Error getting random prompt:', err);
      setError('Unable to get surprise idea');
    } finally {
      setIsLoadingSurprise(false);
    }
  };

  const handleGenerateDesign = async () => {
    if (!prompt.trim()) {
      setError('Please describe your idea or use Surprise Me');
      return;
    }

    if (!orderId) {
      setError('No order ID found');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      const token = await getAuthToken();
      if (!token) {
        setError('Authentication required. Please sign in again.');
        return;
      }

      const promptText = prompt.trim();
      const remaining =
        order?.maxDesigns === 9999
          ? 'unlimited'
          : order
            ? order.maxDesigns - order.designsGenerated
            : null;

      trackEvent('design.generate.submit', {
        order_id: orderId,
        prompt_length: promptText.length,
        style: selectedStyle,
        remaining_designs: typeof remaining === 'number' ? remaining : null,
        tier: order?.designTier,
      });

      trackEvent('design.started', {
        order_id: orderId,
        prompt_length: promptText.length,
        style: selectedStyle,
      });

      const response = await apiPost(
        '/api/designs/generate',
        {
          orderId,
          prompt: promptText,
          style: selectedStyle,
        },
        token
      );

      // Add new design to the list
      setDesigns((prev) => [response.data, ...prev]);

      // Clear prompt after successful generation
      setPrompt('');

      // Update order's design count
      if (order) {
        setOrder({
          ...order,
          designsGenerated: order.designsGenerated + 1,
        });
      }

      trackEvent('design.generate.success', {
        order_id: orderId,
        design_id: response?.data?.id,
        style: selectedStyle,
      });
    } catch (err: any) {
      console.error('Error generating design:', err);
      setError(err.message || 'Unable to create draft');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveDesign = async (designId: string) => {
    try {
      setIsApproving(designId);
      setError(null);

      const token = await getToken();
      if (!token) {
        setError('Authentication required. Please sign in again.');
        setIsApproving(null);
        return;
      }
      await apiPost(`/api/designs/${designId}/approve`, {}, token);
      trackEvent('design.approval.submit', {
        order_id: order?.id ?? orderId,
        design_id: designId,
      });

      trackEvent('design.approved', {
        order_id: order?.id ?? orderId,
        design_id: designId,
      });

      // Update design in list
      setDesigns((prev) =>
        prev.map((d) => (d.id === designId ? { ...d, approvalStatus: true } : d))
      );

      // Update order status
      if (order) {
        setOrder({ ...order, status: 'DESIGN_APPROVED' });
      }

      // Show success message
      alert('Approved! Your order will be submitted for printing.');
    } catch (err: any) {
      console.error('Error approving design:', err);
      setError(err.message || 'Unable to approve design');
    } finally {
      setIsApproving(null);
    }
  };

  const handleCheckoutRedirect = async () => {
    if (!orderId || !order || !product || isCheckingOut) {
      return;
    }

    const firstItem = order.items?.[0];
    const targetColor = selectedColor || firstItem?.color || product.colors[0]?.name || 'Black';
    const targetSize = selectedSize || firstItem?.size || product.sizes[0];

    try {
      setIsCheckingOut(true);
      setError(null);
      const token = await getAuthToken();
      if (!token) {
        setError('Authentication required. Please sign in again.');
        setIsCheckingOut(false);
        return;
      }

      if (firstItem) {
        const updatedOrderResponse = await apiPatch(
          `/api/orders/${orderId}/item`,
          { color: targetColor, size: targetSize },
          token
        );
        setOrder(updatedOrderResponse.data as Order);
      }

      trackEvent('design.checkout.preview', {
        order_id: orderId,
        design_tier: order.designTier,
        designs_generated: order.designsGenerated,
      });
      navigate(`/checkout?orderId=${orderId}`);
    } catch (err: any) {
      console.error('Error preparing checkout:', err);
      setError(err?.message || 'Failed to prepare checkout. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleShareDesign = async (design: Design) => {
    const landingUrl =
      'https://gptees.app/?utm_source=customer_share&utm_medium=design&utm_campaign=ugc';
    const shareTarget = design.imageUrl || landingUrl;
    const shareText = `I just designed this custom tee on GPTees. What do you think? Start yours here: ${landingUrl}`;

    try {
      setShareFeedback(null);
      const supportsNativeShare =
        typeof navigator !== 'undefined' && typeof navigator.share === 'function';

      if (supportsNativeShare) {
        await navigator.share({
          title: 'My custom tee design',
          text: shareText,
          url: shareTarget,
        });
        setShareFeedback(
          'Shared! Thanks for spreading the word. Post it anywhere else by copying the link below.'
        );
        trackEvent('design.share.success', {
          order_id: order?.id ?? orderId,
          design_id: design.id,
          method: 'web-share',
        });
        return;
      }

      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${shareText}\nPreview: ${shareTarget}`);
        setShareFeedback('Link copied. Paste it to get feedback and invite friends to design theirs.');
        trackEvent('design.share.success', {
          order_id: order?.id ?? orderId,
          design_id: design.id,
          method: 'clipboard',
        });
        return;
      }

      window.prompt('Copy this link to share your design:', `${shareText} Preview: ${shareTarget}`);
      setShareFeedback('Copy the link above to share your design anywhere.');
      trackEvent('design.share.success', {
        order_id: order?.id ?? orderId,
        design_id: design.id,
        method: 'prompt',
      });
    } catch (err: any) {
      console.error('Error sharing design:', err);
      setShareFeedback(
        'Could not share right now. Copy the preview link manually and keep creating.'
      );
      trackEvent('design.share.error', {
        order_id: order?.id ?? orderId,
        design_id: design.id,
        message: err?.message || 'unknown',
      });
    }
  };

  const togglePrompt = (designId: string) => {
    setExpandedPrompts((prev) => ({ ...prev, [designId]: !prev[designId] }));
  };

  const handlePresetSelect = (preset: string) => {
    setPrompt(preset);
    trackEvent('design.prompt.preset_select', {
      order_id: orderId,
      prompt_length: preset.length,
    });
  };

  if (!orderId) {
    return (
      <div className="container-max py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="mb-4 text-2xl font-bold text-red-600">Missing Order ID</h1>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            Please provide an order ID to generate designs.
          </p>
          <Button variant="primary" onClick={() => navigate('/account')}>
            Go to My Account
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container-max py-12">
        <div className="flex items-center justify-center py-12">
          <div className="border-primary-600 h-12 w-12 animate-spin rounded-full border-b-2"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-max py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="mb-4 text-2xl font-bold text-red-600">Order Not Found</h1>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            The order you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button variant="primary" onClick={() => navigate('/account')}>
            Go to My Account
          </Button>
        </div>
      </div>
    );
  }

  const remainingDesigns =
    order.maxDesigns === 9999 ? 'unlimited' : order.maxDesigns - order.designsGenerated;
  const isPreviewOrder = order.status === 'PENDING_PAYMENT' || order.status === 'DESIGN_PENDING';
  const isPaidOrFulfillment =
    order.status === 'PAID' ||
    order.status === 'DESIGN_APPROVED' ||
    order.status === 'SUBMITTED' ||
    order.status === 'SHIPPED' ||
    order.status === 'DELIVERED';
  const canGenerate =
    order.status === 'PAID' ||
    order.status === 'DESIGN_PENDING' ||
    order.status === 'PENDING_PAYMENT';
  const hasReachedLimit = order.maxDesigns !== 9999 && order.designsGenerated >= order.maxDesigns;
  const generationBlockedMessage =
    order.status === 'SUBMITTED' || order.status === 'SHIPPED' || order.status === 'DELIVERED'
      ? 'Fulfillment has started for this order. Create a new preview to keep designing.'
      : 'This order is not eligible for new designs. Start a new preview order to continue.';

  // You can manually refresh designs via the button, keeping hook order stable to avoid React hook invariant issues.

  return (
    <div className="container-max py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 font-display text-3xl font-bold text-gray-900 dark:text-white">Studio</h1>
        <p className="font-sans text-gray-600 dark:text-gray-400">
          Describe your idea and we will craft the artwork for your tee
        </p>
      </div>

      {/* Order Info Bar */}
      <div className="bg-primary-50 dark:bg-primary-900/20 mb-6 hidden! flex-wrap items-center justify-between gap-4 rounded-lg p-4">
        <div>
          <p className="text-primary-800 dark:text-primary-200 text-sm">
            <strong>Order:</strong> {order.orderNumber}
          </p>
          <p className="text-primary-800 dark:text-primary-200 text-sm">
            <strong>Tier:</strong> {order.designTier}
          </p>
        </div>
        <div className="text-right">
          <p className="text-primary-800 dark:text-primary-200 text-sm">
            <strong>Designs Generated:</strong> {order.designsGenerated}/{' '}
            {order.maxDesigns === 9999 ? 'unlimited' : order.maxDesigns}
          </p>
          <p className="text-primary-800 dark:text-primary-200 text-sm">
            <strong>Remaining:</strong>{' '}
            {typeof remainingDesigns === 'number' ? remainingDesigns : 'unlimited'}
          </p>
        </div>
      </div>

      {isPreviewOrder && (
        <div className="mb-6 flex flex-col gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 md:flex-row md:items-center md:justify-between dark:border-blue-800 dark:bg-blue-900/20">
          <div>
            <p className="font-sans text-sm font-semibold text-blue-900 dark:text-blue-100">
              Design first, pay when you're ready.
            </p>
            <p className="font-sans mt-1 text-xs text-blue-800 dark:text-blue-200">
              Checkout saves your artwork, size, and color. You'll see your tee exactly as you approved it.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={handleCheckoutRedirect}
            className="w-full md:w-auto"
            disabled={isCheckingOut}
          >
            Print this tee
          </Button>
        </div>
      )}

      {product && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-sans text-sm font-semibold text-gray-900 dark:text-white">Choose your fit</p>
              <p className="font-sans text-xs text-gray-600 dark:text-gray-400">
                Select size and color. We'll lock it in at checkout.
              </p>
            </div>
            {variantMessage && (
              <p className="font-sans text-xs text-green-700 dark:text-green-300">{variantMessage}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Color</p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => handleVariantSelect(c.name, selectedSize || product.sizes[0])}
                      className={`h-10 w-10 cursor-pointer rounded-full border-2 transition-all ${
                        selectedColor === c.name
                          ? 'border-primary-600 scale-110'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      aria-label={`Select color ${c.name}`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Size</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() =>
                        handleVariantSelect(selectedColor || product.colors[0]?.name || 'Black', s)
                      }
                      className={`cursor-pointer rounded-full border px-3 py-2 transition-colors ${
                        selectedSize === s
                          ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-200'
                          : 'border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-200'
                      }`}
                      aria-label={`Select size ${s}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                We capture this fit at checkout; once paid, it’s locked for printing.
              </p>
            </div>

            {designs.length > 0 && (
              <div className="space-y-2">
                <p className="mb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  See it on all colors
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {product.colors.slice(0, 4).map((c) => {
                    const mockKey = c.name.toLowerCase();
                    const mockSrc = previewMocks[mockKey];
                    return (
                      <div
                        key={c.name}
                        className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
                      >
                        <div
                          className="relative flex h-36 items-center justify-center"
                          style={
                            mockSrc
                              ? {
                                  backgroundImage: `url(${mockSrc})`,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                }
                              : { backgroundColor: c.hex }
                          }
                        >
                          <img
                            src={designs[0].thumbnailUrl || designs[0].imageUrl}
                            alt={designs[0].prompt}
                            className="absolute inset-0 m-auto max-h-24 max-w-[70%] object-contain"
                          />
                        </div>
                        <p className="py-1 text-center text-[11px] text-gray-800 dark:text-gray-100">
                          {c.name}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {typeof remainingDesigns === 'number' && remainingDesigns <= 1 && (
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            Only {remainingDesigns} design left on this tier. Make it count or consider Premium for
            unlimited redraws.
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-red-800 dark:text-red-400">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:underline dark:text-red-400"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Design Generator Form */}
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Try a new idea</h2>

          {!canGenerate && (
            <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
              <p className="text-sm text-yellow-800 dark:text-yellow-400">
                {generationBlockedMessage}
              </p>
            </div>
          )}

          {hasReachedLimit && (
            <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
              <p className="text-sm text-yellow-800 dark:text-yellow-400">
                You've reached your design limit for the {order.designTier} tier. Upgrade to Premium
                for unlimited designs!
              </p>
            </div>
          )}

          {(isGenerating || hasGeneratingDesign) && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <p className="font-sans text-sm text-blue-800 dark:text-blue-300">
                {isGenerating
                  ? 'Creating your draft... this takes 10–30 seconds.'
                  : 'Finalizing image... will refresh automatically.'}
              </p>
            </div>
          )}

          {/* Prompt Input */}
          <div className="mb-4">
            <label
              htmlFor="prompt"
              className="mb-2 block font-sans text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Describe your idea
            </label>
            <textarea
              id="prompt"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Short and clear wins: e.g., retro surf wave badge"
              disabled={!canGenerate || hasReachedLimit}
              className="focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-sans text-gray-900 focus:border-transparent focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Preset Prompts */}
          <div className="mb-6 hidden!">
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Quick start</p>
            <div className="flex flex-wrap gap-2">
              {PRESET_PROMPTS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => handlePresetSelect(preset)}
                  className="hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-full border border-gray-300 px-3 py-2 text-xs transition-colors dark:border-gray-600"
                  type="button"
                >
                  {preset}
                </button>
              ))}
              <button
                onClick={() => {
                  setSelectedStyle('trendy');
                  handlePresetSelect(
                    'Best-selling combo: streetwear illustration, bold outline, no background'
                  );
                }}
                className="border-primary-400 text-primary-600 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20 rounded-full border px-3 py-2 text-xs"
                type="button"
              >
                Use best-selling combo
              </button>
            </div>
          </div>

          {/* Style Selector */}
          <div className="mb-6 hidden!">
            <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Choose Style
            </label>
            <div className="grid grid-cols-2 gap-3">
              {STYLE_OPTIONS.map((style) => (
                <button
                  key={style.value}
                  onClick={() => setSelectedStyle(style.value)}
                  disabled={!canGenerate || hasReachedLimit}
                  className={`rounded-lg border-2 p-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                    selectedStyle === style.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'hover:border-primary-300 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {style.label}
                  </div>
                  <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                    {style.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            variant="primary"
            onClick={handleGenerateDesign}
            disabled={!canGenerate || hasReachedLimit || isGenerating || !prompt.trim()}
            className="mb-3 w-full"
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2 font-sans">
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                Creating draft...
              </span>
            ) : (
              <span className="font-sans">Create draft</span>
            )}
          </Button>

          {/* Surprise Me Button */}
          <Button
            variant="secondary"
            onClick={handleSurpriseMe}
            disabled={!canGenerate || hasReachedLimit || isLoadingSurprise}
            className="mb-3 w-full"
          >
            <span className="font-sans">{isLoadingSurprise ? 'Loading...' : 'Surprise Me'}</span>
          </Button>

          <p className="mt-3 text-center font-sans text-xs text-gray-500 dark:text-gray-400">
            Takes 10-30 seconds
          </p>
        </div>

        {/* Generated Designs Display */}
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h2 className="mb-4 font-display text-xl font-bold text-gray-900 dark:text-white">
            Your Designs ({designs.length})
          </h2>
          <p className="mb-3 font-sans text-sm text-gray-600 dark:text-gray-400">
            Review your options and select one to print.
          </p>
          {shareFeedback && (
            <div className="bg-primary-50 dark:bg-primary-900/20 border-primary-100 dark:border-primary-800 text-primary-800 dark:text-primary-200 mb-4 rounded-lg border p-3 text-sm">
              {shareFeedback}
            </div>
          )}

          {designs.length === 0 && (
            <div className="py-12 text-center">
              <div className="mb-4 text-6xl">🎨</div>
              <p className="font-sans text-gray-600 dark:text-gray-400">
                No designs yet. Create your first draft!
              </p>
            </div>
          )}

          <div className="max-h-[600px] space-y-4 overflow-y-auto">
            {designs.map((design) => (
              <div
                key={design.id}
                className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
              >
                {/* Design Image */}
                <div className="relative bg-gray-100 dark:bg-gray-900">
                  <img
                    src={design.thumbnailUrl || design.imageUrl}
                    alt={design.prompt}
                    className="h-64 w-full object-contain"
                  />
                  {design.status === 'GENERATING' && (
                    <div className="bg-opacity-50 absolute inset-0 flex items-center justify-center bg-black">
                      <div className="text-center text-white">
                        <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-white"></div>
                        <p className="font-sans text-sm">Finalizing...</p>
                      </div>
                    </div>
                  )}
                  {design.approvalStatus && (
                    <div className="absolute top-2 right-2 rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white">
                      Approved
                    </div>
                  )}
                </div>

                {/* Design Info */}
                <div className="p-4">
                  <div className="mb-2 space-y-1">
                    <p
                      className={`font-sans text-sm text-gray-600 dark:text-gray-400 ${expandedPrompts[design.id] ? '' : 'line-clamp-3'}`}
                    >
                      <strong>Description:</strong> {design.prompt}
                    </p>
                    {design.prompt.length > 140 && (
                      <button
                        type="button"
                        onClick={() => togglePrompt(design.id)}
                        className="text-primary-600 dark:text-primary-300 font-sans text-xs font-semibold"
                      >
                        {expandedPrompts[design.id] ? 'Show less' : 'See full description'}
                      </button>
                    )}
                  </div>
                  {design.style && (
                    <p className="mb-2 font-sans text-xs text-gray-500 dark:text-gray-500">
                      <strong>Style:</strong> {design.style}
                    </p>
                  )}
                  <p className="mb-3 font-sans text-xs text-gray-500 dark:text-gray-500">
                    {new Date(design.createdAt).toLocaleString()}
                  </p>

                  <div className="sticky bottom-0 mt-3 flex flex-col gap-2 border-t border-gray-200 bg-white py-3 sm:static sm:flex-row sm:border-0 sm:py-0 dark:border-gray-700 dark:bg-gray-800">
                    {!design.approvalStatus &&
                      design.status === 'COMPLETED' &&
                      (isPaidOrFulfillment ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleApproveDesign(design.id)}
                          disabled={isApproving === design.id}
                          className="w-full sm:w-auto"
                        >
                          {isApproving === design.id ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="h-3 w-3 animate-spin rounded-full border-b-2 border-white"></div>
                              Approving...
                            </span>
                          ) : (
                            'Approve & submit'
                          )}
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleCheckoutRedirect}
                          className="w-full sm:w-auto"
                          disabled={isCheckingOut}
                        >
                          Print this tee
                        </Button>
                      ))}

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleShareDesign(design)}
                      isDisabled={design.status !== 'COMPLETED'}
                      className="w-full sm:w-auto"
                    >
                      Share link
                    </Button>
                  </div>

                  {design.approvalStatus && (
                    <div className="mt-3 rounded-lg bg-green-50 p-3 text-center dark:bg-green-900/20">
                      <p className="font-sans text-sm font-semibold text-green-800 dark:text-green-400">
                        Approved! Order submitted for printing.
                      </p>
                    </div>
                  )}

                  <p className="mt-2 font-sans text-xs text-gray-500 dark:text-gray-500">
                    We'll copy a link if sharing isn't available on your device.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="mt-8 text-center">
        <Button variant="secondary" onClick={() => navigate('/account')}>
          Back to My Orders
        </Button>
      </div>
    </div>
  );
}

/**
 * @component
 * @description Design studio page for creating and approving AI-generated artwork. Features prompt input, style selection, color/size picker, design generation, approval workflow, and sharing capabilities. Protected by authentication.
 *
 * @returns {JSX.Element} The rendered design page with protected content
 *
 * @example
 * // Used in App.tsx routing
 * <Route path="/design" element={<DesignPage />} />
 */
export default function DesignPage(): JSX.Element {
  return (
    <ProtectedRoute>
      <DesignContent />
    </ProtectedRoute>
  );
}
