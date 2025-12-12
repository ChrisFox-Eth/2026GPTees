/**
 * @module pages/AdminPromoPage
 * @description Admin dashboard for promo/gift codes analytics and management
 * @since 2025-11-21
 */

import { useEffect, useMemo, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { apiGet, apiPost, apiRequest } from '../utils/api';
import { Button } from '@components/ui/Button';
import ProtectedRoute from '../components/ProtectedRoute';
import type {
  PromoType,
  PromoTier,
  PromoCode,
  PromoDetail,
  MetricsResponse,
  CreatePromoFormState,
} from '../types/promo';

function useAdminToken() {
  const { getToken } = useAuth();
  return useMemo(() => getToken, [getToken]);
}

/**
 * @function AdminPromoContent
 * @description Protected admin content for managing promo and gift codes with metrics, filtering, and code creation
 *
 * @returns {JSX.Element} The admin promo page content with code management tools
 *
 * @example
 * // Used within ProtectedRoute wrapper
 * <ProtectedRoute>
 *   <AdminPromoContent />
 * </ProtectedRoute>
 */
function AdminPromoContent(): JSX.Element {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const getToken = useAdminToken();
  const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true';

  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [detail, setDetail] = useState<PromoDetail | null>(null);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [tierFilter, setTierFilter] = useState<string>('');
  const [disabledFilter, setDisabledFilter] = useState<string>('');
  const [bucket, setBucket] = useState<'day' | 'week'>('day');
  const [createForm, setCreateForm] = useState<CreatePromoFormState>({
    code: '',
    type: 'PERCENT_OFF',
    productTier: 'BASIC',
    percentOff: 10,
    usageLimit: 1,
    disabled: false,
  });

  const loadCodes = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = skipAuth ? undefined : await getToken();
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (search) params.set('search', search);
      if (typeFilter) params.set('type', typeFilter);
      if (tierFilter) params.set('tier', tierFilter);
      if (disabledFilter) params.set('disabled', disabledFilter);
      const res = await apiGet(`/api/admin/promo-codes?${params.toString()}`, token);
      setCodes(res.data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load codes');
      setCodes([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      setLoadingMetrics(true);
      setMetricsError(null);
      const token = skipAuth ? undefined : await getToken();
      const res = await apiGet(`/api/admin/promo-codes/metrics?bucket=${bucket}`, token);
      setMetrics(res.data);
    } catch (err: any) {
      setMetricsError(err?.message || 'Failed to load metrics');
      setMetrics(null);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const loadDetail = async (id: string) => {
    try {
      const token = skipAuth ? undefined : await getToken();
      const res = await apiGet(`/api/admin/promo-codes/${id}`, token);
      setDetail(res.data);
    } catch (err: any) {
      setDetail(null);
      setError(err?.message || 'Failed to load code details');
    }
  };

  useEffect(() => {
    if (isSignedIn || skipAuth) {
      void loadCodes();
      void loadMetrics();
    }
  }, [
    isSignedIn,
    skipAuth,
    page,
    pageSize,
    search,
    typeFilter,
    tierFilter,
    disabledFilter,
    bucket,
  ]);

  const toggleDisabled = async (id: string, next: boolean) => {
    try {
      const token = await getToken();
      await apiRequest(
        `/api/admin/promo-codes/${id}/${next ? 'disable' : 'enable'}`,
        { method: 'PATCH' },
        token
      );
      await loadCodes();
      if (detail?.promo.id === id) {
        await loadDetail(id);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update code state');
    }
  };

  if (!isSignedIn && !skipAuth) {
    return (
      <div className="container-max py-12">
        <p className="text-gray-700 dark:text-gray-200">Sign in to view admin dashboard.</p>
      </div>
    );
  }

  return (
    <div className="container-max space-y-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-primary-700 dark:text-primary-300 text-sm font-semibold tracking-wide uppercase">
            Admin
          </p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Promo & Gift Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage codes, view redemptions, and track revenue impact.
          </p>
        </div>
        <div className="text-right text-sm text-gray-500 dark:text-gray-400">
          <p>{user?.primaryEmailAddress?.emailAddress}</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Metrics</h2>
          <div className="flex items-center gap-2">
            <select
              value={bucket}
              onChange={(e) => setBucket(e.target.value as 'day' | 'week')}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
            </select>
            <Button variant="secondary" size="sm" onClick={loadMetrics} disabled={loadingMetrics}>
              {loadingMetrics ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>
        {metricsError && <p className="text-sm text-red-600 dark:text-red-400">{metricsError}</p>}
        {metrics && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/40">
              <p className="text-xs font-semibold text-gray-600 uppercase dark:text-gray-400">
                Redemptions
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics.totals.redemptions}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/40">
              <p className="text-xs font-semibold text-gray-600 uppercase dark:text-gray-400">
                Revenue (with code)
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${metrics.totals.revenue.toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/40">
              <p className="text-xs font-semibold text-gray-600 uppercase dark:text-gray-400">
                Active Codes
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics.totals.activeCodes}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code"
            className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="">Type: All</option>
            <option value="FREE_PRODUCT">Gift</option>
            <option value="PERCENT_OFF">Percent</option>
          </select>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="">Tier: All</option>
            <option value="BASIC">Basic</option>
            <option value="PREMIUM">Premium</option>
            <option value="TEST">Test</option>
          </select>
          <select
            value={disabledFilter}
            onChange={(e) => setDisabledFilter(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="">State: All</option>
            <option value="false">Active</option>
            <option value="true">Disabled</option>
          </select>
          <Button variant="secondary" onClick={() => setPage(1)}>
            Apply
          </Button>
        </div>
      </div>

      {/* Create code */}
      <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create Code</h2>
          {createError && <p className="text-sm text-red-600 dark:text-red-400">{createError}</p>}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          <input
            type="text"
            value={createForm.code}
            onChange={(e) => setCreateForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            placeholder="Code (blank = auto)"
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
          <select
            value={createForm.type}
            onChange={(e) => setCreateForm((f) => ({ ...f, type: e.target.value as PromoType }))}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="PERCENT_OFF">Percent off</option>
            <option value="FREE_PRODUCT">Free product</option>
          </select>
          <select
            value={createForm.productTier}
            onChange={(e) =>
              setCreateForm((f) => ({ ...f, productTier: e.target.value as PromoTier }))
            }
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="BASIC">Basic</option>
            <option value="PREMIUM">Premium</option>
            <option value="TEST">Test</option>
          </select>
          {createForm.type === 'PERCENT_OFF' && (
            <input
              type="number"
              min={1}
              max={100}
              value={createForm.percentOff}
              onChange={(e) => setCreateForm((f) => ({ ...f, percentOff: Number(e.target.value) }))}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              placeholder="Percent off"
            />
          )}
          {createForm.type === 'FREE_PRODUCT' && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Tier must match free product.
            </div>
          )}
          <input
            type="number"
            min={1}
            value={createForm.usageLimit ?? ''}
            onChange={(e) =>
              setCreateForm((f) => ({
                ...f,
                usageLimit: e.target.value === '' ? null : Math.max(1, Number(e.target.value)),
              }))
            }
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            placeholder="Usage limit (blank = unlimited)"
          />
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={createForm.disabled}
              onChange={(e) => setCreateForm((f) => ({ ...f, disabled: e.target.checked }))}
            />
            Create as disabled
          </label>
        </div>
        <Button
          variant="primary"
          onClick={async () => {
            try {
              setIsCreating(true);
              setCreateError(null);
              const token = skipAuth ? undefined : await getToken();
              const payload: any = {
                code: createForm.code.trim() || undefined,
                type: createForm.type,
                productTier: createForm.productTier,
                usageLimit: createForm.usageLimit === null ? null : createForm.usageLimit,
                disabled: createForm.disabled,
              };
              if (createForm.type === 'PERCENT_OFF') {
                payload.percentOff = createForm.percentOff;
              }
              await apiPost('/api/admin/promo-codes', payload, token);
              await loadCodes();
              await loadMetrics();
              setCreateForm({
                code: '',
                type: 'PERCENT_OFF',
                productTier: 'BASIC',
                percentOff: 10,
                usageLimit: 1,
                disabled: false,
              });
            } catch (err: any) {
              setCreateError(err?.message || 'Failed to create code');
            } finally {
              setIsCreating(false);
            }
          }}
          disabled={isCreating}
        >
          {isCreating ? 'Creating…' : 'Create Code'}
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Codes</h2>
          {loading && <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>}
        </div>
        {error && <p className="mb-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left dark:bg-gray-900/40">
              <tr>
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Tier</th>
                <th className="px-3 py-2">Discount</th>
                <th className="px-3 py-2">Usage</th>
                <th className="px-3 py-2">State</th>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.id} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="px-3 py-2 font-semibold">{c.code}</td>
                  <td className="px-3 py-2">{c.type === 'FREE_PRODUCT' ? 'Gift' : 'Percent'}</td>
                  <td className="px-3 py-2">{c.productTier || '—'}</td>
                  <td className="px-3 py-2">
                    {c.type === 'PERCENT_OFF' ? `${c.percentOff || 0}%` : 'Free product'}
                  </td>
                  <td className="px-3 py-2">
                    {c.usageCount}/{c.usageLimit ?? '∞'}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded px-2 py-1 text-xs ${
                        c.disabled
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200'
                      }`}
                    >
                      {c.disabled ? 'Disabled' : 'Active'}
                    </span>
                  </td>
                  <td className="px-3 py-2">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="space-x-2 px-3 py-2">
                    <Button variant="secondary" size="sm" onClick={() => loadDetail(c.id)}>
                      View
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => toggleDisabled(c.id, !c.disabled)}
                    >
                      {c.disabled ? 'Enable' : 'Disable'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            Prev
          </Button>
          <span className="text-gray-600 dark:text-gray-400">Page {page}</span>
          <Button variant="secondary" size="sm" onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      </div>

      {/* Detail drawer (inline block) */}
      {detail && (
        <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Code Detail</h3>
            <Button variant="secondary" size="sm" onClick={() => setDetail(null)}>
              Close
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm text-gray-700 dark:text-gray-300">
            <div>
              <strong>Code:</strong> {detail.promo.code}
            </div>
            <div>
              <strong>Type:</strong> {detail.promo.type}
            </div>
            <div>
              <strong>Tier:</strong> {detail.promo.productTier || '—'}
            </div>
            <div>
              <strong>Discount:</strong>{' '}
              {detail.promo.type === 'PERCENT_OFF'
                ? `${detail.promo.percentOff || 0}%`
                : 'Free product'}
            </div>
            <div>
              <strong>Usage:</strong> {detail.promo.usageCount}/{detail.promo.usageLimit ?? '∞'}
            </div>
            <div>
              <strong>State:</strong> {detail.promo.disabled ? 'Disabled' : 'Active'}
            </div>
            <div>
              <strong>Created:</strong> {new Date(detail.promo.createdAt).toLocaleString()}
            </div>
            <div>
              <strong>Created By:</strong> {detail.promo.createdBy?.email || '—'}
            </div>
          </div>
          <div>
            <p className="mb-2 font-semibold text-gray-900 dark:text-white">Recent Orders</p>
            {detail.recentOrders.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">No orders yet.</p>
            ) : (
              <div className="space-y-2 text-sm">
                {detail.recentOrders.map((o) => (
                  <div
                    key={o.id}
                    className="flex justify-between rounded border border-gray-200 px-3 py-2 dark:border-gray-700"
                  >
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{o.orderNumber}</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        Paid: {o.paidAt ? new Date(o.paidAt).toLocaleString() : 'Pending'}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      ${Number(o.totalAmount).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * @component
 * @description Admin page for managing promo and gift codes with analytics, code creation, filtering, and redemption tracking. Protected by authentication.
 *
 * @returns {JSX.Element} The rendered admin promo page with protected content
 *
 * @example
 * // Used in App.tsx routing
 * <Route path="/admin/promo" element={<AdminPromoPage />} />
 */
export default function AdminPromoPage(): JSX.Element {
  return (
    <ProtectedRoute>
      <AdminPromoContent />
    </ProtectedRoute>
  );
}
