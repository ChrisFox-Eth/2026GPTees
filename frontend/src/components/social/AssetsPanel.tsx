import { AssetsPanelProps } from './social.types';

export function AssetsPanel({ urls, alts, onOpenLibrary }: AssetsPanelProps): JSX.Element {
  const hasAssets = urls && urls.length > 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="font-semibold text-gray-900 dark:text-white">Assets</p>
        <button
          type="button"
          onClick={onOpenLibrary}
          className="text-sm text-primary-700 dark:text-primary-300 underline"
        >
          Attach from library
        </button>
      </div>
      {hasAssets ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {urls.map((url, idx) => (
            <div key={url} className="border border-gray-200 dark:border-gray-700 rounded p-2">
              <div className="aspect-square bg-gray-100 dark:bg-gray-900/40 flex items-center justify-center overflow-hidden">
                <img src={url} alt={alts?.[idx] || url} className="h-full w-full object-cover" />
              </div>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary-700 dark:text-primary-300 underline break-words"
              >
                {url}
              </a>
              {alts?.[idx] ? (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{alts[idx]}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-600 dark:text-gray-400">No assets attached.</p>
      )}
    </div>
  );
}
