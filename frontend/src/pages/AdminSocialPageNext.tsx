import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Button } from '@components/Button';
import { apiGet, apiPost, apiRequest } from '../utils/api';
import { SocialPost, SocialPublishPack, SocialStatus, PromptSuggestion } from '../types/social';
import { CSV_HEADERS, buildCsvRow } from '../constants/social';
import { FiltersBar } from '../components/social/FiltersBar';
import { SocialTable } from '../components/social/SocialTable';
import { BulkActionsBar } from '../components/social/BulkActionsBar';
import { AssetLibraryModal } from '../components/social/AssetLibraryModal';
import { HelpPanel } from '../components/social/HelpPanel';
import { SocialFormModal } from '../components/social/SocialFormModal';
import { SocialPostDrawer } from '../components/social/SocialPostDrawer';
import { useSocialData } from '../hooks/useSocialData';
import { usePostForm } from '../hooks/usePostForm';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * WIP: Modular replacement for AdminSocialPage.
 * This starts with read-only list + help; functionality will be added incrementally.
 */
export default function AdminSocialPageNext(): JSX.Element {
  const { isSignedIn, getToken } = useAuth();
  const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true';

  const [helpOpen, setHelpOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    posts,
    meta,
    loading,
    page,
    pageSize,
    sortBy,
    sortDir,
    needsAssets,
    needsPrompts,
    selectedIds,
    setNeedsAssets,
    setNeedsPrompts,
    setPage,
    setSelectedIds,
    filteredPosts,
    loadPosts,
    toggleSort,
    toggleSelect,
    toggleSelectAll,
  } = useSocialData({ skipAuth, getToken, isSignedIn });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pack, setPack] = useState<SocialPublishPack | null>(null);
  const [generatingWeek, setGeneratingWeek] = useState(false);
  const [actionSaving, setActionSaving] = useState(false);
  const [promptSuggestions, setPromptSuggestions] = useState<PromptSuggestion[]>([]);
  const [promptLoading, setPromptLoading] = useState(false);
  const [imageLoadingId, setImageLoadingId] = useState<string | null>(null);
  const [promptBank, setPromptBank] = useState<{ id: string; key: string | null; prompt: string; crop: string; alt?: string | null; tags?: string[] }[]>([]);
  const [promptBankKey, setPromptBankKey] = useState<string>('');

  // placeholders to keep shape; will be wired in later steps
  const [stitching, setStitching] = useState(false);
  const [stitchFps, setStitchFps] = useState<number>(1);
  const [stitchIncludeAudio, setStitchIncludeAudio] = useState(true);
  const [framesCount, setFramesCount] = useState<number>(4);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryAssets, setLibraryAssets] = useState<{ name: string; url: string }[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryPage, setLibraryPage] = useState(0);
  const [libraryType, setLibraryType] = useState('');
  const [librarySearch, setLibrarySearch] = useState('');
  const [librarySelected, setLibrarySelected] = useState<Set<string>>(new Set());
  const [generationContext, setGenerationContext] = useState('');
  const [templates, setTemplates] = useState<{ key: string; title: string; body: string; default_hashtags?: string[] }[]>([]);
  const [hashtagSets, setHashtagSets] = useState<{ id: string; name: string; tags: string[] }[]>([]);
  const {
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
  } = usePostForm({
    skipAuth,
    getToken,
    templates,
    hashtagSets,
    onSaved: loadPosts,
    setError,
  });

  const loadPromptBank = async () => {
    try {
      const token = skipAuth ? undefined : await getToken();
      const response = await apiGet('/api/admin/social/prompt-bank', token);
      setPromptBank(response.data || []);
    } catch {
      // best effort
    }
  };

  const loadTemplates = async () => {
    try {
      const token = skipAuth ? undefined : await getToken();
      const response = await apiGet('/api/admin/social/templates', token);
      setTemplates(response.data || []);
    } catch {
      setTemplates([]);
    }
  };

  const loadHashtagSets = async () => {
    try {
      const token = skipAuth ? undefined : await getToken();
      const response = await apiGet('/api/admin/social/hashtag-sets', token);
      setHashtagSets(response.data || []);
    } catch {
      setHashtagSets([]);
    }
  };

  const loadAssets = async () => {
    setLibraryLoading(true);
    try {
      const token = skipAuth ? undefined : await getToken();
      const params = new URLSearchParams({
        limit: '50',
        offset: String(libraryPage * 50),
      });
      if (librarySearch) params.set('search', librarySearch);
      if (libraryType) params.set('type', libraryType);
      const response = await apiGet(`/api/admin/social/assets?${params.toString()}`, token);
      setLibraryAssets(response.data || []);
    } catch {
      setLibraryAssets([]);
    } finally {
      setLibraryLoading(false);
    }
  };

  useEffect(() => {
    if (libraryOpen) {
      void loadAssets();
    }
  }, [libraryOpen, libraryPage, libraryType, librarySearch]);

  useEffect(() => {
    if (isSignedIn || skipAuth) {
      void loadPosts();
      void loadPromptBank();
      void loadTemplates();
      void loadHashtagSets();
    }
  }, [isSignedIn, skipAuth, page, pageSize, sortBy, sortDir]);

  const handleExportCsv = async () => {
    setError(null);
    try {
      const token = skipAuth ? undefined : await getToken();
      const response = await fetch(`${API_BASE}/api/admin/social/export.csv`, {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : undefined,
      });
      if (!response.ok) {
        throw new Error('CSV export failed');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'social_fb_ig_export.csv';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.message || 'Failed to export CSV');
    }
  };

  const handleExportSelectedCsv = () => {
    if (!selectedIds.length || !posts.length) return;
    const selectedPosts = posts.filter((p) => selectedIds.includes(p.id));
    for (const post of selectedPosts) {
      if (post.fb_type === 'POST' || post.ig_type === 'POST') {
        if (!post.asset_urls?.length) {
          setError(`Post "${post.title}" needs at least one image before export.`);
          return;
        }
      }
      if (post.fb_type === 'REEL' || post.ig_type === 'REEL' || post.ig_type === 'STORY') {
        const meta: any = post.meta || {};
        const hasVideo = meta.video_url || meta.veo_video_url || meta.gif_url;
        if (!hasVideo) {
          setError(`Post "${post.title}" needs a video/GIF before export.`);
          return;
        }
      }
    }
    const headers = posts[0]?.meta?.csvHeaders || pack?.csv.headers || CSV_HEADERS;

    const rows = posts
      .filter((p) => selectedIds.includes(p.id))
      .map((p) =>
        buildCsvRow(p)
          .map((v) => {
            if (typeof v === 'boolean') return v ? 'true' : 'false';
            const str = String(v ?? '');
            return str.includes('"') || str.includes(',') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str;
          })
          .join(',')
      );

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'social_fb_ig_export_selected.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSelectPost = async (post: SocialPost) => {
    setSelectedId(post.id);
    try {
      const token = skipAuth ? undefined : await getToken();
      const response = await apiGet(`/api/admin/social/posts/${post.id}/publish-pack?ts=${Date.now()}`, token);
      setPack(response.data as SocialPublishPack);
      const metaPrompts = (response.data as SocialPublishPack).post.meta?.prompts || [];
      if (metaPrompts.length) setPromptSuggestions(metaPrompts);
    } catch (err: any) {
      setError(err?.message || 'Failed to load publish pack');
    }
  };

  const handleBulkStatus = async (status: SocialStatus) => {
    if (!selectedIds.length) return;
    setActionSaving(true);
    setError(null);
    try {
      const token = skipAuth ? undefined : await getToken();
      await apiPost('/api/admin/social/posts/bulk/status', { ids: selectedIds, status }, token);
      setSelectedIds([]);
      await loadPosts();
    } catch (err: any) {
      setError(err?.message || 'Failed to update status');
    } finally {
      setActionSaving(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    setActionSaving(true);
    setError(null);
    try {
      const token = skipAuth ? undefined : await getToken();
      await apiPost('/api/admin/social/posts/bulk/delete', { ids: selectedIds }, token);
      setSelectedIds([]);
      await loadPosts();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete posts');
    } finally {
      setActionSaving(false);
    }
  };

  const handleGenerateWeek = async () => {
    setGeneratingWeek(true);
    setError(null);
    try {
      const token = skipAuth ? undefined : await getToken();
      await apiPost('/api/admin/social/auto-week', generationContext ? { context: generationContext } : {}, token);
      await loadPosts();
    } catch (err: any) {
      setError(err?.message || 'Failed to generate week');
    } finally {
      setGeneratingWeek(false);
    }
  };

  const handleGenerateOne = async (type: 'POST' | 'STORY' | 'REEL') => {
    setGeneratingWeek(true);
    setError(null);
    try {
      const token = skipAuth ? undefined : await getToken();
      await apiPost(
        '/api/admin/social/auto-one',
        generationContext ? { type, context: generationContext } : { type },
        token
      );
      await loadPosts();
    } catch (err: any) {
      setError(err?.message || `Failed to generate ${type.toLowerCase()}`);
    } finally {
      setGeneratingWeek(false);
    }
  };

  const handleStitchFrames = async (assetUrls?: string[]) => {
    if (!selectedId) return;
    setStitching(true);
    setError(null);
    try {
      const token = skipAuth ? undefined : await getToken();
      await apiPost(
        `/api/admin/social/posts/${selectedId}/stitch`,
        {
          assetUrls: assetUrls && assetUrls.length ? assetUrls : undefined,
          fps: stitchFps,
          includeAudio: stitchIncludeAudio,
        },
        token
      );
      await loadPosts();
      const target = posts.find((p) => p.id === selectedId);
      if (target) await handleSelectPost(target);
    } catch (err: any) {
      setError(err?.message || 'Failed to stitch frames');
    } finally {
      setStitching(false);
      setLibrarySelected(new Set());
    }
  };

  const handleAttachLibraryAsset = async (url: string) => {
    await handleAttachLibraryAssets([url]);
  };

  const handleFetchPrompts = async () => {
    if (!selectedId) return;
    setPromptLoading(true);
    setError(null);
    try {
      const token = skipAuth ? undefined : await getToken();
      const response = await apiPost(`/api/admin/social/posts/${selectedId}/prompts`, {}, token);
      setPromptSuggestions(response.data?.suggestions || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch prompts');
    } finally {
      setPromptLoading(false);
    }
  };

  const handleGenerateImage = async (suggestion: PromptSuggestion) => {
    if (!selectedId) return;
    setImageLoadingId(suggestion.prompt);
    setError(null);
    try {
      const token = skipAuth ? undefined : await getToken();
      await apiPost(
        `/api/admin/social/posts/${selectedId}/generate-image`,
        { prompt: suggestion.prompt, crop: suggestion.crop, alt: suggestion.alt },
        token
      );
      await loadPosts();
      const target = posts.find((p) => p.id === selectedId);
      if (target) {
        await handleSelectPost(target);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to generate image');
    } finally {
      setImageLoadingId(null);
    }
  };

  const handleGenerateAll = async () => {
    if (!selectedId || promptSuggestions.length === 0) return;
    setImageLoadingId('bulk');
    setError(null);
    try {
      const token = skipAuth ? undefined : await getToken();
      await apiPost(
        `/api/admin/social/posts/${selectedId}/generate-images`,
        { suggestions: promptSuggestions },
        token
      );
      await loadPosts();
      const target = posts.find((p) => p.id === selectedId);
      if (target) {
        await handleSelectPost(target);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to generate all assets');
    } finally {
      setImageLoadingId(null);
    }
  };

  const handleGenerateFramesOnly = async (count: number) => {
    if (!selectedId) return;
    setImageLoadingId('frames');
    try {
      const token = skipAuth ? undefined : await getToken();
      await apiPost(`/api/admin/social/posts/${selectedId}/generate-frames`, { count }, token);
      await loadPosts();
      const target = posts.find((p) => p.id === selectedId);
      if (target) await handleSelectPost(target);
    } catch (err: any) {
      setError(err?.message || 'Frame generation failed');
    } finally {
      setImageLoadingId(null);
    }
  };

  const handleFillGaps = async () => {
    if (!selectedId) return;
    if (promptSuggestions.length === 0) {
      await handleFetchPrompts();
    }
    await handleGenerateAll();
    try {
      const token = skipAuth ? undefined : await getToken();
      await apiRequest(
        `/api/admin/social/posts/${selectedId}`,
        { method: 'PATCH', body: JSON.stringify({ status: 'scheduled' }) },
        token
      );
    } catch {
      // ignore
    }
    await loadPosts();
    const target = posts.find((p) => p.id === selectedId);
    if (target) {
      await handleSelectPost(target);
    }
  };

  const handleApplyPromptBank = async () => {
    if (!selectedId || !promptBankKey) return;
    const selected = promptBank.filter((p) => p.key === promptBankKey);
    if (!selected.length) return;
    setPromptSuggestions(selected as PromptSuggestion[]);
    try {
      const token = skipAuth ? undefined : await getToken();
      const existing = posts.find((p) => p.id === selectedId);
      const nextMeta = { ...(existing?.meta || {}), prompts: selected };
      await apiRequest(
        `/api/admin/social/posts/${selectedId}`,
        { method: 'PATCH', body: JSON.stringify({ meta: nextMeta }) },
        token
      );
      await loadPosts();
      if (existing) {
        await handleSelectPost(existing);
      }
    } catch {
      // best effort
    }
  };

  const handleSavePromptsToBank = async () => {
    if (!promptSuggestions.length) return;
    try {
      const token = skipAuth ? undefined : await getToken();
      const prompts = promptSuggestions.map((p, idx) => ({
        key: `${selectedId || 'post'}-${idx}`,
        prompt: p.prompt,
        crop: p.crop,
        alt: p.alt,
      }));
      await apiPost('/api/admin/social/prompt-bank', { prompts }, token);
      await loadPromptBank();
    } catch {
      // best effort
    }
  };

  const handleAttachLibraryAssets = async (urls: string[]) => {
    try {
      const token = skipAuth ? undefined : await getToken();
      if (selectedId) {
        const current = posts.find((p) => p.id === selectedId);
        const nextUrls = [...(current?.asset_urls || [])];
        const nextAlts = [...(current?.asset_alt_texts || [])];
        for (const u of urls) {
          if (nextUrls.length >= 10) break;
          nextUrls.push(u);
          nextAlts.push('');
        }
        await apiRequest(
          `/api/admin/social/posts/${selectedId}`,
          { method: 'PATCH', body: JSON.stringify({ asset_urls: nextUrls, asset_alt_texts: nextAlts }) },
          token
        );
        await loadPosts();
        const target = posts.find((p) => p.id === selectedId);
        if (target) await handleSelectPost(target);
      } else if (formOpen) {
        setFormState((prev) => {
          const next = [...prev.assets];
          urls.forEach((u) => {
            if (next.length < 10) next.push({ url: u, alt: '' });
          });
          return { ...prev, assets: next };
        });
      }
    } catch {
      // ignore
    } finally {
      setLibrarySelected(new Set());
    }
  };

  return (
    <div className="container-max py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-primary-700 dark:text-primary-300 font-semibold uppercase tracking-wide">Admin - Dev Only</p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Social Ops (Next)</h1>
          <p className="text-gray-600 dark:text-gray-400">Modular rebuild of the social dashboard.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="primary" size="sm" onClick={openCreate}>
            New post
          </Button>
          <input
            type="text"
            value={generationContext}
            onChange={(e) => setGenerationContext(e.target.value)}
            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm min-w-[200px]"
            placeholder="Optional context"
          />
          <Button variant="secondary" size="sm" onClick={() => setHelpOpen(true)}>
            How to use
          </Button>
          <Button variant="secondary" size="sm" onClick={loadPosts} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExportCsv} disabled={loading}>
            Export all CSV
          </Button>
          <Button variant="primary" size="sm" onClick={handleExportSelectedCsv} disabled={loading || !selectedIds.length}>
            Export selected
          </Button>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={handleGenerateWeek} disabled={loading || generatingWeek}>
              {generatingWeek ? 'Building week...' : 'Generate next 7 days'}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleGenerateOne('POST')} disabled={loading || generatingWeek}>
              {generatingWeek ? 'Generating...' : 'Generate 1 Post'}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleGenerateOne('STORY')} disabled={loading || generatingWeek}>
              {generatingWeek ? 'Generating...' : 'Generate 1 Story'}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleGenerateOne('REEL')} disabled={loading || generatingWeek}>
              {generatingWeek ? 'Generating...' : 'Generate 1 Reel'}
            </Button>
          </div>
        </div>
      </div>

      <FiltersBar
        needsAssets={needsAssets}
        needsPrompts={needsPrompts}
        onNeedsAssets={setNeedsAssets}
        onNeedsPrompts={setNeedsPrompts}
        onRefresh={loadPosts}
        loading={loading}
        error={error}
      />

      <BulkActionsBar
        selectedCount={selectedIds.length}
        disabled={actionSaving}
        onBulkStatus={handleBulkStatus}
        onBulkDelete={handleBulkDelete}
        hasPromptBank={promptBank.length > 0}
        onApplyPromptBank={promptBank.length ? handleApplyPromptBank : undefined}
      />

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Prompt bank</h2>
          <Button variant="secondary" size="sm" onClick={() => void loadPromptBank()} disabled={loading}>
            Refresh
          </Button>
        </div>
        {promptBank.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">No saved prompts yet.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-auto">
            {promptBank.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 dark:border-gray-700 rounded p-3 bg-gray-50 dark:bg-gray-900/30 space-y-1"
              >
                <p className="text-xs uppercase text-gray-500 dark:text-gray-400">
                  {item.key || 'untagged'} · {item.crop}
                </p>
                <p className="text-sm text-gray-900 dark:text-white break-words">{item.prompt}</p>
                {item.tags?.length ? (
                  <p className="text-xs text-gray-600 dark:text-gray-400">Tags: {item.tags.join(', ')}</p>
                ) : null}
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => navigator.clipboard.writeText(item.prompt)}>
                    Copy
                  </Button>
                  {selectedId ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setPromptBankKey(item.key || item.id);
                        void handleApplyPromptBank();
                      }}
                    >
                      Apply to open post
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SocialTable
        posts={filteredPosts}
        selectedIds={selectedIds}
        sortBy={sortBy}
        sortDir={sortDir}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
        onSort={toggleSort}
        onView={handleSelectPost}
        onEdit={openEdit}
        onDuplicate={openDuplicate}
      />

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
            Prev
          </Button>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Page {page} / {meta.totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            disabled={page >= meta.totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {selectedId && pack && (
        <SocialPostDrawer
          pack={pack}
          promptSuggestions={promptSuggestions}
          promptLoading={promptLoading}
          imageLoadingId={imageLoadingId}
          promptBank={promptBank}
          promptBankKey={promptBankKey}
          onPromptBankKeyChange={setPromptBankKey}
          onApplyPromptBank={handleApplyPromptBank}
          onSavePromptsToBank={handleSavePromptsToBank}
          onFetchPrompts={handleFetchPrompts}
          onGenerateAll={handleGenerateAll}
          onGenerateImage={handleGenerateImage}
          onGenerateFramesOnly={handleGenerateFramesOnly}
          framesCount={framesCount}
          onFramesCountChange={setFramesCount}
          onFillGaps={handleFillGaps}
          stitchFps={stitchFps}
          onChangeStitchFps={(v) => setStitchFps(Number.isFinite(v) ? Math.max(1, Math.min(12, v)) : 4)}
          stitchIncludeAudio={stitchIncludeAudio}
          onToggleIncludeAudio={setStitchIncludeAudio}
          stitching={stitching}
          onStitch={handleStitchFrames}
          onCopyPack={() => navigator.clipboard.writeText(pack.text)}
          onOpenLibrary={() => setLibraryOpen(true)}
        />
      )}

      <AssetLibraryModal
        open={libraryOpen}
        assets={libraryAssets}
        loading={libraryLoading}
        page={libraryPage}
        onPageChange={(p) => setLibraryPage(Math.max(0, p))}
        onSearch={(v) => {
          setLibrarySearch(v);
          setLibraryPage(0);
        }}
        onTypeChange={(v) => {
          setLibraryType(v);
          setLibraryPage(0);
        }}
        type={libraryType}
        onClose={() => {
          setLibraryOpen(false);
          setLibrarySelected(new Set());
        }}
        onReload={loadAssets}
        onAdd={(url) => handleAttachLibraryAsset(url)}
        selected={librarySelected}
        onToggleSelect={(url) =>
          setLibrarySelected((prev) => {
            const next = new Set(prev);
            if (next.has(url)) next.delete(url);
            else next.add(url);
            return next;
          })
        }
        onAttachSelected={() => handleAttachLibraryAssets(Array.from(librarySelected))}
        onStitchSelected={selectedId ? () => handleStitchFrames(Array.from(librarySelected)) : undefined}
        stitchFps={stitchFps}
        onChangeStitchFps={(v) => setStitchFps(Number.isFinite(v) ? Math.max(1, Math.min(12, v)) : 4)}
        includeAudio={stitchIncludeAudio}
        onToggleIncludeAudio={(v) => setStitchIncludeAudio(v)}
      />

      <SocialFormModal
        open={formOpen}
        mode={formMode}
        state={formState}
        templates={templates}
        hashtagSets={hashtagSets}
        saving={saving}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        onChange={setFormState}
        onApplyTemplate={applyTemplate}
        onApplyHashtagSet={applyHashtagSet}
        onAddAsset={handleAddAsset}
        onRemoveAsset={handleRemoveAsset}
        onOpenLibrary={() => setLibraryOpen(true)}
      />

      <HelpPanel open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}











