import { HelpPanelProps } from './HelpPanel.types';

export function HelpPanel({ open, onClose }: HelpPanelProps): JSX.Element | null {
  if (!open) return null;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">How to use this page</h3>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-700 px-3 py-1 text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Close
        </button>
      </div>

      <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
        <ol className="list-decimal list-inside space-y-2">
          <li>Use filters (Needs assets / Needs prompts) to find gaps; select a row to open the detail drawer.</li>
          <li>Copy pack or export CSV (all/selected). Single-row CSV button is in the drawer.</li>
          <li>Prompts: suggest --- generate & attach; for reels/stories, generate frames (3---6) then stitch to MP4.</li>
          <li>Media: attach from Asset Library (search/type filter, multi-select) or paste Supabase URLs. Stitch selected assets if you already have frames.</li>
          <li>Templates / hashtag sets: prefill captions and hashtags. Bulk actions: mark status or delete selected.</li>
          <li>Media links show Sora (if present), stitched MP4, Veo (flag), Suno audio. CSV export validates media per type.</li>
        </ol>

        <div className="border border-gray-200 dark:border-gray-700 rounded p-3 bg-gray-50 dark:bg-gray-900/40 space-y-2">
          <p className="font-semibold text-gray-900 dark:text-white">Per-type quick reference</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <span className="font-semibold">POST:</span> needs ---1 image. Actions: suggest prompts, generate images, attach from library. Stored in
              bucket <code>designs</code> under <code>social-&lt;id&gt;/image-*.png</code>.
            </li>
            <li>
              <span className="font-semibold">REEL:</span> needs a vertical MP4. Actions: prompts --- frames (3---6) --- stitch MP4, attach existing video,
              optional Sora/Veo. Stored as <code>social-&lt;id&gt;/asset-*.mp4</code>.
            </li>
            <li>
              <span className="font-semibold">STORY:</span> same as REEL; captions often ignored by Metricool---focus on vertical MP4.
            </li>
          </ul>
          <p className="font-semibold text-gray-900 dark:text-white">Creation pipeline</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Backend: <code>backend/src/controllers/social.controller.ts</code> (auto-week/auto-one, prompts via buildSuggestions).</li>
            <li>Storage: Supabase bucket <code>designs</code>; stitcher writes MP4 (no GIF). Frames stored in <code>meta.frames</code>.</li>
            <li>Prompts: OpenAI gpt-4o-mini for suggestions; Sora prompt tuned for 9:16 product focus.</li>
            <li>CSV: Metricool-style (docs/social_csv_template.csv). Export blocks if required media missing.</li>
          </ul>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
          <p className="font-semibold text-gray-900 dark:text-white">Technical quick-start (for a helper/agent)</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_DESIGNS_BUCKET=designs, SOCIAL_SORA_ENABLED, SOCIAL_SUNO_ENABLED,
              SOCIAL_VEO_ENABLED (often false), OPENAI_API_KEY/ORG.
            </li>
            <li>Assets API: GET /api/admin/social/assets?limit/offset/search/type; uploads go to bucket designs (public).</li>
            <li>Videos: meta.video_url (stitch/Sora), meta.veo_video_url (flagged). Audio: meta.suno_audio_url. Stitcher can mux audio.</li>
            <li>Frames: meta.frames array. Endpoints: POST /posts/:id/generate-frames (3---6), POST /posts/:id/stitch (optional assetUrls).</li>
            <li>Content gen: auto-week/auto-one honor additional context; prompts via buildSuggestions with type-aware instructions.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

