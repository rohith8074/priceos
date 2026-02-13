import { createPMSClient } from "@/lib/pms";
import { ReservationTable } from "@/components/reservations/reservation-table";

export default async function ReservationsPage() {
  const pms = createPMSClient();

  const [allProperties, allReservations] = await Promise.all([
    pms.listListings(),
    pms.getReservations(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reservations</h1>
        <p className="text-sm text-muted-foreground">
          {allReservations.length} bookings across {allProperties.length} properties
        </p>
      </div>

      <ReservationTable reservations={allReservations} properties={allProperties} />
    </div>
  );
}
