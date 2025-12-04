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
import { QUICKSTART_PROMPT_KEY } from '@utils/quickstart';
// const STYLE_PRESETS = ['Retro surf', 'Minimal line art', 'Neon cyberpunk', 'Vintage anime', 'Bold typographic'];
// const PROMPT_SUGGESTIONS = ['Birthday gift', 'Band tee', 'Inside joke', 'Sports drop', 'Team merch'];

export default function Quickstart(): JSX.Element {
  const [products, setProducts] = useState<Product[]>([]);
  const [prompt, setPrompt] = useState<string>(
    localStorage.getItem(QUICKSTART_PROMPT_KEY) || ''
  );
  const [size, setSize] = useState<string>('');
  const [color, setColor] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const textareaId = 'quickstart-prompt';

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

  const handleSubmit = () => {
    if (!product) return;

    const tierPrice = product.tierPricing?.[tier]?.price ?? 0;
    const basePrice = Number(product.basePrice);

    addToCart({
      productId: product.id,
      productName: product.name,
      size: size || defaultSize,
      color: color || defaultColor,
      tier: tier as 'BASIC' | 'PREMIUM',
      quantity: 1,
      basePrice,
      tierPrice,
      imageUrl: product.imageUrl,
    });

    if (prompt.trim()) {
      localStorage.setItem(QUICKSTART_PROMPT_KEY, prompt.trim());
    }

    trackEvent('quickstart.submit', {
      product_id: product.id,
      color: color || defaultColor,
      size: size || defaultSize,
      tier,
      has_prompt: Boolean(prompt.trim()),
    });

    navigate(isSignedIn ? '/checkout' : '/auth#');
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-5 sm:p-6 flex flex-col sm:flex-row gap-4 items-start w-full max-w-full overflow-hidden">
      <div className="flex-1 space-y-2 w-full">
        {/* <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Design a tee in 60 seconds
        </h3> */}
        {/* <p className="text-sm text-gray-600 dark:text-gray-400">
          QuickStart uses Limitless (Premium) so you can redraw with fresh prompts until you approve. Prefer one-and-done? Pick Classic at checkout.
        </p> */}
        {product && (
          <div className="space-y-3">
            <div className="space-y-1">
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
                    className={`px-3 py-1.5 rounded-full border transition-colors ${
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

            <div className="space-y-1">
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
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
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
          </div>
        )}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2 pb-1 px-1 text-xs">
            {/* {STYLE_PRESETS.map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => {
                  setPrompt((prev) => {
                    if (!prev) return style;
                    if (prev.includes(style)) return prev;
                    return `${prev} • ${style}`;
                  });
                  trackEvent('quickstart.style_select', { style });
                }}
                className={`px-3 py-1.5 rounded-full border ${
                  prompt === style
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-200'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200'
                }`}
              >
                {style}
              </button>
            ))} */}
          </div>
          {/* <div className="flex flex-wrap gap-2 pb-1 px-1 text-[11px]">
            {PROMPT_SUGGESTIONS.map((idea) => (
              <button
                key={idea}
                type="button"
                onClick={() => {
                  setPrompt((prev) => (prev ? `${prev.trim()} • ${idea}` : idea));
                  trackEvent('quickstart.suggestion_append', { idea });
                }}
                className="px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200"
              >
                {idea}
              </button>
            ))}
          </div> */}
          {/* <p className="text-xs text-gray-500 dark:text-gray-400">
            Birthday gift + any text; we handle layout.
          </p> */}
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Your prompt
          </label>
          <textarea
            id={textareaId}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Try: Retro surf wave; Minimal line-art tiger; Neon cyberpunk skyline"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
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
                loading="lazy"
              />
            ) : (
              <div className="w-16 h-16 rounded-md bg-gray-200 dark:bg-gray-700" />
            )}
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{product.name}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {color || defaultColor} - {size || defaultSize} - Limitless redraws - $
                {quickstartTotal.toFixed(2)} all-in
              </p>
            </div>
          </div>
          {/* <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            ${quickstartTotal.toFixed(2)} all-in
          </p> */}
          {/* <p className="text-sm font-semibold text-gray-900 dark:text-white mt-2">
            ${quickstartTotal.toFixed(2)} all-in
          </p> */}
        </div>
        <Button variant="primary" className="w-full" onClick={handleSubmit}>
          Create in 60s
        </Button>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Pay, generate, and approve. Classic is one-shot; choose Limitless later if you want unlimited redraws.
          </p>
      </div>
    </div>
  );
}
