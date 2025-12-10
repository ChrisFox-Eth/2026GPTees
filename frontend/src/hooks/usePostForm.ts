import { useState } from 'react';
import { apiPost, apiRequest } from '../utils/api';
import { SocialPlatform, SocialStatus, SocialPost } from '../types/social';

export type FormMode = 'create' | 'edit' | 'duplicate';

export interface AssetField {
  url: string;
  alt: string;
}

export interface FormState {
  id?: string;
  title: string;
  caption: string;
  cta: string;
  hashtags: string;
  platforms: Record<SocialPlatform, boolean>;
  status: SocialStatus;
  scheduledAt: string;
  fbType: 'POST' | 'REEL' | 'STORY';
  igType: 'POST' | 'REEL' | 'STORY';
  showReelOnFeed: boolean;
  firstComment: string;
  assets: AssetField[];
  templateKey: string;
}

export const defaultFormState: FormState = {
  title: '',
  caption: '',
  cta: '',
  hashtags: '',
  platforms: { facebook: true, instagram: true },
  status: 'draft',
  scheduledAt: '',
  fbType: 'POST',
  igType: 'POST',
  showReelOnFeed: false,
  firstComment: '',
  assets: [{ url: '', alt: '' }],
  templateKey: '',
};

type TemplateLite = { key: string; title: string; body: string; default_hashtags?: string[] };
type HashtagSetLite = { id: string; name: string; tags: string[] };

function parseHashtags(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(/[\s,]+/)
        .map((h) => h.replace(/^#/, '').trim())
        .filter(Boolean)
    )
  );
}

function parsePlatforms(map: Record<SocialPlatform, boolean>): SocialPlatform[] {
  return (['facebook', 'instagram'] as SocialPlatform[]).filter((p) => map[p]);
}

function toDateTimeLocal(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const off = date.getTimezoneOffset();
  const local = new Date(date.getTime() - off * 60000);
  return local.toISOString().slice(0, 16);
}

function buildPayload(form: FormState) {
  const platforms = parsePlatforms(form.platforms);
  return {
    title: form.title.trim(),
    caption: form.caption.trim(),
    cta: form.cta.trim() || null,
    hashtags: parseHashtags(form.hashtags),
    platforms,
    status: form.status,
    scheduled_at: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
    fb_type: form.fbType,
    ig_type: form.igType,
    show_reel_on_feed: form.showReelOnFeed,
    first_comment: form.firstComment.trim() || null,
    asset_urls: form.assets.filter((a) => a.url.trim()).map((a) => a.url.trim()),
    asset_alt_texts: form.assets.filter((a) => a.url.trim()).map((a) => (a.alt || '').trim()),
    template_key: form.templateKey.trim() || null,
  };
}

interface UsePostFormArgs {
  skipAuth: boolean;
  getToken: () => Promise<string | null>;
  templates: TemplateLite[];
  hashtagSets: HashtagSetLite[];
  onSaved: () => Promise<void> | void;
  setError: (msg: string | null) => void;
}

export function usePostForm({ skipAuth, getToken, templates, hashtagSets, onSaved, setError }: UsePostFormArgs) {
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [formState, setFormState] = useState<FormState>(defaultFormState);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setFormMode('create');
    setFormState(defaultFormState);
    setFormOpen(true);
  };

  const openEdit = (post: SocialPost, mode: FormMode = 'edit') => {
    setFormMode(mode);
    setFormState({
      id: mode === 'edit' ? post.id : undefined,
      title: post.title || '',
      caption: post.caption || '',
      cta: post.cta || '',
      hashtags: (post.hashtags || []).join(', '),
      platforms: {
        facebook: post.platforms.includes('facebook'),
        instagram: post.platforms.includes('instagram'),
      },
      status: post.status || 'draft',
      scheduledAt: post.scheduled_at ? toDateTimeLocal(post.scheduled_at) : '',
      fbType: (post.fb_type as FormState['fbType']) || 'POST',
      igType: (post.ig_type as FormState['igType']) || 'POST',
      showReelOnFeed: !!post.show_reel_on_feed,
      firstComment: post.first_comment || '',
      assets: (post.asset_urls || []).map((u, idx) => ({
        url: u,
        alt: post.asset_alt_texts?.[idx] || '',
      })),
      templateKey: post.template_key || '',
    });
    setFormOpen(true);
  };

  const openDuplicate = (post: SocialPost) => openEdit(post, 'duplicate');

  const applyTemplate = (key: string) => {
    const tpl = templates.find((t) => t.key === key);
    if (!tpl) return;
    setFormState((prev) => ({
      ...prev,
      caption: tpl.body || prev.caption,
      templateKey: key,
      hashtags: tpl.default_hashtags?.join(', ') || prev.hashtags,
    }));
  };

  const applyHashtagSet = (id: string) => {
    const set = hashtagSets.find((h) => h.id === id);
    if (!set) return;
    const existing = parseHashtags(formState.hashtags);
    const combined = Array.from(new Set([...existing, ...(set.tags || [])]));
    setFormState((prev) => ({
      ...prev,
      hashtags: combined.join(', '),
    }));
  };

  const handleAddAsset = () => {
    setFormState((prev) => {
      if (prev.assets.length >= 10) return prev;
      return { ...prev, assets: [...prev.assets, { url: '', alt: '' }] };
    });
  };

  const handleRemoveAsset = (index: number) => {
    setFormState((prev) => ({
      ...prev,
      assets: prev.assets.filter((_, idx) => idx !== index),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const token = skipAuth ? undefined : await getToken();
      const payload = buildPayload(formState);
      if (formMode === 'edit' && formState.id) {
        await apiRequest(`/api/admin/social/posts/${formState.id}`, { method: 'PATCH', body: JSON.stringify(payload) }, token);
      } else {
        await apiPost('/api/admin/social/posts', payload, token);
      }
      setFormOpen(false);
      setFormState(defaultFormState);
      await onSaved();
    } catch (err: any) {
      setError(err?.message || 'Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  return {
    formOpen,
    formMode,
    formState,
    setFormState,
    setFormOpen,
    openCreate,
    openEdit,
    openDuplicate,
    applyTemplate,
    applyHashtagSet,
    handleAddAsset,
    handleRemoveAsset,
    handleSave,
    saving,
  };
}
