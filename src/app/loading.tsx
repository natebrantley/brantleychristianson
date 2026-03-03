export default function RootLoading() {
  return (
    <main
      className="section loading-shell"
      aria-busy="true"
      aria-label="Loading content"
    >
      <div className="container stack--lg loading-shell__inner">
        <header className="stack--sm">
          <p className="section-tag">Loading</p>
          <h1 className="section-title">Preparing your experience…</h1>
          <p className="section-lead">
            We&apos;re loading the latest market insights and dashboards. This usually only takes a moment.
          </p>
        </header>
        <div className="loading-shell__grid" aria-hidden="true">
          <div className="skeleton skeleton--card" />
          <div className="skeleton skeleton--card" />
          <div className="skeleton skeleton--card" />
        </div>
      </div>
    </main>
  );
}

