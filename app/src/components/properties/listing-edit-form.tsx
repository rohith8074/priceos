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
import { Pencil } from "lucide-react";
import type { Listing } from "@/types/hostaway";

interface ListingEditFormProps {
  property: Listing;
}

export function ListingEditForm({ property }: ListingEditFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(property.name);
  const [bedroomsNumber, setBedroomsNumber] = useState(property.bedroomsNumber);
  const [bathroomsNumber, setBathroomsNumber] = useState(property.bathroomsNumber);
  const [personCapacity, setPersonCapacity] = useState(property.personCapacity ?? 2);
  const [price, setPrice] = useState(property.price);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/listings/${property.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          bedroomsNumber,
          bathroomsNumber,
          personCapacity,
          price,
        }),
      });
      if (res.ok) {
        setOpen(false);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Listing</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>



          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Input
                id="bedrooms"
                type="number"
                min={0}
                value={bedroomsNumber}
                onChange={(e) => setBedroomsNumber(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Input
                id="bathrooms"
                type="number"
                min={1}
                value={bathroomsNumber}
                onChange={(e) => setBathroomsNumber(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">Max Guests</Label>
            <Input
              id="capacity"
              type="number"
              min={1}
              value={personCapacity}
              onChange={(e) => setPersonCapacity(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Base Price (AED/night)</Label>
            <Input
              id="price"
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
          </div>



          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
