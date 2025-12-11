/**
 * @module pages/ShopPage
 * @description Shop page with product catalog
 * @since 2025-11-21
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../types/product';
import { apiGet } from '../utils/api';
import { ProductCard } from '../components/ProductCard';
import { ProductModal } from '../components/ProductModal';
import { trackEvent } from '@utils/analytics';
// import { Quickstart } from '@components/Quickstart';
import SocialProofStrip from '@components/SocialProofStrip/SocialProofStrip';
import { Button } from '@components/Button';
import { useCart } from '../hooks/useCart';
import Hero from '@components/Hero/Hero';

const FAQ_ITEMS = [
  {
    question: 'How long does shipping take?',
    answer: 'Most US orders ship in 5-8 business days after you approve your design. You get tracking as soon as it leaves the facility.',
  },
  {
    question: 'What if I do not like the design?',
    answer: 'Premium includes unlimited redraws before print. We only print after you approve a design you love.',
  },
  {
    question: 'What is your return policy?',
    answer: 'If there is a defect, misprint, or damage, we will reprint or refund. Unworn items can be returned within 30 days.',
  },
  {
    question: 'How does sizing fit?',
    answer: 'Our Bella 3001 tees are unisex and true to size. Size up for a relaxed fit; size down for a tailored fit.',
  },
];

export default function ShopPage(): JSX.Element {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const navigate = useNavigate();
  const { cart, getTotalItems, getSubtotal } = useCart();
  const cartItems = getTotalItems();
  const cartSubtotal = getSubtotal();
  const hasCartItems = cart.length > 0;
  const SHOP_HIDDEN = true;

  useEffect(() => {
    if (SHOP_HIDDEN) {
      navigate('/#quickstart', { replace: true });
    }
  }, [navigate, SHOP_HIDDEN]);

  useEffect(() => {
    if (SHOP_HIDDEN) return;
    fetchProducts();
  }, [SHOP_HIDDEN]);

  useEffect(() => {
    if (SHOP_HIDDEN) return;
    const params = new URLSearchParams(window.location.search);
    const source = params.get('utm_source') || params.get('source');
    const campaign = params.get('utm_campaign');
    const medium = params.get('utm_medium');
    const clickId = params.get('fbclid') || params.get('gclid');

    if (source || campaign || clickId) {
      const payload = {
        source: source || undefined,
        campaign: campaign || undefined,
        medium: medium || undefined,
        click_id: clickId || undefined,
      };
      localStorage.setItem('gptees_attribution', JSON.stringify(payload));
      trackEvent('marketing.attribution.capture', payload);
    }
  }, []);

  if (SHOP_HIDDEN) {
    return <Hero />;
  }

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await apiGet('/api/products');
      const fetched = (response.data as Product[]) || [];
      setProducts(fetched);
      setError(null);
      trackEvent('shop.products.loaded', {
        product_count: fetched.length,
        has_basic: fetched.some((p) => p.slug === 'basic-tee'),
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
      console.error('Error fetching products:', err);
      trackEvent('shop.products.load_error', {
        message: err?.message || 'unknown',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    trackEvent('shop.product.open_modal', {
      product_id: product.id,
      product_name: product.name,
      base_price: Number(product.basePrice),
      color_count: product.colors.length,
      size_count: product.sizes.length,
      source_surface: 'shop_grid',
    });
  };

  const visibleProducts =
    categoryFilter === 'ALL'
      ? products
      : products.filter((p) => p.category === categoryFilter);
  const skeletonCards = Array.from({ length: 6 });

  return (
    <div className="container-max py-8 pb-24 md:pb-12">
      {/* Header */}
      <div className="mb-8 space-y-3">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Create your fit
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
          Your design is ready to go—pick your fit, we&apos;ll generate the artwork, and you pay after you approve. Limitless redraws included.
        </p>
        {/* <div className="grid gap-2 sm:grid-cols-2 max-w-xl">
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-white text-sm font-semibold">1</span>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Super-soft GPTee</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Bella+Canvas quality with vibrant prints.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-white text-sm font-semibold">2</span>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Limitless by default</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Unlimited redraws and pay-after-approval flow built in.</p>
            </div>
          </div>
        </div> */}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Submit your selections and your design preview will appear for approval.
        </p>
        <div className="-mx-4 sm:mx-0">
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2 px-4 sm:px-0">
            {['ALL', 'T_SHIRT', 'HOODIE'].map((category) => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                aria-pressed={categoryFilter === category}
                className={`px-4 py-2 rounded-full border whitespace-nowrap transition-colors ${
                  categoryFilter === category
                    ? 'border-primary-600 text-primary-600 bg-primary-50 dark:bg-primary-900'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                {category === 'ALL' ? 'All' : category.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="hidden mb-8">
        <SocialProofStrip />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {skeletonCards.map((_, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden animate-pulse"
            >
              <div className="aspect-square bg-gray-200 dark:bg-gray-700" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mt-2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8">
          <p className="text-red-800 dark:text-red-400">{error}</p>
          <button
            onClick={fetchProducts}
            className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Product Grid */}
      {!loading && !error && visibleProducts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => handleProductClick(product)}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && visibleProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Coming soon!
          </p>
        </div>
      )}

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {hasCartItems && !selectedProduct && (
        <div className="fixed bottom-0 inset-x-0 z-40 md:hidden">
          <div className="container-max pb-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Cart</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {cartItems} item{cartItems !== 1 ? 's' : ''} · ${cartSubtotal.toFixed(2)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => navigate('/cart')}>
                  View
                </Button>
                <Button variant="primary" size="sm" onClick={() => navigate('/checkout')}>
                  Checkout
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* <div className="mb-6">
        <Quickstart />
      </div> */}

      <div className="my-10">
        <h2 className="hidden! text-2xl font-bold text-gray-900 dark:text-white mb-3">Answers at a glance</h2>
        <div className="space-y-3 hidden!">
          {FAQ_ITEMS.map((faq) => (
            <details
              key={faq.question}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <summary className="flex items-center justify-between cursor-pointer text-gray-900 dark:text-white font-semibold">
                <span>{faq.question}</span>
                <span className="text-primary-600 dark:text-primary-400">+</span>
              </summary>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
