import { useEffect, useMemo, useState } from 'react';
import { apiGet } from '../utils/api';
import { SocialListResponseMeta, SocialPost } from '../types/social';
import { SortKey } from '../components/social/SocialTable';

interface UseSocialDataArgs {
  skipAuth: boolean;
  getToken: () => Promise<string | null>;
  isSignedIn: boolean | undefined;
}

export function useSocialData({ skipAuth, getToken, isSignedIn }: UseSocialDataArgs) {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [meta, setMeta] = useState<SocialListResponseMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [sortBy, setSortBy] = useState<SortKey>('scheduled_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [needsAssets, setNeedsAssets] = useState(false);
  const [needsPrompts, setNeedsPrompts] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const loadPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = skipAuth ? undefined : await getToken();
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sortBy,
        sortDir,
      });
      const response = await apiGet(`/api/admin/social/posts?${params.toString()}`, token);
      setPosts((response.data as SocialPost[]) || []);
      setMeta(response.meta || null);
      setSelectedIds([]);
    } catch (err: any) {
      setError(err?.message || 'Failed to load social posts');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSignedIn || skipAuth) {
      void loadPosts();
    }
  }, [isSignedIn, skipAuth, page, pageSize, sortBy, sortDir]);

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const assetOk = needsAssets ? (p.asset_urls || []).length === 0 : true;
      const promptOk = needsPrompts ? !((p.meta as any)?.prompts || []).length : true;
      return assetOk && promptOk;
    });
  }, [posts, needsAssets, needsPrompts]);

  const toggleSort = (key: SortKey) => {
    setSortBy((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('asc');
      return key;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (!filteredPosts.length) return;
    const currentPageIds = filteredPosts.map((p) => p.id);
    const allSelected = currentPageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !currentPageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentPageIds])));
    }
  };

  return {
    posts,
    meta,
    loading,
    error,
    setError,
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
    setSortBy,
    setSortDir,
    setSelectedIds,
    filteredPosts,
    loadPosts,
    toggleSort,
    toggleSelect,
    toggleSelectAll,
  };
}
