import { HeaderNav } from "@/components/layout/header-nav";
import { AgentCacheProvider } from "@/lib/cache/agent-cache-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <HeaderNav />
      <AgentCacheProvider>
        <main className="flex-1 overflow-hidden">{children}</main>
      </AgentCacheProvider>
    </div>
  );
}
