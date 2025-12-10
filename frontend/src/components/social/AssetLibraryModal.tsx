import { Button } from '@components/Button';

interface AssetLibraryModalProps {
  open: boolean;
  assets: { name: string; url: string }[];
  loading: boolean;
  page: number;
  onPageChange: (next: number) => void;
  onSearch: (value: string) => void;
  onTypeChange: (value: string) => void;
  type: string;
  onClose: () => void;
  onReload: () => void;
  onAdd: (url: string) => void;
  selected: Set<string>;
  onToggleSelect: (url: string) => void;
  onAttachSelected: () => void;
  onStitchSelected?: () => void;
  stitchFps?: number;
  onChangeStitchFps?: (value: number) => void;
  includeAudio?: boolean;
  onToggleIncludeAudio?: (value: boolean) => void;
}

export function AssetLibraryModal({
  open,
  assets,
  loading,
  page,
  onPageChange,
  onSearch,
  onTypeChange,
  type,
  onClose,
  onReload,
  onAdd,
  selected,
  onToggleSelect,
  onAttachSelected,
  onStitchSelected,
  stitchFps,
  onChangeStitchFps,
  includeAudio,
  onToggleIncludeAudio,
}: AssetLibraryModalProps): JSX.Element | null {
  if (!open) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Asset library</h3>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onReload} disabled={loading}>
            {loading ? 'Loading...' : 'Reload'}
          </Button>
          <Button variant="secondary" size="sm" onClick={onAttachSelected} disabled={selected.size === 0}>
            Attach selected ({selected.size})
          </Button>
          {onStitchSelected && (
            <Button variant="primary" size="sm" onClick={onStitchSelected} disabled={selected.size === 0}>
              Stitch selected
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap text-sm">
        <input
          type="text"
          placeholder="Search name"
          className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
          onChange={(e) => onSearch(e.target.value)}
        />
        <select
          className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
          value={type}
          onChange={(e) => onTypeChange(e.target.value)}
        >
          <option value="">All</option>
          <option value="image">Images</option>
          <option value="gif">GIF</option>
          <option value="video">Video</option>
        </select>
        {onStitchSelected && (
          <div className="flex gap-2 items-center flex-wrap">
            <label className="text-xs text-gray-700 dark:text-gray-300">FPS</label>
            <input
              type="number"
              min={1}
              max={12}
              value={stitchFps ?? 4}
              className="w-20 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-sm"
              onChange={(e) => onChangeStitchFps?.(parseInt(e.target.value || '4', 10))}
            />
            <label className="text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <input
                type="checkbox"
                checked={includeAudio ?? true}
                onChange={(e) => onToggleIncludeAudio?.(e.target.checked)}
              />
              Use audio
            </label>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 text-sm">
        <Button variant="secondary" size="sm" onClick={() => onPageChange(Math.max(0, page - 1))} disabled={page === 0 || loading}>
          Prev
        </Button>
        <span className="text-gray-700 dark:text-gray-300">Page {page + 1}</span>
        <Button variant="secondary" size="sm" onClick={() => onPageChange(page + 1)} disabled={loading}>
          Next
        </Button>
      </div>
      {loading ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading assets...</p>
      ) : assets.length === 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">No assets found.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {assets.map((a) => (
            <div key={a.url} className="border border-gray-200 dark:border-gray-700 rounded p-2 space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={selected.has(a.url)} onChange={() => onToggleSelect(a.url)} />
                <span className="text-gray-700 dark:text-gray-300 truncate">{a.name}</span>
              </div>
              <div className="aspect-square bg-gray-100 dark:bg-gray-900/40 flex items-center justify-center overflow-hidden">
                <img src={a.url} alt={a.name} className="h-full w-full object-cover" />
              </div>
              <Button variant="secondary" size="sm" onClick={() => onAdd(a.url)}>
                Add to paste
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

