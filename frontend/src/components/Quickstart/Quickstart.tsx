/**
 * @module components/Quickstart
 * @description Quickstart CTA to add a default tee to cart with minimal input.
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Button } from '@components/Button';
import { apiGet } from '@utils/api';
import { useCart } from '../../hooks/useCart';
import { trackEvent } from '@utils/analytics';
import { Product } from '../../types/product';

const QUICKSTART_PROMPT_KEY = 'gptees_quickstart_prompt';

export default function Quickstart(): JSX.Element {
  const [products, setProducts] = useState<Product[]>([]);
  const [prompt, setPrompt] = useState<string>(
    localStorage.getItem(QUICKSTART_PROMPT_KEY) || ''
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();

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

  const defaultColor = product?.colors?.[0]?.name || 'Black';
  const defaultSize = product?.sizes?.[2] || product?.sizes?.[0] || 'M';
  const tier = 'PREMIUM';

  const handleSubmit = () => {
    if (!product) return;

    const tierPrice = product.tierPricing?.[tier]?.price ?? 0;
    const basePrice = Number(product.basePrice);

    addToCart({
      productId: product.id,
      productName: product.name,
      size: defaultSize,
      color: defaultColor,
      tier: tier as 'BASIC' | 'PREMIUM',
      quantity: 1,
      basePrice,
      tierPrice,
      imageUrl: product.imageUrl,
    });

    // Save prompt for use after payment/design
    if (prompt.trim()) {
      localStorage.setItem(QUICKSTART_PROMPT_KEY, prompt.trim());
    }

    trackEvent('quickstart.submit', {
      product_id: product.id,
      color: defaultColor,
      size: defaultSize,
      tier,
      has_prompt: Boolean(prompt.trim()),
    });

    navigate(isSignedIn ? '/checkout' : '/auth');
  };

  if (loading || !product) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-5 border border-gray-200 dark:border-gray-700">
        <p className="text-gray-600 dark:text-gray-300">Loading quickstart…</p>
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-5 sm:p-6 flex flex-col sm:flex-row gap-4 items-start">
      <div className="flex-1 space-y-2">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Design a tee in 60 seconds
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          We preselected our best-selling Bella 3001 (Black, {defaultSize}) with Premium (unlimited retries). Enter one prompt, we handle the rest.
        </p>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Your prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Vintage surf wave, bold line art, no background"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            rows={3}
          />
        </div>
      </div>
      <div className="w-full sm:w-64 flex-shrink-0 space-y-3">
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-16 h-16 rounded-md object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-md bg-gray-200 dark:bg-gray-700" />
            )}
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{product.name}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {defaultColor} · {defaultSize} · Premium
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            Unlimited retries until you approve.
          </p>
        </div>
        <Button variant="primary" className="w-full" onClick={handleSubmit}>
          Generate preview
        </Button>
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          You’ll pay first, then generate and approve your design.
        </p>
      </div>
    </div>
  );
}
