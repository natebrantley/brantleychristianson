import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { AssignAgentButton } from '@/components/AssignAgentButton';
import { assetPaths } from '@/config/theme';
import type { Agent } from '@/data/types';

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

export interface AgentProfileProps {
  agent: Agent;
  /** Link back to list (e.g. "/agents") */
  backHref?: string;
  backLabel?: string;
  /** Show prominent "Choose as my agent" CTA for clients */
  assignCtaProminent?: boolean;
}

export function AgentProfile({
  agent,
  backHref,
  backLabel,
  assignCtaProminent = false,
}: AgentProfileProps) {
  const languageCta = getNativeLanguageCta(agent);

  return (
    <main>
      {backHref && backLabel && (
        <div className="container container-narrow" style={{ paddingTop: '1rem' }}>
          <Link href={backHref} className="button button--text" style={{ fontSize: '0.9375rem' }}>
            ← {backLabel}
          </Link>
        </div>
      )}
      <div className="broker-hero-image">
        <Image
          src={`${assetPaths.stock}/couch.jpeg`}
          alt="Living room"
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

            {assignCtaProminent && (
              <div
                className="agent-assign-cta"
                style={{
                  background: 'var(--color-light-alt)',
                  border: '1px solid rgba(var(--color-accent-rgb), 0.2)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem 1.25rem',
                  textAlign: 'center',
                }}
                aria-label="Assign this agent"
              >
                <p style={{ margin: '0 0 0.75rem 0', fontWeight: 600 }}>
                  Want this agent as your main contact?
                </p>
                <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--color-text-muted)' }}>
                  Choose them below to see their info and call button on your dashboard.
                </p>
                <div style={{ marginTop: '1rem' }}>
                  <AssignAgentButton slug={agent.slug} label="Choose as my agent" variant="primary" />
                </div>
              </div>
            )}

            <div
              className="broker-detail-actions"
              style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}
            >
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
              {!assignCtaProminent && (
                <AssignAgentButton slug={agent.slug} label="Choose as my agent" variant="outline" />
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
