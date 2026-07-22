import './ListStatCards.css';

export type ListStatItem = {
  id: string;
  label: string;
  value: number | string;
  active?: boolean;
  onSelect?: () => void;
};

export function ListStatCards({
  items,
  label = 'Summary',
}: {
  items: ListStatItem[];
  label?: string;
}) {
  return (
    <section className="list-stats" aria-label={label}>
      {items.map((item) => {
        const className = item.active
          ? 'list-stats__card list-stats__card--active'
          : 'list-stats__card';

        if (item.onSelect) {
          return (
            <button
              key={item.id}
              type="button"
              className={className}
              onClick={item.onSelect}
              aria-pressed={item.active}
            >
              <span className="list-stats__label">{item.label}</span>
              <span className="list-stats__value">{item.value}</span>
            </button>
          );
        }

        return (
          <article key={item.id} className={className}>
            <span className="list-stats__label">{item.label}</span>
            <span className="list-stats__value">{item.value}</span>
          </article>
        );
      })}
    </section>
  );
}
