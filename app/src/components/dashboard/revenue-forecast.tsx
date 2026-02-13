"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import type { Reservation } from "@/types/hostaway";

interface RevenueForecastProps {
  reservations: Reservation[];
}

function computeForecast(reservations: Reservation[], days: number) {
  const now = new Date();
  const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const upcomingReservations = reservations.filter((r) => {
    const arrival = new Date(r.arrivalDate);
    return arrival >= now && arrival <= cutoff && r.status !== "cancelled";
  });

  const bookedRevenue = upcomingReservations.reduce(
    (sum, r) => sum + r.totalPrice,
    0
  );
  const bookedNights = upcomingReservations.reduce(
    (sum, r) => sum + r.nights,
    0
  );
  const availableNights = Math.max(0, days - bookedNights);

  return { bookedRevenue, bookedNights, availableNights };
}

const PERIODS = [
  { days: 30, label: "30-Day Forecast" },
  { days: 60, label: "60-Day Forecast" },
  { days: 90, label: "90-Day Forecast" },
] as const;

export function RevenueForecast({ reservations }: RevenueForecastProps) {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Revenue Forecast</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {PERIODS.map(({ days, label }) => {
          const { bookedRevenue, bookedNights, availableNights } =
            computeForecast(reservations, days);

          return (
            <Card key={days}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-2xl font-bold">
                      AED {bookedRevenue.toLocaleString("en-US")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {bookedNights} booked nights + {availableNights} available
                      nights
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted p-2.5">
                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
