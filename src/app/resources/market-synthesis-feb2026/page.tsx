import Link from 'next/link';
import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { assetPaths } from '@/config/theme';
import { SITE_NAME, defaultOgImage } from '@/config/site';
import type { Metadata } from 'next';

const title = 'The Great Recalibration: Pacific Northwest Market Synthesis (February 2026)';
const description =
  'A synthesis of RMLS Market Action Reports for the Pacific Northwest: affordability ceilings, Portland vs. SW Washington divergence, mid-valley stability, and coastal recalibration.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    url: '/resources/market-synthesis-feb2026',
    title: `${title} | ${SITE_NAME}`,
    description,
    images: [defaultOgImage('Pacific Northwest market synthesis – BCRE')],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${title} | ${SITE_NAME}`,
    description,
    images: [defaultOgImage('Pacific Northwest market synthesis – BCRE').url],
  },
};

export default function MarketSynthesisFeb2026Page() {
  return (
    <main>
      <Hero
        title="The Great Recalibration"
        lead="A synthesis of recent RMLS Market Action Reports: the Pacific Northwest real estate ecosystem at an inflection point—affordability ceilings, geographic arbitrage, and where liquidity is returning."
        variant="short"
        imageSrc={`${assetPaths.markets}/AdobeStock_60907024.jpeg`}
        imageAlt="Pacific Northwest landscape"
        priority={false}
      >
        <Button href="/markets" variant="white">
          Explore markets
        </Button>
        <Button href="/contact" variant="outline">
          Talk to a broker
        </Button>
      </Hero>

      <section className="section" aria-labelledby="disclaimer-heading">
        <div className="container container-narrow stack--xl">
          <p id="disclaimer-heading" className="about-lead" style={{ color: 'var(--color-muted)', fontSize: '0.9375rem' }}>
            This is an analyst synthesis of Regional Multiple Listing Service (RMLS) Market Action Report data for February 2026. It is not official RMLS commentary. Data and methodology are from RMLS; interpretation is for general insight. For advice tailored to your situation, connect with a BCRE broker.
          </p>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Report period: February 2026.
          </p>
        </div>
      </section>

      <section className="section section--alt" aria-labelledby="executive-heading">
        <div className="container container-narrow stack--xl">
          <h2 id="executive-heading" className="section-title">
            I. Executive Summary: The End of the Lock-In Epoch
          </h2>
          <div className="about-content stack--lg">
            <p>
              The February 2026 RMLS Market Action Report reveals a Pacific Northwest real estate market at a profound inflection point. The overarching narrative is the decisive thawing of the &quot;rate-lock&quot; effect that defined the mid-2020s. Across primary economic engines, a surge of new listings indicates that sellers are finally capitulating to the new macroeconomic reality, prioritizing life transitions over the preservation of sub-4% mortgages.
            </p>
            <p>
              This influx of liquidity is not lifting all boats equally. The data exposes a highly bifurcated landscape dictated by strict affordability ceilings. Urban cores are seeing high transactional velocity achieved only through price concessions, while tax-advantaged exurbs absorb migrating wealth and drive appreciation. Concurrently, discretionary coastal and rural markets are fracturing into distinct camps of healthy price discovery and severe illiquidity.
            </p>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="affordability-heading">
        <div className="container container-narrow stack--xl">
          <h2 id="affordability-heading" className="section-title">
            II. The Affordability Ceiling: The Mathematical Cap on Appreciation
          </h2>
          <div className="about-content stack--lg">
            <p>
              To understand the pricing dynamics of Q1 2026, one must anchor the analysis in the RMLS Affordability Index. The index assumes a 20% down payment and a stabilized 30-year fixed rate of 6.2%.
            </p>
            <ul style={{ marginLeft: '1.25rem', marginTop: '0.5rem', marginBottom: '1rem' }}>
              <li><strong>Portland Metro:</strong> The index stands at an unforgiving 99%. A family earning the median income ($124,100) has exactly 99% of the qualifying income required to purchase the median-priced home ($535,000).</li>
              <li><strong>Southwest Washington:</strong> The index rests at a slightly more favorable 96%.</li>
              <li><strong>Lane County:</strong> The index drops to a more manageable 89%.</li>
            </ul>
            <p>
              <strong>Strategic insight:</strong> The market is operating at the absolute limit of localized purchasing power. Because median buyers are mathematically maxed out, any increase in supply immediately strips sellers of their pricing leverage. This dynamic establishes a hard cap on near-term asset appreciation in the primary metros, transitioning the market from an equity-growth model to a volume-driven model.
            </p>
          </div>
        </div>
      </section>

      <section className="section section--alt" aria-labelledby="arbitrage-heading">
        <div className="container container-narrow stack--xl">
          <h2 id="arbitrage-heading" className="section-title">
            III. The Core Arbitrage: Portland Metro vs. Southwest Washington
          </h2>
          <div className="about-content stack--lg">
            <p>
              The most critical structural trend in the February data is the stark divergence between the Portland Metropolitan area and its neighbor across the Columbia River, Southwest (SW) Washington (Clark and Cowlitz Counties).
            </p>
            <p>
              <strong>The Portland softening:</strong> Portland Metro saw a robust 17.1% year-over-year (YoY) surge in New Listings (2,260 units) and a 10.5% increase in Pending Sales. Yet, Closed Sales dipped by 1.6% YoY, and the Average Sale Price contracted by 3.7% YoY to $590,600. Sellers are unlocking inventory, but the 99% affordability ceiling forces them to offer price concessions to clear the market.
            </p>
            <p>
              <strong>The SW Washington premium:</strong> SW Washington is aggressively absorbing regional demand. New Listings rocketed 23.5% YoY, Pending Sales surged 17.1%, and Closed Sales jumped 11.0%. Defying the gravity of the Portland core, the Average Sale Price in SW Washington appreciated by 4.4% YoY to $624,200—notably eclipsing Portland&apos;s average.
            </p>
            <p>
              <strong>The development pipeline:</strong> A granular look at &quot;Active Listings Ready for Purchase and Occupancy&quot; confirms this geographic arbitrage. In Portland Metro, 91.7% of active listings are ready for occupancy, meaning only ~8% are pre-sale or under construction. In SW Washington, only 74.9% of active listings are occupancy-ready. Fully 25% of SW Washington&apos;s inventory is under construction or proposed. Builders and capital allocators are heavily over-weighting Clark County, betting that buyers will continue to cross the border to seek relative value, newer housing stock, and Washington&apos;s lack of a state income tax.
            </p>
            <p className="resource-card-meta" style={{ marginTop: '1rem' }}>
              See: <Link href="/markets/washington/clark/vancouver">Vancouver & Clark County</Link>, <Link href="/markets/oregon/multnomah/portland">Portland</Link>.
            </p>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="midvalley-heading">
        <div className="container container-narrow stack--xl">
          <h2 id="midvalley-heading" className="section-title">
            IV. The Citadel of Stability: The Mid-Willamette Valley
          </h2>
          <div className="about-content stack--lg">
            <p>
              Unburdened by the absolute affordability limits of the Portland core, the I-5 corridor south of Portland (Polk, Marion, and Lane Counties) represents the most fundamentally sound demographic absorption in the dataset.
            </p>
            <p>
              <strong>Polk &amp; Marion Counties:</strong> Exhibited textbook stability. New Listings rose 14.9% YoY, met by an 8.5% YoY rise in Pending Sales. This balanced liquidity resulted in a healthy 12.1% YoY surge in Average Sale Price ($476,700), with inventory sitting comfortably at 4.8 months.
            </p>
            <p>
              <strong>Lane County (Eugene):</strong> Remains highly supply-constrained at just 3.4 months of inventory. Pending sales increased 8.0% YoY, supporting a 5.4% YoY increase in Average Sale Price ($484,000) and a swift Total Market Time of 73 days.
            </p>
            <p>
              <strong>Strategic insight:</strong> For risk-averse capital seeking steady yield and predictable absorption rates, the mid-valley markets are currently outperforming the volatile urban cores.
            </p>
            <p className="resource-card-meta" style={{ marginTop: '1rem' }}>
              Explore: <Link href="/markets/oregon">Oregon markets</Link>, <Link href="/markets/oregon/region/willamette-valley">Willamette Valley region</Link>.
            </p>
          </div>
        </div>
      </section>

      <section className="section section--alt" aria-labelledby="coastal-heading">
        <div className="container container-narrow stack--xl">
          <h2 id="coastal-heading" className="section-title">
            V. The Coastal and Rural Recalibration: Price Discovery vs. Liquidity Traps
          </h2>
          <div className="about-content stack--lg">
            <p>
              The post-pandemic hangover in discretionary, second-home, and rural markets is fracturing into two distinct behavioral patterns: those meeting the market, and those trapped by aspirational pricing.
            </p>
            <p>
              <strong>The clearing mechanism (North Coastal Counties):</strong> This region saw an explosion of liquidity, with Closed Sales up 37.0% YoY (100 units). However, this volume was bought at a steep cost: the Average Sale Price fell 5.6% YoY to $540,100. Sellers here have accepted the macroeconomic reality, slashing prices to find the market&apos;s clearing rate and keep inventory manageable (6.0 months).
            </p>
            <p>
              <strong>The liquidity traps (Curry, Mid-Columbia, &amp; Grant):</strong> Conversely, regions where sellers refuse to capitulate are freezing over. Curry County&apos;s inventory has ballooned to a bloated 9.7 months, with Total Market Time stretching to an agonizing 194 days and average prices plummeting 10.7% YoY. Mid-Columbia mirrors this distress, with 9.6 months of inventory, a 36.6% YoY crash in Closed Sales, and 191 days on the market. Most severely, Grant County posted an abysmal 31.0 months of inventory on just 2 closed sales for the entire month.
            </p>
            <p>
              <strong>Strategic insight:</strong> Discretionary real estate is bearing the brunt of high carrying costs. The data forecasts emerging opportunities for distressed or heavily discounted acquisitions in tertiary coastal and rural markets by Q3/Q4 2026 as holding costs break the resolve of stubborn sellers.
            </p>
            <p className="resource-card-meta" style={{ marginTop: '1rem' }}>
              See: <Link href="/resources/oregon-coast-guide">Oregon Coast Guide</Link>, <Link href="/markets/oregon/region/oregon-coast">Oregon Coast region</Link>.
            </p>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="outlook-heading">
        <div className="container container-narrow stack--xl">
          <h2 id="outlook-heading" className="section-title">
            VI. Strategic Outlook &amp; Capital Allocation Directives
          </h2>
          <div className="about-content stack--lg">
            <p>
              For the analyst, the February 2026 RMLS dataset dictates a highly localized, tactical approach to the Pacific Northwest:
            </p>
            <ul style={{ marginLeft: '1.25rem', marginTop: '0.5rem', marginBottom: '1rem' }}>
              <li><strong>Pivot from appreciation to velocity in the core:</strong> In Portland Metro, the ceiling has been reached. Strategies reliant on rapid equity growth will underperform. Capital should be deployed toward models that thrive on transactional velocity—originations, title, and meticulously priced, entry-level renovations that fit under the affordability cap.</li>
              <li><strong>Overweight SW Washington for growth:</strong> The cross-border capital flight is the dominant regional trend. With builders heavily concentrated in Clark County and buyer demand eagerly absorbing the product at higher price points than Portland, this corridor remains the premier growth equity play.</li>
              <li><strong>Underweight rural/discretionary markets:</strong> Exercise extreme caution regarding liquidity risk in Eastern and Southern rural Oregon. With inventories pushing past 9 months and Days on Market routinely exceeding half a year, capital deployed here faces severe duration risk without steep entry discounts.</li>
            </ul>
            <p>
              In summary, the February 2026 market is healing, but the geography of value has been fundamentally redrawn. Liquidity has returned, functioning as a ruthless sorting mechanism—rewarding tax-advantaged exurban growth zones and forcing strict, mathematical price discipline on the urban core.
            </p>
          </div>
        </div>
      </section>

      <section className="section section--cta" aria-label="Get in touch">
        <div className="container text-center stack--md">
          <h2 className="section-title" style={{ marginBottom: '0.5rem' }}>
            Apply this to your situation
          </h2>
          <p className="section-lead mx-auto" style={{ marginBottom: '1.5rem' }}>
            Connect with a BCRE broker who knows Portland, SW Washington, and Pacific Northwest markets.
          </p>
          <Button href="/contact" variant="white">
            Get in touch
          </Button>
        </div>
      </section>
    </main>
  );
}
