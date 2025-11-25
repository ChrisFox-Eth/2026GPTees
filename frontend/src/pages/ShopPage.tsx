/**
 * @module pages/ShopPage
 * @description Shop page with product catalog
 * @since 2025-11-21
 */

import { useState, useEffect } from 'react';
import { Product } from '../types/product';
import { apiGet } from '../utils/api';
import { ProductCard } from '../components/ProductCard';
import { ProductModal } from '../components/ProductModal';
import { trackEvent } from '@utils/analytics';

export default function ShopPage(): JSX.Element {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchProducts();
  }, []);

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

  return (
    <div className="container-max py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Shop Custom Apparel
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Choose your product and create unique AI-generated designs
        </p>
        <div className="flex gap-2 mt-4">
          {['ALL', 'T_SHIRT', 'HOODIE'].map((category) => (
            <button
              key={category}
              onClick={() => setCategoryFilter(category)}
              className={`px-4 py-2 rounded-md border transition-colors ${
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

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
            No products available at the moment.
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
    </div>
  );
}
