import { PromptSuggestion, SocialPublishPack } from '../../types/social';
import { FormMode, FormState } from '../../hooks/usePostForm';

export interface PromptBankItem {
  id: string;
  key: string | null;
  prompt: string;
  crop: string;
  alt?: string | null;
  tags?: string[];
}

export interface TemplateLite {
  key: string;
  title: string;
  body?: string;
  default_hashtags?: string[];
}

export interface HashtagSetLite {
  id: string;
  name: string;
  tags?: string[];
}

export interface SocialFormModalProps {
  open: boolean;
  mode: FormMode;
  state: FormState;
  templates: TemplateLite[];
  hashtagSets: HashtagSetLite[];
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  onChange: (state: FormState) => void;
  onApplyTemplate: (key: string) => void;
  onApplyHashtagSet: (id: string) => void;
  onAddAsset: () => void;
  onRemoveAsset: (index: number) => void;
  onOpenLibrary: () => void;
}

export interface SocialPostDrawerProps {
  pack: SocialPublishPack | null;
  promptSuggestions: PromptSuggestion[];
  promptLoading: boolean;
  imageLoadingId: string | null;
  promptBank: PromptBankItem[];
  promptBankKey: string;
  onPromptBankKeyChange: (key: string) => void;
  onApplyPromptBank: () => void;
  onSavePromptsToBank: () => void;
  onFetchPrompts: () => void;
  onGenerateAll: () => void;
  onGenerateImage: (suggestion: PromptSuggestion) => void;
  onGenerateFramesOnly: (count: number) => void;
  framesCount: number;
  onFramesCountChange: (count: number) => void;
  onFillGaps: () => void;
  stitchFps: number;
  onChangeStitchFps: (fps: number) => void;
  stitchIncludeAudio: boolean;
  onToggleIncludeAudio: (val: boolean) => void;
  stitching: boolean;
  onStitch: (assetUrls?: string[]) => void;
  onCopyPack: () => void;
  onOpenLibrary: () => void;
}

export interface AssetsPanelProps {
  urls: string[];
  alts?: string[];
  onOpenLibrary: () => void;
}
