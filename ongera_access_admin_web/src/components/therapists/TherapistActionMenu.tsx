import { RowActionMenu } from '../ui/RowActionMenu';

export function TherapistActionMenu({
  verified,
  disabled = false,
  onVerify,
  onReject,
  onDeactivate,
}: {
  verified: boolean;
  disabled?: boolean;
  onVerify: () => void;
  onReject: () => void;
  onDeactivate: () => void;
}) {
  return (
    <RowActionMenu
      disabled={disabled}
      items={
        verified
          ? [{ label: 'Deactivate', onSelect: onDeactivate, danger: true }]
          : [
              { label: 'Verify', onSelect: onVerify },
              { label: 'Reject', onSelect: onReject, danger: true },
            ]
      }
    />
  );
}
