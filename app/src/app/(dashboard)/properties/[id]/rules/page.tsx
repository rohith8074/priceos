import { createPMSClient } from "@/lib/pms";
import { notFound } from "next/navigation";
import { SeasonalRulesTable } from "@/components/properties/seasonal-rules-table";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PropertyRulesPage({ params }: Props) {
  const { id } = await params;
  const pms = createPMSClient();

  let property;
  try {
    property = await pms.getListing(id);
  } catch {
    notFound();
  }

  const rules = await pms.getSeasonalRules(id);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link href="/properties" className="hover:underline">Properties</Link>
          <span>/</span>
          <Link href={`/properties/${property.id}`} className="hover:underline">{property.name}</Link>
          <span>/</span>
          <span>Pricing Rules</span>
        </div>
        <h1 className="text-2xl font-bold">Pricing Rules</h1>
        <p className="text-sm text-muted-foreground">{property.name} — {property.area}</p>
      </div>

      <SeasonalRulesTable rules={rules} listingId={property.id} />
    </div>
  );
}
