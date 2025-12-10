import { Button } from '@components/Button';
import { SocialPost } from '../../types/social';

export type SortKey = 'scheduled_at' | 'updated_at' | 'created_at' | 'title' | 'status';

interface SocialTableProps {
  posts: SocialPost[];
  selectedIds: string[];
  sortBy: SortKey;
  sortDir: 'asc' | 'desc';
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onSort: (key: SortKey) => void;
  onView: (post: SocialPost) => void;
  onEdit: (post: SocialPost) => void;
  onDuplicate: (post: SocialPost) => void;
}

export function SocialTable({
  posts,
  selectedIds,
  sortBy,
  sortDir,
  onToggleSelect,
  onToggleSelectAll,
  onSort,
  onView,
  onEdit,
  onDuplicate,
}: SocialTableProps): JSX.Element {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Posts</h2>
      </div>
      {posts.length === 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No posts yet. Use the importer or create one, then refresh.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left bg-gray-50 dark:bg-gray-900/40">
              <tr>
                <th className="px-3 py-2">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={posts.length > 0 && posts.every((p) => selectedIds.includes(p.id))}
                    onChange={onToggleSelectAll}
                  />
                </th>
                <Sortable th="Title" sortKey="title" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
                <th className="px-3 py-2">Platforms</th>
                <th className="px-3 py-2">FB/IG Type</th>
                <Sortable th="Status" sortKey="status" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
                <th className="px-3 py-2">Assets</th>
                <th className="px-3 py-2">Prompts</th>
                <th className="px-3 py-2">Media</th>
                <Sortable th="Scheduled" sortKey="scheduled_at" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
                <Sortable th="Updated" sortKey="updated_at" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => {
                const needsAssets = (post.asset_urls || []).length === 0;
                const prompts = (post as any).meta?.prompts || [];
                const needsPrompts = prompts.length === 0;
                const meta = (post as any).meta || {};
                const mediaBadges: { label: string; color: string }[] = [];
                if (meta.video_job_id && !meta.video_url) {
                  mediaBadges.push({ label: 'Sora pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' });
                }
                if (meta.veo_task_id && !meta.veo_video_url && !meta.video_url) {
                  mediaBadges.push({ label: 'Veo pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' });
                }
                if (meta.stitch_status === 'pending') {
                  mediaBadges.push({ label: 'Stitching...', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' });
                }
                if (meta.stitch_status === 'failed') {
                  mediaBadges.push({ label: 'Stitch failed', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' });
                }
                if (meta.video_url) {
                  mediaBadges.push({ label: meta.video_source === 'dalle-frames' ? 'Stitched video' : 'Video ready', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' });
                }
                if (meta.veo_video_url) {
                  mediaBadges.push({ label: 'Veo video', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' });
                }
                if (meta.gif_url) {
                  mediaBadges.push({ label: 'GIF ready', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' });
                }
                if (meta.suno_status === 'complete' || meta.suno_audio_url || meta.suno_source_audio_url) {
                  mediaBadges.push({ label: 'Audio ready', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200' });
                } else if (meta.suno_task_id) {
                  mediaBadges.push({ label: 'Audio pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' });
                }
                return (
                  <tr key={post.id} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        aria-label={`Select ${post.title}`}
                        checked={selectedIds.includes(post.id)}
                        onChange={() => onToggleSelect(post.id)}
                      />
                    </td>
                  <td className="px-3 py-2 font-semibold text-gray-900 dark:text-white">{post.title}</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{post.platforms.join(', ') || '--'}</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300 text-xs">
                    <div>FB: {post.fb_type || 'POST'}</div>
                    <div>IG: {post.ig_type || 'POST'}</div>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        post.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                            : post.status === 'scheduled'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                        }`}
                      >
                        {post.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          needsAssets
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                        }`}
                      >
                        {(post.asset_urls || []).length} assets
                      </span>
                    </td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        needsPrompts
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                      }`}
                    >
                      {needsPrompts ? 'Missing' : 'Ready'}
                    </span>
                  </td>
                  <td className="px-3 py-2 space-x-1">
                    {mediaBadges.length === 0 ? (
                      <span className="text-xs text-gray-500 dark:text-gray-400">None</span>
                    ) : (
                      mediaBadges.map((b) => (
                        <span key={b.label} className={`px-2 py-1 rounded text-xs ${b.color}`}>
                          {b.label}
                        </span>
                      ))
                    )}
                  </td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                    {post.scheduled_at ? new Date(post.scheduled_at).toLocaleString() : '--'}
                  </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                      {new Date(post.updated_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 space-x-2">
                      <Button variant="secondary" size="sm" onClick={() => onView(post)}>
                        View
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => onEdit(post)}>
                        Edit
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => onDuplicate(post)}>
                        Duplicate
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface SortableProps {
  th: string;
  sortKey: SortKey;
  sortBy: SortKey;
  sortDir: 'asc' | 'desc';
  onSort: (k: SortKey) => void;
}

function Sortable({ th, sortKey, sortBy, sortDir, onSort }: SortableProps) {
  return (
    <th className="px-3 py-2 cursor-pointer" onClick={() => onSort(sortKey)}>
      {th} {sortBy === sortKey ? (sortDir === 'asc' ? '(asc)' : '(desc)') : ''}
    </th>
  );
}

