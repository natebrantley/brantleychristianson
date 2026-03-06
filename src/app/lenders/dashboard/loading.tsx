export default function LendersDashboardSegmentLoading() {
  return (
    <main
      className="dashboard-page lender-dashboard section loading-shell"
      aria-busy="true"
      aria-label="Loading lender dashboard"
    >
      <div className="container stack--lg lender-dashboard__container loading-shell__inner">
        <header className="lender-dashboard__welcome">
          <div className="skeleton skeleton--pill" style={{ width: '8rem', marginBottom: '0.5rem' }} />
          <div className="skeleton skeleton--title" style={{ width: '14rem', maxWidth: '100%', height: '2rem', marginBottom: '0.5rem' }} />
          <div className="skeleton skeleton--text" style={{ width: '20rem', maxWidth: '100%', marginBottom: '1rem' }} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', justifyContent: 'center' }}>
            <div className="skeleton" style={{ width: '140px', height: '48px', borderRadius: 'var(--radius-md)' }} />
            <div className="skeleton" style={{ width: '160px', height: '48px', borderRadius: 'var(--radius-md)' }} />
          </div>
        </header>
        <section className="lender-dashboard__leads">
          <div className="skeleton skeleton--title" style={{ width: '12rem', height: '1.5rem', marginBottom: '0.5rem' }} />
          <div className="skeleton skeleton--text" style={{ width: '100%', marginBottom: '1rem' }} />
          <div className="card lender-dashboard__list-card" style={{ opacity: 0.7 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="lender-dashboard__list-item" style={{ padding: 'var(--space-md) var(--space-lg)' }}>
                <div className="skeleton" style={{ width: '10rem', height: '1rem' }} />
                <div className="skeleton" style={{ width: '5rem', height: '0.875rem' }} />
              </div>
            ))}
          </div>
        </section>
        <section className="lender-dashboard__team">
          <div className="skeleton skeleton--title" style={{ width: '10rem', height: '1.25rem', marginBottom: '0.5rem' }} />
          <div className="lender-dashboard__team-grid" style={{ marginTop: 'var(--space-lg)' }}>
            {[1, 2].map((i) => (
              <div key={i} className="skeleton skeleton--card" style={{ minHeight: '160px' }} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
