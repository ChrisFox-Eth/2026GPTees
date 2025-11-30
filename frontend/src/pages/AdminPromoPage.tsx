/**
 * @module pages/AdminPromoPage
 * @description Admin dashboard for promo/gift codes analytics and management
 */

import { useEffect, useMemo, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { apiGet, apiPost, apiRequest } from '../utils/api';
import { Button } from '@components/Button';
import ProtectedRoute from '../components/ProtectedRoute';

type PromoType = 'FREE_PRODUCT' | 'PERCENT_OFF';
type Tier = 'BASIC' | 'PREMIUM' | 'TEST';

interface PromoCode {
  id: string;
  code: string;
  type: PromoType;
  productTier?: Tier | null;
  percentOff?: number | null;
  usageLimit?: number | null;
  usageCount: number;
  disabled: boolean;
  createdAt: string;
  createdBy?: { email: string | null } | null;
}

interface OrderSummary {
  id: string;
  orderNumber: string;
  totalAmount: number;
  paidAt?: string | null;
}

interface PromoDetail {
  promo: PromoCode;
  recentOrders: OrderSummary[];
}

interface MetricsSeriesPoint {
  bucket: string;
  redemptions: number;
  revenue: number;
}

interface MetricsResponse {
  totals: {
    redemptions: number;
    revenue: number;
    activeCodes: number;
    remaining?: number | null;
  };
  series: MetricsSeriesPoint[];
}

interface CreateFormState {
  code: string;
  type: PromoType;
  productTier: Tier;
  percentOff: number;
  usageLimit: number | null;
  disabled: boolean;
}

function useAdminToken() {
  const { getToken } = useAuth();
  return useMemo(() => getToken, [getToken]);
}

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
  const [createForm, setCreateForm] = useState<CreateFormState>({
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
  }, [isSignedIn, skipAuth, page, pageSize, search, typeFilter, tierFilter, disabledFilter, bucket]);

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
    <div className="container-max py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-primary-700 dark:text-primary-300 font-semibold uppercase tracking-wide">
            Admin
          </p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Promo & Gift Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage codes, view redemptions, and track revenue impact.
          </p>
        </div>
        <div className="text-right text-sm text-gray-500 dark:text-gray-400">
          <p>{user?.primaryEmailAddress?.emailAddress}</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Metrics</h2>
          <div className="flex items-center gap-2">
            <select
              value={bucket}
              onChange={(e) => setBucket(e.target.value as 'day' | 'week')}
              className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
            </select>
            <Button variant="secondary" size="sm" onClick={loadMetrics} disabled={loadingMetrics}>
              {loadingMetrics ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>
        {metricsError && <p className="text-red-600 dark:text-red-400 text-sm">{metricsError}</p>}
        {metrics && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold">Redemptions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.totals.redemptions}</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold">Revenue (with code)</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${metrics.totals.revenue.toFixed(2)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold">Active Codes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.totals.activeCodes}</p>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code"
            className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
          >
            <option value="">Type: All</option>
            <option value="FREE_PRODUCT">Gift</option>
            <option value="PERCENT_OFF">Percent</option>
          </select>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
          >
            <option value="">Tier: All</option>
            <option value="BASIC">Basic</option>
            <option value="PREMIUM">Premium</option>
            <option value="TEST">Test</option>
          </select>
          <select
            value={disabledFilter}
            onChange={(e) => setDisabledFilter(e.target.value)}
            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
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
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create Code</h2>
          {createError && <p className="text-sm text-red-600 dark:text-red-400">{createError}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <input
            type="text"
            value={createForm.code}
            onChange={(e) => setCreateForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            placeholder="Code (blank = auto)"
            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
          />
          <select
            value={createForm.type}
            onChange={(e) => setCreateForm((f) => ({ ...f, type: e.target.value as PromoType }))}
            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
          >
            <option value="PERCENT_OFF">Percent off</option>
            <option value="FREE_PRODUCT">Free product</option>
          </select>
          <select
            value={createForm.productTier}
            onChange={(e) => setCreateForm((f) => ({ ...f, productTier: e.target.value as Tier }))}
            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
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
              className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
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
            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
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
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Codes</h2>
          {loading && <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>}
        </div>
        {error && <p className="text-red-600 dark:text-red-400 text-sm mb-2">{error}</p>}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left bg-gray-50 dark:bg-gray-900/40">
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
                      className={`px-2 py-1 rounded text-xs ${
                        c.disabled
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200'
                      }`}
                    >
                      {c.disabled ? 'Disabled' : 'Active'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => loadDetail(c.id)}
                    >
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
        <div className="flex items-center justify-between mt-3 text-sm">
          <Button variant="secondary" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
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
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Code Detail</h3>
            <Button variant="secondary" size="sm" onClick={() => setDetail(null)}>
              Close
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm text-gray-700 dark:text-gray-300">
            <div><strong>Code:</strong> {detail.promo.code}</div>
            <div><strong>Type:</strong> {detail.promo.type}</div>
            <div><strong>Tier:</strong> {detail.promo.productTier || '—'}</div>
            <div><strong>Discount:</strong> {detail.promo.type === 'PERCENT_OFF' ? `${detail.promo.percentOff || 0}%` : 'Free product'}</div>
            <div><strong>Usage:</strong> {detail.promo.usageCount}/{detail.promo.usageLimit ?? '∞'}</div>
            <div><strong>State:</strong> {detail.promo.disabled ? 'Disabled' : 'Active'}</div>
            <div><strong>Created:</strong> {new Date(detail.promo.createdAt).toLocaleString()}</div>
            <div><strong>Created By:</strong> {detail.promo.createdBy?.email || '—'}</div>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white mb-2">Recent Orders</p>
            {detail.recentOrders.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">No orders yet.</p>
            ) : (
              <div className="space-y-2 text-sm">
                {detail.recentOrders.map((o) => (
                  <div key={o.id} className="flex justify-between border border-gray-200 dark:border-gray-700 rounded px-3 py-2">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{o.orderNumber}</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        Paid: {o.paidAt ? new Date(o.paidAt).toLocaleString() : 'Pending'}
                      </p>
                    </div>
                    <p className="text-gray-900 dark:text-white font-semibold">${Number(o.totalAmount).toFixed(2)}</p>
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

export default function AdminPromoPage(): JSX.Element {
  return (
    <ProtectedRoute>
      <AdminPromoContent />
    </ProtectedRoute>
  );
}
