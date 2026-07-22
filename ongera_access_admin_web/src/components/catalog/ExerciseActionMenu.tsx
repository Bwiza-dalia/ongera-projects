import { RowActionMenu } from '../ui/RowActionMenu';

export function ExerciseActionMenu({ viewHref }: { viewHref: string }) {
  return <RowActionMenu items={[{ label: 'View', to: viewHref }]} />;
}
