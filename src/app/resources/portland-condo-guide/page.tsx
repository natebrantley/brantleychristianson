import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { PortlandCondoGuideList } from '@/components/PortlandCondoGuideList';
import { RevealSection } from '@/components/RevealSection';
import { assetPaths } from '@/config/theme';
import { portlandCondoGuide } from '@/data/portland-condo-guide';

export const metadata = {
  title: '2026 Portland Condo Guide | Brantley Christianson Real Estate',
  description:
    'BCRE’s 2026 Portland condo guide. Compare buildings by neighborhood, median price, HOA, and more. Pearl District, Downtown, South Waterfront, East Portland.',
};

export default function PortlandCondoGuidePage() {
  return (
    <main>
      <Hero
        title="2026 Portland Condo Guide"
        lead="Data-driven overview of Portland condominium buildings. Filter by neighborhood, sort by price or HOA."
        variant="short"
        imageSrc={`${assetPaths.markets}/pdx.jpeg`}
        imageAlt=""
        priority
      >
        <Button href="/contact" variant="white">
          Request a consultation
        </Button>
      </Hero>

      <section className="section" aria-labelledby="guide-heading">
        <div className="container stack--xl">
          <header className="stack--md text-center mx-auto">
            <p className="section-tag">Resource</p>
            <h2 id="guide-heading" className="section-title">
              Explore Portland condos
            </h2>
            <p className="section-lead mx-auto">
              Median prices, HOA fees, rent caps, amenities, and more. Use filters and sort to find buildings that match your goals.
            </p>
          </header>
          <RevealSection>
            <PortlandCondoGuideList condos={portlandCondoGuide} />
          </RevealSection>
        </div>
      </section>
    </main>
  );
}
