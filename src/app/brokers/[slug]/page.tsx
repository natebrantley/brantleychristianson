import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/Button';
import { agents, getAgentBySlug } from '@/data/agents';
import { assetPaths } from '@/config/theme';
import { SITE_NAME, absoluteUrl } from '@/config/site';
import type { Agent } from '@/data/types';
import type { Metadata } from 'next';

interface BrokerPageProps {
  params: { slug: string };
}

function getNativeLanguageCta(agent: Agent) {
  const nonEnglish = agent.languages.filter(
    (lang) => lang.toLowerCase() !== 'english'
  );
  if (nonEnglish.length === 0) return null;

  const primary = nonEnglish[0].toLowerCase();

  switch (primary) {
    case 'mandarin':
      return {
        label: '用中文联系我',
        description: '我可以用中文（普通话）为您提供买卖房产服务。',
      };
    case 'cantonese':
      return {
        label: '以粵語聯絡我',
        description: '我可以以粵語為您提供買賣房產服務。',
      };
    default:
      return null;
  }
}

export function generateStaticParams() {
  return agents.map((agent) => ({ slug: agent.slug }));
}

export async function generateMetadata({ params }: BrokerPageProps): Promise<Metadata> {
  const agent = getAgentBySlug(params.slug);
  if (!agent) {
    return { title: `Broker | ${SITE_NAME}` };
  }
  const title = `${agent.name} | Real Estate Broker`;
  const description = `${agent.name}, ${agent.title} at ${SITE_NAME}. Licensed in ${agent.licenses.join(' and ')}. Connect for buying or selling in Oregon and Washington.`;
  const url = `/brokers/${agent.slug}`;
  const imageUrl = absoluteUrl(agent.image);
  const images = [{ url: imageUrl, width: 600, height: 800, alt: `${agent.name}, ${agent.title}` }];
  return {
    title,
    description,
    openGraph: { url, title, description, images },
    twitter: { card: 'summary_large_image', title, description, images: [imageUrl] },
  };
}

export default function BrokerProfilePage({ params }: BrokerPageProps) {
  const agent = getAgentBySlug(params.slug);

  if (!agent) {
    notFound();
  }

  const languageCta = getNativeLanguageCta(agent);

  return (
    <main>
      <div className="broker-hero-image">
        <Image
          src={`${assetPaths.stock}/couch.jpeg`}
          alt=""
          fill
          className="broker-hero-image__img"
          priority
          sizes="100vw"
        />
      </div>

      <section className="section broker-detail-section" aria-labelledby="broker-name-heading">
        <div className="container container-narrow stack--lg">
          <header className="stack--sm text-center">
            <h1 id="broker-name-heading" className="broker-detail-name">
              {agent.name}
            </h1>
            <p className="broker-detail-title">{agent.title}</p>
          </header>

          <article className="stack--lg">
            <div className="stack--md text-center">
              <div
                style={{
                  display: 'inline-block',
                  borderRadius: 'var(--radius-lg)',
                  border: '2px solid rgba(var(--color-accent-rgb), 0.25)',
                  overflow: 'hidden',
                }}
              >
                <Image
                  src={agent.image}
                  alt={agent.name}
                  width={280}
                  height={360}
                  sizes="280px"
                  style={{ display: 'block', objectFit: 'cover' }}
                />
              </div>
              <p className="broker-detail-meta">
                <span className="broker-detail-meta-line">
                  <strong>Licenses:</strong> {agent.licenses.join(' · ')}
                </span>
                {agent.languages.length > 0 && (
                  <span className="broker-detail-meta-line">
                    <strong>Languages:</strong> {agent.languages.join(', ')}
                  </span>
                )}
              </p>
            </div>

            <div className="broker-detail-actions">
              <Button href={`mailto:${agent.email}`} variant="primary">
                Email {agent.name}
              </Button>
              {agent.phone && (
                <Button
                  href={`tel:${agent.phone.replace(/\D/g, '')}`}
                  variant="outline"
                >
                  Call {agent.phone}
                </Button>
              )}
            </div>

            {languageCta && (
              <div className="broker-detail-language-cta">
                <p className="broker-detail-language-cta-text">
                  {languageCta.description}
                </p>
                <Button href={`mailto:${agent.email}`} variant="outline">
                  {languageCta.label}
                </Button>
              </div>
            )}
          </article>
        </div>
      </section>
    </main>
  );
}

