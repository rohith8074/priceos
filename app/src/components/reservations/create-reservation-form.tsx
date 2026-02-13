"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import type { Listing } from "@/types/hostaway";

interface CreateReservationFormProps {
  properties: Listing[];
}

export function CreateReservationForm({ properties }: CreateReservationFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [listingMapId, setListingMapId] = useState<string>("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [channelName] = useState<"Direct">("Direct");

  const selectedProperty = properties.find((p) => p.id === Number(listingMapId));

  // Calculate nights and total
  const nights =
    arrivalDate && departureDate
      ? Math.max(
          0,
          Math.ceil(
            (new Date(departureDate).getTime() - new Date(arrivalDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 0;
  const totalPrice = nights * (selectedProperty?.price ?? 0);

  const canSubmit =
    listingMapId && guestName && arrivalDate && departureDate && nights > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingMapId: Number(listingMapId),
          guestName,
          guestEmail: guestEmail || undefined,
          arrivalDate,
          departureDate,
          nights,
          totalPrice,
          channelName,
          status: "confirmed",
          checkInTime: "15:00",
          checkOutTime: "11:00",
        }),
      });
      if (res.ok) {
        setOpen(false);
        setGuestName("");
        setGuestEmail("");
        setArrivalDate("");
        setDepartureDate("");
        setListingMapId("");
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          New Booking
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create Direct Booking</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label>Property</Label>
            <Select value={listingMapId} onValueChange={setListingMapId}>
              <SelectTrigger>
                <SelectValue placeholder="Select property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="guestName">Guest Name</Label>
            <Input
              id="guestName"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Guest full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guestEmail">Guest Email</Label>
            <Input
              id="guestEmail"
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              placeholder="guest@example.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="arrival">Check-in</Label>
              <Input
                id="arrival"
                type="date"
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="departure">Check-out</Label>
              <Input
                id="departure"
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
              />
            </div>
          </div>

          {nights > 0 && selectedProperty && (
            <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Nights</span>
                <span className="font-medium">{nights}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Rate</span>
                <span className="font-medium">
                  {selectedProperty.price.toLocaleString("en-US")} AED/night
                </span>
              </div>
              <div className="flex justify-between text-sm pt-1 border-t">
                <span className="font-medium">Total</span>
                <span className="font-semibold">
                  {totalPrice.toLocaleString("en-US")} AED
                </span>
              </div>
            </div>
          )}

          <div className="rounded-lg border bg-green-50 dark:bg-green-950 p-3">
            <p className="text-sm font-medium text-green-700 dark:text-green-300">
              Channel: Direct Booking
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={saving || !canSubmit}
            className="w-full"
          >
            {saving ? "Creating..." : "Create Booking"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
