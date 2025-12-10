import { TypeHintsProps } from './TypeHints.types';

export function TypeHints({ post }: TypeHintsProps): JSX.Element {
  const fbType = (post.fb_type || 'POST').toUpperCase();
  const igType = (post.ig_type || 'POST').toUpperCase();
  const isReelOrStory = fbType === 'REEL' || igType === 'REEL' || igType === 'STORY';

  return (
    <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/40 border border-dashed border-gray-300 dark:border-gray-700 rounded p-3">
      <p className="font-semibold text-gray-900 dark:text-white">What this post needs:</p>
      <ul className="list-disc list-inside space-y-1">
        <li>
          FB type: {fbType} / IG type: {igType}
        </li>
        <li>
          POST: at least one image + caption/CTA/hashtags. REEL/STORY: stitched MP4 or Sora/Veo video; captions optional for STORY
          (Metricool strips text).
        </li>
        <li>CSV export will block if required media is missing.</li>
        {isReelOrStory ? <li>Use frames + stitch or attach an existing vertical MP4.</li> : null}
      </ul>
    </div>
  );
}

