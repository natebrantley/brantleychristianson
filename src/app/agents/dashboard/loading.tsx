export default function AgentsDashboardSegmentLoading() {
  return (
    <main
      className="dashboard-page agent-dashboard section loading-shell"
      aria-busy="true"
      aria-label="Loading agent dashboard"
    >
      <div className="container stack--lg loading-shell__inner">
        <div className="agent-welcome">
          <div className="agent-welcome__bg" aria-hidden />
          <div className="agent-welcome__inner">
            <div className="agent-welcome__content">
              <div className="skeleton skeleton--pill" style={{ width: '7rem', marginBottom: '0.5rem' }} />
              <div className="skeleton skeleton--title" style={{ width: '12rem', maxWidth: '100%', height: '2rem', marginBottom: '0.5rem' }} />
              <div className="skeleton skeleton--text" style={{ width: '18rem', maxWidth: '100%' }} />
            </div>
            <div className="skeleton skeleton--pill" style={{ width: '5rem', height: '1.75rem' }} />
          </div>
        </div>
        <section className="dashboard-section">
          <div className="agent-stats">
            {[1, 2, 3].map((i) => (
              <div key={i} className="agent-stat">
                <div className="skeleton" style={{ width: '3rem', height: '2.25rem', marginBottom: '0.5rem', marginInline: 'auto' }} />
                <div className="skeleton skeleton--text" style={{ width: '80%', height: '0.875rem', marginInline: 'auto' }} />
              </div>
            ))}
          </div>
        </section>
        <section className="dashboard-section">
          <div className="skeleton skeleton--title" style={{ width: '14rem', maxWidth: '100%', height: '1.5rem', marginBottom: '0.5rem' }} />
          <div className="skeleton skeleton--text" style={{ width: '100%', marginBottom: '1rem' }} />
          <div className="agent-leads-list" style={{ opacity: 0.6 }}>
            {[1, 2, 3].map((i) => (
              <li key={i} className="agent-lead-card">
                <div className="agent-lead-card__link" style={{ pointerEvents: 'none' }}>
                  <div className="agent-lead-card__row">
                    <div className="skeleton" style={{ width: '8rem', height: '1.125rem' }} />
                    <div className="skeleton" style={{ width: '5rem', height: '0.875rem' }} />
                  </div>
                  <div className="skeleton skeleton--text" style={{ width: '60%', height: '0.875rem', marginTop: '0.35rem' }} />
                  <div className="skeleton skeleton--text" style={{ width: '40%', height: '0.8125rem', marginTop: '0.5rem' }} />
                </div>
              </li>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
