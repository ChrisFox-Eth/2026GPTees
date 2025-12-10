import { Button } from '@components/Button';

interface FiltersBarProps {
  needsAssets: boolean;
  needsPrompts: boolean;
  onNeedsAssets: (next: boolean) => void;
  onNeedsPrompts: (next: boolean) => void;
  onRefresh: () => void;
  loading: boolean;
  error?: string | null;
}

export function FiltersBar({
  needsAssets,
  needsPrompts,
  onNeedsAssets,
  onNeedsPrompts,
  onRefresh,
  loading,
  error,
}: FiltersBarProps): JSX.Element {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Status & Filters</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Dev-only. Backed by Supabase (social_posts, templates, hashtag_sets, prompt_bank).
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={onRefresh} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>
      <div className="flex gap-3 flex-wrap text-sm">
        <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <input type="checkbox" checked={needsAssets} onChange={(e) => onNeedsAssets(e.target.checked)} />
          Needs assets
        </label>
        <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <input type="checkbox" checked={needsPrompts} onChange={(e) => onNeedsPrompts(e.target.checked)} />
          Needs prompts
        </label>
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

