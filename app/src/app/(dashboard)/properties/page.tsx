export const dynamic = "force-dynamic";

import { createPMSClient } from "@/lib/pms";
import { PropertyList } from "@/components/properties/property-list";

export default async function PropertiesPage() {
  const pms = createPMSClient();
  const allProperties = await pms.listListings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Properties</h1>
        <p className="text-sm text-muted-foreground">
          Manage your {allProperties.length} Dubai properties
        </p>
      </div>

      <PropertyList properties={allProperties} detailed />
    </div>
  );
}
