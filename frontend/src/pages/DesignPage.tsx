/**
 * @module pages/DesignPage
 * @description Design studio page for creating and approving artwork
 * @since 2025-11-21
 */

import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { apiGet, apiPost, apiPatch } from '../utils/api';
import { Button } from '@components/Button';
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

function DesignContent(): JSX.Element {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getToken, isLoaded, isSignedIn } = useAuth();

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
    if (isLoaded && isSignedIn) {
      fetchOrderAndDesigns();
    }
  }, [orderId, isLoaded, isSignedIn]);

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
        const token = await getToken();
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
  }, [hasGeneratingDesign, orderId, getToken]);

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
      const token = await getToken();
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
        const match = (productsResponse.data || []).find((p: Product) => p.id === firstItem?.productId);
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
      setError('Failed to generate surprise prompt');
    } finally {
      setIsLoadingSurprise(false);
    }
  };

  const handleGenerateDesign = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt or use Surprise Me');
      return;
    }

    if (!orderId) {
      setError('No order ID found');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      const token = await getToken();
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

      const response = await apiPost('/api/designs/generate', {
        orderId,
        prompt: promptText,
        style: selectedStyle,
      }, token);

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
      setError(err.message || 'Failed to generate design');
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
        prev.map((d) =>
          d.id === designId ? { ...d, approvalStatus: true } : d
        )
      );

      // Update order status
      if (order) {
        setOrder({ ...order, status: 'DESIGN_APPROVED' });
      }

      // Show success message
      alert('Design approved! Your order will be submitted for printing.');
    } catch (err: any) {
      console.error('Error approving design:', err);
      setError(err.message || 'Failed to approve design');
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
      const token = await getToken();
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

      const latestCompleted = [...designs]
        .filter((d) => d.status === 'COMPLETED')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

      if (latestCompleted && !latestCompleted.approvalStatus) {
        await apiPost(`/api/designs/${latestCompleted.id}/approve`, {}, token);
        setDesigns((prev) =>
          prev.map((d) =>
            d.id === latestCompleted.id ? { ...d, approvalStatus: true } : d
          )
        );
        setOrder((prev) => (prev ? { ...prev, status: 'DESIGN_APPROVED' } : prev));
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
    const landingUrl = 'https://gptees.app/?utm_source=customer_share&utm_medium=design&utm_campaign=ugc';
    const shareTarget = design.imageUrl || landingUrl;
    const shareText = `I just designed this one-of-one tee on GPTees. What do you think? Start yours here: ${landingUrl}`;

    try {
      setShareFeedback(null);
      const supportsNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

      if (supportsNativeShare) {
        await navigator.share({
          title: 'My GPTee design',
          text: shareText,
          url: shareTarget,
        });
        setShareFeedback('Shared! Thanks for spreading the word. Post it anywhere else by copying the link below.');
        trackEvent('design.share.success', {
          order_id: order?.id ?? orderId,
          design_id: design.id,
          method: 'web-share',
        });
        return;
      }

      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${shareText}\nPreview: ${shareTarget}`);
        setShareFeedback('Link copied. Paste it to get votes and invite friends to make theirs.');
        trackEvent('design.share.success', {
          order_id: order?.id ?? orderId,
          design_id: design.id,
          method: 'clipboard',
        });
        return;
      }

      window.prompt('Copy this link to share your GPTee:', `${shareText} Preview: ${shareTarget}`);
      setShareFeedback('Copy the link above to share your GPTee design anywhere.');
      trackEvent('design.share.success', {
        order_id: order?.id ?? orderId,
        design_id: design.id,
        method: 'prompt',
      });
    } catch (err: any) {
      console.error('Error sharing design:', err);
      setShareFeedback('Could not share right now. Copy the preview link manually and keep creating.');
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
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Missing Order ID</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-max py-12">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Order Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
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
    order.maxDesigns === 9999
      ? 'unlimited'
      : order.maxDesigns - order.designsGenerated;
  const isPreviewOrder =
    order.status === 'PENDING_PAYMENT' || order.status === 'DESIGN_PENDING';
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
  const hasReachedLimit =
    order.maxDesigns !== 9999 && order.designsGenerated >= order.maxDesigns;
  const generationBlockedMessage =
    order.status === 'SUBMITTED' ||
    order.status === 'SHIPPED' ||
    order.status === 'DELIVERED'
      ? 'Fulfillment has started for this order. Create a new preview to keep designing.'
      : 'This order is not eligible for new designs. Start a new preview order to continue.';

  // You can manually refresh designs via the button, keeping hook order stable to avoid React hook invariant issues.

  return (
    <div className="container-max py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Design Studio
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Describe your idea and we will craft the artwork for your GPTee
        </p>
      </div>

      {/* Order Info Bar */}
      <div className="hidden! bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 mb-6 flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-primary-800 dark:text-primary-200">
            <strong>Order:</strong> {order.orderNumber}
          </p>
          <p className="text-sm text-primary-800 dark:text-primary-200">
            <strong>Tier:</strong> {order.designTier}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-primary-800 dark:text-primary-200">
            <strong>Designs Generated:</strong> {order.designsGenerated}/{' '}
            {order.maxDesigns === 9999 ? 'unlimited' : order.maxDesigns}
          </p>
          <p className="text-sm text-primary-800 dark:text-primary-200">
            <strong>Remaining:</strong>{' '}
            {typeof remainingDesigns === 'number' ? remainingDesigns : 'unlimited'}
          </p>
        </div>
      </div>

      {isPreviewOrder && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              Preview mode: generate before you pay.
            </p>
            <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
              We will reuse this preview order at checkout so your designs and prompt stay attached. Checkout will lock the latest design and fit you selected.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={handleCheckoutRedirect}
            className="w-full md:w-auto"
            disabled={isCheckingOut}
          >
            Lock & checkout
          </Button>
        </div>
      )}

      {product && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Pick your fit</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Choose size and color now that you see the artwork. Your choice is saved when you checkout.
              </p>
            </div>
            {variantMessage && (
              <p className="text-xs text-green-700 dark:text-green-300">{variantMessage}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Color</p>
                <div className="flex gap-2 flex-wrap">
                  {product.colors.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => handleVariantSelect(c.name, selectedSize || product.sizes[0])}
                      className={`w-10 h-10 rounded-full border-2 transition-all cursor-pointer ${
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
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Size</p>
                <div className="flex gap-2 flex-wrap text-xs">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() =>
                        handleVariantSelect(
                          selectedColor || product.colors[0]?.name || 'Black',
                          s
                        )
                      }
                      className={`px-3 py-2 rounded-full border transition-colors cursor-pointer ${
                        selectedSize === s
                          ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-200'
                          : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200'
                      }`}
                      aria-label={`Select size ${s}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Apply the fit that matches your design. We capture it when you checkout; once paid, fit is locked for printing.
              </p>
            </div>

            {designs.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">See it on all colors</p>
                <div className="grid grid-cols-2 gap-3">
                  {product.colors.slice(0, 4).map((c) => {
                    const mockKey = c.name.toLowerCase();
                    const mockSrc = previewMocks[mockKey];
                    return (
                      <div
                        key={c.name}
                        className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-900"
                      >
                        <div
                          className="relative h-36 flex items-center justify-center"
                          style={mockSrc ? { backgroundImage: `url(${mockSrc})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { backgroundColor: c.hex }}
                        >
                          <img
                            src={designs[0].thumbnailUrl || designs[0].imageUrl}
                            alt={designs[0].prompt}
                            className="max-h-24 max-w-[70%] object-contain absolute inset-0 m-auto"
                          />
                        </div>
                        <p className="text-center text-[11px] text-gray-800 dark:text-gray-100 py-1">
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
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-6">
            <p className="text-yellow-800 dark:text-yellow-300 text-sm">
              Only {remainingDesigns} design left on this tier. Make it count or consider Premium for unlimited redraws.
            </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-800 dark:text-red-400">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Design Generator Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Generate New Design
          </h2>

          {!canGenerate && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 dark:text-yellow-400 text-sm">
                {generationBlockedMessage}
              </p>
            </div>
          )}

          {hasReachedLimit && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 dark:text-yellow-400 text-sm">
                You've reached your design limit for the {order.designTier} tier.
                Upgrade to Premium for unlimited designs!
              </p>
            </div>
          )}

          {(isGenerating || hasGeneratingDesign) && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <p className="text-blue-800 dark:text-blue-300 text-sm">
                {isGenerating
                  ? 'Generating your design... this can take 10–30 seconds.'
                  : 'Uploading to storage... image will refresh automatically.'}
              </p>
            </div>
          )}

          {/* Prompt Input */}
          <div className="mb-4">
            <label
              htmlFor="prompt"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Describe Your Design
            </label>
            <textarea
              id="prompt"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A fierce lion with a crown in a minimalist style"
              disabled={!canGenerate || hasReachedLimit}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Preset Prompts */}
          <div className="hidden! mb-6">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quick start</p>
            <div className="flex flex-wrap gap-2">
              {PRESET_PROMPTS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => handlePresetSelect(preset)}
                  className="text-xs border border-gray-300 dark:border-gray-600 rounded-full px-3 py-2 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  type="button"
                >
                  {preset}
                </button>
              ))}
              <button
                onClick={() => {
                  setSelectedStyle('trendy');
                  handlePresetSelect('Best-selling combo: streetwear illustration, bold outline, no background');
                }}
                className="text-xs border border-primary-400 text-primary-600 dark:text-primary-300 rounded-full px-3 py-2 bg-primary-50 dark:bg-primary-900/20"
                type="button"
              >
                Use best-selling combo
              </button>
            </div>
          </div>

          {/* Style Selector */}
          <div className="hidden! mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Choose Style
            </label>
            <div className="grid grid-cols-2 gap-3">
              {STYLE_OPTIONS.map((style) => (
                <button
                  key={style.value}
                  onClick={() => setSelectedStyle(style.value)}
                  disabled={!canGenerate || hasReachedLimit}
                  className={`p-3 rounded-lg border-2 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    selectedStyle === style.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">
                    {style.label}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
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
            className="w-full mb-3"
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Generating Design...
              </span>
            ) : (
              'Generate Design'
            )}
          </Button>

          {/* Surprise Me Button */}
          <Button
            variant="secondary"
            onClick={handleSurpriseMe}
            disabled={!canGenerate || hasReachedLimit || isLoadingSurprise}
            className="w-full mb-3"
          >
            {isLoadingSurprise ? 'Loading...' : 'Surprise Me'}
          </Button>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
            Generation takes 10-30 seconds
          </p>
        </div>

        {/* Generated Designs Display */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Your Designs ({designs.length})
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Share a design to get opinions and invite friends to make their own GPTee.
          </p>
          {shareFeedback && (
            <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-lg p-3 text-sm text-primary-800 dark:text-primary-200 mb-4">
              {shareFeedback}
            </div>
          )}

          {designs.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎨</div>
              <p className="text-gray-600 dark:text-gray-400">
                No designs yet. Generate your first design!
              </p>
            </div>
          )}

          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {designs.map((design) => (
              <div
                key={design.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                {/* Design Image */}
                <div className="relative bg-gray-100 dark:bg-gray-900">
                  <img
                    src={design.thumbnailUrl || design.imageUrl}
                    alt={design.prompt}
                    className="w-full h-64 object-contain"
                  />
                  {design.status === 'GENERATING' && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                        <p className="text-sm">Uploading to storage...</p>
                      </div>
                    </div>
                  )}
                  {design.approvalStatus && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Approved
                    </div>
                  )}
                </div>

                {/* Design Info */}
                <div className="p-4">
                  <div className="mb-2 space-y-1">
                    <p
                      className={`text-sm text-gray-600 dark:text-gray-400 ${expandedPrompts[design.id] ? '' : 'line-clamp-3'}`}
                    >
                      <strong>Your Prompt:</strong> {design.prompt}
                    </p>
                    {design.prompt.length > 140 && (
                      <button
                        type="button"
                        onClick={() => togglePrompt(design.id)}
                        className="text-xs text-primary-600 dark:text-primary-300 font-semibold"
                      >
                        {expandedPrompts[design.id] ? 'Show less' : 'See full prompt'}
                      </button>
                    )}
                  </div>
                  {design.style && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                      <strong>Style:</strong> {design.style}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                    {new Date(design.createdAt).toLocaleString()}
                  </p>

                  <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:static sticky bottom-0 bg-white dark:bg-gray-800 py-3 sm:py-0 border-t sm:border-0 border-gray-200 dark:border-gray-700">
                    {!design.approvalStatus && design.status === 'COMPLETED' && (
                      isPaidOrFulfillment ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleApproveDesign(design.id)}
                          disabled={isApproving === design.id}
                          className="w-full sm:w-auto"
                        >
                          {isApproving === design.id ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                              Approving...
                            </span>
                          ) : (
                            'Approve This Design'
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
                          Lock & checkout
                        </Button>
                      )
                    )}

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleShareDesign(design)}
                      isDisabled={design.status !== 'COMPLETED'}
                      className="w-full sm:w-auto"
                    >
                      Share this design
                    </Button>
                  </div>

                  {design.approvalStatus && (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center mt-3">
                      <p className="text-sm text-green-800 dark:text-green-400 font-semibold">
                        Design Approved! Order submitted for printing.
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    Sharing uses your device share sheet when available. Otherwise we copy a link you can paste.
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

export default function DesignPage(): JSX.Element {
  return (
    <ProtectedRoute>
      <DesignContent />
    </ProtectedRoute>
  );
}
