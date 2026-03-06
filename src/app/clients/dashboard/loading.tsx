export default function ClientsDashboardSegmentLoading() {
  return (
    <main
      className="dashboard-page client-dashboard section loading-shell"
      aria-busy="true"
      aria-label="Loading client dashboard"
    >
      <div className="container stack--lg client-dashboard__container loading-shell__inner">
        <header className="client-dashboard__welcome">
          <div className="skeleton skeleton--pill" style={{ width: '8rem', marginBottom: '0.5rem' }} />
          <div className="skeleton skeleton--title" style={{ width: '14rem', maxWidth: '100%', height: '2rem', marginBottom: '0.5rem' }} />
          <div className="skeleton skeleton--text" style={{ width: '20rem', maxWidth: '100%', marginBottom: '1rem' }} />
          <div className="client-dashboard__quick-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', justifyContent: 'center' }}>
            <div className="skeleton" style={{ width: '180px', height: '48px', borderRadius: 'var(--radius-md)' }} />
            <div className="skeleton" style={{ width: '140px', height: '48px', borderRadius: 'var(--radius-md)' }} />
            <div className="skeleton" style={{ width: '140px', height: '48px', borderRadius: 'var(--radius-md)' }} />
          </div>
        </header>
        <section className="client-dashboard__team">
          <div className="skeleton skeleton--title" style={{ width: '10rem', height: '1.5rem', marginBottom: '0.5rem' }} />
          <div className="client-dashboard__team-grid" style={{ marginTop: 'var(--space-lg)', gap: 'var(--space-lg)' }}>
            {[1, 2].map((i) => (
              <div key={i} className="skeleton skeleton--card" style={{ minHeight: '180px', maxWidth: '360px', marginInline: 'auto' }} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
