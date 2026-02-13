import { createPMSClient } from "@/lib/pms";
import { notFound } from "next/navigation";
import { PropertyHub } from "@/components/properties/property-hub";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;
  const pms = createPMSClient();

  let property;
  try {
    property = await pms.getListing(id);
  } catch {
    notFound();
  }

  const today = new Date();
  const endDate90 = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

  const [calendar, reservations, rules, expenses, statements] =
    await Promise.all([
      pms.getCalendar(property.id, today, endDate90),
      pms.getReservations({ listingMapId: property.id }),
      pms.getSeasonalRules(property.id),
      pms.getExpenses(property.id),
      pms.getOwnerStatements(property.id),
    ]);

  return (
    <PropertyHub
      property={property}
      calendar={calendar}
      reservations={reservations}
      rules={rules}
      expenses={expenses}
      statements={statements}
    />
  );
}
