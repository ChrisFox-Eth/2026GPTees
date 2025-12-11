/**
 * @module controllers/social
 * @description Admin social ops endpoints (Supabase-backed, dev-only)
 */

import { Request, Response } from 'express';
import { AppError, catchAsync } from '../middleware/error.middleware.js';
import { getSupabaseServiceRoleClient } from '../services/supabase-admin.service.js';
import OpenAI from 'openai';
import { uploadImage } from '../services/supabase-storage.service.js';
import { generateDesign } from '../services/openai.service.js';
import { listStorageAssets } from '../services/storage-list.service.js';
import {
  HashtagSetRecord,
  SocialPlatform,
  SocialPostRecord,
  SocialPostType,
  SocialStatus,
  SocialTemplateRecord,
  PromptBankRecord,
} from '../types/social.js';
import { generateSoraVideo, pollSoraJob } from '../services/video.service.js';
import { generateSunoTrack } from '../services/suno.service.js';
import { generateVeoVideo } from '../services/veo.service.js';
import { stitchFramesToMp4 } from '../services/ffmpeg.service.js';

const SOCIAL_POSTS_TABLE = 'social_posts';
const SOCIAL_TEMPLATES_TABLE = 'social_templates';
const HASHTAG_SETS_TABLE = 'hashtag_sets';
const PROMPT_BANK_TABLE = 'prompt_bank';

const allowedPlatforms: SocialPlatform[] = ['facebook', 'instagram'];
const allowedStatuses: SocialStatus[] = ['draft', 'scheduled', 'posted', 'failed'];
const allowedPostTypes: SocialPostType[] = ['POST', 'REEL', 'STORY'];
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY, organization: process.env.OPENAI_ORGANIZATION_ID || undefined })
  : null;

const csvHeaders = [
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

type PostPayload = Partial<SocialPostRecord>;

interface BuildPayloadOptions {
  partial?: boolean;
  existing?: SocialPostRecord | null;
  actorEmail?: string | null;
}

const toStringArray = (value: any): string[] => {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  return String(value)
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
};

const normalizeHashtags = (value: any): string[] => {
  const tags = toStringArray(value);
  const cleaned = tags.map((tag) => tag.replace(/^#+/, '').trim()).filter(Boolean);
  return Array.from(new Set(cleaned)).slice(0, 30);
};

const normalizePlatforms = (value: any, requireValue: boolean, fallback: SocialPlatform[] = []): SocialPlatform[] => {
  const platforms = toStringArray(value).map((p) => p.toLowerCase()) as SocialPlatform[];
  const merged = platforms.length ? platforms : fallback;
  const filtered = merged.filter((p) => allowedPlatforms.includes(p));
  const unique = Array.from(new Set(filtered));

  if (requireValue && unique.length === 0) {
    throw new AppError('At least one platform (facebook/instagram) is required', 400);
  }
  return unique;
};

const normalizeAssetUrls = (value: any, existing?: string[]): string[] => {
  const urls = toStringArray(value);
  const trimmed = urls.filter(Boolean).slice(0, 10);
  const finalUrls = trimmed.length ? trimmed : existing || [];
  if (finalUrls.length > 10) {
    throw new AppError('Maximum of 10 asset URLs supported', 400);
  }
  return finalUrls;
};

const normalizeAltTexts = (value: any, targetLength: number, existing?: string[]): string[] => {
  const alts = toStringArray(value);
  const result: string[] = [];

  for (let i = 0; i < targetLength; i++) {
    const provided = alts[i];
    if (provided !== undefined && provided !== null) {
      result.push(String(provided).trim());
    } else if (existing && existing[i]) {
      result.push(existing[i]);
    } else {
      result.push('');
    }
  }

  if (result.length > 10) {
    throw new AppError('Maximum of 10 alt text entries supported', 400);
  }

  return result;
};

const sanitizeStatus = (value: any, fallback: SocialStatus): SocialStatus => {
  const status = String(value || '').toLowerCase() as SocialStatus;
  if (allowedStatuses.includes(status)) {
    return status;
  }
  return fallback;
};

const sanitizePostType = (value: any): SocialPostType | null => {
  const type = String(value || '').toUpperCase() as SocialPostType;
  return allowedPostTypes.includes(type) ? type : null;
};

const ensureOpenAI = () => {
  if (!openai) {
    throw new AppError('OpenAI is not configured', 500);
  }
  return openai;
};

type OpenAIImageSize = '1024x1024' | '1024x1792' | '1792x1024';

const mapCropToSize = (crop: string | null | undefined): OpenAIImageSize => {
  if (crop === 'portrait' || crop === 'story') return '1024x1792';
  return '1024x1024'; // square default
};

const buildSuggestions = async (post: SocialPostRecord): Promise<{ prompt: string; crop: string; alt: string; overlay: string }[]> => {
  const client = ensureOpenAI();
  const system = `You are a social media art director. Generate 3-5 concise DALL-E prompts for Facebook/Instagram posts.
- Keep on-image text very short (0-6 words max). Many prompts should have zero text.
- Avoid giant text blocks; focus on visuals that fit the caption.
- Include a crop hint: "square" for feed posts, "portrait" for carousels, "story" for story/reel.
- Vary style based on type: POST=square hero still; REEL/STORY=dynamic vertical, motion-friendly frame.
- Return JSON object: {"suggestions":[{"prompt":"...","crop":"square","alt":"...","overlay":"0-6 word overlay or empty"}]}.`;

  const overlayHint =
    post.fb_type === 'REEL' || post.ig_type === 'REEL' || post.ig_type === 'STORY'
      ? 'Vertical, motion-friendly, minimal overlay.'
      : 'Square/portrait hero still, optional tiny overlay.';

  const user = `Title: ${post.title}
Caption: ${post.caption}
CTA: ${post.cta || ''}
Hashtags: ${(post.hashtags || []).join(', ')}
Platforms: ${post.platforms.join(', ')}
Type: FB=${post.fb_type || 'POST'}, IG=${post.ig_type || 'POST'}
Guidance: ${overlayHint}`;

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.6,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });
  const content = completion.choices[0]?.message?.content || '{}';
  let suggestions: any[] = [];
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed.suggestions)) {
      suggestions = parsed.suggestions;
    } else if (Array.isArray(parsed)) {
      suggestions = parsed;
    } else if (parsed.suggestions) {
      suggestions = parsed.suggestions;
    }
  } catch {
    suggestions = [];
  }
  suggestions = suggestions
    .filter((s) => s?.prompt)
    .map((s) => ({
      prompt: String(s.prompt),
      crop: ['square', 'portrait', 'story'].includes(String(s.crop)) ? String(s.crop) : 'square',
      alt: s.alt ? String(s.alt) : String(s.prompt).slice(0, 120),
      overlay: s.overlay ? String(s.overlay) : '',
    }))
    .slice(0, 5);

  if (!suggestions.length) {
    const hashLine = (post.hashtags || []).slice(0, 3).join(', ');
    suggestions = [
      {
        prompt: `${post.title} hero visual, no text, vibrant, ${hashLine}`,
        crop: 'square',
        alt: `${post.title} hero visual`,
        overlay: '',
      },
      {
        prompt: `${post.title} minimalist graphic, clean background, ${hashLine}`,
        crop: 'portrait',
        alt: `${post.title} minimalist graphic`,
        overlay: '',
      },
      {
        prompt: `${post.title} dynamic motion frame, vertical, ${hashLine}`,
        crop: 'story',
        alt: `${post.title} motion frame`,
        overlay: '',
      },
    ];
  }

  return suggestions;
};

const parseDateInput = (value: any): string | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError('Invalid date/time value', 400);
  }
  return parsed.toISOString();
};

const buildHashtagLine = (hashtags: string[]): string => {
  if (!hashtags || hashtags.length === 0) return '';
  return hashtags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
    .join(' ');
};

const buildCaptionWithHashtags = (post: SocialPostRecord): string => {
  const pieces: string[] = [];
  if (post.caption) {
    pieces.push(post.caption.trim());
  }
  if (post.cta) {
    pieces.push(post.cta.trim());
  }
  const hashtagLine = buildHashtagLine(post.hashtags || []);
  if (hashtagLine) {
    pieces.push(hashtagLine);
  }
  return pieces.join('\n\n');
};

const csvEscape = (value: string | number | boolean | null | undefined): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  const str = String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const buildCsvRow = (post: SocialPostRecord): (string | boolean)[] => {
  const scheduledAt = post.scheduled_at ? new Date(post.scheduled_at) : null;
  const dateStr = scheduledAt ? scheduledAt.toISOString().slice(0, 10) : '';
  const timeStr = scheduledAt ? scheduledAt.toISOString().slice(11, 19) : '';
  const pictures = Array.from({ length: 10 }, (_v, idx) => post.asset_urls[idx] || '');
  const alts = Array.from({ length: 10 }, (_v, idx) => post.asset_alt_texts[idx] || '');
  const meta: any = post.meta || {};
  const videoUrl = meta.video_url || meta.veo_video_url || meta.gif_url || '';

  return [
    buildCaptionWithHashtags(post),
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
    meta.gif_url || '',
  ];
};

const buildPostPayload = (input: any, options: BuildPayloadOptions = {}): PostPayload => {
  const { partial = false, existing = null, actorEmail = null } = options;
  const payload: PostPayload = {};

  if (!partial || input.title !== undefined) {
    const title = String(input.title ?? '').trim();
    if (!title) {
      throw new AppError('Title is required', 400);
    }
    payload.title = title;
  }

  if (!partial || input.caption !== undefined) {
    payload.caption = String(input.caption ?? '').trim();
  }

  if (!partial || input.cta !== undefined) {
    payload.cta = input.cta ? String(input.cta).trim() : null;
  }

  const hashtagsInput = input.hashtags ?? input.hashTags;
  if (!partial || hashtagsInput !== undefined) {
    payload.hashtags = normalizeHashtags(hashtagsInput ?? []);
  }

  const platformsInput = input.platforms ?? input.platform;
  if (!partial || platformsInput !== undefined) {
    const normalizedPlatforms = normalizePlatforms(platformsInput, !partial, existing?.platforms);
    if (normalizedPlatforms.length) {
      payload.platforms = normalizedPlatforms;
    }
  }

  const assetUrlsInput = input.assetUrls ?? input.asset_urls;
  const assetAltInput = input.assetAltTexts ?? input.asset_alt_texts;

  if (!partial || assetUrlsInput !== undefined) {
    const urls = normalizeAssetUrls(assetUrlsInput, existing?.asset_urls);
    payload.asset_urls = urls;
    payload.asset_alt_texts = normalizeAltTexts(assetAltInput, urls.length, existing?.asset_alt_texts);
  } else if (assetAltInput !== undefined) {
    if (!existing?.asset_urls || existing.asset_urls.length === 0) {
      throw new AppError('Provide asset URLs before setting alt text', 400);
    }
    payload.asset_alt_texts = normalizeAltTexts(assetAltInput, existing.asset_urls.length, existing.asset_alt_texts);
  }

  const statusInput = input.status ?? input.state;
  if (!partial || statusInput !== undefined) {
    const fallback = existing?.status || 'draft';
    payload.status = sanitizeStatus(statusInput ?? fallback, fallback);
  }

  const scheduledInput = input.scheduledAt ?? input.scheduled_at;
  if (!partial || scheduledInput !== undefined) {
    payload.scheduled_at = parseDateInput(scheduledInput);
  }

  const postedInput = input.postedAt ?? input.posted_at;
  if (!partial || postedInput !== undefined) {
    payload.posted_at = parseDateInput(postedInput);
  }

  const templateKey = input.templateKey ?? input.template_key;
  if (!partial || templateKey !== undefined) {
    payload.template_key = templateKey ? String(templateKey).trim() : null;
  }

  const firstComment = input.firstComment ?? input.first_comment;
  if (!partial || firstComment !== undefined) {
    payload.first_comment = firstComment ? String(firstComment).trim() : null;
  }

  const fbType = sanitizePostType(input.fbType ?? input.fb_type);
  if (!partial || input.fbType !== undefined || input.fb_type !== undefined || fbType) {
    payload.fb_type = fbType;
  }

  const igType = sanitizePostType(input.igType ?? input.ig_type);
  if (!partial || input.igType !== undefined || input.ig_type !== undefined || igType) {
    payload.ig_type = igType;
  }

  const showReel = input.showReelOnFeed ?? input.show_reel_on_feed;
  if (!partial || showReel !== undefined) {
    payload.show_reel_on_feed = Boolean(showReel);
  }

  if (!partial) {
    payload.created_by = actorEmail || null;
  }

  if (input.meta !== undefined) {
    payload.meta = typeof input.meta === 'object' && input.meta !== null ? input.meta : {};
  }

  return payload;
};

const fetchPostOrThrow = async (id: string): Promise<SocialPostRecord> => {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase.from(SOCIAL_POSTS_TABLE).select('*').eq('id', id).single();
  if (error || !data) {
    throw new AppError('Social post not found', 404);
  }
  return data as SocialPostRecord;
};

const applyListFilters = (req: Request, withCount = false): any => {
  const supabase = getSupabaseServiceRoleClient();
  let query = supabase.from(SOCIAL_POSTS_TABLE).select('*', withCount ? { count: 'exact' } : undefined);

  const status = req.query.status as string | undefined;
  if (status && allowedStatuses.includes(status as SocialStatus)) {
    query = query.eq('status', status);
  }

  const platform = req.query.platform as string | undefined;
  if (platform && allowedPlatforms.includes(platform as SocialPlatform)) {
    query = query.contains('platforms', [platform]);
  }

  const templateKey = (req.query.template as string | undefined) || (req.query.templateKey as string | undefined);
  if (templateKey) {
    query = query.eq('template_key', templateKey);
  }

  const from = req.query.from ? parseDateInput(req.query.from) : null;
  const to = req.query.to ? parseDateInput(req.query.to) : null;
  if (from) {
    query = query.gte('scheduled_at', from);
  }
  if (to) {
    query = query.lte('scheduled_at', to);
  }

  const search = (req.query.search as string | undefined)?.trim();
  if (search) {
    const escaped = search.replace(/,/g, '');
    query = query.or(`title.ilike.%${escaped}%,caption.ilike.%${escaped}%`);
  }

  const sortBy = (req.query.sortBy as string | undefined) || 'scheduled_at';
  const sortDir = (req.query.sortDir as string | undefined) === 'desc' ? 'desc' : 'asc';
  const allowedSorts = new Set(['scheduled_at', 'updated_at', 'created_at', 'title', 'status']);
  const field = allowedSorts.has(sortBy) ? sortBy : 'scheduled_at';

  query = query.order(field, { ascending: sortDir === 'asc' }).order('created_at', {
    ascending: false,
  });

  return query;
};

export const listSocialPosts = catchAsync(async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(String(req.query.pageSize ?? '20'), 10) || 20));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const query = applyListFilters(req, true).range(from, to);

  const { data, error, count } = await query;
  if (error) {
    throw new AppError(`Failed to list social posts: ${error.message}`, 500);
  }

  res.json({
    success: true,
    data: data as SocialPostRecord[],
    meta: {
      page,
      pageSize,
      total: count || 0,
      totalPages: count ? Math.ceil(count / pageSize) : 1,
    },
  });
});

export const createSocialPost = catchAsync(async (req: Request, res: Response) => {
  const payload = buildPostPayload(req.body, { partial: false, actorEmail: req.user?.email || null });
  const supabase = getSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from(SOCIAL_POSTS_TABLE)
    .insert(payload)
    .select()
    .single();

  if (error || !data) {
    throw new AppError(`Failed to create social post: ${error?.message || 'Unknown error'}`, 500);
  }

  res.status(201).json({ success: true, data: data as SocialPostRecord });
});

export const updateSocialPost = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = await fetchPostOrThrow(id);
  const payload = buildPostPayload(req.body, { partial: true, existing });
  const supabase = getSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from(SOCIAL_POSTS_TABLE)
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    throw new AppError(`Failed to update social post: ${error?.message || 'Unknown error'}`, 500);
  }

  res.json({ success: true, data: data as SocialPostRecord });
});

export const deleteSocialPost = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await fetchPostOrThrow(id);
  const supabase = getSupabaseServiceRoleClient();
  const { error } = await supabase.from(SOCIAL_POSTS_TABLE).delete().eq('id', id);
  if (error) {
    throw new AppError(`Failed to delete social post: ${error.message}`, 500);
  }
  res.status(204).send();
});

export const scheduleSocialPost = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await fetchPostOrThrow(id);
  const scheduledAt = parseDateInput(req.body.scheduledAt ?? req.body.scheduled_at);
  if (!scheduledAt) {
    throw new AppError('scheduledAt is required to schedule a post', 400);
  }
  const status = sanitizeStatus(req.body.status, 'scheduled');
  const supabase = getSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from(SOCIAL_POSTS_TABLE)
    .update({
      scheduled_at: scheduledAt,
      status,
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    throw new AppError(`Failed to schedule social post: ${error?.message || 'Unknown error'}`, 500);
  }

  res.json({ success: true, data: data as SocialPostRecord });
});

export const publishPack = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const post = await fetchPostOrThrow(id);
  res.json({
    success: true,
    data: {
      post,
      text: buildCaptionWithHashtags(post),
      hashtags: buildHashtagLine(post.hashtags || []),
      csv: {
        headers: csvHeaders,
        row: buildCsvRow(post),
      },
    },
  });
});

export const exportSocialCsv = catchAsync(async (req: Request, res: Response) => {
  const limit = Math.min(500, Math.max(1, parseInt(String(req.query.limit ?? '200'), 10) || 200));
  const query = applyListFilters(req, false).range(0, limit - 1);

  const { data, error } = await query;
  if (error) {
    throw new AppError(`Failed to export CSV: ${error.message}`, 500);
  }

  const rows = (data as SocialPostRecord[]).map((post) => buildCsvRow(post).map(csvEscape).join(','));
  const csv = [csvHeaders.map(csvEscape).join(','), ...rows].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="social_fb_ig_export.csv"');
  res.send(csv);
});

export const bulkUpdateStatus = catchAsync(async (req: Request, res: Response) => {
  const ids = Array.isArray(req.body.ids) ? (req.body.ids as string[]) : [];
  const status = sanitizeStatus(req.body.status, 'draft');
  if (!ids.length) {
    throw new AppError('ids array is required', 400);
  }

  const supabase = getSupabaseServiceRoleClient();
  const { error } = await supabase.from(SOCIAL_POSTS_TABLE).update({ status }).in('id', ids);
  if (error) {
    throw new AppError(`Failed to update status: ${error.message}`, 500);
  }
  res.json({ success: true, data: { updated: ids.length, status } });
});

export const bulkDeletePosts = catchAsync(async (req: Request, res: Response) => {
  const ids = Array.isArray(req.body.ids) ? (req.body.ids as string[]) : [];
  if (!ids.length) {
    throw new AppError('ids array is required', 400);
  }
  const supabase = getSupabaseServiceRoleClient();
  const { error } = await supabase.from(SOCIAL_POSTS_TABLE).delete().in('id', ids);
  if (error) {
    throw new AppError(`Failed to delete posts: ${error.message}`, 500);
  }
  res.json({ success: true, data: { deleted: ids.length } });
});

export const suggestPrompts = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const post = await fetchPostOrThrow(id);
  const suggestions = await buildSuggestions(post);

  const supabase = getSupabaseServiceRoleClient();
  const nextMeta = { ...(post.meta || {}), prompts: suggestions };
  await supabase.from(SOCIAL_POSTS_TABLE).update({ meta: nextMeta }).eq('id', id);

  res.json({ success: true, data: { suggestions } });
});

export const generateImageForPost = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const post = await fetchPostOrThrow(id);
  const prompt = String(req.body.prompt || '').trim();
  const crop = (req.body.crop as string) || 'square';
  const alt = req.body.alt ? String(req.body.alt).trim() : prompt.slice(0, 120);

  if (!prompt) {
    throw new AppError('prompt is required', 400);
  }

  const size = mapCropToSize(crop);
  const { imageUrl } = await generateDesign({ prompt, size });
  const uploaded = await uploadImage(imageUrl, `social-${id}`);
  const newUrl = uploaded.imageUrl;

  const nextAssetUrls = [...(post.asset_urls || [])];
  const nextAltTexts = [...(post.asset_alt_texts || [])];

  if (nextAssetUrls.length >= 10) {
    throw new AppError('Maximum of 10 assets per post reached', 400);
  }

  nextAssetUrls.push(newUrl);
  nextAltTexts.push(alt || '');

  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from(SOCIAL_POSTS_TABLE)
    .update({ asset_urls: nextAssetUrls, asset_alt_texts: nextAltTexts })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    throw new AppError(`Failed to attach asset: ${error?.message || 'Unknown error'}`, 500);
  }

  res.json({
    success: true,
    data: {
      post: data as SocialPostRecord,
      assetUrl: newUrl,
      alt,
    },
  });
});

export const generateBatchImagesForPost = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const post = await fetchPostOrThrow(id);
  const provided: any[] = Array.isArray(req.body.suggestions) ? req.body.suggestions : [];
  const suggestions = provided.filter((s) => s?.prompt) as { prompt: string; crop?: string; alt?: string }[];
  const finalSuggestions = suggestions.length ? suggestions : await buildSuggestions(post);

  const supabase = getSupabaseServiceRoleClient();
  let currentPost = post;

  for (const s of finalSuggestions) {
    if ((currentPost.asset_urls || []).length >= 10) break;
    const size = mapCropToSize(s.crop || 'square');
    const { imageUrl } = await generateDesign({ prompt: s.prompt, size });
    const uploaded = await uploadImage(imageUrl, `social-${id}`);
    const newUrl = uploaded.imageUrl;

    const nextAssetUrls = [...(currentPost.asset_urls || [])];
    const nextAltTexts = [...(currentPost.asset_alt_texts || [])];
    if (nextAssetUrls.length >= 10) break;
    nextAssetUrls.push(newUrl);
    nextAltTexts.push(s.alt ? String(s.alt) : s.prompt.slice(0, 120));

    const { data, error } = await supabase
      .from(SOCIAL_POSTS_TABLE)
      .update({ asset_urls: nextAssetUrls, asset_alt_texts: nextAltTexts })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new AppError(`Failed to attach asset: ${error?.message || 'Unknown error'}`, 500);
    }
    currentPost = data as SocialPostRecord;
  }

  res.json({
    success: true,
    data: {
      post: currentPost,
    },
  });
});

export const pollVideoStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const post = await fetchPostOrThrow(id);
  if (post.meta?.video_url) {
    res.json({ success: true, data: { video_url: post.meta.video_url, source: post.meta.video_source || 'unknown' } });
    return;
  }
  if (!post.meta?.video_job_id) {
    throw new AppError('No Sora job id found for this post', 400);
  }
  const polled = await pollSoraJob(String(post.meta.video_job_id));
  if (polled?.url) {
    const supabase = getSupabaseServiceRoleClient();
    const meta = { ...(post.meta || {}), video_url: polled.url };
    await supabase.from(SOCIAL_POSTS_TABLE).update({ meta }).eq('id', post.id);
    res.json({ success: true, data: { video_url: polled.url, source: 'sora' } });
    return;
  }
  res.status(202).json({ success: false, message: 'Video still processing or failed' });
});

export const generateFramesOnly = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const count = clampCount(parseInt(String(req.body.count ?? '4'), 10) || 4, 3, 6);
  const post = await fetchPostOrThrow(id);
  const existingPrompts = post.meta?.prompts || (await buildSuggestions(post));
  const result = await generateFramesFallback(post, existingPrompts, count, true);
  if (result) {
    res.json({ success: true, data: { video_url: result.mp4Url, gif_url: result.gifUrl } });
  } else {
    res.status(500).json({ success: false, message: 'Failed to generate frames' });
  }
});

export const stitchFramesFromAssets = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const post = await fetchPostOrThrow(id);
  const assetUrls = Array.isArray(req.body.assetUrls) ? (req.body.assetUrls as string[]).filter(Boolean) : [];
  const frames = assetUrls.length ? assetUrls : (post.meta?.frames as string[]) || [];
  if (!frames.length) {
    throw new AppError('No frames available to stitch. Provide assetUrls or generate frames first.', 400);
  }
  if (frames.length < 2) {
    throw new AppError('At least two frames are required to stitch.', 400);
  }
  const fps = clampCount(parseInt(String(req.body.fps ?? '4'), 10) || 4, 1, 12);
  const includeAudio = Boolean(req.body.includeAudio ?? true);
  const audioUrl =
    includeAudio && (post.meta as any)?.suno_audio_url
      ? (post.meta as any).suno_audio_url
      : includeAudio && (post.meta as any)?.suno_source_audio_url
      ? (post.meta as any).suno_source_audio_url
      : req.body.audioUrl || undefined;

  const buffers = await buffersFromUrls(frames);

  const supabase = getSupabaseServiceRoleClient();
  const baseMeta = { ...(post.meta || {}), frames, stitch_status: 'pending', stitch_error: null };
  await supabase.from(SOCIAL_POSTS_TABLE).update({ meta: baseMeta }).eq('id', post.id);

  try {
    let gifUrl = null;
    let videoUrl = await stitchFramesToMp4(buffers, `social-${post.id}`, audioUrl, fps);
    const meta = {
      ...baseMeta,
      gif_url: gifUrl,
      video_url: videoUrl,
      video_source: 'manual-stitch',
      stitch_status: 'complete',
      stitch_error: null,
      fps,
    };
    await supabase.from(SOCIAL_POSTS_TABLE).update({ meta }).eq('id', post.id);
    res.json({ success: true, data: { gif_url: gifUrl, video_url: videoUrl, stitch_status: 'complete' } });
  } catch (err: any) {
    const meta = { ...baseMeta, stitch_status: 'failed', stitch_error: err?.message || 'Stitch failed' };
    await supabase.from(SOCIAL_POSTS_TABLE).update({ meta }).eq('id', post.id);
    throw new AppError(`Failed to stitch frames: ${err?.message || err}`, 500);
  }
});

const soraEnabled = (process.env.SOCIAL_SORA_ENABLED || '').toLowerCase() === 'true';
const sunoEnabled = (process.env.SOCIAL_SUNO_ENABLED || '').toLowerCase() === 'true';
const veoEnabled = (process.env.SOCIAL_VEO_ENABLED || '').toLowerCase() === 'true';

const clampCount = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));

const buffersFromUrls = async (urls: string[]) => {
  const buffers: { name: string; buffer: Buffer }[] = [];
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new AppError(`Failed to download frame ${i + 1}: ${resp.statusText}`, 500);
    }
    const ext = (url.split('.').pop() || 'png').split('?')[0];
    const buf = Buffer.from(await resp.arrayBuffer());
    buffers.push({ name: `frame-${i}.${ext}`, buffer: buf });
  }
  return buffers;
};

const generateFramesFallback = async (post: SocialPostRecord, suggestions: any[], count: number, useAudio: boolean) => {
  const supabase = getSupabaseServiceRoleClient();
  const framesNeeded = clampCount(count, 3, 6);
  const chosen = suggestions.slice(0, framesNeeded);
  const frameBuffers: { name: string; buffer: Buffer }[] = [];
  const frameUrls: string[] = [];
  const targetFps = 2; // aim for a few seconds per clip

  for (let i = 0; i < chosen.length; i++) {
    const s = chosen[i];
    const size = mapCropToSize('story');
    const prompt = `${s.prompt} (Frame ${i + 1} of ${framesNeeded}, keep subject/style consistent, minimal text)`;
    const { imageUrl } = await generateDesign({ prompt, size });
    const uploaded = await uploadImage(imageUrl, `social-${post.id}`);
    frameUrls.push(uploaded.imageUrl);
    if (i === 0) {
      await supabase
        .from(SOCIAL_POSTS_TABLE)
        .update({ asset_urls: [uploaded.imageUrl], asset_alt_texts: [s.alt || s.prompt.slice(0, 120)] })
        .eq('id', post.id);
    }
    const resp = await fetch(uploaded.imageUrl);
    const buf = Buffer.from(await resp.arrayBuffer());
    frameBuffers.push({ name: `frame-${i}.png`, buffer: buf });
  }

  if (frameBuffers.length < 2) {
    const meta = { ...(post.meta || {}), frames: frameUrls, stitch_status: 'failed', stitch_error: 'Not enough frames' };
    await supabase.from(SOCIAL_POSTS_TABLE).update({ meta }).eq('id', post.id);
    return null;
  }

  const baseMeta = { ...(post.meta || {}), frames: frameUrls, stitch_status: 'pending', stitch_error: null };
  await supabase.from(SOCIAL_POSTS_TABLE).update({ meta: baseMeta }).eq('id', post.id);

  try {
    const audioUrl =
      useAudio && (post.meta as any)?.suno_audio_url ? (post.meta as any).suno_audio_url : (post.meta as any)?.suno_source_audio_url;
    const mp4Url = await stitchFramesToMp4(frameBuffers, `social-${post.id}`, audioUrl || undefined, targetFps);
    const meta = {
      ...baseMeta,
      video_url: mp4Url,
      gif_url: null,
      video_source: 'dalle-frames',
      stitch_status: 'complete',
      stitch_error: null,
    };
    await supabase.from(SOCIAL_POSTS_TABLE).update({ meta }).eq('id', post.id);
    return { gifUrl: null, mp4Url };
  } catch (err: any) {
    const meta = {
      ...baseMeta,
      stitch_status: 'failed',
      stitch_error: err?.message || 'Frame stitching failed',
    };
    await supabase.from(SOCIAL_POSTS_TABLE).update({ meta }).eq('id', post.id);
    return null;
  }
};

const evergreenThemes = [
  'Limitless design-first explainer (free preview, unlimited redraws)',
  'Gift cards for Limitless tees',
  'Behind the scenes of printing / fulfillment',
  'Customer spotlight / community showcase',
  'Holiday or seasonal hook',
  'Prompt-of-the-day challenge',
  'Color/size selection made simple',
  'Design in minutes: pick a prompt, pick a color',
  'Inspiration carousel (3-5 prompt ideas)',
  'Speed-to-tee: fast creation flow',
  'Gifting experience (unboxing/joy)',
  'Your prompt becomes a tee (examples)',
  'Style guide: minimalist vs bold',
  'Limited-time nudge or FOMO framing',
];

const generateWeekPlan = async (startDate: Date, count = 7, context?: string): Promise<
  {
    title: string;
    caption: string;
    cta: string;
    hashtags: string[];
    fb_type: SocialPostType;
    ig_type: SocialPostType;
    scheduled_at: string | null;
  }[]
> => {
  const client = ensureOpenAI();
  const themeList = evergreenThemes.join(' | ');
  const system = `You output ${count} social posts for GPTees (Facebook + Instagram) as JSON array.
Rules:
- GPTees sells one Limitless plan: free preview, unlimited redraws until approved, then pay when printing. No editing tools.
- Users enter a prompt, preview on four colors, pick size/fit, approve, then pay. Gift cards for Limitless exist.
- Do not promise advanced editing or extra features.
- Platforms: both FB and IG.
- Alternate POST/REEL/STORY; reels/stories should be motion-friendly.
- Include caption, CTA, hashtags, and a random HH:MM:SS time for each day.
- Dates start at provided startDate for consecutive days.
- Every title must be unique; avoid repeating phrases like "Unleash Your Creativity".
- Vary topics across the set. Use these evergreen themes as seeds: ${themeList}.
- If context is provided, every title/caption/CTA must reference it at least once; reject outputs that omit it.`;

  const user = `Start date: ${startDate.toISOString().slice(0, 10)}. Provide JSON array with ${count} items:
[{ "title":"...", "caption":"...", "cta":"...", "hashtags":["tag1","tag2"], "fb_type":"POST|REEL|STORY", "ig_type":"POST|REEL|STORY", "time":"HH:MM:SS" }]
Context: ${context || 'None provided; use evergreen themes.'}
If context is provided, you must reference it in every title and caption.`;

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.8,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });

  const content = completion.choices[0]?.message?.content || '{}';
  let items: any[] = [];
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) items = parsed;
    if (Array.isArray(parsed.items)) items = parsed.items;
    if (Array.isArray(parsed.posts)) items = parsed.posts;
  } catch {
    items = [];
  }
  if (!items.length) {
    items = Array.from({ length: count }).map((_v, idx) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + idx);
      return {
        title: `GPTees drop ${idx + 1}`,
        caption: 'Design your tee with GPTees: free preview, Limitless redraws until you approve.',
        cta: 'Create yours at GPTees.app. Limitless included. Gift codes available.',
        hashtags: ['GPTees', 'CustomTees', 'AIArt'],
        fb_type: idx % 2 === 0 ? 'POST' : 'REEL',
        ig_type: idx % 2 === 0 ? 'POST' : 'REEL',
        time: '12:00:00',
        scheduled_at: null,
      };
    });
  }

  return items.slice(0, count).map((item, idx) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + idx);
    const time = String(item.time || '').match(/^\\d{2}:\\d{2}:\\d{2}$/) ? item.time : '12:00:00';
    const iso = `${date.toISOString().slice(0, 10)}T${time}Z`;
    const fbType = sanitizePostType(item.fb_type || item.fbType) || 'POST';
    const igType = sanitizePostType(item.ig_type || item.igType) || 'POST';
    return {
      title: String(item.title || `GPTees ${idx + 1}`),
      caption: String(item.caption || ''),
      cta: String(item.cta || 'Create yours at GPTees.app. Gift cards available.'),
      hashtags: normalizeHashtags(item.hashtags || []),
      fb_type: fbType,
      ig_type: igType,
      scheduled_at: iso,
    };
  });
};

const createPlannedPosts = async (
  plan: {
    title: string;
    caption: string;
    cta: string;
    hashtags: string[];
    fb_type: SocialPostType;
    ig_type: SocialPostType;
    scheduled_at: string | null;
  }[],
  actorEmail: string | null
) => {
  const supabase = getSupabaseServiceRoleClient();
  const created: SocialPostRecord[] = [];
  for (const item of plan) {
    const payload: PostPayload = {
      title: item.title,
      caption: item.caption,
      cta: item.cta,
      hashtags: item.hashtags,
      platforms: ['facebook', 'instagram'],
      status: 'draft',
      scheduled_at: item.scheduled_at,
      fb_type: item.fb_type,
      ig_type: item.ig_type,
      show_reel_on_feed: item.ig_type === 'REEL',
      created_by: actorEmail,
    };
    const { data, error } = await supabase.from(SOCIAL_POSTS_TABLE).insert(payload).select().single();
    if (error || !data) {
      throw new AppError(`Failed to create social post: ${error?.message || 'Unknown error'}`, 500);
    }
    const post = data as SocialPostRecord;

    // save prompts
    const suggestions = await buildSuggestions(post);
    await supabase.from(SOCIAL_POSTS_TABLE).update({ meta: { ...(post.meta || {}), prompts: suggestions } }).eq('id', post.id);

    let videoQueued = false;
    let soraOrVeoQueued = false;

    // optional: Sora video for REEL/STORY
    if (soraEnabled && (post.fb_type === 'REEL' || post.ig_type === 'REEL' || post.ig_type === 'STORY')) {
      try {
        const clip = await generateSoraVideo(
          `${post.title} for GPTees. Vertical 9:16 reel/story. Show a clear subject interacting with a custom tee (no text overlays), product-focused, smooth camera, 6-8s. Avoid abstract scenes; keep apparel obvious.`
        );
        if (clip?.url) {
          const meta = { ...(post.meta || {}), video_url: clip.url, video_job_id: clip.jobId };
          await supabase.from(SOCIAL_POSTS_TABLE).update({ meta }).eq('id', post.id);
          videoQueued = true;
          soraOrVeoQueued = true;
        } else {
          console.warn(`Sora video returned null for post ${post.id}`);
        }
      } catch (err: any) {
        console.warn(`Sora video failed for post ${post.id}`, err?.message || err);
      }
    }

    // Veo fallback/parallel for reels/stories if enabled
    if (veoEnabled && (post.fb_type === 'REEL' || post.ig_type === 'REEL' || post.ig_type === 'STORY')) {
      try {
        console.log(`Attempting Veo for post ${post.id}`);
        const veo = await generateVeoVideo(`${post.title}. Vertical 9:16 reel, action-friendly, clear subject, no text overlays.`);
        if (veo?.taskId) {
          const meta = { ...(post.meta || {}), veo_task_id: veo.taskId };
          const { error } = await supabase.from(SOCIAL_POSTS_TABLE).update({ meta }).eq('id', post.id);
          if (error) {
            console.error('Failed to store Veo task id', error);
          } else {
            videoQueued = true;
            soraOrVeoQueued = true;
          }
          console.log(`Veo task queued for post ${post.id}: ${veo.taskId}`);
        } else {
          console.warn(`Veo returned null/empty for post ${post.id}`);
        }
      } catch (err: any) {
        console.warn(`Veo video failed for post ${post.id}`, err?.message || err);
      }
    }

    // generate one image (cover) for all posts
    const first = suggestions[0];
    if (first) {
      const size = mapCropToSize(first.crop);
      const { imageUrl } = await generateDesign({ prompt: first.prompt, size });
      const uploaded = await uploadImage(imageUrl, `social-${post.id}`);
      const nextUrls = [uploaded.imageUrl];
      const nextAlts = [first.alt || first.prompt.slice(0, 120)];
      await supabase
        .from(SOCIAL_POSTS_TABLE)
        .update({ asset_urls: nextUrls, asset_alt_texts: nextAlts })
        .eq('id', post.id);
    }

    // If no video queued and this is REEL/STORY, build a frame sequence -> gif/mp4, and mux Suno if available
    if (!soraOrVeoQueued && (post.fb_type === 'REEL' || post.ig_type === 'REEL' || post.ig_type === 'STORY')) {
      try {
        const stitched = await generateFramesFallback(post, suggestions, 4, true);
        if (stitched) {
          videoQueued = true;
        }
      } catch (err: any) {
        console.warn(`Frame stitching failed for post ${post.id}`, err?.message || err);
      }
    }

    // For reels/stories: only run Suno if no video task queued
    if (!videoQueued && sunoEnabled && (post.fb_type === 'REEL' || post.ig_type === 'REEL' || post.ig_type === 'STORY')) {
      try {
        console.log(`Attempting Suno for post ${post.id}`);
        const audio = await generateSunoTrack(`Short 12-20s ad bed for ${post.title}, upbeat, minimal vocals`);
        if (audio?.taskId) {
          const meta = { ...(post.meta || {}), suno_task_id: audio.taskId };
          await supabase.from(SOCIAL_POSTS_TABLE).update({ meta }).eq('id', post.id);
          console.log(`Suno task queued for post ${post.id}: ${audio.taskId}`);
        } else {
          console.warn(`Suno returned null/empty for post ${post.id}`);
        }
      } catch (err: any) {
        console.warn(`Suno audio failed for post ${post.id}`, err?.message || err);
      }
    } else if (!sunoEnabled) {
      console.warn(`Suno disabled; skipping audio for post ${post.id}`);
    }

    created.push((await fetchPostOrThrow(post.id)) as SocialPostRecord);
  }
  return created;
};

export const autoWeekSocialPosts = catchAsync(async (req: Request, res: Response) => {
  const startDate = req.body.startDate ? new Date(req.body.startDate) : new Date();
  const context = req.body.context ? String(req.body.context) : '';
  const plan = await generateWeekPlan(startDate, 7, context);
  const tokenUser = req.user?.email || null;
  const created = await createPlannedPosts(plan, tokenUser);

  res.json({ success: true, data: created });
});

export const autoSingleSocialPost = catchAsync(async (req: Request, res: Response) => {
  const startDate = req.body.startDate ? new Date(req.body.startDate) : new Date();
  const desiredType = sanitizePostType(req.body.type) || 'POST';
  const context = req.body.context ? String(req.body.context) : '';
  const plan = await generateWeekPlan(startDate, 1, context);
  if (plan[0]) {
    plan[0].fb_type = desiredType;
    plan[0].ig_type = desiredType;
  }
  const tokenUser = req.user?.email || null;
  const created = await createPlannedPosts(plan, tokenUser);
  res.json({ success: true, data: created });
});

export const listDesignAssets = catchAsync(async (req: Request, res: Response) => {
  const prefix = (req.query.prefix as string) || '';
  const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10) || 20));
  const offset = Math.max(0, parseInt(String(req.query.offset ?? '0'), 10) || 0);
  const search = (req.query.search as string) || undefined;
  const type = (req.query.type as string) as 'image' | 'video' | 'gif' | undefined;
  const assets = await listStorageAssets(prefix, limit, offset, search, type);
  res.json({ success: true, data: assets });
});
export const listTemplates = catchAsync(async (_req: Request, res: Response) => {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from(SOCIAL_TEMPLATES_TABLE)
    .select('*')
    .order('title', { ascending: true });
  if (error) {
    throw new AppError(`Failed to list templates: ${error.message}`, 500);
  }
  res.json({ success: true, data: data as SocialTemplateRecord[] });
});

export const createTemplate = catchAsync(async (req: Request, res: Response) => {
  const key = String(req.body.key ?? '').trim();
  const title = String(req.body.title ?? '').trim();
  const body = String(req.body.body ?? '').trim();
  if (!key || !title || !body) {
    throw new AppError('key, title, and body are required', 400);
  }
  const defaultHashtags = normalizeHashtags(req.body.default_hashtags ?? req.body.defaultHashtags ?? []);
  const notes = req.body.notes ? String(req.body.notes).trim() : null;
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from(SOCIAL_TEMPLATES_TABLE)
    .insert({
      key,
      title,
      body,
      default_hashtags: defaultHashtags,
      notes,
    })
    .select()
    .single();
  if (error || !data) {
    throw new AppError(`Failed to create template: ${error?.message || 'Unknown error'}`, 500);
  }
  res.status(201).json({ success: true, data: data as SocialTemplateRecord });
});

export const updateTemplate = catchAsync(async (req: Request, res: Response) => {
  const { key } = req.params;
  const supabase = getSupabaseServiceRoleClient();
  const update: Partial<SocialTemplateRecord> = {};

  if (req.body.title !== undefined) {
    update.title = String(req.body.title ?? '').trim();
  }
  if (req.body.body !== undefined) {
    update.body = String(req.body.body ?? '').trim();
  }
  if (req.body.defaultHashtags !== undefined || req.body.default_hashtags !== undefined) {
    update.default_hashtags = normalizeHashtags(req.body.defaultHashtags ?? req.body.default_hashtags ?? []);
  }
  if (req.body.notes !== undefined) {
    update.notes = req.body.notes ? String(req.body.notes).trim() : null;
  }

  const { data, error } = await supabase
    .from(SOCIAL_TEMPLATES_TABLE)
    .update(update)
    .eq('key', key)
    .select()
    .single();
  if (error || !data) {
    throw new AppError(`Failed to update template: ${error?.message || 'Unknown error'}`, 500);
  }
  res.json({ success: true, data: data as SocialTemplateRecord });
});

export const deleteTemplate = catchAsync(async (req: Request, res: Response) => {
  const { key } = req.params;
  const supabase = getSupabaseServiceRoleClient();
  const { error } = await supabase.from(SOCIAL_TEMPLATES_TABLE).delete().eq('key', key);
  if (error) {
    throw new AppError(`Failed to delete template: ${error.message}`, 500);
  }
  res.status(204).send();
});

export const listPromptBank = catchAsync(async (_req: Request, res: Response) => {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase.from(PROMPT_BANK_TABLE).select('*').order('created_at', { ascending: false });
  if (error) {
    throw new AppError(`Failed to list prompt bank: ${error.message}`, 500);
  }
  res.json({ success: true, data: data as PromptBankRecord[] });
});

export const upsertPromptBank = catchAsync(async (req: Request, res: Response) => {
  const items = Array.isArray(req.body.prompts) ? req.body.prompts : [];
  const supabase = getSupabaseServiceRoleClient();
  if (!items.length) {
    throw new AppError('prompts array is required', 400);
  }
  const payload = items.map((item: any) => ({
    key: item.key || null,
    prompt: String(item.prompt || '').trim(),
    crop: ['square', 'portrait', 'story'].includes(String(item.crop)) ? String(item.crop) : 'square',
    alt: item.alt ? String(item.alt) : null,
    tags: Array.isArray(item.tags)
      ? item.tags.map((t: any) => String(t).trim()).filter(Boolean)
      : item.tags
      ? String(item.tags)
          .split(',')
          .map((t: any) => String(t).trim())
          .filter(Boolean)
      : [],
  }));
  const { data, error } = await supabase.from(PROMPT_BANK_TABLE).upsert(payload, { onConflict: 'key' }).select();
  if (error) {
    throw new AppError(`Failed to save prompt bank: ${error.message}`, 500);
  }
  res.json({ success: true, data });
});

export const deletePromptBank = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const supabase = getSupabaseServiceRoleClient();
  const { error } = await supabase.from(PROMPT_BANK_TABLE).delete().eq('id', id);
  if (error) {
    throw new AppError(`Failed to delete prompt: ${error.message}`, 500);
  }
  res.status(204).send();
});

export const listHashtagSets = catchAsync(async (_req: Request, res: Response) => {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase.from(HASHTAG_SETS_TABLE).select('*').order('name', { ascending: true });
  if (error) {
    throw new AppError(`Failed to list hashtag sets: ${error.message}`, 500);
  }
  res.json({ success: true, data: data as HashtagSetRecord[] });
});

export const createHashtagSet = catchAsync(async (req: Request, res: Response) => {
  const name = String(req.body.name ?? '').trim();
  if (!name) {
    throw new AppError('Hashtag set name is required', 400);
  }
  const tags = normalizeHashtags(req.body.tags ?? req.body.tagList ?? []);
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from(HASHTAG_SETS_TABLE)
    .insert({
      name,
      tags,
    })
    .select()
    .single();
  if (error || !data) {
    throw new AppError(`Failed to create hashtag set: ${error?.message || 'Unknown error'}`, 500);
  }
  res.status(201).json({ success: true, data: data as HashtagSetRecord });
});

export const updateHashtagSet = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const update: Partial<HashtagSetRecord> = {};
  if (req.body.name !== undefined) {
    update.name = String(req.body.name ?? '').trim();
  }
  if (req.body.tags !== undefined || req.body.tagList !== undefined) {
    update.tags = normalizeHashtags(req.body.tags ?? req.body.tagList ?? []);
  }
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from(HASHTAG_SETS_TABLE)
    .update(update)
    .eq('id', id)
    .select()
    .single();
  if (error || !data) {
    throw new AppError(`Failed to update hashtag set: ${error?.message || 'Unknown error'}`, 500);
  }
  res.json({ success: true, data: data as HashtagSetRecord });
});

export const deleteHashtagSet = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const supabase = getSupabaseServiceRoleClient();
  const { error } = await supabase.from(HASHTAG_SETS_TABLE).delete().eq('id', id);
  if (error) {
    throw new AppError(`Failed to delete hashtag set: ${error.message}`, 500);
  }
  res.status(204).send();
});
