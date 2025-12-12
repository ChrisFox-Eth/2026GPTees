/**
 * @module pages/AdminHelpPage
 * @description In-app runbook for local admin operations
 * @since 2025-11-21
 */

import { Link } from 'react-router-dom';
import { Button } from '@components/ui/Button';

/**
 * @component
 * @description Admin help page providing operational runbooks and guides for managing gift codes, order recovery, and debugging fulfillment issues. Only accessible in development mode.
 *
 * @returns {JSX.Element} The rendered admin help page with operational guides
 *
 * @example
 * // Used in App.tsx routing
 * <Route path="/admin/help" element={<AdminHelpPage />} />
 */
export default function AdminHelpPage(): JSX.Element {
  return (
    <div className="container-max space-y-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-primary-700 dark:text-primary-300 text-sm font-semibold tracking-wide uppercase">
            Admin Help
          </p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Local Ops Guide</h1>
          <p className="text-gray-600 dark:text-gray-400">
            How to manage gift codes, recover orders, and debug stuck fulfillments while running
            locally.
          </p>
        </div>
        <Link to="/admin">
          <Button variant="secondary" size="sm">
            Back to Admin Hub
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Gift & Promo Codes
          </h2>
          <ul className="list-inside list-disc space-y-1 text-sm text-gray-700 dark:text-gray-300">
            <li>
              Use the{' '}
              <Link to="/admin/promo" className="text-primary-600 dark:text-primary-300 underline">
                Promo &amp; Gift dashboard
              </Link>{' '}
              to create, disable, and inspect codes.
            </li>
            <li>
              Gift code checkout flow: user buys at <code className="text-xs">/gift</code> → Stripe
              → code emailed.
            </li>
            <li>
              Validation happens in checkout; usage limits and disabled state are enforced
              server-side.
            </li>
          </ul>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Tip: leave <code className="text-xs">usageLimit</code> blank for unlimited, or set to{' '}
            <code className="text-xs">1</code> for single-use gifts.
          </p>
        </div>

        <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Order Recovery (Printful)
          </h2>
          <ol className="list-inside list-decimal space-y-1 text-sm text-gray-700 dark:text-gray-300">
            <li>Open Admin Hub → Sync Fulfillment to pull latest Printful statuses.</li>
            <li>
              For missing submissions, ensure a design is approved, then run retry script (see CLI
              below).
            </li>
            <li>
              If a Printful order already exists, the service will reclaim it by external_id and
              update tracking.
            </li>
          </ol>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Shipments update via Printful webhook; manual sync is safe to run anytime.
          </p>
        </div>

        <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            CLI Helpers (run from backend/)
          </h2>
          <ul className="list-inside list-disc space-y-1 text-sm text-gray-700 dark:text-gray-300">
            <li>
              Inspect order + events:{' '}
              <code className="text-xs">
                npx tsx scripts/inspect-order.ts {'<orderId-or-number>'}
              </code>
            </li>
            <li>
              Attach existing design + approve:{' '}
              <code className="text-xs">
                npx tsx scripts/attach-design.ts {'<orderId-or-number> <designId>'}
              </code>
            </li>
            <li>
              Retry Printful submit (optional design override):{' '}
              <code className="text-xs">
                npx tsx scripts/retry-printful.ts {'<orderId-or-number> [designId]'}
              </code>
            </li>
            <li>
              Abandoned checkout reminders:{' '}
              <code className="text-xs">
                node --loader ts-node/esm scripts/send-abandoned-reminders.ts
              </code>
            </li>
          </ul>
        </div>

        <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Triage Checklist</h2>
          <ul className="list-inside list-disc space-y-1 text-sm text-gray-700 dark:text-gray-300">
            <li>Confirm order status in DB (PAID) and that a design is approved.</li>
            <li>Check fulfillment events table via inspect-order script.</li>
            <li>Ensure Printful variant mapping exists for the product/color/size.</li>
            <li>If webhook missed, run manual sync or resubmit with retry-printful.</li>
          </ul>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            If Printful rejects $0 items, override design and retry; error is recorded on the order
            for visibility.
          </p>
        </div>
      </div>
    </div>
  );
}
