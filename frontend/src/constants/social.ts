import { SocialPost } from '../types/social';

export const CSV_HEADERS: string[] = [
  'Text',
  'Date',
  'Time',
  'Draft',
  'Facebook',
  'Instagram',
  'Picture Url 1',
  'Picture Url 2',
  'Picture Url 3',
  'Picture Url 4',
  'Picture Url 5',
  'Picture Url 6',
  'Picture Url 7',
  'Picture Url 8',
  'Picture Url 9',
  'Picture Url 10',
  'Alt text picture 1',
  'Alt text picture 2',
  'Alt text picture 3',
  'Alt text picture 4',
  'Alt text picture 5',
  'Alt text picture 6',
  'Alt text picture 7',
  'Alt text picture 8',
  'Alt text picture 9',
  'Alt text picture 10',
  'Facebook Post Type',
  'Facebook Title',
  'Instagram Post Type',
  'Instagram Show Reel On Feed',
  'First Comment Text',
  'Video Thumbnail Url',
  'Video Cover Frame',
];

export function buildCsvRow(post: SocialPost): (string | boolean)[] {
  const scheduledAt = post.scheduled_at ? new Date(post.scheduled_at) : null;
  const dateStr = scheduledAt ? scheduledAt.toISOString().slice(0, 10) : '';
  const timeStr = scheduledAt ? scheduledAt.toISOString().slice(11, 19) : '';
  const hashtagLine = (post.hashtags || [])
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
    .join(' ');
  const captionParts = [post.caption || ''];
  if (post.cta) captionParts.push(post.cta);
  if (hashtagLine) captionParts.push(hashtagLine);
  const text = captionParts.filter(Boolean).join('\n\n');

  const pictures = Array.from({ length: 10 }, () => '');
  const alts = Array.from({ length: 10 }, () => '');
  if (post.asset_urls?.length) {
    pictures[0] = post.asset_urls[0];
    alts[0] = post.asset_alt_texts?.[0] || '';
  }

  const videoUrl = (post.meta as any)?.video_url || (post.meta as any)?.veo_video_url || '';

  return [
    text,
    dateStr,
    timeStr,
    post.status === 'draft',
    post.platforms.includes('facebook'),
    post.platforms.includes('instagram'),
    ...pictures,
    ...alts,
    post.fb_type || '',
    '',
    post.ig_type || '',
    post.show_reel_on_feed,
    post.first_comment || '',
    videoUrl,
    '',
  ];
}
