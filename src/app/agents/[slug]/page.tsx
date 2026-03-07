import { notFound } from 'next/navigation';
import { AgentProfile } from '@/components/AgentProfile';
import { agents, getAgentBySlug } from '@/data/agents';
import { SITE_NAME, SITE_URL, absoluteUrl } from '@/config/site';
import type { Metadata } from 'next';

interface AgentPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return agents.map((agent) => ({ slug: agent.slug }));
}

export async function generateMetadata({ params }: AgentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const agent = getAgentBySlug(slug);
  if (!agent) {
    return { title: `Agent | ${SITE_NAME}` };
  }
  const title = `${agent.name} | Real Estate Agent`;
  const description = `${agent.name}, ${agent.title} at ${SITE_NAME}. Licensed in ${agent.licenses.join(' and ')}. Connect for buying or selling in Oregon and Washington.`;
  const path = `/agents/${agent.slug}`;
  const canonical = `${SITE_URL}${path}`;
  const imageUrl = absoluteUrl(agent.image);
  const images = [{ url: imageUrl, width: 600, height: 800, alt: `${agent.name}, ${agent.title}` }];
  const socialTitle = `${title} | ${SITE_NAME}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'profile',
      url: canonical,
      siteName: SITE_NAME,
      title: socialTitle,
      description,
      images,
    },
    twitter: { card: 'summary_large_image', title: socialTitle, description, images: [imageUrl] },
  };
}

export default async function AgentProfilePage({ params }: AgentPageProps) {
  const { slug } = await params;
  const agent = getAgentBySlug(slug);
  if (!agent) notFound();

  return (
    <AgentProfile
      agent={agent}
      backHref="/agents"
      backLabel="Back to agents"
      assignCtaProminent
    />
  );
}
