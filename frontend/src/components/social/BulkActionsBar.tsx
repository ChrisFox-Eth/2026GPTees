import { Button } from '@components/Button';
import { SocialStatus } from '../../types/social';

interface BulkActionsBarProps {
  selectedCount: number;
  disabled?: boolean;
  onBulkStatus: (status: SocialStatus) => void;
  onBulkDelete: () => void;
  onApplyPromptBank?: () => void;
  hasPromptBank?: boolean;
}

export function BulkActionsBar({
  selectedCount,
  disabled,
  onBulkStatus,
  onBulkDelete,
  onApplyPromptBank,
  hasPromptBank,
}: BulkActionsBarProps): JSX.Element {
  if (selectedCount === 0) return <></>;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded p-3">
      <span className="font-semibold text-gray-900 dark:text-white">{selectedCount} selected</span>
      <Button variant="secondary" size="sm" onClick={() => onBulkStatus('draft')} disabled={disabled}>
        Mark draft
      </Button>
      <Button variant="secondary" size="sm" onClick={() => onBulkStatus('scheduled')} disabled={disabled}>
        Mark scheduled
      </Button>
      <Button variant="secondary" size="sm" onClick={() => onBulkStatus('posted')} disabled={disabled}>
        Mark posted
      </Button>
      <Button variant="secondary" size="sm" onClick={() => onBulkStatus('failed')} disabled={disabled}>
        Mark failed
      </Button>
      <Button variant="secondary" size="sm" onClick={onBulkDelete} disabled={disabled}>
        Delete
      </Button>
      {onApplyPromptBank && hasPromptBank ? (
        <Button variant="secondary" size="sm" onClick={onApplyPromptBank} disabled={disabled}>
          Apply prompt bank
        </Button>
      ) : null}
    </div>
  );
}

