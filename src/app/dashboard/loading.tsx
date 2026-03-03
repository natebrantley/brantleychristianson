export default function DashboardLoading() {
  return (
    <main
      className="section loading-shell"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      <div className="container stack--lg loading-shell__inner">
        <header className="stack--sm">
          <div className="skeleton skeleton--pill" />
          <div className="skeleton skeleton--title" />
          <div className="skeleton skeleton--text" />
          <div className="skeleton skeleton--text" style={{ width: 'min(28rem, 100%)' }} />
        </header>
        <section className="stack--md">
          <div className="skeleton skeleton--card" />
        </section>
      </div>
    </main>
  );
}
