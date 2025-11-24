import { useState } from 'react';
import { apiPost } from '../utils/api';

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
    <div className="container-max py-12 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Tools (Dev)</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Sync Printful fulfillment statuses into the local database.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
        <button
          onClick={handleSync}
          disabled={loading}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-60"
        >
          {loading ? 'Syncing…' : 'Sync Fulfillment Statuses'}
        </button>
        {error && <p className="text-red-600 dark:text-red-400">{error}</p>}
        {result && (
          <div className="space-y-2">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Updated {result.updated} of {result.total} orders.
            </p>
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
      </div>
    </div>
  );
}
