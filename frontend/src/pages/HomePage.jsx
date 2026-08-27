import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <section className="foundation-page">
      <p className="eyebrow">DoRentMe React migration</p>
      <h1>Frontend foundation is ready</h1>
      <p>
        This Vite + React app is the starting point for incremental page migration.
        The legacy static site remains unchanged at the repository root.
      </p>
      <Link className="text-link" to="/missing-route">
        Test not-found route
      </Link>
    </section>
  );
}
