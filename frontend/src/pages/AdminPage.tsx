import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiPost } from '../utils/api';
import { Button } from '@components/Button';

interface SyncResult {
  total: number;
  updated: number;
  results: Array<{
    orderId: string;
    orderNumber: string;
    printfulOrderId: string;
    fromStatus: string;
    toStatus: string;
    fulfillmentStatus: string | null;
    trackingNumber?: string;
    error?: string;
  }>;
}

export default function AdminPage(): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!import.meta.env.DEV) {
    return (
      <div className="container-max py-12">
        <h1 className="text-2xl font-bold mb-3">Admin</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Admin tools are available in development only.
        </p>
      </div>
    );
  }

  const handleSync = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiPost('/api/admin/sync-fulfillment', {});
      setResult(response.data);
    } catch (err: any) {
      const message =
        err?.message === 'Route not found'
          ? 'Admin sync endpoint not available on this environment. Run against your local backend or enable it with ALLOW_ADMIN_SYNC=true.'
          : err.message || 'Sync failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-max py-12 space-y-8">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-300">
            Admin Hub (Local Only)
          </p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Operations cockpit</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Jump to tools for promo/gift codes, fulfillment recovery, and runbooks.
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <p>Visible only in development.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 space-y-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Promo & Gift Codes</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Create, disable, and monitor gift/promo codes with redemption metrics.
          </p>
          <Link to="/admin/promo">
            <Button variant="primary" className="mt-2">
              Open dashboard
            </Button>
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 space-y-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Fulfillment Recovery</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Pull latest Printful statuses or resubmit stuck orders.
          </p>
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleSync}
              disabled={loading}
              variant="primary"
            >
              {loading ? 'Syncing…' : 'Sync fulfillment'}
            </Button>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            {result && (
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Updated {result.updated} of {result.total} orders.
              </p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 space-y-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Help & Runbooks</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Step-by-step fixes for gift codes, orders, and webhooks while running locally.
          </p>
          <Link to="/admin/help">
            <Button variant="secondary" className="mt-2">
              View help
            </Button>
          </Link>
        </div>
      </div>

      {result && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Latest sync results</h3>
          <div className="max-h-64 overflow-auto border border-gray-200 dark:border-gray-700 rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/40 text-left">
                <tr>
                  <th className="px-3 py-2">Order</th>
                  <th className="px-3 py-2">Printful</th>
                  <th className="px-3 py-2">From</th>
                  <th className="px-3 py-2">To</th>
                  <th className="px-3 py-2">Tracking</th>
                  <th className="px-3 py-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {result.results.map((row) => (
                  <tr key={row.orderId} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="px-3 py-2 font-medium">{row.orderNumber}</td>
                    <td className="px-3 py-2">{row.printfulOrderId}</td>
                    <td className="px-3 py-2">{row.fromStatus}</td>
                    <td className="px-3 py-2">{row.toStatus}</td>
                    <td className="px-3 py-2">{row.trackingNumber || '—'}</td>
                    <td className="px-3 py-2 text-red-600 dark:text-red-400">
                      {row.error || ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-3">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recovery quick commands</h2>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Run from <code>backend/</code> while connected to your dev DB:
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
          <li>
            Inspect order + events: <code>npx tsx scripts/inspect-order.ts {'<orderId-or-number>'}</code>
          </li>
          <li>
            Attach an existing design and approve it:{' '}
            <code>npx tsx scripts/attach-design.ts {'<orderId-or-number> <designId>'}</code>
          </li>
          <li>
            Retry Printful submission (optional design override):{' '}
            <code>npx tsx scripts/retry-printful.ts {'<orderId-or-number> [designId]'}</code>
          </li>
          <li>
            Abandoned checkout reminders: <code>node --loader ts-node/esm scripts/send-abandoned-reminders.ts</code>
          </li>
        </ul>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Tip: if Printful rejects a $0 item, ensure the order has an approved design and retry with an explicit design id.
        </p>
      </div>
    </div>
  );
}
