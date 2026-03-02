import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/Button';
import { agents, getAgentBySlug } from '@/data/agents';
import type { Agent } from '@/data/types';

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

export default function BrokerProfilePage({ params }: BrokerPageProps) {
  const agent = getAgentBySlug(params.slug);

  if (!agent) {
    notFound();
  }

  const languageCta = getNativeLanguageCta(agent);

  return (
    <main>
      <section className="section" aria-labelledby="broker-heading">
        <div className="container container-narrow stack--lg">
          <header className="stack--sm text-center">
            <p className="section-tag">Broker</p>
            <h1 id="broker-heading" className="section-title">
              {agent.name}
            </h1>
            <p className="section-lead">{agent.title}</p>
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

