import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogIn, LogOut } from "lucide-react";
import type { Reservation, Listing } from "@/types/hostaway";

interface TodayActivityProps {
  checkIns: Reservation[];
  checkOuts: Reservation[];
  properties: Listing[];
}

function getPropertyName(
  listingMapId: number,
  properties: Listing[]
): string {
  return properties.find((p) => p.id === listingMapId)?.name ?? `#${listingMapId}`;
}

export function TodayActivity({
  checkIns,
  checkOuts,
  properties,
}: TodayActivityProps) {
  const hasActivity = checkIns.length > 0 || checkOuts.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Today&apos;s Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasActivity ? (
          <p className="text-sm text-muted-foreground">
            No check-ins or check-outs today
          </p>
        ) : (
          <div className="space-y-3">
            {checkIns.map((res) => (
              <div
                key={`in-${res.id}`}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-green-100 p-1.5 dark:bg-green-900">
                    <LogIn className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{res.guestName}</p>
                    <p className="text-xs text-muted-foreground">
                      {getPropertyName(res.listingMapId, properties)}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="border-green-500/30 text-green-700 dark:text-green-400">
                  Check-in
                </Badge>
              </div>
            ))}
            {checkOuts.map((res) => (
              <div
                key={`out-${res.id}`}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-orange-100 p-1.5 dark:bg-orange-900">
                    <LogOut className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{res.guestName}</p>
                    <p className="text-xs text-muted-foreground">
                      {getPropertyName(res.listingMapId, properties)}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="border-orange-500/30 text-orange-700 dark:text-orange-400">
                  Check-out
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
