import { Button } from '@components/Button';
import { TypeHints } from './TypeHints';
import { MediaLinks } from './MediaLinks';
import { FramesPanel } from './FramesPanel';
import { AssetsPanel } from './AssetsPanel';
import { SocialPostDrawerProps } from './social.types';

export function SocialPostDrawer({
  pack,
  promptSuggestions,
  promptLoading,
  imageLoadingId,
  promptBank,
  promptBankKey,
  onPromptBankKeyChange,
  onApplyPromptBank,
  onSavePromptsToBank,
  onFetchPrompts,
  onGenerateAll,
  onGenerateImage,
  onGenerateFramesOnly,
  framesCount,
  onFramesCountChange,
  onFillGaps,
  stitchFps,
  onChangeStitchFps,
  stitchIncludeAudio,
  onToggleIncludeAudio,
  stitching,
  onStitch,
  onCopyPack,
  onOpenLibrary,
}: SocialPostDrawerProps): JSX.Element | null {
  if (!pack) return null;

  const selectedMeta: any = pack.post?.meta || {};
  const selectedFrames: string[] = selectedMeta.frames || [];
  const stitchStatus: string | undefined = selectedMeta.stitch_status;
  const stitchError: string | undefined = selectedMeta.stitch_error;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
      <TypeHints post={pack.post} />
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{pack.post.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {pack.post.platforms.join(', ')} - {pack.post.status} - Scheduled{' '}
            {pack.post.scheduled_at ? new Date(pack.post.scheduled_at).toLocaleString() : '--'}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" size="sm" onClick={onCopyPack}>
            Copy pack now
          </Button>
          <Button variant="secondary" size="sm" disabled>
            Download single CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">Caption + CTA + Hashtags</p>
          <pre className="whitespace-pre-wrap bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded p-3">
            {pack.text}
          </pre>
        </div>

        <div className="space-y-2">
          <MediaLinks post={pack.post} />
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 dark:text-white">AI media assistant</p>
            <Button variant="secondary" size="sm" onClick={onFetchPrompts} disabled={promptLoading}>
              {promptLoading ? 'Loading...' : 'Suggest prompts'}
            </Button>
            {promptSuggestions.length > 0 && (
              <Button variant="primary" size="sm" onClick={onGenerateAll} disabled={imageLoadingId === 'bulk'}>
                {imageLoadingId === 'bulk' ? 'Generating...' : 'Generate & attach all'}
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={onOpenLibrary}>
              Asset library
            </Button>
          </div>
          {promptSuggestions.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <label className="text-xs text-gray-700 dark:text-gray-300">Frames only:</label>
              <select
                className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                onChange={(e) => onFramesCountChange(parseInt(e.target.value || '4', 10))}
                value={String(framesCount)}
              >
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
              </select>
              <Button variant="secondary" size="sm" onClick={() => onGenerateFramesOnly(framesCount)} disabled={imageLoadingId === 'frames'}>
                {imageLoadingId === 'frames' ? 'Generating...' : 'Generate frames only'}
              </Button>
              <Button variant="secondary" size="sm" onClick={onFillGaps} disabled={imageLoadingId === 'bulk'}>
                {imageLoadingId === 'bulk' ? 'Filling...' : 'Fill gaps & attach'}
              </Button>
            </div>
          )}
          {promptSuggestions.length === 0 && !promptLoading && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Get 3-5 concise prompts for DALL-E. Use copy or generate + attach directly.
            </p>
          )}
          {promptSuggestions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  value={promptBankKey}
                  onChange={(e) => onPromptBankKeyChange(e.target.value)}
                >
                  <option value="">Prompt bank: choose</option>
                  {promptBank.map((p) => (
                    <option key={p.id} value={p.key || p.id}>
                      {p.key || p.prompt.slice(0, 30)}
                    </option>
                  ))}
                </select>
                <Button variant="secondary" size="sm" onClick={onApplyPromptBank} disabled={!promptBankKey}>
                  Apply prompts
                </Button>
                <Button variant="secondary" size="sm" onClick={onSavePromptsToBank} disabled={!promptSuggestions.length}>
                  Save current to bank
                </Button>
              </div>
              {promptSuggestions.map((s) => (
                <div key={s.prompt} className="border border-gray-200 dark:border-gray-700 rounded p-3 space-y-2 bg-gray-50 dark:bg-gray-900/30">
                  <p className="text-sm text-gray-900 dark:text-white">{s.prompt}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Crop: {s.crop}</p>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="secondary" size="sm" onClick={() => navigator.clipboard.writeText(s.prompt)}>
                      Copy prompt
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => onGenerateImage(s)} disabled={imageLoadingId === s.prompt}>
                      {imageLoadingId === s.prompt ? 'Generating...' : 'Generate & attach'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <FramesPanel
        frames={selectedFrames}
        stitchStatus={stitchStatus}
        stitchError={stitchError}
        stitchFps={stitchFps}
        includeAudio={stitchIncludeAudio}
        stitching={stitching}
        onFpsChange={onChangeStitchFps}
        onIncludeAudioChange={onToggleIncludeAudio}
        onStitch={() => onStitch()}
      />

      <AssetsPanel urls={pack.post.asset_urls || []} alts={pack.post.asset_alt_texts || []} onOpenLibrary={onOpenLibrary} />
    </div>
  );
}
