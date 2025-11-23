/**
 * @module pages/DesignPage
 * @description AI design generation page with DALL-E 3
 * @since 2025-11-21
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { apiGet, apiPost } from '../utils/api';
import { Button } from '@components/Button';
import ProtectedRoute from '../components/ProtectedRoute';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  designTier: string;
  designsGenerated: number;
  maxDesigns: number;
}

interface Design {
  id: string;
  prompt: string;
  revisedPrompt: string;
  imageUrl: string;
  thumbnailUrl: string;
  status: string;
  style: string | null;
  approvalStatus: boolean;
  createdAt: string;
  remainingDesigns?: number | 'unlimited';
}

const STYLE_OPTIONS = [
  { value: 'modern', label: 'Modern', description: 'Clean, minimalist with bold colors' },
  { value: 'vintage', label: 'Vintage', description: 'Retro style with muted colors' },
  { value: 'artistic', label: 'Artistic', description: 'Creative with expressive strokes' },
  { value: 'playful', label: 'Playful', description: 'Fun with bright colors' },
  { value: 'professional', label: 'Professional', description: 'Sophisticated and elegant' },
  { value: 'trendy', label: 'Trendy', description: 'Contemporary design trends' },
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingSurprise, setIsLoadingSurprise] = useState(false);
  const [isApproving, setIsApproving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  const fetchDesigns = async (token: string) => {
    const designsResponse = await apiGet(`/api/designs?orderId=${orderId}`, token);
    setDesigns(designsResponse.data || []);
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
      setOrder(orderResponse.data);

      // Fetch existing designs for this order
      await fetchDesigns(token);
    } catch (err: any) {
      console.error('Error fetching order/designs:', err);
      setError(err.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleSurpriseMe = async () => {
    try {
      setIsLoadingSurprise(true);
      const response = await apiGet('/api/designs/random-prompt');
      setPrompt(response.data.prompt);
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

      const response = await apiPost('/api/designs/generate', {
        orderId,
        prompt: prompt.trim(),
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

      // Poll for status update so the approve button appears without a manual refresh
      setTimeout(() => {
        fetchOrderAndDesigns();
      }, 4000);
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
  const canGenerate =
    order.status === 'PAID' || order.status === 'DESIGN_PENDING';
  const hasReachedLimit =
    order.maxDesigns !== 9999 && order.designsGenerated >= order.maxDesigns;

  // Auto-refresh designs when any are still generating
  useEffect(() => {
    const hasGenerating = designs.some((design) => design.status === 'GENERATING');
    if (!hasGenerating) return;

    let timer: number | undefined;
    const refresh = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        await fetchDesigns(token);
      } catch (err) {
        console.error('Error refreshing designs:', err);
      } finally {
        timer = window.setTimeout(refresh, 4000);
      }
    };

    timer = window.setTimeout(refresh, 3000);

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [designs, getToken]);

  return (
    <div className="container-max py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          AI Design Generator
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Create your custom t-shirt design using AI
        </p>
      </div>

      {/* Order Info Bar */}
      <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
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
                Order must be paid to generate designs
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

          {/* Surprise Me Button */}
          <div className="mb-4">
            <Button
              variant="secondary"
              onClick={handleSurpriseMe}
              disabled={!canGenerate || hasReachedLimit || isLoadingSurprise}
              className="w-full"
            >
              {isLoadingSurprise ? 'Loading...' : 'Surprise Me'}
            </Button>
          </div>

          {/* Style Selector */}
          <div className="mb-6">
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
            className="w-full"
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

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
            Generation takes 10-30 seconds
          </p>
        </div>

        {/* Generated Designs Display */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Your Designs ({designs.length})
          </h2>

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
                    src={design.imageUrl}
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
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <strong>Your Prompt:</strong> {design.prompt}
                  </p>
                  {design.style && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                      <strong>Style:</strong> {design.style}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                    {new Date(design.createdAt).toLocaleString()}
                  </p>

                  {/* Approve Button */}
                  {!design.approvalStatus && design.status === 'COMPLETED' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleApproveDesign(design.id)}
                      disabled={isApproving === design.id}
                      className="w-full"
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
                  )}

                  {design.approvalStatus && (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                      <p className="text-sm text-green-800 dark:text-green-400 font-semibold">
                        Design Approved! Order submitted for printing.
                      </p>
                    </div>
                  )}
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
