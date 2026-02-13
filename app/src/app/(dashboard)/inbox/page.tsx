export const dynamic = "force-dynamic";

import { createPMSClient } from "@/lib/pms";
import { InboxContent } from "./inbox-content";

export default async function InboxPage() {
  const pms = createPMSClient();

  const [conversations, properties, templates] = await Promise.all([
    pms.getConversations(),
    pms.listListings(),
    pms.getMessageTemplates(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inbox</h1>
        <p className="text-sm text-muted-foreground">
          {conversations.length} conversation
          {conversations.length !== 1 ? "s" : ""}
        </p>
      </div>

      <InboxContent
        conversations={conversations}
        properties={properties}
        templates={templates}
      />
    </div>
  );
}
