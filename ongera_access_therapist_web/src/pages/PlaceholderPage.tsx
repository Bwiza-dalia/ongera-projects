import './PlaceholderPage.css';

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="placeholder-page">
      <h1>{title}</h1>
      <p>Not built yet.</p>
    </div>
  );
}
