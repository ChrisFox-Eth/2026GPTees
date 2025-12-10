export type SocialPlatform = 'facebook' | 'instagram';
export type SocialStatus = 'draft' | 'scheduled' | 'posted' | 'failed';
export type SocialPostType = 'POST' | 'REEL' | 'STORY';

export interface SocialPublishPack {
  post: SocialPost;
  text: string;
  hashtags: string;
  csv: {
    headers: string[];
    row: (string | boolean)[];
  };
}

export interface SocialPost {
  id: string;
  title: string;
  caption: string;
  hashtags: string[];
  cta?: string | null;
  platforms: SocialPlatform[];
  asset_urls: string[];
  asset_alt_texts: string[];
  status: SocialStatus;
  scheduled_at?: string | null;
  posted_at?: string | null;
  template_key?: string | null;
  first_comment?: string | null;
  fb_type?: SocialPostType | null;
  ig_type?: SocialPostType | null;
  show_reel_on_feed: boolean;
  meta?: Record<string, any>;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialTemplate {
  key: string;
  title: string;
  body: string;
  default_hashtags: string[];
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface HashtagSet {
  id: string;
  name: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface SocialListResponseMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PromptSuggestion {
  prompt: string;
  crop: 'square' | 'portrait' | 'story';
  alt?: string;
  overlay?: string;
}
