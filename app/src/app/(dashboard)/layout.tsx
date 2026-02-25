import { HeaderNav } from "@/components/layout/header-nav";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AgentCacheProvider } from "@/lib/cache/agent-cache-provider";
import { InactivityMonitor } from "@/components/auth/inactivity-wrapper";
import { ApprovalGuard } from "@/components/auth/approval-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <InactivityMonitor />
      <ApprovalGuard />
      <HeaderNav />
      <AgentCacheProvider>
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </AgentCacheProvider>
    </div>
  );
}
