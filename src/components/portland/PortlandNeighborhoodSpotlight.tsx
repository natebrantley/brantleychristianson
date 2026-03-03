import { portlandTrendingNeighborhoods } from '@/data/portland-market';

export function PortlandNeighborhoodSpotlight() {
  return (
    <section
      className="portland-neighborhoods"
      aria-labelledby="portland-neighborhoods-heading"
    >
      <div className="container">
        <div className="portland-neighborhoods__header">
          <h2
            id="portland-neighborhoods-heading"
            className="portland-neighborhoods__title"
          >
            Hottest Portland neighborhoods
          </h2>
          <span
            className="portland-neighborhoods__badge"
            aria-hidden
          >
            Trending 🔥
          </span>
        </div>
        <ul className="portland-neighborhoods__list" role="list">
          {portlandTrendingNeighborhoods.map((area) => (
            <li key={area.zip} className="portland-neighborhoods__pill-wrap">
              <span className="portland-neighborhoods__pill">
                <span className="portland-neighborhoods__pill-name">
                  {area.name}
                </span>
                <span className="portland-neighborhoods__pill-zip">
                  {area.zip}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
