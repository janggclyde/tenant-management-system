import DashboardShell from '@/components/DashboardShell';

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell role="tenant">{children}</DashboardShell>;
}
