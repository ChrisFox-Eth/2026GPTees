import { Button } from '@components/Button';
import { SocialStatus } from '../../types/social';
import { SocialFormModalProps } from './social.types';
import { FormState } from '../../hooks/usePostForm';

export function SocialFormModal({
  open,
  mode,
  state,
  templates,
  hashtagSets,
  saving,
  onClose,
  onSave,
  onChange,
  onApplyTemplate,
  onApplyHashtagSet,
  onAddAsset,
  onRemoveAsset,
  onOpenLibrary,
}: SocialFormModalProps): JSX.Element | null {
  if (!open) return null;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {mode === 'create' ? 'Create post' : mode === 'edit' ? 'Edit post' : 'Duplicate post'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Platforms: Facebook + Instagram. CSV export follows Metricool template.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={onSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-white">Title</label>
            <input
              type="text"
              value={state.title}
              onChange={(e) => onChange({ ...state, title: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-white">Caption</label>
            <textarea
              value={state.caption}
              onChange={(e) => onChange({ ...state, caption: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              rows={4}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-white">CTA</label>
            <input
              type="text"
              value={state.cta}
              onChange={(e) => onChange({ ...state, cta: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-white">Hashtags</label>
            <textarea
              value={state.hashtags}
              onChange={(e) => onChange({ ...state, hashtags: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              rows={2}
            />
            <div className="flex gap-2 mt-2 flex-wrap">
              <select
                className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                value={state.templateKey}
                onChange={(e) => {
                  onChange({ ...state, templateKey: e.target.value });
                  onApplyTemplate(e.target.value);
                }}
              >
                <option value="">Template (optional)</option>
                {templates.map((tpl) => (
                  <option key={tpl.key} value={tpl.key}>
                    {tpl.title}
                  </option>
                ))}
              </select>
              <select
                className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) onApplyHashtagSet(e.target.value);
                }}
              >
                <option value="">Hashtag set</option>
                {hashtagSets.map((set) => (
                  <option key={set.id} value={set.id}>
                    {set.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
              <input
                type="checkbox"
                checked={state.platforms.facebook}
                onChange={(e) => onChange({ ...state, platforms: { ...state.platforms, facebook: e.target.checked } })}
              />
              Facebook
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
              <input
                type="checkbox"
                checked={state.platforms.instagram}
                onChange={(e) => onChange({ ...state, platforms: { ...state.platforms, instagram: e.target.checked } })}
              />
              Instagram
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">Status</label>
              <select
                className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                value={state.status}
                onChange={(e) => onChange({ ...state, status: e.target.value as SocialStatus })}
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="posted">Posted</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">Scheduled at</label>
              <input
                type="datetime-local"
                value={state.scheduledAt}
                onChange={(e) => onChange({ ...state, scheduledAt: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">FB type</label>
              <select
                className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                value={state.fbType}
                onChange={(e) => onChange({ ...state, fbType: e.target.value as FormState['fbType'] })}
              >
                <option value="POST">POST</option>
                <option value="REEL">REEL</option>
                <option value="STORY">STORY</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">IG type</label>
              <select
                className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                value={state.igType}
                onChange={(e) => onChange({ ...state, igType: e.target.value as FormState['igType'] })}
              >
                <option value="POST">POST</option>
                <option value="REEL">REEL</option>
                <option value="STORY">STORY</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={state.showReelOnFeed}
              onChange={(e) => onChange({ ...state, showReelOnFeed: e.target.checked })}
            />
            <span className="text-sm text-gray-800 dark:text-gray-200">Show reel on feed (IG)</span>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-white">First comment</label>
            <textarea
              value={state.firstComment}
              onChange={(e) => onChange({ ...state, firstComment: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              rows={2}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-gray-900 dark:text-white">Assets</p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onAddAsset} disabled={state.assets.length >= 10}>
              Add
            </Button>
            <Button variant="secondary" size="sm" onClick={onOpenLibrary}>
              Asset library
            </Button>
          </div>
        </div>
        {state.assets.map((asset, idx) => (
          <div key={`${asset.url}-${idx}`} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-start">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="https://...png"
                value={asset.url}
                onChange={(e) => {
                  const next = [...state.assets];
                  next[idx] = { ...next[idx], url: e.target.value };
                  onChange({ ...state, assets: next });
                }}
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Alt text"
                value={asset.alt}
                onChange={(e) => {
                  const next = [...state.assets];
                  next[idx] = { ...next[idx], alt: e.target.value };
                  onChange({ ...state, assets: next });
                }}
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-1 flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => onRemoveAsset(idx)}>
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
