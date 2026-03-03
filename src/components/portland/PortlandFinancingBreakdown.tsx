import { portlandFinancing } from '@/data/portland-market';

const R = 42;
const CIRCUMFERENCE = 2 * Math.PI * R;

export function PortlandFinancingBreakdown() {
  const total = portlandFinancing.reduce((s, i) => s + i.pct, 0);
  let offset = 0;

  return (
    <section
      className="portland-financing"
      aria-labelledby="portland-financing-heading"
    >
      <div className="container container-narrow">
        <h2 id="portland-financing-heading" className="portland-financing__title">
          How Portland is buying
        </h2>
        <p className="portland-financing__fact">
          <strong>Fact:</strong> 1 in 4 Portland homes are bought with pure cash
          right now.
        </p>
        <div className="portland-financing__donut-wrap">
          <svg
            className="portland-financing__donut"
            viewBox="0 0 100 100"
            role="img"
            aria-label="Financing breakdown: 61% Conventional, 24% All-Cash, 9% FHA, 6% Other"
          >
            {portlandFinancing.map((item) => {
              const segmentLength = total ? (item.pct / total) * CIRCUMFERENCE : 0;
              const dashArray = `${segmentLength} ${CIRCUMFERENCE - segmentLength}`;
              const dashOffset = -offset;
              offset += segmentLength;
              return (
                <circle
                  key={item.label}
                  className={`portland-financing__segment ${
                    'highlight' in item && item.highlight ? 'portland-financing__segment--highlight' : ''
                  }`}
                  cx="50"
                  cy="50"
                  r={R}
                  fill="none"
                  strokeWidth="12"
                  strokeDasharray={dashArray}
                  strokeDashoffset={dashOffset}
                  transform="rotate(-90 50 50)"
                />
              );
            })}
          </svg>
          <div className="portland-financing__center" aria-hidden>
            <span className="portland-financing__center-value">24%</span>
            <span className="portland-financing__center-label">All-Cash</span>
          </div>
        </div>
        <ul className="portland-financing__legend" role="list">
          {portlandFinancing.map((item) => (
            <li
              key={item.label}
              className={
                'highlight' in item && item.highlight
                  ? 'portland-financing__legend-item portland-financing__legend-item--highlight'
                  : 'portland-financing__legend-item'
              }
            >
              <span
                className="portland-financing__legend-dot"
                style={
                  {
                    '--legend-color': 'highlight' in item && item.highlight
                      ? 'var(--color-accent)'
                      : 'var(--color-muted)',
                  } as React.CSSProperties
                }
                aria-hidden
              />
              <span className="portland-financing__legend-label">
                {item.label}
              </span>
              <span className="portland-financing__legend-pct">{item.pct}%</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
