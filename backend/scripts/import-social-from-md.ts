/// <reference types="node" />
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import process from 'process';
import { createHash, randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';

type SocialPlatform = 'facebook' | 'instagram';
type SocialStatus = 'draft' | 'scheduled' | 'posted' | 'failed';
type SocialPostType = 'POST' | 'REEL' | 'STORY';

interface AssetInput {
  url: string;
  alt?: string;
}

interface SocialInput {
  title: string;
  date?: string;
  time?: string;
  caption: string;
  cta?: string;
  hashtags?: string[];
  platforms?: SocialPlatform[];
  fb_type?: SocialPostType;
  ig_type?: SocialPostType;
  show_reel_on_feed?: boolean;
  first_comment?: string;
  assets?: AssetInput[];
  status?: SocialStatus;
  scheduled_at?: string;
  template_key?: string;
  post_type?: string; // legacy mapping
}

interface SocialPostRecord {
  id: string;
  title: string;
  caption: string;
  hashtags: string[];
  cta: string | null;
  platforms: SocialPlatform[];
  asset_urls: string[];
  asset_alt_texts: string[];
  status: SocialStatus;
  scheduled_at: string | null;
  posted_at: string | null;
  template_key: string | null;
  first_comment: string | null;
  fb_type: SocialPostType | null;
  ig_type: SocialPostType | null;
  show_reel_on_feed: boolean;
  meta: Record<string, any>;
  created_by: string | null;
}

const CSV_HEADERS = [
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

const allowedPlatforms: SocialPlatform[] = ['facebook', 'instagram'];
const allowedStatuses: SocialStatus[] = ['draft', 'scheduled', 'posted', 'failed'];
const allowedPostTypes: SocialPostType[] = ['POST', 'REEL', 'STORY'];

const args = process.argv.slice(2);
const argMap: Record<string, string | boolean> = {};
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg.startsWith('--')) {
    const key = arg.replace(/^--/, '');
    const next = args[i + 1];
    if (next && !next.startsWith('--')) {
      argMap[key] = next;
      i++;
    } else {
      argMap[key] = true;
    }
  }
}

const cwd = process.cwd();
const defaultStructured = path.resolve(cwd, '..', 'docs', 'social_posts_import.md');
const defaultLegacy = path.resolve(cwd, '..', 'docs', 'SOCIAL_MEDIA.md');
const inputPath = (argMap.input as string) || (fs.existsSync(defaultStructured) ? defaultStructured : defaultLegacy);
const csvPath = (argMap.csv as string) || path.resolve(cwd, '..', 'docs', 'social_fb_ig_export.csv');
const forceLegacy = Boolean(argMap.legacy);
const dryRun = Boolean(argMap['dry-run']);

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function stableId(input: string): string {
  const hash = createHash('sha1').update(input).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(
    20,
    32
  )}`;
}

function parseHashtags(raw: any): string[] {
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : String(raw).split(/[\s,]+/);
  const cleaned = arr
    .map((tag) => String(tag).replace(/^#/, '').trim())
    .filter(Boolean);
  return Array.from(new Set(cleaned)).slice(0, 30);
}

function parsePlatforms(raw: any): SocialPlatform[] {
  if (!raw) return ['facebook', 'instagram'];
  const arr = Array.isArray(raw) ? raw : String(raw).split(/[\s,]+/);
  const normalized = arr
    .map((p) => String(p).toLowerCase().trim())
    .filter((p) => allowedPlatforms.includes(p as SocialPlatform)) as SocialPlatform[];
  return normalized.length ? Array.from(new Set(normalized)) : ['facebook', 'instagram'];
}

function parsePostType(raw: any): SocialPostType | null {
  if (!raw) return null;
  const upper = String(raw).toUpperCase().trim();
  return allowedPostTypes.includes(upper as SocialPostType) ? (upper as SocialPostType) : null;
}

function normalizeTypes(input: SocialInput): { fb_type: SocialPostType | null; ig_type: SocialPostType | null } {
  const fbType = parsePostType(input.fb_type || input.post_type);
  const igType = parsePostType(input.ig_type || input.post_type);
  const fb = fbType || 'POST';
  const ig = igType || 'POST';
  return { fb_type: fb, ig_type: ig };
}

function normalizeStatus(raw: any): SocialStatus {
  const status = String(raw || 'draft').toLowerCase() as SocialStatus;
  return allowedStatuses.includes(status) ? status : 'draft';
}

function buildScheduledAt(date?: string, time?: string, explicit?: string): string | null {
  if (explicit) {
    const d = new Date(explicit);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  if (!date || !time) return null;
  const parsed = new Date(`${date}T${time}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function normalizeAssets(assets?: AssetInput[]): { urls: string[]; alts: string[] } {
  if (!assets || !assets.length) {
    return { urls: [], alts: [] };
  }
  const trimmed = assets
    .filter((a) => a && a.url)
    .slice(0, 10)
    .map((a) => ({ url: String(a.url).trim(), alt: String(a.alt ?? '').trim() }));

  const urls = trimmed.map((a) => a.url);
  const alts = trimmed.map((a) => a.alt || '');

  while (alts.length < urls.length) {
    alts.push('');
  }

  return { urls, alts };
}

function buildCaptionText(post: SocialPostRecord): string {
  const pieces: string[] = [];
  if (post.caption) pieces.push(post.caption);
  if (post.cta) pieces.push(post.cta);
  if (post.hashtags?.length) {
    const hashtagLine = post.hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ');
    if (hashtagLine) pieces.push(hashtagLine);
  }
  return pieces.join('\n\n');
}

function csvEscape(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsvRow(post: SocialPostRecord): string[] {
  const scheduled = post.scheduled_at ? new Date(post.scheduled_at) : null;
  const dateStr = scheduled ? scheduled.toISOString().slice(0, 10) : '';
  const timeStr = scheduled ? scheduled.toISOString().slice(11, 19) : '';
  const pictures = Array.from({ length: 10 }, (_v, idx) => post.asset_urls[idx] || '');
  const alts = Array.from({ length: 10 }, (_v, idx) => post.asset_alt_texts[idx] || '');

  return [
    buildCaptionText(post),
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
    '',
    '',
  ].map(csvEscape);
}

function parseStructuredMarkdown(md: string): SocialInput[] {
  const regex = /```social-post\s+([\s\S]*?)```/g;
  const posts: SocialInput[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(md)) !== null) {
    const jsonText = match[1].trim();
    try {
      const parsed = JSON.parse(jsonText) as SocialInput;
      posts.push(parsed);
    } catch (err) {
      console.warn('Skipping invalid social-post block:', err);
    }
  }
  return posts;
}

function extractBlock(label: string, section: string, stopLabels: string[]): string {
  const start = section.indexOf(label);
  if (start === -1) return '';
  const slice = section.slice(start + label.length);
  let end = slice.length;
  for (const stop of stopLabels) {
    const idx = slice.indexOf(stop);
    if (idx !== -1 && idx < end) end = idx;
  }
  return slice.slice(0, end).trim().replace(/^\s*[:.-]\s*/, '').trim();
}

function parseLegacyMarkdown(md: string): SocialInput[] {
  const sections = md
    .split(/\n(?=December\s+\d{1,2},\s*2025)/gi)
    .map((s) => s.trim())
    .filter((s) => s.toLowerCase().startsWith('december'));

  const posts: SocialInput[] = [];

  for (const section of sections) {
    const headerLine = section.split('\n')[0];
    const headerMatch = headerLine.match(/December\s+(\d{1,2}),\s*2025\s*[—-]?\s*(.*)/i);
    const day = headerMatch?.[1];
    const title = (headerMatch?.[2] || headerLine || '').trim();
    if (!day || !title) continue;

    const postTypeLine = extractBlock('Post Type', section, ['Visual', 'Caption']);
    const caption = extractBlock('Caption Copy', section, ['Suggested Hashtags', 'CTA:', 'CTA', 'Instagram Story']);
    const hashtagsLine = extractBlock('Suggested Hashtags', section, ['CTA', 'CTA:', 'Instagram Story']);
    const ctaLine = extractBlock('CTA', section, ['Instagram Story', 'Paid Promo', 'Collaboration']);

    posts.push({
      title,
      date: `2025-12-${day.padStart(2, '0')}`,
      caption,
      cta: ctaLine,
      hashtags: parseHashtags(hashtagsLine),
      platforms: ['facebook', 'instagram'],
      post_type: postTypeLine,
    });
  }

  return posts;
}

function parseInputFile(rawMd: string, useLegacy: boolean): SocialInput[] {
  if (!useLegacy) {
    const structured = parseStructuredMarkdown(rawMd);
    if (structured.length) return structured;
  }
  return parseLegacyMarkdown(rawMd);
}

function toRecord(input: SocialInput): SocialPostRecord {
  const { fb_type, ig_type } = normalizeTypes(input);
  const platforms = parsePlatforms(input.platforms);
  const hashtags = parseHashtags(input.hashtags);
  const { urls, alts } = normalizeAssets(input.assets);
  const scheduled_at = buildScheduledAt(input.date, input.time, input.scheduled_at);
  const template_key = input.template_key || slugify(input.title || randomUUID());
  const id = stableId(`${template_key}-${input.date || ''}-${input.time || ''}`);

  return {
    id,
    title: input.title?.trim() || 'Untitled',
    caption: (input.caption || '').trim(),
    hashtags,
    cta: input.cta ? input.cta.trim() : null,
    platforms,
    asset_urls: urls,
    asset_alt_texts: alts,
    status: normalizeStatus(input.status),
    scheduled_at,
    posted_at: null,
    template_key,
    first_comment: input.first_comment ? input.first_comment.trim() : null,
    fb_type,
    ig_type,
    show_reel_on_feed: Boolean(
      input.show_reel_on_feed ||
        fb_type === 'REEL' ||
        ig_type === 'REEL'
    ),
    meta: {},
    created_by: null,
  };
}

async function upsertPosts(posts: SocialPostRecord[]): Promise<void> {
  if (!posts.length) {
    console.log('No posts to import.');
    return;
  }

  const chunks: SocialPostRecord[][] = [];
  const size = 50;
  for (let i = 0; i < posts.length; i += size) {
    chunks.push(posts.slice(i, i + size));
  }

  for (const chunk of chunks) {
    const { error } = await supabase.from('social_posts').upsert(chunk, { onConflict: 'id' });
    if (error) {
      throw new Error(`Supabase upsert failed: ${error.message}`);
    }
  }
}

function writeCsv(posts: SocialPostRecord[], targetPath: string): void {
  const rows = posts.map(buildCsvRow);
  const csv = [CSV_HEADERS.map(csvEscape).join(','), ...rows.map((r) => r.join(','))].join('\n');
  fs.writeFileSync(targetPath, csv, 'utf-8');
  console.log(`CSV written to ${targetPath} (${posts.length} rows)`);
}

async function upsertTemplates(posts: SocialPostRecord[]): Promise<void> {
  const templates = posts
    .filter((p) => p.template_key)
    .map((p) => ({
      key: p.template_key as string,
      title: p.title,
      body: p.caption,
      default_hashtags: p.hashtags || [],
    }));

  const unique = new Map<string, { key: string; title: string; body: string; default_hashtags: string[] }>();
  for (const t of templates) {
    if (!unique.has(t.key)) {
      unique.set(t.key, t);
    }
  }

  const list = Array.from(unique.values());
  if (!list.length) {
    return;
  }

  const { error } = await supabase.from('social_templates').upsert(list, { onConflict: 'key' });
  if (error) {
    throw new Error(`Supabase upsert templates failed: ${error.message}`);
  }
}

async function main() {
  console.log(
    `Import starting. input=${inputPath} legacy=${forceLegacy} dryRun=${dryRun} csv=${csvPath ?? 'none'}`
  );

  const md = fs.readFileSync(inputPath, 'utf-8');
  const inputs = parseInputFile(md, forceLegacy);

  if (!inputs.length) {
    console.error('No posts parsed. Check the input file or parser selection.');
    process.exit(1);
  }

  const records = inputs.map(toRecord);

  if (dryRun) {
    console.log(`Parsed ${records.length} posts (dry run, no Supabase writes).`);
  } else {
    await upsertTemplates(records);
    await upsertPosts(records);
    console.log(`Upserted ${records.length} posts into Supabase.`);
  }

  if (csvPath) {
    writeCsv(records, csvPath);
  }

  console.log('Import finished.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
