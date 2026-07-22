import type { TherapistAccountStatus } from '../../types/api';
import { RowActionMenu } from '../ui/RowActionMenu';

export function TherapistActionMenu({
  status,
  disabled = false,
  onApprove,
  onReject,
  onDeactivate,
}: {
  status: TherapistAccountStatus;
  disabled?: boolean;
  onApprove: () => void;
  onReject: () => void;
  onDeactivate: () => void;
}) {
  if (status === 'VERIFIED') {
    return (
      <RowActionMenu
        disabled={disabled}
        items={[{ label: 'Deactivate', onSelect: onDeactivate, danger: true }]}
      />
    );
  }

  if (status === 'REJECTED') {
    return (
      <RowActionMenu
        disabled={disabled}
        items={[{ label: 'Approve', onSelect: onApprove }]}
      />
    );
  }

  return (
    <RowActionMenu
      disabled={disabled}
      items={[
        { label: 'Approve', onSelect: onApprove },
        { label: 'Reject', onSelect: onReject, danger: true },
      ]}
    />
  );
}
