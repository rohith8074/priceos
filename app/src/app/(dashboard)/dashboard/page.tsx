import { db, listings } from "@/lib/db";
import { ContextPanel } from "@/components/layout/context-panel";
import { UnifiedChatInterface } from "@/components/chat/unified-chat-interface";
import { SyncStatusSidebar } from "@/components/layout/sync-status-sidebar";

export default async function DashboardPage() {
  // Fetch all properties for the context panel
  const properties = await db.select().from(listings);

  return (
    <div className="flex h-full overflow-hidden">
      <ContextPanel properties={properties} />
      <UnifiedChatInterface properties={properties} />
      <SyncStatusSidebar />
    </div>
  );
}
