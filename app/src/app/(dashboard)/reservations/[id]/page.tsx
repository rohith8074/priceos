import { createPMSClient } from "@/lib/pms";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, CalendarDays, CreditCard, Building2, Clock } from "lucide-react";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

const channelColors: Record<string, string> = {
  Airbnb: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  "Booking.com": "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  Direct: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  Other: "bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-300",
};

export default async function ReservationDetailPage({ params }: Props) {
  const { id } = await params;
  const pms = createPMSClient();

  let reservation;
  try {
    reservation = await pms.getReservation(id);
  } catch {
    notFound();
  }

  let property;
  try {
    property = await pms.getListing(reservation.listingMapId);
  } catch {
    // Property may not exist
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/reservations" className="hover:underline">
              Reservations
            </Link>
            <span>/</span>
            <span>#{reservation.id}</span>
          </div>
          <h1 className="text-2xl font-bold">{reservation.guestName}</h1>
          <div className="mt-1 flex items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${channelColors[reservation.channelName] ?? channelColors.Other}`}
            >
              {reservation.channelName}
            </span>
            <Badge
              variant={
                reservation.status === "confirmed"
                  ? "default"
                  : reservation.status === "cancelled"
                    ? "destructive"
                    : "secondary"
              }
            >
              {reservation.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Property */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Building2 className="h-3.5 w-3.5" />
              Property
            </div>
            {property ? (
              <Link
                href={`/properties/${property.id}`}
                className="font-semibold hover:underline"
              >
                {property.name}
              </Link>
            ) : (
              <p className="font-semibold">#{reservation.listingMapId}</p>
            )}
            {property && (
              <p className="text-xs text-muted-foreground">{property.area}</p>
            )}
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <CalendarDays className="h-3.5 w-3.5" />
              Stay
            </div>
            <p className="font-semibold">
              {reservation.nights} night{reservation.nights !== 1 ? "s" : ""}
            </p>
            <p className="text-xs text-muted-foreground">
              {reservation.arrivalDate} &rarr; {reservation.departureDate}
            </p>
          </CardContent>
        </Card>

        {/* Financials */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <CreditCard className="h-3.5 w-3.5" />
              Total
            </div>
            <p className="font-semibold">
              {reservation.totalPrice.toLocaleString("en-US")} AED
            </p>
            <p className="text-xs text-muted-foreground">
              {reservation.pricePerNight.toLocaleString("en-US")} AED/night
            </p>
          </CardContent>
        </Card>

        {/* Check-in/out */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Clock className="h-3.5 w-3.5" />
              Times
            </div>
            <p className="text-sm">
              Check-in:{" "}
              <span className="font-semibold">
                {reservation.checkInTime ?? "\u2014"}
              </span>
            </p>
            <p className="text-sm">
              Check-out:{" "}
              <span className="font-semibold">
                {reservation.checkOutTime ?? "\u2014"}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Guest Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Guest Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{reservation.guestName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{reservation.guestEmail ?? "\u2014"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
