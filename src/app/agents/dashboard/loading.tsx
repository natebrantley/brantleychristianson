export default function AgentsDashboardSegmentLoading() {
  return (
    <main
      className="section loading-shell"
      aria-busy="true"
      aria-label="Loading agent dashboard"
    >
      <div className="container stack--lg loading-shell__inner">
        <header className="stack--sm">
          <div className="skeleton skeleton--pill" />
          <div className="skeleton skeleton--title" />
          <div className="skeleton skeleton--text" />
        </header>
        <section className="stack--md">
          <div className="skeleton skeleton--card" />
        </section>
      </div>
    </main>
  );
}
