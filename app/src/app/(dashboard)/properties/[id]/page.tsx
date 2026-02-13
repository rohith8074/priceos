import { createPMSClient } from "@/lib/pms";
import { runRevenueCycle } from "@/lib/agents";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Bed, Bath, MapPin } from "lucide-react";
import { PropertyAskAI } from "./ask-ai";
import { ListingEditForm } from "@/components/properties/listing-edit-form";
import { mapCycleToProposals } from "@/types/proposal";

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

  // Get next 7 days calendar
  const today = new Date();
  const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const miniCalendar = await pms.getCalendar(property.id, today, weekFromNow);

  // Get recent proposals via revenue cycle
  const cycle = await runRevenueCycle([property.id], {
    start: today,
    end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  const recentProposals = mapCycleToProposals(cycle).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{property.name}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {property.area}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/properties/${property.id}/rules`}>
            <Button variant="outline" size="sm">Pricing Rules</Button>
          </Link>
          <ListingEditForm property={property} />
          <PropertyAskAI property={property} />
        </div>
      </div>

      {/* Property Details */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Type</p>
            <p className="text-lg font-semibold">{property.propertyType}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Bed className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">
                {property.bedroomsNumber === 0 ? "Studio" : property.bedroomsNumber}
              </span>
            </div>
            <Separator orientation="vertical" className="h-5" />
            <div className="flex items-center gap-1.5">
              <Bath className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{property.bathroomsNumber}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Base Price</p>
            <p className="text-lg font-semibold">{property.price} AED</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Price Range</p>
            <p className="text-lg font-semibold">
              {property.priceFloor}-{property.priceCeiling} AED
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Amenities */}
      {property.amenities && property.amenities.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium">Amenities</h3>
          <div className="flex flex-wrap gap-2">
            {property.amenities.map((amenity) => (
              <Badge key={amenity} variant="secondary">
                {amenity}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Mini Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Next 7 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {miniCalendar.map((day) => (
              <div
                key={day.date}
                className={`rounded-lg border p-2 text-center text-xs ${
                  day.status === "booked"
                    ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
                    : day.status === "blocked"
                      ? "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
                      : "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
                }`}
              >
                <p className="font-medium">
                  {new Date(day.date + "T00:00:00").toLocaleDateString("en", {
                    weekday: "short",
                  })}
                </p>
                <p className="text-muted-foreground">
                  {new Date(day.date + "T00:00:00").getDate()}
                </p>
                {day.status === "available" && (
                  <p className="mt-1 font-medium">{day.price}</p>
                )}
                {day.status === "booked" && (
                  <p className="mt-1 text-red-600">Booked</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Proposals */}
      {recentProposals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Proposals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentProposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{proposal.date}</p>
                    <p className="text-xs text-muted-foreground">
                      {proposal.currentPrice} → {proposal.proposedPrice} AED
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        proposal.riskLevel === "low"
                          ? "border-green-500/30 text-green-700"
                          : proposal.riskLevel === "high"
                            ? "border-red-500/30 text-red-700"
                            : "border-amber-500/30 text-amber-700"
                      }
                    >
                      {proposal.riskLevel}
                    </Badge>
                    <Badge
                      variant={
                        proposal.status === "approved"
                          ? "default"
                          : proposal.status === "rejected"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {proposal.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
