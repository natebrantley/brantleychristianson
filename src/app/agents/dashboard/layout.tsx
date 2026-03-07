import { AgentDashboardNav } from './AgentDashboardNav';

export default function AgentsDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AgentDashboardNav />
      {children}
    </>
  );
}
