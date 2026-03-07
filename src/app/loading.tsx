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
          <h1 className="section-title">Loading…</h1>
          <p className="section-lead">
            Fetching the latest data. This usually takes a moment.
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

