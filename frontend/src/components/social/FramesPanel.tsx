interface FramesPanelProps {
  frames: string[];
  stitchStatus?: string;
  stitchError?: string;
  stitchFps: number;
  includeAudio: boolean;
  stitching: boolean;
  onFpsChange: (fps: number) => void;
  onIncludeAudioChange: (val: boolean) => void;
  onStitch: () => void;
}

export function FramesPanel({
  frames,
  stitchStatus,
  stitchError,
  stitchFps,
  includeAudio,
  stitching,
  onFpsChange,
  onIncludeAudioChange,
  onStitch,
}: FramesPanelProps): JSX.Element {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="font-semibold text-gray-900 dark:text-white">Frames & stitching</p>
        <div className="flex items-center gap-2 flex-wrap text-xs text-gray-700 dark:text-gray-300">
          <label className="flex items-center gap-1">
            FPS
            <input
              type="number"
              min={1}
              max={12}
              value={stitchFps}
              onChange={(e) => onFpsChange(Math.max(1, Math.min(12, parseInt(e.target.value || '4', 10))))}
              className="w-16 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-xs"
            />
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={includeAudio} onChange={(e) => onIncludeAudioChange(e.target.checked)} />
            Use Suno audio if present
          </label>
          <button
            type="button"
            onClick={onStitch}
            disabled={stitching || frames.length === 0}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-700 px-3 py-1 text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-60"
          >
            {stitching ? 'Stitching...' : 'Stitch saved frames'}
          </button>
        </div>
      </div>
      {stitchStatus && (
        <p className="text-xs text-gray-700 dark:text-gray-300">
          Stitch status: {stitchStatus}
          {stitchError ? ` --- ${stitchError}` : ''}
        </p>
      )}
      {frames.length ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {frames.map((url, idx) => (
            <div key={url} className="border border-gray-200 dark:border-gray-700 rounded p-1">
              <div className="aspect-video bg-gray-100 dark:bg-gray-900/40 flex items-center justify-center overflow-hidden">
                <img src={url} alt={`Frame ${idx + 1}`} className="h-full w-full object-cover" />
              </div>
              <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">Frame {idx + 1}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-600 dark:text-gray-400">No frames saved yet. Generate frames or stitch selected assets.</p>
      )}
    </div>
  );
}

