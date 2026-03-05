import { notFound } from 'next/navigation';
import { AgentProfile } from '@/components/AgentProfile';
import { agents, getAgentBySlug } from '@/data/agents';
import { SITE_NAME, absoluteUrl } from '@/config/site';
import type { Metadata } from 'next';

interface AgentPageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return agents.map((agent) => ({ slug: agent.slug }));
}

export async function generateMetadata({ params }: AgentPageProps): Promise<Metadata> {
  const agent = getAgentBySlug(params.slug);
  if (!agent) {
    return { title: `Agent | ${SITE_NAME}` };
  }
  const title = `${agent.name} | Real Estate Agent`;
  const description = `${agent.name}, ${agent.title} at ${SITE_NAME}. Licensed in ${agent.licenses.join(' and ')}. Connect for buying or selling in Oregon and Washington.`;
  const url = `/agents/${agent.slug}`;
  const imageUrl = absoluteUrl(agent.image);
  const images = [{ url: imageUrl, width: 600, height: 800, alt: `${agent.name}, ${agent.title}` }];
  return {
    title,
    description,
    openGraph: { url, title, description, images },
    twitter: { card: 'summary_large_image', title, description, images: [imageUrl] },
  };
}

export default function AgentProfilePage({ params }: AgentPageProps) {
  const agent = getAgentBySlug(params.slug);

  if (!agent) {
    notFound();
  }

  return (
    <AgentProfile
      agent={agent}
      backHref="/agents"
      backLabel="Back to agents"
      assignCtaProminent
    />
  );
}
