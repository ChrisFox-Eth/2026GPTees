import { SocialPost } from '../../types/social';

interface MediaLinksProps {
  post: SocialPost;
}

export function MediaLinks({ post }: MediaLinksProps): JSX.Element {
  const meta: any = post.meta || {};

  const soraUrl = meta.video_source === 'sora' ? meta.video_url : null;
  const stitchedUrl = meta.video_source && meta.video_source !== 'sora' ? meta.video_url : null;
  const veoUrl = meta.veo_video_url || null;
  const sunoUrl = meta.suno_audio_url || meta.suno_source_audio_url || null;

  return (
    <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded p-3 space-y-1">
      <p className="font-semibold text-gray-900 dark:text-white">Media links</p>
      {soraUrl ? (
        <a className="text-xs text-primary-700 dark:text-primary-300 underline break-words" href={soraUrl} target="_blank" rel="noreferrer">
          Sora video
        </a>
      ) : (
        <p className="text-xs text-gray-600 dark:text-gray-400">No Sora video.</p>
      )}
      {stitchedUrl ? (
        <a className="text-xs text-primary-700 dark:text-primary-300 underline break-words" href={stitchedUrl} target="_blank" rel="noreferrer">
          Stitched MP4
        </a>
      ) : (
        <p className="text-xs text-gray-600 dark:text-gray-400">No stitched MP4.</p>
      )}
      {veoUrl ? (
        <a className="text-xs text-primary-700 dark:text-primary-300 underline break-words" href={veoUrl} target="_blank" rel="noreferrer">
          Veo video
        </a>
      ) : (
        <p className="text-xs text-gray-600 dark:text-gray-400">No Veo video.</p>
      )}
      {sunoUrl ? (
        <a className="text-xs text-primary-700 dark:text-primary-300 underline break-words" href={sunoUrl} target="_blank" rel="noreferrer">
          Suno audio
        </a>
      ) : (
        <p className="text-xs text-gray-600 dark:text-gray-400">No audio.</p>
      )}
    </div>
  );
}

