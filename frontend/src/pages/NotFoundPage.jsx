import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="foundation-page">
      <p className="eyebrow">404</p>
      <h1>Route not found</h1>
      <p>This placeholder confirms React Router is handling unknown routes.</p>
      <Link className="text-link" to="/">
        Back to React foundation
      </Link>
    </section>
  );
}
